'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function DriverNetEarningsPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/driver/dashboard') return

    let active = true
    let timer = 0

    const formatHtg = (value: number | null) => value == null
      ? '—'
      : `${new Intl.NumberFormat('fr-HT', { maximumFractionDigits: 0 }).format(value)} HTG`

    const refresh = async () => {
      if (!active) return
      const section = document.querySelector<HTMLElement>('[data-driver-earnings="true"]')
      if (!section) return

      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user || !active) return

      const now = new Date()
      const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const { data: rides } = await supabase
        .from('rides')
        .select('id,final_fare_htg,completed_at')
        .eq('driver_id', auth.user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

      if (!active) return
      const completed = rides ?? []
      const net = (fare: number | null) => Number(fare ?? 0) * 0.85
      const latest = completed.length ? net(completed[0].final_fare_htg) : null
      const today = completed.filter(r => r.completed_at && r.completed_at >= startToday)
      const weekly = completed.filter(r => r.completed_at && r.completed_at >= sevenDaysAgo)

      const set = (key: string, value: string) => {
        const el = section.querySelector<HTMLElement>(`[data-earning-value="${key}"]`)
        if (el) el.textContent = value
      }

      set('latest', formatHtg(latest))
      set('count', String(completed.length))
      set('today-count', String(today.length))
      set('today', formatHtg(today.reduce((sum, r) => sum + net(r.final_fare_htg), 0)))
      set('weekly', formatHtg(weekly.reduce((sum, r) => sum + net(r.final_fare_htg), 0)))
    }

    const schedule = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => { void refresh() }, 120)
    }

    void refresh()
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { childList: true, subtree: true })
    const interval = window.setInterval(() => { void refresh() }, 5000)

    return () => {
      active = false
      observer.disconnect()
      window.clearInterval(interval)
      window.clearTimeout(timer)
    }
  }, [])

  return null
}
