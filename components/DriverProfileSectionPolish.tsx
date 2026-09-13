'use client'

import { useEffect } from 'react'

export default function DriverProfileSectionPolish(){
  useEffect(()=>{
    if(window.location.pathname!=='/driver/dashboard') return

    const styleId='driver-profile-section-polish-style'
    if(!document.getElementById(styleId)){
      const style=document.createElement('style')
      style.id=styleId
      style.textContent=`
        .dfm-section.driver-profile-polish .dfm-body{background:#f8faf9;border-radius:18px;padding:12px!important}
        .driver-profile-summary{background:linear-gradient(145deg,#0f705a,#155f51);color:#fff;border-radius:18px;padding:14px;margin-bottom:12px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 20px rgba(15,112,90,.16)}
        .driver-profile-summary .dps-avatar{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.16);font-size:22px;border:2px solid rgba(255,255,255,.34)}
        .driver-profile-summary strong{display:block;font-size:14px}.driver-profile-summary small{display:block;margin-top:3px;font-size:10px;opacity:.84}
        .driver-profile-summary .dps-badge{margin-left:auto;background:#e8f6f1;color:#0f705a;border-radius:999px;padding:6px 9px;font-size:9px;font-weight:900;white-space:nowrap}
        .driver-profile-group-title{margin:12px 2px 7px;font-size:10px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:#708078}
        .dfm-section.driver-profile-polish .dfm-row{background:#fff;border:1px solid #e5ebe8;border-radius:12px;padding:10px 11px;margin:7px 0!important;align-items:center}
        .dfm-section.driver-profile-polish .dfm-row span{font-size:10px;color:#7c8a84}.dfm-section.driver-profile-polish .dfm-row b{font-size:11px;color:#173246}
        .dfm-section.driver-profile-polish .dfm-field{background:#fff;border:1px solid #e5ebe8;border-radius:12px;padding:9px 10px;margin:7px 0!important}
        .dfm-section.driver-profile-polish .dfm-field input,.dfm-section.driver-profile-polish .dfm-field select{border:0!important;background:#f6f8f7!important;padding:10px!important}
        .dfm-section.driver-profile-polish .dfm-primary{border-radius:13px!important;padding:12px!important;box-shadow:0 7px 16px rgba(15,112,90,.14)}
      `
      document.head.appendChild(style)
    }

    const apply=()=>{
      const sections=Array.from(document.querySelectorAll<HTMLElement>('.dfm-section'))
      const profile=sections.find(section=>{
        const trigger=section.querySelector<HTMLElement>('.dfm-trigger')
        const txt=(trigger?.textContent||'').toLowerCase()
        return txt.includes('pwofil')||txt.includes('profil')
      })
      if(!profile) return
      profile.classList.add('driver-profile-polish')
      const body=profile.querySelector<HTMLElement>('.dfm-body')
      if(!body) return

      if(!body.querySelector('.driver-profile-summary')){
        const summary=document.createElement('div')
        summary.className='driver-profile-summary'
        const ht=localStorage.getItem('taxi-language')==='ht'
        summary.innerHTML=`<div class="dps-avatar">👤</div><div><strong>${ht?'Pwofil chofè':'Profil chauffeur'}</strong><small>${ht?'Enfòmasyon kont ou':'Informations de votre compte'}</small></div><span class="dps-badge">${ht?'Aktif':'Actif'}</span>`
        body.insertBefore(summary,body.firstChild)
      }

      const rows=Array.from(body.querySelectorAll<HTMLElement>(':scope > .dfm-row,:scope > .dfm-field'))
      if(rows.length && !body.querySelector('.driver-profile-group-title')){
        const ht=localStorage.getItem('taxi-language')==='ht'
        const personal=document.createElement('div')
        personal.className='driver-profile-group-title'
        personal.textContent=ht?'Enfòmasyon pèsonèl':'Informations personnelles'
        rows[0].insertAdjacentElement('beforebegin',personal)

        const documentRow=rows.find(el=>{
          const txt=(el.textContent||'').toLowerCase()
          return txt.includes('lisans')||txt.includes('permis')||txt.includes('idantifikasyon')||txt.includes('identification')
        })
        if(documentRow){
          const docs=document.createElement('div')
          docs.className='driver-profile-group-title'
          docs.textContent=ht?'Dokiman ak idantifikasyon':'Documents et identification'
          documentRow.insertAdjacentElement('beforebegin',docs)
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
