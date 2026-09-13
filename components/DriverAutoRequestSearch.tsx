'use client'

import { useEffect } from 'react'

export default function DriverAutoRequestSearch() {
  useEffect(() => {
    if (window.location.pathname !== '/driver/dashboard') return

    const styleId = 'driver-auto-request-search-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .refresh.driver-auto-search {
          display:inline-flex !important;
          align-items:center !important;
          justify-content:center !important;
          gap:7px !important;
          background:#eef8f4 !important;
          color:#0f6f59 !important;
          border:1px solid #cfe6de !important;
          box-shadow:none !important;
        }
        .refresh.driver-auto-search .driver-auto-search-icon {
          display:inline-block;
          font-size:16px;
          line-height:1;
          animation:driverAutoSearchSpin 1.15s linear infinite;
        }
        .refresh.driver-auto-search:disabled {
          opacity:.75 !important;
        }
        @keyframes driverAutoSearchSpin {
          to { transform:rotate(360deg); }
        }
      `
      document.head.appendChild(style)
    }

    const paint = () => {
      const refresh = document.querySelector<HTMLButtonElement>('button.refresh')
      if (!refresh) return

      const online = Boolean(document.querySelector('.status-card > button.offline-btn'))
      const lang = localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'

      if (online) {
        refresh.classList.add('driver-auto-search')
        const label = lang === 'ht' ? 'Chèche komand…' : 'Recherche en cours…'
        if (refresh.dataset.autoSearchLabel !== label) {
          refresh.innerHTML = `<span class="driver-auto-search-icon" aria-hidden="true">↻</span><span>${label}</span>`
          refresh.dataset.autoSearchLabel = label
        }
      } else {
        refresh.classList.remove('driver-auto-search')
        const label = lang === 'ht' ? '↻ Rafrechi' : '↻ Actualiser'
        if (refresh.textContent?.trim() !== label) refresh.textContent = label
        delete refresh.dataset.autoSearchLabel
      }
    }

    const checkForRequests = () => {
      paint()
      const refresh = document.querySelector<HTMLButtonElement>('button.refresh')
      const online = Boolean(document.querySelector('.status-card > button.offline-btn'))
      if (!online || !refresh || refresh.disabled) return
      refresh.click()
    }

    paint()
    const firstCheck = window.setTimeout(checkForRequests, 1200)
    const interval = window.setInterval(checkForRequests, 8000)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkForRequests()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearTimeout(firstCheck)
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return null
}
