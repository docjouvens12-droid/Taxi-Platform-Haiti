'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function PassengerMenuCompactPolish() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/passenger/dashboard') return

    const id = 'passenger-menu-compact-polish'
    document.getElementById(id)?.remove()
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      .nav-drawer{
        width:min(60vw,244px)!important;
        height:auto!important;
        min-height:0!important;
        max-height:calc(100dvh - 8px)!important;
        padding:8px 10px 10px!important;
        border-bottom-right-radius:18px!important;
        font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;
      }
      .nav-drawer .drawer-head{padding:0!important;margin:0 0 3px!important;min-height:30px!important}
      .nav-drawer .drawer-head>button{width:29px!important;height:29px!important;font-size:18px!important}
      .nav-drawer .drawer-user{margin:0 0 5px!important;padding:0!important;min-height:38px!important}
      .nav-drawer .drawer-avatar{width:38px!important;height:38px!important;font-size:13px!important;font-weight:800!important}
      .nav-drawer .drawer-nav{display:grid!important;gap:1px!important;margin:0!important;padding:0!important}
      .nav-drawer .drawer-nav>button{
        display:grid!important;
        grid-template-columns:24px minmax(0,1fr) 14px!important;
        align-items:center!important;
        gap:7px!important;
        width:100%!important;
        min-height:38px!important;
        height:38px!important;
        margin:0!important;
        padding:6px 6px!important;
        border:0!important;
        border-radius:9px!important;
        background:transparent!important;
        color:#243747!important;
        font-family:inherit!important;
        font-size:12px!important;
        font-weight:750!important;
        line-height:1!important;
        text-align:left!important;
        box-shadow:none!important;
      }
      .nav-drawer .drawer-nav>button.active{background:#eef7f4!important;color:#243747!important}
      .nav-drawer .drawer-nav>button>*{color:#243747!important;font-family:inherit!important;font-weight:750!important}
      .nav-drawer .drawer-nav>button span:first-child{display:flex!important;align-items:center!important;justify-content:center!important;width:20px!important;font-size:14px!important;line-height:1!important}
      .nav-drawer .drawer-nav>button b:last-child{font-size:14px!important;font-weight:700!important;color:#7a8998!important;text-align:right!important}

      .passenger-profile-details,.passenger-payment-details{
        margin:0!important;
        padding:2px 4px 5px 31px!important;
        border-bottom:1px solid #edf0f2!important;
      }
      .passenger-profile-details p{margin:4px 0!important;font-size:10.5px!important;line-height:1.15!important}
      .passenger-profile-details span,.passenger-profile-details b{font-size:10.5px!important;font-weight:700!important}
      .passenger-pay-provider{margin:4px 0!important;padding:7px!important;border-radius:9px!important}
      .passenger-pay-head strong{font-size:11px!important;font-weight:750!important}
      .passenger-pay-form{gap:4px!important;margin-top:5px!important}
      .passenger-pay-form label{font-size:10.5px!important;font-weight:700!important}
      .passenger-pay-form input{padding:7px 8px!important;font-size:12px!important}
      .passenger-pay-note,.passenger-pay-status{font-size:9.5px!important}
      .passenger-pay-save{padding:7px 8px!important;font-size:10.5px!important}

      .passenger-rides-details,.passenger-help-details{
        display:none!important;
        width:100%!important;
        box-sizing:border-box!important;
        margin:0!important;
        padding:0 0 4px 31px!important;
        border:0!important;
        background:transparent!important;
      }
      .passenger-rides-details.open,.passenger-help-details.open{display:grid!important;gap:3px!important}
      .passenger-rides-loading,.passenger-rides-empty{padding:4px 5px!important;margin:0!important;font-size:10px!important}
      .passenger-ride-card{padding:6px!important;margin:0!important;border-radius:8px!important}
      .passenger-ride-top{margin-bottom:2px!important}
      .passenger-ride-route{margin:1px 0!important;font-size:9.5px!important}
      .passenger-ride-price{margin-top:2px!important;font-size:10px!important}
      .passenger-help-item{width:100%!important;min-height:32px!important;margin:0!important;padding:5px 6px!important;border-radius:8px!important;background:#f7f9fa!important;color:#243747!important;font-family:inherit!important;font-size:10.5px!important;font-weight:750!important;line-height:1.1!important}
      .passenger-help-item b{font-size:10.5px!important;font-weight:750!important;color:#243747!important}
      .passenger-help-item span:first-child{font-size:13px!important}
      .passenger-help-item span:last-child{font-size:12px!important}
      .passenger-help-answer{margin:0!important;padding:5px 6px!important;font-size:9.5px!important;line-height:1.3!important}
      .passenger-help-contact{min-height:32px!important;padding:6px!important;margin:0!important;border-radius:8px!important;font-size:10.5px!important;font-weight:750!important}

      .nav-drawer .drawer-language,
      .nav-drawer [data-passenger-language-row="true"]{
        min-height:40px!important;
        margin:5px 0 0!important;
        padding:7px 6px 4px!important;
        border-top:1px solid #dde5e9!important;
        color:#243747!important;
        font-family:inherit!important;
      }
      .nav-drawer .drawer-language small,
      .nav-drawer .drawer-language>span,
      .nav-drawer .drawer-language b,
      .passenger-language-title{
        font-size:11px!important;
        font-weight:750!important;
        color:#5f6f7d!important;
        line-height:1!important;
      }
      .nav-drawer .drawer-language small{margin:0 0 2px!important}
      .nav-drawer .drawer-language .language-trigger{padding:5px 6px!important;font-size:12px!important;font-weight:750!important;color:#243747!important}
      .passenger-lang-shell{height:30px!important;font-family:inherit!important}
      .passenger-lang-label{font-size:9.5px!important;font-weight:800!important}

      .nav-drawer .drawer-nav>button[data-passenger-help-route="true"],
      .nav-drawer .drawer-nav>button[data-passenger-help-ready="true"]{
        margin-top:1px!important;
      }

      .nav-drawer .drawer-logout,
      .nav-drawer [data-passenger-logout="true"]{
        width:100%!important;
        min-height:38px!important;
        height:38px!important;
        margin:6px 0 0!important;
        padding:7px 10px!important;
        border-radius:9px!important;
        font-family:inherit!important;
        font-size:12px!important;
        font-weight:750!important;
        line-height:1!important;
        color:#9a3030!important;
        background:#fff7f7!important;
        border:1px solid #efdede!important;
        box-shadow:none!important;
      }
    `
    document.head.appendChild(style)
    return () => document.getElementById(id)?.remove()
  }, [pathname])

  return null
}
