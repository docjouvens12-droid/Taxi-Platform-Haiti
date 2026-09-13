'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STALE_AFTER_MS = 15 * 60 * 1000

export default function PassengerStaleReceiptGuard() {
  useEffect(() => {
    let cancelled = false

    async function dismissStaleReceipt() {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData.user
        if (!user || cancelled) return

        const { data, error } = await supabase.rpc('get_my_latest_completed_ride')
        if (error || cancelled) return

        const row = Array.isArray(data) ? data[0] : data
        if (!row?.id || !row?.completed_at) return

        const completedAt = new Date(row.completed_at).getTime()
        if (!Number.isFinite(completedAt)) return
        if (Date.now() - completedAt <= STALE_AFTER_MS) return

        window.localStorage.setItem(`taxi-dismissed-receipt:${user.id}:${row.id}`, '1')

        const hide = () => {
          const backdrop = document.querySelector<HTMLElement>('.receiptBackdrop')
          if (backdrop) backdrop.style.display = 'none'
        }

        hide()
        window.setTimeout(hide, 100)
        window.setTimeout(hide, 800)
      } catch {
        // Never block the passenger app if this safeguard fails.
      }
    }

    void dismissStaleReceipt()
    const timer = window.setInterval(() => void dismissStaleReceipt(), 5000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  return null
}
