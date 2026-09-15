'use client'

import { useEffect, useRef, useState } from 'react'

type Point = { lat: number; lng: number }
export default function PassengerDestinationPicker({ center, ht, onConfirm, onClose }: {
  center: Point; ht: boolean; onConfirm: (point: Point) => void; onClose: () => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const [point, setPoint] = useState<Point | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let alive = true
    let map: import('mapbox-gl').Map | undefined
    let marker: import('mapbox-gl').Marker | undefined
    void import('mapbox-gl').then(({ default: mapbox }) => {
      if (!alive || !host.current) return
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      if (!token) { setError(true); return }
      map = new mapbox.Map({ container: host.current, accessToken: token, style: 'mapbox://styles/mapbox/streets-v12', center: [center.lng, center.lat], zoom: 13 })
      map.addControl(new mapbox.NavigationControl())
      map.on('error', () => { if (alive) setError(true) })
      map.on('click', event => {
        const next = { lat: event.lngLat.lat, lng: event.lngLat.lng }
        marker?.remove()
        marker = new mapbox.Marker({ color: '#dc4343' }).setLngLat(event.lngLat).addTo(map!)
        setPoint(next)
      })
    }).catch(() => { if (alive) setError(true) })
    return () => { alive = false; marker?.remove(); map?.remove() }
  }, [center.lat, center.lng])
  return <section aria-label={ht ? 'Chwazi destinasyon sou kat la' : 'Choisir la destination sur la carte'}>
    <p>{ht ? 'Deplase kat la, epi klike sou kote egzak ou vle ale a.' : 'Déplacez la carte, puis cliquez sur votre destination exacte.'}</p>
    <div ref={host} style={{ height: 300, borderRadius: 16, overflow: 'hidden' }} />
    {error && <p role="alert">{ht ? 'Kat la pa disponib. Eseye ankò.' : 'Carte indisponible. Réessayez.'}</p>}
    <button type="button" className="request-button" disabled={!point || error} onClick={() => point && onConfirm(point)}>{ht ? 'Konfime pwen sa a' : 'Confirmer ce point'}</button>
    <button type="button" onClick={onClose}>{ht ? 'Fèmen' : 'Fermer'}</button>
  </section>
}
