'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type Lang = 'fr' | 'ht'

export default function PassengerLanguageSwitchEnhancer() {
  const [target, setTarget] = useState<Element | null>(null)
  const [lang, setLang] = useState<Lang>('fr')

  useEffect(() => {
    const saved = window.localStorage.getItem('taxi-language')
    if (saved === 'ht' || saved === 'fr') setLang(saved)

    const syncTarget = () => {
      const drawer = document.querySelector('.nav-drawer')
      const language = drawer?.querySelector('.drawer-language') as HTMLElement | null
      if (!language) {
        setTarget(null)
        return
      }

      language.classList.add('passenger-language-polish')
      const originalTitle = language.querySelector(':scope > span, :scope > strong, :scope > label') as HTMLElement | null
      if (originalTitle) originalTitle.style.setProperty('display', 'none', 'important')
      const menu = language.querySelector('.language-menu') as HTMLElement | null
      if (menu) menu.style.setProperty('display', 'none', 'important')

      let mount = language.querySelector('.drawer-language-switch-target') as HTMLElement | null
      if (!mount) {
        mount = document.createElement('div')
        mount.className = 'drawer-language-switch-target'
        language.appendChild(mount)
      }
      setTarget(mount)
    }

    syncTarget()
    const observer = new MutationObserver(syncTarget)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  const changeLanguage = (next: Lang) => {
    if (next === lang) return
    const language = document.querySelector('.drawer-language')
    const trigger = language?.querySelector<HTMLButtonElement>('.language-trigger')
    if (!trigger) return

    trigger.style.removeProperty('display')
    trigger.click()
    window.setTimeout(() => {
      const options = Array.from(document.querySelectorAll<HTMLButtonElement>('.language-options button'))
      const desired = options.find((button) => {
        const text = (button.textContent || '').toLowerCase()
        return next === 'ht' ? text.includes('kreyòl') : text.includes('français')
      })
      if (desired) {
        desired.click()
        setLang(next)
        window.localStorage.setItem('taxi-language', next)
        window.dispatchEvent(new Event('storage'))
      }
      const menu = language?.querySelector('.language-menu') as HTMLElement | null
      if (menu) menu.style.setProperty('display', 'none', 'important')
    }, 30)
  }

  if (!target) return null
  const ht = lang === 'ht'

  return createPortal(
    <section className="passenger-language-card">
      <div className="passenger-language-head">
        <div>
          <strong>{ht ? 'Lang aplikasyon an' : 'Langue de l’application'}</strong>
          <small>{ht ? 'Chwazi lang ou prefere itilize' : 'Choisissez la langue que vous préférez'}</small>
        </div>
      </div>
      <div className="drawer-language-switch" role="group" aria-label={ht ? 'Lang aplikasyon an' : 'Langue de l’application'}>
        <button type="button" className={lang === 'fr' ? 'active' : ''} onClick={() => changeLanguage('fr')}><span>🇫🇷</span><strong>Français</strong></button>
        <button type="button" className={lang === 'ht' ? 'active' : ''} onClick={() => changeLanguage('ht')}><span>🇭🇹</span><strong>Kreyòl</strong></button>
      </div>
    </section>,
    target,
  )
}
