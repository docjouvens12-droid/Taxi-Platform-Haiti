'use client'

import { useEffect } from 'react'

export default function PassengerRidePhasePolish(){
  useEffect(()=>{
    const apply=()=>{
      if(window.location.pathname!=='/' && window.location.pathname!=='/passenger/dashboard') return
      const card=document.querySelector<HTMLElement>('.driverCard')
      if(!card) return

      const ht=localStorage.getItem('taxi-language')==='ht'
      const raw=(card.querySelector('.topLine > strong')?.textContent||'').toLowerCase()
      const arrived=raw.includes('rive')||raw.includes('arrivé')||raw.includes('arrive')
      const progress=raw.includes('ap fèt')||raw.includes('an kou')||raw.includes('en cours')

      card.classList.toggle('passenger-phase-arrived',arrived)
      card.classList.toggle('passenger-phase-progress',progress)

      let panel=card.querySelector<HTMLElement>('.passenger-phase-panel')
      if(!arrived && !progress){
        panel?.remove()
        return
      }

      if(!panel){
        panel=document.createElement('div')
        panel.className='passenger-phase-panel'
        panel.innerHTML='<span class="passenger-phase-icon"></span><div><strong></strong><small></small></div>'
        const safety=card.querySelector('.safetyActions')
        if(safety) safety.insertAdjacentElement('beforebegin',panel)
        else card.appendChild(panel)
      }

      const icon=panel.querySelector<HTMLElement>('.passenger-phase-icon')
      const title=panel.querySelector<HTMLElement>('strong')
      const detail=panel.querySelector<HTMLElement>('small')
      const nextIcon=arrived?'📍':'🛣️'
      const nextTitle=arrived
        ? (ht?'Chofè a rive kote pou pran ou':'Le chauffeur est au point de prise en charge')
        : (ht?'Trajè ou an kou':'Votre trajet est en cours')
      const nextDetail=arrived
        ? (ht?'Prepare pou monte. Verifye chofè a, machin nan ak plak la anvan ou antre.':'Préparez-vous à monter. Vérifiez le chauffeur, le véhicule et la plaque avant d’entrer.')
        : (ht?'W ap deplase pou destinasyon an. Estati ak pozisyon yo ap mete ajou otomatikman.':'Vous êtes en route vers votre destination. Le statut et la position se mettent à jour automatiquement.')

      if(icon && icon.textContent!==nextIcon) icon.textContent=nextIcon
      if(title && title.textContent!==nextTitle) title.textContent=nextTitle
      if(detail && detail.textContent!==nextDetail) detail.textContent=nextDetail
    }

    apply()
    const observer=new MutationObserver(apply)
    observer.observe(document.body,{childList:true,subtree:true})
    const timer=window.setInterval(apply,700)
    return()=>{observer.disconnect();window.clearInterval(timer)}
  },[])

  return <style>{`
    .driverCard .passenger-phase-panel{display:flex;align-items:flex-start;gap:9px;margin-top:9px;padding:10px 11px;border-radius:14px;border:1px solid #d9e8e2;background:#f3faf7;color:#153a31}
    .driverCard .passenger-phase-icon{width:32px;height:32px;border-radius:11px;display:grid;place-items:center;background:#e3f3ed;font-size:16px;flex:0 0 32px}
    .driverCard .passenger-phase-panel div{min-width:0}.driverCard .passenger-phase-panel strong,.driverCard .passenger-phase-panel small{display:block}.driverCard .passenger-phase-panel strong{font-size:11.5px;line-height:1.25;color:#0f705a}.driverCard .passenger-phase-panel small{margin-top:3px;font-size:9.3px;line-height:1.4;color:#667b73;font-weight:650}
    .driverCard.passenger-phase-arrived{border-color:#b7dacd!important;box-shadow:0 18px 52px rgba(15,112,90,.18)!important}.driverCard.passenger-phase-arrived .statusDot{background:#0f8067!important;box-shadow:0 0 0 4px #e4f4ef!important}.driverCard.passenger-phase-arrived .topLine>strong{color:#0f705a!important}.driverCard.passenger-phase-arrived .metrics{display:none!important}
    .driverCard.passenger-phase-progress{border-color:#c8ddf2!important}.driverCard.passenger-phase-progress .passenger-phase-panel{border-color:#d9e5f1;background:#f3f7fb}.driverCard.passenger-phase-progress .passenger-phase-icon{background:#e7f0f8}.driverCard.passenger-phase-progress .passenger-phase-panel strong{color:#173f68}.driverCard.passenger-phase-progress .statusDot{background:#173f68!important;box-shadow:0 0 0 4px #e7eef6!important}.driverCard.passenger-phase-progress .topLine>strong{color:#173f68!important}
    @media(max-width:600px){.driverCard .passenger-phase-panel{padding:9px 10px}.driverCard .passenger-phase-panel small{font-size:9px}}
  `}</style>
}
