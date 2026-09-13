'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function DriverPaymentMenuPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/driver/dashboard') return

    const styleId = 'driver-payment-menu-polish-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .driver-payment-menu-section{padding:0 2px;border-bottom:1px solid #e5eaee}
        .driver-payment-menu-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;border:0;background:transparent;padding:16px 0;color:#0f6f59;font-size:15px;font-weight:800;text-align:left}
        .driver-payment-menu-trigger .arrow{font-size:22px;line-height:1;transition:transform .18s ease}
        .driver-payment-menu-section.open .driver-payment-menu-trigger .arrow{transform:rotate(90deg)}
        .driver-payment-menu-content{display:none;padding:0 0 12px}
        .driver-payment-menu-section.open .driver-payment-menu-content{display:block}
        .driver-payout-provider{margin:10px 0;padding:12px;border-radius:14px;background:#f7f9fa;border:1px solid #e2e8ed}
        .driver-payout-provider.preferred{border-color:#9fd1c1;background:#f1faf7;box-shadow:inset 0 0 0 1px rgba(15,111,89,.08)}
        .driver-payout-head{display:flex;justify-content:space-between;align-items:center;gap:12px}
        .driver-payout-head strong{font-size:14px;color:#102033}
        .driver-payout-switch{position:relative;width:48px;height:28px;border:0;border-radius:999px;background:#b9c4cc;padding:0;transition:.18s ease}
        .driver-payout-switch::after{content:'';position:absolute;width:22px;height:22px;left:3px;top:3px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.2);transition:.18s ease}
        .driver-payout-provider.enabled .driver-payout-switch{background:#0f6f59}
        .driver-payout-provider.enabled .driver-payout-switch::after{transform:translateX(20px)}
        .driver-payout-form{display:none;gap:10px;margin-top:12px}
        .driver-payout-provider.enabled .driver-payout-form{display:grid}
        .driver-payout-form label{display:grid;gap:5px;font-size:12px;font-weight:750;color:#526273}
        .driver-payout-form input{width:100%;box-sizing:border-box;border:1px solid #d9e1e7;border-radius:11px;padding:10px 11px;font-size:15px;background:#fff;color:#102033}
        .driver-payout-save,.driver-payout-prefer{border:0;border-radius:11px;padding:10px 12px;font-weight:900;font-size:13px}
        .driver-payout-save{background:#0f6f59;color:#fff}
        .driver-payout-prefer{background:#e7f3ef;color:#0f6f59;border:1px solid #c7e4db}
        .driver-payout-provider.preferred .driver-payout-prefer{background:#0f6f59;color:#fff;border-color:#0f6f59}
        .driver-payout-preferred-label{display:none;font-size:10px;font-weight:900;color:#0f6f59;text-transform:uppercase;letter-spacing:.04em}
        .driver-payout-provider.preferred .driver-payout-preferred-label{display:block}
        .driver-payout-note{font-size:11px;line-height:1.35;color:#778694;margin:0}
        .driver-payout-status{min-height:16px;font-size:11px;font-weight:750;color:#0f6f59}
      `
      document.head.appendChild(style)
    }

    let disposed = false
    let setupRunning = false

    const setup = async () => {
      if (setupRunning || disposed) return
      const drawer = document.querySelector<HTMLElement>('.drawer')
      if (!drawer) return

      const existing = Array.from(drawer.querySelectorAll<HTMLElement>('[data-driver-payment-menu="true"]'))
      if (existing.length > 0) {
        existing.slice(1).forEach((item) => item.remove())
        return
      }

      setupRunning = true
      try {
        const lang = localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'
        const { data: auth } = await supabase.auth.getUser()
        if (disposed || !auth.user) return

        const { data: payout } = await supabase
          .from('driver_profiles')
          .select('moncash_enabled,moncash_name,moncash_phone,natcash_enabled,natcash_name,natcash_phone,preferred_payout_provider')
          .eq('user_id', auth.user.id)
          .maybeSingle()
        if (disposed) return

        if (drawer.querySelector('[data-driver-payment-menu="true"]')) return

        const preferred = payout?.preferred_payout_provider === 'natcash' ? 'natcash' : payout?.preferred_payout_provider === 'moncash' ? 'moncash' : null
        const moncashEnabled = preferred ? preferred === 'moncash' : Boolean(payout?.moncash_enabled) && !Boolean(payout?.natcash_enabled)
        const natcashEnabled = preferred ? preferred === 'natcash' : Boolean(payout?.natcash_enabled)

        const section = document.createElement('div')
        section.className = 'driver-payment-menu-section'
        section.dataset.driverPaymentMenu = 'true'
        section.innerHTML = `
          <button type="button" class="driver-payment-menu-trigger" aria-expanded="false">
            <span>${lang === 'ht' ? 'Peman' : 'Paiements'}</span>
            <span class="arrow" aria-hidden="true">›</span>
          </button>
          <div class="driver-payment-menu-content">
            ${providerMarkup('moncash', 'MonCash', moncashEnabled, payout?.moncash_name ?? '', payout?.moncash_phone ?? '', preferred === 'moncash', lang)}
            ${providerMarkup('natcash', 'NatCash', natcashEnabled, payout?.natcash_name ?? '', payout?.natcash_phone ?? '', preferred === 'natcash', lang)}
          </div>
        `

        section.querySelector<HTMLButtonElement>('.driver-payment-menu-trigger')?.addEventListener('click', () => {
          const open = section.classList.toggle('open')
          section.querySelector<HTMLButtonElement>('.driver-payment-menu-trigger')?.setAttribute('aria-expanded', String(open))
        })

        const setSelectedUi = (provider: 'moncash' | 'natcash' | null) => {
          for (const candidate of ['moncash', 'natcash'] as const) {
            const candidateBox = section.querySelector<HTMLElement>(`[data-provider="${candidate}"]`)
            const active = candidate === provider
            candidateBox?.classList.toggle('enabled', active)
            candidateBox?.classList.toggle('preferred', active)
            candidateBox?.querySelector<HTMLButtonElement>('.driver-payout-switch')?.setAttribute('aria-pressed', String(active))
            const prefer = candidateBox?.querySelector<HTMLButtonElement>('.driver-payout-prefer')
            if (prefer) prefer.textContent = active
              ? (lang === 'ht' ? '✓ Metòd payout mwen' : '✓ Mon mode de versement')
              : (lang === 'ht' ? 'Chwazi pou resevwa payout' : 'Choisir pour recevoir mes versements')
          }
        }

        const saveSelection = async (provider: 'moncash' | 'natcash') => {
          const update = provider === 'moncash'
            ? { moncash_enabled: true, natcash_enabled: false, preferred_payout_provider: 'moncash' }
            : { moncash_enabled: false, natcash_enabled: true, preferred_payout_provider: 'natcash' }
          const { error } = await supabase.from('driver_profiles').update(update).eq('user_id', auth.user.id)
          if (!error) setSelectedUi(provider)
          return error
        }

        for (const provider of ['moncash', 'natcash'] as const) {
          const box = section.querySelector<HTMLElement>(`[data-provider="${provider}"]`)
          const toggle = box?.querySelector<HTMLButtonElement>('.driver-payout-switch')
          const save = box?.querySelector<HTMLButtonElement>('.driver-payout-save')
          const prefer = box?.querySelector<HTMLButtonElement>('.driver-payout-prefer')
          const name = box?.querySelector<HTMLInputElement>('input[name="name"]')
          const phone = box?.querySelector<HTMLInputElement>('input[name="phone"]')
          const status = box?.querySelector<HTMLElement>('.driver-payout-status')

          toggle?.addEventListener('click', async () => {
            if (!box) return
            const currentlyEnabled = box.classList.contains('enabled')
            if (currentlyEnabled) {
              const { error } = await supabase.from('driver_profiles').update({
                moncash_enabled: false,
                natcash_enabled: false,
                preferred_payout_provider: null,
              }).eq('user_id', auth.user.id)
              if (!error) setSelectedUi(null)
              if (status) status.textContent = error ? (lang === 'ht' ? 'Pa ka anrejistre chanjman an.' : 'Impossible d’enregistrer ce changement.') : ''
              return
            }

            const error = await saveSelection(provider)
            if (status) status.textContent = error
              ? (lang === 'ht' ? 'Pa ka chwazi metòd sa a.' : 'Impossible de sélectionner ce mode.')
              : (lang === 'ht' ? `${provider === 'moncash' ? 'MonCash' : 'NatCash'} chwazi.` : `${provider === 'moncash' ? 'MonCash' : 'NatCash'} sélectionné.`)
          })

          save?.addEventListener('click', async () => {
            const accountName = name?.value.trim() ?? ''
            const accountPhone = phone?.value.trim() ?? ''
            if (!accountName || !accountPhone) {
              if (status) status.textContent = lang === 'ht' ? 'Antre non ak nimewo telefòn lan.' : 'Entrez le nom et le numéro de téléphone.'
              return
            }
            save.disabled = true
            if (status) status.textContent = lang === 'ht' ? 'N ap anrejistre…' : 'Enregistrement…'
            const update = provider === 'moncash'
              ? { moncash_name: accountName, moncash_phone: accountPhone, moncash_enabled: true, natcash_enabled: false, preferred_payout_provider: 'moncash' }
              : { natcash_name: accountName, natcash_phone: accountPhone, moncash_enabled: false, natcash_enabled: true, preferred_payout_provider: 'natcash' }
            const { error } = await supabase.from('driver_profiles').update(update).eq('user_id', auth.user.id)
            if (!error) setSelectedUi(provider)
            if (status) status.textContent = error
              ? (lang === 'ht' ? 'Nou pa ka anrejistre enfòmasyon yo.' : 'Impossible d’enregistrer les informations.')
              : (lang === 'ht' ? 'Enfòmasyon yo anrejistre epi metòd la chwazi.' : 'Informations enregistrées et mode sélectionné.')
            save.disabled = false
          })

          prefer?.addEventListener('click', async () => {
            const accountName = name?.value.trim() ?? ''
            const accountPhone = phone?.value.trim() ?? ''
            if (!accountName || !accountPhone) {
              if (status) status.textContent = lang === 'ht'
                ? `Anrejistre non ak telefòn ${provider === 'moncash' ? 'MonCash' : 'NatCash'} la anvan.`
                : `Enregistrez d’abord le nom et le téléphone ${provider === 'moncash' ? 'MonCash' : 'NatCash'}.`
              return
            }
            prefer.disabled = true
            if (status) status.textContent = lang === 'ht' ? 'N ap chwazi metòd payout la…' : 'Sélection du mode de versement…'
            const error = await saveSelection(provider)
            if (status) status.textContent = error
              ? (lang === 'ht' ? 'Nou pa ka chwazi metòd payout la.' : 'Impossible de sélectionner ce mode de versement.')
              : (lang === 'ht' ? 'Metòd payout la chwazi.' : 'Mode de versement sélectionné.')
            prefer.disabled = false
          })
        }

        const languageSection = Array.from(drawer.querySelectorAll<HTMLElement>('.menuSection')).find((item) => {
          const text = item.querySelector('h3')?.textContent?.trim().toLowerCase() ?? ''
          return text === 'langue' || text === 'lang'
        })
        if (languageSection) drawer.insertBefore(section, languageSection)
        else {
          const logout = drawer.querySelector('.drawerLogout')
          if (logout) drawer.insertBefore(section, logout)
          else drawer.appendChild(section)
        }
      } finally {
        setupRunning = false
      }
    }

    void setup()
    const observer = new MutationObserver(() => { void setup() })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => { disposed = true; observer.disconnect() }
  }, [])

  return null
}

function providerMarkup(provider: 'moncash' | 'natcash', label: string, enabled: boolean, name: string, phone: string, preferred: boolean, lang: 'fr' | 'ht') {
  return `
    <div class="driver-payout-provider${enabled ? ' enabled' : ''}${preferred ? ' preferred' : ''}" data-provider="${provider}">
      <div class="driver-payout-head">
        <div><strong>${label}</strong><span class="driver-payout-preferred-label">${lang === 'ht' ? 'Metòd payout chwazi' : 'Mode de versement choisi'}</span></div>
        <button type="button" class="driver-payout-switch" aria-label="${label}" aria-pressed="${enabled}"></button>
      </div>
      <div class="driver-payout-form">
        <label>${lang === 'ht' ? 'Non' : 'Nom'}<input name="name" type="text" value="${escapeHtml(name)}" autocomplete="name" /></label>
        <label>${lang === 'ht' ? 'Telefòn ki asosye ak kont lan' : 'Téléphone associé au compte'}<input name="phone" type="tel" value="${escapeHtml(phone)}" autocomplete="tel" inputmode="tel" /></label>
        <p class="driver-payout-note">${lang === 'ht' ? `Nimewo sa a dwe menm nimewo ki asosye ak kont ${label} la.` : `Ce numéro doit être celui associé au compte ${label}.`}</p>
        <button type="button" class="driver-payout-save">${lang === 'ht' ? 'Anrejistre' : 'Enregistrer'}</button>
        <button type="button" class="driver-payout-prefer">${preferred ? (lang === 'ht' ? '✓ Metòd payout mwen' : '✓ Mon mode de versement') : (lang === 'ht' ? 'Chwazi pou resevwa payout' : 'Choisir pour recevoir mes versements')}</button>
        <div class="driver-payout-status" aria-live="polite"></div>
      </div>
    </div>
  `
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] ?? char))
}
