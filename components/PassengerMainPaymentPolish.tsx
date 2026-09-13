'use client'

import { useEffect } from 'react'

export default function PassengerMainPaymentPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/passenger/dashboard') return

    let changeButton: HTMLButtonElement | null = null
    let changeHandler: ((event: MouseEvent) => void) | null = null

    const currentMethod = () => {
      const saved = window.localStorage.getItem('taxi-payment-method')
      return saved === 'moncash' || saved === 'natcash' ? saved : null
    }

    const updateRow = () => {
      const row = document.querySelector<HTMLElement>('.payment-row')
      if (!row) return

      const icon = row.querySelector<HTMLElement>('.payment-icon')
      const value = row.querySelector<HTMLElement>('div > div > strong')
      const button = row.querySelector<HTMLButtonElement>('button')
      const lang = window.localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'
      const method = currentMethod()

      if (icon) icon.textContent = '📱'
      if (value) {
        value.textContent = method === 'moncash'
          ? 'MonCash'
          : method === 'natcash'
            ? 'NatCash'
            : (lang === 'ht' ? 'Chwazi peman' : 'Choisir un paiement')
      }

      if (button && button !== changeButton) {
        if (changeButton && changeHandler) changeButton.removeEventListener('click', changeHandler, true)
        changeButton = button
        changeHandler = (event: MouseEvent) => {
          event.preventDefault()
          event.stopPropagation()
          event.stopImmediatePropagation()

          const menuButton = document.querySelector<HTMLButtonElement>('.topbar > .round-button:first-child')
          menuButton?.click()

          let attempts = 0
          const openPayment = () => {
            attempts += 1
            const drawer = document.querySelector('.nav-drawer')
            const paymentButton = Array.from(drawer?.querySelectorAll<HTMLButtonElement>('.drawer-nav > button') ?? [])
              .find((candidate) => /paiement|peman/i.test(candidate.textContent || ''))
            if (paymentButton) {
              paymentButton.click()
              return
            }
            if (attempts < 12) window.setTimeout(openPayment, 60)
          }
          window.setTimeout(openPayment, 50)
        }
        button.addEventListener('click', changeHandler, true)
      }
    }

    const onPaymentChange = () => updateRow()
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'taxi-payment-method' || event.key === 'taxi-language') updateRow()
    }

    updateRow()
    const observer = new MutationObserver(updateRow)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('taxi-payment-method-change', onPaymentChange)
    window.addEventListener('storage', onStorage)

    return () => {
      observer.disconnect()
      window.removeEventListener('taxi-payment-method-change', onPaymentChange)
      window.removeEventListener('storage', onStorage)
      if (changeButton && changeHandler) changeButton.removeEventListener('click', changeHandler, true)
    }
  }, [])

  return null
}
