'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

type RideStatus = 'accepted' | 'driver_arriving' | 'in_progress'

type Ride = {
  status: RideStatus
  pickup_latitude: number | null
  pickup_longitude: number | null
  destination_latitude: number | null
  destination_longitude: number | null
  pickup_address: string
  destination_address: string
}

type Props = {
  ride: Ride
  lang: 'fr' | 'ht'
  onMetricsChange?: (metrics: { distanceKm: number | null; etaMin: number | null }) => void
}
type Point = { lat: number; lng: number; heading: number | null; speedKph: number | null }

const HAITI_TEST_POSITION: Point = {
  lat: 18.5944,
  lng: -72.3074,
  heading: null,
  speedKph: 0,
}

export default function DriverMobileNavigationMap({ ride, lang, onMetricsChange }: Props) {
  const watchRef = useRef<number | null>(null)
  const heartbeatRef = useRef<number | null>(null)
  const requestSeq = useRef(0)
  const latestPositionRef = useRef<Point | null>(null)
  const [position, setPosition] = useState<Point | null>(null)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [etaMin, setEtaMin] = useState<number | null>(null)
  const [routePolyline, setRoutePolyline] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [mapFailed, setMapFailed] = useState(false)

  const goingToDestination = ride.status === 'in_progress'
  const targetLat = goingToDestination ? ride.destination_latitude : ride.pickup_latitude
  const targetLng = goingToDestination ? ride.destination_longitude : ride.pickup_longitude
  const targetAddress = goingToDestination ? ride.destination_address : ride.pickup_address

  useEffect(() => {
    onMetricsChange?.({ distanceKm, etaMin })
  }, [distanceKm, etaMin, onMetricsChange])

  async function syncDriverLocation(point: Point) {
    const { error: syncError } = await supabase.rpc('update_driver_location', {
      p_latitude: point.lat,
      p_longitude: point.lng,
      p_heading: point.heading,
      p_speed_kph: point.speedKph,
    })

    if (syncError) {
      setError(lang === 'fr'
        ? `Impossible de partager votre position: ${syncError.message}`
        : `Nou pa ka pataje pozisyon ou: ${syncError.message}`)
      return false
    }

    setError('')
    return true
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const queryTestMode = params.get('test') === 'haiti'
    if (queryTestMode) localStorage.setItem('taxi_haiti_test_mode', '1')
    const testMode = queryTestMode || localStorage.getItem('taxi_haiti_test_mode') === '1'

    const publish = (point: Point) => {
      latestPositionRef.current = point
      setPosition(point)
      void syncDriverLocation(point)
    }

    if (testMode) {
      publish(HAITI_TEST_POSITION)
      heartbeatRef.current = window.setInterval(() => {
        void syncDriverLocation(HAITI_TEST_POSITION)
      }, 3000)

      return () => {
        if (heartbeatRef.current !== null) window.clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
    }

    if (!navigator.geolocation) {
      setError(lang === 'fr' ? 'GPS indisponible sur cet appareil.' : 'GPS pa disponib sou aparèy sa a.')
      return
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (p) => {
        const next = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          heading: p.coords.heading ?? null,
          speedKph: p.coords.speed == null ? null : p.coords.speed * 3.6,
        }
        publish(next)
      },
      () => setError(lang === 'fr' ? 'Autorisez la localisation pour utiliser le GPS.' : 'Bay pèmisyon Location pou itilize GPS la.'),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    )

    heartbeatRef.current = window.setInterval(() => {
      if (latestPositionRef.current) void syncDriverLocation(latestPositionRef.current)
    }, 3000)

    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
      if (heartbeatRef.current !== null) window.clearInterval(heartbeatRef.current)
      watchRef.current = null
      heartbeatRef.current = null
    }
  }, [lang])

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!token || !position || targetLat == null || targetLng == null) return

    const seq = ++requestSeq.current
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const coords = `${position.lng},${position.lat};${targetLng},${targetLat}`
        const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?overview=full&geometries=polyline&steps=false&access_token=${encodeURIComponent(token)}`, { signal: controller.signal })
        const json = await response.json()
        const route = json.routes?.[0]
        if (!route || seq !== requestSeq.current) {
          setRoutePolyline(null)
          setDistanceKm(null)
          setEtaMin(null)
          return
        }
        setDistanceKm(route.distance / 1000)
        setEtaMin(Math.max(1, Math.round(route.duration / 60)))
        setRoutePolyline(route.geometry ?? null)
      } catch {
        if (!controller.signal.aborted && seq === requestSeq.current) {
          setRoutePolyline(null)
          setDistanceKm(null)
          setEtaMin(null)
        }
      }
    }, 250)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [position?.lat, position?.lng, targetLat, targetLng])

  const mapUrl = useMemo(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!token || !position || targetLat == null || targetLng == null) return ''

    const overlays = [
      routePolyline ? `path-5+1479ff-0.9(${encodeURIComponent(routePolyline)})` : null,
      `pin-s-a+1479ff(${position.lng},${position.lat})`,
      `pin-s-b+0d7b61(${targetLng},${targetLat})`,
    ].filter(Boolean).join(',')

    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlays}/auto/800x600?padding=50&access_token=${encodeURIComponent(token)}`
  }, [position, targetLat, targetLng, routePolyline])

  useEffect(() => {
    setMapFailed(false)
  }, [mapUrl])

  return <section className="nav">
    <div className="head">
      <div>
        <small>{goingToDestination ? (lang === 'fr' ? 'VERS LA DESTINATION' : 'POU DESTINASYON') : (lang === 'fr' ? 'VERS LE PASSAGER' : 'ALE KOTE PASAJE A')}</small>
        <strong>{targetAddress}</strong>
      </div>
      <b>{distanceKm == null ? 'GPS' : `${distanceKm.toFixed(1)} km${etaMin == null ? '' : ` · ${etaMin} min`}`}</b>
    </div>

    {mapUrl && !mapFailed ? (
      <img className="map" src={mapUrl} alt={lang === 'fr' ? 'Itinéraire GPS' : 'Wout GPS'} onError={() => setMapFailed(true)} />
    ) : (
      <div className="loading">
        {mapFailed
          ? (lang === 'fr' ? 'La carte ne peut pas être affichée pour le moment. Le GPS continue de calculer la distance et le temps.' : 'Kat la pa ka parèt pou kounye a. GPS la kontinye kalkile distans ak tan.')
          : (lang === 'fr' ? 'Recherche de votre position GPS…' : 'N ap chèche pozisyon GPS ou…')}
      </div>
    )}
    {error && <div className="error">{error}</div>}

    <style jsx>{`
      .nav{overflow:hidden;border-radius:20px;border:1px solid #dfe6ed;background:#fff;box-shadow:0 10px 28px rgba(16,32,51,.09)}
      .head{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 14px;background:#102033;color:#fff}
      .head div{min-width:0}.head small,.head strong{display:block}.head small{font-size:10px;color:#a9bdd0;font-weight:850;letter-spacing:.04em}.head strong{font-size:14px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.head b{white-space:nowrap;font-size:13px;background:#1c3148;border-radius:999px;padding:8px 10px}
      .map{display:block;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;background:#eaf0f4}.loading,.error{padding:24px 18px;text-align:center;font-weight:750}.loading{min-height:180px;display:grid;place-items:center;color:#66778a;background:#eaf0f4}.error{background:#fff1f1;color:#a12626}
      @media(max-width:600px){.head{align-items:flex-start;flex-direction:column}.head b{align-self:flex-start}}
    `}</style>
  </section>
}
