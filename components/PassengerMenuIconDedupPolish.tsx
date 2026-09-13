'use client'

import { useEffect } from 'react'

export default function PassengerMenuIconDedupPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/passenger/dashboard') return

    const styleId = 'passenger-menu-icon-dedup-polish'
    document.getElementById(styleId)?.remove()
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .nav-drawer .drawer-language>span,
      .nav-drawer [data-passenger-language-row="true"]>.passenger-language-icon{display:none!important}
      .nav-drawer [data-passenger-logout="true"]::before{content:none!important;display:none!important}
    `
    document.head.appendChild(style)

    const clean = () => {
      const drawer = document.querySelector<HTMLElement>('.nav-drawer')
      if (!drawer) return

      const outerLang = drawer.querySelector<HTMLElement>('.drawer-language')
      if (outerLang && outerLang.dataset.passengerLanguageClean !== 'true') {
        const current = window.localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'
        outerLang.dataset.passengerLanguageClean = 'true'
        outerLang.dataset.passengerLanguageRow = 'true'
        outerLang.innerHTML = ''

        const main = document.createElement('div')
        main.className = 'passenger-language-main'
        const title = document.createElement('span')
        title.className = 'passenger-language-title'
        title.textContent = current === 'ht' ? 'Lang' : 'Langue'

        const shell = document.createElement('button')
        shell.type = 'button'
        shell.className = 'passenger-lang-shell'
        shell.setAttribute('role', 'switch')

        const knob = document.createElement('span')
        knob.className = 'passenger-lang-knob'
        const fr = document.createElement('span')
        fr.className = 'passenger-lang-label'
        fr.textContent = 'FR'
        const ht = document.createElement('span')
        ht.className = 'passenger-lang-label'
        ht.textContent = 'KREYÒL'
        shell.append(knob, fr, ht)
        main.append(title, shell)
        outerLang.append(main)

        const paint = () => {
          const isHt = window.localStorage.getItem('taxi-language') === 'ht'
          knob.style.transform = isHt ? 'translateX(100px)' : 'translateX(0)'
          fr.style.color = isHt ? '#657483' : '#0f6f59'
          ht.style.color = isHt ? '#0f6f59' : '#657483'
          shell.setAttribute('aria-checked', String(isHt))
        }

        shell.addEventListener('click', (event) => {
          event.preventDefault()
          event.stopPropagation()
          const isHt = window.localStorage.getItem('taxi-language') === 'ht'
          window.localStorage.setItem('taxi-language', isHt ? 'fr' : 'ht')
          paint()
          window.setTimeout(() => window.location.reload(), 50)
        })
        paint()
      }

      const logout = drawer.querySelector<HTMLButtonElement>('[data-passenger-logout="true"], .drawer-logout')
      if (logout && logout.dataset.passengerLogoutTextClean !== 'true') {
        logout.dataset.passengerLogoutTextClean = 'true'
        const isHt = window.localStorage.getItem('taxi-language') === 'ht'
        logout.textContent = isHt ? 'Dekonekte' : 'Se déconnecter'
      }
    }

    clean()
    const observer = new MutationObserver(clean)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      document.getElementById(styleId)?.remove()
    }
  }, [])

  return null
}
