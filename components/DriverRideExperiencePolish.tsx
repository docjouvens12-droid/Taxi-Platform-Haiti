'use client'

import { useEffect } from 'react'

export default function DriverRideExperiencePolish() {
  useEffect(() => {
    if (window.location.pathname !== '/driver/dashboard') return

    const styleId = 'driver-ride-experience-polish'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .section { margin-top:22px !important; }
        .section-title { align-items:center !important; }
        .section-title h2 { color:#102033 !important; font-size:19px !important; margin:0 !important; }
        .rides { gap:14px !important; }
        .ride-wrap {
          border:1px solid #dfe8e5 !important;
          border-radius:22px !important;
          padding:16px !important;
          background:#fff !important;
          box-shadow:0 8px 24px rgba(16,32,51,.07) !important;
        }
        .ride-card { gap:14px !important; }
        .ride-card .row {
          padding:11px 12px !important;
          border-radius:15px !important;
          background:#f7faf9 !important;
          border:1px solid #e8efed !important;
        }
        .ride-card .row small {
          color:#718193 !important;
          font-size:11px !important;
          font-weight:700 !important;
        }
        .ride-card .row strong {
          color:#102033 !important;
          font-size:14px !important;
          line-height:1.35 !important;
        }
        .ride-card .metrics {
          display:grid !important;
          grid-template-columns:1fr 1fr !important;
          gap:9px !important;
        }
        .ride-card .metrics > div {
          background:#f3f7f8 !important;
          border-radius:14px !important;
          padding:11px 10px !important;
          border:1px solid #e2e9ed !important;
        }
        .ride-card .metrics small {
          color:#7a8998 !important;
          font-size:10px !important;
          font-weight:750 !important;
        }
        .ride-card .metrics strong {
          color:#102033 !important;
          font-size:14px !important;
          margin-top:3px !important;
        }
        .driver-accept-action,
        .driver-arriving-action,
        .driver-start-action,
        .driver-complete-action {
          display:flex !important;
          align-items:center !important;
          justify-content:center !important;
          width:100% !important;
          min-height:50px !important;
          margin-top:13px !important;
          border-radius:15px !important;
          font-size:15px !important;
          font-weight:900 !important;
          box-shadow:none !important;
          visibility:visible !important;
          opacity:1;
          pointer-events:auto !important;
          touch-action:manipulation;
          position:relative !important;
          z-index:2 !important;
        }
        .driver-accept-action { background:#0f8067 !important; color:#fff !important; }
        .driver-arriving-action { background:#f4b740 !important; color:#332500 !important; }
        .driver-start-action { background:#173f68 !important; color:#fff !important; }
        .driver-complete-action { background:#0b6b55 !important; color:#fff !important; }
        .driver-accept-action:disabled,
        .driver-arriving-action:disabled,
        .driver-start-action:disabled,
        .driver-complete-action:disabled {
          opacity:.65 !important;
          cursor:not-allowed !important;
        }
        .pill.driver-status-pill {
          font-size:11px !important;
          font-weight:850 !important;
          color:#0f6f59 !important;
          background:#e8f5f1 !important;
          border:1px solid #cce7df !important;
          padding:7px 10px !important;
        }
        .driver-step-guide {
          display:flex;
          align-items:flex-start;
          gap:10px;
          margin:12px 0 14px;
          padding:12px 13px;
          border-radius:16px;
          border:1px solid #d7e7e2;
          background:#f2f9f7;
          color:#173f36;
        }
        .driver-step-guide .driver-step-icon { font-size:21px; line-height:1; margin-top:1px; }
        .driver-step-guide strong { display:block; font-size:14px; line-height:1.25; }
        .driver-step-guide small { display:block; margin-top:3px; color:#657a73; font-size:11px; line-height:1.35; font-weight:650; }
        .empty.driver-search-empty {
          border:1px dashed #bcd7cf !important;
          background:#f6fbf9 !important;
          color:#58706a !important;
          border-radius:18px !important;
          padding:24px 18px !important;
          font-weight:700 !important;
        }
        .status-card.driver-switch-card small.driver-gps-ok { color:#0f8067 !important; font-weight:700 !important; }
        .status-card.driver-switch-card small.driver-gps-off { color:#a26a23 !important; font-weight:700 !important; }
        @media (max-width:600px) {
          .ride-wrap { padding:14px !important; }
          .ride-card .metrics { grid-template-columns:1fr 1fr !important; }
          .ride-card > button.primary { min-height:52px !important; font-size:16px !important; }
        }
      `
      document.head.appendChild(style)
    }

    const getLang = () => localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'

    const updateStepGuide = (lang: 'ht' | 'fr') => {
      const action = document.querySelector<HTMLButtonElement>('button.primary.action, .ride-card.active > button.primary')
      if (!action) {
        document.querySelectorAll('[data-driver-step-guide="true"]').forEach((el) => el.remove())
        return
      }

      const section = action.closest('.section') as HTMLElement | null
      const rideCard = action.closest('.ride-card') as HTMLElement | null
      const host = section || rideCard?.parentElement
      if (!host || !rideCard) return

      let guide = host.querySelector<HTMLElement>('[data-driver-step-guide="true"]')
      if (!guide) {
        guide = document.createElement('div')
        guide.className = 'driver-step-guide'
        guide.dataset.driverStepGuide = 'true'
        guide.innerHTML = '<span class="driver-step-icon" aria-hidden="true"></span><div><strong></strong><small></small></div>'
        host.insertBefore(guide, rideCard)
      }

      const text = (action.textContent || '').toLowerCase()
      let icon = '🚕'
      let title = ''
      let detail = ''

      if (text.includes('arrivé') || text.includes('rive')) {
        icon = '📍'
        title = lang === 'ht' ? 'Ale pran kliyan an' : 'Allez chercher le client'
        detail = lang === 'ht' ? 'Swiv direksyon an rive nan kote kliyan an ap tann lan.' : 'Suivez l’itinéraire jusqu’au point de prise en charge.'
      } else if (text.includes('commencer') || text.includes('kòmanse')) {
        icon = '👤'
        title = lang === 'ht' ? 'Kliyan an pare pou monte' : 'Le client est prêt à monter'
        detail = lang === 'ht' ? 'Lè kliyan an antre nan veyikil la, peze Kòmanse trajè a.' : 'Quand le client est dans le véhicule, commencez le trajet.'
      } else if (text.includes('terminer') || text.includes('fini')) {
        icon = '🛣️'
        title = lang === 'ht' ? 'Trajè an kou' : 'Trajet en cours'
        detail = lang === 'ht' ? 'Kondwi rive nan destinasyon an. Peze Fini trajè a sèlman lè kliyan an rive.' : 'Conduisez jusqu’à destination. Terminez le trajet uniquement à l’arrivée.'
      }

      const iconEl = guide.querySelector<HTMLElement>('.driver-step-icon')
      const strong = guide.querySelector<HTMLElement>('strong')
      const small = guide.querySelector<HTMLElement>('small')
      if (iconEl && iconEl.textContent !== icon) iconEl.textContent = icon
      if (strong && strong.textContent !== title) strong.textContent = title
      if (small && small.textContent !== detail) small.textContent = detail
    }

    const apply = () => {
      const lang = getLang()

      document.querySelectorAll<HTMLButtonElement>('.ride-wrap > button.primary, .ride-card:not(.active) > button.primary').forEach((button) => {
        button.classList.add('driver-accept-action')
      })

      document.querySelectorAll<HTMLButtonElement>('button.primary.action, .ride-card.active > button.primary').forEach((button) => {
        button.classList.remove('driver-arriving-action', 'driver-start-action', 'driver-complete-action')
        const text = (button.textContent || '').toLowerCase()
        if (text.includes('arrivé') || text.includes('rive')) button.classList.add('driver-arriving-action')
        else if (text.includes('commencer') || text.includes('kòmanse')) button.classList.add('driver-start-action')
        else if (text.includes('terminer') || text.includes('fini')) button.classList.add('driver-complete-action')
      })

      document.querySelectorAll<HTMLElement>('.pill').forEach((pill) => {
        const raw = (pill.textContent || '').trim()
        const labels: Record<string, [string, string]> = {
          accepted: ['En route vers le client', 'Sou wout pou kliyan an'],
          driver_arriving: ['Arrivé au point de prise en charge', 'Rive kote kliyan an'],
          in_progress: ['Trajet en cours', 'Trajè an kou'],
        }
        const label = labels[raw]
        if (label) pill.textContent = lang === 'ht' ? label[1] : label[0]
        pill.classList.add('driver-status-pill')
      })

      updateStepGuide(lang)

      document.querySelectorAll<HTMLElement>('.empty').forEach((empty) => {
        const text = (empty.textContent || '').toLowerCase()
        if (text.includes('aucune demande') || text.includes('pa gen demann')) {
          empty.classList.add('driver-search-empty')
          const desired = lang === 'ht' ? '🔎 N ap chèche nouvo trajè pou ou…' : '🔎 Nous recherchons de nouvelles courses pour vous…'
          if (empty.textContent !== desired) empty.textContent = desired
        }
      })

      const gps = document.querySelector<HTMLElement>('.status-card.driver-switch-card small')
      if (gps) {
        gps.classList.remove('driver-gps-ok', 'driver-gps-off')
        const text = (gps.textContent || '').toLowerCase()
        const active = text.includes('active') || text.includes('aktif')
        gps.classList.add(active ? 'driver-gps-ok' : 'driver-gps-off')
      }
    }

    const onClickCapture = (event: Event) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest('.ride-wrap > button.primary, button.primary.action, .ride-card > button.primary') as HTMLButtonElement | null
      if (!button || button.disabled) return

      if (button.dataset.rideClickLock === 'true') {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      const text = (button.textContent || '').toLowerCase()
      const lang = getLang()
      const isStart = text.includes('commencer') || text.includes('kòmanse')
      const isFinish = text.includes('terminer') || text.includes('fini')

      if (isStart) {
        const confirmed = window.confirm(lang === 'ht'
          ? 'Èske kliyan an deja nan machin nan epi li pare pou kòmanse trajè a?'
          : 'Le client est-il déjà dans le véhicule et prêt à commencer le trajet ?')
        if (!confirmed) {
          event.preventDefault()
          event.stopPropagation()
          return
        }
      }

      if (isFinish) {
        const confirmed = window.confirm(lang === 'ht'
          ? 'Èske kliyan an rive nan destinasyon an? Konfime pou fini trajè a.'
          : 'Le client est-il arrivé à destination ? Confirmez pour terminer le trajet.')
        if (!confirmed) {
          event.preventDefault()
          event.stopPropagation()
          return
        }
      }

      button.dataset.rideClickLock = 'true'
      window.setTimeout(() => {
        if (button.isConnected) delete button.dataset.rideClickLock
      }, 1400)
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('click', onClickCapture, true)

    return () => {
      observer.disconnect()
      document.removeEventListener('click', onClickCapture, true)
    }
  }, [])

  return null
}
