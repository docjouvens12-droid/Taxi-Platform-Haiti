'use client'

import { useEffect } from 'react'

export default function DriverOnlineSwitchPolish() {
  useEffect(() => {
    if (location.pathname !== '/driver/dashboard') return

    const styleId = 'driver-online-switch-polish'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        @media (max-width: 900px) {
          .status-card.driver-switch-card {
            display:flex !important;
            flex-direction:row !important;
            align-items:center !important;
            justify-content:space-between !important;
            gap:14px !important;
            padding:15px 16px !important;
            margin-top:34px !important;
            margin-bottom:12px !important;
            background:#f4f8f7 !important;
          }
          .status-card.driver-switch-card > div {
            display:grid !important;
            grid-template-columns:auto 1fr !important;
            column-gap:8px !important;
            min-width:0 !important;
          }
          .status-card.driver-switch-card > div > strong {
            font-size:15px !important;
          }
          .status-card.driver-switch-card > div > small {
            grid-column:2 !important;
            font-size:11px !important;
            margin-top:2px !important;
          }
          .status-card.driver-switch-card > button.online-btn,
          .status-card.driver-switch-card > button.offline-btn {
            position:relative !important;
            flex:0 0 64px !important;
            width:64px !important;
            min-width:64px !important;
            height:36px !important;
            padding:0 !important;
            border:0 !important;
            border-radius:999px !important;
            font-size:0 !important;
            line-height:0 !important;
            box-shadow:inset 0 0 0 1px rgba(16,32,51,.08) !important;
            transition:background .18s ease !important;
          }
          .status-card.driver-switch-card > button.online-btn {
            background:#cfd9df !important;
          }
          .status-card.driver-switch-card > button.offline-btn {
            background:#0f8067 !important;
          }
          .status-card.driver-switch-card > button.online-btn::after,
          .status-card.driver-switch-card > button.offline-btn::after {
            content:'';
            position:absolute;
            top:4px;
            width:28px;
            height:28px;
            border-radius:50%;
            background:#fff;
            box-shadow:0 2px 7px rgba(16,32,51,.24);
            transition:left .18s ease;
          }
          .status-card.driver-switch-card > button.online-btn::after { left:4px; }
          .status-card.driver-switch-card > button.offline-btn::after { left:32px; }
          .status-card.driver-switch-card > button:disabled { opacity:.65 !important; }
        }
      `
      document.head.appendChild(style)
    }

    const apply = () => {
      const card = document.querySelector<HTMLElement>('.status-card')
      const rating = document.querySelector<HTMLElement>('.driver-rating-card')
      if (!card) return
      card.classList.add('driver-switch-card')
      if (rating?.parentElement && card.parentElement === rating.parentElement && rating.previousElementSibling !== card) {
        rating.parentElement.insertBefore(card, rating)
      }
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
