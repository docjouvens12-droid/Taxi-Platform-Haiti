'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

type RideStatus = 'requested' | 'accepted' | 'driver_arriving' | 'in_progress'

export default function PassengerRideLifecycleGuard() {
  const pathname = usePathname()
  const isPassengerDashboard = pathname === '/' || pathname === '/passenger/dashboard'

  useEffect(() => {
    if (!isPassengerDashboard) return

    const styleId = 'passenger-ride-lifecycle-guard-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        body[data-passenger-ride-status="requested"] .booking-sheet,
        body[data-passenger-ride-status="accepted"] .booking-sheet,
        body[data-passenger-ride-status="driver_arriving"] .booking-sheet,
        body[data-passenger-ride-status="in_progress"] .booking-sheet {
          visibility:hidden !important;
          pointer-events:none !important;
        }
        body[data-passenger-ride-status="requested"] .passenger-booking-head,
        body[data-passenger-ride-status="accepted"] .passenger-booking-head,
        body[data-passenger-ride-status="driver_arriving"] .passenger-booking-head,
        body[data-passenger-ride-status="in_progress"] .passenger-booking-head {
          display:none !important;
        }
      `
      document.head.appendChild(style)
    }

    let active = true
    let currentRideId: string | null = null

    const setStatus = (status: RideStatus | null, rideId: string | null) => {
      if (!active) return
      currentRideId = rideId
      if (status) {
        document.body.dataset.passengerRideStatus = status
        document.body.dataset.passengerRideId = rideId || ''
      } else {
        delete document.body.dataset.passengerRideStatus
        delete document.body.dataset.passengerRideId
      }
      window.dispatchEvent(new CustomEvent('taxi-passenger-lifecycle-sync', { detail: { status, rideId } }))
    }

    async function load() {
      const { data: auth } = await supabase.auth.getUser()
      if (!active || !auth.user) {
        setStatus(null, null)
        return
      }

      const { data } = await supabase
        .from('rides')
        .select('id,status')
        .eq('passenger_id', auth.user.id)
        .in('status', ['requested', 'accepted', 'driver_arriving', 'in_progress'])
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!active) return
      if (!data) {
        setStatus(null, null)
        return
      }
      setStatus(data.status as RideStatus, data.id)
    }

    void load()

    const channel = supabase
      .channel(`passenger-lifecycle-guard-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, (payload) => {
        const next = payload.new as { id?: string; status?: string; passenger_id?: string } | null
        const old = payload.old as { id?: string } | null
        if (next?.id === currentRideId || old?.id === currentRideId || !currentRideId) {
          window.setTimeout(() => void load(), 40)
        } else {
          window.setTimeout(() => void load(), 120)
        }
      })
      .subscribe()

    const onSync = () => window.setTimeout(() => void load(), 40)
    window.addEventListener('taxi-ride-requested', onSync)
    window.addEventListener('taxi-ride-status-changed', onSync)
    window.addEventListener('taxi-ride-cancelled', onSync)

    const fallbackTimer = window.setInterval(() => void load(), 7000)

    return () => {
      active = false
      window.clearInterval(fallbackTimer)
      window.removeEventListener('taxi-ride-requested', onSync)
      window.removeEventListener('taxi-ride-status-changed', onSync)
      window.removeEventListener('taxi-ride-cancelled', onSync)
      delete document.body.dataset.passengerRideStatus
      delete document.body.dataset.passengerRideId
      void supabase.removeChannel(channel)
    }
  }, [isPassengerDashboard])

  return null
}
