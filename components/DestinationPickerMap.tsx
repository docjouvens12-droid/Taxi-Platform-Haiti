'use client'

import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '../lib/google-maps'
import {
  destinationFromResult,
  isHaitiPoint,
  type Destination,
  type DestinationResult,
  type Point,
} from '../lib/passenger-destination'

type Props = {
  pickup: Point | null
  candidate: Destination | null
  initialQuery: string
  lang: 'fr' | 'ht'
  onConfirm: (destination: Destination) => void
  onCancel: () => void
}

export default function DestinationPickerMap({
  pickup,
  candidate,
  initialQuery,
  lang,
  onConfirm,
  onCancel,
}: Props) {
  const ht = lang === 'ht'

  const start = useRef<Point>(
    candidate
      ? {
          lat: candidate.latitude,
          lng: candidate.longitude,
        }
      : pickup ?? {
          lat: 19.4475,
          lng: -72.6843,
        }
  )

  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const searchVersion = useRef(0)
  const activeCandidate = useRef(candidate)

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

  useEffect(() => {
    let cancelled = false
    let idleListener: any
    let dragListener: any
    let clickListener: any

    async function startGoogleMap() {
      try {
        const google = await loadGoogleMaps()

        if (cancelled || !mapContainer.current) return

        const map = new google.maps.Map(mapContainer.current, {
          center: start.current,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: true,
        })

        mapRef.current = map

        dragListener = map.addListener('dragstart', () => {
          setMoving(true)
          setConfirmedPoint(false)
          setResolved(null)
        })

        idleListener = map.addListener('idle', () => {
          const center = map.getCenter()
          if (!center) return

          setPoint({
            lat: center.lat(),
            lng: center.lng(),
          })

          setMoving(false)
          setMapReady(true)
          setMapError(false)
        })

        clickListener = map.addListener('click', (event: any) => {
          if (!event.latLng) return

          map.panTo({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          })
        })
      } catch (error) {
        console.error('Google Maps failed:', error)

        if (!cancelled) {
          setMapError(true)
          setMapReady(false)
        }
      }
    }

    void startGoogleMap()

    return () => {
      cancelled = true
      searchVersion.current++

      const google = window.google

      if (google?.maps?.event) {
        if (idleListener) google.maps.event.removeListener(idleListener)
        if (dragListener) google.maps.event.removeListener(dragListener)
        if (clickListener) google.maps.event.removeListener(clickListener)
      }

      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (moving) return

    const google = window.google
    if (!google?.maps) return

    setResolved(null)
    setConfirmedPoint(false)

    const fallback: Destination = {
      placeId: null,
      placeName: ht ? 'Pwen chwazi' : 'Point choisi',
      formattedAddress: `${
        ht ? 'Pwen chwazi' : 'Point choisi'
      } (${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}), Haïti`,
      latitude: point.lat,
      longitude: point.lng,
      placeType: 'map_pin',
      confirmationState: 'map_confirmed',
    }

    const original = activeCandidate.current

    if (
      original &&
      Math.abs(original.latitude - point.lat) < 0.0000001 &&
      Math.abs(original.longitude - point.lng) < 0.0000001
    ) {
      setResolved({
        ...original,
        confirmationState: 'map_confirmed',
      })
      return
    }

    const geocoder = new google.maps.Geocoder()

    geocoder.geocode(
      {
        location: point,
        region: 'HT',
      },
      (results: any[], status: string) => {
        if (status !== 'OK' || !results?.length) {
          setResolved(fallback)
          return
        }

        const result = results[0]

        setResolved({
          ...fallback,
          placeId: result.place_id ?? null,
          placeName:
            result.address_components?.[0]?.long_name ?? fallback.placeName,
          formattedAddress:
            result.formatted_address ?? fallback.formattedAddress,
        })
      }
    )
  }, [point.lat, point.lng, moving, ht])

  async function searchPlace() {
    const version = ++searchVersion.current

    setSearching(true)
    setSearchError(false)
    setSearchResults([])

    try {
      const google = await loadGoogleMaps()
      const map = mapRef.current

      if (!map) throw new Error('MAP_NOT_READY')

      const service = new google.maps.places.PlacesService(map)

      service.textSearch(
        {
          query: `${searchQuery}, Haïti`,
          location: {
            lat: point.lat,
            lng: point.lng,
          },
          radius: 50000,
        },
        (results: any[], status: string) => {
          if (version !== searchVersion.current) return

          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !results
          ) {
            setSearchError(true)
            setSearching(false)
            return
          }

          const converted: DestinationResult[] = results
            .filter((result: any) => result.geometry?.location)
            .map((result: any) => {
              const lat = result.geometry.location.lat()
              const lng = result.geometry.location.lng()
              const types = result.types ?? []

              const exactTypes = [
                'street_address',
                'premise',
                'subpremise',
                'point_of_interest',
                'establishment',
              ]

              const exact = types.some((type: string) =>
                exactTypes.includes(type)
              )

              return {
                id: result.place_id ?? `${lat},${lng}`,
                label:
                  result.formatted_address ||
                  result.name ||
                  `${lat}, ${lng}`,
                center: [lng, lat],

                center: [lng, lat] as [number, number],
                placeName: result.name || '',
                formattedAddress:
                  result.formatted_address ||
                  result.name ||
                  '',
                requiresMapConfirmation: !exact,
              }
            })
            .filter((result) =>
              isHaitiPoint({
                lat: result.center[1],
                lng: result.center[0],
              })
            )

          setSearchResults(converted)
          setSearching(false)
        }
      )
    } catch (error) {
      console.error('Google Places search failed:', error)

      if (version === searchVersion.current) {
        setSearchError(true)
        setSearching(false)
      }
    }
  }

  const ready =
    mapReady &&
    !mapError &&
    !moving &&
    !!resolved &&
    isHaitiPoint(point)

  return (
    <div
      className="movi-picker-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ht ? 'Chwazi pwen egzak la' : 'Choisir le point exact'}
    >
      <div ref={mapContainer} className="movi-picker-map" />

      <div className="movi-center-pin" aria-hidden="true">
        📍
      </div>

      <div className="movi-picker-head">
        <button type="button" onClick={onCancel}>
          {ht ? 'Anile' : 'Annuler'}
        </button>

        <strong>
          {ht ? 'Chwazi destinasyon an' : 'Choisissez la destination'}
        </strong>
      </div>

      <form
        className="movi-picker-search"
        onSubmit={(event) => {
          event.preventDefault()
          void searchPlace()
        }}
      >
        <input
          aria-label={ht ? 'Chèche yon kote' : 'Rechercher un lieu'}
          value={searchQuery}
          onChange={(event) => {
            searchVersion.current++
            setSearching(false)
            setSearchResults([])
            setSearchQuery(event.target.value)
          }}
        />

        <button disabled={searching || searchQuery.trim().length < 3}>
          {searching ? '…' : ht ? 'Chèche' : 'Rechercher'}
        </button>

        {searchResults.map((result) => (
          <button
            key={result.id}
            type="button"
            onClick={() => {
              const next = destinationFromResult(result)

              if (
                !isHaitiPoint({
                  lat: next.latitude,
                  lng: next.longitude,
                })
              ) {
                return
              }

              activeCandidate.current = next
              setConfirmedPoint(false)
              setResolved(null)
              setSearchResults([])

              mapRef.current?.setCenter({
                lat: next.latitude,
                lng: next.longitude,
              })

              mapRef.current?.setZoom(16)

              setPoint({
                lat: next.latitude,
                lng: next.longitude,
              })
            }}
          >
            {result.placeName || result.label}
            <small>{result.formattedAddress || result.label}</small>
          </button>
        ))}
      </form>

      <div className="movi-picker-sheet">
        <p>
          {ht
            ? 'Deplase kat la oswa klike pou chwazi pwen egzak ou vle ale a.'
            : 'Déplacez la carte ou cliquez pour choisir votre point de destination exact.'}
        </p>

        {candidate?.confirmationState === 'needs_map_confirmation' && (
          <p className="movi-pin-warning">
            {ht
              ? 'Rezilta sa a se yon zòn sèlman. Konfime pwen egzak la.'
              : 'Ce résultat désigne une zone. Confirmez le point exact.'}
          </p>
        )}

        {mapError && (
          <p role="alert">
            {ht
              ? 'Kat la pa disponib. Fèmen epi eseye ankò.'
              : 'Carte indisponible. Fermez puis réessayez.'}
          </p>
        )}

        {searchError && (
          <p role="alert">
            {ht
              ? 'Rechèch la echwe. Eseye ankò.'
              : 'La recherche a échoué. Réessayez.'}
          </p>
        )}

        <strong>{resolved?.placeName}</strong>

        <span>
          {resolved?.formattedAddress ||
            (ht ? 'N ap jwenn adrès la…' : 'Recherche de l’adresse…')}
        </span>

        <small>
          Latitude: {point.lat.toFixed(6)} · Longitude:{' '}
          {point.lng.toFixed(6)}
        </small>

        {!isHaitiPoint(point) && (
          <p role="alert">
            {ht ? 'Chwazi yon pwen an Ayiti.' : 'Choisissez un point en Haïti.'}
          </p>
        )}

        <label>
          <input
            type="checkbox"
            checked={confirmedPoint}
            disabled={!ready}
            onChange={(event) =>
              setConfirmedPoint(event.target.checked)
            }
          />

          {ht
            ? 'Pin nan sou pwen egzak mwen vle ale a.'
            : 'Le repère indique mon point de destination exact.'}
        </label>

        <button
          type="button"
          disabled={!ready || !confirmedPoint}
          onClick={() => {
            if (ready && confirmedPoint && resolved) {
              onConfirm(resolved)
            }
          }}
        >
          {ht ? 'Konfime destinasyon' : 'Confirmer la destination'}
        </button>
      </div>

      <style jsx>{`
        .movi-picker-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #e8efec;
          color: #10263c;
        }

        .movi-picker-map {
          position: absolute;
          inset: 0;
        }

        .movi-center-pin {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -100%);
          font-size: 40px;
          pointer-events: none;
          z-index: 5;
        }

        .movi-picker-head {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          display: flex;
          gap: 12px;
          align-items: center;
          background: #fff;
          padding: 10px;
          border-radius: 14px;
          z-index: 6;
        }

        .movi-picker-search {
          position: absolute;
          top: 80px;
          left: 16px;
          right: 16px;
          display: flex;
          flex-wrap: wrap;
          background: #fff;
          padding: 8px;
          border-radius: 14px;
          max-height: 25vh;
          overflow: auto;
          z-index: 6;
        }

        .movi-picker-search input {
          flex: 1;
          min-width: 100px;
          padding: 8px;
        }

        .movi-picker-search button[type='button'] {
          width: 100%;
          text-align: left;
        }

        .movi-picker-search small {
          display: block;
        }

        .movi-picker-sheet {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: #fff;
          border-radius: 24px 24px 0 0;
          padding: 16px 20px calc(20px + env(safe-area-inset-bottom));
          display: grid;
          gap: 8px;
          max-height: 45vh;
          overflow: auto;
          z-index: 6;
        }

        .movi-picker-sheet p {
          margin: 0;
          font-size: 13px;
        }

        .movi-picker-sheet label {
          font-size: 14px;
        }

        .movi-picker-sheet button {
          padding: 14px;
          background: #102f4a;
          color: white;
          border: 0;
          border-radius: 12px;
          font-weight: 800;
        }

        .movi-picker-sheet button:disabled {
          opacity: 0.45;
        }

        .movi-pin-warning {
          color: #9a4b12;
        }
      `}</style>
    </div>
  )
}