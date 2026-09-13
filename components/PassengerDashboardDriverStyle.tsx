'use client'

import { useEffect } from 'react'

export default function PassengerDashboardDriverStyle() {
  useEffect(() => {
    if (window.location.pathname !== '/passenger/dashboard') return

    const id = 'passenger-dashboard-driver-style'
    document.getElementById(id)?.remove()
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      :root{
        --tph-green:#0F705A;
        --tph-green-soft:#58AD98;
        --tph-navy:#102033;
        --tph-bg:#F6F8FA;
        --tph-line:#E1E8E5;
      }
      body{background:var(--tph-bg)!important;color:var(--tph-navy)!important}
      .shell{padding:22px!important;align-items:flex-start!important}
      .phone-frame{
        width:min(100%,520px)!important;
        min-height:calc(100vh - 44px)!important;
        border-radius:30px!important;
        box-shadow:0 24px 70px rgba(16,32,51,.14)!important;
        background:#fff!important;
        overflow:hidden!important;
      }
      .map-panel{
        height:43vh!important;
        min-height:330px!important;
        background:#EAF2EF!important;
      }
      .topbar{
        top:18px!important;
        left:16px!important;
        right:16px!important;
        display:grid!important;
        grid-template-columns:46px minmax(0,1fr) 46px!important;
        align-items:center!important;
        gap:8px!important;
        pointer-events:none!important;
      }
      .topbar>.round-button:first-child{grid-column:1!important;justify-self:start!important}
      .topbar>.brand-chip{grid-column:2!important;justify-self:center!important}
      .topbar>.round-button:last-child{grid-column:3!important;justify-self:end!important}
      .round-button{
        width:46px!important;
        height:46px!important;
        border-radius:16px!important;
        background:#fff!important;
        color:var(--tph-navy)!important;
        box-shadow:0 8px 24px rgba(16,32,51,.14)!important;
        border:1px solid rgba(221,231,227,.95)!important;
        pointer-events:auto!important;
      }
      .brand-chip{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:8px!important;
        width:max-content!important;
        max-width:100%!important;
        border-radius:18px!important;
        padding:7px 12px!important;
        background:rgba(255,255,255,.97)!important;
        border:1px solid rgba(221,231,227,.95)!important;
        box-shadow:0 8px 24px rgba(16,32,51,.13)!important;
        text-align:center!important;
        pointer-events:none!important;
      }
      .brand-mark{
        width:38px!important;
        height:38px!important;
        min-width:38px!important;
        display:grid!important;
        place-items:center!important;
        background:var(--tph-green)!important;
        color:#fff!important;
        border-radius:50%!important;
        box-shadow:0 5px 14px rgba(15,112,90,.22)!important;
        font-size:0!important;
        font-weight:950!important;
      }
      .brand-mark::before{content:'🚕';font-size:18px!important}
      .brand-chip>div{display:flex!important;flex-direction:column!important;align-items:center!important;min-width:0!important}
      .brand-chip strong{
        display:block!important;
        font-size:15px!important;
        line-height:1.05!important;
        color:var(--tph-navy)!important;
        font-weight:950!important;
        white-space:nowrap!important;
      }
      .brand-chip strong{font-size:0!important}
      .brand-chip strong::after{content:'Taxi Haiti';font-size:15px!important}
      .brand-chip small{display:none!important}

      .booking-sheet{
        position:relative!important;
        margin:-34px 12px 14px!important;
        border-radius:28px!important;
        padding:14px 18px 26px!important;
        min-height:54vh!important;
        background:#fff!important;
        box-shadow:0 18px 40px rgba(16,32,51,.12)!important;
        border:1px solid #EDF1EF!important;
      }
      .grabber{width:42px!important;height:5px!important;border-radius:999px!important;background:#D8E2DE!important;margin:0 auto 17px!important}
      .greeting-row{align-items:flex-start!important;margin-bottom:14px!important}
      .eyebrow{color:var(--tph-green)!important;font-size:10px!important;font-weight:900!important;letter-spacing:.05em!important}
      .greeting-row h1{font-size:26px!important;line-height:1.08!important;color:var(--tph-navy)!important;margin-top:3px!important}
      .online-pill{background:#EAF5F1!important;color:var(--tph-green)!important;border:1px solid #CFE5DD!important}

      .route-card{
        border-radius:18px!important;
        border:1px solid var(--tph-line)!important;
        background:#FAFCFB!important;
        box-shadow:0 5px 16px rgba(16,32,51,.04)!important;
        padding:4px 2px!important;
      }
      .route-line{padding:10px 12px!important}
      .input-wrap label{font-size:10px!important;color:#7A8883!important;font-weight:800!important}
      .input-wrap input{font-size:14px!important;color:var(--tph-navy)!important;font-weight:800!important}
      .pickup-dot{background:var(--tph-green)!important;border-color:#D8EEE7!important}
      .destination-dot{background:var(--tph-navy)!important;border-color:#E2E8EC!important}
      .connector{background:#C9D7D1!important}

      .section-heading{margin-top:18px!important}
      .section-heading h2{font-size:17px!important;color:var(--tph-navy)!important}
      .section-heading>span{font-size:10px!important;color:#71817B!important}
      .ride-list{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}
      .ride-option{
        min-width:0!important;
        min-height:92px!important;
        border-radius:18px!important;
        border:1px solid #E1E8E5!important;
        padding:12px!important;
        display:grid!important;
        grid-template-columns:38px 1fr!important;
        grid-template-areas:'icon copy' 'price price'!important;
        align-items:center!important;
        text-align:left!important;
        background:#fff!important;
      }
      .ride-option .ride-icon{grid-area:icon!important;font-size:25px!important}
      .ride-option .ride-copy{grid-area:copy!important;min-width:0!important}
      .ride-option .ride-copy strong{font-size:13px!important;color:var(--tph-navy)!important}
      .ride-option .ride-copy small{font-size:9px!important;color:#74817D!important}
      .ride-option .ride-price{grid-area:price!important;margin-top:10px!important;font-size:12px!important;color:var(--tph-green)!important}
      .ride-option.selected{
        border:2px solid var(--tph-green)!important;
        background:#F0F8F5!important;
        box-shadow:0 6px 18px rgba(15,112,90,.09)!important;
      }

      .payment-row{
        margin-top:14px!important;
        border:1px solid #E1E8E5!important;
        border-radius:16px!important;
        padding:12px!important;
        background:#FBFCFC!important;
      }
      .payment-icon{background:#EAF5F1!important;color:var(--tph-green)!important}
      .payment-row button{color:var(--tph-green)!important;font-weight:850!important}

      .request-button{
        min-height:58px!important;
        border-radius:17px!important;
        background:var(--tph-green)!important;
        box-shadow:0 12px 28px rgba(15,112,90,.23)!important;
        padding:15px 17px!important;
        font-size:14px!important;
      }
      .request-button:active{background:#0B5B49!important;transform:scale(.99)!important}
      .request-button:disabled{background:#B9C7C2!important;box-shadow:none!important}
      .searching-card{border-radius:17px!important;background:var(--tph-navy)!important}
      .search-results{border-radius:16px!important;border:1px solid #E1E8E5!important;box-shadow:0 10px 30px rgba(16,32,51,.10)!important}
      .fine-print{opacity:.58!important}

      .nav-drawer{background:#F8FAF9!important}
      .drawer-nav button.active{background:#EAF5F1!important;color:var(--tph-green)!important}
      .drawer-logout{color:#C94B4B!important;background:#FFF3F3!important;border:1px solid #F0D2D2!important}
      .language-switch button.active,.auth-switch{color:var(--tph-green)!important}
      .auth-form input:focus{border-color:var(--tph-green)!important;box-shadow:0 0 0 3px rgba(15,112,90,.10)!important}

      @media(max-width:600px){
        body{background:#fff!important}
        .shell{padding:0!important}
        .phone-frame{width:100%!important;min-height:100vh!important;border-radius:0!important;box-shadow:none!important}
        .map-panel{height:43vh!important;min-height:330px!important}
        .booking-sheet{margin:-34px 10px 12px!important;padding:13px 16px 112px!important;border-radius:26px!important}
        .topbar{grid-template-columns:42px minmax(0,1fr) 42px!important;gap:6px!important}
        .round-button{width:42px!important;height:42px!important;border-radius:14px!important}
        .brand-chip{padding:6px 10px!important;gap:7px!important;border-radius:16px!important}
        .brand-mark{width:34px!important;height:34px!important;min-width:34px!important}
        .brand-mark::before{font-size:16px!important}
        .brand-chip strong::after{font-size:13px!important}
        .greeting-row h1{font-size:24px!important}
      }
    `
    document.head.appendChild(style)
    return () => document.getElementById(id)?.remove()
  }, [])

  return null
}
