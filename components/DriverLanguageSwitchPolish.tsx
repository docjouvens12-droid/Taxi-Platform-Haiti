'use client'

import { useEffect } from 'react'

export default function DriverLanguageSwitchPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/driver/dashboard') return

    const apply = () => {
      const drawer = document.querySelector('.drawer') as HTMLElement | null
      if (!drawer) return
      const sections = Array.from(drawer.querySelectorAll<HTMLElement>('.menuSection'))
      const section = sections.find((item) => {
        const text = (item.querySelector('h3')?.textContent || '').trim().toLowerCase()
        return text === 'langue' || text === 'lang' || text.includes('langue')
      })
      if (!section || section.dataset.languageSwitchReady === 'true') return

      const buttons = Array.from(section.querySelectorAll<HTMLButtonElement>('button'))
      const frButton = buttons.find((b) => (b.textContent || '').toLowerCase().includes('fran'))
      const htButton = buttons.find((b) => (b.textContent || '').toLowerCase().includes('krey'))
      if (!frButton || !htButton) return

      section.dataset.languageSwitchReady = 'true'
      buttons.forEach((b) => { b.style.display = 'none' })

      const shell = document.createElement('button')
      shell.type = 'button'
      shell.setAttribute('role', 'switch')
      shell.style.cssText = 'width:156px;height:40px;border:1px solid #d7e1e8;border-radius:999px;background:#eef3f5;padding:3px;display:grid;grid-template-columns:1fr 1fr;align-items:center;position:relative;cursor:pointer;overflow:hidden;box-sizing:border-box;margin-top:8px;'

      const knob = document.createElement('span')
      knob.style.cssText = 'position:absolute;top:3px;bottom:3px;width:calc(50% - 3px);border-radius:999px;background:#0f6f59;box-shadow:0 2px 7px rgba(15,111,89,.2);transition:transform .2s ease;left:3px;'

      const fr = document.createElement('span')
      fr.textContent = 'Français'
      const ht = document.createElement('span')
      ht.textContent = 'Kreyòl'
      ;[fr, ht].forEach((el) => {
        el.style.cssText = 'position:relative;z-index:1;text-align:center;font-size:11px;font-weight:850;transition:color .2s ease;pointer-events:none;'
      })
      shell.append(knob, fr, ht)
      section.appendChild(shell)

      const paint = () => {
        const current = window.localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'
        const isHt = current === 'ht'
        knob.style.transform = isHt ? 'translateX(100%)' : 'translateX(0)'
        fr.style.color = isHt ? '#657483' : '#fff'
        ht.style.color = isHt ? '#fff' : '#657483'
        shell.setAttribute('aria-checked', String(isHt))
      }

      shell.addEventListener('click', () => {
        const current = window.localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'
        if (current === 'ht') frButton.click()
        else htButton.click()
        window.setTimeout(paint, 0)
      })
      paint()
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
