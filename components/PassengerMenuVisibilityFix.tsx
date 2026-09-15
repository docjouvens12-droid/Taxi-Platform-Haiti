'use client'

import { useEffect } from 'react'

/** Keeps the core account actions visible after legacy menu polish scripts run. */
export default function PassengerMenuVisibilityFix() {
  useEffect(() => {
    if (window.location.pathname !== '/' && window.location.pathname !== '/passenger/dashboard') return
    const style = document.createElement('style')
    style.id = 'passenger-menu-visibility-fix'
    style.textContent = `
      .nav-drawer .drawer-nav > button[data-passenger-core-action="true"]{display:grid!important;visibility:visible!important;opacity:1!important}
    `
    document.head.appendChild(style)
    const apply = () => {
      const drawer = document.querySelector<HTMLElement>('.nav-drawer')
      const buttons = drawer ? Array.from(drawer.querySelectorAll<HTMLButtonElement>('.drawer-nav > button')) : []
      for (const button of buttons) {
        const text = (button.textContent || '').toLowerCase()
        if (text.includes('profil') || text.includes('pwofil') || text.includes('paiement') || text.includes('peman')) {
          button.dataset.passengerCoreAction = 'true'
        }
      }
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => { observer.disconnect(); style.remove() }
  }, [])
  return null
}
