'use client'

import { useEffect } from 'react'

export default function PassengerLanguageStayPut() {
  useEffect(() => {
    if (window.location.pathname !== '/passenger/dashboard') return

    const translateMenu = (isHt: boolean) => {
      const drawer = document.querySelector<HTMLElement>('.nav-drawer')
      if (!drawer) return

      const title = drawer.querySelector<HTMLElement>('.passenger-language-title')
      if (title) title.textContent = isHt ? 'Lang' : 'Langue'

      const knob = drawer.querySelector<HTMLElement>('.passenger-lang-knob')
      const labels = Array.from(drawer.querySelectorAll<HTMLElement>('.passenger-lang-label'))
      if (knob) knob.style.transform = isHt ? 'translateX(100px)' : 'translateX(0)'
      if (labels[0]) labels[0].style.color = isHt ? '#657483' : '#0f6f59'
      if (labels[1]) labels[1].style.color = isHt ? '#0f6f59' : '#657483'

      const buttons = Array.from(drawer.querySelectorAll<HTMLButtonElement>('.drawer-nav > button'))
      for (const button of buttons) {
        const text = (button.textContent || '').toLowerCase()
        const label = button.querySelector<HTMLElement>('b')
        if (!label) continue
        if (/profil|pwofil/.test(text)) label.textContent = isHt ? 'Pwofil' : 'Profil'
        else if (/traj[eè]|mes trajets/.test(text)) label.textContent = isHt ? 'Trajè mwen yo' : 'Mes trajets'
        else if (/paiement|peman/.test(text)) label.textContent = isHt ? 'Peman' : 'Paiement'
        else if (/aide|èd/.test(text)) label.textContent = isHt ? 'Èd' : 'Aide'
      }

      const logout = drawer.querySelector<HTMLButtonElement>('[data-passenger-logout="true"],.drawer-logout')
      if (logout) {
        const children = Array.from(logout.childNodes)
        for (const node of children) {
          if (node.nodeType === Node.TEXT_NODE) node.textContent = ''
        }
        const label = logout.querySelector<HTMLElement>('b,span:last-child')
        if (label) label.textContent = isHt ? 'Dekonekte' : 'Se déconnecter'
      }
    }

    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const shell = target?.closest<HTMLButtonElement>('.passenger-lang-shell')
      if (!shell) return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      const nextIsHt = window.localStorage.getItem('taxi-language') !== 'ht'
      window.localStorage.setItem('taxi-language', nextIsHt ? 'ht' : 'fr')
      shell.setAttribute('aria-checked', String(nextIsHt))
      translateMenu(nextIsHt)
      window.dispatchEvent(new CustomEvent('taxi-language-changed', { detail: { lang: nextIsHt ? 'ht' : 'fr' } }))
    }

    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [])

  return null
}
