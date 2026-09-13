'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

type RideRow = {
  ride_id: string
  ride_status: 'accepted' | 'driver_arriving' | 'in_progress' | string
  pickup_address?: string | null
  destination_address?: string | null
  pickup_latitude: number | null
  pickup_longitude: number | null
  destination_latitude: number | null
  destination_longitude: number | null
  driver_name?: string | null
  vehicle_make?: string | null
  vehicle_model?: string | null
  vehicle_color?: string | null
  plate_number?: string | null
  driver_latitude: number | null
  driver_longitude: number | null
  driver_speed_kph?: number | null
}

type AlertKind = 'stopped' | 'deviation'
type Sample = { lat: number; lng: number; at: number }

const STOP_WINDOW_MS = 4 * 60 * 1000
const STOP_RADIUS_METERS = 80
const DEVIATION_METERS = 700

export default function PassengerRideSafetyMonitor() {
  const pathname = usePathname()
  const enabled = pathname === '/' || pathname === '/passenger/dashboard'
  const [ride, setRide] = useState<RideRow | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [lang, setLang] = useState<'fr' | 'ht'>('fr')
  const [alertKind, setAlertKind] = useState<AlertKind | null>(null)
  const [routeCoords, setRouteCoords] = useState<Array<[number, number]>>([])
  const samplesRef = useRef<Sample[]>([])
  const deviationHitsRef = useRef(0)
  const routeRideRef = useRef<string | null>(null)
  const dismissedRef = useRef<Record<string, number>>({})
  const loggedRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    if (!enabled) return
    const saved = window.localStorage.getItem('taxi-language')
    if (saved === 'ht' || saved === 'fr') setLang(saved)

    const languageTimer = window.setInterval(() => {
      const value = window.localStorage.getItem('taxi-language')
      if (value === 'ht' || value === 'fr') setLang(value)
    }, 800)
    return () => window.clearInterval(languageTimer)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    let active = true

    async function recordEvent(row: RideRow, kind: AlertKind, details: Record<string, unknown>) {
      const eventType = kind === 'stopped' ? 'stalled' : 'route_deviation'
      const key = `${row.ride_id}:${eventType}`
      if (loggedRef.current[key]) return

      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id
      if (!uid) return
      if (active) setUserId(uid)

      const { error } = await supabase.from('ride_safety_events').insert({
        ride_id: row.ride_id,
        passenger_id: uid,
        event_type: eventType,
        severity: 'warning',
        details,
      })

      if (!error || error.code === '23505') loggedRef.current[key] = true
    }

    async function buildRoute(row: RideRow) {
      if (routeRideRef.current === row.ride_id && routeCoords.length) return
      if (row.pickup_latitude == null || row.pickup_longitude == null || row.destination_latitude == null || row.destination_longitude == null) return
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      if (!token) return

      try {
        const coords = `${row.pickup_longitude},${row.pickup_latitude};${row.destination_longitude},${row.destination_latitude}`
        const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?overview=full&geometries=geojson&steps=false&access_token=${encodeURIComponent(token)}`)
        const json = await response.json()
        if (!active) return
        const coordinates = json.routes?.[0]?.geometry?.coordinates
        if (Array.isArray(coordinates) && coordinates.length > 1) {
          routeRideRef.current = row.ride_id
          setRouteCoords(coordinates as Array<[number, number]>)
        }
      } catch {
        // Skip route-deviation checks when routing is unavailable.
      }
    }

    function evaluate(row: RideRow) {
      if (row.ride_status !== 'in_progress' || row.driver_latitude == null || row.driver_longitude == null) {
        samplesRef.current = []
        deviationHitsRef.current = 0
        setAlertKind(null)
        return
      }

      const now = Date.now()
      const sample = { lat: row.driver_latitude, lng: row.driver_longitude, at: now }
      const recent = [...samplesRef.current, sample].filter((item) => now - item.at <= STOP_WINDOW_MS + 30_000)
      samplesRef.current = recent

      const dismissalKeyStopped = `${row.ride_id}:stopped`
      const dismissalKeyDeviation = `${row.ride_id}:deviation`
      const stoppedDismissedRecently = now - (dismissedRef.current[dismissalKeyStopped] || 0) < 8 * 60 * 1000
      const deviationDismissedRecently = now - (dismissedRef.current[dismissalKeyDeviation] || 0) < 8 * 60 * 1000

      const oldest = recent[0]
      if (oldest && now - oldest.at >= STOP_WINDOW_MS) {
        const moved = haversineMeters(oldest.lat, oldest.lng, sample.lat, sample.lng)
        const speed = Number(row.driver_speed_kph ?? 0)
        if (moved < STOP_RADIUS_METERS && speed < 3 && !stoppedDismissedRecently) {
          setAlertKind('stopped')
          void recordEvent(row, 'stopped', {
            moved_meters: Math.round(moved),
            speed_kph: speed,
            observation_seconds: Math.round((now - oldest.at) / 1000),
            driver_latitude: sample.lat,
            driver_longitude: sample.lng,
          })
          return
        }
      }

      if (routeCoords.length > 1) {
        const distance = distanceToRouteMeters(sample.lat, sample.lng, routeCoords)
        if (distance > DEVIATION_METERS) deviationHitsRef.current += 1
        else deviationHitsRef.current = 0

        if (deviationHitsRef.current >= 2 && !deviationDismissedRecently) {
          setAlertKind('deviation')
          void recordEvent(row, 'deviation', {
            distance_from_route_meters: Math.round(distance),
            consecutive_checks: deviationHitsRef.current,
            driver_latitude: sample.lat,
            driver_longitude: sample.lng,
          })
          return
        }
      }

      setAlertKind(null)
    }

    async function load() {
      const { data: auth } = await supabase.auth.getUser()
      if (!active || !auth.user) {
        if (active) {
          setRide(null)
          setUserId(null)
        }
        return
      }
      setUserId(auth.user.id)
      const { data, error } = await supabase.rpc('get_passenger_active_ride_bundle')
      if (!active) return
      const next = (!error ? (Array.isArray(data) ? data[0] : data) : null) as RideRow | null
      setRide(next)
      if (!next) {
        samplesRef.current = []
        deviationHitsRef.current = 0
        setAlertKind(null)
        return
      }
      if (routeRideRef.current !== next.ride_id) {
        routeRideRef.current = null
        setRouteCoords([])
        samplesRef.current = []
        deviationHitsRef.current = 0
      }
      await buildRoute(next)
      if (active) evaluate(next)
    }

    void load()
    const timer = window.setInterval(() => void load(), 15_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [enabled, routeCoords])

  const shareText = useMemo(() => {
    if (!ride) return ''
    const driver = ride.driver_name?.trim() || (lang === 'ht' ? 'Chofè mwen' : 'Mon chauffeur')
    const vehicle = [ride.vehicle_make, ride.vehicle_model].filter(Boolean).join(' ') || '—'
    const pickup = ride.pickup_address?.trim() || '—'
    const destination = ride.destination_address?.trim() || '—'
    const plate = ride.plate_number?.trim() || '—'
    return lang === 'ht'
      ? `Alèt sekirite Taxi Platform Haiti.\nTrajè mwen an toujou aktif.\nChofè: ${driver}\nMachin: ${vehicle}\nPlak: ${plate}\nSoti: ${pickup}\nAle: ${destination}`
      : `Alerte de sécurité Taxi Platform Haiti.\nMon trajet est toujours actif.\nChauffeur : ${driver}\nVéhicule : ${vehicle}\nPlaque : ${plate}\nDépart : ${pickup}\nDestination : ${destination}`
  }, [ride, lang])

  if (!enabled || !ride || !alertKind) return null

  const activeRide = ride
  const currentAlertKind = alertKind

  const title = currentAlertKind === 'stopped'
    ? (lang === 'ht' ? 'Trajè a sanble kanpe depi yon ti tan' : 'Le trajet semble arrêté depuis un moment')
    : (lang === 'ht' ? 'Trajè a sanble devye sou wout la' : 'Le trajet semble s’écarter de l’itinéraire')

  const detail = currentAlertKind === 'stopped'
    ? (lang === 'ht' ? 'Sa ka nòmal akoz trafik oswa yon poz. Verifye si tout bagay anfòm.' : 'Cela peut être normal à cause du trafic ou d’un arrêt. Vérifiez que tout va bien.')
    : (lang === 'ht' ? 'GPS la montre machin nan lwen wout kalkile a. Sa pa vle di gen danje, men ou ka verifye.' : 'Le GPS montre le véhicule loin de l’itinéraire calculé. Cela ne signifie pas forcément un danger, mais vous pouvez vérifier.')

  const safetyHref = `/passenger/help?ride=${encodeURIComponent(activeRide.ride_id)}&category=safety`

  async function dismiss() {
    dismissedRef.current[`${activeRide.ride_id}:${currentAlertKind}`] = Date.now()
    setAlertKind(null)
    if (!userId) return
    const eventType = currentAlertKind === 'stopped' ? 'stalled' : 'route_deviation'
    await supabase
      .from('ride_safety_events')
      .update({ acknowledged_at: new Date().toISOString() })
      .eq('ride_id', activeRide.ride_id)
      .eq('passenger_id', userId)
      .eq('event_type', eventType)
  }

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: 'Taxi Platform Haiti', text: shareText })
      else if (navigator.clipboard) await navigator.clipboard.writeText(shareText)
    } catch {
      // User may cancel the native share sheet.
    }
  }

  async function recordManualSafetyOpen() {
    if (!userId) return
    await supabase.from('ride_safety_events').insert({
      ride_id: activeRide.ride_id,
      passenger_id: userId,
      event_type: 'manual_safety_opened',
      severity: 'info',
      details: { source_alert: currentAlertKind },
    })
  }

  return <div className="safetyOverlay" role="dialog" aria-live="assertive" aria-label={title}>
    <div className="safetyCard">
      <div className="shield">🛡</div>
      <div className="copy"><strong>{title}</strong><p>{detail}</p></div>
      <div className="actions">
        <button type="button" className="ok" onClick={() => void dismiss()}>{lang === 'ht' ? 'Mwen anfòm' : 'Tout va bien'}</button>
        <button type="button" className="share" onClick={() => void share()}>↗ {lang === 'ht' ? 'Pataje trajè' : 'Partager'}</button>
        <a className="safety" href={safetyHref} onClick={() => void recordManualSafetyOpen()}>🛡 {lang === 'ht' ? 'Sekirite' : 'Sécurité'}</a>
      </div>
      <small>{lang === 'ht' ? 'Alèt sa a baze sou GPS epi li ka gen fo alèt.' : 'Cette alerte est basée sur le GPS et peut produire de faux positifs.'}</small>
    </div>
    <style jsx>{`
      .safetyOverlay{position:fixed;inset:0;z-index:14050;display:flex;align-items:flex-end;justify-content:center;padding:16px;background:rgba(9,20,34,.28);box-sizing:border-box;font-family:Inter,system-ui,sans-serif}
      .safetyCard{width:min(100%,520px);background:#fff;border:1px solid #f0d6b4;border-radius:22px;padding:16px;box-shadow:0 20px 60px rgba(16,32,51,.28);color:#102033}
      .shield{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:#fff4e6;font-size:22px;margin-bottom:10px}.copy strong{display:block;font-size:16px;line-height:1.25}.copy p{margin:6px 0 0;color:#68798a;font-size:12px;line-height:1.45}.actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:14px}.actions button,.actions a{min-height:42px;border-radius:12px;border:1px solid #dfe7ef;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;text-decoration:none;box-sizing:border-box}.ok{background:#eef4ff;color:#185fc2}.share{background:#fff;color:#24415e}.safety{background:#fff0f0;color:#9d3030;border-color:#f0caca!important}.safetyCard>small{display:block;margin-top:10px;color:#8995a1;font-size:9px;line-height:1.35}
      @media(max-width:600px){.safetyOverlay{padding:10px}.safetyCard{border-radius:19px;padding:14px}.actions{grid-template-columns:1fr}.actions button,.actions a{min-height:40px}}
    `}</style>
  </div>
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (v: number) => v * Math.PI / 180
  const r = 6371000
  const p1 = toRad(lat1)
  const p2 = toRad(lat2)
  const dp = toRad(lat2 - lat1)
  const dl = toRad(lng2 - lng1)
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function distanceToRouteMeters(lat: number, lng: number, coords: Array<[number, number]>) {
  let min = Number.POSITIVE_INFINITY
  for (let i = 0; i < coords.length; i += Math.max(1, Math.floor(coords.length / 120))) {
    const [routeLng, routeLat] = coords[i]
    min = Math.min(min, haversineMeters(lat, lng, routeLat, routeLng))
  }
  return min
}
