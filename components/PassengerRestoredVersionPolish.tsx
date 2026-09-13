'use client'

import { useEffect } from 'react'

export default function PassengerRestoredVersionPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/passenger/dashboard') return

    const apply = () => {
      document.querySelectorAll<HTMLButtonElement>('.ride-option').forEach((button) => {
        const text = (button.textContent || '').toLowerCase()
        if (text.includes('comfort') || text.includes('plis espas') || text.includes("plus d’espace") || text.includes('plus d\'espace')) {
          button.style.setProperty('display', 'none', 'important')
        }
      })

      const cards = Array.from(document.querySelectorAll<HTMLElement>('.passenger-status-card'))
      const paymentCard = cards.find((card) => /paiement|peman/i.test(card.querySelector('small')?.textContent || ''))
      const paymentValue = paymentCard?.querySelector<HTMLElement>('strong')
      const saved = window.localStorage.getItem('taxi-payment-method')
      const ht = window.localStorage.getItem('taxi-language') === 'ht'
      if (paymentValue) {
        paymentValue.textContent = saved === 'moncash'
          ? 'MonCash'
          : saved === 'natcash'
            ? 'NatCash'
            : (ht ? 'Chwazi peman' : 'Choisir un paiement')
      }
    }

    const onChange = () => apply()
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('taxi-payment-method-change', onChange)
    window.addEventListener('storage', onChange)

    return () => {
      observer.disconnect()
      window.removeEventListener('taxi-payment-method-change', onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  return null
}
