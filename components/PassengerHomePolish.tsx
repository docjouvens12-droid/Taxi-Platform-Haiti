'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function PassengerHomePolish() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/') return

    const styleId = 'passenger-home-polish'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      html, body { max-width: 100%; overflow-x: hidden !important; }
      .shell, .phone-frame, .app-underlay { width: 100%; max-width: 100%; box-sizing: border-box; }
      .real-map-panel { overflow: hidden; }
      .booking-sheet, .route-card, .ride-list, .payment-row, .search-results, .searching-card, .request-button { box-sizing: border-box; max-width: 100%; }
      .greeting-row, .section-heading, .route-line, .ride-option, .payment-row { min-width: 0; }
      .input-wrap, .ride-copy, .section-heading > div, .greeting-row > div { min-width: 0; }
      .input-wrap input, .ride-copy strong, .ride-copy small, .section-heading h2, .greeting-row h1 { max-width: 100%; }

      @media (max-width: 600px) {
        .phone-frame { min-height: 100dvh !important; }
        .real-map-panel { min-height: 210px !important; height: 210px !important; }
        .real-map-panel .topbar { padding: 12px 14px !important; gap: 9px !important; align-items: center !important; }
        .real-map-panel .round-button { width: 42px !important; height: 42px !important; min-width: 42px !important; border-radius: 14px !important; }
        .real-map-panel .brand-chip { min-width: 0 !important; flex: 1 1 auto !important; padding: 7px 9px !important; border-radius: 14px !important; gap: 7px !important; }
        .real-map-panel .brand-chip .brand-mark { width: 34px !important; height: 34px !important; min-width: 34px !important; border-radius: 11px !important; font-size: 15px !important; }
        .real-map-panel .brand-chip > div { min-width: 0 !important; }
        .real-map-panel .brand-chip strong { display: block !important; font-size: 14px !important; line-height: 1.15 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
        .real-map-panel .brand-chip small { display: none !important; }

        .booking-sheet { margin-top: -18px !important; padding: 12px 14px 24px !important; border-radius: 24px 24px 0 0 !important; }
        .booking-sheet .grabber { width: 38px !important; height: 4px !important; margin: 0 auto 12px !important; }
        .greeting-row { gap: 9px !important; align-items: flex-start !important; margin-bottom: 12px !important; }
        .greeting-row .eyebrow { font-size: 10px !important; margin-bottom: 3px !important; }
        .greeting-row h1 { font-size: 23px !important; line-height: 1.08 !important; margin: 0 !important; }
        .online-pill { flex: 0 0 auto !important; padding: 7px 9px !important; border-radius: 999px !important; font-size: 10px !important; white-space: nowrap !important; }

        .route-card { padding: 11px 12px !important; border-radius: 16px !important; margin-bottom: 10px !important; }
        .route-line { gap: 9px !important; align-items: center !important; }
        .route-card .connector { margin-left: 5px !important; height: 15px !important; }
        .input-wrap label { font-size: 9px !important; letter-spacing: .04em !important; }
        .input-wrap input { width: 100% !important; min-width: 0 !important; font-size: 14px !important; line-height: 1.2 !important; padding: 3px 0 !important; }
        .pickup-dot, .destination-dot { flex: 0 0 auto !important; }

        .search-results { margin-top: 7px !important; border-radius: 14px !important; overflow: hidden !important; }
        .search-results button { padding: 11px !important; gap: 8px !important; }
        .search-results button strong { font-size: 13px !important; line-height: 1.25 !important; text-align: left !important; overflow-wrap: anywhere !important; }
        .search-status { padding: 10px 11px !important; font-size: 12px !important; }

        .section-heading { margin: 14px 0 8px !important; gap: 8px !important; align-items: flex-end !important; }
        .section-heading .eyebrow { font-size: 9px !important; margin-bottom: 2px !important; }
        .section-heading h2 { font-size: 18px !important; margin: 0 !important; line-height: 1.1 !important; }
        .section-heading > span { flex: 0 0 auto !important; max-width: 48% !important; font-size: 10px !important; line-height: 1.2 !important; text-align: right !important; }

        .ride-list { gap: 8px !important; }
        .ride-option { width: 100% !important; padding: 10px 11px !important; border-radius: 15px !important; gap: 9px !important; }
        .ride-icon { width: 38px !important; height: 38px !important; min-width: 38px !important; font-size: 20px !important; border-radius: 12px !important; }
        .ride-copy { flex: 1 1 auto !important; text-align: left !important; }
        .ride-copy strong { display: block !important; font-size: 14px !important; }
        .ride-copy small { display: block !important; font-size: 10px !important; line-height: 1.25 !important; margin-top: 2px !important; }
        .ride-price { flex: 0 0 auto !important; max-width: 34% !important; font-size: 12px !important; text-align: right !important; overflow-wrap: anywhere !important; }

        .payment-row { margin-top: 10px !important; padding: 10px 11px !important; border-radius: 15px !important; gap: 8px !important; }
        .payment-row > div { min-width: 0 !important; gap: 8px !important; }
        .payment-icon { width: 36px !important; height: 36px !important; min-width: 36px !important; }
        .payment-row small { font-size: 9px !important; }
        .payment-row strong { font-size: 13px !important; }
        .payment-row button { padding: 8px 9px !important; font-size: 11px !important; white-space: nowrap !important; }

        .request-button { width: 100% !important; margin-top: 11px !important; padding: 13px 14px !important; border-radius: 15px !important; min-height: 50px !important; gap: 10px !important; }
        .request-button span { min-width: 0 !important; font-size: 14px !important; }
        .request-button strong { flex: 0 0 auto !important; font-size: 13px !important; white-space: nowrap !important; }
        .searching-card { margin-top: 11px !important; padding: 12px !important; border-radius: 15px !important; gap: 10px !important; }
        .searching-card strong { font-size: 13px !important; }
        .searching-card small { font-size: 10px !important; }
        .ride-error { margin-top: 9px !important; padding: 10px 11px !important; border-radius: 12px !important; font-size: 12px !important; }
        .fine-print { margin: 10px 3px 0 !important; font-size: 9px !important; line-height: 1.3 !important; }
      }
    `
    document.head.appendChild(style)

    return () => document.getElementById(styleId)?.remove()
  }, [pathname])

  return null
}
