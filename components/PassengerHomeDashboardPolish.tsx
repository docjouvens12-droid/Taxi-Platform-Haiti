'use client'

import { useEffect } from 'react'

export default function PassengerHomeDashboardPolish(){
  useEffect(()=>{
    if(window.location.pathname!=='/passenger/dashboard') return
    document.body.classList.add('passenger-home-premium')
    return()=>document.body.classList.remove('passenger-home-premium')
  },[])

  return <style>{`
    body.passenger-home-premium{background:#f6f8fa!important;color:#102033!important}
    body.passenger-home-premium .shell{background:#f6f8fa!important;min-height:100dvh!important}
    body.passenger-home-premium .phone-frame{max-width:560px!important;margin:0 auto!important;background:#f6f8fa!important;box-shadow:none!important;min-height:100dvh!important}
    body.passenger-home-premium .app-underlay{background:#f6f8fa!important}

    body.passenger-home-premium .map-panel.real-map-panel{
      height:42dvh!important;
      min-height:320px!important;
      max-height:440px!important;
      position:relative!important;
      overflow:hidden!important;
      border-radius:0 0 28px 28px!important;
      background:#dfe9e5!important;
      isolation:isolate!important;
    }

    body.passenger-home-premium .map-panel .topbar{
      position:absolute!important;
      top:max(14px,env(safe-area-inset-top))!important;
      left:14px!important;
      right:14px!important;
      z-index:2147483000!important;
      display:grid!important;
      grid-template-columns:48px 1fr 48px!important;
      align-items:center!important;
      gap:10px!important;
      pointer-events:auto!important;
      touch-action:manipulation!important;
    }
    body.passenger-home-premium .map-panel .topbar>*{pointer-events:auto!important}
    body.passenger-home-premium .map-panel .topbar>.round-button:first-child{
      position:relative!important;
      z-index:2147483001!important;
      pointer-events:auto!important;
      touch-action:manipulation!important;
      -webkit-tap-highlight-color:transparent!important;
    }
    body.passenger-home-premium .round-button{
      width:46px!important;height:46px!important;border:0!important;border-radius:15px!important;
      background:#fff!important;color:#102033!important;box-shadow:0 8px 24px rgba(16,32,51,.14)!important;
      display:grid!important;place-items:center!important;font-size:18px!important;font-weight:850!important;
    }
    body.passenger-home-premium .brand-chip{
      justify-self:center!important;display:flex!important;align-items:center!important;gap:9px!important;
      background:rgba(255,255,255,.96)!important;border:1px solid rgba(255,255,255,.85)!important;
      border-radius:18px!important;padding:7px 12px!important;box-shadow:0 8px 24px rgba(16,32,51,.12)!important;
      max-width:230px!important;
    }
    body.passenger-home-premium .brand-chip .brand-mark{
      width:30px!important;height:30px!important;border-radius:10px!important;background:#0f705a!important;color:#fff!important;
      display:grid!important;place-items:center!important;font-weight:900!important;font-size:14px!important;
    }
    body.passenger-home-premium .brand-chip strong{font-size:14px!important;color:#102033!important;white-space:nowrap!important}
    body.passenger-home-premium .brand-chip small{display:none!important}
    body.passenger-home-premium .brand-chip strong{font-size:0!important}
    body.passenger-home-premium .brand-chip strong::after{content:'MOVI';font-size:17px!important;font-weight:950!important;letter-spacing:-.03em!important}

    body.passenger-home-premium .booking-sheet{
      position:relative!important;z-index:30!important;margin:-30px 12px 18px!important;padding:18px 14px 18px!important;
      background:#fff!important;border:1px solid #e3ebe7!important;border-radius:26px!important;
      box-shadow:0 16px 42px rgba(16,32,51,.11)!important;
    }
    body.passenger-home-premium .drawer-backdrop{
      position:fixed!important;
      inset:0!important;
      z-index:2147483600!important;
      pointer-events:auto!important;
    }
    body.passenger-home-premium .nav-drawer{
      position:fixed!important;
      z-index:2147483640!important;
      pointer-events:auto!important;
      transform:translateZ(0)!important;
    }
    body.passenger-home-premium .grabber{width:38px!important;height:4px!important;border-radius:999px!important;background:#d9e2de!important;margin:0 auto 14px!important}

    body.passenger-home-premium .greeting-row{align-items:flex-start!important;gap:10px!important;margin-bottom:14px!important}
    body.passenger-home-premium .greeting-row .eyebrow{font-size:11px!important;color:#6f8079!important;margin-bottom:3px!important}
    body.passenger-home-premium .greeting-row h1{font-size:24px!important;line-height:1.08!important;color:#102033!important;margin:0!important;letter-spacing:-.5px!important}
    body.passenger-home-premium .online-pill{background:#eaf5f1!important;color:#0f705a!important;border:1px solid #cfe6de!important;border-radius:999px!important;padding:7px 9px!important;font-size:10px!important;font-weight:850!important;white-space:nowrap!important}

    body.passenger-home-premium .route-card{background:#f7f9f8!important;border:1px solid #e1e9e5!important;border-radius:18px!important;padding:8px 12px!important;margin-bottom:10px!important}
    body.passenger-home-premium .route-line{min-height:58px!important;display:flex!important;align-items:center!important;gap:10px!important}
    body.passenger-home-premium .pickup-dot{width:11px!important;height:11px!important;border-radius:50%!important;background:#0f705a!important;box-shadow:0 0 0 4px #dff0ea!important}
    body.passenger-home-premium .destination-dot{width:11px!important;height:11px!important;border-radius:3px!important;background:#102033!important;box-shadow:0 0 0 4px #e8ecef!important}
    body.passenger-home-premium .connector{margin-left:5px!important;border-left:2px dashed #bcc9c4!important;height:16px!important}
    body.passenger-home-premium .input-wrap label{font-size:9px!important;text-transform:uppercase!important;letter-spacing:.5px!important;color:#7b8984!important;font-weight:800!important}
    body.passenger-home-premium .input-wrap input{border:0!important;background:transparent!important;padding:4px 0!important;font-size:14px!important;font-weight:750!important;color:#102033!important;box-shadow:none!important}
    body.passenger-home-premium .input-wrap input::placeholder{color:#94a19c!important;font-weight:600!important}

    body.passenger-home-premium .search-results{border:1px solid #e2e9e6!important;border-radius:16px!important;background:#fff!important;box-shadow:0 12px 30px rgba(16,32,51,.1)!important;overflow:hidden!important;margin-bottom:12px!important}

    body.passenger-home-premium .section-heading{margin:15px 0 8px!important;align-items:end!important}
    body.passenger-home-premium .section-heading .eyebrow{display:none!important}
    body.passenger-home-premium .section-heading h2{font-size:16px!important;color:#102033!important;margin:0!important}
    body.passenger-home-premium .section-heading>span{font-size:10px!important;color:#73827c!important}

    body.passenger-home-premium .ride-list{display:grid!important;grid-template-columns:1fr 1fr!important;gap:9px!important;margin-bottom:12px!important}
    body.passenger-home-premium .ride-option{
      position:relative!important;min-height:94px!important;border:1px solid #e0e8e4!important;border-radius:17px!important;
      background:#fff!important;padding:11px!important;display:grid!important;grid-template-columns:38px 1fr!important;grid-template-rows:auto auto!important;
      text-align:left!important;gap:4px 8px!important;box-shadow:0 5px 14px rgba(16,32,51,.04)!important;
    }
    body.passenger-home-premium .ride-option.selected{border:2px solid #0f705a!important;background:#f1f8f5!important;box-shadow:0 7px 18px rgba(15,112,90,.09)!important}
    body.passenger-home-premium .ride-icon{grid-row:1/3!important;width:38px!important;height:38px!important;border-radius:12px!important;background:#eef4f1!important;display:grid!important;place-items:center!important;font-size:20px!important}
    body.passenger-home-premium .ride-copy strong{font-size:13px!important;color:#102033!important}
    body.passenger-home-premium .ride-copy small{font-size:9px!important;color:#75837e!important;line-height:1.25!important}
    body.passenger-home-premium .ride-price{grid-column:2!important;font-size:11px!important;color:#0f705a!important}

    body.passenger-home-premium .payment-row{border:1px solid #e2e9e6!important;border-radius:15px!important;background:#f8faf9!important;padding:11px 12px!important;margin:10px 0!important}
    body.passenger-home-premium .payment-icon{width:34px!important;height:34px!important;border-radius:11px!important;background:#eaf5f1!important;display:grid!important;place-items:center!important}
    body.passenger-home-premium .payment-row small{font-size:9px!important;color:#7d8a85!important}
    body.passenger-home-premium .payment-row strong{font-size:12px!important;color:#102033!important}
    body.passenger-home-premium .payment-row button{color:#0f705a!important;font-weight:850!important;font-size:11px!important}

    body.passenger-home-premium .request-button{
      width:100%!important;min-height:56px!important;border:0!important;border-radius:17px!important;background:#0f705a!important;color:#fff!important;
      padding:0 15px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;
      font-size:14px!important;font-weight:900!important;box-shadow:0 10px 24px rgba(15,112,90,.22)!important;
    }
    body.passenger-home-premium .request-button:disabled{background:#a8b7b1!important;box-shadow:none!important}
    body.passenger-home-premium .request-button strong{font-size:13px!important;color:#fff!important}
    body.passenger-home-premium .searching-card{border-radius:17px!important;background:#eaf5f1!important;border:1px solid #cde5dc!important;padding:13px!important}
    body.passenger-home-premium .fine-print{display:none!important}

    @media(max-width:420px){
      body.passenger-home-premium .map-panel.real-map-panel{height:39dvh!important;min-height:285px!important}
      body.passenger-home-premium .booking-sheet{margin-top:-24px!important;border-radius:23px!important;padding-left:12px!important;padding-right:12px!important}
      body.passenger-home-premium .greeting-row h1{font-size:22px!important}
      body.passenger-home-premium .brand-chip{padding:6px 10px!important}
    }
  `}</style>
}
