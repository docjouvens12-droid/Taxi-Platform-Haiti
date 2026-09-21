'use client'

import dynamic from 'next/dynamic'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import DestinationPickerMap from '../components/DestinationPickerMap'
import { destinationFromResult, destinationReady, destinationRpcFields, type Destination, type DestinationResult } from '../lib/passenger-destination'
import PassengerDestinationDetails from '../components/PassengerDestinationDetails'
import { loadGoogleMaps } from '../lib/google-maps' 
import { usePassengerRide } from '../components/PassengerRideProvider'
import PassengerRideStatusFlow from '../components/PassengerRideStatusFlow'
import PassengerPendingRideCancel from '../components/PassengerPendingRideCancel'

const TaxiMap = dynamic(() => import('../components/TaxiMap'), { ssr: false })

type Lang = 'fr' | 'ht'
type Panel = 'home' | 'rides' | 'payment' | 'profile' | 'driver' | 'help'
type RideOption = { id: 'moto' | 'standard' | 'comfort'; name: string; detailFr: string; detailHt: string; eta: string }
type Point = { lat: number; lng: number }
const isHaitiPoint = (point: Point) => point.lat >= 17.8 && point.lat <= 20.1 && point.lng >= -74.7 && point.lng <= -71.5
const haitiTestPickup: Point = { lat: 18.5440, lng: -72.3030 }
type Quote = { distance_km: number; duration_min: number; fare_htg: number }
type SearchResult = DestinationResult
type RouteGeometry = { type: 'LineString'; coordinates: number[][] }
type RideHistory = { id: string; status: string; pickup_address: string; destination_address: string; final_fare_htg: number | null; estimated_fare_htg: number | null; requested_at: string }

const rideOptions: RideOption[] = [
  { id: 'moto', name: 'Moto', detailFr: '1 passager', detailHt: '1 pasaje', eta: '3 min' },
  { id: 'standard', name: 'Standard', detailFr: 'Jusqu’à 4 passagers', detailHt: 'Jiska 4 pasaje', eta: '5 min' },
  { id: 'comfort', name: 'Comfort', detailFr: 'Plus d’espace', detailHt: 'Plis espas', eta: '7 min' },
]

const localPricing = {
  moto: { base: 150, perKm: 35, perMin: 5, minimum: 200 },
  standard: { base: 250, perKm: 55, perMin: 7, minimum: 350 },
  comfort: { base: 400, perKm: 75, perMin: 10, minimum: 550 },
} as const

const copy = {
  fr: {
    tagline: 'Déplacez-vous facilement, en toute sécurité', welcome: 'BON RETOUR', createPassenger: 'CRÉER UN COMPTE PASSAGER', signInTitle: 'Connectez-vous pour commander un taxi', signUpTitle: 'Inscrivez-vous comme passager', fullName: 'Nom complet', email: 'E-mail', password: 'Mot de passe', wait: 'Veuillez patienter…', signIn: 'Se connecter', createAccount: 'Créer mon compte', noAccount: 'Pas encore de compte ? Créez-en un', haveAccount: 'Vous avez déjà un compte ? Connectez-vous', accountCreated: 'Compte créé. Vérifiez votre e-mail pour confirmer votre adresse, puis connectez-vous.', hello: 'Bonjour', where: 'Où allez-vous ?', drivers: 'Chauffeurs disponibles', pickup: 'Lieu de prise en charge', current: 'Ma position actuelle', testPosition: 'Port-au-Prince (position de test)', destination: 'Destination', destinationPlaceholder: 'Saisissez une adresse ou un lieu en Haïti', searchingAddress: 'Recherche des adresses…', chooseService: 'Choisissez le service', vehicles: 'Véhicules disponibles', chooseDestination: 'Choisissez une destination', payment: 'Paiement', change: 'Changer ›', searchingDriver: 'Nous cherchons un chauffeur pour vous…', trip: 'trajet', calculating: 'Calcul du prix…', sending: 'Envoi de la demande…', request: 'Commander', mapNote: 'Carte, recherche et itinéraire : Mapbox. Prix et création du trajet : Supabase.',
    menu: 'Menu', home: 'Accueil', myRides: 'Mes trajets', profile: 'Profil', becomeDriver: 'Devenir chauffeur', language: 'Langue', help: 'Aide', logout: 'Se déconnecter', recentRides: 'Vos trajets récents', noRides: 'Vous n’avez encore aucun trajet.', loadingRides: 'Chargement de vos trajets…', backHome: 'Retour à l’accueil', paymentTitle: 'Moyens de paiement', currentPayment: 'Moyen de paiement actuel', paymentNote: 'Choisissez MonCash ou NatCash.', profileTitle: 'Mon profil', passengerAccount: 'Compte passager', driverTitle: 'Conduisez avec MOVI', driverText: 'L’inscription chauffeur permettra d’envoyer vos documents, votre permis et les informations de votre véhicule pour validation.', driverCta: 'Commencer l’inscription chauffeur', helpTitle: 'Centre d’aide', helpText: 'Besoin d’aide avec un trajet, un paiement ou votre compte ? Le centre d’assistance sera connecté ici.', helpCta: 'Contacter l’assistance', french: 'Français', creole: 'Kreyòl'
  },
  ht: {
    tagline: 'Deplase fasil, deplase an sekirite', welcome: 'BYENVINI ANKÒ', createPassenger: 'KREYE KONT PASAJE', signInTitle: 'Konekte pou mande taksi', signUpTitle: 'Enskri kòm pasaje', fullName: 'Non konplè', email: 'Imel', password: 'Modpas', wait: 'Tanpri tann…', signIn: 'Konekte', createAccount: 'Kreye kont mwen', noAccount: 'Ou poko gen kont? Kreye youn', haveAccount: 'Ou deja gen kont? Konekte', accountCreated: 'Kont lan kreye. Tcheke imel ou pou konfime adrès la, epi konekte.', hello: 'Bonjou', where: 'Ki kote ou prale?', drivers: 'Chofè disponib', pickup: 'Kote pou pran ou', current: 'Pozisyon aktyèl mwen', testPosition: 'Port-au-Prince (pozisyon tès)', destination: 'Destinasyon', destinationPlaceholder: 'Ekri yon adrès oswa yon kote an Ayiti', searchingAddress: 'N ap chèche adrès yo…', chooseService: 'Chwazi sèvis la', vehicles: 'Machin ki disponib', chooseDestination: 'Chwazi destinasyon', payment: 'Peman', change: 'Chanje ›', searchingDriver: 'N ap chèche yon chofè pou ou…', trip: 'trajè', calculating: 'N ap kalkile pri…', sending: 'N ap voye demann lan…', request: 'Mande', mapNote: 'Kat, rechèch ak routage: Mapbox. Pri ak kreyasyon trajè: Supabase.',
    menu: 'Meni', home: 'Akèy', myRides: 'Trajè mwen yo', profile: 'Pwofil', becomeDriver: 'Vin chofè', language: 'Lang', help: 'Èd', logout: 'Dekonekte', recentRides: 'Dènye trajè ou yo', noRides: 'Ou poko gen okenn trajè.', loadingRides: 'N ap chaje trajè ou yo…', backHome: 'Retounen sou akèy', paymentTitle: 'Metòd peman', currentPayment: 'Metòd peman aktyèl', paymentNote: 'Chwazi MonCash oswa NatCash.', profileTitle: 'Pwofil mwen', passengerAccount: 'Kont pasaje', driverTitle: 'Kondwi ak MOVI', driverText: 'Enskripsyon chofè a ap pèmèt ou voye dokiman, lisans ak enfòmasyon machin ou pou verifikasyon.', driverCta: 'Kòmanse enskripsyon chofè', helpTitle: 'Sant èd', helpText: 'Ou bezwen èd ak yon trajè, peman oswa kont ou? Sant asistans lan ap konekte isit la.', helpCta: 'Kontakte asistans', french: 'Français', creole: 'Kreyòl'
  }
}

function LanguageMenu({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) {
  const [open, setOpen] = useState(false)
  return <div className="language-menu">
    <button className="language-trigger" onClick={() => setOpen(!open)} aria-expanded={open}>🌐 {lang === 'fr' ? 'Français' : 'Kreyòl'} <span>⌄</span></button>
    {open && <div className="language-options">
      <button className={lang === 'fr' ? 'active' : ''} onClick={() => { onChange('fr'); setOpen(false) }}>🇫🇷 Français {lang === 'fr' ? '✓' : ''}</button>
      <button className={lang === 'ht' ? 'active' : ''} onClick={() => { onChange('ht'); setOpen(false) }}>🇭🇹 Kreyòl {lang === 'ht' ? '✓' : ''}</button>
    </div>}
  </div>
}

export default function HomePage() {
  const { ride: currentRide, loading: rideLoading, error: rideSyncError, refresh: refreshRide, dismiss: dismissRide } = usePassengerRide()
  const requestBusy = useRef(false)
  
  const [lang, setLang] = useState<Lang>('fr')
  const t = copy[lang]
  const [user, setUser] = useState<User | null>(null)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authBusy, setAuthBusy] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pickup, setPickup] = useState(copy.fr.current)
  const [pickupCoords, setPickupCoords] = useState<Point | null>(null)
  const [pickupStatus, setPickupStatus] = useState<'loading' | 'ready' | 'outside' | 'unavailable'>('loading')
  const [paymentMethod, setPaymentMethod] = useState<'moncash' | 'natcash'>('moncash')
  useEffect(() => {
    const sync = () => setPaymentMethod(localStorage.getItem('taxi-payment-method') === 'natcash' ? 'natcash' : 'moncash')
    sync()
    window.addEventListener('taxi-payment-method-change', sync)
    return () => window.removeEventListener('taxi-payment-method-change', sync)
  }, [])
  const [destination, setDestination] = useState('')
  const [destinationPickerOpen, setDestinationPickerOpen] = useState(false)
  const [destinationCoords, setDestinationCoords] = useState<Point | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const [mapCandidate, setMapCandidate] = useState<Destination | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchBusy, setSearchBusy] = useState(false)
  const [searchCompletedQuery, setSearchCompletedQuery] = useState('')
  const [selectedStreetPoint, setSelectedStreetPoint] = useState(false)
  const [routeGeometry, setRouteGeometry] = useState<RouteGeometry | null>(null)
  const [routeApproximate, setRouteApproximate] = useState(false)
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null)
  const [routeDurationMin, setRouteDurationMin] = useState<number | null>(null)
  const [selectedRide, setSelectedRide] = useState<RideOption['id']>('standard')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [requestState, setRequestState] = useState<'idle' | 'quoting' | 'requesting' | 'searching'>('idle')
  const [rideId, setRideId] = useState<string | null>(null)
  const [rideError, setRideError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [panel, setPanel] = useState<Panel>('home')
  const [rides, setRides] = useState<RideHistory[]>([])
  const [ridesBusy, setRidesBusy] = useState(false)

  const effectiveDestinationCoords = destinationReady(selectedDestination) ? destinationCoords : null
  const ride = useMemo(() => rideOptions.find((o) => o.id === selectedRide) ?? rideOptions[1], [selectedRide])
  const fallbackQuote = useMemo<Quote | null>(() => {
    if (!pickupCoords || !effectiveDestinationCoords || !isHaitiPoint(pickupCoords) || !isHaitiPoint(effectiveDestinationCoords)) return null

    let distanceKm = routeDistanceKm
    let durationMin = routeDurationMin

    if (distanceKm == null || durationMin == null) {
      const toRad = (value: number) => value * Math.PI / 180
      const dLat = toRad(effectiveDestinationCoords.lat - pickupCoords.lat)
      const dLng = toRad(effectiveDestinationCoords.lng - pickupCoords.lng)
      const lat1 = toRad(pickupCoords.lat)
      const lat2 = toRad(effectiveDestinationCoords.lat)
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
      distanceKm = Math.round((6371 * 2 * Math.asin(Math.sqrt(a))) * 100) / 100
      durationMin = Math.max(5, Math.ceil(distanceKm * 3.2))
    }

    const p = localPricing[selectedRide]
    const fare = Math.max(p.minimum, p.base + distanceKm * p.perKm + durationMin * p.perMin)
    return { distance_km: distanceKm, duration_min: durationMin, fare_htg: Math.round(fare * 100) / 100 }
  }, [pickupCoords, effectiveDestinationCoords, routeDistanceKm, routeDurationMin, selectedRide])
  const effectiveQuote = quote ?? fallbackQuote

  useEffect(() => {
    const saved = window.localStorage.getItem('taxi-language') as Lang | null
    if (saved === 'fr' || saved === 'ht') { setLang(saved); setPickup(copy[saved].current) }
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => listener.subscription.unsubscribe()
  }, [])

  function changeLanguage(next: Lang) {
    setLang(next)
    window.localStorage.setItem('taxi-language', next)
    setPickup((current) => current === copy.fr.current || current === copy.ht.current ? copy[next].current : current)
  }

  function openPanel(next: Panel) {
    setPanel(next)
    setMenuOpen(false)
    if (next === 'rides') loadRides()
  }

  async function loadRides() {
    setRidesBusy(true)
    const { data } = await supabase.from('rides').select('id,status,pickup_address,destination_address,final_fare_htg,estimated_fare_htg,requested_at').order('requested_at', { ascending: false }).limit(20)
    setRides((data ?? []) as RideHistory[])
    setRidesBusy(false)
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setPickupCoords(haitiTestPickup)
      setPickup(copy[lang].testPosition)
      setPickupStatus('ready')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const point = { lat: p.coords.latitude, lng: p.coords.longitude }
      setPickupCoords(point)
       setPickup(copy[lang].current)
        setPickupStatus('ready')
      },
      () => { setPickupStatus('unavailable') },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [lang])

  useEffect(() => {
    const query = destination.trim()
    if (query.length < 3 || destinationCoords) {
      setSearchResults([])
      setSearchBusy(false)
      return
    }

    let cancelled = false
    let controller: AbortController | null = null
    const timer = window.setTimeout(async () => {
      controller = new AbortController()
      const abortTimer = window.setTimeout(() => controller?.abort(), 12500)
      setSearchBusy(true)

      try {
        const params = new URLSearchParams({ q: query })
        if (pickupCoords) {
          params.set('lat', String(pickupCoords.lat))
          params.set('lng', String(pickupCoords.lng))
        }
        const response = await fetch(`/api/geocode?${params.toString()}`, { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error(`GEOCODE_${response.status}`)
        const json = await response.json()
        if (cancelled) return
        setSearchResults((json.results ?? []) as SearchResult[])
        setSearchCompletedQuery(query)
      } catch {
        if (!cancelled) { setSearchResults([]); setSearchCompletedQuery(query) }
      } finally {
        window.clearTimeout(abortTimer)
        if (!cancelled) setSearchBusy(false)
      }
    }, 800)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      controller?.abort()
    }
  }, [destination, destinationCoords, pickupCoords, lang])

useEffect(() => {
  if (
    !pickupCoords ||
    !effectiveDestinationCoords ||
    !isHaitiPoint(pickupCoords) ||
    !isHaitiPoint(effectiveDestinationCoords)
  ) {
    setRouteGeometry(null)
    setRouteApproximate(false)
    setRouteDistanceKm(null)
    setRouteDurationMin(null)
    return
  }

  let cancelled = false

  setRouteGeometry(null)
  setRouteApproximate(false)
  setRouteDistanceKm(null)
  setRouteDurationMin(null)

  ;(async () => {
    try {
      const google = await loadGoogleMaps()
      const directionsService = new google.maps.DirectionsService()

      const result = await directionsService.route({
        origin: {
          lat: pickupCoords.lat,
          lng: pickupCoords.lng,
        },
        destination: {
          lat: effectiveDestinationCoords.lat,
          lng: effectiveDestinationCoords.lng,
        },
        travelMode: google.maps.TravelMode.DRIVING,
        region: 'HT',
      })

      if (cancelled) return

      const route = result.routes?.[0]
      const leg = route?.legs?.[0]

      if (!route || !leg) {
        throw new Error('ROUTE_UNAVAILABLE')
      }

      const coordinates =
        route.overview_path?.map((point: any) => [
          point.lng(),
          point.lat(),
        ]) ?? []

      setRouteGeometry({
        type: 'LineString',
        coordinates,
      })

      setRouteApproximate(false)

      setRouteDistanceKm(
        leg.distance?.value != null
          ? leg.distance.value / 1000
          : null
      )

      setRouteDurationMin(
        leg.duration?.value != null
          ? Math.max(1, Math.round(leg.duration.value / 60))
          : null
      )
    } catch (error) {
      console.error('Google Directions failed:', error)

      if (!cancelled) {
        setRouteGeometry(null)
        setRouteApproximate(false)
        setRouteDistanceKm(null)
        setRouteDurationMin(null)
      }
    }
  })()

  return () => {
    cancelled = true
  }
}, [pickupCoords, effectiveDestinationCoords])
  useEffect(() => {
    if (!user || !pickupCoords || !effectiveDestinationCoords || !isHaitiPoint(pickupCoords) || !isHaitiPoint(effectiveDestinationCoords)) { setQuote(null); return }
    let cancelled = false
    let timeoutId: number | undefined

    const runQuote = async () => {
      setRideError('')
      if (!fallbackQuote) setRequestState((s) => (s === 'searching' || s === 'requesting') ? s : 'quoting')

      const args = {
        p_service_type: selectedRide,
        p_pickup_latitude: pickupCoords.lat,
        p_pickup_longitude: pickupCoords.lng,
        p_destination_latitude: effectiveDestinationCoords.lat,
        p_destination_longitude: effectiveDestinationCoords.lng,
      }

      const withTimeout = async () => {
        const request = supabase.rpc('quote_ride', args)
        const timeout = new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error('QUOTE_TIMEOUT')), 8000)
        })
        return Promise.race([request, timeout])
      }

      try {
        let result: any
        try {
          result = await withTimeout()
        } catch {
          if (cancelled) return
          if (timeoutId) window.clearTimeout(timeoutId)
          timeoutId = undefined
          result = await withTimeout()
        }

        if (cancelled) return
        const { data, error } = result
        if (error) throw error
        const row = Array.isArray(data) ? data[0] : data
        if (!row) throw new Error('QUOTE_EMPTY')
        setQuote({ distance_km: Number(row.distance_km), duration_min: Number(row.duration_min), fare_htg: Number(row.fare_htg) })
      } catch (error: any) {
        if (cancelled) return
        if (!fallbackQuote) {
          setQuote(null)
          const timeout = error?.message === 'QUOTE_TIMEOUT'
          setRideError(timeout
            ? (lang === 'ht' ? 'Kalkil pri a pran twòp tan. Tanpri chwazi destinasyon an ankò oswa eseye ankò.' : 'Le calcul du prix prend trop de temps. Veuillez sélectionner de nouveau la destination ou réessayer.')
            : (error?.message || (lang === 'ht' ? 'Nou pa rive kalkile pri a. Tanpri eseye ankò.' : 'Impossible de calculer le prix. Veuillez réessayer.')))
        }
      } finally {
        if (timeoutId) window.clearTimeout(timeoutId)
        if (!cancelled) setRequestState((s) => (s === 'searching' || s === 'requesting') ? s : 'idle')
      }
    }

    void runQuote()
    return () => {
      cancelled = true
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [user, pickupCoords, effectiveDestinationCoords, selectedRide, lang, fallbackQuote])

  async function submitAuth(e: FormEvent) {
    e.preventDefault(); setAuthBusy(true); setAuthMessage('')
    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
      if (error) setAuthMessage(error.message)
      else if (data.user && data.session) setUser(data.user)
      else if (!data.session) setAuthMessage(t.accountCreated)
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setAuthMessage(error.message)
      else if (data.user) setUser(data.user)
    }
    setAuthBusy(false)
  }

  function chooseSearchResult(result: SearchResult) {
    const coords = { lng: result.center[0], lat: result.center[1] }
    if (!isHaitiPoint(coords)) return
    const candidate = destinationFromResult(result)
    setQuote(null); setRouteGeometry(null); setRouteDistanceKm(null); setRouteDurationMin(null)
    candidate.confirmationState = 'map_confirmed'
    setMapCandidate(candidate)
    
    setRouteGeometry(null); setRouteApproximate(false)
    const streetLine = destination.replace(/\bport[-\s]?au[-\s]?prince\b/gi, '').replace(/\s+/g, ' ').trim()
setDestination(result.label + '\n' + streetLine)
    setDestinationCoords(coords)
    setSelectedDestination(candidate)
    setSelectedStreetPoint(false)
    setSearchResults([])
    setSearchCompletedQuery('')
    setRideError('')
  }

  function freshPassengerPosition(): Promise<Point> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('GEOLOCATION_UNAVAILABLE')); return }
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => reject(new Error('GEOLOCATION_FAILED')),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      )
    })
  }

  function newRide() {
    dismissRide()
    setDestination(''); setDestinationCoords(null); setSelectedDestination(null); setMapCandidate(null)
    setQuote(null); setRouteGeometry(null); setRouteDistanceKm(null); setRouteDurationMin(null)
    setSearchResults([]);  setRideId(null); setRideError(''); setRequestState('idle')
  }

  async function requestRide() {
    if (!user || !effectiveDestinationCoords || !destinationReady(selectedDestination)) return
    if (requestBusy.current) return
    requestBusy.current = true
    try {
    setRequestState('requesting'); setRideError('')
    let requestPickup: Point
    try {
      requestPickup = await freshPassengerPosition()
      if (!isHaitiPoint(requestPickup)) requestPickup = haitiTestPickup
      setPickupCoords(requestPickup)
      setPickupStatus('ready')
      setPickup(copy[lang].current)
    } catch {
      if (!pickupCoords) {
        setRideError(lang === 'ht' ? 'Nou pa ka jwenn pozisyon GPS pasaje a. Tanpri aktive Lokalizasyon epi eseye ankò.' : 'Impossible d’obtenir la position GPS du passager. Activez la localisation puis réessayez.')
        setRequestState('idle')
        return
      }
      requestPickup = pickupCoords
    }

    const { data: freshQuoteData, error: freshQuoteError } = await supabase.rpc('quote_ride', {
      p_service_type: selectedRide,
      p_pickup_latitude: requestPickup.lat,
      p_pickup_longitude: requestPickup.lng,
      p_destination_latitude: effectiveDestinationCoords.lat,
      p_destination_longitude: effectiveDestinationCoords.lng,
    })
    if (freshQuoteError) {
      setRideError(freshQuoteError.message)
      setRequestState('idle')
      return
    }
    const freshRow = Array.isArray(freshQuoteData) ? freshQuoteData[0] : freshQuoteData
    if (!freshRow) {
      setRideError(lang === 'ht' ? 'Nou pa rive kalkile kous la ak nouvo pozisyon GPS la.' : 'Impossible de calculer la course avec la nouvelle position GPS.')
      setRequestState('idle')
      return
    }
    const freshQuote: Quote = {
      distance_km: Number(freshRow.distance_km),
      duration_min: Number(freshRow.duration_min),
      fare_htg: Number(freshRow.fare_htg),
    }
    setQuote(freshQuote)

    const { data, error } = await supabase.rpc('request_passenger_ride_precise', {
      p_service_type: selectedRide,
      p_pickup_address: copy[lang].current,
      p_pickup_latitude: requestPickup.lat,
      p_pickup_longitude: requestPickup.lng,
      ...destinationRpcFields(selectedDestination),
      p_estimated_distance_km: freshQuote.distance_km,
      p_estimated_duration_min: freshQuote.duration_min,
      p_estimated_fare_htg: freshQuote.fare_htg,
    })
    if (error) { setRideError(error.message); setRequestState('idle'); return }
    setRideId(String(data)); setRequestState('searching'); refreshRide()
    } catch {
      setRideError(lang === 'ht' ? 'Demann lan pa konfime. Verifye koneksyon an.' : 'Demande non confirmée. Vérifiez votre connexion.')
      refreshRide()
      setRequestState('idle')
    } finally { requestBusy.current = false }
  }

  if (!user) return <main className="auth-shell"><section className="auth-card">
    <div className="auth-language-row"><LanguageMenu lang={lang} onChange={changeLanguage} /></div>
    <div className="auth-brand"><span className="brand-mark">M</span><div><strong>MOVI</strong><small>{t.tagline}</small></div></div>
    <p className="eyebrow">{authMode === 'signin' ? t.welcome : t.createPassenger}</p>
    <h1>{authMode === 'signin' ? t.signInTitle : t.signUpTitle}</h1>
    <form onSubmit={submitAuth} className="auth-form">
      {authMode === 'signup' && <label>{t.fullName}<input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></label>}
      <label>{t.email}<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label>{t.password}<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required /></label>
      {authMessage && <div className="auth-message">{authMessage}</div>}
      <button className="auth-submit" disabled={authBusy}>{authBusy ? t.wait : authMode === 'signin' ? t.signIn : t.createAccount}</button>
    </form>
    <button className="auth-switch" onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>{authMode === 'signin' ? t.noAccount : t.haveAccount}</button>
  </section></main>;

  const panelContent = panel !== 'home' && <section className="account-panel">
    <div className="panel-header"><button onClick={() => setPanel('home')}>‹</button><strong>{panel === 'rides' ? t.myRides : panel === 'payment' ? t.paymentTitle : panel === 'profile' ? t.profileTitle : panel === 'driver' ? t.becomeDriver : t.helpTitle}</strong><span /></div>
    {panel === 'rides' && <div className="panel-body"><h2>{t.recentRides}</h2>{ridesBusy ? <p className="muted">{t.loadingRides}</p> : rides.length === 0 ? <div className="empty-state">🚕<strong>{t.noRides}</strong></div> : <div className="history-list">{rides.map((r) => <div className="history-card" key={r.id}><div><strong>{r.pickup_address}</strong><span>→</span><strong>{r.destination_address}</strong></div><small>{new Date(r.requested_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'fr-HT')} · {r.status}</small><b>{Number(r.final_fare_htg ?? r.estimated_fare_htg ?? 0).toLocaleString('fr-FR')} HTG</b></div>)}</div>}</div>}
    {panel === 'payment' && <div className="panel-body"><h2>{t.paymentTitle}</h2><div className="feature-card"><span className="feature-icon">📱</span><div><small>{t.currentPayment}</small><strong>{paymentMethod === 'natcash' ? 'NatCash' : 'MonCash'}</strong></div><span>✓</span></div><p className="muted">{t.paymentNote}</p></div>}
    {panel === 'profile' && <div className="panel-body"><h2>{t.profileTitle}</h2><div className="profile-avatar">{(user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? 'U').toUpperCase()}</div><div className="profile-info"><small>{t.passengerAccount}</small><strong>{user.user_metadata?.full_name || '—'}</strong><span>{user.email}</span></div></div>}
    {panel === 'driver' && <div className="panel-body promo-panel"><div className="promo-icon">🚘</div><h2>{t.driverTitle}</h2><p>{t.driverText}</p><button className="primary-panel-button">{t.driverCta}</button></div>}
    {panel === 'help' && <div className="panel-body promo-panel"><div className="promo-icon">💬</div><h2>{t.helpTitle}</h2><p>{t.helpText}</p><button className="primary-panel-button">{t.helpCta}</button></div>}
  </section>

  return <main className="shell"><section className="phone-frame">
    {panelContent}
    <div className={`app-underlay ${panel !== 'home' ? 'panel-hidden' : ''}`}>
      <div className="map-panel real-map-panel"><TaxiMap pickup={pickupCoords} destination={effectiveDestinationCoords} routeGeometry={routeGeometry} routeApproximate={routeApproximate} />
        <div className="topbar"><button className="round-button" onClick={() => setMenuOpen(true)}>☰</button><div className="brand-chip"><span className="brand-mark">M</span><div><strong>MOVI</strong><small>{t.tagline}</small></div></div><button className="round-button" onClick={() => openPanel('profile')}>👤</button></div>
      </div>
      <section className="booking-sheet"><div className="grabber" />
        {rideSyncError && <p role="alert">{lang === 'ht' ? 'Estati kous la pa ajou. N ap eseye ankò.' : 'Actualisation du trajet indisponible. Nouvelle tentative en cours.'}<button type="button" onClick={refreshRide}>{lang === 'ht' ? 'Eseye ankò' : 'Réessayer'}</button></p>}
        {rideLoading && <p role="status">{t.wait}</p>}
        {currentRide?.status === 'requested' && <PassengerPendingRideCancel lang={lang} />}
        {currentRide && currentRide.status !== 'requested' && <PassengerRideStatusFlow key={currentRide.id} ride={currentRide} ht={lang === 'ht'} onDismiss={newRide} />}
        {!currentRide && !rideLoading && <>
        <div className="greeting-row"><div><p className="eyebrow">{t.hello} {user.user_metadata?.full_name?.split(' ')[0] ?? ''} 👋</p><h1>{t.where}</h1></div><span className="online-pill">{t.drivers}</span></div>
        <div className="route-card">
          <div className="route-line"><span className="pickup-dot" /><div className="input-wrap"><label>{t.pickup}</label><input value={pickupStatus === 'outside' ? (lang === 'ht' ? 'GPS deyò Ayiti' : 'GPS hors d’Haïti') : pickup} readOnly /></div></div>
          <div className="connector" />
          <div className="route-line"><span className="destination-dot" /><div className="input-wrap">
            <label>{t.destination}</label>
            <input
              value={destinationCoords ? destination.split('\n')[0] : destination}
              autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="search"
              disabled={requestState === 'requesting'}
              onChange={(e) => { setDestination(e.target.value); setDestinationCoords(null); setSelectedDestination(null); setMapCandidate(null); setSelectedStreetPoint(false); setSearchCompletedQuery(''); setRouteGeometry(null); setRouteApproximate(false); setRouteDistanceKm(null); setRouteDurationMin(null); setQuote(null); setRideError('') }}
              placeholder={t.destinationPlaceholder}
            />
            {destinationCoords && destination.includes('\n') && (
              <span style={{ display: 'block', marginTop: 4, fontSize: 14, fontWeight: 700, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
                {destination.split('\n').slice(1).join('\n')}
              </span>
            )}
          </div></div>
        </div>
        {selectedDestination && <PassengerDestinationDetails destination={selectedDestination} ht={lang === 'ht'} />}
        {(searchBusy || searchResults.length > 0) && <div className="search-results">{searchBusy && <div className="search-status">{t.searchingAddress}</div>}{searchResults.map((r) => <button key={r.id} onClick={() => chooseSearchResult(r)}><span>📍</span><span><strong>{r.label}</strong><small>{r.featureType === 'address' ? (lang === 'ht' ? 'Adrès sou kat la' : 'Adresse sur la carte') : r.featureType === 'street' ? (lang === 'ht' ? 'Pwen nan ri a · nimewo kay pa verifye' : 'Point dans la rue · numéro non vérifié') : destination}</small></span></button>)}</div>}
        {selectedStreetPoint && <div className="movi-address-note">{lang === 'ht' ? 'Ou chwazi ri a. Nimewo kay la rete nan adrès demann nan, men pin nan se yon pwen nan ri a.' : 'Vous avez choisi la rue. Le numéro reste dans la demande, mais le repère indique un point dans cette rue.'}</div>}
        
         
        
        <div className="section-heading"><div><p className="eyebrow">{t.chooseService}</p><h2>{t.vehicles}</h2></div></div>
        <div className="ride-list">{rideOptions.map((option) => <button key={option.id} className={`ride-option ${selectedRide === option.id ? 'selected' : ''}`} onClick={() => setSelectedRide(option.id)}><span className="ride-icon">{option.id === 'moto' ? '🏍️' : option.id === 'comfort' ? '🚙' : '🚕'}</span><span className="ride-copy"><strong>{option.name}</strong><small>{lang === 'fr' ? option.detailFr : option.detailHt} · {option.eta}</small></span><strong className="ride-price">{selectedRide === option.id && effectiveQuote ? `${effectiveQuote.fare_htg.toLocaleString('fr-FR')} HTG` : '—'}</strong></button>)}</div>
        <div className="payment-row"><div><span className="payment-icon">📱</span><div><small>{t.payment}</small><strong>{paymentMethod === 'natcash' ? 'NatCash' : 'MonCash'}</strong></div></div><button onClick={() => openPanel('payment')}>{t.change}</button></div>
        {rideError && <div className="ride-error">{rideError}</div>}
        {requestState === 'searching' ? <div className="searching-card"><div className="spinner" /><div><strong>{t.searchingDriver}</strong><small>{ride.name} · {t.trip} #{rideId?.slice(0, 8)}</small></div></div> : <button className="request-button" disabled={!destinationReady(selectedDestination) || !effectiveQuote || rideSyncError || requestState === 'requesting'} onClick={requestRide}><span>{requestState === 'requesting' ? t.sending : !destinationReady(selectedDestination) ? t.chooseDestination : effectiveQuote ? `${t.request} ${ride.name}` : t.calculating}</span><strong>{effectiveQuote ? `${effectiveQuote.fare_htg.toLocaleString('fr-FR')} HTG` : '—'}</strong></button>}
        <p className="fine-print">{t.mapNote}</p>
      </>}</section>
    </div>
      
    {menuOpen && <><button className="drawer-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} /><aside className="nav-drawer">
      <div className="drawer-head"><div className="drawer-brand"><span className="brand-mark">M</span><div><strong>MOVI</strong><small>{t.menu}</small></div></div><button onClick={() => setMenuOpen(false)}>×</button></div>
      <div className="drawer-user"><div className="drawer-avatar">{(user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? 'U').toUpperCase()}</div><div><strong>{user.user_metadata?.full_name || t.passengerAccount}</strong><small>{user.email}</small></div></div>
      <nav className="drawer-nav">
        <button className="active" onClick={() => openPanel('home')}><span>🏠</span>{t.home}<b>›</b></button>
        <button onClick={() => openPanel('rides')}><span>🧾</span>{t.myRides}<b>›</b></button>
        <button onClick={() => openPanel('profile')}><span>👤</span>{t.profile}<b>›</b></button>
        <button onClick={() => openPanel('payment')}><span>💳</span>{t.payment}<b>›</b></button>
        <div className="drawer-language"><span>🌐</span><div><small>{t.language}</small><LanguageMenu lang={lang} onChange={changeLanguage} /></div></div>
        <button onClick={() => openPanel('help')}><span>❓</span>{t.help}<b>›</b></button>
      </nav>
      <button className="drawer-logout" onClick={() => supabase.auth.signOut()}>↪ {t.logout}</button>
    </aside></>}
  </section></main>
}
