'use client'

import { useEffect } from 'react'

export default function PassengerDestinationButtonLabelFix() {
  useEffect(() => {
    const isPassengerDashboard = window.location.pathname === '/passenger/dashboard' || window.location.pathname === '/'
    if (!isPassengerDashboard) return

    const update = () => {
      const destinationInput = document.querySelector<HTMLInputElement>('.route-card input:not([readonly])')
      const requestButton = document.querySelector<HTMLButtonElement>('.request-button')
      const label = requestButton?.querySelector('span')
      if (!destinationInput || !requestButton || !label) return

      const hasDestination = destinationInput.value.trim().length > 0
      const hasFare = requestButton.querySelector('strong')?.textContent?.trim() !== '—'
      const lang = window.localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'

      if (!hasDestination && !hasFare) {
        label.textContent = lang === 'ht' ? 'Chwazi yon destinasyon' : 'Choisissez une destination'
      }
    }

    update()
    const observer = new MutationObserver(update)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true })
    document.addEventListener('input', update, true)

    return () => {
      observer.disconnect()
      document.removeEventListener('input', update, true)
    }
  }, [])

  return null
}
