'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { usePassengerRide } from './PassengerRideProvider'
import { loadGoogleMaps } from '../lib/google-maps'

type Tracking = {
  ride_id: string
  ride_status: 'accepted' | 'driver_arriving' | 'in_progress'
  driver_id: string
  driver_latitude: number | null
  driver_longitude: number | null
  pickup_latitude: number | null
  pickup_longitude: number | null
  destination_latitude: number | null
  destination_longitude: number | null
}

type RouteMetrics = { distanceKm: number; minutes: number }


export default function PassengerAcceptedRideMiniMap() {
  const { ride } = usePassengerRide()
  const [rawTracking, setTracking] = useState<Tracking | null>(null)
  const trackable = !!ride && ['accepted', 'driver_arriving', 'in_progress'].includes(ride.status)
  const tracking = useMemo(() => trackable && rawTracking?.ride_id === ride?.id ? { ...rawTracking, ride_status: ride.status as Tracking['ride_status'] } : null, [trackable, rawTracking, ride?.id, ride?.status])
  const mapVisible = !!tracking
  const [metrics, setMetrics] = useState<RouteMetrics | null>(null)
  const [ht, setHt] = useState(false)
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
const driverMarkerRef = useRef<any>(null)
const endMarkerRef = useRef<any>(null)
  const lastTrackingRef = useRef<Tracking | null>(null)
  const lastRouteAt = useRef(0)

  useEffect(() => {
    const findTarget = () => setTarget(document.querySelector<HTMLElement>('.map-panel.real-map-panel'))
    findTarget()
    const timer = window.setInterval(findTarget, 500)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let alive = true
    if (!trackable) { setTracking(null); return }
    const syncLang = () => setHt(window.localStorage.getItem('taxi-language') === 'ht')
    syncLang()
    async function load() {
      const { data, error } = await supabase.rpc('get_passenger_live_driver_tracking')
      if (!alive) return
      if (error) return
      const row = (Array.isArray(data) ? data[0] : data) as Tracking | undefined
      setTracking(row ?? null)
    }
    void load()
    const timer = window.setInterval(() => void load(), 1000)
    window.addEventListener('storage', syncLang)
    return () => { alive = false; window.clearInterval(timer); window.removeEventListener('storage', syncLang) }
  }, [ride?.id, trackable])

  useEffect(() => { lastTrackingRef.current = tracking }, [tracking])

  async function renderTracking(row: Tracking) {
    const map = mapRef.current
    if (!map) return
    const dLat = Number(row.driver_latitude), dLng = Number(row.driver_longitude)
    const targetLat = Number(row.ride_status === 'in_progress' ? row.destination_latitude : row.pickup_latitude)
    const targetLng = Number(row.ride_status === 'in_progress' ? row.destination_longitude : row.pickup_longitude)
    if (![dLat,dLng,targetLat,targetLng].every(Number.isFinite)) return

   const google = await loadGoogleMaps() 
    if (mapRef.current !== map) return
    const driverPoint:[number,number] = [dLng,dLat]
    const endPoint:[number,number] = [targetLng,targetLat]

    
if (!driverMarkerRef.current) {
  driverMarkerRef.current = new google.maps.Marker({
    map,
    position: { lat: dLat, lng: dLng },
    title: 'Chauffeur',
    icon: {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 7,
      fillColor: '#2563EB',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
    },
  })
} else {
  driverMarkerRef.current.setMap(map)
}
   if (!endMarkerRef.current) {
  endMarkerRef.current = new google.maps.Marker({
    map,
    position: { lat: targetLat, lng: targetLng },
title: row.ride_status === 'in_progress' ? 'Destination' : 'Prise en charge',
icon: {
  path: google.maps.SymbolPath.CIRCLE,
  scale: 8,
  fillColor: '#EA4335',
  fillOpacity: 1,
  strokeColor: '#FFFFFF',
  strokeWeight: 3,
},
})
} else {
  endMarkerRef.current.setMap(map)
}

   const now = Date.now()
if (now - lastRouteAt.current < 3000) return
lastRouteAt.current = now

   try {
  const { Route } = await google.maps.importLibrary('routes') as any
  const { routes } = await Route.computeRoutes({
    origin: { lat: dLat, lng: dLng },
    destination: { lat: targetLat, lng: targetLng },
    travelMode: 'DRIVING',
    fields: ['path', 'distanceMeters', 'durationMillis'],
  })

  const route = routes?.[0]
  if (!route) return

  setMetrics({
    distanceKm: route.distanceMeters != null ? route.distanceMeters / 1000 : 0,
    minutes: route.durationMillis != null ? Math.max(1, Math.ceil(route.durationMillis / 60000)) : 1,
  })
const path = route.path ?? []

const snappedStart = path[0]
const snappedEnd = path[path.length - 1]

if (snappedStart) {
  driverMarkerRef.current?.setPosition(snappedStart)
if (path.length > 1 && driverMarkerRef.current) {
  const heading = google.maps.geometry.spherical.computeHeading(path[0], path[1])
  const icon = driverMarkerRef.current.getIcon() as any

  driverMarkerRef.current.setIcon({
    ...icon,
    rotation: heading,
  })
}  
}

if (snappedEnd) {
  endMarkerRef.current?.setPosition(snappedEnd)
}

  if (!(map as any).__passengerRouteOutline) {
    ;(map as any).__passengerRouteOutline = new google.maps.Polyline({
      map,
      path,
      strokeColor: '#FFFFFF',
      strokeOpacity: 1,
    strokeWeight: 11,
    })
  } else {
    ;(map as any).__passengerRouteOutline.setPath(path)
  }

  if (!(map as any).__passengerRouteLine) {
    ;(map as any).__passengerRouteLine = new google.maps.Polyline({
      map,
      path,
      strokeColor: '#4285F4',
      strokeOpacity: 1,
      strokeWeight: 6,
    })
  } else {
    ;(map as any).__passengerRouteLine.setPath(path)
  }

  const bounds = new google.maps.LatLngBounds()
  bounds.extend({ lat: dLat, lng: dLng })
  bounds.extend({ lat: targetLat, lng: targetLng })
  path.forEach((point:any) => bounds.extend(point))
  map.fitBounds(bounds, 60)
    } catch {}
  }

  useEffect(() => {
  if (!mapVisible || !target || !mapEl.current || mapRef.current) return

  let cancelled = false

  ;(async () => {
    const google = await loadGoogleMaps()
    if (cancelled || !mapEl.current) return

    const map = new google.maps.Map(mapEl.current, {
    center: tracking && Number.isFinite(Number(tracking.driver_latitude)) && Number.isFinite(Number(tracking.driver_longitude))
  ? { lat: Number(tracking.driver_latitude), lng: Number(tracking.driver_longitude) }
  : { lat: 18.5500, lng: -72.3200 },
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    })

    mapRef.current = map

 if (tracking) void renderTracking(tracking)   
  })()

  return () => {
    cancelled = true
    driverMarkerRef.current?.setMap?.(null)
    endMarkerRef.current?.setMap?.(null)
    driverMarkerRef.current = null
    endMarkerRef.current = null
    mapRef.current = null
    lastRouteAt.current = 0
  }
}, [target, mapVisible])

  useEffect(() => {
  if (!tracking) return
  if (!mapRef.current) return
  void renderTracking(tracking)
}, [tracking])

  if (!tracking || !target || !document.contains(target)) return null
  const inProgress = tracking.ride_status === 'in_progress'
  const arrived = tracking.ride_status === 'driver_arriving'
  const title = inProgress ? (ht?'Trajè a kòmanse':'La course a commencé') : arrived ? (ht?'Chofè a rive':'Le chauffeur est arrivé') : (ht?'Chofè a sou wout pou ou':'Votre chauffeur est en route')
  const subtitle = inProgress ? (ht?'Swiv machin nan jouk pwen arive a.':'Suivez la voiture jusqu’au point d’arrivée.') : arrived ? (ht?'Chofè a ap tann ou nan kote pou pran ou.':'Votre chauffeur vous attend au point de prise en charge.') : (ht?'Swiv machin chofè a pandan l ap vini pran ou.':'Suivez la voiture du chauffeur pendant son approche.')
  const distanceLabel = metrics ? `${metrics.distanceKm < 10 ? metrics.distanceKm.toFixed(1) : Math.round(metrics.distanceKm)} km` : '—'
  const timeLabel = metrics ? `~${metrics.minutes} min` : '—'

  return createPortal(
    <section className={`passenger-live-top-map ${arrived?'arrived':''}`} aria-live="polite">
      <style>{`
        .map-panel.real-map-panel{position:relative!important}.passenger-live-top-map{position:absolute;left:0;right:0;top:76px;bottom:0;z-index:8;overflow:hidden;background:#eef5f2;font-family:Inter,system-ui,sans-serif}.passenger-live-head{display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,255,255,.97);border-bottom:1px solid #e2ebe7;position:relative;z-index:5}.passenger-live-icon{width:36px;height:36px;border-radius:12px;background:#e6f5ef;display:grid;place-items:center;font-size:18px}.passenger-live-copy{min-width:0;flex:1}.passenger-live-copy strong{display:block;color:#10243a;font-size:14px;font-weight:900}.passenger-live-copy small{display:block;margin-top:2px;color:#6d7e77;font-size:9px;font-weight:650}.passenger-live-live{padding:5px 8px;border-radius:999px;background:#eaf7f2;color:#0f8065;font-size:8px;font-weight:900}.passenger-live-frame{position:absolute;left:0;right:0;top:57px;bottom:0;background:#e8efec}.passenger-live-map{width:100%;height:100%}.passenger-live-metrics{position:absolute;left:10px;top:66px;width:184px;z-index:6;display:grid;grid-template-columns:1fr 1fr;background:rgba(255,255,255,.94);border-radius:13px;overflow:hidden;box-shadow:0 5px 14px rgba(16,36,31,.12)}.passenger-live-metric{padding:6px 8px}.passenger-live-metric+.passenger-live-metric{border-left:1px solid #e6eeeb}.passenger-live-metric span{display:block;font-size:5.8px;color:#5f716a;font-weight:900;text-transform:uppercase}.passenger-live-metric strong{display:block;margin-top:3px;color:#0f2438;font-size:14px;font-weight:950}.passenger-live-legend{position:absolute;left:12px;right:12px;bottom:12px;z-index:6;display:flex;justify-content:space-between}.passenger-live-legend span{background:rgba(255,255,255,.96);padding:6px 9px;border-radius:999px;font-size:8px;font-weight:900;box-shadow:0 4px 12px rgba(0,0,0,.12)}.passenger-driver-car-marker{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:#fff;border:4px solid #0f2a43;box-shadow:0 5px 16px rgba(0,0,0,.28);font-size:24px;z-index:20}.passenger-arrival-marker{width:34px;height:42px;position:relative;z-index:19}.passenger-arrival-marker:before{content:'';position:absolute;left:3px;top:0;width:28px;height:28px;background:#ef4444;border:4px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,.25)}.passenger-arrival-marker span{position:absolute;left:13px;top:10px;width:8px;height:8px;border-radius:50%;background:#fff;z-index:2}.passenger-arrived-panel{position:absolute;inset:57px 0 0;display:grid;place-items:center;text-align:center;padding:24px;background:linear-gradient(180deg,#edf8f4,#f8fcfa)}
      `}</style>
      <div className="passenger-live-head"><span className="passenger-live-icon">🚕</span><div className="passenger-live-copy"><strong>{title}</strong><small>{subtitle}</small></div>{!arrived&&<span className="passenger-live-live">● LIVE</span>}</div>
      <div className="passenger-live-frame"><div ref={mapEl} className="passenger-live-map"/><div className="passenger-live-legend"><span>🚕 {ht?'Machin chofè':'Voiture chauffeur'}</span><span>📍 {inProgress ? (ht?'Destinasyon':'Destination') : (ht?'Kote pou pran ou':'Prise en charge')}</span></div></div>
      {!arrived&&<div className="passenger-live-metrics"><div className="passenger-live-metric"><span>{inProgress?(ht?'Distans ki rete':'Distance restante'):(ht?'Distans':'Distance')}</span><strong>{distanceLabel}</strong></div><div className="passenger-live-metric"><span>{inProgress?(ht?'Tan ki rete':'Temps restant'):(ht?'Rive nan':'Arrivée dans')}</span><strong>{timeLabel}</strong></div></div>}
    </section>, target)
}
