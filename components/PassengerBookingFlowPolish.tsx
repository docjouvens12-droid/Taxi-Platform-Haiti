'use client'

import { useEffect } from 'react'

export default function PassengerBookingFlowPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/') return

    const styleId = 'passenger-booking-flow-polish'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .passenger-flow-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:2px 0 12px}
        .passenger-flow-step{display:flex;align-items:center;justify-content:center;gap:5px;padding:7px 5px;border-radius:11px;background:#f4f7f8;color:#7b8997;font-size:10px;font-weight:800;border:1px solid #e4eaee}
        .passenger-flow-step.is-active{background:#eaf6f2;color:#0f6f59;border-color:#cde7de}
        .passenger-flow-step.is-done{background:#f1f8f5;color:#126b57;border-color:#d7ebe4}
        .route-card{box-shadow:0 7px 20px rgba(16,32,51,.05)!important}
        .ride-option.selected{box-shadow:0 7px 18px rgba(15,111,89,.10)!important;transform:translateY(-1px)}
        .request-button:not(:disabled){box-shadow:0 10px 24px rgba(15,111,89,.18)!important}
        .searching-card.passenger-searching-polish{border:1px solid #cfe7df!important;background:#f1f9f6!important;box-shadow:0 8px 22px rgba(15,111,89,.08)!important}
        .searching-card.passenger-searching-polish strong{color:#0f6f59!important}
        .passenger-search-status{display:flex;align-items:center;gap:7px;margin-top:5px;color:#62766f;font-size:10px;font-weight:700}
        .passenger-search-dot{width:7px;height:7px;border-radius:50%;background:#18a773;box-shadow:0 0 0 0 rgba(24,167,115,.35);animation:passengerPulse 1.5s infinite}
        @keyframes passengerPulse{70%{box-shadow:0 0 0 7px rgba(24,167,115,0)}100%{box-shadow:0 0 0 0 rgba(24,167,115,0)}}
        @media(max-width:600px){
          .passenger-flow-steps{gap:5px;margin-bottom:10px}
          .passenger-flow-step{padding:6px 3px;font-size:9px;gap:3px}
        }
      `
      document.head.appendChild(style)
    }

    const lang = () => localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'

    const apply = () => {
      const sheet = document.querySelector<HTMLElement>('.booking-sheet')
      if (!sheet) return
      const routeCard = sheet.querySelector<HTMLElement>('.route-card')
      if (!routeCard) return

      let steps = sheet.querySelector<HTMLElement>('[data-passenger-flow-steps="true"]')
      if (!steps) {
        steps = document.createElement('div')
        steps.className = 'passenger-flow-steps'
        steps.dataset.passengerFlowSteps = 'true'
        routeCard.parentElement?.insertBefore(steps, routeCard)
      }

      const currentLang = lang()
      const destinationInput = routeCard.querySelector<HTMLInputElement>('input:not([readonly])')
      const destinationReady = Boolean(destinationInput?.value.trim())
      const quoteReady = Boolean(sheet.querySelector('.ride-price')?.textContent?.includes('HTG'))
      const searching = Boolean(sheet.querySelector('.searching-card'))

      const labels = currentLang === 'ht'
        ? [['📍','Depa'],['🏁','Destinasyon'],['🚕','Sèvis'],['✓','Mande']]
        : [['📍','Départ'],['🏁','Destination'],['🚕','Service'],['✓','Commander']]

      const activeIndex = searching ? 3 : quoteReady ? 2 : destinationReady ? 1 : 0
      steps.innerHTML = labels.map((item, index) => {
        const cls = index < activeIndex ? ' is-done' : index === activeIndex ? ' is-active' : ''
        return `<div class="passenger-flow-step${cls}"><span>${item[0]}</span><span>${item[1]}</span></div>`
      }).join('')

      const searchingCard = sheet.querySelector<HTMLElement>('.searching-card')
      if (searchingCard) {
        searchingCard.classList.add('passenger-searching-polish')
        let status = searchingCard.querySelector<HTMLElement>('[data-passenger-search-status="true"]')
        if (!status) {
          status = document.createElement('div')
          status.className = 'passenger-search-status'
          status.dataset.passengerSearchStatus = 'true'
          status.innerHTML = '<span class="passenger-search-dot"></span><span></span>'
          searchingCard.querySelector('div:last-child')?.appendChild(status)
        }
        const text = status.querySelector('span:last-child')
        if (text) text.textContent = currentLang === 'ht' ? 'Demann ou aktif — n ap chèche chofè ki pi pre a.' : 'Votre demande est active — recherche du chauffeur le plus proche.'
      }
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    const interval = window.setInterval(apply, 1200)

    return () => {
      observer.disconnect()
      window.clearInterval(interval)
      document.getElementById(styleId)?.remove()
    }
  }, [])

  return null
}
