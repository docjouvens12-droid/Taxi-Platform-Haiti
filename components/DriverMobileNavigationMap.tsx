'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { loadGoogleMaps } from '../lib/google-maps'
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



export default function DriverMobileNavigationMap({ ride, lang, onMetricsChange }: Props) {
  const watchRef = useRef<number | null>(null)
  const heartbeatRef = useRef<number | null>(null)
  const requestSeq = useRef(0)
  const latestPositionRef = useRef<Point | null>(null)
  const mapEl = useRef<HTMLDivElement>(null)
const mapRef = useRef<any>(null)
const driverMarkerRef = useRef<any>(null)
const targetMarkerRef = useRef<any>(null)
const routeRef = useRef<any>(null)
  const [position, setPosition] = useState<Point | null>(null)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [etaMin, setEtaMin] = useState<number | null>(null)
const [routePolyline, setRoutePolyline] = useState<any[]>([])
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
  const publish = (point: Point) => {
    latestPositionRef.current = point
    setPosition(point)
    void syncDriverLocation(point)
  }

  if (!navigator.geolocation) {
    setError(
      lang === 'fr'
        ? 'GPS indisponible sur cet appareil.'
        : 'GPS pa disponib sou aparèy sa a.'
    )
    return
  }

  watchRef.current = navigator.geolocation.watchPosition(
    (p) => {
      const next: Point = {
        lat: p.coords.latitude,
        lng: p.coords.longitude,
        heading: p.coords.heading ?? null,
        speedKph: p.coords.speed == null ? null : p.coords.speed * 3.6,
      }

      publish(next)
    },
    () =>
      setError(
        lang === 'fr'
          ? 'Autorisez la localisation pour utiliser le GPS.'
          : 'Bay pèmisyon Location pou itilize GPS la.'
      ),
    {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 15000,
    }
  )

  heartbeatRef.current = window.setInterval(() => {
    if (latestPositionRef.current) {
      void syncDriverLocation(latestPositionRef.current)
    }
  }, 3000)

  return () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
    }

    if (heartbeatRef.current !== null) {
      window.clearInterval(heartbeatRef.current)
    }

    watchRef.current = null
    heartbeatRef.current = null
  }
   }, [lang]) 

  useEffect(() => {
  if (!position || targetLat == null || targetLng == null) {
    setRoutePolyline([])
    setDistanceKm(null)
    setEtaMin(null)
    return
  }

  const seq = ++requestSeq.current

  const timer = window.setTimeout(async () => {
    try {
      const google = await loadGoogleMaps()
      const directionsService = new google.maps.DirectionsService()

      const result = await directionsService.route({
        origin: {
          lat: position.lat,
          lng: position.lng,
        },
        destination: {
          lat: targetLat,
          lng: targetLng,
        },
        travelMode: google.maps.TravelMode.DRIVING,
        region: 'HT',
      })

      if (seq !== requestSeq.current) return

      const leg = result.routes?.[0]?.legs?.[0]

      if (!leg) {
        setRoutePolyline([])
        setDistanceKm(null)
        setEtaMin(null)
        return
      }

      setDistanceKm(
        leg.distance?.value != null
          ? leg.distance.value / 1000
          : null
      )

      setEtaMin(
        leg.duration?.value != null
          ? Math.max(1, Math.round(leg.duration.value / 60))
          : null
      )

      const path =
  result.routes?.[0]?.overview_path?.map((point: any) => ({
    lat: point.lat(),
    lng: point.lng(),
  })) ?? []

setRoutePolyline(path)
    } catch {
      if (seq === requestSeq.current) {
        setRoutePolyline([])
        setDistanceKm(null)
        setEtaMin(null)
      }
    }
  }, 250)

  return () => {
    window.clearTimeout(timer)
  }
}, [position?.lat, position?.lng, targetLat, targetLng])
useEffect(() => {
  if (!position || targetLat == null || targetLng == null) return

  let cancelled = false

  ;(async () => {
    try {
      const google = await loadGoogleMaps()
      if (cancelled || !mapEl.current) return

      const driverPoint = {
        lat: position.lat,
        lng: position.lng,
      }

      const targetPoint = {
        lat: targetLat,
        lng: targetLng,
      }

      const map =
        mapRef.current ??
        new google.maps.Map(mapEl.current, {
          center: driverPoint,
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        })

      mapRef.current = map
      setMapFailed(false)

      if (!driverMarkerRef.current) {
        driverMarkerRef.current = new google.maps.Marker({
          map,
          position: driverPoint,
          title: 'Chauffeur',
        })
      } else {
        driverMarkerRef.current.setPosition(driverPoint)
        driverMarkerRef.current.setMap(map)
      }

      if (!targetMarkerRef.current) {
        targetMarkerRef.current = new google.maps.Marker({
          map,
          position: targetPoint,
          title: targetAddress,
        })
      } else {
        targetMarkerRef.current.setPosition(targetPoint)
        targetMarkerRef.current.setMap(map)
      }

      if (!routeRef.current) {
        routeRef.current = new google.maps.Polyline({
          map,
          path: routePolyline,
          strokeColor: '#1479ff',
          strokeOpacity: 0.9,
          strokeWeight: 5,
        })
      } else {
        routeRef.current.setPath(routePolyline)
        routeRef.current.setMap(map)
      }

      const bounds = new google.maps.LatLngBounds()
      bounds.extend(driverPoint)
      bounds.extend(targetPoint)
      routePolyline.forEach((point) => bounds.extend(point))
      map.fitBounds(bounds, 60)
    } catch {
      if (!cancelled) setMapFailed(true)
    }
  })()

  return () => {
    cancelled = true
  }
}, [
  position?.lat,
  position?.lng,
  targetLat,
  targetLng,
  targetAddress,
  routePolyline,
])  
useEffect(() => {
  return () => {
    driverMarkerRef.current?.setMap(null)
    targetMarkerRef.current?.setMap(null)
    routeRef.current?.setMap(null)

    driverMarkerRef.current = null
    targetMarkerRef.current = null
    routeRef.current = null
    mapRef.current = null
  }
}, [])
  return <section className="nav">
    <div className="head">
      <div>
        <small>{goingToDestination ? (lang === 'fr' ? 'VERS LA DESTINATION' : 'POU DESTINASYON') : (lang === 'fr' ? 'VERS LE PASSAGER' : 'ALE KOTE PASAJE A')}</small>
        <strong>{targetAddress}</strong>
      </div>
      <b>{distanceKm == null ? 'GPS' : `${distanceKm.toFixed(1)} km${etaMin == null ? '' : ` · ${etaMin} min`}`}</b>
    </div>

   {position && targetLat != null && targetLng != null ? (
  <>
    <div ref={mapEl} className="map" />
    {mapFailed && (
      <div className="loading">
        {lang === 'fr'
          ? 'La carte ne peut pas être affichée pour le moment. Le GPS continue de calculer la distance et le temps.'
          : 'Kat la pa ka parèt pou kounye a. GPS la kontinye kalkile distans ak tan.'}
      </div>
    )}
  </>
) : (
  <div className="loading">
    {lang === 'fr'
      ? 'Recherche de votre position GPS…'
      : 'N ap chèche pozisyon GPS ou…'}
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
