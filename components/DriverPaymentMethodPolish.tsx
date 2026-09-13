'use client'

import { useEffect } from 'react'

export default function DriverPaymentMethodPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/driver/dashboard') return

    const styleId = 'driver-payment-method-polish'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .driver-payment-method {
          display:grid;
          gap:8px;
          margin-top:2px;
          padding:11px 12px;
          border-radius:14px;
          background:#eef8f4;
          border:1px solid #cfe8df;
          color:#174f42;
        }
        .driver-payment-method .payment-head,
        .driver-payment-method .payment-split {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
        }
        .driver-payment-method span { font-size:12px; font-weight:750; }
        .driver-payment-method strong { font-size:13px; font-weight:900; text-align:right; }
        .driver-payment-method .payment-split { padding-top:7px; border-top:1px solid #d9ece5; }
        .driver-payment-method .payment-split span { color:#5d746d; }
      `
      document.head.appendChild(style)
    }

    const apply = () => {
      const lang = localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'
      document.querySelectorAll<HTMLElement>('.ride-card').forEach((card) => {
        const existing = card.querySelector<HTMLElement>('[data-driver-payment-method="true"]')
        if (existing) existing.remove()

        const row = document.createElement('div')
        row.className = 'driver-payment-method'
        row.dataset.driverPaymentMethod = 'true'

        const head = document.createElement('div')
        head.className = 'payment-head'
        const label = document.createElement('span')
        const value = document.createElement('strong')
        label.textContent = lang === 'ht' ? 'Metòd peman' : 'Mode de paiement'
        value.textContent = lang === 'ht' ? '📱 Peman sou aplikasyon' : '📱 Paiement dans l’application'
        head.append(label, value)

        const split = document.createElement('div')
        split.className = 'payment-split'
        const splitLabel = document.createElement('span')
        const splitValue = document.createElement('strong')
        splitLabel.textContent = lang === 'ht' ? 'Pataj revni' : 'Répartition'
        splitValue.textContent = lang === 'ht' ? 'Chofè 85% · Platfòm 15%' : 'Chauffeur 85% · Plateforme 15%'
        split.append(splitLabel, splitValue)

        row.append(head, split)
        card.appendChild(row)
      })
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
