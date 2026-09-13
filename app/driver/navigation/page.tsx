'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DriverMobileNavigationMap from '../../../components/DriverMobileNavigationMap'

type RideStatus = 'accepted' | 'driver_arriving' | 'in_progress'

type Ride = {
  id: string
  status: RideStatus
  pickup_address: string
  destination_address: string
  pickup_latitude: number | null
  pickup_longitude: number | null
  destination_latitude: number | null
  destination_longitude: number | null
  estimated_distance_km: number | null
  estimated_duration_min: number | null
  estimated_fare_htg: number | null
}

export default function DriverNavigationPage() {
  const [ride, setRide] = useState<Ride | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [lang, setLang] = useState<'fr' | 'ht'>('fr')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('taxi-language')
    if (saved === 'ht' || saved === 'fr') setLang(saved)
    void loadRide()
  }, [])

  async function loadRide() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      location.replace('/')
      return
    }

    const { data, error } = await supabase
      .from('rides')
      .select('id,status,pickup_address,destination_address,pickup_latitude,pickup_longitude,destination_latitude,destination_longitude,estimated_distance_km,estimated_duration_min,estimated_fare_htg')
      .eq('driver_id', auth.user.id)
      .in('status', ['accepted', 'driver_arriving', 'in_progress'])
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      window.location.assign('https://taxi-platform-haiti.vercel.app/driver/dashboard?from=navigation')
      return
    }

    setRide(data as Ride)
    setLoading(false)
  }

  async function advanceRide() {
    if (!ride || busy) return
    setBusy(true)
    setMessage('')

    let error: any = null
    if (ride.status === 'accepted') {
      ;({ error } = await supabase.rpc('mark_driver_arriving', { p_ride_id: ride.id }))
    } else if (ride.status === 'driver_arriving') {
      ;({ error } = await supabase.rpc('start_ride', { p_ride_id: ride.id }))
    } else {
      ;({ error } = await supabase.rpc('complete_ride', {
        p_ride_id: ride.id,
        p_final_fare_htg: ride.estimated_fare_htg ?? 0,
        p_payment_method: 'cash',
      }))
    }

    if (error) {
      setMessage(error.message)
      setBusy(false)
      return
    }

    if (ride.status === 'in_progress') {
      window.location.assign('https://taxi-platform-haiti.vercel.app/driver/dashboard?ride=completed')
      return
    }

    await loadRide()
    setBusy(false)
  }

  if (loading || !ride) {
    return <main className="loading"><strong>{lang === 'fr' ? 'Ouverture du GPS…' : 'GPS ap louvri…'}</strong><style jsx>{`.loading{min-height:100vh;display:grid;place-items:center;background:#eef3f6;font-family:Inter,system-ui,sans-serif;color:#102033}`}</style></main>
  }

  const actionLabel = ride.status === 'accepted'
    ? (lang === 'fr' ? 'Je suis arrivé' : 'Mwen rive')
    : ride.status === 'driver_arriving'
      ? (lang === 'fr' ? 'Commencer le trajet' : 'Kòmanse trajè a')
      : (lang === 'fr' ? 'Terminer le trajet' : 'Fini trajè a')

  return <main className="page">
    <section className="shell">
      <div className="mapWrap">
        <DriverMobileNavigationMap ride={ride} lang={lang} />
      </div>

      {message && <div className="message">{message}</div>}

      <button className="actionButton" onClick={() => void advanceRide()} disabled={busy}>
        {busy ? (lang === 'fr' ? 'Mise à jour…' : 'N ap mete ajou…') : actionLabel}
      </button>
    </section>

    <style jsx>{`
      .page{min-height:100vh;background:#eef3f6;padding:12px 12px 104px;font-family:Inter,system-ui,sans-serif;color:#102033;overflow-x:hidden}
      .shell{display:block!important;max-width:760px;margin:0 auto;width:100%;min-width:0;overflow:visible}
      .mapWrap{display:block;width:100%;min-width:0;max-width:100%;overflow:hidden;border-radius:18px}
      .message{display:block;width:100%;box-sizing:border-box;background:#fff1f1;color:#a12626;border-radius:13px;padding:11px 12px;margin-top:10px;font-weight:750;font-size:13px}
      .actionButton{display:block;width:100%;height:auto;box-sizing:border-box;margin-top:12px;border:0;border-radius:15px;padding:15px 16px;background:#0d7b61;color:#fff;font-size:16px;font-weight:900;box-shadow:0 8px 20px rgba(13,123,97,.2)}
      .actionButton:disabled{opacity:.62}
      @media(max-width:600px){
        .page{padding:10px 10px 92px}
        .shell{display:block!important;width:100%;max-width:100%}
        .actionButton{margin-top:10px;border-radius:14px;padding:14px 15px;font-size:15px;position:sticky;bottom:10px;z-index:20}
      }
    `}</style>
  </main>
}
