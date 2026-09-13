'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Ride = {
  id: string
  pickup_address: string
  destination_address: string
  estimated_distance_km: number | null
  estimated_duration_min: number | null
  estimated_fare_htg: number | null
  service_type: string | null
}

export default function DriverOpenRideOffers() {
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [busyRideId, setBusyRideId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [vehicleId, setVehicleId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const [{ data, error }, { data: auth }] = await Promise.all([
        supabase.rpc('get_driver_open_ride_offers'),
        supabase.auth.getUser(),
      ])
      if (cancelled) return
      if (!error) setRides((data ?? []) as Ride[])

      if (auth.user) {
        const { data: vehicle } = await supabase
          .from('vehicles')
          .select('id')
          .eq('driver_id', auth.user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()
        if (!cancelled) setVehicleId(vehicle?.id ?? null)
      }
      setLoading(false)
    }

    void load()
    const interval = window.setInterval(() => void load(), 5000)
    const channel = supabase
      .channel('driver-open-ride-offers-panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, () => void load())
      .subscribe()

    return () => {
      cancelled = true
      window.clearInterval(interval)
      void supabase.removeChannel(channel)
    }
  }, [])

  async function acceptRide(ride: Ride) {
    if (busyRideId || !vehicleId) {
      if (!vehicleId) setMessage('Aucun véhicule actif trouvé pour ce chauffeur.')
      return
    }
    setBusyRideId(ride.id)
    setMessage('')
    const { error } = await supabase.rpc('accept_ride', {
      p_ride_id: ride.id,
      p_vehicle_id: vehicleId,
    })
    if (error) {
      setMessage(error.message)
      setBusyRideId(null)
      return
    }
    setMessage('Trajet accepté.')
    setRides((current) => current.filter((item) => item.id !== ride.id))
    window.setTimeout(() => window.location.reload(), 350)
  }

  if (loading || rides.length === 0) return null

  return (
    <section className="offersPanel" aria-label="Demandes disponibles">
      <div className="offersHead">
        <strong>Demandes disponibles</strong>
        <span>{rides.length}</span>
      </div>
      {message && <div className="offerMessage">{message}</div>}
      <div className="offersList">
        {rides.map((ride) => {
          const service = ride.service_type === 'moto' ? 'Moto' : ride.service_type === 'comfort' ? 'Comfort' : 'Standard'
          return (
            <article className="offerCard" key={ride.id}>
              <div><small>Prise en charge</small><b>{ride.pickup_address}</b></div>
              <div><small>Destination</small><b>{ride.destination_address}</b></div>
              <div className="offerMetrics">
                <span>{ride.estimated_distance_km != null ? `${Number(ride.estimated_distance_km).toFixed(1)} km` : '—'}</span>
                <span>{ride.estimated_duration_min != null ? `${ride.estimated_duration_min} min` : '—'}</span>
                <span>{ride.estimated_fare_htg != null ? `${Math.round(Number(ride.estimated_fare_htg))} HTG` : '—'}</span>
                <span>{service}</span>
              </div>
              <button
                type="button"
                className="acceptButton"
                disabled={Boolean(busyRideId) || !vehicleId}
                onClick={() => void acceptRide(ride)}
              >
                {busyRideId === ride.id ? 'Acceptation…' : 'Accepter la course'}
              </button>
            </article>
          )
        })}
      </div>
      <style jsx>{`
        .offersPanel{width:min(calc(100% - 32px),716px);margin:14px auto 0;background:#fff;border:2px solid #0f6f59;border-radius:22px;padding:16px;box-shadow:0 12px 34px rgba(15,111,89,.12);font-family:Inter,system-ui,sans-serif;color:#102033;position:relative;z-index:5}
        .offersHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.offersHead strong{font-size:20px}.offersHead span{min-width:30px;height:30px;border-radius:999px;background:#e7f5f0;color:#0f6f59;display:grid;place-items:center;font-weight:900}
        .offerMessage{margin-bottom:12px;padding:10px 12px;border-radius:12px;background:#eef7f4;color:#115f4d;font-size:13px;font-weight:800}
        .offersList{display:grid;gap:12px}.offerCard{border:1px solid #dfe7e4;border-radius:16px;padding:14px;background:#f8fbfa;display:grid;gap:9px}.offerCard small,.offerCard b{display:block}.offerCard small{color:#718294;font-size:11px}.offerCard b{margin-top:2px}.offerMetrics{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.offerMetrics span{background:#fff;border-radius:10px;padding:8px;text-align:center;font-size:12px;font-weight:850;color:#0f6f59}
        .acceptButton{width:100%;border:0;border-radius:12px;background:#0f6f59;color:#fff;padding:12px 14px;font-size:14px;font-weight:900;box-shadow:0 8px 18px rgba(15,111,89,.18)}.acceptButton:disabled{opacity:.55;box-shadow:none}
        @media(max-width:600px){.offersPanel{width:calc(100% - 24px);margin-top:10px}.offerMetrics{grid-template-columns:1fr 1fr}.acceptButton{padding:14px;font-size:15px}}
      `}</style>
    </section>
  )
}
