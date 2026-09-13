'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

type Provider = 'moncash' | 'natcash'

export default function PassengerMenuPolish() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/' && pathname !== '/passenger/dashboard') return
    const styleId = 'passenger-menu-iphone-polish'
    document.getElementById(styleId)?.remove()

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .nav-drawer{box-sizing:border-box;overflow-x:hidden;background:#fff}
      .nav-drawer .drawer-user{border:0!important;box-shadow:none!important;background:transparent!important;padding:4px 0!important;justify-content:flex-start!important}
      .nav-drawer .drawer-user>div:last-child{display:none!important}
      .nav-drawer .drawer-nav>button{min-height:46px;transition:background .15s ease,transform .15s ease}
      .nav-drawer .drawer-nav>button:active{transform:scale(.99)}
      .nav-drawer .drawer-language{border-top:1px solid #e7ecef;border-radius:0;background:#fff;margin:2px 0;padding:12px 2px}
      .nav-drawer .drawer-logout{min-height:46px;margin-top:12px;border:0;background:#fff0f0;color:#9a3030}
      .passenger-profile-details,.passenger-payment-details{display:none;padding:4px 8px 12px 36px;border-bottom:1px solid #e7ecef}
      .passenger-profile-details.open,.passenger-payment-details.open{display:block}
      .passenger-profile-details p{display:flex;justify-content:space-between;gap:10px;margin:8px 0;font-size:12px}
      .passenger-profile-details span{color:#7a8998}
      .passenger-profile-details b{text-align:right;color:#102033;font-weight:750;overflow-wrap:anywhere}
      .passenger-pay-provider{margin:10px 0;padding:10px;border-radius:13px;background:#f7f9fa;border:1px solid #e2e8ed}
      .passenger-pay-head{display:flex;justify-content:space-between;align-items:center;gap:10px}
      .passenger-pay-head strong{font-size:13px;color:#102033}
      .passenger-pay-switch{position:relative;width:44px;height:26px;border:0;border-radius:999px;background:#b9c4cc;padding:0;flex:0 0 auto}
      .passenger-pay-switch::after{content:'';position:absolute;width:20px;height:20px;left:3px;top:3px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.2);transition:.18s ease}
      .passenger-pay-provider.enabled .passenger-pay-switch{background:#0f6f59}
      .passenger-pay-provider.enabled .passenger-pay-switch::after{transform:translateX(18px)}
      .passenger-pay-form{display:none;gap:8px;margin-top:10px}
      .passenger-pay-provider.enabled .passenger-pay-form{display:grid}
      .passenger-pay-form label{display:grid;gap:4px;font-size:11px;font-weight:750;color:#526273}
      .passenger-pay-form input{width:100%;box-sizing:border-box;border:1px solid #d9e1e7;border-radius:10px;padding:9px 10px;font-size:14px;background:#fff;color:#102033}
      .passenger-pay-note{font-size:10px;line-height:1.35;color:#778694;margin:0}
      .passenger-pay-save{border:0;border-radius:10px;padding:9px 10px;background:#0f6f59;color:#fff;font-weight:900;font-size:12px}
      .passenger-pay-status{min-height:14px;font-size:10px;font-weight:750;color:#0f6f59}
      @media(max-width:600px){
        .nav-drawer{width:min(62vw,255px)!important;height:auto!important;min-height:0!important;max-height:calc(100dvh - 18px)!important;overflow-y:auto!important;border-bottom-right-radius:24px!important;padding:16px 14px 18px!important;box-shadow:20px 0 60px rgba(0,0,0,.20)}
        .nav-drawer .drawer-head{display:flex!important;justify-content:flex-end!important;padding:0 1px 8px!important;margin-bottom:4px!important;border-bottom:0!important}
        .nav-drawer .drawer-brand{display:none!important}
        .nav-drawer .drawer-head>button{width:36px;height:36px;border-radius:11px;font-size:21px;flex:0 0 auto}
        .nav-drawer .drawer-user{margin:0 0 8px!important}
        .nav-drawer .drawer-avatar{width:46px;height:46px;font-size:17px}
        .nav-drawer .drawer-nav{gap:2px}
        .nav-drawer .drawer-nav>button{grid-template-columns:25px minmax(0,1fr) 14px;min-height:42px;padding:9px 4px;border-radius:10px;font-size:12px;background:transparent}
        .nav-drawer .drawer-nav>button.active{background:#eaf6f2;color:#0f6f59}
        .nav-drawer .drawer-nav>button span{font-size:16px}
        .nav-drawer .drawer-nav>button b{font-size:15px;transition:transform .18s ease}
        .nav-drawer .drawer-language{grid-template-columns:25px minmax(0,1fr);padding:11px 4px;margin:2px 0}
        .nav-drawer .drawer-language>span{font-size:16px}
        .nav-drawer .drawer-language small{font-size:9px;margin-bottom:4px}
        .nav-drawer .drawer-language .language-trigger{width:100%;text-align:left;box-shadow:none;padding:7px 8px;font-size:10px}
        .nav-drawer .drawer-language .language-options{min-width:145px}
        .nav-drawer .drawer-logout{padding:11px 12px;border-radius:12px;font-size:12px;margin-top:10px;width:100%}
      }
    `
    document.head.appendChild(style)

    let busy = false

    const row = (label: string, value: string) => {
      const p = document.createElement('p')
      const s = document.createElement('span')
      const b = document.createElement('b')
      s.textContent = label
      b.textContent = value || '—'
      p.append(s, b)
      return p
    }

    const providerMarkup = (provider: Provider, label: string, enabled: boolean, name: string, phone: string, ht: boolean) => `
      <div class="passenger-pay-provider${enabled ? ' enabled' : ''}" data-provider="${provider}">
        <div class="passenger-pay-head"><strong>${label}</strong><button type="button" class="passenger-pay-switch" aria-label="${label}" aria-pressed="${enabled}"></button></div>
        <div class="passenger-pay-form">
          <label>${ht ? 'Non' : 'Nom'}<input name="name" type="text" value="${escapeHtml(name)}" autocomplete="name" /></label>
          <label>${ht ? 'Telefòn ki asosye ak kont lan' : 'Téléphone associé au compte'}<input name="phone" type="tel" value="${escapeHtml(phone)}" autocomplete="tel" inputmode="tel" /></label>
          <p class="passenger-pay-note">${ht ? `Nimewo sa a dwe menm nimewo ki asosye ak kont ${label} la.` : `Ce numéro doit être celui associé au compte ${label}.`}</p>
          <button type="button" class="passenger-pay-save">${ht ? 'Anrejistre' : 'Enregistrer'}</button>
          <div class="passenger-pay-status" aria-live="polite"></div>
        </div>
      </div>`

    const cleanPassengerMenu = async () => {
      if (pathname !== '/passenger/dashboard' || busy) return
      const drawer = document.querySelector<HTMLElement>('.nav-drawer')
      const nav = drawer?.querySelector<HTMLElement>('.drawer-nav')
      if (!drawer || !nav) return

      nav.querySelectorAll<HTMLButtonElement>(':scope > button').forEach((button) => {
        const text = (button.textContent || '').toLowerCase()
        if (text.includes('accueil') || text.includes('akèy') || text.includes('devenir chauffeur') || text.includes('vin chofè')) button.remove()
      })

      const buttons = Array.from(nav.querySelectorAll<HTMLButtonElement>(':scope > button'))
      const profileButton = buttons.find((button) => /profil|pwofil/.test((button.textContent || '').toLowerCase()))
      const paymentButton = buttons.find((button) => /paiement|peman/.test((button.textContent || '').toLowerCase()))
      if (!profileButton) return
      if (nav.firstElementChild !== profileButton) nav.insertBefore(profileButton, nav.firstElementChild)

      busy = true
      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user
      const { data: person } = user
        ? await supabase.from('profiles').select('full_name,phone,preferred_payment_provider,moncash_enabled,moncash_name,moncash_phone,natcash_enabled,natcash_name,natcash_phone').eq('id', user.id).maybeSingle()
        : { data: null }
      busy = false
      if (!profileButton.isConnected) return

      const lang = localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'
      const meta = user?.user_metadata || {}

      if (profileButton.dataset.passengerProfileReady !== 'true') {
        profileButton.dataset.passengerProfileReady = 'true'
        const details = document.createElement('div')
        details.className = 'passenger-profile-details'
        details.append(
          row(lang === 'ht' ? 'Dat nesans :' : 'Date de naissance :', meta.birth_date ?? meta.date_of_birth ?? ''),
          row(lang === 'ht' ? 'Sèks :' : 'Sexe :', meta.sex ?? meta.gender ?? ''),
          row(lang === 'ht' ? 'Telefòn :' : 'Téléphone :', person?.phone ?? ''),
        )
        profileButton.insertAdjacentElement('afterend', details)
        const arrow = profileButton.querySelector<HTMLElement>('b:last-child')
        profileButton.addEventListener('click', (event) => {
          event.preventDefault(); event.stopPropagation()
          const open = details.classList.toggle('open')
          if (arrow) arrow.style.transform = open ? 'rotate(90deg)' : 'rotate(0deg)'
        }, true)
      }

      if (paymentButton && paymentButton.dataset.passengerPaymentReady !== 'true' && user) {
        paymentButton.dataset.passengerPaymentReady = 'true'
        const details = document.createElement('div')
        details.className = 'passenger-payment-details'
        details.innerHTML = `
          ${providerMarkup('moncash','MonCash',Boolean(person?.moncash_enabled),person?.moncash_name ?? '',person?.moncash_phone ?? '',lang === 'ht')}
          ${providerMarkup('natcash','NatCash',Boolean(person?.natcash_enabled),person?.natcash_name ?? '',person?.natcash_phone ?? '',lang === 'ht')}
        `
        paymentButton.insertAdjacentElement('afterend', details)
        const arrow = paymentButton.querySelector<HTMLElement>('b:last-child')
        paymentButton.addEventListener('click', (event) => {
          event.preventDefault(); event.stopPropagation()
          const open = details.classList.toggle('open')
          if (arrow) arrow.style.transform = open ? 'rotate(90deg)' : 'rotate(0deg)'
        }, true)

        for (const provider of ['moncash','natcash'] as const) {
          const box = details.querySelector<HTMLElement>(`[data-provider="${provider}"]`)
          const toggle = box?.querySelector<HTMLButtonElement>('.passenger-pay-switch')
          const save = box?.querySelector<HTMLButtonElement>('.passenger-pay-save')
          const name = box?.querySelector<HTMLInputElement>('input[name="name"]')
          const phone = box?.querySelector<HTMLInputElement>('input[name="phone"]')
          const status = box?.querySelector<HTMLElement>('.passenger-pay-status')

          toggle?.addEventListener('click', async (event) => {
            event.preventDefault(); event.stopPropagation()
            if (!box) return
            const enabled = !box.classList.contains('enabled')
            box.classList.toggle('enabled', enabled)
            toggle.setAttribute('aria-pressed', String(enabled))
            const update = provider === 'moncash'
              ? { moncash_enabled: enabled, preferred_payment_provider: enabled ? 'moncash' : person?.preferred_payment_provider }
              : { natcash_enabled: enabled, preferred_payment_provider: enabled ? 'natcash' : person?.preferred_payment_provider }
            const { error } = await supabase.from('profiles').update(update).eq('id', user.id)
            if (status) status.textContent = error ? (lang === 'ht' ? 'Pa ka anrejistre chanjman an.' : 'Impossible d’enregistrer ce changement.') : ''
          })

          save?.addEventListener('click', async (event) => {
            event.preventDefault(); event.stopPropagation()
            const accountName = name?.value.trim() ?? ''
            const accountPhone = phone?.value.trim() ?? ''
            if (!accountName || !accountPhone) {
              if (status) status.textContent = lang === 'ht' ? 'Antre non ak nimewo telefòn lan.' : 'Entrez le nom et le numéro de téléphone.'
              return
            }
            save.disabled = true
            if (status) status.textContent = lang === 'ht' ? 'N ap anrejistre…' : 'Enregistrement…'
            const update = provider === 'moncash'
              ? { moncash_name: accountName, moncash_phone: accountPhone, moncash_enabled: true, preferred_payment_provider: 'moncash' }
              : { natcash_name: accountName, natcash_phone: accountPhone, natcash_enabled: true, preferred_payment_provider: 'natcash' }
            const { error } = await supabase.from('profiles').update(update).eq('id', user.id)
            if (!error) box?.classList.add('enabled')
            if (status) status.textContent = error
              ? (lang === 'ht' ? 'Nou pa ka anrejistre enfòmasyon yo.' : 'Impossible d’enregistrer les informations.')
              : (lang === 'ht' ? 'Enfòmasyon yo anrejistre.' : 'Informations enregistrées.')
            save.disabled = false
          })
        }
      }
    }

    void cleanPassengerMenu()
    const observer = new MutationObserver(() => { void cleanPassengerMenu() })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      document.getElementById(styleId)?.remove()
    }
  }, [pathname])

  return null
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '\"': '&quot;' }[char] ?? char))
}
