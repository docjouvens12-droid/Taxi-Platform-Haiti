'use client'

import { useEffect } from 'react'

export default function DriverCtaBridge() {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest('button.primary-panel-button') as HTMLButtonElement | null
      if (!button) return
      const text = (button.textContent || '').toLowerCase()
      if (text.includes('chauffeur') || text.includes('chofè')) {
        event.preventDefault()
        window.location.href = '/driver'
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return null
}
