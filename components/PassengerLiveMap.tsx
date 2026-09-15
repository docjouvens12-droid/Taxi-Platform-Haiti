'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map, Marker, GeoJSONSource } from 'mapbox-gl'

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
  const map = useRef<Map | null>(null)
  const car = useRef<Marker | null>(null)
  const pin = useRef<Marker | null>(null)
  const latest = useRef(props)
  latest.current = props
  const frame = useRef(0)
  const fitted = useRef('')
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let disposed = false
    let resize: ResizeObserver | undefined
    void import('mapbox-gl').then(({ default: gl }) => {
      if (disposed || !container.current) return
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      if (!token || !gl.supported()) { setFailed(true); return }
      const center = latest.current.pickup ?? latest.current.previewDestination ?? { lng: -72.3364, lat: 18.5392 }
      const instance = new gl.Map({ container: container.current, accessToken: token, style: 'mapbox://styles/mapbox/streets-v12', center: [center.lng, center.lat], zoom: 13 })
      map.current = instance
      instance.addControl(new gl.NavigationControl({ showCompass: false }), 'top-right')
      const element = document.createElement('div')
      element.textContent = '🚕'
      element.setAttribute('aria-label', 'Chauffeur')
      element.style.cssText = 'font-size:28px;background:white;border:2px solid #0f705a;border-radius:50%;width:44px;height:44px;display:grid;place-items:center;box-shadow:0 3px 10px #0004'
      car.current = new gl.Marker({ element })
      pin.current = new gl.Marker({ color: '#0f705a' })
      instance.on('load', () => {
        if (disposed) return
        instance.addSource('driver-route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
        instance.addLayer({ id: 'driver-route', type: 'line', source: 'driver-route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#0f705a', 'line-width': 5 } })
        setReady(true)
      })
      resize = new ResizeObserver(() => instance.resize())
      resize.observe(container.current)
    }).catch(() => { if (!disposed) setFailed(true) })
    return () => { disposed = true; cancelAnimationFrame(frame.current); resize?.disconnect(); car.current?.remove(); pin.current?.remove(); map.current?.remove(); map.current = null }
  }, [])

  useEffect(() => {
    const instance = map.current
    if (!ready || !instance || !car.current || !pin.current) return
    cancelAnimationFrame(frame.current)
    const { driver, target, pickup, route, rideKey, previewDestination } = props
    const destination = driver ? target : previewDestination ?? pickup
    if (destination) pin.current.setLngLat([destination.lng, destination.lat]).addTo(instance)
    else pin.current.remove()
    const source = instance.getSource('driver-route') as GeoJSONSource
    source.setData(route ? { type: 'Feature', properties: {}, geometry: route } : { type: 'FeatureCollection', features: [] })
    instance.setPaintProperty('driver-route', 'line-color', driver ? '#0f705a' : '#2563eb')
    instance.setPaintProperty('driver-route', 'line-dasharray', !driver && props.routeApproximate ? [2, 2] : undefined)
    if (!driver) {
      car.current.remove()
      if (pickup && previewDestination && route?.coordinates.length) {
        if (fitted.current !== rideKey) {
          const lngs = route.coordinates.map(point => point[0]), lats = route.coordinates.map(point => point[1])
          instance.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: { top: 80, bottom: 110, left: 45, right: 45 }, maxZoom: 16 })
          fitted.current = rideKey
        }
      } else {
        fitted.current = ''
        if (pickup || previewDestination) {
          const center = pickup ?? previewDestination
          if (center) instance.easeTo({ center: [center.lng, center.lat], zoom: 13 })
        }
      }
      return
    }
    const marker = car.current
    const first = fitted.current !== rideKey
    const from = first ? driver : { lng: marker.getLngLat().lng, lat: marker.getLngLat().lat }
    marker.setLngLat([from.lng, from.lat]).addTo(instance)
    const start = performance.now()
    const duration = first || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1000
    const animate = (now: number) => {
      const progress = duration ? Math.min(1, (now - start) / duration) : 1
      marker.setLngLat([from.lng + (driver.lng - from.lng) * progress, from.lat + (driver.lat - from.lat) * progress])
      if (progress < 1) frame.current = requestAnimationFrame(animate)
    }
    frame.current = requestAnimationFrame(animate)
    if (first && target) {
      const points = route?.coordinates.length ? route.coordinates : [[driver.lng, driver.lat], [target.lng, target.lat]]
      const lngs = points.map(p => p[0]), lats = points.map(p => p[1])
      instance.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: { top: 90, bottom: 110, left: 45, right: 45 }, maxZoom: 16 })
      if (route) fitted.current = rideKey
    }
    return () => cancelAnimationFrame(frame.current)
  }, [ready, props.driver?.lat, props.driver?.lng, props.target?.lat, props.target?.lng, props.previewDestination?.lat, props.previewDestination?.lng, props.pickup?.lat, props.pickup?.lng, props.route, props.routeApproximate, props.rideKey])

  return <><div ref={container} style={{ position: 'absolute', inset: 0 }} />{failed && <div role="status" style={{ padding: 30 }}>Carte indisponible. Réessayez en rechargeant la page.</div>}</>
}
