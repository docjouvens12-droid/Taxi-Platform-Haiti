'use client'

import { useEffect, useRef } from 'react'
import DriverNavigationMap from './DriverNavigationMap'

type RideStatus = 'requested' | 'accepted' | 'driver_arriving' | 'in_progress' | 'completed' | 'cancelled'

type Ride = {
  status: RideStatus
  pickup_latitude: number | null
  pickup_longitude: number | null
  destination_latitude: number | null
  destination_longitude: number | null
  pickup_address: string
  destination_address: string
}

export default function DriverAutoNavigationMap({ ride, lang }: { ride: Ride; lang: 'fr' | 'ht' }) {
  const shellRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const button = shellRef.current?.querySelector<HTMLButtonElement>('.driver-nav-launch button')
      button?.click()
    }, 80)
    return () => window.clearTimeout(timer)
  }, [])

  return <div ref={shellRef}><DriverNavigationMap ride={ride} lang={lang} /></div>
}
