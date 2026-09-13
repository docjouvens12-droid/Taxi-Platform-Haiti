'use client'

import { useEffect } from 'react'

export default function DriverBrandTaxiPolish() {
  useEffect(() => {
    if (location.pathname !== '/driver/dashboard') return

    const apply = () => {
      const brand = document.querySelector('.brand') as HTMLElement | null
      if (!brand) return
      const mark = brand.querySelector(':scope > span, :scope > button') as HTMLElement | null
      if (!mark) return

      if (mark.tagName === 'BUTTON') {
        mark.textContent = 'M'
        mark.setAttribute('aria-label', 'MOVI')
        Object.assign(mark.style, {
          width: '44px', height: '44px', border: '0', borderRadius: '14px',
          display: 'grid', placeItems: 'center', background: 'linear-gradient(145deg,#18a06f,#08794f)',
          color: '#fff', fontSize: '21px', fontWeight: '950', cursor: 'pointer', padding: '0',
          flex: '0 0 auto', boxShadow: '0 7px 18px rgba(11,132,88,.24)'
        })
        return
      }

      const button = document.createElement('button')
      button.type = 'button'
      button.setAttribute('aria-label', 'MOVI')
      button.textContent = 'M'
      Object.assign(button.style, {
        width: '44px', height: '44px', border: '0', borderRadius: '14px',
        display: 'grid', placeItems: 'center', background: 'linear-gradient(145deg,#18a06f,#08794f)',
        color: '#fff', fontSize: '21px', fontWeight: '950', cursor: 'pointer', padding: '0',
        flex: '0 0 auto', boxShadow: '0 7px 18px rgba(11,132,88,.24)'
      })
      button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }))
      mark.replaceWith(button)
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
