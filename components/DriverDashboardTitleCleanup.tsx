'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function DriverDashboardTitleCleanup() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/driver/dashboard') return

    const styleId = 'driver-dashboard-iphone-fix'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        html, body { max-width: 100%; overflow-x: hidden !important; }
        main.page, main.page > .card { width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; overflow-x: hidden !important; }
        main.page .topbar { width: 100%; min-width: 0; box-sizing: border-box; }
        main.page .brand { min-width: 0; flex: 1 1 auto; overflow: hidden; }
        main.page .brand > div { min-width: 0; overflow: hidden; }
        main.page .brand strong, main.page .brand small { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        main.page .driver-rating-card, main.page .status-card, main.page .section, main.page .empty { width: 100%; max-width: 100%; box-sizing: border-box; }
        main.page .section-title { min-width: 0; flex-wrap: wrap; }
        main.page .section-title h2 { min-width: 0; max-width: 100%; overflow-wrap: anywhere; }
        main.page .refresh { flex: 0 0 auto; max-width: 100%; }
        main.page .empty { overflow-wrap: anywhere; }
        .drawer { box-sizing: border-box !important; max-width: 88vw !important; overflow-x: hidden !important; }
        .drawer .profileBlock { justify-content: center !important; }
        .drawer [data-driver-name-row='true'] { display: flex !important; justify-content: space-between !important; align-items: baseline !important; gap: 18px !important; }
        .drawer [data-driver-name-row='true'] span { flex: 0 0 auto; }
        .drawer [data-driver-name-row='true'] b { flex: 1 1 auto; text-align: right !important; overflow-wrap: anywhere; }
        @media (max-width: 600px) {
          main.page .card { padding-left: 16px !important; padding-right: 16px !important; }
          main.page .topbar { gap: 10px !important; align-items: center !important; padding: 2px 0 8px !important; }
          main.page .menuButton { width: 42px !important; height: 42px !important; border-radius: 13px !important; font-size: 21px !important; }
          main.page .brand { gap: 8px !important; }
          main.page .brand > span { width: 38px !important; height: 38px !important; border-radius: 12px !important; font-size: 17px !important; }
          main.page .brand strong { font-size: 17px !important; line-height: 1.1 !important; white-space: nowrap !important; }
          main.page .brand small { display: none !important; }
          main.page .driver-rating-card { gap: 8px !important; margin-top: 8px !important; margin-bottom: 10px !important; padding: 11px 12px !important; border-radius: 15px !important; align-items: center !important; }
          main.page .driver-rating-card > div { min-width: 0; gap: 8px !important; }
          main.page .rating-star { font-size: 25px !important; }
          main.page .driver-rating-card small { font-size: 11px !important; }
          main.page .driver-rating-card strong { font-size: 15px !important; line-height: 1.1 !important; }
          main.page .ride-count { flex: 0 0 auto; padding: 6px 9px !important; font-size: 11px !important; }
          main.page .status-card { padding: 12px !important; border-radius: 15px !important; margin-bottom: 8px !important; gap: 9px !important; }
          main.page .status-card > div { width: 100%; }
          main.page .status-card strong { font-size: 15px !important; }
          main.page .status-card small { font-size: 11px !important; line-height: 1.25 !important; }
          main.page .status-card button { padding: 10px 12px !important; border-radius: 12px !important; font-size: 13px !important; }
          main.page .section { margin-top: 14px !important; }
          main.page .section-title { align-items: center; gap: 8px !important; margin-bottom: 8px !important; }
          main.page .section-title h2 { font-size: 19px !important; margin: 0 !important; }
          main.page .refresh { padding: 9px 11px !important; font-size: 13px !important; border-radius: 12px !important; }
          main.page .empty { padding: 22px 18px !important; border-radius: 15px !important; font-size: 14px !important; }
          main.page .rides { gap: 10px !important; }
          main.page .ride-wrap { padding: 12px !important; border-radius: 16px !important; }
          main.page .ride-card { gap: 10px !important; }
          main.page .ride-card .row { gap: 8px !important; }
          main.page .ride-card .row > span { font-size: 18px !important; }
          main.page .ride-card .row small { font-size: 10px !important; }
          main.page .ride-card .row strong { font-size: 14px !important; line-height: 1.25 !important; overflow-wrap: anywhere; }
          main.page .ride-card .metrics { gap: 6px !important; }
          main.page .ride-card .metrics > div { padding: 9px !important; border-radius: 11px !important; min-width: 0; }
          main.page .ride-card .metrics small { font-size: 10px !important; }
          main.page .ride-card .metrics strong { font-size: 12px !important; overflow-wrap: anywhere; }
          main.page .ride-wrap > .primary { margin-top: 10px !important; padding: 11px 13px !important; border-radius: 12px !important; font-size: 14px !important; }

          .drawer { width: min(330px, 88vw) !important; padding: 18px 14px 20px !important; background: #f7f9fb !important; }
          .drawer .drawerHead { margin-bottom: 8px !important; padding-bottom: 8px !important; border-bottom: 1px solid #e6ebf0 !important; }
          .drawer .drawerHead button { width: 36px !important; height: 36px !important; border-radius: 12px !important; }
          .drawer .profileBlock { padding: 10px 0 14px !important; margin: 0 !important; background: transparent !important; }
          .drawer .avatar { width: 72px !important; height: 72px !important; border-radius: 50% !important; box-shadow: 0 8px 24px rgba(16,32,51,.12) !important; }
          .drawer .menuSection { background: #fff !important; border: 1px solid #e4e9ee !important; border-radius: 16px !important; padding: 13px 14px !important; margin: 0 0 10px !important; box-shadow: 0 4px 14px rgba(16,32,51,.04) !important; }
          .drawer .menuSection h3 { margin: 0 0 10px !important; font-size: 12px !important; text-transform: uppercase !important; letter-spacing: .04em !important; color: #66778a !important; }
          .drawer .menuSection p { display: flex !important; justify-content: space-between !important; align-items: baseline !important; gap: 14px !important; margin: 8px 0 !important; font-size: 13px !important; }
          .drawer .menuSection p span { color: #7b8998 !important; flex: 0 0 auto !important; }
          .drawer .menuSection p b { color: #102033 !important; text-align: right !important; overflow-wrap: anywhere !important; }
          .drawer select { width: 100% !important; min-height: 44px !important; border-radius: 12px !important; border: 1px solid #dce3e9 !important; background: #fff !important; padding: 0 12px !important; font-size: 14px !important; }
          .drawer .logout, .drawer button.logout { width: 100% !important; min-height: 46px !important; margin-top: 14px !important; border-radius: 13px !important; font-size: 14px !important; font-weight: 850 !important; }
        }
      `
      document.head.appendChild(style)
    }

    const apply = () => {
      const pageTitle = document.querySelector('main .card > h1') as HTMLElement | null
      if (pageTitle) pageTitle.style.display = 'none'

      const drawer = document.querySelector('.drawer')
      if (!drawer) return

      const profileBlock = drawer.querySelector('.profileBlock') as HTMLElement | null
      const avatar = profileBlock?.querySelector('.avatar') as HTMLElement | null
      const sourceName = profileBlock?.querySelector('strong')?.textContent?.trim() || ''
      const existingRow = drawer.querySelector('[data-driver-name-row="true"]') as HTMLElement | null
      const existingName = existingRow?.querySelector('b')?.textContent?.trim() || ''
      const currentName = sourceName || existingName

      const drawerTitle = drawer.querySelector('.drawerHead strong') as HTMLElement | null
      if (drawerTitle) drawerTitle.style.display = 'none'

      if (profileBlock && avatar) {
        Array.from(profileBlock.children).forEach((child) => {
          if (child !== avatar) child.remove()
        })
        profileBlock.style.justifyContent = 'center'
      }

      const personalSection = drawer.querySelector('.menuSection') as HTMLElement | null
      if (personalSection && currentName) {
        let row = personalSection.querySelector('[data-driver-name-row="true"]') as HTMLElement | null
        if (!row) {
          row = document.createElement('p')
          row.setAttribute('data-driver-name-row', 'true')
          const label = document.createElement('span')
          const value = document.createElement('b')
          row.append(label, value)
          const heading = personalSection.querySelector('h3')
          if (heading?.nextSibling) personalSection.insertBefore(row, heading.nextSibling)
          else personalSection.appendChild(row)
        }
        const label = row.querySelector('span')
        const value = row.querySelector('b')
        if (label) label.textContent = localStorage.getItem('taxi-language') === 'ht' ? 'Non' : 'Nom'
        if (value) value.textContent = currentName
      }
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      document.getElementById(styleId)?.remove()
    }
  }, [pathname])

  return null
}
