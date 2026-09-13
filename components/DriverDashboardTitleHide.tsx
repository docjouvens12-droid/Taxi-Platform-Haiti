'use client'

import { useEffect } from 'react'

export default function DriverDashboardTitleHide() {
  useEffect(() => {
    if (location.pathname !== '/driver/dashboard') return

    const apply = () => {
      const card = document.querySelector('.card')
      if (!card) return
      const h1 = card.querySelector(':scope > h1') as HTMLElement | null
      if (h1) h1.style.display = 'none'
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
