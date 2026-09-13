'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function DriverLogoutPolish() {
  useEffect(() => {
    if (location.pathname !== '/driver/dashboard') return

    const styleId = 'driver-logout-polish'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .drawer .drawerLogout {
          width:100% !important;
          min-height:54px !important;
          margin:18px 0 10px !important;
          padding:0 14px !important;
          border:1px solid #f3cccc !important;
          border-radius:16px !important;
          background:#fff5f5 !important;
          color:#b33d3d !important;
          font-size:14px !important;
          font-weight:850 !important;
          line-height:1.2 !important;
          display:flex !important;
          align-items:center !important;
          justify-content:flex-start !important;
          gap:12px !important;
          box-shadow:0 5px 16px rgba(201,75,75,.07) !important;
        }
        .drawer .drawerLogout::after {
          content:'›';
          margin-left:auto;
          font-size:22px;
          line-height:1;
          color:#c94b4b;
        }
        .drawer .drawerLogout:active {
          background:#fdeaea !important;
          transform:scale(.99);
        }
        .driver-logout-confirm-backdrop {
          position:fixed !important;
          inset:0 !important;
          z-index:2147483647 !important;
          background:rgba(15,32,51,.5) !important;
          display:flex !important;
          align-items:center !important;
          justify-content:center !important;
          padding:20px !important;
          backdrop-filter:blur(3px);
        }
        .driver-logout-confirm-card {
          width:min(360px,100%) !important;
          max-width:100% !important;
          background:#fff !important;
          border-radius:22px !important;
          padding:22px !important;
          box-shadow:0 20px 70px rgba(0,0,0,.24) !important;
          font-family:Inter,system-ui,sans-serif !important;
          color:#102033 !important;
          text-align:center !important;
          position:relative !important;
          overflow:visible !important;
        }
        .driver-logout-confirm-icon {
          width:58px !important;
          height:58px !important;
          margin:0 auto 12px !important;
          border-radius:18px !important;
          display:grid !important;
          place-items:center !important;
          background:#fff1f1 !important;
          font-size:28px !important;
        }
        .driver-logout-confirm-card h3 {
          margin:0 0 8px !important;
          font-size:19px !important;
          font-weight:900 !important;
          color:#102033 !important;
          display:block !important;
        }
        .driver-logout-confirm-card p {
          margin:0 auto 20px !important;
          max-width:270px !important;
          color:#667789 !important;
          font-size:14px !important;
          line-height:1.45 !important;
          display:block !important;
        }
        .driver-logout-confirm-actions {
          width:100% !important;
          display:grid !important;
          grid-template-columns:1fr 1fr !important;
          gap:10px !important;
          visibility:visible !important;
          opacity:1 !important;
        }
        .driver-logout-confirm-actions button {
          width:100% !important;
          min-width:0 !important;
          min-height:48px !important;
          margin:0 !important;
          padding:10px 12px !important;
          border-radius:13px !important;
          font-size:14px !important;
          font-weight:850 !important;
          cursor:pointer !important;
          display:flex !important;
          align-items:center !important;
          justify-content:center !important;
          visibility:visible !important;
          opacity:1 !important;
          position:relative !important;
          transform:none !important;
        }
        .driver-logout-cancel {
          border:1px solid #cfd8de !important;
          background:#f7f9fa !important;
          color:#102033 !important;
        }
        .driver-logout-cancel:active {
          background:#edf1f3 !important;
        }
        .driver-logout-yes {
          border:1px solid #c94b4b !important;
          background:#c94b4b !important;
          color:#fff !important;
        }
        .driver-logout-yes:disabled { opacity:.65 !important }
        @media (max-width:360px){
          .driver-logout-confirm-actions{
            grid-template-columns:1fr !important;
          }
          .driver-logout-cancel{
            order:2 !important;
          }
          .driver-logout-yes{
            order:1 !important;
          }
        }
      `
      document.head.appendChild(style)
    }

    const closeModal = () => {
      document.querySelector('.driver-logout-confirm-backdrop')?.remove()
    }

    const showModal = () => {
      closeModal()
      const lang = localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'
      const backdrop = document.createElement('div')
      backdrop.className = 'driver-logout-confirm-backdrop'
      backdrop.innerHTML = `
        <div class="driver-logout-confirm-card" role="dialog" aria-modal="true" aria-labelledby="driver-logout-title">
          <div class="driver-logout-confirm-icon">🚪</div>
          <h3 id="driver-logout-title">${lang === 'ht' ? 'Dekonekte?' : 'Se déconnecter ?'}</h3>
          <p>${lang === 'ht' ? 'Èske ou vle soti nan kont chofè ou a?' : 'Voulez-vous vraiment quitter votre compte chauffeur ?'}</p>
          <div class="driver-logout-confirm-actions">
            <button type="button" class="driver-logout-cancel">${lang === 'ht' ? 'Anile' : 'Annuler'}</button>
            <button type="button" class="driver-logout-yes">${lang === 'ht' ? 'Dekonekte' : 'Se déconnecter'}</button>
          </div>
        </div>
      `

      backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) closeModal()
      })
      backdrop.querySelector<HTMLButtonElement>('.driver-logout-cancel')?.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        closeModal()
      })
      backdrop.querySelector<HTMLButtonElement>('.driver-logout-yes')?.addEventListener('click', async () => {
        const yes = backdrop.querySelector<HTMLButtonElement>('.driver-logout-yes')
        if (yes) {
          yes.disabled = true
          yes.textContent = lang === 'ht' ? 'Ap dekonekte…' : 'Déconnexion…'
        }
        await supabase.auth.signOut()
        window.location.href = '/'
      })
      document.body.appendChild(backdrop)
    }

    const apply = () => {
      const button = document.querySelector<HTMLButtonElement>('.drawer .drawerLogout')
      if (!button) return

      const lang = localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'
      const label = lang === 'ht' ? 'Dekonekte' : 'Se déconnecter'
      if (button.textContent !== `🚪 ${label}`) button.textContent = `🚪 ${label}`

      if (button.dataset.logoutConfirm === 'custom') return
      button.dataset.logoutConfirm = 'custom'
      button.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        showModal()
      }, true)
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      closeModal()
    }
  }, [])

  return null
}
