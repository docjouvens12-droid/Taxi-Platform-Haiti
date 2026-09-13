'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function DriverDashboardInteractionFix() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/driver/dashboard') return

    const apply = () => {
      const menu = document.querySelector<HTMLButtonElement>('.menuButton')
      if (menu) {
        menu.style.position = 'relative'
        menu.style.zIndex = '50000'
        menu.style.pointerEvents = 'auto'
        menu.style.touchAction = 'manipulation'
      }

      const logout = document.querySelector<HTMLButtonElement>('.global-logout')
      if (logout) {
        logout.style.zIndex = '50000'
        logout.style.pointerEvents = 'auto'
        logout.style.touchAction = 'manipulation'
      }

      const backdrop = document.querySelector<HTMLElement>('.menuBackdrop')
      if (backdrop) {
        backdrop.style.zIndex = '60000'
        backdrop.style.pointerEvents = 'auto'
      }

      const drawer = document.querySelector<HTMLElement>('.drawer')
      if (drawer) drawer.style.pointerEvents = 'auto'
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })

    const onPointerUp = async (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      const logout = target?.closest?.('.global-logout') as HTMLButtonElement | null
      if (!logout) return

      event.preventDefault()
      event.stopPropagation()
      logout.disabled = true
      logout.textContent = '…'
      try {
        await supabase.rpc('set_driver_online', { p_online: false })
      } catch {}
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } finally {
        window.location.replace('/')
      }
    }

    document.addEventListener('pointerup', onPointerUp, true)
    return () => {
      observer.disconnect()
      document.removeEventListener('pointerup', onPointerUp, true)
    }
  }, [pathname])

  return null
}
