'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'

type Point = { lat: number; lng: number }
type Lang = 'fr' | 'ht'

type Props = {
  pickup: Point | null
  initialDestination: Point | null
  initialQuery: string
  lang: Lang
  onConfirm: (point: Point, label: string) => void
  onCancel: () => void
}

function mapboxLabel(feature: any) {
  const props = feature?.properties ?? {}
  const featureType = String(props.feature_type || feature?.feature_type || '')
  const full = String(props.full_address || '').trim()
  const name = String(props.name || feature?.text || '').trim()
  const context = String(props.place_formatted || '').trim()
  const label = full || (name && context ? `${name}, ${context}` : name || context)
  return { label, featureType }
}

export default function DestinationPickerMap({ pickup, initialDestination, initialQuery, lang, onConfirm, onCancel }: Props) {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [point, setPoint] = useState<Point>(initialDestination ?? pickup ?? { lat: 19.4475, lng: -72.6843 })
  const [label, setLabel] = useState(lang === 'ht' ? 'Pwen chwazi sou kat la' : 'Point choisi sur la carte')
  const [resolving, setResolving] = useState(false)
  const [preciseAddress, setPreciseAddress] = useState(false)
  const [pinAdjusted, setPinAdjusted] = useState(false)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [description, setDescription] = useState(initialQuery)
  const [searchResults, setSearchResults] = useState<Array<{ id: string; label: string; center: [number, number] }>>([])
  const [searching, setSearching] = useState(false)

  async function searchPlace() {
    const query = searchQuery.trim()
    if (query.length < 3) return
    setSearching(true)
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, { cache: 'no-store' })
      const json = response.ok ? await response.json() : null
      setSearchResults(Array.isArray(json?.results) ? json.results : [])
    } catch { setSearchResults([]) }
    finally { setSearching(false) }
  }

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!token || !mapContainer.current || mapRef.current) return

    mapboxgl.accessToken = token
    const start = initialDestination ?? pickup ?? { lat: 19.4475, lng: -72.6843 }
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [start.lng, start.lat],
      zoom: initialDestination ? 16 : 14.5,
      attributionControl: false,
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
    if (!initialDestination) {
      const normalized = initialQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      const city = [
        { pattern: /saint[ -]mar[qc]|senmak/, query: 'Saint-Marc' },
        { pattern: /gonaives|gonayiv/, query: 'Les Gonaïves' },
        { pattern: /port[ -]au[ -]prince|potoprens/, query: 'Port-au-Prince' },
        { pattern: /cap[ -]haitien|okap/, query: 'Cap-Haïtien' },
        { pattern: /petion[ -]ville|petyonvil/, query: 'Pétion-Ville' },
        { pattern: /jacmel|jakmel/, query: 'Jacmel' },
        { pattern: /les cayes|okay/, query: 'Les Cayes' },
      ].find(item => item.pattern.test(normalized))
      if (city) void fetch(`/api/geocode?q=${encodeURIComponent(city.query)}`, { cache: 'no-store' })
        .then(response => response.json())
        .then(json => { const center = json.results?.[0]?.center; if (mapRef.current === map && Array.isArray(center) && center.length >= 2) map.flyTo({ center: [Number(center[0]), Number(center[1])], zoom: 13 }) })
        .catch(() => {})
    }

    if (pickup) {
      const el = document.createElement('div')
      el.className = 'movi-pickup-dot'
      new mapboxgl.Marker({ element: el }).setLngLat([pickup.lng, pickup.lat]).addTo(map)
    }

    const syncCenter = () => {
      const center = map.getCenter()
      setPoint({ lat: center.lat, lng: center.lng })
    }
    map.on('move', syncCenter)
    map.on('moveend', syncCenter)
    map.on('dragstart', () => setPinAdjusted(true))

    return () => {
      map.off('move', syncCenter)
      map.off('moveend', syncCenter)
      map.remove()
      mapRef.current = null
    }
  }, [pickup, initialDestination])

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!token) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setResolving(true)
      setPreciseAddress(false)
      const fallback = lang === 'ht'
        ? `Pwen chwazi (${point.lat.toFixed(5)}, ${point.lng.toFixed(5)})`
        : `Point choisi (${point.lat.toFixed(5)}, ${point.lng.toFixed(5)})`

      try {
        const mapboxParams = new URLSearchParams({
          longitude: String(point.lng),
          latitude: String(point.lat),
          access_token: token,
          language: 'fr',
          country: 'ht',
        })
        const mapboxResponse = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?${mapboxParams.toString()}`, { signal: controller.signal, cache: 'no-store' })
        const mapboxJson = mapboxResponse.ok ? await mapboxResponse.json() : null
        const features = Array.isArray(mapboxJson?.features) ? mapboxJson.features : []
        const preciseFeature = features.find((feature: any) => {
          const type = String(feature?.properties?.feature_type || feature?.feature_type || '')
          return type === 'address' || type === 'street'
        })

        if (preciseFeature) {
          const precise = mapboxLabel(preciseFeature).label
          if (precise) {
            setLabel(precise)
            setPreciseAddress(true)
            return
          }
        }

        const firstFeature = features[0]
        const broad = firstFeature ? mapboxLabel(firstFeature).label : ''
        setLabel(broad || fallback)
      } catch {
        if (!controller.signal.aborted) setLabel(fallback)
      } finally {
        if (!controller.signal.aborted) setResolving(false)
      }
    }, 500)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [point.lat, point.lng, lang])

  const title = lang === 'ht' ? 'Chwazi destinasyon an' : 'Choisissez la destination'
  const hint = lang === 'ht' ? 'Deplase kat la pou mete pin nan egzakteman kote ou prale.' : 'Déplacez la carte pour placer le repère exactement à votre destination.'
  const confirm = lang === 'ht' ? 'Konfime destinasyon' : 'Confirmer la destination'
  const cancel = lang === 'ht' ? 'Anile' : 'Annuler'
  const numberedAddress = /^\s*\d+\b/.test(description)
  const needsPinAdjustment = numberedAddress && !preciseAddress && !pinAdjusted

  return (
    <div className="movi-picker-overlay">
      <div ref={mapContainer} className="movi-picker-map" />
      <div className="movi-center-pin" aria-hidden="true"><span>●</span></div>
      <div className="movi-picker-head">
        <button onClick={onCancel} aria-label={cancel}>×</button>
        <div><strong>{title}</strong><small>{hint}</small></div>
      </div>
      <form className="movi-picker-search" onSubmit={event => { event.preventDefault(); void searchPlace() }}>
        <input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder={lang === 'ht' ? 'Chèche yon adrès oswa vil an Ayiti' : 'Chercher une adresse ou une ville en Haïti'} />
        <button type="submit" disabled={searching || searchQuery.trim().length < 3}>{searching ? '…' : '⌕'}</button>
        {searchResults.length > 0 && <div className="movi-picker-results">{searchResults.map(result => <button key={result.id} type="button" onClick={() => { mapRef.current?.flyTo({ center: result.center, zoom: 16 }); setDescription(result.label.replace(/\n/g, ', ')); setSearchResults([]) }}>{result.label}</button>)}</div>}
      </form>
      <button type="button" className="movi-picker-haiti" onClick={() => mapRef.current?.flyTo({ center: [-72.65, 19.05], zoom: 7 })}>{lang === 'ht' ? 'Gade tout Ayiti' : 'Voir toute Haïti'}</button>
      <div className="movi-picker-sheet">
        <div className="movi-grabber" />
        <small>{lang === 'ht' ? 'DESTINASYON' : 'DESTINATION'}</small>
        <strong>{resolving ? (lang === 'ht' ? 'N ap jwenn adrès la…' : 'Recherche de l’adresse…') : label}</strong>
        <input className="movi-picker-description" value={description} onChange={event => setDescription(event.target.value)} placeholder={lang === 'ht' ? 'Non adrès oswa kote a' : 'Nom de l’adresse ou du lieu'} aria-label={lang === 'ht' ? 'Deskripsyon destinasyon an' : 'Description de la destination'} />
        {needsPinAdjustment && <p className="movi-pin-warning">{lang === 'ht' ? 'Kat la jwenn vil la sèlman. Deplase kat la pou mete pin nan sou adrès egzak la.' : 'La carte n’a trouvé que la ville. Déplacez-la pour placer le repère sur l’adresse exacte.'}</p>}
        <button disabled={resolving || needsPinAdjustment} onClick={() => onConfirm(point, description.trim() || label)}>{confirm}</button>
      </div>
      <style jsx global>{`
        .movi-picker-overlay{position:fixed;inset:0;z-index:9999;background:#e8efec;font-family:Inter,system-ui,sans-serif}
        .movi-picker-map{position:absolute;inset:0}
        .movi-picker-head{position:absolute;top:max(18px,env(safe-area-inset-top));left:16px;right:16px;display:flex;gap:12px;align-items:center;z-index:4;pointer-events:none}
        .movi-picker-head button{pointer-events:auto;width:48px;height:48px;border:0;border-radius:50%;background:#fff;color:#10263c;font-size:30px;line-height:1;box-shadow:0 8px 24px rgba(16,38,60,.18)}
        .movi-picker-head div{background:rgba(255,255,255,.96);border-radius:18px;padding:10px 14px;box-shadow:0 8px 24px rgba(16,38,60,.14);max-width:calc(100% - 64px)}
        .movi-picker-head strong,.movi-picker-head small{display:block}.movi-picker-head strong{font-size:16px;color:#10263c}.movi-picker-head small{margin-top:2px;font-size:11px;line-height:1.3;color:#6c7d76}
        .movi-picker-search{position:absolute;top:calc(max(18px,env(safe-area-inset-top)) + 72px);left:16px;right:16px;z-index:5;display:grid;grid-template-columns:1fr 48px;background:#fff;border-radius:15px;padding:4px;box-shadow:0 8px 24px rgba(16,38,60,.16)}.movi-picker-search input{min-width:0;border:0;padding:10px;font-size:14px;outline:none}.movi-picker-search>button{border:0;border-radius:11px;background:#0f705a;color:#fff;font-size:25px}.movi-picker-search>button:disabled{opacity:.5}.movi-picker-results{grid-column:1/-1;display:grid;max-height:190px;overflow:auto}.movi-picker-results button{border:0;border-top:1px solid #e5ece9;background:#fff;padding:10px;text-align:left;font-size:12px;color:#10263c}.movi-picker-haiti{position:absolute;right:16px;bottom:230px;z-index:5;border:0;border-radius:999px;background:#fff;color:#0f705a;padding:9px 12px;font-size:11px;font-weight:900;box-shadow:0 8px 24px rgba(16,38,60,.16)}
        .movi-center-pin{position:absolute;left:50%;top:50%;transform:translate(-50%,-100%);z-index:3;width:48px;height:48px;border-radius:50% 50% 50% 0;rotate:-45deg;background:#0f705a;border:4px solid #fff;box-shadow:0 8px 24px rgba(0,0,0,.28);display:grid;place-items:center;pointer-events:none}
        .movi-center-pin span{rotate:45deg;color:#fff;font-size:18px}
        .movi-picker-sheet{position:absolute;left:0;right:0;bottom:0;z-index:4;background:#fff;border-radius:28px 28px 0 0;padding:12px 20px calc(20px + env(safe-area-inset-bottom));box-shadow:0 -10px 30px rgba(16,38,60,.14)}
        .movi-grabber{width:48px;height:5px;border-radius:999px;background:#d5dfdc;margin:0 auto 16px}.movi-picker-sheet>small{display:block;color:#0f705a;font-weight:900;letter-spacing:.16em;font-size:11px}.movi-picker-sheet>strong{display:block;margin:6px 0 10px;color:#10263c;font-size:18px;line-height:1.25}.movi-picker-description{width:100%;box-sizing:border-box;margin-bottom:12px;padding:12px;border:1px solid #dce7e3;border-radius:12px;font-size:13px;color:#10263c}.movi-pin-warning{margin:0 0 12px;color:#9a4b12;font-size:12px;font-weight:750;line-height:1.35}.movi-picker-sheet>button{width:100%;border:0;border-radius:18px;padding:17px;background:#102f4a;color:#fff;font-size:17px;font-weight:900}.movi-picker-sheet>button:disabled{opacity:.5;cursor:not-allowed}
        .movi-pickup-dot{width:20px;height:20px;border-radius:50%;background:#1f7ae0;border:4px solid #fff;box-shadow:0 4px 12px rgba(16,38,60,.3)}
      `}</style>
    </div>
  )
}
