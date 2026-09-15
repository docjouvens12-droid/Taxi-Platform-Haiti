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
      .nav-drawer .drawer-nav{display:flex!important;flex-direction:column!important}
      .nav-drawer .drawer-nav > button[data-passenger-order="profile"]{order:1!important}
      .nav-drawer .drawer-nav > button[data-passenger-order="rides"]{order:2!important}
      .nav-drawer .drawer-nav > button[data-passenger-order="payment"]{order:3!important}
      .nav-drawer .drawer-nav > [data-passenger-language-row="true"],.nav-drawer .drawer-nav > .drawer-language{order:4!important}
      .nav-drawer .drawer-nav > button[data-passenger-order="help"]{order:5!important}
    `
    document.head.appendChild(style)
    let applying = false
    const apply = () => {
      if (applying) return
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
      profile?.setAttribute('data-passenger-order', 'profile')
      rides?.setAttribute('data-passenger-order', 'rides')
      payment?.setAttribute('data-passenger-order', 'payment')
      help?.setAttribute('data-passenger-order', 'help')
      const ordered = [profile, rides, payment].filter(Boolean) as HTMLButtonElement[]
      const desired = [...ordered, language, help].filter(Boolean) as HTMLElement[]
      const current = Array.from(nav.children)
      const needsReorder = desired.some((element, index) => current[index] !== element)
      if (needsReorder) {
        applying = true
        for (const element of desired) nav.appendChild(element)
        applying = false
      }
    }
    apply()
    // Keep the requested order after legacy menu scripts finish their updates.
    const timer = window.setInterval(apply, 250)
    return () => { window.clearInterval(timer); style.remove() }
  }, [])
  return null
}
