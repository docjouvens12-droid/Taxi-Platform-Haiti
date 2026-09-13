'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Provider = 'moncash' | 'natcash'

export default function PassengerMobilePaymentPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/' && window.location.pathname !== '/passenger/dashboard') return

    const styleId = 'passenger-mobile-payment-polish'
    document.getElementById(styleId)?.remove()
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .passenger-pay-provider{margin:10px 0;padding:12px;border-radius:14px;background:#f7f9fa;border:1px solid #e2e8ed}
      .passenger-pay-head{display:flex;justify-content:space-between;align-items:center;gap:12px}
      .passenger-pay-head strong{font-size:14px;color:#102033}
      .passenger-pay-switch{position:relative;width:48px;height:28px;border:0;border-radius:999px;background:#b9c4cc;padding:0;transition:.18s ease}
      .passenger-pay-switch::after{content:'';position:absolute;width:22px;height:22px;left:3px;top:3px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.2);transition:.18s ease}
      .passenger-pay-provider.enabled .passenger-pay-switch{background:#0f6f59}
      .passenger-pay-provider.enabled .passenger-pay-switch::after{transform:translateX(20px)}
      .passenger-pay-form{display:none;gap:10px;margin-top:12px}
      .passenger-pay-provider.enabled .passenger-pay-form{display:grid}
      .passenger-pay-form label{display:grid;gap:5px;font-size:12px;font-weight:750;color:#526273}
      .passenger-pay-form input{width:100%;box-sizing:border-box;border:1px solid #d9e1e7;border-radius:11px;padding:10px 11px;font-size:15px;background:#fff;color:#102033}
      .passenger-pay-save{border:0;border-radius:11px;padding:10px 12px;background:#0f6f59;color:#fff;font-weight:900;font-size:13px}
      .passenger-pay-note{font-size:11px;line-height:1.35;color:#778694;margin:0}
      .passenger-pay-status{min-height:16px;font-size:11px;font-weight:750;color:#0f6f59}
      .payment-row .payment-icon{font-size:18px}
    `
    document.head.appendChild(style)

    let disposed = false
    let activeProvider: Provider = (localStorage.getItem('taxi-payment-provider') as Provider) || 'moncash'

    const isHt = () => localStorage.getItem('taxi-language') === 'ht'
    const label = () => activeProvider === 'moncash' ? 'MonCash' : 'NatCash'

    const setup = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (disposed || !auth.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_payment_provider,moncash_enabled,moncash_name,moncash_phone,natcash_enabled,natcash_name,natcash_phone')
        .eq('id', auth.user.id)
        .maybeSingle()
      if (disposed) return

      if (profile?.preferred_payment_provider === 'moncash' || profile?.preferred_payment_provider === 'natcash') {
        activeProvider = profile.preferred_payment_provider
        localStorage.setItem('taxi-payment-provider', activeProvider)
      }

      document.querySelectorAll<HTMLElement>('.payment-row').forEach((row) => {
        const icon = row.querySelector<HTMLElement>('.payment-icon')
        const strong = row.querySelector<HTMLElement>('strong')
        if (icon) icon.textContent = '📱'
        if (strong) strong.textContent = label()
      })

      const panels = Array.from(document.querySelectorAll<HTMLElement>('.account-panel'))
      for (const panel of panels) {
        const header = panel.querySelector<HTMLElement>('.panel-header strong')?.textContent?.toLowerCase() || ''
        if (!header.includes('paiement') && !header.includes('peman')) continue
        const body = panel.querySelector<HTMLElement>('.panel-body')
        if (!body) continue

        body.querySelector<HTMLElement>('.feature-card')?.remove()
        body.querySelector<HTMLElement>('.muted')?.remove()
        body.querySelector<HTMLElement>('[data-passenger-payment-switches="true"]')?.remove()

        const wrap = document.createElement('div')
        wrap.dataset.passengerPaymentSwitches = 'true'
        wrap.innerHTML = `
          ${providerMarkup('moncash','MonCash',Boolean(profile?.moncash_enabled),profile?.moncash_name ?? '',profile?.moncash_phone ?? '',isHt())}
          ${providerMarkup('natcash','NatCash',Boolean(profile?.natcash_enabled),profile?.natcash_name ?? '',profile?.natcash_phone ?? '',isHt())}
        `
        body.appendChild(wrap)

        for (const provider of ['moncash','natcash'] as const) {
          const box = wrap.querySelector<HTMLElement>(`[data-provider="${provider}"]`)
          const toggle = box?.querySelector<HTMLButtonElement>('.passenger-pay-switch')
          const save = box?.querySelector<HTMLButtonElement>('.passenger-pay-save')
          const name = box?.querySelector<HTMLInputElement>('input[name="name"]')
          const phone = box?.querySelector<HTMLInputElement>('input[name="phone"]')
          const status = box?.querySelector<HTMLElement>('.passenger-pay-status')

          toggle?.addEventListener('click', async () => {
            if (!box) return
            const enabled = !box.classList.contains('enabled')
            box.classList.toggle('enabled', enabled)
            toggle.setAttribute('aria-pressed', String(enabled))
            if (enabled) {
              activeProvider = provider
              localStorage.setItem('taxi-payment-provider', provider)
            }
            const update = provider === 'moncash'
              ? { moncash_enabled: enabled, preferred_payment_provider: enabled ? 'moncash' : profile?.preferred_payment_provider }
              : { natcash_enabled: enabled, preferred_payment_provider: enabled ? 'natcash' : profile?.preferred_payment_provider }
            const { error } = await supabase.from('profiles').update(update).eq('id', auth.user.id)
            if (status) status.textContent = error ? (isHt() ? 'Pa ka anrejistre chanjman an.' : 'Impossible d’enregistrer ce changement.') : ''
            document.querySelectorAll<HTMLElement>('.payment-row strong').forEach((el) => { el.textContent = label() })
          })

          save?.addEventListener('click', async () => {
            const accountName = name?.value.trim() ?? ''
            const accountPhone = phone?.value.trim() ?? ''
            if (!accountName || !accountPhone) {
              if (status) status.textContent = isHt() ? 'Antre non ak nimewo telefòn lan.' : 'Entrez le nom et le numéro de téléphone.'
              return
            }
            save.disabled = true
            if (status) status.textContent = isHt() ? 'N ap anrejistre…' : 'Enregistrement…'
            activeProvider = provider
            localStorage.setItem('taxi-payment-provider', provider)
            const update = provider === 'moncash'
              ? { moncash_name: accountName, moncash_phone: accountPhone, moncash_enabled: true, preferred_payment_provider: 'moncash' }
              : { natcash_name: accountName, natcash_phone: accountPhone, natcash_enabled: true, preferred_payment_provider: 'natcash' }
            const { error } = await supabase.from('profiles').update(update).eq('id', auth.user.id)
            if (!error) box?.classList.add('enabled')
            if (status) status.textContent = error
              ? (isHt() ? 'Nou pa ka anrejistre enfòmasyon yo.' : 'Impossible d’enregistrer les informations.')
              : (isHt() ? 'Enfòmasyon yo anrejistre.' : 'Informations enregistrées.')
            save.disabled = false
            document.querySelectorAll<HTMLElement>('.payment-row strong').forEach((el) => { el.textContent = label() })
          })
        }
      }
    }

    void setup()
    const observer = new MutationObserver(() => { void setup() })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      disposed = true
      observer.disconnect()
      document.getElementById(styleId)?.remove()
    }
  }, [])

  return null
}

function providerMarkup(provider: Provider, label: string, enabled: boolean, name: string, phone: string, ht: boolean) {
  return `
    <div class="passenger-pay-provider${enabled ? ' enabled' : ''}" data-provider="${provider}">
      <div class="passenger-pay-head">
        <strong>${label}</strong>
        <button type="button" class="passenger-pay-switch" aria-label="${label}" aria-pressed="${enabled}"></button>
      </div>
      <div class="passenger-pay-form">
        <label>${ht ? 'Non' : 'Nom'}<input name="name" type="text" value="${escapeHtml(name)}" autocomplete="name" /></label>
        <label>${ht ? 'Telefòn ki asosye ak kont lan' : 'Téléphone associé au compte'}<input name="phone" type="tel" value="${escapeHtml(phone)}" autocomplete="tel" inputmode="tel" /></label>
        <p class="passenger-pay-note">${ht ? `Nimewo sa a dwe menm nimewo ki asosye ak kont ${label} la.` : `Ce numéro doit être celui associé au compte ${label}.`}</p>
        <button type="button" class="passenger-pay-save">${ht ? 'Anrejistre' : 'Enregistrer'}</button>
        <div class="passenger-pay-status" aria-live="polite"></div>
      </div>
    </div>
  `
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] ?? char))
}
