'use client'

import { useEffect } from 'react'

export default function DriverCompactBrandPolish() {
  useEffect(() => {
    if (location.pathname !== '/driver/dashboard') return

    const apply = () => {
      const topbar = document.querySelector('.topbar') as HTMLElement | null
      const brand = document.querySelector('.brand') as HTMLElement | null
      if (!topbar || !brand) return

      const menuButton = topbar.querySelector('.menuButton') as HTMLElement | null
      const logo = brand.querySelector(':scope > span, :scope > button') as HTMLElement | null
      const textWrap = brand.querySelector('div') as HTMLElement | null
      const title = textWrap?.querySelector('strong') as HTMLElement | null
      const subtitle = textWrap?.querySelector('small') as HTMLElement | null
      const wantedSubtitle = localStorage.getItem('taxi-language') === 'ht' ? 'Chofè' : 'Chauffeur'

      if (logo && logo.textContent !== 'M') logo.textContent = 'M'
      if (title && title.textContent !== 'MOVI') title.textContent = 'MOVI'
      if (subtitle && subtitle.textContent !== wantedSubtitle) subtitle.textContent = wantedSubtitle

      Object.assign(topbar.style, {
        position: 'relative', minHeight: '62px', display: 'grid',
        gridTemplateColumns: '48px minmax(0,1fr) 48px', alignItems: 'center',
        columnGap: '8px', width: '100%'
      })

      if (menuButton) Object.assign(menuButton.style, {
        position: 'relative', zIndex: '50', pointerEvents: 'auto', gridColumn: '1',
        justifySelf: 'start', touchAction: 'manipulation'
      })

      Object.assign(brand.style, {
        position: 'static', left: 'auto', transform: 'none', gridColumn: '2',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
        width: '100%', maxWidth: '100%', minWidth: '0', pointerEvents: 'none', zIndex: '1'
      })

      if (logo) Object.assign(logo.style, {
        width: '42px', height: '42px', minWidth: '42px', borderRadius: '14px',
        display: 'grid', placeItems: 'center', background: 'linear-gradient(145deg,#18a06f,#08794f)',
        color: '#fff', fontSize: '20px', fontWeight: '950', lineHeight: '1',
        boxShadow: '0 7px 18px rgba(11,132,88,.24)'
      })

      if (textWrap) Object.assign(textWrap.style, { minWidth: '0', textAlign: 'left' })

      if (title) Object.assign(title.style, {
        display: 'block', color: '#102033', whiteSpace: 'nowrap', overflow: 'hidden',
        textOverflow: 'ellipsis', fontSize: '22px', fontWeight: '950',
        letterSpacing: '-0.035em', lineHeight: '1.02'
      })

      if (subtitle) Object.assign(subtitle.style, {
        display: 'inline-block', width: 'fit-content', marginTop: '5px', padding: '3px 8px',
        borderRadius: '999px', background: '#E9F6F1', color: '#0F705A', fontSize: '9px',
        fontWeight: '900', lineHeight: '1.2', letterSpacing: '.03em'
      })
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('taxi-language-change', apply)
    return () => {
      observer.disconnect()
      window.removeEventListener('taxi-language-change', apply)
    }
  }, [])

  return null
}
