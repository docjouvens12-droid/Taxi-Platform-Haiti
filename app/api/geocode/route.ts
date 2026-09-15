import { NextRequest, NextResponse } from 'next/server'

type Result = { id: string; label: string; center: [number, number]; featureType?: string }

const SEARCH_TYPES = 'address,street,neighborhood,locality,place,district,region'
const PRECISE_TYPES = new Set(['address', 'street'])

const KNOWN_CITY_FALLBACKS: Array<{ keys: string[]; label: string; center: [number, number] }> = [
  { keys: ['les gonaives', 'gonaives', 'gonayiv'], label: 'Les Gonaïves, Artibonite, Haïti', center: [-72.6843, 19.4475] },
  { keys: ['port au prince', 'potoprens'], label: 'Port-au-Prince, Ouest, Haïti', center: [-72.3364, 18.5392] },
  { keys: ['delmas'], label: 'Delmas, Ouest, Haïti', center: [-72.2962, 18.5447] },
  { keys: ['petion ville', 'petion-ville', 'petyonvil'], label: 'Pétion-Ville, Ouest, Haïti', center: [-72.2852, 18.5125] },
  { keys: ['cap haitien', 'cap-haitien', 'okap'], label: 'Cap-Haïtien, Nord, Haïti', center: [-72.1982, 19.7594] },
  { keys: ['saint marc', 'saint-marc', 'saint marq', 'senmak'], label: 'Saint-Marc, Artibonite, Haïti', center: [-72.7000, 19.1082] },
  { keys: ['jacmel', 'jakmel'], label: 'Jacmel, Sud-Est, Haïti', center: [-72.5370, 18.2343] },
  { keys: ['les cayes', 'okay'], label: 'Les Cayes, Sud, Haïti', center: [-73.7500, 18.2000] },
]

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function completeLabel(props: any, fallbackName = '') {
  const name = String(props?.name || fallbackName || '').trim()
  const fullAddress = String(props?.full_address || '').trim()
  const placeFormatted = String(props?.place_formatted || '').trim()
  if (fullAddress && normalize(fullAddress) !== normalize(name)) return fullAddress
  if (name && placeFormatted && !normalize(placeFormatted).startsWith(normalize(name))) return `${name}, ${placeFormatted}`
  return fullAddress || placeFormatted || name || 'Destination'
}

function looksLikeStreetAddress(query: string) {
  const q = normalize(query)
  const hasNumber = /(^|\s)\d+[a-z]?(\s|$)/i.test(q)
  const hasStreetWord = /\b(rue|ruelle|route|avenue|av|boulevard|bd|impasse|chemin|road|street|st)\b/i.test(q)
  return hasNumber || hasStreetWord
}

function buildAddressVariants(query: string) {
  const clean = query.trim().replace(/\s+/g, ' ')
  const variants = new Set<string>([clean])
  if (!/ha[iï]ti/i.test(clean)) variants.add(`${clean}, Haïti`)

  const withoutHouseNumber = clean.replace(/^\s*\d+[a-z]?\s*[,\-]?\s*/i, '').trim()
  if (withoutHouseNumber && normalize(withoutHouseNumber) !== normalize(clean)) {
    variants.add(withoutHouseNumber)
    if (!/ha[iï]ti/i.test(withoutHouseNumber)) variants.add(`${withoutHouseNumber}, Haïti`)
  }

  const normalized = normalize(clean)
  const knownCities = ['gonaives', 'les gonaives', 'port au prince', 'cap haitien', 'saint marc', 'saint marq', 'jacmel', 'les cayes', 'petion ville', 'delmas']
  for (const city of knownCities) {
    const index = normalized.lastIndexOf(city)
    if (index > 0) {
      const wordsBeforeCity = clean.slice(0, Math.min(clean.length, index)).trim().replace(/[,:-]+$/g, '')
      if (wordsBeforeCity) {
        variants.add(`${wordsBeforeCity}, ${city}, Haïti`)
        const streetOnly = wordsBeforeCity.replace(/^\s*\d+[a-z]?\s*[,\-]?\s*/i, '').trim()
        if (streetOnly) variants.add(`${streetOnly}, ${city}, Haïti`)
      }
    }
  }
  return Array.from(variants)
}

function knownCityFallback(query: string): Result | null {
  const normalizedQuery = normalize(query)
  const match = KNOWN_CITY_FALLBACKS.find(city => city.keys.some(key => normalizedQuery.includes(normalize(key))))
  if (!match) return null
  return {
    id: `fallback-${normalize(match.label).replace(/\s+/g, '-')}`,
    label: match.label,
    center: match.center,
    featureType: 'place',
  }
}

function exactKnownCity(query: string): Result | null {
  const q = normalize(query)
  for (const city of KNOWN_CITY_FALLBACKS) {
    const label = normalize(city.label)
    if (q === label || city.keys.some(key => {
      const k = normalize(key)
      return q === k || q === `${k} haiti` || q === `${k} artibonite haiti` || q === `${k} ouest haiti` || q === `${k} nord haiti`
    })) {
      return {
        id: `city-${normalize(city.label).replace(/\s+/g, '-')}`,
        label: city.label,
        center: city.center,
        featureType: 'place',
      }
    }
  }
  return null
}

function queryTokens(query: string) {
  return normalize(query)
    .split(' ')
    .filter(token => token.length >= 3 && !['haiti', 'artibonite', 'ouest', 'nord', 'sud', 'centre', 'departement'].includes(token))
}

export async function GET(request: NextRequest) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const lat = searchParams.has('lat') ? Number(searchParams.get('lat')) : NaN
  const lng = searchParams.has('lng') ? Number(searchParams.get('lng')) : NaN

  if (!token) return NextResponse.json({ results: [], error: 'MAPBOX_TOKEN_MISSING' }, { status: 500 })
  if (q.length < 3) return NextResponse.json({ results: [] })

  const addressLike = looksLikeStreetAddress(q)
  if (!addressLike) {
    const exactCity = exactKnownCity(q)
    if (exactCity) return NextResponse.json({ results: [exactCity], query: q, precise: false, fallback: false })
  }

  const proximity = Number.isFinite(lat) && Number.isFinite(lng) ? `${lng},${lat}` : null

  async function searchMapboxV6(query: string, useTypes = true): Promise<Result[]> {
    const params = new URLSearchParams({ q: query, access_token: token as string, country: 'ht', autocomplete: 'true', limit: '10', language: 'fr' })
    if (useTypes) params.set('types', SEARCH_TYPES)
    if (proximity) params.set('proximity', proximity)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    try {
      const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`, { signal: controller.signal, cache: 'no-store' })
      if (!response.ok) return []
      const json = await response.json()
      return (json.features ?? []).flatMap((f: any) => {
        const center = f.geometry?.coordinates
        if (!Array.isArray(center) || center.length < 2) return []
        const props = f.properties ?? {}
        return [{ id: f.id || props.mapbox_id || `${center[0]},${center[1]}`, label: completeLabel(props, props.name || f.name || ''), center: [Number(center[0]), Number(center[1])] as [number, number], featureType: props.feature_type || f.feature_type || '' }]
      })
    } catch { return [] } finally { clearTimeout(timeout) }
  }

  async function searchMapboxSearchBox(query: string): Promise<Result[]> {
    const params = new URLSearchParams({ q: query, access_token: token as string, country: 'HT', language: 'fr', limit: '10' })
    if (proximity) params.set('proximity', proximity)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    try {
      const response = await fetch(`https://api.mapbox.com/search/searchbox/v1/forward?${params.toString()}`, { signal: controller.signal, cache: 'no-store' })
      if (!response.ok) return []
      const json = await response.json()
      return (json.features ?? []).flatMap((f: any) => {
        const props = f.properties ?? {}
        const geometryCenter = f.geometry?.coordinates
        const propertyCenter = Number.isFinite(Number(props.coordinates?.longitude)) && Number.isFinite(Number(props.coordinates?.latitude)) ? [Number(props.coordinates.longitude), Number(props.coordinates.latitude)] : null
        const center = Array.isArray(geometryCenter) && geometryCenter.length >= 2 ? geometryCenter : propertyCenter
        if (!Array.isArray(center) || center.length < 2) return []
        return [{ id: f.id || props.mapbox_id || `searchbox-${center[0]},${center[1]}`, label: completeLabel(props, props.name || ''), center: [Number(center[0]), Number(center[1])] as [number, number], featureType: props.feature_type || f.feature_type || '' }]
      })
    } catch { return [] } finally { clearTimeout(timeout) }
  }

  try {
    const variants = buildAddressVariants(q).slice(0, 4)
    const mapboxBatches = await Promise.all([...variants.map(variant => searchMapboxV6(variant, true)), searchMapboxV6(q, false)])
    const hasMapboxPrecise = mapboxBatches.some(batch => batch.some(result => PRECISE_TYPES.has(result.featureType || '')))
    const extraBatches = addressLike && !hasMapboxPrecise
      ? await Promise.all([searchMapboxSearchBox(q)])
      : []
    const batches: Result[][] = [...mapboxBatches, ...extraBatches]

    const deduped = new Map<string, Result>()
    for (const batch of batches) {
      for (const result of batch) {
        const key = `${result.center[0].toFixed(6)},${result.center[1].toFixed(6)}|${normalize(result.label)}`
        if (!deduped.has(key)) deduped.set(key, result)
      }
    }

    let results = Array.from(deduped.values())
    const normalizedQuery = normalize(q)
    const tokens = queryTokens(q)

    const toRad = (value: number) => value * Math.PI / 180
    const distance = (result: Result) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 0
      const dLat = toRad(result.center[1] - lat)
      const dLng = toRad(result.center[0] - lng)
      const lat1 = toRad(lat)
      const lat2 = toRad(result.center[1])
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
      return 6371 * 2 * Math.asin(Math.sqrt(a))
    }

    const typeRank = (type = '') => ({ address: 0, street: 1, neighborhood: 2, locality: 3, place: 4, district: 5, region: 6 } as Record<string, number>)[type] ?? 7

    if (addressLike) {
      const precise = results.filter(result => PRECISE_TYPES.has(result.featureType || ''))
      if (precise.length) results = precise
      else results = []
    } else {
      const relevant = results.filter(result => {
        const label = normalize(result.label)
        if (label.includes(normalizedQuery)) return true
        return tokens.length > 0 && tokens.every(token => label.includes(token))
      })
      results = relevant.length ? relevant : results.filter(result => ['place', 'locality', 'neighborhood'].includes(result.featureType || ''))
    }

    results = [...results].sort((a, b) => {
      const aLabel = normalize(a.label)
      const bLabel = normalize(b.label)
      const aMatches = aLabel.includes(normalizedQuery) ? 0 : 1
      const bMatches = bLabel.includes(normalizedQuery) ? 0 : 1
      if (aMatches !== bMatches) return aMatches - bMatches
      const aType = typeRank(a.featureType)
      const bType = typeRank(b.featureType)
      if (aType !== bType) return aType - bType
      return distance(a) - distance(b)
    })

    const displayResults = results.slice(0, addressLike ? 8 : 6)

    return NextResponse.json({ results: displayResults, query: q, precise: addressLike && results.some(result => result.featureType === 'address'), fallback: false })
  } catch {
    return NextResponse.json({ results: [], error: 'GEOCODE_FAILED' }, { status: 502 })
  }
}
