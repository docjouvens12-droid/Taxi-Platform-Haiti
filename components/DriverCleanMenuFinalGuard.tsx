'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function DriverCleanMenuFinalGuard() {
  useEffect(() => {
    if (window.location.pathname !== '/driver/dashboard-v2') return

    const handleClick = async (event: MouseEvent) => {
      const target = event.target as Element | null
      if (!target) return

      const logout = target.closest('.dcm-logout')
      if (logout) {
        event.preventDefault()
        event.stopPropagation()
        try { await supabase.auth.signOut() } catch {}
        try {
          localStorage.removeItem('movi-session')
          localStorage.removeItem('taxi-auth-default')
        } catch {}
        window.location.replace('/movi-app-v2')
        return
      }

      const langButton = target.closest('.dcm-lang button') as HTMLButtonElement | null
      if (langButton) {
        window.setTimeout(() => window.location.reload(), 120)
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  return <style jsx global>{`
    /* Long sections scroll inside the drawer so the rest of the menu remains reachable. */
    .dcm-panel {
      max-height: 38vh !important;
      overflow-y: auto !important;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }

    .dcm-trips {
      max-height: min(300px, 34vh) !important;
      overflow-y: auto !important;
      padding-right: 4px !important;
    }

    /* Logout belongs after Revenus, Langue and Aide; never float over menu rows. */
    .dcm-logout {
      position: static !important;
      inset: auto !important;
      z-index: auto !important;
      display: block !important;
      margin: 22px 0 calc(18px + env(safe-area-inset-bottom)) !important;
      box-shadow: none !important;
    }

    .dcm-drawer {
      padding-bottom: calc(38px + env(safe-area-inset-bottom)) !important;
    }
  `}</style>
}
