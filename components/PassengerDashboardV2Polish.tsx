'use client'

import { useEffect } from 'react'

export default function PassengerDashboardV2Polish(){
  useEffect(()=>{
    if(window.location.pathname!=='/passenger/dashboard') return

    const apply=()=>{
      const brand=document.querySelector<HTMLElement>('.brand-chip strong')
      if(brand) brand.textContent='Taxi Haiti'
      const mark=document.querySelector<HTMLElement>('.brand-chip .brand-mark')
      if(mark) mark.textContent='🚕'

      document.querySelectorAll<HTMLButtonElement>('.ride-option').forEach((button)=>{
        const text=(button.textContent||'').toLowerCase()
        if(text.includes('comfort')||text.includes('plis espas')||text.includes("plus d’espace")||text.includes("plus d'espace")){
          button.style.setProperty('display','none','important')
        }
      })

      const paymentStrong=document.querySelector<HTMLElement>('.payment-row strong')
      if(paymentStrong){
        const ht=localStorage.getItem('taxi-language')==='ht'
        const method=localStorage.getItem('taxi-payment-method')
        paymentStrong.textContent=method==='moncash'?'MonCash':method==='natcash'?'NatCash':(ht?'Chwazi peman':'Choisir un paiement')
      }
    }

    apply()
    const observer=new MutationObserver(apply)
    observer.observe(document.body,{childList:true,subtree:true})
    window.addEventListener('taxi-payment-method-change',apply)
    window.addEventListener('storage',apply)
    return()=>{
      observer.disconnect()
      window.removeEventListener('taxi-payment-method-change',apply)
      window.removeEventListener('storage',apply)
    }
  },[])

  return <style>{`
    body.passenger-home-premium .greeting-row{display:none!important}
    body.passenger-home-premium .booking-sheet{padding-top:14px!important}
    body.passenger-home-premium .route-card{margin-top:2px!important}
    body.passenger-home-premium .section-heading{margin-top:12px!important}
    body.passenger-home-premium .ride-list{grid-template-columns:1fr 1fr!important}
    body.passenger-home-premium .ride-option{min-height:88px!important}
    body.passenger-home-premium .map-panel.real-map-panel{height:48dvh!important;min-height:350px!important}
    body.passenger-home-premium .booking-sheet{margin-top:-56px!important}
    body.passenger-home-premium .brand-chip{min-width:132px!important;justify-content:center!important}
    body.passenger-home-premium .brand-chip .brand-mark{font-size:16px!important}
    body.passenger-home-premium .payment-row{margin-top:8px!important}
    body.passenger-home-premium .request-button{min-height:58px!important;font-size:15px!important}
    @media(max-width:420px){
      body.passenger-home-premium .map-panel.real-map-panel{height:46dvh!important;min-height:335px!important}
      body.passenger-home-premium .booking-sheet{margin-top:-50px!important}
    }
  `}</style>
}
