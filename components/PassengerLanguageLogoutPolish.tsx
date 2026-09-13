'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PassengerLanguageLogoutPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/passenger/dashboard') return

    const styleId = 'passenger-language-logout-polish'
    document.getElementById(styleId)?.remove()
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .nav-drawer{
        height:auto!important;
        min-height:0!important;
        max-height:calc(100dvh - 12px)!important;
        padding:8px 10px 10px!important;
        overflow-y:auto!important;
      }
      .nav-drawer .drawer-head{min-height:0!important;margin:0 0 2px!important;padding:0!important}
      .nav-drawer .drawer-user{margin:0 0 4px!important;padding:2px 0!important;min-height:0!important}
      .nav-drawer .drawer-nav{gap:0!important;margin:0!important;padding:0!important}
      .nav-drawer .drawer-nav>button{min-height:38px!important;margin:0!important;padding:6px 4px!important;font-size:12px!important;line-height:1.15!important}
      .nav-drawer [data-passenger-language-row="true"]{display:block!important;margin:0!important;padding:7px 4px!important;border-top:1px solid #e7ecef!important;border-bottom:0!important;background:#fff!important;min-height:0!important}
      .passenger-language-icon{display:none!important}
      .passenger-language-main{display:grid;gap:4px;min-width:0;padding-left:0!important}
      .passenger-language-title{font-size:11px;font-weight:800;color:#5f6f7d;line-height:1}
      .passenger-lang-shell{width:132px;max-width:100%;height:28px;border:0!important;border-radius:0!important;background:transparent!important;padding:0 8px!important;display:grid;grid-template-columns:1fr 1fr;align-items:center;position:relative;cursor:pointer;overflow:visible;box-sizing:border-box;box-shadow:none!important}
      .passenger-lang-shell::before,.passenger-lang-shell::after{display:none!important;content:none!important}
      .passenger-lang-knob{position:absolute;top:7px;left:8px;width:14px;height:14px;border-radius:50%;background:#0f6f59;box-shadow:none;transition:transform .2s ease;z-index:2}
      .passenger-lang-label{position:relative;z-index:1;text-align:center;font-size:10px;font-weight:850;transition:color .2s ease;pointer-events:none;color:#657483;background:transparent!important;border:0!important;border-radius:0!important}
      .nav-drawer .drawer-logout,
      .nav-drawer [data-passenger-logout="true"]{
        display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;
        width:100%!important;min-height:40px!important;margin:8px 0 0!important;padding:9px 12px!important;
        border:1px solid #efdddd!important;border-radius:11px!important;background:#fffafa!important;color:#9d3434!important;
        font-size:12px!important;font-weight:850!important;line-height:1.1!important;box-shadow:none!important;text-align:center!important;
      }
      .nav-drawer [data-passenger-logout="true"]::before{content:'↪';font-size:15px;line-height:1;color:#9d3434}
      .passenger-logout-backdrop{position:fixed;inset:0;z-index:99998;background:rgba(20,35,48,.34);display:flex;align-items:flex-end;justify-content:center;padding:16px;box-sizing:border-box}
      .passenger-logout-dialog{width:min(100%,360px);background:#fff;border-radius:18px;padding:18px;box-shadow:0 18px 50px rgba(20,35,48,.22);display:grid;gap:14px}
      .passenger-logout-dialog h3{margin:0;color:#243747;font-size:17px;line-height:1.2;text-align:center}
      .passenger-logout-dialog p{margin:0;color:#6b7a88;font-size:12px;line-height:1.45;text-align:center}
      .passenger-logout-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .passenger-logout-cancel,.passenger-logout-confirm{min-height:42px;border-radius:11px;font-size:12px;font-weight:850}
      .passenger-logout-cancel{border:1px solid #dfe6ea;background:#f7f9fa;color:#405261}
      .passenger-logout-confirm{border:1px solid #efd7d7;background:#a43a3a;color:#fff}
    `
    document.head.appendChild(style)

    const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    const openLogoutDialog = () => {
      document.querySelector('.passenger-logout-backdrop')?.remove()
      const isHt = window.localStorage.getItem('taxi-language') === 'ht'
      const backdrop = document.createElement('div')
      backdrop.className = 'passenger-logout-backdrop'
      backdrop.innerHTML = `
        <div class="passenger-logout-dialog" role="dialog" aria-modal="true" aria-label="${isHt ? 'Konfime dekoneksyon' : 'Confirmer la déconnexion'}">
          <h3>${isHt ? 'Ou vle dekonekte?' : 'Voulez-vous vous déconnecter ?'}</h3>
          <p>${isHt ? 'W ap bezwen konekte ankò pou antre nan kont kliyan ou.' : 'Vous devrez vous reconnecter pour accéder à votre compte passager.'}</p>
          <div class="passenger-logout-actions">
            <button class="passenger-logout-cancel" type="button">${isHt ? 'Anile' : 'Annuler'}</button>
            <button class="passenger-logout-confirm" type="button">${isHt ? 'Dekonekte' : 'Se déconnecter'}</button>
          </div>
        </div>
      `
      document.body.appendChild(backdrop)
      backdrop.querySelector<HTMLButtonElement>('.passenger-logout-cancel')?.addEventListener('click', () => backdrop.remove())
      backdrop.addEventListener('click', (event) => { if (event.target === backdrop) backdrop.remove() })
      backdrop.querySelector<HTMLButtonElement>('.passenger-logout-confirm')?.addEventListener('click', async () => {
        const confirm = backdrop.querySelector<HTMLButtonElement>('.passenger-logout-confirm')
        if (confirm) confirm.disabled = true
        await supabase.auth.signOut()
        window.location.replace('/passenger/login')
      })
    }

    const apply = () => {
      const drawer = document.querySelector<HTMLElement>('.nav-drawer')
      if (!drawer) return

      drawer.querySelectorAll<HTMLElement>('[data-passenger-language-row="true"]').forEach((el, index) => {
        if (index > 0) el.remove()
      })

      if (!drawer.querySelector('[data-passenger-language-row="true"]')) {
        const candidates = Array.from(drawer.querySelectorAll<HTMLElement>('div,section,li'))
          .filter((el) => {
            const text = normalize((el.textContent || '').trim())
            if (!(text.includes('langue') || text.includes('lang'))) return false
            return text.includes('francais') || text.includes('kreyol')
          })
          .sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)

        const nativeLang = candidates[0] || drawer.querySelector<HTMLElement>('.drawer-language')
        if (nativeLang) {
          nativeLang.dataset.passengerLanguageRow = 'true'
          nativeLang.innerHTML = ''

          const main = document.createElement('div')
          main.className = 'passenger-language-main'
          const title = document.createElement('span')
          title.className = 'passenger-language-title'
          title.textContent = window.localStorage.getItem('taxi-language') === 'ht' ? 'Lang' : 'Langue'

          const shell = document.createElement('button')
          shell.type = 'button'
          shell.className = 'passenger-lang-shell'
          shell.setAttribute('role', 'switch')

          const knob = document.createElement('span')
          knob.className = 'passenger-lang-knob'
          const fr = document.createElement('span')
          fr.className = 'passenger-lang-label'
          fr.textContent = 'FR'
          const ht = document.createElement('span')
          ht.className = 'passenger-lang-label'
          ht.textContent = 'KREYÒL'
          shell.append(knob, fr, ht)
          main.append(title, shell)
          nativeLang.append(main)

          const paint = () => {
            const isHt = window.localStorage.getItem('taxi-language') === 'ht'
            knob.style.transform = isHt ? 'translateX(100px)' : 'translateX(0)'
            fr.style.color = isHt ? '#657483' : '#0f6f59'
            ht.style.color = isHt ? '#0f6f59' : '#657483'
            shell.setAttribute('aria-checked', String(isHt))
          }

          shell.addEventListener('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            const isHt = window.localStorage.getItem('taxi-language') === 'ht'
            window.localStorage.setItem('taxi-language', isHt ? 'fr' : 'ht')
            paint()
            window.setTimeout(() => window.location.reload(), 50)
          })
          paint()
        }
      }

      const logout = Array.from(drawer.querySelectorAll<HTMLButtonElement>('button')).find((button) => {
        const text = normalize(button.textContent || '')
        return text.includes('deconnect') || text.includes('dekonekte')
      })
      if (logout) {
        logout.dataset.passengerLogout = 'true'
        if (logout.dataset.passengerLogoutBound !== 'true') {
          logout.dataset.passengerLogoutBound = 'true'
          logout.addEventListener('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            event.stopImmediatePropagation()
            openLogoutDialog()
          }, true)
        }
      }
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      document.querySelector('.passenger-logout-backdrop')?.remove()
      document.getElementById(styleId)?.remove()
    }
  }, [])

  return null
}
