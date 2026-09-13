'use client'

import { useEffect } from 'react'

export default function PassengerDashboardHardV2(){
  useEffect(()=>{
    let cancelled=false

    const apply=()=>{
      if(cancelled) return
      const booking=document.querySelector<HTMLElement>('.booking-sheet')
      if(!booking) return

      document.body.classList.add('passenger-hard-v2')

      const greeting=document.querySelector<HTMLElement>('.greeting-row')
      if(greeting) greeting.style.setProperty('display','none','important')

      const ht=localStorage.getItem('taxi-language')==='ht'

      const routeCard=booking.querySelector<HTMLElement>('.route-card')
      if(routeCard && !booking.querySelector('.passenger-booking-head')){
        const head=document.createElement('div')
        head.className='passenger-booking-head'
        head.innerHTML=`<div><small>${ht?'NOUVO TRAJÈ':'NOUVEAU TRAJET'}</small><strong>${ht?'Ki kote ou prale?':'Où allez-vous ?'}</strong><span>${ht?'Chwazi kote pou pran ou ak destinasyon an':'Choisissez le départ et la destination'}</span></div><div class="passenger-booking-head-icon">📍</div>`
        routeCard.insertAdjacentElement('beforebegin',head)
      }

      const routeLines=booking.querySelectorAll<HTMLElement>('.route-card .route-line')
      routeLines.forEach((line,index)=>{
        if(index===0) line.classList.add('passenger-pickup-line')
        if(index===1) line.classList.add('passenger-destination-line')
      })

      document.querySelectorAll<HTMLElement>('.ride-option').forEach((el)=>{
        const text=(el.textContent||'').toLowerCase()
        if(text.includes('comfort')||text.includes('plus d’espace')||text.includes("plus d'espace")||text.includes('plis espas')){
          el.style.setProperty('display','none','important')
          return
        }
        const isMoto=text.includes('moto')
        const isStandard=text.includes('standard')
        if(isMoto) el.classList.add('passenger-moto-option')
        if(isStandard) el.classList.add('passenger-standard-option')
        if((isMoto||isStandard) && !el.querySelector('.passenger-service-badge')){
          const badge=document.createElement('span')
          badge.className='passenger-service-badge'
          badge.textContent=isMoto?(ht?'Pi rapid':'Plus rapide'):(ht?'Rekòmande':'Recommandé')
          el.appendChild(badge)
        }
      })

      const sectionHeading=booking.querySelector<HTMLElement>('.section-heading')
      if(sectionHeading && !sectionHeading.querySelector('.passenger-service-subtitle')){
        const title=sectionHeading.querySelector('h2')
        if(title){
          const sub=document.createElement('small')
          sub.className='passenger-service-subtitle'
          sub.textContent=ht?'Chwazi opsyon ki pi bon pou trajè ou':'Choisissez l’option qui vous convient'
          title.insertAdjacentElement('afterend',sub)
        }
      }

      const brand=document.querySelector<HTMLElement>('.brand-chip strong')
      if(brand && brand.textContent!=='MOVI') brand.textContent='MOVI'
      const mark=document.querySelector<HTMLElement>('.brand-chip .brand-mark')
      if(mark && mark.textContent!=='M') mark.textContent='M'

      const paymentRow=booking.querySelector<HTMLElement>('.payment-row')
      const payment=paymentRow?.querySelector<HTMLElement>('strong')
      if(payment){
        const method=localStorage.getItem('taxi-payment-method')
        const next=method==='moncash'?'MonCash':method==='natcash'?'NatCash':'MonCash / NatCash'
        if(payment.textContent!==next) payment.textContent=next
      }
      if(paymentRow && !paymentRow.querySelector('.passenger-payment-note')){
        const note=document.createElement('small')
        note.className='passenger-payment-note'
        note.textContent=ht?'Verifye metòd peman an anvan ou mande trajè a':'Vérifiez le mode de paiement avant de commander'
        const left=paymentRow.querySelector(':scope > div > div')
        left?.appendChild(note)
      }

      const requestButton=booking.querySelector<HTMLButtonElement>('.request-button')
      if(requestButton && !requestButton.querySelector('.passenger-request-arrow')){
        const arrow=document.createElement('span')
        arrow.className='passenger-request-arrow'
        arrow.textContent='→'
        requestButton.appendChild(arrow)
      }

      const searching=booking.querySelector<HTMLElement>('.searching-card')
      if(searching && !searching.querySelector('.passenger-searching-note')){
        const copy=searching.querySelector('div:last-child')
        if(copy){
          const note=document.createElement('small')
          note.className='passenger-searching-note'
          note.textContent=ht?'Rete sou ekran sa a pandan n ap chèche yon chofè toupre ou.':'Restez sur cet écran pendant la recherche d’un chauffeur proche.'
          copy.appendChild(note)
        }
      }
    }

    document.body.classList.add('passenger-hard-v2')
    const raf=window.requestAnimationFrame(apply)
    const t1=window.setTimeout(apply,180)
    const t2=window.setTimeout(apply,650)

    return()=>{
      cancelled=true
      window.cancelAnimationFrame(raf)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      document.body.classList.remove('passenger-hard-v2')
    }
  },[])

  return <style>{`
    body.passenger-hard-v2{background:#eef3f1!important;overflow-x:hidden!important}
    body.passenger-hard-v2 *,body.passenger-hard-v2 *::before,body.passenger-hard-v2 *::after{scroll-behavior:auto!important}
    body.passenger-hard-v2 .greeting-row{display:none!important}
    body.passenger-hard-v2 .map-panel.real-map-panel{height:43svh!important;min-height:315px!important;max-height:430px!important;transition:none!important;animation:none!important}
    body.passenger-hard-v2 .topbar{top:14px!important;left:14px!important;right:14px!important;transition:none!important}
    body.passenger-hard-v2 .round-button{box-shadow:0 8px 22px rgba(16,32,51,.12)!important;border:1px solid rgba(220,231,226,.95)!important}
    body.passenger-hard-v2 .brand-chip{min-width:126px!important;justify-content:center!important;box-shadow:0 8px 22px rgba(16,32,51,.10)!important;border:1px solid rgba(220,231,226,.92)!important}
    body.passenger-hard-v2 .booking-sheet{margin-top:-42px!important;padding:13px 15px calc(102px + env(safe-area-inset-bottom))!important;border-radius:28px 28px 0 0!important;box-shadow:0 -10px 34px rgba(16,32,51,.08)!important;background:#fff!important;transition:none!important;animation:none!important;transform:none!important}
    body.passenger-hard-v2 .grabber{width:38px!important;height:4px!important;margin-bottom:10px!important;background:#d8e1dd!important}
    body.passenger-hard-v2 .passenger-booking-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 1px 11px;padding:2px 2px 0}
    body.passenger-hard-v2 .passenger-booking-head small{display:block;font-size:9px;font-weight:900;letter-spacing:.08em;color:#0f705a;margin-bottom:2px}
    body.passenger-hard-v2 .passenger-booking-head strong{display:block;font-size:20px;line-height:1.12;color:#13263a;font-weight:900}
    body.passenger-hard-v2 .passenger-booking-head span{display:block;margin-top:3px;font-size:10px;color:#75827d}
    body.passenger-hard-v2 .passenger-booking-head-icon{width:40px;height:40px;border-radius:13px;background:#eaf5f1;display:grid;place-items:center;font-size:18px;flex:0 0 auto}
    body.passenger-hard-v2 .route-card{margin-top:0!important;border-radius:19px!important;padding:4px 12px!important;border:1px solid #dfe9e5!important;box-shadow:0 7px 20px rgba(16,32,51,.05)!important;background:#fff!important;overflow:hidden!important}
    body.passenger-hard-v2 .route-line{position:relative!important;min-height:57px!important}
    body.passenger-hard-v2 .route-line:first-child{border-bottom:1px solid #edf2ef!important}
    body.passenger-hard-v2 .pickup-dot,body.passenger-hard-v2 .destination-dot{width:11px!important;height:11px!important;flex:0 0 11px!important;margin-right:12px!important;box-shadow:0 0 0 5px #f2f8f5!important}
    body.passenger-hard-v2 .pickup-dot{background:#0f705a!important}
    body.passenger-hard-v2 .destination-dot{background:#ef6a5b!important;box-shadow:0 0 0 5px #fff3f1!important}
    body.passenger-hard-v2 .connector{left:17px!important;top:48px!important;height:24px!important;border-left:2px dotted #c7d7d1!important}
    body.passenger-hard-v2 .input-wrap{padding:9px 0!important;min-width:0!important}
    body.passenger-hard-v2 .input-wrap label{font-size:8.5px!important;letter-spacing:.035em!important;text-transform:uppercase!important;color:#7a8882!important;font-weight:900!important}
    body.passenger-hard-v2 .input-wrap input{width:100%!important;font-size:13px!important;font-weight:760!important;color:#1b2d3d!important;line-height:1.3!important;padding:2px 0 1px!important;text-overflow:ellipsis!important}
    body.passenger-hard-v2 .passenger-destination-line .input-wrap input{color:#152638!important}
    body.passenger-hard-v2 .passenger-destination-line .input-wrap input::placeholder{color:#9aa5a0!important;font-weight:600!important}
    body.passenger-hard-v2 .search-results{margin-top:7px!important;border:1px solid #dfe9e5!important;border-radius:16px!important;overflow:hidden!important;background:#fff!important;box-shadow:0 10px 24px rgba(16,32,51,.08)!important;padding:4px!important}
    body.passenger-hard-v2 .search-results button{min-height:48px!important;padding:9px 10px!important;border-radius:12px!important;border:0!important;background:#fff!important;display:flex!important;align-items:center!important;gap:9px!important;text-align:left!important}
    body.passenger-hard-v2 .search-results button+button{border-top:1px solid #eef2f0!important}
    body.passenger-hard-v2 .search-results button span{width:30px!important;height:30px!important;border-radius:9px!important;background:#eef7f4!important;display:grid!important;place-items:center!important;flex:0 0 30px!important}
    body.passenger-hard-v2 .search-results button strong{font-size:10px!important;line-height:1.35!important;color:#30443d!important}
    body.passenger-hard-v2 .search-status{font-size:9px!important;padding:9px 10px!important;color:#73827c!important;font-weight:750!important}
    body.passenger-hard-v2 .section-heading{margin-top:14px!important;align-items:flex-end!important}
    body.passenger-hard-v2 .section-heading h2{font-size:15px!important;line-height:1.15!important}
    body.passenger-hard-v2 .section-heading>span{font-size:9px!important;color:#718078!important;background:#f3f7f5!important;padding:5px 7px!important;border-radius:999px!important}
    body.passenger-hard-v2 .passenger-service-subtitle{display:block!important;margin-top:3px!important;font-size:8.8px!important;color:#87938e!important;font-weight:650!important}
    body.passenger-hard-v2 .ride-list{grid-template-columns:1fr 1fr!important;gap:10px!important;margin-top:9px!important}
    body.passenger-hard-v2 .ride-option{min-height:105px!important;padding:12px 10px 10px!important;border-radius:18px!important;display:grid!important;grid-template-columns:42px 1fr!important;grid-template-rows:auto auto!important;align-items:center!important;text-align:left!important;position:relative!important;border:1px solid #e1e9e6!important;background:#fff!important;box-shadow:0 5px 16px rgba(16,32,51,.045)!important;overflow:hidden!important;transition:none!important}
    body.passenger-hard-v2 .ride-option.selected{border:1.5px solid #59a88f!important;background:linear-gradient(180deg,#f2faf7 0%,#edf7f3 100%)!important;box-shadow:0 8px 20px rgba(15,112,90,.11)!important}
    body.passenger-hard-v2 .ride-option.selected:after{content:'✓';position:absolute;right:8px;top:8px;width:19px;height:19px;border-radius:50%;background:#0f705a;color:#fff;display:grid;place-items:center;font-size:10px;font-weight:900}
    body.passenger-hard-v2 .passenger-service-badge{position:absolute!important;left:9px!important;top:8px!important;padding:3px 6px!important;border-radius:999px!important;font-size:7px!important;font-weight:900!important;letter-spacing:.02em!important;line-height:1!important;background:#eef4f2!important;color:#587069!important}
    body.passenger-hard-v2 .passenger-moto-option .passenger-service-badge{background:#fff6dc!important;color:#9b7415!important}
    body.passenger-hard-v2 .passenger-standard-option .passenger-service-badge{background:#e7f5ef!important;color:#0f705a!important}
    body.passenger-hard-v2 .ride-icon{width:40px!important;height:40px!important;margin:13px 7px 0 0!important;border-radius:13px!important;background:#f3f7f5!important;font-size:20px!important}
    body.passenger-hard-v2 .ride-copy{margin-top:13px!important;min-width:0!important}
    body.passenger-hard-v2 .ride-copy strong{font-size:12px!important;color:#182b3d!important}
    body.passenger-hard-v2 .ride-copy small{font-size:8.5px!important;line-height:1.3!important;color:#7b8983!important}
    body.passenger-hard-v2 .ride-price{grid-column:1 / -1!important;margin-top:8px!important;padding-top:7px!important;border-top:1px solid #e8efec!important;font-size:12px!important;text-align:right!important;color:#0f705a!important;font-weight:900!important}
    body.passenger-hard-v2 .payment-row{margin-top:12px!important;padding:11px 12px!important;border-radius:17px!important;background:linear-gradient(180deg,#f7fbf9 0%,#f1f8f5 100%)!important;border:1px solid #d7e7e1!important;box-shadow:0 5px 16px rgba(16,32,51,.04)!important}
    body.passenger-hard-v2 .payment-row>div{align-items:center!important}
    body.passenger-hard-v2 .payment-icon{width:36px!important;height:36px!important;border-radius:12px!important;display:grid!important;place-items:center!important;background:#e6f3ee!important;font-size:17px!important}
    body.passenger-hard-v2 .payment-row small{font-size:8px!important;color:#7b8883!important;font-weight:800!important}
    body.passenger-hard-v2 .payment-row strong{font-size:12px!important;color:#18302a!important}
    body.passenger-hard-v2 .passenger-payment-note{display:block!important;margin-top:2px!important;font-size:7.6px!important;line-height:1.2!important;color:#8b9893!important;font-weight:600!important}
    body.passenger-hard-v2 .payment-row button{font-size:9px!important;font-weight:900!important;color:#0f705a!important;background:#fff!important;border:1px solid #d8e7e1!important;border-radius:999px!important;padding:6px 9px!important}
    body.passenger-hard-v2 .request-button{position:relative!important;margin-top:11px!important;min-height:60px!important;border-radius:18px!important;background:linear-gradient(180deg,#117b63 0%,#0f705a 100%)!important;box-shadow:0 12px 24px rgba(15,112,90,.21)!important;font-size:13px!important;padding:12px 46px 12px 15px!important;text-align:left!important;transition:none!important}
    body.passenger-hard-v2 .request-button>span:first-child{font-weight:900!important}
    body.passenger-hard-v2 .request-button>strong{font-size:12px!important}
    body.passenger-hard-v2 .passenger-request-arrow{position:absolute!important;right:13px!important;top:50%!important;transform:translateY(-50%)!important;width:30px!important;height:30px!important;border-radius:10px!important;display:grid!important;place-items:center!important;background:rgba(255,255,255,.14)!important;color:#fff!important;font-size:16px!important;font-weight:900!important}
    body.passenger-hard-v2 .request-button:disabled{background:#aebbb6!important;box-shadow:none!important;opacity:.72!important}
    body.passenger-hard-v2 .searching-card{margin-top:11px!important;border-radius:18px!important;min-height:78px!important;padding:12px 13px!important;border:1px solid #cfe2db!important;background:linear-gradient(180deg,#f2faf7 0%,#edf7f3 100%)!important;box-shadow:0 8px 20px rgba(15,112,90,.08)!important}
    body.passenger-hard-v2 .searching-card strong{font-size:12px!important;color:#17392f!important}
    body.passenger-hard-v2 .searching-card small{font-size:8.5px!important;color:#6f8079!important}
    body.passenger-hard-v2 .passenger-searching-note{display:block!important;margin-top:3px!important;max-width:250px!important;font-size:7.8px!important;line-height:1.25!important;color:#87948f!important}
    body.passenger-hard-v2 .spinner{width:34px!important;height:34px!important;border-width:3px!important;border-color:#b9dacf!important;border-top-color:#0f705a!important}
    body.passenger-hard-v2 .fine-print{display:none!important}
    @media(max-width:420px){
      body.passenger-hard-v2 .map-panel.real-map-panel{height:41svh!important;min-height:300px!important}
      body.passenger-hard-v2 .booking-sheet{margin-top:-38px!important}
      body.passenger-hard-v2 .passenger-booking-head strong{font-size:18px!important}
      body.passenger-hard-v2 .ride-option{min-height:100px!important}
    }
  `}</style>
}
