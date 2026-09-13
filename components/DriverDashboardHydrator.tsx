'use client'

import { useEffect } from 'react'

type DashboardRow = {
  full_name?: string | null
  average_rating?: number | string | null
  total_rides?: number | null
  status?: string | null
}

function extractSession(raw: string | null) {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    const session = parsed?.currentSession ?? parsed?.session ?? parsed
    if (!session?.access_token) return null
    return session
  } catch {
    return null
  }
}

function findSession() {
  if (typeof window === 'undefined') return null
  const preferred = extractSession(window.localStorage.getItem('taxi-auth-default'))
  if (preferred) return preferred

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (!key) continue
    const session = extractSession(window.localStorage.getItem(key))
    if (session?.access_token) return session
  }
  return null
}

function applyDashboard(row: DashboardRow) {
  const name = row.full_name?.trim() || 'Chauffeur'
  const rating = Number(row.average_rating ?? 0)
  const rides = Number(row.total_rides ?? 0)

  const nameEl = document.querySelector<HTMLElement>('.welcome h1')
  if (nameEl) nameEl.textContent = name

  const ratingEl = document.querySelector<HTMLElement>('.rating')
  if (ratingEl) {
    ratingEl.innerHTML = `★ ${rating.toFixed(2)} <small>${rides} trajets</small>`
  }
}

export default function DriverDashboardHydrator() {
  useEffect(() => {
    let cancelled = false
    let retryTimer: number | undefined

    const hydrate = async (attempt = 0) => {
      if (cancelled) return
      const session = findSession()
      if (!session?.access_token) {
        if (attempt < 8) retryTimer = window.setTimeout(() => void hydrate(attempt + 1), 500)
        return
      }

      try {
        const response = await fetch('/api/driver/dashboard', {
          method: 'GET',
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        })
        const payload = await response.json()
        const row = Array.isArray(payload?.data) ? payload.data[0] : null
        if (!cancelled && response.ok && row?.status === 'approved') {
          applyDashboard(row)
          return
        }
      } catch {}

      if (attempt < 8) retryTimer = window.setTimeout(() => void hydrate(attempt + 1), 700)
    }

    void hydrate()
    const onVisible = () => { if (!document.hidden) void hydrate() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      if (retryTimer) window.clearTimeout(retryTimer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return null
}
