'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

type Notice = { title: string; body: string; icon: string }

const passengerCopy: Record<string, Notice> = {
  accepted: { icon: '🚕', title: 'Chauffeur trouvé', body: 'Votre chauffeur a accepté le trajet.' },
  driver_arriving: { icon: '📍', title: 'Chauffeur en approche', body: 'Votre chauffeur arrive au point de prise en charge.' },
  in_progress: { icon: '🛣️', title: 'Trajet commencé', body: 'Votre trajet est maintenant en cours.' },
  completed: { icon: '✅', title: 'Trajet terminé', body: 'Vous êtes arrivé à destination.' },
  cancelled: { icon: '✕', title: 'Trajet annulé', body: 'Ce trajet a été annulé.' },
}

export default function RideRealtimeNotifications() {
  const [notice, setNotice] = useState<Notice | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    let mounted = true
    let passengerChannel: ReturnType<typeof supabase.channel> | null = null
    let driverChannel: ReturnType<typeof supabase.channel> | null = null
    let audioContext: AudioContext | null = null

    function show(next: Notice) {
      if (!mounted) return
      setNotice(next)
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setNotice(null), 6500)
    }

    function ensureAudio() {
      try {
        if (!audioContext) {
          const Ctx = window.AudioContext || (window as any).webkitAudioContext
          if (Ctx) audioContext = new Ctx()
        }
        if (audioContext?.state === 'suspended') void audioContext.resume()
      } catch {}
    }

    function playDriverAlert() {
      try {
        if ('vibrate' in navigator) navigator.vibrate?.([180, 90, 180])
      } catch {}

      try {
        ensureAudio()
        if (!audioContext || audioContext.state !== 'running') return
        const now = audioContext.currentTime
        ;[0, 0.22].forEach((offset) => {
          const oscillator = audioContext!.createOscillator()
          const gain = audioContext!.createGain()
          oscillator.type = 'sine'
          oscillator.frequency.setValueAtTime(880, now + offset)
          gain.gain.setValueAtTime(0.0001, now + offset)
          gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.015)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.14)
          oscillator.connect(gain)
          gain.connect(audioContext!.destination)
          oscillator.start(now + offset)
          oscillator.stop(now + offset + 0.16)
        })
      } catch {}
    }

    const unlockAudio = () => ensureAudio()
    document.addEventListener('pointerdown', unlockAudio, { passive: true })
    document.addEventListener('touchstart', unlockAudio, { passive: true })

    async function setup() {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user || !mounted) return

      const isDriverDashboard = window.location.pathname.startsWith('/driver/dashboard')

      if (isDriverDashboard) {
        const { data: currentRide } = await supabase
          .from('rides')
          .select('id,status')
          .eq('driver_id', user.id)
          .eq('status', 'in_progress')
          .order('requested_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (currentRide?.id) {
          window.location.replace('/driver/navigation')
          return
        }

        driverChannel = supabase
          .channel(`driver-live-${user.id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rides' }, (payload) => {
            const row = payload.new as any
            if (row?.status !== 'requested' || row?.passenger_id === user.id) return
            const lang = localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'
            playDriverAlert()
            show({
              icon: '🔔',
              title: lang === 'ht' ? 'Nouvo komand' : 'Nouvelle demande',
              body: `${row.pickup_address ?? (lang === 'ht' ? 'Kote pou pran pasaje a' : 'Prise en charge')} → ${row.destination_address ?? 'Destination'}`,
            })
            window.setTimeout(() => window.location.reload(), 900)
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `driver_id=eq.${user.id}` }, (payload) => {
            const row = payload.new as any
            if (row?.status === 'in_progress') window.location.replace('/driver/navigation')
          })
          .subscribe()
        return
      }

      passengerChannel = supabase
        .channel(`passenger-ride-notifications-${user.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `passenger_id=eq.${user.id}`,
        }, (payload) => {
          const row = payload.new as any
          const previous = payload.old as any
          if (!row?.status || row.status === previous?.status) return
          const next = passengerCopy[row.status]
          if (next) show(next)
        })
        .subscribe()
    }

    void setup()

    return () => {
      mounted = false
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      document.removeEventListener('pointerdown', unlockAudio)
      document.removeEventListener('touchstart', unlockAudio)
      if (passengerChannel) void supabase.removeChannel(passengerChannel)
      if (driverChannel) void supabase.removeChannel(driverChannel)
      if (audioContext) void audioContext.close().catch(() => undefined)
    }
  }, [])

  if (!notice) return null

  return <div role="status" aria-live="polite" style={{
    position: 'fixed', top: 'calc(16px + env(safe-area-inset-top))', left: '50%', transform: 'translateX(-50%)',
    zIndex: 10050, width: 'min(calc(100% - 28px), 430px)', background: '#102033', color: '#fff',
    borderRadius: 18, padding: '14px 16px', boxShadow: '0 18px 48px rgba(16,32,51,.28)', display: 'flex',
    gap: 12, alignItems: 'center', border: '1px solid rgba(255,255,255,.16)'
  }}>
    <span style={{ fontSize: 28, lineHeight: 1 }}>{notice.icon}</span>
    <div style={{ minWidth: 0 }}><strong style={{ display: 'block', fontSize: 16 }}>{notice.title}</strong><span style={{ display: 'block', opacity: .86, fontSize: 14, marginTop: 2 }}>{notice.body}</span></div>
    <button onClick={() => setNotice(null)} aria-label="Fermer" style={{ marginLeft: 'auto', border: 0, background: 'transparent', color: '#fff', fontSize: 22, cursor: 'pointer' }}>×</button>
  </div>
}
