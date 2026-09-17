'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { destinationFromResult, isHaitiPoint, type Destination, type DestinationResult, type Point } from '../lib/passenger-destination'

type Props = {
  pickup: Point | null
  candidate: Destination | null
  initialQuery: string
  lang: 'fr' | 'ht'
  onConfirm: (destination: Destination) => void
  onCancel: () => void
}

export default function DestinationPickerMap({ pickup, candidate, initialQuery, lang, onConfirm, onCancel }: Props) {
  const ht = lang === 'ht'
  const start = useRef<Point>(candidate ? { lat: candidate.latitude, lng: candidate.longitude } : pickup ?? { lat: 19.4475, lng: -72.6843 })
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const searchVersion = useRef(0)
  const [point, setPoint] = useState(start.current)
  const [resolved, setResolved] = useState<Destination | null>(null)
  const [confirmedPoint, setConfirmedPoint] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [moving, setMoving] = useState(false)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [searchResults, setSearchResults] = useState<DestinationResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const activeCandidate = useRef(candidate)

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!token || !mapContainer.current) { setMapError(true); return }
    let map: mapboxgl.Map
    try {
      map = new mapboxgl.Map({ container: mapContainer.current, accessToken: token, style: 'mapbox://styles/mapbox/streets-v12', center: [start.current.lng, start.current.lat], zoom: 16 })
    } catch { setMapError(true); return }
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
    map.on('load', () => { setMapReady(true); setMapError(false) })
    map.on('error', () => setMapError(true))
    map.on('movestart', () => { setMoving(true); setConfirmedPoint(false); setResolved(null) })
    map.on('moveend', () => {
      const center = map.getCenter()
      setPoint({ lat: center.lat, lng: center.lng })
      setMoving(false)
    })
    map.on('click', event => map.easeTo({ center: event.lngLat, duration: 0 }))
    return () => { searchVersion.current++; map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    if (moving) return
    const controller = new AbortController()
    setResolved(null)
    setConfirmedPoint(false)
    const fallback: Destination = {
      placeId: null, placeName: ht ? 'Pwen chwazi' : 'Point choisi',
      formattedAddress: `${ht ? 'Pwen chwazi' : 'Point choisi'} (${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}), Haïti`,
      latitude: point.lat, longitude: point.lng, placeType: 'map_pin', confirmationState: 'map_confirmed',
    }
    const timer = window.setTimeout(async () => {
      const original = activeCandidate.current
      if (original && Math.abs(original.latitude - point.lat) < 0.0000001 && Math.abs(original.longitude - point.lng) < 0.0000001) {
        setResolved({ ...original, confirmationState: 'map_confirmed' })
        return
      }
      try {
        const params = new URLSearchParams({ latitude: String(point.lat), longitude: String(point.lng), access_token: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '', language: 'fr', country: 'ht' })
        const response = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?${params}`, { signal: controller.signal, cache: 'no-store' })
        const json = response.ok ? await response.json() : null
        if (controller.signal.aborted) return
        const props = json?.features?.[0]?.properties
        const address = props?.full_address || [props?.name, props?.place_formatted].filter(Boolean).join(', ')
        setResolved({ ...fallback, formattedAddress: address || fallback.formattedAddress })
      } catch { if (!controller.signal.aborted) setResolved(fallback) }
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [point.lat, point.lng, moving, ht])

  async function searchPlace() {
    const version = ++searchVersion.current
    setSearching(true); setSearchError(false); setSearchResults([])
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('SEARCH_FAILED')
      const json = await response.json()
      if (version === searchVersion.current) setSearchResults(json.results ?? [])
    } catch { if (version === searchVersion.current) setSearchError(true) }
    finally { if (version === searchVersion.current) setSearching(false) }
  }

  const ready = mapReady && !mapError && !moving && !!resolved && isHaitiPoint(point)
  return <div className="movi-picker-overlay" role="dialog" aria-modal="true" aria-label={ht ? 'Chwazi pwen egzak la' : 'Choisir le point exact'}>
    <div ref={mapContainer} className="movi-picker-map" />
    <div className="movi-center-pin" aria-hidden="true">📍</div>
    <div className="movi-picker-head"><button type="button" onClick={onCancel}>{ht ? 'Anile' : 'Annuler'}</button><strong>{ht ? 'Chwazi destinasyon an' : 'Choisissez la destination'}</strong></div>
    <form className="movi-picker-search" onSubmit={event => { event.preventDefault(); void searchPlace() }}>
      <input aria-label={ht ? 'Chèche yon kote' : 'Rechercher un lieu'} value={searchQuery} onChange={event => { searchVersion.current++; setSearching(false); setSearchResults([]); setSearchQuery(event.target.value) }} />
      <button disabled={searching || searchQuery.trim().length < 3}>{searching ? '…' : (ht ? 'Chèche' : 'Rechercher')}</button>
      {searchResults.map(result => <button key={result.id} type="button" onClick={() => {
        const next = destinationFromResult(result)
        if (!isHaitiPoint({ lat: next.latitude, lng: next.longitude })) return
        activeCandidate.current = next; setConfirmedPoint(false); setResolved(null); setSearchResults([])
        mapRef.current?.jumpTo({ center: result.center, zoom: 16 })
        setPoint({ lat: next.latitude, lng: next.longitude })
      }}>{result.placeName || result.label}<small>{result.formattedAddress || result.label}</small></button>)}
    </form>
    <div className="movi-picker-sheet">
      <p>{ht ? 'Deplase kat la oswa klike pou chwazi pwen egzak ou vle ale a.' : 'Déplacez la carte ou cliquez pour choisir votre point de destination exact.'}</p>
      {candidate?.confirmationState === 'needs_map_confirmation' && <p className="movi-pin-warning">{ht ? 'Rezilta sa a se yon zòn sèlman. Konfime pwen egzak la.' : 'Ce résultat désigne une zone. Confirmez le point exact.'}</p>}
      {mapError && <p role="alert">{ht ? 'Kat la pa disponib. Fèmen epi eseye ankò.' : 'Carte indisponible. Fermez puis réessayez.'}</p>}
      {searchError && <p role="alert">{ht ? 'Rechèch la echwe. Eseye ankò.' : 'La recherche a échoué. Réessayez.'}</p>}
      <strong>{resolved?.placeName}</strong><span>{resolved?.formattedAddress || (ht ? 'N ap jwenn adrès la…' : 'Recherche de l’adresse…')}</span>
      <small>Latitude: {point.lat.toFixed(6)} · Longitude: {point.lng.toFixed(6)}</small>
      {!isHaitiPoint(point) && <p role="alert">{ht ? 'Chwazi yon pwen an Ayiti.' : 'Choisissez un point en Haïti.'}</p>}
      <label><input type="checkbox" checked={confirmedPoint} disabled={!ready} onChange={event => setConfirmedPoint(event.target.checked)} />{ht ? 'Pin nan sou pwen egzak mwen vle ale a.' : 'Le repère indique mon point de destination exact.'}</label>
      <button type="button" disabled={!ready || !confirmedPoint} onClick={() => { if (ready && confirmedPoint && resolved) onConfirm(resolved) }}>{ht ? 'Konfime destinasyon' : 'Confirmer la destination'}</button>
    </div>
    <style jsx>{`
      .movi-picker-overlay{position:fixed;inset:0;z-index:9999;background:#e8efec;color:#10263c}.movi-picker-map{position:absolute;inset:0}.movi-center-pin{position:absolute;left:50%;top:50%;transform:translate(-50%,-100%);font-size:40px;pointer-events:none}.movi-picker-head{position:absolute;top:16px;left:16px;right:16px;display:flex;gap:12px;align-items:center;background:#fff;padding:10px;border-radius:14px}.movi-picker-search{position:absolute;top:80px;left:16px;right:16px;display:flex;flex-wrap:wrap;background:#fff;padding:8px;border-radius:14px;max-height:25vh;overflow:auto}.movi-picker-search input{flex:1;min-width:100px;padding:8px}.movi-picker-search button[type=button]{width:100%;text-align:left}.movi-picker-search small{display:block}.movi-picker-sheet{position:absolute;bottom:0;left:0;right:0;background:#fff;border-radius:24px 24px 0 0;padding:16px 20px calc(20px + env(safe-area-inset-bottom));display:grid;gap:8px;max-height:45vh;overflow:auto}.movi-picker-sheet p{margin:0;font-size:13px}.movi-picker-sheet label{font-size:14px}.movi-picker-sheet button{padding:14px;background:#102f4a;color:white;border:0;border-radius:12px;font-weight:800}.movi-picker-sheet button:disabled{opacity:.45}.movi-pin-warning{color:#9a4b12}
    `}</style>
  </div>
}
