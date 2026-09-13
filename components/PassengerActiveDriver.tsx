'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

type ActiveRideBundle = {
  ride_id: string
  ride_status: 'accepted' | 'driver_arriving' | 'in_progress'
  pickup_address?: string | null
  destination_address?: string | null
  pickup_latitude: number | null
  pickup_longitude: number | null
  destination_latitude: number | null
  destination_longitude: number | null
  estimated_fare_htg?: number | string | null
  driver_id: string | null
  driver_name: string | null
  avatar_url: string | null
  average_rating: number | string | null
  total_rides: number | null
  vehicle_type: string | null
  vehicle_make: string | null
  vehicle_model: string | null
  vehicle_color: string | null
  plate_number: string | null
  driver_latitude: number | null
  driver_longitude: number | null
}

export default function PassengerActiveDriver() {
  const pathname = usePathname()
  const isPassengerDashboard = pathname === '/' || pathname === '/passenger/dashboard'
  const [bundle, setBundle] = useState<ActiveRideBundle | null>(null)
  const [lang, setLang] = useState<'fr' | 'ht'>('fr')
  const [liveDistanceKm, setLiveDistanceKm] = useState<number | null>(null)
  const [liveEtaMin, setLiveEtaMin] = useState<number | null>(null)
  const [routeGeometry, setRouteGeometry] = useState<string | null>(null)
  const [shareNote, setShareNote] = useState('')

  useEffect(() => {
    if (!isPassengerDashboard) return
    const saved = window.localStorage.getItem('taxi-language')
    if (saved === 'ht' || saved === 'fr') setLang(saved)

    let active = true

    async function updateLiveMetrics(row: ActiveRideBundle | null) {
      if (!row || row.ride_status === 'driver_arriving' || row.driver_latitude == null || row.driver_longitude == null) {
        if (active) {
          setLiveDistanceKm(null)
          setLiveEtaMin(null)
          setRouteGeometry(null)
        }
        return
      }

      const goingToPassenger = row.ride_status === 'accepted'
      const targetLat = goingToPassenger ? row.pickup_latitude : row.destination_latitude
      const targetLng = goingToPassenger ? row.pickup_longitude : row.destination_longitude
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      if (!token || targetLat == null || targetLng == null) return

      try {
        const coords = `${row.driver_longitude},${row.driver_latitude};${targetLng},${targetLat}`
        const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?overview=full&geometries=polyline&steps=false&access_token=${encodeURIComponent(token)}`)
        const json = await response.json()
        const route = json.routes?.[0]
        if (!active) return
        if (!route) {
          setLiveDistanceKm(null)
          setLiveEtaMin(null)
          setRouteGeometry(null)
          return
        }
        setLiveDistanceKm(route.distance / 1000)
        setLiveEtaMin(Math.max(1, Math.round(route.duration / 60)))
        setRouteGeometry(route.geometry ?? null)
      } catch {
        if (active) {
          setLiveDistanceKm(null)
          setLiveEtaMin(null)
          setRouteGeometry(null)
        }
      }
    }

    async function loadFallback(): Promise<ActiveRideBundle | null> {
      const [driverResp, trackingResp] = await Promise.all([
        supabase.rpc('get_passenger_active_driver'),
        supabase.rpc('get_passenger_live_driver_tracking'),
      ])
      const driver = Array.isArray(driverResp.data) ? driverResp.data[0] : driverResp.data
      const tracking = Array.isArray(trackingResp.data) ? trackingResp.data[0] : trackingResp.data
      if (!driver || !tracking || driver.ride_id !== tracking.ride_id) return null
      return {
        ride_id: tracking.ride_id,
        ride_status: tracking.ride_status,
        pickup_latitude: tracking.pickup_latitude,
        pickup_longitude: tracking.pickup_longitude,
        destination_latitude: tracking.destination_latitude,
        destination_longitude: tracking.destination_longitude,
        driver_id: driver.driver_id,
        driver_name: driver.driver_name,
        avatar_url: driver.avatar_url,
        average_rating: driver.average_rating,
        total_rides: driver.total_rides,
        vehicle_type: driver.vehicle_type,
        vehicle_make: driver.vehicle_make,
        vehicle_model: driver.vehicle_model,
        vehicle_color: driver.vehicle_color,
        plate_number: driver.plate_number,
        driver_latitude: tracking.driver_latitude,
        driver_longitude: tracking.driver_longitude,
      } as ActiveRideBundle
    }

    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!active) return
      if (!userData.user) {
        setBundle(null)
        return
      }

      const { data, error } = await supabase.rpc('get_passenger_active_ride_bundle')
      if (!active) return

      let next = (!error ? (Array.isArray(data) ? data[0] : data) : null) as ActiveRideBundle | null
      if (!next) next = await loadFallback()
      if (!active) return

      setBundle(next)
      await updateLiveMetrics(next)
    }

    void load()

    const rideChannel = supabase
      .channel(`passenger-active-ride-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, () => {
        window.setTimeout(() => void load(), 40)
      })
      .subscribe()

    const locationChannel = supabase
      .channel(`passenger-driver-location-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_locations' }, () => {
        window.setTimeout(() => void load(), 40)
      })
      .subscribe()

    const onRideChanged = () => window.setTimeout(() => void load(), 40)
    window.addEventListener('taxi-ride-status-changed', onRideChanged)
    window.addEventListener('taxi-ride-requested', onRideChanged)
    window.addEventListener('taxi-ride-cancelled', onRideChanged)

    const timer = window.setInterval(() => void load(), 6000)
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => void load(), 80)
    })

    const languageTimer = window.setInterval(() => {
      const savedLang = window.localStorage.getItem('taxi-language')
      if (savedLang === 'ht' || savedLang === 'fr') setLang(savedLang)
    }, 700)

    return () => {
      active = false
      window.clearInterval(timer)
      window.clearInterval(languageTimer)
      window.removeEventListener('taxi-ride-status-changed', onRideChanged)
      window.removeEventListener('taxi-ride-requested', onRideChanged)
      window.removeEventListener('taxi-ride-cancelled', onRideChanged)
      authListener.subscription.unsubscribe()
      void supabase.removeChannel(rideChannel)
      void supabase.removeChannel(locationChannel)
    }
  }, [isPassengerDashboard])

  const miniMapUrl = useMemo(() => {
    if (!bundle || bundle.ride_status === 'driver_arriving' || !routeGeometry) return null
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!token || bundle.driver_latitude == null || bundle.driver_longitude == null) return null
    const goingToPassenger = bundle.ride_status === 'accepted'
    const targetLat = goingToPassenger ? bundle.pickup_latitude : bundle.destination_latitude
    const targetLng = goingToPassenger ? bundle.pickup_longitude : bundle.destination_longitude
    if (targetLat == null || targetLng == null) return null

    const path = `path-5+1b70eb-0.95(${encodeURIComponent(routeGeometry)})`
    const driverPin = `pin-s-car+1b70eb(${bundle.driver_longitude},${bundle.driver_latitude})`
    const targetPin = `pin-s-marker+102033(${targetLng},${targetLat})`
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${path},${driverPin},${targetPin}/auto/600x260@2x?padding=34&access_token=${encodeURIComponent(token)}`
  }, [bundle, routeGeometry])

  if (!isPassengerDashboard || !bundle) return null

  const name = bundle.driver_name?.trim() || (lang === 'ht' ? 'Chofè ou' : 'Votre chauffeur')
  const initial = name.charAt(0).toUpperCase()
  const vehicle = [bundle.vehicle_make, bundle.vehicle_model].filter(Boolean).join(' ') || bundle.vehicle_type || (lang === 'ht' ? 'Veyikil' : 'Véhicule')
  const color = bundle.vehicle_color?.trim() || '—'
  const plate = bundle.plate_number?.trim() || '—'
  const rating = Number(bundle.average_rating ?? 0)
  const rides = Number(bundle.total_rides ?? 0)
  const distance = liveDistanceKm == null ? 'GPS…' : `${liveDistanceKm.toFixed(1)} km`
  const eta = liveEtaMin == null ? 'ETA…' : `${liveEtaMin} min`
  const statusLabel = bundle.ride_status === 'accepted'
    ? (lang === 'ht' ? 'Chofè a ap vini' : 'Chauffeur en route')
    : bundle.ride_status === 'driver_arriving'
      ? (lang === 'ht' ? 'Chofè a rive' : 'Chauffeur arrivé')
      : (lang === 'ht' ? 'Trajè ap fèt' : 'Trajet en cours')

  const helpHref = `/passenger/help?ride=${encodeURIComponent(bundle.ride_id)}`
  const safetyHref = `/passenger/help?ride=${encodeURIComponent(bundle.ride_id)}&category=safety`

  async function shareRide() {
    const pickup = bundle?.pickup_address?.trim() || (lang === 'ht' ? 'Pwen depa a pa disponib' : 'Point de départ indisponible')
    const destination = bundle?.destination_address?.trim() || (lang === 'ht' ? 'Destinasyon an pa disponib' : 'Destination indisponible')
    const text = lang === 'ht'
      ? `M ap pataje trajè Taxi Platform Haiti mwen an.\nChofè: ${name}\nMachin: ${vehicle} (${color})\nPlak: ${plate}\nSoti: ${pickup}\nAle: ${destination}\nEstati: ${statusLabel}\nETA: ${eta}`
      : `Je partage mon trajet Taxi Platform Haiti.\nChauffeur : ${name}\nVéhicule : ${vehicle} (${color})\nPlaque : ${plate}\nDépart : ${pickup}\nDestination : ${destination}\nStatut : ${statusLabel}\nETA : ${eta}`

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Taxi Platform Haiti', text })
        setShareNote(lang === 'ht' ? 'Trajè a pare pou pataje.' : 'Trajet prêt à être partagé.')
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        setShareNote(lang === 'ht' ? 'Detay trajè a kopye.' : 'Détails du trajet copiés.')
      } else {
        setShareNote(lang === 'ht' ? 'Pataje pa disponib sou aparèy sa a.' : 'Le partage n’est pas disponible sur cet appareil.')
      }
    } catch {
      setShareNote('')
    }
    window.setTimeout(() => setShareNote(''), 2800)
  }

  return <aside className={`driverCard ${bundle.ride_status === 'driver_arriving' ? 'arrived' : ''}`} aria-live="polite">
    <div className="topLine">
      <span className="statusDot" />
      <strong>{statusLabel}</strong>
      <div className="metrics"><span>{distance}</span><span>⏱ {eta}</span></div>
    </div>

    <div className="identity">
      <div className="avatar">{bundle.avatar_url ? <img src={bundle.avatar_url} alt="" /> : <span>{initial}</span>}</div>
      <div className="driverCopy">
        <div className="nameLine"><h3>{name}</h3>{rating > 0 && <span className="rating">★ {rating.toFixed(1)}</span>}</div>
        <p>{rides > 0 ? `${rides} ${lang === 'ht' ? 'trajè' : 'trajets'}` : (lang === 'ht' ? 'Chofè Taxi Platform Haiti' : 'Chauffeur Taxi Platform Haiti')}</p>
      </div>
      <a className="helpButton" href={helpHref} aria-label={lang === 'ht' ? 'Èd' : 'Aide'}>?</a>
    </div>

    <div className="vehicleBox">
      <div><small>{lang === 'ht' ? 'Machin' : 'Véhicule'}</small><strong>{vehicle}</strong></div>
      <div><small>{lang === 'ht' ? 'Koulè' : 'Couleur'}</small><strong>{color}</strong></div>
      <div className="plate"><small>{lang === 'ht' ? 'Plak' : 'Plaque'}</small><strong>{plate}</strong></div>
    </div>

    <div className="safetyActions">
      <button type="button" className="shareRide" onClick={shareRide}>↗ {lang === 'ht' ? 'Pataje trajè' : 'Partager le trajet'}</button>
      <a className="safetyRide" href={safetyHref}>🛡 {lang === 'ht' ? 'Sekirite' : 'Sécurité'}</a>
    </div>
    {shareNote && <div className="shareNote" role="status">{shareNote}</div>}

    {bundle.ride_status === 'driver_arriving' && <div className="arrivalBanner">
      <span>✓</span>
      <div><strong>{lang === 'ht' ? 'Chofè ou rive' : 'Votre chauffeur est arrivé'}</strong><small>{lang === 'ht' ? 'Li ap tann ou nan pwen pickup la.' : 'Il vous attend au point de prise en charge.'}</small></div>
    </div>}

    {miniMapUrl && <div className="miniMap"><img src={miniMapUrl} alt={lang === 'ht' ? 'Trajektwa chofè a an dirèk' : 'Trajet en direct du chauffeur'} /></div>}

    <style jsx>{`
      .driverCard{position:fixed;left:50%;bottom:max(82px,calc(env(safe-area-inset-bottom) + 66px));transform:translateX(-50%);z-index:12050;width:min(calc(100vw - 24px),520px);background:#fff;border:1px solid #dce6f3;border-radius:22px;padding:12px;box-shadow:0 18px 48px rgba(16,32,51,.22);font-family:Inter,system-ui,sans-serif;color:#102033;box-sizing:border-box;overflow:hidden}
      .driverCard.arrived{border-color:#b9d1fa;box-shadow:0 18px 52px rgba(27,112,235,.20)}
      .topLine{display:flex;align-items:center;gap:7px;padding:1px 2px 10px}.statusDot{width:8px;height:8px;border-radius:50%;background:#1b70eb;box-shadow:0 0 0 4px #eaf2ff;flex:0 0 auto}.topLine>strong{font-size:10px;letter-spacing:.055em;text-transform:uppercase;color:#185fc2}.metrics{margin-left:auto;display:flex;gap:5px}.metrics span{display:inline-flex;align-items:center;white-space:nowrap;border-radius:999px;background:#eef4ff;color:#18324e;padding:5px 8px;font-size:10px;font-weight:850}
      .identity{display:grid;grid-template-columns:50px minmax(0,1fr) 38px;gap:10px;align-items:center;padding:2px}.avatar{width:50px;height:50px;border-radius:16px;overflow:hidden;background:linear-gradient(145deg,#e8f1ff,#d9e8ff);color:#1b70eb;display:grid;place-items:center;font-size:20px;font-weight:950}.avatar img{width:100%;height:100%;object-fit:cover}.driverCopy{min-width:0}.nameLine{display:flex;align-items:center;gap:7px;min-width:0}.nameLine h3{margin:0;font-size:16px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rating{flex:0 0 auto;border-radius:999px;background:#fff7d8;color:#8a6500;padding:3px 6px;font-size:10px;font-weight:900}.driverCopy p{margin:4px 0 0;color:#728293;font-size:10px}.helpButton{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;text-decoration:none;background:#edf4ff;color:#1b70eb;font-weight:950;font-size:17px;border:1px solid #d7e6ff}
      .vehicleBox{display:grid;grid-template-columns:1.3fr .8fr .8fr;gap:7px;margin-top:10px}.vehicleBox>div{background:#f7f9fc;border:1px solid #e1e8f0;border-radius:13px;padding:9px;min-width:0}.vehicleBox small,.vehicleBox strong{display:block}.vehicleBox small{font-size:8.5px;text-transform:uppercase;letter-spacing:.045em;color:#8794a1;font-weight:850}.vehicleBox strong{margin-top:3px;font-size:11px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.vehicleBox .plate{background:#102033;color:#fff;border-color:#102033}.vehicleBox .plate small{color:#aebbc8}.vehicleBox .plate strong{color:#fff;letter-spacing:.04em}
      .safetyActions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}.safetyActions button,.safetyActions a{min-height:40px;border-radius:13px;border:1px solid #dce6f3;font:inherit;font-size:10.5px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:5px;text-decoration:none;box-sizing:border-box}.shareRide{background:#edf4ff;color:#185fc2}.safetyRide{background:#fff6f6!important;color:#9a3030!important;border-color:#f0dddd!important}.shareNote{margin-top:6px;text-align:center;font-size:9.5px;color:#66798b;font-weight:700}
      .arrivalBanner{margin-top:9px;display:flex;align-items:center;gap:9px;border-radius:14px;background:#eef5ff;border:1px solid #cfe0fb;padding:9px 10px}.arrivalBanner>span{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#1b70eb;color:#fff;font-weight:950}.arrivalBanner div{min-width:0}.arrivalBanner strong,.arrivalBanner small{display:block}.arrivalBanner strong{font-size:12px;color:#185fc2}.arrivalBanner small{font-size:9.5px;color:#6f7f8f;margin-top:2px}
      .miniMap{margin-top:9px;border-radius:15px;overflow:hidden;background:#e8eef5;min-height:128px;border:1px solid #e0e8f2}.miniMap img{display:block;width:100%;height:150px;object-fit:cover}
      @media(max-width:600px){.driverCard{width:calc(100vw - 20px);padding:10px;border-radius:19px}.metrics span{padding:4px 6px;font-size:9px}.avatar{width:46px;height:46px;border-radius:14px}.identity{grid-template-columns:46px minmax(0,1fr) 36px;gap:8px}.nameLine h3{font-size:14px}.vehicleBox{grid-template-columns:1.2fr .8fr .8fr}.vehicleBox>div{padding:8px}.miniMap img{height:138px}}
    `}</style>
  </aside>
}
