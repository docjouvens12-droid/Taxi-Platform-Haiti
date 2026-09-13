'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Summary = {
  id: string
  pickup_address: string | null
  destination_address: string | null
  estimated_distance_km: number | null
  estimated_duration_min: number | null
  final_fare_htg: number | null
  completed_at: string | null
}

const dismissedKey = (driverId: string, rideId: string) => `taxi-driver-dismissed-summary:${driverId}:${rideId}`

export default function DriverCompletedRideSummary() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [lang, setLang] = useState<'fr' | 'ht'>('fr')

  useEffect(() => {
    if (window.location.pathname !== '/driver/dashboard') return
    setLang(localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr')

    let active = true
    let driverId: string | null = null
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function loadLatest(showOnlyRecent = false) {
      const { data: auth } = await supabase.auth.getUser()
      if (!active || !auth.user) return
      driverId = auth.user.id

      const { data } = await supabase
        .from('rides')
        .select('id,pickup_address,destination_address,estimated_distance_km,estimated_duration_min,final_fare_htg,completed_at')
        .eq('driver_id', auth.user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!active || !data?.id) return
      if (localStorage.getItem(dismissedKey(auth.user.id, data.id)) === '1') return

      if (showOnlyRecent && data.completed_at) {
        const age = Date.now() - new Date(data.completed_at).getTime()
        if (age > 10 * 60 * 1000) return
      }

      setSummary(data as Summary)
    }

    async function start() {
      const { data: auth } = await supabase.auth.getUser()
      if (!active || !auth.user) return
      driverId = auth.user.id

      await loadLatest(true)

      channel = supabase
        .channel(`driver-completed-summary-${auth.user.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `driver_id=eq.${auth.user.id}`,
        }, (payload) => {
          if ((payload.new as any)?.status === 'completed') {
            window.setTimeout(() => void loadLatest(false), 250)
          }
        })
        .subscribe()
    }

    void start()

    const languageTimer = window.setInterval(() => {
      setLang(localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr')
    }, 800)

    return () => {
      active = false
      window.clearInterval(languageTimer)
      if (channel) void supabase.removeChannel(channel)
    }
  }, [])

  if (!summary) return null

  const isHt = lang === 'ht'
  const fare = summary.final_fare_htg == null ? '—' : `${Math.round(Number(summary.final_fare_htg)).toLocaleString('fr-HT')} HTG`
  const distance = summary.estimated_distance_km == null ? '—' : `${Number(summary.estimated_distance_km).toFixed(1)} km`
  const duration = summary.estimated_duration_min == null ? '—' : `${summary.estimated_duration_min} min`
  const time = summary.completed_at
    ? new Intl.DateTimeFormat(isHt ? 'fr-HT' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(summary.completed_at))
    : '—'

  async function closeSummary() {
    const { data: auth } = await supabase.auth.getUser()
    if (auth.user && summary) localStorage.setItem(dismissedKey(auth.user.id, summary.id), '1')
    window.location.assign('https://taxi-platform-haiti.vercel.app/driver/dashboard')
  }

  return <div className="driver-summary-backdrop" role="dialog" aria-modal="true">
    <section className="driver-summary-card">
      <div className="driver-summary-check">✓</div>
      <h2>{isHt ? 'Trajè fini' : 'Trajet terminé'}</h2>
      <p className="driver-summary-sub">{isHt ? 'Men rezime trajè ou sot konplete a.' : 'Voici le résumé du trajet que vous venez de terminer.'}</p>

      <div className="driver-summary-route">
        <div><span>📍</span><p><small>{isHt ? 'Depa' : 'Prise en charge'}</small><strong>{summary.pickup_address || '—'}</strong></p></div>
        <div><span>🏁</span><p><small>{isHt ? 'Destinasyon' : 'Destination'}</small><strong>{summary.destination_address || '—'}</strong></p></div>
      </div>

      <div className="driver-summary-metrics">
        <div><small>{isHt ? 'Pri final' : 'Prix final'}</small><strong>{fare}</strong></div>
        <div><small>{isHt ? 'Distans' : 'Distance'}</small><strong>{distance}</strong></div>
        <div><small>{isHt ? 'Dire' : 'Durée'}</small><strong>{duration}</strong></div>
        <div><small>{isHt ? 'Fini a' : 'Terminé à'}</small><strong>{time}</strong></div>
      </div>

      <button type="button" onClick={() => void closeSummary()}>{isHt ? 'Retounen sou dashboard' : 'Retour au tableau de bord'}</button>
    </section>

    <style jsx>{`
      .driver-summary-backdrop{position:fixed;inset:0;z-index:35000;background:rgba(10,22,34,.52);display:grid;place-items:center;padding:20px}
      .driver-summary-card{width:min(100%,430px);background:#fff;border-radius:24px;padding:22px;box-shadow:0 26px 70px rgba(10,22,34,.28);color:#102033;text-align:center}
      .driver-summary-check{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;margin:0 auto 10px;background:#e8f6f1;color:#0f8067;font-size:29px;font-weight:900}
      h2{margin:0;font-size:23px}.driver-summary-sub{margin:6px 0 17px;color:#718193;font-size:13px}
      .driver-summary-route{display:grid;gap:8px;text-align:left;margin-bottom:12px}.driver-summary-route>div{display:flex;gap:10px;align-items:flex-start;background:#f7faf9;border:1px solid #e7efec;border-radius:14px;padding:10px 11px}.driver-summary-route span{font-size:19px}.driver-summary-route p{margin:0;min-width:0}.driver-summary-route small,.driver-summary-route strong{display:block}.driver-summary-route small{font-size:10px;color:#7a8998}.driver-summary-route strong{font-size:13px;margin-top:2px}
      .driver-summary-metrics{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0 16px}.driver-summary-metrics>div{background:#f3f7f8;border-radius:14px;padding:11px 8px}.driver-summary-metrics small,.driver-summary-metrics strong{display:block}.driver-summary-metrics small{font-size:10px;color:#7a8998}.driver-summary-metrics strong{font-size:14px;margin-top:3px}
      button{width:100%;min-height:48px;border:0;border-radius:15px;background:#0f6f59;color:#fff;font-size:14px;font-weight:900}
    `}</style>
  </div>
}
