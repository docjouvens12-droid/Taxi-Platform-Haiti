'use client'

import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '../lib/google-maps'

type Point = { lat: number; lng: number }

type Props = {
  pickup: Point | null
  driver: Point | null
  target: Point | null
  route: { type: 'LineString'; coordinates: number[][] } | null
  previewDestination: Point | null
  routeApproximate: boolean
  rideKey: string
}

export default function PassengerLiveMap(props: Props) {
  const container = useRef<HTMLDivElement>(null)

  const mapRef = useRef<any>(null)
  const driverMarkerRef = useRef<any>(null)
  const destinationMarkerRef = useRef<any>(null)
  const pickupMarkerRef = useRef<any>(null)
  const routeRef = useRef<any>(null)

  const latest = useRef(props)
  latest.current = props

  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function startMap() {
      try {
        const google = await loadGoogleMaps()

        if (cancelled || !container.current) return

        const initial =
          latest.current.pickup ??
          latest.current.previewDestination ??
          { lat: 18.5392, lng: -72.3364 }

        const map = new google.maps.Map(container.current, {
          center: initial,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        })

        mapRef.current = map

        pickupMarkerRef.current = new google.maps.Marker({
          map,
          position: initial,
          title: 'Position',
        })

        destinationMarkerRef.current = new google.maps.Marker({
          map: null,
          title: 'Destination',
        })
        driverMarkerRef.current = new google.maps.Marker({
  map: null,
  position: initial,
  title: 'Chauffeur',
  label: {
    text: '🚕',
    fontSize: '24px',
  },
})
        routeRef.current = new google.maps.Polyline({
          map,
          path: [],
          strokeColor: '#2563eb',
          strokeOpacity: 0.9,
          strokeWeight: 5,
        })

        if (!cancelled) {
          setFailed(false)
          setReady(true)
        }
      } catch (error) {
        console.error('Google Maps failed to load:', error)

        if (!cancelled) {
          setFailed(true)
          setReady(false)
        }
      }
    }

    void startMap()

    return () => {
      cancelled = true

      if (driverMarkerRef.current) {
        if ('map' in driverMarkerRef.current) {
          driverMarkerRef.current.map = null
        } else {
          driverMarkerRef.current.setMap?.(null)
        }
      }

      destinationMarkerRef.current?.setMap?.(null)
      pickupMarkerRef.current?.setMap?.(null)
      routeRef.current?.setMap?.(null)

      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!ready || !mapRef.current) return

    const google = window.google
    if (!google?.maps) return

    const {
      pickup,
      driver,
      target,
      route,
      previewDestination,
      routeApproximate,
    } = props

    const map = mapRef.current
    const destination = driver
      ? target
      : previewDestination ?? pickup

    if (pickup) {
      pickupMarkerRef.current?.setPosition?.(pickup)
      pickupMarkerRef.current?.setMap?.(map)
    } else {
      pickupMarkerRef.current?.setMap?.(null)
    }

    if (destination) {
      destinationMarkerRef.current?.setPosition?.(destination)
      destinationMarkerRef.current?.setMap?.(map)
    } else {
      destinationMarkerRef.current?.setMap?.(null)
    }

    if (driver) {
      if ('position' in driverMarkerRef.current) {
        driverMarkerRef.current.position = driver
        driverMarkerRef.current.map = map
      } else {
        driverMarkerRef.current?.setPosition?.(driver)
        driverMarkerRef.current?.setMap?.(map)
      }
    } else if (driverMarkerRef.current) {
      if ('map' in driverMarkerRef.current) {
        driverMarkerRef.current.map = null
      } else {
        driverMarkerRef.current.setMap?.(null)
      }
    }

    const routePath =
      route?.coordinates?.map(([lng, lat]) => ({
        lat,
        lng,
      })) ?? []

    routeRef.current?.setPath?.(routePath)
    routeRef.current?.setOptions?.({
      strokeColor: driver ? '#0f705a' : '#2563eb',
      strokeOpacity: routeApproximate && !driver ? 0.55 : 0.9,
      strokeWeight: 5,
    })

    const bounds = new google.maps.LatLngBounds()

    if (pickup) bounds.extend(pickup)
    if (driver) bounds.extend(driver)
    if (destination) bounds.extend(destination)

    routePath.forEach((point) => bounds.extend(point))

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 70)

      const listener = google.maps.event.addListenerOnce(
        map,
        'idle',
        () => {
          if ((map.getZoom?.() ?? 0) > 16) {
            map.setZoom(16)
          }
        }
      )

      return () => {
        google.maps.event.removeListener(listener)
      }
    }
  }, [
    ready,
    props.pickup?.lat,
    props.pickup?.lng,
    props.driver?.lat,
    props.driver?.lng,
    props.target?.lat,
    props.target?.lng,
    props.previewDestination?.lat,
    props.previewDestination?.lng,
    props.route,
    props.routeApproximate,
    props.rideKey,
  ])

  return (
    <>
      <div
        ref={container}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          minHeight: 300,
        }}
      />

      {failed && (
        <div
          role="status"
          style={{
            padding: 30,
            position: 'relative',
            zIndex: 2,
          }}
        >
          Carte indisponible. Réessayez en rechargeant la page.
        </div>
      )}
    </>
  )
}
