'use client'

import { useEffect } from 'react'

export default function PassengerUnifiedFinalPolish(){
  useEffect(()=>{
    const sync=()=>{
      if(!document.body.classList.contains('passenger-hard-v2')) return
      const ht=localStorage.getItem('taxi-language')==='ht'

      const head=document.querySelector<HTMLElement>('.passenger-booking-head')
      if(head){
        const small=head.querySelector<HTMLElement>('small')
        const strong=head.querySelector<HTMLElement>('strong')
        const span=head.querySelector<HTMLElement>('span')
        const a=ht?'NOUVO TRAJÈ':'NOUVEAU TRAJET'
        const b=ht?'Ki kote ou prale?':'Où allez-vous ?'
        const c=ht?'Chwazi kote pou pran ou ak destinasyon an':'Choisissez le départ et la destination'
        if(small&&small.textContent!==a) small.textContent=a
        if(strong&&strong.textContent!==b) strong.textContent=b
        if(span&&span.textContent!==c) span.textContent=c
      }

      document.querySelectorAll<HTMLElement>('.ride-option').forEach((el)=>{
        const text=(el.textContent||'').toLowerCase()
        const badge=el.querySelector<HTMLElement>('.passenger-service-badge')
        if(!badge) return
        const next=text.includes('moto')?(ht?'Pi rapid':'Plus rapide'):(ht?'Rekòmande':'Recommandé')
        if(badge.textContent!==next) badge.textContent=next
      })

      const sub=document.querySelector<HTMLElement>('.passenger-service-subtitle')
      if(sub){
        const next=ht?'Chwazi opsyon ki pi bon pou trajè ou':'Choisissez l’option qui vous convient'
        if(sub.textContent!==next) sub.textContent=next
      }

      const paymentNote=document.querySelector<HTMLElement>('.passenger-payment-note')
      if(paymentNote){
        const next=ht?'Verifye metòd peman an anvan ou mande trajè a':'Vérifiez le mode de paiement avant de commander'
        if(paymentNote.textContent!==next) paymentNote.textContent=next
      }

      const searchingNote=document.querySelector<HTMLElement>('.passenger-searching-note')
      if(searchingNote){
        const next=ht?'Rete sou ekran sa a pandan n ap chèche yon chofè toupre ou.':'Restez sur cet écran pendant la recherche d’un chauffeur proche.'
        if(searchingNote.textContent!==next) searchingNote.textContent=next
      }
    }

    sync()
    const observer=new MutationObserver(sync)
    observer.observe(document.body,{childList:true,subtree:true})
    const timer=window.setInterval(sync,900)
    window.addEventListener('storage',sync)
    return()=>{
      observer.disconnect()
      window.clearInterval(timer)
      window.removeEventListener('storage',sync)
    }
  },[])

  return <style>{`
    body.passenger-hard-v2{
      -webkit-tap-highlight-color:transparent;
      text-rendering:optimizeLegibility;
    }
    body.passenger-hard-v2 .phone-frame{
      isolation:isolate;
    }
    body.passenger-hard-v2 button,
    body.passenger-hard-v2 input,
    body.passenger-hard-v2 select{
      touch-action:manipulation;
    }
    body.passenger-hard-v2 button:focus-visible,
    body.passenger-hard-v2 input:focus-visible,
    body.passenger-hard-v2 select:focus-visible{
      outline:3px solid rgba(15,112,90,.16)!important;
      outline-offset:2px!important;
    }
    body.passenger-hard-v2 .booking-sheet,
    body.passenger-hard-v2 .nav-drawer,
    body.passenger-hard-v2 .account-panel{
      scrollbar-width:none;
    }
    body.passenger-hard-v2 .booking-sheet::-webkit-scrollbar,
    body.passenger-hard-v2 .nav-drawer::-webkit-scrollbar,
    body.passenger-hard-v2 .account-panel::-webkit-scrollbar{
      display:none;
    }
    body.passenger-hard-v2 .request-button,
    body.passenger-hard-v2 .payment-row button,
    body.passenger-hard-v2 .ride-option,
    body.passenger-hard-v2 .drawer-nav>button{
      transition:transform .14s ease,box-shadow .14s ease,background-color .14s ease,border-color .14s ease!important;
    }
    body.passenger-hard-v2 .request-button:active:not(:disabled),
    body.passenger-hard-v2 .ride-option:active,
    body.passenger-hard-v2 .payment-row button:active,
    body.passenger-hard-v2 .drawer-nav>button:active{
      transform:scale(.985)!important;
    }
    body.passenger-hard-v2 .search-results{
      max-height:250px!important;
      overflow-y:auto!important;
      overscroll-behavior:contain!important;
      -webkit-overflow-scrolling:touch;
    }
    body.passenger-hard-v2 .nav-drawer{
      -webkit-overflow-scrolling:touch;
      overscroll-behavior:contain;
    }
    @media(max-width:420px){
      body.passenger-hard-v2 .input-wrap input{font-size:16px!important}
      body.passenger-hard-v2 .request-button{min-height:58px!important}
      body.passenger-hard-v2 .ride-option{min-height:104px!important}
    }
    @media(prefers-reduced-motion:reduce){
      body.passenger-hard-v2 *,
      body.passenger-hard-v2 *:before,
      body.passenger-hard-v2 *:after{
        scroll-behavior:auto!important;
        animation-duration:.01ms!important;
        animation-iteration-count:1!important;
        transition-duration:.01ms!important;
      }
    }
  `}</style>
}
