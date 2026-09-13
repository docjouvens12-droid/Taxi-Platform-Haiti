'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

type PendingRide = {
  id: string
  pickup_address: string
  destination_address: string
  requested_at: string
}

export default function PassengerPendingRideCancel() {
  const pathname = usePathname()
  const isPassengerPage = pathname === '/' || pathname === '/passenger/dashboard'
  const [ride, setRide] = useState<PendingRide | null>(null)
  const [busy, setBusy] = useState(false)
  const [lang, setLang] = useState<'fr' | 'ht'>('fr')

  useEffect(() => {
    if (!isPassengerPage) return
    const saved = window.localStorage.getItem('taxi-language')
    if (saved === 'fr' || saved === 'ht') setLang(saved)

    let active = true
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function load() {
      const { data: auth } = await supabase.auth.getUser()
      if (!active || !auth.user) { setRide(null); return }
      const { data } = await supabase
        .from('rides')
        .select('id,pickup_address,destination_address,requested_at')
        .eq('passenger_id', auth.user.id)
        .eq('status', 'requested')
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (active) setRide((data ?? null) as PendingRide | null)
    }

    async function connectRealtime() {
      const { data: auth } = await supabase.auth.getUser()
      if (!active || !auth.user) return
      channel = supabase
        .channel(`passenger-pending-${auth.user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rides', filter: `passenger_id=eq.${auth.user.id}` },
          () => {
            void load()
            window.dispatchEvent(new Event('taxi-ride-status-changed'))
          },
        )
        .subscribe()
    }

    void load()
    void connectRealtime()
    const timer = window.setInterval(() => void load(), 8000)
    const languageTimer = window.setInterval(() => {
      const next = window.localStorage.getItem('taxi-language')
      if (next === 'fr' || next === 'ht') setLang(next)
    }, 700)

    return () => {
      active = false
      window.clearInterval(timer)
      window.clearInterval(languageTimer)
      if (channel) void supabase.removeChannel(channel)
    }
  }, [isPassengerPage])

  async function cancelRide() {
    if (!ride || busy) return
    const ok = window.confirm(lang === 'ht' ? 'Ou vle anile kous sa a?' : 'Voulez-vous annuler cette course ?')
    if (!ok) return
    setBusy(true)
    const reason = lang === 'ht' ? 'Anile pa pasaje a' : 'Annulé par le passager'
    const { error } = await supabase.rpc('cancel_ride', { p_ride_id: ride.id, p_reason: reason })
    setBusy(false)
    if (error) {
      window.alert(error.message)
      return
    }
    setRide(null)
    window.dispatchEvent(new Event('taxi-ride-cancelled'))
    window.dispatchEvent(new Event('taxi-ride-status-changed'))
  }

  if (!isPassengerPage || !ride) return null

  return <aside className="pending-ride-card" aria-live="polite">
    <div className="pending-status-row">
      <span className="pending-spinner" aria-hidden="true" />
      <div className="pending-copy">
        <strong>{lang === 'ht' ? 'N ap chèche yon chofè pou ou…' : 'Nous cherchons un chauffeur pour vous…'}</strong>
        <small>{ride.destination_address}</small>
      </div>
    </div>
    <div className="pending-live-note">{lang === 'ht' ? 'Estati trajè a ap mete ajou otomatikman.' : 'Le statut du trajet se met à jour automatiquement.'}</div>
    <button className="cancel-button" onClick={() => void cancelRide()} disabled={busy}>
      {busy ? (lang === 'ht' ? 'N ap anile…' : 'Annulation…') : (lang === 'ht' ? 'Anile kous la' : 'Annuler la course')}
    </button>
    <style jsx>{`
      .pending-ride-card{position:fixed;left:50%;bottom:max(14px,calc(env(safe-area-inset-bottom) + 8px));transform:translateX(-50%);z-index:2147483000;width:min(calc(100vw - 24px),440px);display:grid;gap:10px;background:rgba(255,255,255,.98);border:1px solid #dce9e4;border-radius:22px;padding:14px;box-shadow:0 18px 50px rgba(16,32,51,.22);font-family:Inter,system-ui,sans-serif;color:#102033;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.pending-status-row{display:grid;grid-template-columns:38px minmax(0,1fr);gap:10px;align-items:center}.pending-spinner{width:32px;height:32px;border:3px solid #dfece7;border-top-color:#0f705a;border-radius:50%;animation:pendingSpin .9s linear infinite}.pending-copy{min-width:0}.pending-copy strong,.pending-copy small{display:block}.pending-copy strong{font-size:14px}.pending-copy small{margin-top:4px;color:#71808e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px}.pending-live-note{padding:8px 10px;border-radius:11px;background:#f2f8f5;color:#587069;font-size:9px;font-weight:750}.cancel-button{width:100%;min-height:48px;border:1px solid #f0c9c9;border-radius:14px;background:#fff7f7;color:#a93434;font-weight:900;font-size:13px;padding:12px 16px;cursor:pointer;touch-action:manipulation}.cancel-button:disabled{opacity:.6}@keyframes pendingSpin{to{transform:rotate(360deg)}}@media(max-width:520px){.pending-ride-card{width:calc(100vw - 20px);padding:12px}.pending-copy strong{font-size:13px}.cancel-button{min-height:50px;font-size:13px}}
    `}</style>
  </aside>
}
