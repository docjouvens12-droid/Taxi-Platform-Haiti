'use client'

import { useEffect } from 'react'

export default function PassengerLegacyHelpRedirectPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/passenger/dashboard') return

    let busy = false

    const openDrawerHelp = () => {
      const drawer = document.querySelector<HTMLElement>('.nav-drawer')
      if (!drawer) {
        const menuButton = document.querySelector<HTMLButtonElement>('.topbar .round-button')
        menuButton?.click()
        window.setTimeout(openDrawerHelp, 80)
        return
      }

      const buttons = Array.from(drawer.querySelectorAll<HTMLButtonElement>('.drawer-nav > button'))
      const helpButton = buttons.find((button) => /(^|\s)(aide|èd)(\s|$)/i.test((button.textContent || '').trim()))
      const details = drawer.querySelector<HTMLElement>('.passenger-help-details')
      if (!helpButton) return

      if (details) {
        details.classList.add('open')
        const arrow = helpButton.querySelector<HTMLElement>('b:last-child')
        if (arrow) arrow.style.transform = 'rotate(90deg)'
      } else {
        helpButton.click()
      }
    }

    const fixLegacyHelp = () => {
      if (busy) return
      const panel = document.querySelector<HTMLElement>('.account-panel')
      if (!panel) return
      const text = (panel.textContent || '').toLowerCase()
      if (!text.includes("centre d’aide") && !text.includes('sant èd')) return

      busy = true
      const back = panel.querySelector<HTMLButtonElement>('.panel-header button')
      if (back) back.click()
      window.setTimeout(() => {
        openDrawerHelp()
        busy = false
      }, 100)
    }

    fixLegacyHelp()
    const observer = new MutationObserver(fixLegacyHelp)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  return null
}
