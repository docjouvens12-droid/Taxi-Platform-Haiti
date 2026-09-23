'use client'

import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '../lib/google-maps'

type RideStatus = 'requested' | 'accepted' | 'driver_arriving' | 'in_progress' | 'completed' | 'cancelled'

type Ride = {
  status: RideStatus
  pickup_latitude: number | null
  pickup_longitude: number | null
  destination_latitude: number | null
  destination_longitude: number | null
  pickup_address: string
  destination_address: string
}

type Props = { ride: Ride; lang: 'fr' | 'ht' }
type Point = { lat: number; lng: number; heading: number | null }

type NavStep = {
  key: string
  text: string
  distanceMeters: number
  icon: string
}

export default function DriverNavigationMap({ ride, lang }: Props) {
  const onDashboard = typeof window !== 'undefined' && window.location.pathname === '/driver/dashboard'
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
const driverMarkerRef = useRef<any>(null)
const targetMarkerRef = useRef<any>(null)
const routeRef = useRef<any>(null)
  
  const watchRef = useRef<number | null>(null)
  
  const [opened, setOpened] = useState(true)
  const [position, setPosition] = useState<Point | null>(null)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [etaMin, setEtaMin] = useState<number | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapFailed, setMapFailed] = useState(false)
  const [nextStep, setNextStep] = useState<NavStep | null>(null)
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  const goingToDestination = ride.status === 'in_progress'
  const targetLat = goingToDestination ? ride.destination_latitude : ride.pickup_latitude
  const targetLng = goingToDestination ? ride.destination_longitude : ride.pickup_longitude
  const targetAddress = goingToDestination ? ride.destination_address : ride.pickup_address

  useEffect(() => {
    const saved = window.localStorage.getItem('driver-nav-voice')
    if (saved === 'off') setVoiceEnabled(false)
  }, [])

  useEffect(() => {
  
    setNextStep(null)
  }, [ride.status, targetLat, targetLng])

  useEffect(() => {
    if (onDashboard && ['accepted', 'driver_arriving', 'in_progress'].includes(ride.status)) {
      window.location.replace('/driver/navigation')
    }
  }, [onDashboard, ride.status])

  useEffect(() => {
    if (onDashboard) return
    setOpened(true)
    setMapFailed(false)
  }, [ride.status, onDashboard])

  useEffect(() => {
    if (onDashboard || !opened) return
    let cancelled = false
if (!containerRef.current || mapRef.current) return    

    ;(async () => {
      try {
      const google = await loadGoogleMaps()
if (cancelled || !containerRef.current) return
const map = new google.maps.Map(containerRef.current, {
  center: { lat: 18.5392, lng: -72.3364 },
  zoom: 14,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: false,
})        
        
        mapRef.current = map
        if (!cancelled) setMapReady(true)
      } catch {
        if (!cancelled) setMapFailed(true)
      }
    })()

    return () => {
      cancelled = true
     driverMarkerRef.current?.setMap(null)
targetMarkerRef.current?.setMap(null)
routeRef.current?.setMap(null)

driverMarkerRef.current = null
targetMarkerRef.current = null
routeRef.current = null
mapRef.current = null
      setMapReady(false)
    }
  }, [opened, onDashboard])

  useEffect(() => {
    if (onDashboard || !opened || !navigator.geolocation) return
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => setPosition({ lat: p.coords.latitude, lng: p.coords.longitude, heading: p.coords.heading ?? null }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    )
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
  }, [opened, onDashboard])

useEffect(() => {
  if (onDashboard || !position) return

  let cancelled = false

  ;(async () => {
    const google = await loadGoogleMaps()
    if (cancelled) return

    const map = mapRef.current
    if (!map) return

    const driverPoint = {
      lat: position.lat,
      lng: position.lng,
    }

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

    map.panTo(driverPoint)
    map.setZoom(15)
  })().catch(() => {})

  return () => {
    cancelled = true
  }
}, [position, mapReady, onDashboard])  
  
 useEffect(() => {
  if (onDashboard || targetLat == null || targetLng == null) return

  let cancelled = false

  ;(async () => {
    const google = await loadGoogleMaps()
    if (cancelled) return

    const map = mapRef.current
    if (!map) return

    const targetPoint = {
      lat: targetLat,
      lng: targetLng,
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
  })().catch(() => {})

  return () => {
    cancelled = true
  }
}, [targetLat, targetLng, targetAddress, goingToDestination, mapReady, onDashboard])

  
  function toggleVoice() {
    const next = !voiceEnabled
    setVoiceEnabled(next)
    window.localStorage.setItem('driver-nav-voice', next ? 'on' : 'off')
    if (next && 'speechSynthesis' in window) {
      const text = lang === 'ht' ? 'Navigasyon vwa aktive' : 'Navigation vocale activée'
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'fr-FR'
      u.rate = 0.95
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(u)
    } else if (!next && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }
useEffect(() => {
  if (onDashboard) return

  const map = mapRef.current
  if (!map || !position || targetLat == null || targetLng == null || !mapReady) return

  let cancelled = false

  ;(async () => {
    try {
      const google = await loadGoogleMaps()
      if (cancelled) return

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

      if (cancelled) return

      const route = result.routes?.[0]
      const leg = route?.legs?.[0]

      if (!route || !leg) {
        setDistanceKm(null)
        setEtaMin(null)
        setNextStep(null)
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

      const step = leg.steps?.[0]

      if (step) {
        const meters = step.distance?.value ?? 0
        const key = `google:${step.start_location.lat()}:${step.start_location.lng()}`
        const text =
          step.instructions?.replace(/<[^>]+>/g, '') ||
          (lang === 'ht' ? 'Kontinye sou wout la' : 'Continuez sur la route')

        setNextStep({
          key,
          text,
          distanceMeters: meters,
          icon: '⬆️',
        })
      } else {
        setNextStep(null)
      }

      const path =
        route.overview_path?.map((point: any) => ({
          lat: point.lat(),
          lng: point.lng(),
        })) ?? []

      if (!routeRef.current) {
        routeRef.current = new google.maps.Polyline({
          map,
          path,
          strokeColor: '#1479ff',
          strokeOpacity: 0.95,
          strokeWeight: 7,
        })
      } else {
        routeRef.current.setPath(path)
        routeRef.current.setMap(map)
      }
    } catch {
      if (!cancelled) {
        setDistanceKm(null)
        setEtaMin(null)
        setNextStep(null)
      }
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
  mapReady,
  onDashboard,
  lang,
  
])
  
  if (onDashboard) {
    return <div style={{padding:'14px',borderRadius:16,background:'#eef4ff',color:'#174a8b',fontWeight:800,margin:'12px 0'}}>{lang === 'fr' ? 'Ouverture automatique du GPS…' : 'GPS ap louvri otomatikman…'}</div>
  }

  if (!opened) {
    return <div className="driver-nav-launch">
      <div><small>{goingToDestination ? (lang === 'fr' ? 'DESTINATION' : 'DESTINASYON') : (lang === 'fr' ? 'ALLER VERS LE PASSAGER' : 'ALE KOTE PASAJE A')}</small><strong>{targetAddress}</strong></div>
      <button type="button" onClick={() => { setMapFailed(false); setOpened(true) }}>{lang === 'fr' ? '🧭 Réouvrir le GPS' : '🧭 Relouvri GPS'}</button>
      <style jsx>{`
        .driver-nav-launch{display:flex;justify-content:space-between;gap:12px;align-items:center;border-radius:18px;border:1px solid #dfe6ed;background:#f7fafc;padding:14px;margin:12px 0 14px}.driver-nav-launch div{min-width:0}.driver-nav-launch small,.driver-nav-launch strong{display:block}.driver-nav-launch small{font-size:10px;color:#728397;font-weight:900;letter-spacing:.05em}.driver-nav-launch strong{margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.driver-nav-launch button{border:0;border-radius:14px;background:#1479ff;color:#fff;font-weight:900;padding:12px 14px;white-space:nowrap}@media(max-width:600px){.driver-nav-launch{align-items:stretch;flex-direction:column}.driver-nav-launch button{width:100%}}
      `}</style>
    </div>
  }

  return <div className="driver-nav-shell">
    <div className="driver-nav-head">
      <div><small>{goingToDestination ? (lang === 'fr' ? 'NAVIGATION VERS LA DESTINATION' : 'NAVIGASYON POU DESTINASYON') : (lang === 'fr' ? 'NAVIGATION VERS LE PASSAGER' : 'NAVIGASYON POU PASAJE A')}</small><strong>{targetAddress}</strong></div>
      <div className="driver-nav-head-actions">
        <b>{distanceKm == null ? (mapFailed ? (lang === 'fr' ? 'Carte indisponible' : 'Kat pa disponib') : 'GPS') : `${distanceKm.toFixed(1)} km${etaMin == null ? '' : ` · ${etaMin} min`}`}</b>
        <button type="button" className={voiceEnabled ? 'voice-on' : ''} onClick={toggleVoice}>{voiceEnabled ? '🔊' : '🔇'} {lang === 'ht' ? 'Vwa' : 'Voix'}</button>
      </div>
    </div>
    {nextStep && <div className="driver-next-step"><span>{nextStep.icon}</span><div><small>{lang === 'ht' ? 'PWOCHEN DIREKSYON' : 'PROCHAINE DIRECTION'}</small><strong>{nextStep.text}</strong></div></div>}
    <div ref={containerRef} className="driver-nav-map" />
    {!mapReady && !mapFailed && <div className="driver-nav-loading">{lang === 'fr' ? 'Chargement automatique du GPS…' : 'GPS ap louvri otomatikman…'}</div>}
    {mapFailed && <div className="driver-nav-loading"><span>{lang === 'fr' ? 'La carte n’a pas pu charger.' : 'Kat la pa t ka chaje.'}</span><button type="button" onClick={() => setOpened(false)}>{lang === 'fr' ? 'Réessayer' : 'Eseye ankò'}</button></div>}
    <style jsx global>{`
      .driver-nav-shell{overflow:hidden;border-radius:20px;border:1px solid #dfe6ed;background:#fff;margin:12px 0 14px;box-shadow:0 10px 28px rgba(16,32,51,.09)}
      .driver-nav-head{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 14px;background:#102033;color:#fff}.driver-nav-head>div:first-child{min-width:0}.driver-nav-head small,.driver-nav-head strong{display:block}.driver-nav-head small{font-size:10px;color:#a9bdd0;font-weight:850;letter-spacing:.04em}.driver-nav-head strong{font-size:14px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .driver-nav-head-actions{display:flex;gap:8px;align-items:center;flex-shrink:0}.driver-nav-head-actions b{white-space:nowrap;font-size:13px;background:#1c3148;border-radius:999px;padding:8px 10px}.driver-nav-head-actions button{border:1px solid #496078;border-radius:999px;background:#1c3148;color:#fff;font-size:12px;font-weight:900;padding:8px 10px}.driver-nav-head-actions button.voice-on{background:#0d7b61;border-color:#0d7b61}
      .driver-next-step{display:flex;align-items:center;gap:12px;background:#eef6ff;border-bottom:1px solid #d9e8f8;padding:12px 14px;color:#102033}.driver-next-step>span{font-size:30px}.driver-next-step small,.driver-next-step strong{display:block}.driver-next-step small{font-size:10px;color:#58718a;font-weight:900;letter-spacing:.05em}.driver-next-step strong{font-size:15px;margin-top:3px}
      .driver-nav-map{height:340px;width:100%}.driver-nav-loading{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px 14px;color:#66778a;font-size:13px;background:#f6f8fa}.driver-nav-loading button{border:0;border-radius:10px;padding:8px 10px;background:#102033;color:#fff;font-weight:800}.driver-nav-car{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:#fff;border:3px solid #1479ff;box-shadow:0 8px 20px rgba(16,32,51,.3);font-size:22px}.driver-nav-target{font-size:29px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.25))}
      @media(max-width:600px){.driver-nav-map{height:300px}.driver-nav-head{align-items:flex-start;flex-direction:column}.driver-nav-head-actions{width:100%;justify-content:space-between}.driver-next-step strong{font-size:14px}.driver-nav-loading{align-items:flex-start;flex-direction:column}}
    `}</style>
  </div>
}
