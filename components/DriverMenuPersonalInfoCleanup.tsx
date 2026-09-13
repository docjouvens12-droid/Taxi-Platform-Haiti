'use client'

import { useEffect } from 'react'

export default function DriverMenuPersonalInfoCleanup() {
  useEffect(() => {
    if (!location.pathname.startsWith('/driver')) return

    const apply = () => {
      const drawer = document.querySelector('.drawer') as HTMLElement | null
      if (!drawer) return

      const profile = drawer.querySelector('.profileBlock')
      const profileText = profile?.querySelector('div:last-child')
      const name = profileText?.querySelector('strong')?.textContent?.trim() || ''

      if (profileText) {
        profileText.querySelectorAll('span').forEach((el) => el.remove())
      }

      const personal = drawer.querySelector('.menuSection')
      if (personal && name) {
        const existing = personal.querySelector('[data-driver-name-row="true"]')
        if (!existing) {
          const row = document.createElement('p')
          row.setAttribute('data-driver-name-row', 'true')
          const label = document.createElement('span')
          label.textContent = localStorage.getItem('taxi-language') === 'ht' ? 'Non' : 'Nom'
          const value = document.createElement('b')
          value.textContent = name
          row.append(label, value)
          personal.insertBefore(row, personal.children[1] || null)
        }
      }

      const logout = drawer.querySelector('.drawerLogout') as HTMLButtonElement | null
      if (logout) {
        logout.style.position = 'sticky'
        logout.style.bottom = '0'
        logout.style.zIndex = '10'
        logout.style.display = 'flex'
        logout.style.width = '100%'
        logout.style.marginTop = '14px'
        logout.style.marginBottom = '4px'
        logout.style.boxShadow = '0 -8px 18px rgba(255,255,255,.96)'
        logout.style.pointerEvents = 'auto'
        logout.style.touchAction = 'manipulation'
      }
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
