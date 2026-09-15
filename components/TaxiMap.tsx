'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

type Point = { lat: number; lng: number }
type RouteGeometry = { type: 'LineString'; coordinates: number[][] }
type Lang = 'fr' | 'ht'

type Props = {
  pickup: Point | null
  destination: Point | null
  routeGeometry: RouteGeometry | null
}

type LiveTracking = {
  ride_id: string
  ride_status: 'accepted' | 'driver_arriving' | 'in_progress'
  driver_id: string
  driver_latitude: number | null
  driver_longitude: number | null
  driver_heading: number | null
  driver_speed_kph: number | null
  location_updated_at: string | null
  pickup_latitude: number | null
  pickup_longitude: number | null
  destination_latitude: number | null
  destination_longitude: number | null
}

export default function TaxiMap({ pickup }: Props) {
  const requestRef = useRef(0)
  const [tracking, setTracking] = useState<LiveTracking | null>(null)
  const [driverDistanceKm, setDriverDistanceKm] = useState<number | null>(null)
  const [driverEtaMin, setDriverEtaMin] = useState<number | null>(null)
  const [driverRoutePolyline, setDriverRoutePolyline] = useState<string | null>(null)
  const [mapFailed, setMapFailed] = useState(false)
  const [lang, setLang] = useState<Lang>('fr')

  useEffect(() => {
    const syncLanguage = () => {
      const saved = window.localStorage.getItem('taxi-language')
      setLang(saved === 'ht' ? 'ht' : 'fr')
    }
    syncLanguage()
    window.addEventListener('storage', syncLanguage)
    return () => window.removeEventListener('storage', syncLanguage)
  }, [])

  useEffect(() => {
    let active = true

    async function loadTracking() {
      const { data, error } = await supabase.rpc('get_passenger_live_driver_tracking')
      if (!active) return
      if (error) {
        setTracking(null)
        return
      }
      const row = (Array.isArray(data) ? data[0] : data) as LiveTracking | undefined
      setTracking(row && ['accepted', 'driver_arriving', 'in_progress'].includes(row.ride_status) ? row : null)
    }

    void loadTracking()
    const timer = window.setInterval(() => void loadTracking(), 2500)
    const { data: authListener } = supabase.auth.onAuthStateChange(() => void loadTracking())

    return () => {
      active = false
      window.clearInterval(timer)
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const lat = tracking?.driver_latitude
    const lng = tracking?.driver_longitude
    const targetLat = tracking?.ride_status === 'in_progress' ? tracking.destination_latitude : tracking?.pickup_latitude
    const targetLng = tracking?.ride_status === 'in_progress' ? tracking.destination_longitude : tracking?.pickup_longitude
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

    const requestId = ++requestRef.current
    if (lat == null || lng == null || targetLat == null || targetLng == null || !token) {
      setDriverDistanceKm(null)
      setDriverEtaMin(null)
      setDriverRoutePolyline(null)
      return
    }

    const controller = new AbortController()

    ;(async () => {
      try {
        const coords = `${lng},${lat};${targetLng},${targetLat}`
        const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?overview=full&geometries=polyline&steps=false&access_token=${encodeURIComponent(token)}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Directions unavailable')
        const json = await response.json()
        const route = json.routes?.[0]
        if (controller.signal.aborted || requestId !== requestRef.current) return
        if (!route || !Number.isFinite(route.distance) || !Number.isFinite(route.duration)) throw new Error('Route unavailable')
        setDriverDistanceKm(route.distance / 1000)
        setDriverEtaMin(Math.max(1, Math.round(route.duration / 60)))
        setDriverRoutePolyline(route.geometry ?? null)
      } catch {
        if (!controller.signal.aborted && requestId === requestRef.current) {
          setDriverDistanceKm(null)
          setDriverEtaMin(null)
          setDriverRoutePolyline(null)
        }
      }
    })()

    return () => controller.abort()
  }, [tracking?.ride_id, tracking?.ride_status, tracking?.driver_latitude, tracking?.driver_longitude, tracking?.pickup_latitude, tracking?.pickup_longitude, tracking?.destination_latitude, tracking?.destination_longitude])

  const mapUrl = useMemo(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!token) return ''

    const driverLat = tracking?.driver_latitude
    const driverLng = tracking?.driver_longitude
    const targetLat = tracking?.ride_status === 'in_progress' ? tracking.destination_latitude : tracking?.pickup_latitude
    const targetLng = tracking?.ride_status === 'in_progress' ? tracking.destination_longitude : tracking?.pickup_longitude

    if (driverLat != null && driverLng != null && targetLat != null && targetLng != null) {
      const overlays = [
        driverRoutePolyline ? `path-5+0f705a-0.92(${encodeURIComponent(driverRoutePolyline)})` : null,
        `pin-s-a+0f705a(${driverLng},${driverLat})`,
        `pin-s-b+ef6a5b(${targetLng},${targetLat})`,
      ].filter(Boolean).join(',')
      return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlays}/auto/900x650@2x?padding=92&logo=false&attribution=false&access_token=${encodeURIComponent(token)}`
    }

    const center = pickup ?? { lat: 18.5392, lng: -72.3364 }
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s-a+0f705a(${center.lng},${center.lat})/${center.lng},${center.lat},13/900x650@2x?logo=false&attribution=false&access_token=${encodeURIComponent(token)}`
  }, [pickup, tracking, driverRoutePolyline])

  useEffect(() => setMapFailed(false), [mapUrl])

  const trackingLabel = tracking?.ride_status === 'in_progress'
    ? (lang === 'ht' ? 'Sou wout pou destinasyon' : 'Vers la destination')
    : (lang === 'ht' ? 'Chofè a ap vin pran ou' : 'Votre chauffeur vient vous chercher')

  const positionLabel = lang === 'ht' ? 'Pozisyon ou' : 'Votre position'
  const liveLabel = lang === 'ht' ? 'Pozisyon an dirèk' : 'Position en direct'
  const unavailable = lang === 'ht' ? 'Kat la pa disponib pou kounye a' : 'Carte temporairement indisponible'

  return (
    <div className="safe-map-wrap">
      {mapUrl && !mapFailed ? (
        <img className="safe-map" src={mapUrl} alt={lang === 'ht' ? 'Kat trajè a' : 'Carte du trajet'} onError={() => setMapFailed(true)} />
      ) : (
        <div className="safe-map-placeholder"><span>🗺️</span><strong>{unavailable}</strong></div>
      )}

      <div className="safe-map-shade" />

      {pickup && !tracking && (
        <div className="map-status-pill map-position-pill"><span>●</span><strong>{positionLabel}</strong></div>
      )}

      {tracking && tracking.driver_latitude != null && tracking.driver_longitude != null && (
        <div className="live-tracking-badge">
          <div className="live-car">🚕</div>
          <div><strong>{trackingLabel}</strong><span>{driverDistanceKm == null ? liveLabel : `${driverDistanceKm.toFixed(1)} km`}{driverEtaMin == null ? '' : ` · ${driverEtaMin} min`}</span></div>
        </div>
      )}

      <style jsx>{`
        .safe-map-wrap{position:relative;width:100%;height:100%;min-height:300px;background:#e8efec;overflow:hidden}
        .safe-map{display:block;width:100%;height:100%;min-height:300px;object-fit:cover;transform:scale(1.01)}
        .safe-map-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(13,34,30,.05) 0%,rgba(13,34,30,0) 42%,rgba(255,255,255,.05) 100%)}
        .safe-map-placeholder{min-height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#66778a;font-weight:750;padding:20px;text-align:center;background:linear-gradient(180deg,#edf3f1,#e4ece9)}
        .safe-map-placeholder span{font-size:30px}.safe-map-placeholder strong{font-size:12px}
        .route-map-badge,.live-tracking-badge{position:absolute;left:14px;right:14px;bottom:58px;z-index:8;min-height:54px;display:flex;align-items:center;gap:10px;border-radius:17px;padding:9px 11px;box-shadow:0 10px 28px rgba(16,32,51,.16);font-family:Inter,system-ui,sans-serif;pointer-events:none;backdrop-filter:blur(10px)}
        .route-map-badge{background:rgba(255,255,255,.94);color:#17324d;border:1px solid rgba(15,112,90,.14)}
        .live-tracking-badge{background:rgba(15,112,90,.94);color:#fff;border:1px solid rgba(255,255,255,.18)}
        .route-map-icon,.live-car{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;flex:0 0 36px;font-weight:950}
        .route-map-icon{background:#eaf5f1;color:#0f705a;font-size:18px}.live-car{background:rgba(255,255,255,.16);font-size:18px}
        .route-map-badge strong,.route-map-badge span,.live-tracking-badge strong,.live-tracking-badge span{display:block}
        .route-map-badge strong,.live-tracking-badge strong{font-size:11px;line-height:1.2}
        .route-map-badge span,.live-tracking-badge span{font-size:9px;margin-top:3px;line-height:1.3}
        .route-map-badge span{color:#6c7d76}.live-tracking-badge span{color:#d9eee7}
        .map-status-pill{position:absolute;left:14px;bottom:58px;z-index:8;display:flex;align-items:center;gap:7px;padding:8px 10px;border-radius:999px;background:rgba(255,255,255,.94);border:1px solid rgba(15,112,90,.14);box-shadow:0 8px 20px rgba(16,32,51,.12);font-family:Inter,system-ui,sans-serif;pointer-events:none}
        .map-status-pill span{color:#0f705a;font-size:15px;line-height:1}.map-status-pill strong{font-size:9px;color:#314a42}
        @media(max-width:420px){
          .route-map-badge,.live-tracking-badge{left:12px;right:12px;bottom:52px;min-height:50px;border-radius:15px}
          .map-status-pill{left:12px;bottom:52px}
        }
      `}</style>
    </div>
  )
}
