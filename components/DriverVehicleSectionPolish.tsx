'use client'

import { useEffect } from 'react'

export default function DriverVehicleSectionPolish(){
  useEffect(()=>{
    if(window.location.pathname!=='/driver/dashboard') return

    const styleId='driver-vehicle-section-polish-style'
    if(!document.getElementById(styleId)){
      const style=document.createElement('style')
      style.id=styleId
      style.textContent=`
        .dfm-section.driver-vehicle-polish .dfm-body{background:#f8faf9;border-radius:18px;padding:12px!important}
        .driver-vehicle-summary{background:linear-gradient(145deg,#102033,#17354f);color:#fff;border-radius:18px;padding:14px;margin-bottom:12px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 20px rgba(16,32,51,.16)}
        .driver-vehicle-summary .dvs-icon{width:50px;height:50px;border-radius:15px;display:grid;place-items:center;background:rgba(255,255,255,.12);font-size:24px;border:1px solid rgba(255,255,255,.2)}
        .driver-vehicle-summary strong{display:block;font-size:14px}.driver-vehicle-summary small{display:block;margin-top:3px;font-size:10px;opacity:.82}
        .driver-vehicle-summary .dvs-badge{margin-left:auto;background:#e8f6f1;color:#0f705a;border-radius:999px;padding:6px 9px;font-size:9px;font-weight:900;white-space:nowrap}
        .driver-vehicle-group-title{margin:12px 2px 7px;font-size:10px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:#708078}
        .dfm-section.driver-vehicle-polish .dfm-row{background:#fff;border:1px solid #e5ebe8;border-radius:12px;padding:10px 11px;margin:7px 0!important;align-items:center}
        .dfm-section.driver-vehicle-polish .dfm-row span{font-size:10px;color:#7c8a84}.dfm-section.driver-vehicle-polish .dfm-row b{font-size:11px;color:#173246}
        .dfm-section.driver-vehicle-polish .dfm-field{background:#fff;border:1px solid #e5ebe8;border-radius:12px;padding:9px 10px;margin:7px 0!important}
        .dfm-section.driver-vehicle-polish .dfm-field input,.dfm-section.driver-vehicle-polish .dfm-field select{border:0!important;background:#f6f8f7!important;padding:10px!important}
        .dfm-section.driver-vehicle-polish .dfm-primary{border-radius:13px!important;padding:12px!important;box-shadow:0 7px 16px rgba(15,112,90,.14)}
      `
      document.head.appendChild(style)
    }

    const apply=()=>{
      const sections=Array.from(document.querySelectorAll<HTMLElement>('.dfm-section'))
      const vehicle=sections.find(section=>{
        const trigger=section.querySelector<HTMLElement>('.dfm-trigger')
        const txt=(trigger?.textContent||'').toLowerCase()
        return txt.includes('veyikil')||txt.includes('véhicule')||txt.includes('vehicule')
      })
      if(!vehicle) return
      vehicle.classList.add('driver-vehicle-polish')
      const body=vehicle.querySelector<HTMLElement>('.dfm-body')
      if(!body) return

      const ht=localStorage.getItem('taxi-language')==='ht'
      const text=(body.textContent||'').toLowerCase()
      const moto=text.includes('moto')
      if(!body.querySelector('.driver-vehicle-summary')){
        const summary=document.createElement('div')
        summary.className='driver-vehicle-summary'
        summary.innerHTML=`<div class="dvs-icon">${moto?'🏍️':'🚗'}</div><div><strong>${ht?'Veyikil chofè':'Véhicule chauffeur'}</strong><small>${ht?'Enfòmasyon veyikil ki anrejistre':'Informations du véhicule enregistré'}</small></div><span class="dvs-badge">${ht?'Aktif':'Actif'}</span>`
        body.insertBefore(summary,body.firstChild)
      }

      const rows=Array.from(body.querySelectorAll<HTMLElement>(':scope > .dfm-row,:scope > .dfm-field'))
      if(rows.length && !body.querySelector('.driver-vehicle-group-title')){
        const general=document.createElement('div')
        general.className='driver-vehicle-group-title'
        general.textContent=ht?'Detay veyikil':'Détails du véhicule'
        rows[0].insertAdjacentElement('beforebegin',general)

        const plateRow=rows.find(el=>{
          const txt=(el.textContent||'').toLowerCase()
          return txt.includes('plak')||txt.includes('plaque')||txt.includes('ane')||txt.includes('année')||txt.includes('annee')
        })
        if(plateRow){
          const registration=document.createElement('div')
          registration.className='driver-vehicle-group-title'
          registration.textContent=ht?'Anrejistreman ak kapasite':'Immatriculation et capacité'
          plateRow.insertAdjacentElement('beforebegin',registration)
        }
      }
    }

    apply()
    const observer=new MutationObserver(apply)
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])
  return null
}
