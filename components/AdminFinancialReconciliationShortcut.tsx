'use client'

import { useEffect } from 'react'

export default function AdminFinancialReconciliationShortcut() {
  useEffect(() => {
    if (window.location.pathname !== '/admin/payments') return

    const install = () => {
      const card = document.querySelector<HTMLElement>('.card')
      if (!card || card.querySelector('[data-financial-reconciliation-shortcut="true"]')) return
      const h1 = card.querySelector('h1')
      if (!h1) return
      const lang = localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.financialReconciliationShortcut = 'true'
      button.textContent = lang === 'ht' ? '⚠ Anomali finansye' : '⚠ Anomalies financières'
      button.style.cssText = 'width:100%;border:0;border-radius:13px;padding:11px 13px;margin:-4px 0 14px;background:#fff3e8;color:#9a4f00;font-weight:900;text-align:left;cursor:pointer'
      button.addEventListener('click', () => { window.location.href = '/admin/reconciliation' })
      h1.insertAdjacentElement('afterend', button)
    }

    install()
    const observer = new MutationObserver(install)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
