'use client'

export default function PassengerDashboardFinalReview(){
  return <style>{`
    body.passenger-hard-v2{overflow-x:hidden!important;-webkit-text-size-adjust:100%}
    body.passenger-hard-v2 .phone-frame{overflow-x:hidden!important;background:#fff!important}
    body.passenger-hard-v2 .app-underlay{overflow-x:hidden!important}
    body.passenger-hard-v2 .topbar{padding-top:env(safe-area-inset-top)!important}
    body.passenger-hard-v2 .round-button{min-width:44px!important;min-height:44px!important;touch-action:manipulation!important}
    body.passenger-hard-v2 .brand-chip{min-height:44px!important}
    body.passenger-hard-v2 .booking-sheet{scroll-margin-top:12px!important}
    body.passenger-hard-v2 .input-wrap input{font-size:16px!important;min-height:30px!important}
    body.passenger-hard-v2 .ride-option,body.passenger-hard-v2 .payment-row button,body.passenger-hard-v2 .request-button,body.passenger-hard-v2 .search-results button{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
    body.passenger-hard-v2 .ride-option:focus-visible,body.passenger-hard-v2 .payment-row button:focus-visible,body.passenger-hard-v2 .request-button:focus-visible,body.passenger-hard-v2 .search-results button:focus-visible,body.passenger-hard-v2 .round-button:focus-visible{outline:3px solid rgba(15,112,90,.28)!important;outline-offset:2px!important}
    body.passenger-hard-v2 .request-button:not(:disabled):active{transform:translateY(1px)!important;box-shadow:0 8px 17px rgba(15,112,90,.18)!important}
    body.passenger-hard-v2 .ride-option:active{transform:scale(.992)!important}
    body.passenger-hard-v2 .search-results{max-height:260px!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important}
    body.passenger-hard-v2 .ride-error{margin-top:9px!important;border-radius:14px!important;padding:10px 11px!important;font-size:10px!important;line-height:1.35!important}
    body.passenger-hard-v2 .searching-card{box-shadow:0 8px 22px rgba(16,32,51,.07)!important}
    body.passenger-hard-v2 .map-panel.real-map-panel{overflow:hidden!important}
    @media(max-width:390px){
      body.passenger-hard-v2 .booking-sheet{padding-left:12px!important;padding-right:12px!important}
      body.passenger-hard-v2 .ride-list{gap:8px!important}
      body.passenger-hard-v2 .ride-option{padding-left:8px!important;padding-right:8px!important}
      body.passenger-hard-v2 .passenger-booking-head strong{font-size:17px!important}
    }
    @media(prefers-reduced-motion:reduce){
      body.passenger-hard-v2 *,body.passenger-hard-v2 *:before,body.passenger-hard-v2 *:after{scroll-behavior:auto!important;transition:none!important;animation-duration:.001ms!important;animation-iteration-count:1!important}
    }
  `}</style>
}
