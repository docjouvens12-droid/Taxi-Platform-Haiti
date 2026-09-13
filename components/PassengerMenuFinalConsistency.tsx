'use client'

import { useEffect } from 'react'

export default function PassengerMenuFinalConsistency() {
  useEffect(() => {
    if (window.location.pathname !== '/passenger/dashboard') return

    const id = 'passenger-menu-final-consistency'
    document.getElementById(id)?.remove()

    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      .nav-drawer{overflow-x:hidden!important}
      .nav-drawer .drawer-user{display:flex!important;align-items:center!important;justify-content:flex-start!important}
      .nav-drawer .drawer-avatar{display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important}

      .nav-drawer .drawer-nav>button{position:relative!important}
      .nav-drawer .drawer-nav>button span:first-child{width:20px!important;min-width:20px!important;max-width:20px!important;text-align:center!important}
      .nav-drawer .drawer-nav>button b:last-child{width:14px!important;min-width:14px!important;display:flex!important;align-items:center!important;justify-content:center!important;transition:transform .18s ease!important;transform-origin:center!important}

      .passenger-profile-details,.passenger-rides-details,.passenger-payment-details{background:#fff!important}
      .passenger-profile-details.open,.passenger-rides-details.open,.passenger-payment-details.open{animation:passengerMenuOpen .14s ease-out}
      @keyframes passengerMenuOpen{from{opacity:.65;transform:translateY(-2px)}to{opacity:1;transform:translateY(0)}}

      .passenger-pay-switch{width:40px!important;height:24px!important;min-width:40px!important;border-radius:999px!important}
      .passenger-pay-switch::after{width:18px!important;height:18px!important;top:3px!important;left:3px!important}
      .passenger-pay-provider.enabled .passenger-pay-switch::after{transform:translateX(16px)!important}

      [data-passenger-language-row="true"]{position:relative!important}
      [data-passenger-language-row="true"]>.passenger-language-main{width:100%!important}
      .passenger-lang-shell{width:132px!important;max-width:100%!important}
      .passenger-lang-shell::before,.passenger-lang-shell::after{display:none!important;content:none!important}
      .passenger-lang-knob{box-shadow:none!important}

      .nav-drawer .drawer-nav>button[data-passenger-help-route="true"],
      .nav-drawer .drawer-nav>button[data-passenger-help-ready="true"]{border-top:1px solid #e3e9ed!important;border-radius:0!important;margin-top:5px!important;padding-top:8px!important;height:42px!important}

      .nav-drawer [data-passenger-logout="true"]{position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important}
      .nav-drawer [data-passenger-logout="true"]::before,
      .nav-drawer [data-passenger-logout="true"]::after{display:none!important;content:none!important}
      .nav-drawer [data-passenger-logout="true"]>.passenger-logout-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:16px!important;min-width:16px!important;font-size:15px!important;line-height:1!important;color:#9a3030!important}
      .nav-drawer [data-passenger-logout="true"]>.passenger-logout-label{display:inline!important;font:inherit!important;color:inherit!important}
    `
    document.head.appendChild(style)

    const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    const apply = () => {
      const drawer = document.querySelector<HTMLElement>('.nav-drawer')
      if (!drawer) return

      const buttons = Array.from(drawer.querySelectorAll<HTMLButtonElement>('.drawer-nav > button'))
      const help = buttons.find((button) => {
        const text = normalize(button.textContent || '')
        return text.includes('aide') || text.includes('ed')
      })
      if (help) help.dataset.passengerHelpRoute = 'true'

      const logout = drawer.querySelector<HTMLButtonElement>('[data-passenger-logout="true"], .drawer-logout')
      if (logout) {
        logout.dataset.passengerLogout = 'true'
        const isHt = window.localStorage.getItem('taxi-language') === 'ht'
        const desiredLabel = isHt ? 'Dekonekte' : 'Se déconnecter'
        const hasControlledIcon = logout.querySelector('.passenger-logout-icon')
        const hasControlledLabel = logout.querySelector('.passenger-logout-label')

        if (!hasControlledIcon || !hasControlledLabel) {
          logout.replaceChildren()
          const icon = document.createElement('span')
          icon.className = 'passenger-logout-icon'
          icon.textContent = '↪'
          icon.setAttribute('aria-hidden', 'true')
          const label = document.createElement('span')
          label.className = 'passenger-logout-label'
          label.textContent = desiredLabel
          logout.append(icon, label)
        } else {
          const label = logout.querySelector<HTMLElement>('.passenger-logout-label')
          if (label && label.textContent !== desiredLabel) label.textContent = desiredLabel
        }
      }
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      document.getElementById(id)?.remove()
    }
  }, [])

  return null
}
