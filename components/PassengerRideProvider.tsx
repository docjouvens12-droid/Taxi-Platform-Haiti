'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

export type PassengerRide = {
  id: string
  status: 'requested' | 'accepted' | 'driver_arriving' | 'in_progress' | 'completed' | 'cancelled'
  driver_id: string | null
  pickup_address: string
  destination_address: string
  pickup_latitude: number | null
  pickup_longitude: number | null
  destination_latitude: number | null
  destination_longitude: number | null
  service_type: 'moto' | 'standard' | 'comfort'
  estimated_fare_htg: number | null
  final_fare_htg: number | null
  requested_at: string
  completed_at: string | null
  cancelled_at: string | null
}

type RideContext = {
  ride: PassengerRide | null
  loading: boolean
  error: boolean
  refresh: () => void
  dismiss: () => void
}
const Context = createContext<RideContext>({ ride: null, loading: true, error: false, refresh: () => {}, dismiss: () => {} })
export const usePassengerRide = () => useContext(Context)

export default function PassengerRideProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const enabled = ['/', '/login', '/passenger/dashboard'].includes(pathname)
  const [userId, setUserId] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [ride, setRide] = useState<PassengerRide | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [revision, setRevision] = useState(0)
  const refresh = useCallback(() => setRevision(value => value + 1), [])

  useEffect(() => {
    if (!enabled) return
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
      setAuthReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [enabled])

  useEffect(() => {
    setRide(null)
    setLoading(enabled && !!userId)
    setError(false)
  }, [enabled, userId])

  useEffect(() => {
    if (!enabled || !userId) return
    let alive = true
    let running = false
    let queued = false
    async function load() {
      if (running) { queued = true; return }
      running = true
      try {
        // Restore active rides first, even if a newer historical row exists.
        const active = await supabase.from('rides').select('*').eq('passenger_id', userId!)
          .in('status', ['requested', 'accepted', 'driver_arriving', 'in_progress'])
          .order('requested_at', { ascending: false }).limit(1).maybeSingle()
        if (active.error) throw active.error
        let row = active.data as PassengerRide | null
        if (!row) {
          const latest = await supabase.from('rides').select('*').eq('passenger_id', userId!)
            .in('status', ['completed', 'cancelled']).order('requested_at', { ascending: false }).limit(1).maybeSingle()
          if (latest.error) throw latest.error
          row = latest.data as PassengerRide | null
          if (row && window.localStorage.getItem(`movi-dismissed-ride-${userId}`) === row.id) row = null
        }
        if (alive) { setRide(row); setLoading(false); setError(false) }
      } catch {
        // A connection failure must not reopen booking during an active trip.
        if (alive) { setError(true); setLoading(false) }
      } finally {
        running = false
        if (alive && queued) { queued = false; void load() }
      }
    }
    void load()
    const channel = supabase.channel(`passenger-dashboard-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides', filter: `passenger_id=eq.${userId}` }, () => void load())
      .subscribe(status => { if (status === 'SUBSCRIBED') void load() })
    const timer = window.setInterval(() => void load(), 5000)
    const onFocus = () => void load()
    window.addEventListener('focus', onFocus)
    return () => {
      alive = false
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      void supabase.removeChannel(channel)
    }
  }, [enabled, userId, revision])

  function dismiss() {
    if (!ride || !userId || !['completed', 'cancelled'].includes(ride.status)) return
    window.localStorage.setItem(`movi-dismissed-ride-${userId}`, ride.id)
    setRide(null)
    refresh()
  }

  return <Context.Provider value={{ ride: enabled ? ride : null, loading: enabled && (!authReady || loading), error, refresh, dismiss }}>{children}</Context.Provider>
}
