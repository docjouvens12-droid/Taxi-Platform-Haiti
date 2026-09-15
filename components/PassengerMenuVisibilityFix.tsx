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
      if (!drawer) return
      const nav = drawer.querySelector<HTMLElement>('.drawer-nav')
      if (!nav) return
      const buttons = Array.from(nav.querySelectorAll<HTMLButtonElement>(':scope > button'))
      for (const button of buttons) {
        const text = (button.textContent || '').toLowerCase()
        if (text.includes('profil') || text.includes('pwofil') || text.includes('paiement') || text.includes('peman') || text.includes('aide') || text.includes('èd')) {
          button.dataset.passengerCoreAction = 'true'
        }
      }
      const language = nav.querySelector<HTMLElement>('.drawer-language,[data-passenger-language-row="true"]')
      const find = (pattern: RegExp) => buttons.find((button) => pattern.test(button.textContent || ''))
      const profile = find(/profil|pwofil/i)
      const rides = find(/mes trajets|trajè mwen yo/i)
      const payment = find(/paiement|peman/i)
      const help = find(/aide|èd|ed/i)
      const ordered = [profile, rides, payment].filter(Boolean) as HTMLButtonElement[]
      let cursor: ChildNode | null = nav.firstChild
      for (const button of ordered) {
        nav.insertBefore(button, cursor)
        cursor = button.nextSibling
      }
      if (language) {
        nav.appendChild(language)
      }
      if (help) {
        nav.appendChild(help)
      }
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => { observer.disconnect(); style.remove() }
  }, [])
  return null
}
