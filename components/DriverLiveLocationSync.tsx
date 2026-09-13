'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

function validNumber(value: number | null) {
  return typeof value === 'number' && Number.isFinite(value)
}

export default function DriverLiveLocationSync() {
  const watchIdRef = useRef<number | null>(null)
  const lastWriteAtRef = useRef(0)
  const lastPointRef = useRef<[number, number] | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return

    let stopped = false

    const metersBetween = (a: [number, number], b: [number, number]) => {
      const R = 6371000
      const rad = (v: number) => (v * Math.PI) / 180
      const dLat = rad(b[1] - a[1])
      const dLon = rad(b[0] - a[0])
      const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2
      return 2 * R * Math.asin(Math.sqrt(x))
    }

    const syncPosition = async (pos: GeolocationPosition, force = false) => {
      if (stopped) return

      const point: [number, number] = [pos.coords.longitude, pos.coords.latitude]
      const now = Date.now()
      const moved = lastPointRef.current ? metersBetween(lastPointRef.current, point) : Infinity

      if (!force && now - lastWriteAtRef.current < 1000 && moved < 3) return

      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session || stopped) return

      const { error } = await supabase.rpc('update_driver_live_location', {
        p_latitude: pos.coords.latitude,
        p_longitude: pos.coords.longitude,
        p_heading: validNumber(pos.coords.heading) ? pos.coords.heading : null,
        p_speed_kph: validNumber(pos.coords.speed) ? Math.max(0, (pos.coords.speed || 0) * 3.6) : null,
      })

      if (!error) {
        lastWriteAtRef.current = now
        lastPointRef.current = point
      }
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => void syncPosition(pos, true),
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    )

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => void syncPosition(pos),
      () => {},
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    )

    return () => {
      stopped = true
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  return null
}
