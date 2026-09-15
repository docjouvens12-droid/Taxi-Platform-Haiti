'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function PassengerArrivalNotice({ rideId, status, ht }: { rideId: string; status: string; ht: boolean }) {
  const seen = useRef(new Set<string>())
  const [visibleRide, setVisibleRide] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'driver_arriving') { setVisibleRide(null); return }
    const key = `movi-arrival-notice:${rideId}`
    if (seen.current.has(rideId)) return
    try { if (window.localStorage.getItem(key)) return } catch {}
    seen.current.add(rideId)
    try { window.localStorage.setItem(key, 'shown') } catch {}
    setVisibleRide(rideId)
  }, [rideId, status])

  if (visibleRide !== rideId || status !== 'driver_arriving') return null
  return createPortal(
    <div role="alert" style={{ position: 'fixed', top: 'calc(16px + env(safe-area-inset-top))', left: '50%', transform: 'translateX(-50%)', zIndex: 11000, width: 'min(430px, calc(100% - 28px))', padding: 18, borderRadius: 18, background: '#0f705a', color: '#fff', boxShadow: '0 12px 40px #0004' }}>
      <strong style={{ display: 'block', fontSize: 18 }}>🚕 {ht ? 'Chofè ou a rive!' : 'Votre chauffeur est arrivé !'}</strong>
      <p>{ht ? 'Li ap tann ou nan kote ou te chwazi a.' : 'Il vous attend au point de prise en charge choisi.'}</p>
      <button type="button" onClick={() => setVisibleRide(null)} style={{ border: 0, borderRadius: 10, padding: '10px 18px', background: '#fff', color: '#0f705a', fontWeight: 700 }}>{ht ? 'Dakò' : 'D’accord'}</button>
    </div>, document.body,
  )
}
