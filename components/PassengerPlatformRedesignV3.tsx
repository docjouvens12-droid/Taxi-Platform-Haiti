'use client'

export default function PassengerPlatformRedesignV3(){
  return <style>{`
    body.passenger-hard-v2 .phone-frame{
      background:#f7faf9!important;
    }
    body.passenger-hard-v2 .map-panel.real-map-panel{
      position:relative!important;
      height:44dvh!important;
      min-height:325px!important;
      max-height:445px!important;
      background:#dce9e4!important;
    }
    body.passenger-hard-v2 .map-panel.real-map-panel:after{
      content:'';
      position:absolute;
      inset:auto 0 0;
      height:92px;
      pointer-events:none;
      z-index:2;
      background:linear-gradient(180deg,rgba(247,250,249,0) 0%,rgba(247,250,249,.42) 64%,#f7faf9 100%);
    }
    body.passenger-hard-v2 .topbar{
      top:calc(14px + env(safe-area-inset-top))!important;
      left:14px!important;
      right:14px!important;
      display:grid!important;
      grid-template-columns:44px minmax(0,1fr) 44px!important;
      align-items:center!important;
      gap:10px!important;
      z-index:12!important;
    }
    body.passenger-hard-v2 .topbar>.round-button{
      width:44px!important;
      height:44px!important;
      border-radius:15px!important;
      border:1px solid rgba(215,228,222,.95)!important;
      background:rgba(255,255,255,.96)!important;
      box-shadow:0 8px 22px rgba(16,32,51,.12)!important;
      backdrop-filter:blur(16px)!important;
      -webkit-backdrop-filter:blur(16px)!important;
    }
    body.passenger-hard-v2 .topbar>.round-button:last-child{justify-self:end!important}
    body.passenger-hard-v2 .brand-chip{
      justify-self:center!important;
      min-width:0!important;
      width:max-content!important;
      max-width:210px!important;
      height:46px!important;
      padding:6px 12px 6px 7px!important;
      border-radius:16px!important;
      border:1px solid rgba(213,227,221,.96)!important;
      background:rgba(255,255,255,.96)!important;
      box-shadow:0 8px 24px rgba(16,32,51,.10)!important;
      backdrop-filter:blur(18px)!important;
      -webkit-backdrop-filter:blur(18px)!important;
      text-align:left!important;
    }
    body.passenger-hard-v2 .brand-chip .brand-mark{
      width:34px!important;
      height:34px!important;
      border-radius:12px!important;
      background:linear-gradient(145deg,#13836a,#0f705a)!important;
      box-shadow:0 6px 14px rgba(15,112,90,.22)!important;
      font-size:16px!important;
    }
    body.passenger-hard-v2 .brand-chip strong{
      font-size:13px!important;
      font-weight:900!important;
      letter-spacing:-.01em!important;
      color:#12283a!important;
    }
    body.passenger-hard-v2 .brand-chip small{
      display:none!important;
    }
    body.passenger-hard-v2 .booking-sheet{
      width:calc(100% - 16px)!important;
      max-width:444px!important;
      margin:-48px auto 0!important;
      padding:12px 14px calc(104px + env(safe-area-inset-bottom))!important;
      border-radius:30px 30px 0 0!important;
      background:#fff!important;
      border:1px solid #e5eeea!important;
      border-bottom:0!important;
      box-shadow:0 -8px 28px rgba(16,32,51,.08),0 18px 42px rgba(16,32,51,.06)!important;
      z-index:8!important;
    }
    body.passenger-hard-v2 .grabber{
      width:42px!important;
      height:4px!important;
      margin:1px auto 11px!important;
      background:#d9e4df!important;
    }
    body.passenger-hard-v2 .passenger-booking-head{
      max-width:390px!important;
      margin:0 auto 12px!important;
      padding:0 2px!important;
    }
    body.passenger-hard-v2 .passenger-booking-head strong{
      font-size:21px!important;
      letter-spacing:-.025em!important;
    }
    body.passenger-hard-v2 .passenger-booking-head-icon{
      width:42px!important;
      height:42px!important;
      border-radius:14px!important;
      background:linear-gradient(145deg,#edf8f4,#e4f2ed)!important;
      border:1px solid #d9ebe4!important;
    }
    body.passenger-hard-v2 .route-card,
    body.passenger-hard-v2 .section-heading,
    body.passenger-hard-v2 .ride-list,
    body.passenger-hard-v2 .payment-row,
    body.passenger-hard-v2 .request-button,
    body.passenger-hard-v2 .searching-card,
    body.passenger-hard-v2 .ride-error{
      max-width:390px!important;
      margin-left:auto!important;
      margin-right:auto!important;
    }
    body.passenger-hard-v2 .route-card{
      border-radius:20px!important;
      border:1px solid #dde9e4!important;
      box-shadow:0 8px 22px rgba(16,32,51,.045)!important;
    }
    body.passenger-hard-v2 .section-heading{
      margin-top:16px!important;
    }
    body.passenger-hard-v2 .ride-list{
      gap:9px!important;
    }
    body.passenger-hard-v2 .ride-option{
      border-radius:19px!important;
      border:1px solid #e0eae6!important;
      box-shadow:0 6px 18px rgba(16,32,51,.04)!important;
    }
    body.passenger-hard-v2 .ride-option.selected{
      border-color:#69ae99!important;
      background:linear-gradient(180deg,#f4fbf8 0%,#eef8f4 100%)!important;
      box-shadow:0 9px 22px rgba(15,112,90,.10)!important;
    }
    body.passenger-hard-v2 .payment-row{
      border-radius:18px!important;
      background:#f6faf8!important;
      border:1px solid #dce9e4!important;
      box-shadow:none!important;
    }
    body.passenger-hard-v2 .request-button{
      border-radius:18px!important;
      min-height:60px!important;
      background:linear-gradient(135deg,#13836a 0%,#0f705a 100%)!important;
      box-shadow:0 12px 28px rgba(15,112,90,.20)!important;
    }
    body.passenger-hard-v2 .searching-card{
      border-radius:18px!important;
      box-shadow:0 10px 24px rgba(16,32,51,.12)!important;
    }
    @media(min-width:700px){
      body.passenger-hard-v2 .phone-frame{
        max-width:472px!important;
        min-height:calc(100dvh - 56px)!important;
        border-radius:36px!important;
        border:1px solid rgba(205,219,213,.95)!important;
        box-shadow:0 34px 90px rgba(16,32,51,.18)!important;
      }
      body.passenger-hard-v2 .booking-sheet{
        width:calc(100% - 20px)!important;
        max-width:452px!important;
        border-radius:32px 32px 24px 24px!important;
        margin-bottom:10px!important;
        border-bottom:1px solid #e5eeea!important;
      }
    }
    @media(max-width:420px){
      body.passenger-hard-v2 .map-panel.real-map-panel{height:42dvh!important;min-height:305px!important}
      body.passenger-hard-v2 .brand-chip{height:43px!important;padding-right:10px!important}
      body.passenger-hard-v2 .brand-chip .brand-mark{width:31px!important;height:31px!important;font-size:15px!important}
      body.passenger-hard-v2 .brand-chip strong{font-size:12px!important}
      body.passenger-hard-v2 .booking-sheet{width:calc(100% - 10px)!important;margin-top:-43px!important;padding-left:12px!important;padding-right:12px!important}
    }
  `}</style>
}
