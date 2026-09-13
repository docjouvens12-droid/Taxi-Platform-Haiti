'use client'

import { useEffect } from 'react'

export default function DriverPaymentsSectionPolish(){
  useEffect(()=>{
    if(window.location.pathname!=='/driver/dashboard') return

    const styleId='driver-payments-section-polish-style'
    if(!document.getElementById(styleId)){
      const style=document.createElement('style')
      style.id=styleId
      style.textContent=`
        .dfm-section.driver-payments-polish .dfm-body{background:#f8faf9;border-radius:18px;padding:12px!important}
        .driver-payments-summary{background:linear-gradient(145deg,#102033,#173246);color:#fff;border-radius:18px;padding:14px;margin-bottom:12px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 20px rgba(16,32,51,.15)}
        .driver-payments-summary .dpy-icon{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:rgba(255,255,255,.12);font-size:21px;border:1px solid rgba(255,255,255,.18)}
        .driver-payments-summary strong{display:block;font-size:14px}.driver-payments-summary small{display:block;margin-top:3px;font-size:10px;opacity:.78;line-height:1.35}
        .driver-payments-title{margin:12px 2px 7px;font-size:10px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:#708078}
        .dfm-section.driver-payments-polish .dfm-method{position:relative;background:#fff!important;border:1px solid #e2e9e6!important;border-radius:16px!important;padding:13px!important;margin:9px 0!important;box-shadow:0 4px 14px rgba(16,32,51,.04)}
        .dfm-section.driver-payments-polish .dfm-method.active{border-color:#8bc8b7!important;background:#f2faf7!important;box-shadow:0 6px 18px rgba(15,112,90,.08)}
        .dfm-section.driver-payments-polish .dfm-method-head{min-height:34px;gap:8px;color:#102033}
        .dfm-section.driver-payments-polish .dfm-method-head::before{content:'💳';width:32px;height:32px;border-radius:11px;background:#f1f5f4;display:grid;place-items:center;font-size:14px;margin-right:2px}
        .dfm-section.driver-payments-polish .dfm-method.active .dfm-method-head::before{background:#dff1ea}
        .dfm-section.driver-payments-polish .dfm-method.active::after{content:'Prensipal';position:absolute;right:12px;top:52px;background:#e4f5ee;color:#0f705a;border-radius:999px;padding:4px 7px;font-size:8px;font-weight:900;letter-spacing:.02em}
        html[lang='fr'] .dfm-section.driver-payments-polish .dfm-method.active::after{content:'Principal'}
        .dfm-section.driver-payments-polish .dfm-field{background:#f7f9f8;border:1px solid #e7ecea;border-radius:11px;padding:8px 9px;margin:7px 0!important}
        .dfm-section.driver-payments-polish .dfm-field input{border:0!important;background:#fff!important}
        .dfm-section.driver-payments-polish .dfm-primary{border-radius:13px!important;padding:11px!important;box-shadow:0 6px 15px rgba(15,112,90,.12)}
        .dfm-section.driver-payments-polish button:not(.dfm-trigger):not(.dfm-switch){border-radius:11px}
        .dfm-section.driver-payments-polish .dfm-note{background:#eef6f3!important;border:1px solid #dceae5!important}
      `
      document.head.appendChild(style)
    }

    const apply=()=>{
      const sections=Array.from(document.querySelectorAll<HTMLElement>('.dfm-section'))
      const payments=sections.find(section=>{
        const trigger=section.querySelector<HTMLElement>('.dfm-trigger')
        const txt=(trigger?.textContent||'').toLowerCase()
        return txt.includes('peman')||txt.includes('paiement')
      })
      if(!payments) return
      payments.classList.add('driver-payments-polish')
      const body=payments.querySelector<HTMLElement>('.dfm-body')
      if(!body) return

      const ht=localStorage.getItem('taxi-language')==='ht'
      if(!body.querySelector('.driver-payments-summary')){
        const summary=document.createElement('div')
        summary.className='driver-payments-summary'
        summary.innerHTML=`<div class="dpy-icon">💳</div><div><strong>${ht?'Metòd peman':'Modes de paiement'}</strong><small>${ht?'Chwazi kote pou resevwa revni trajè ou':'Choisissez où recevoir vos revenus de trajets'}</small></div>`
        body.insertBefore(summary,body.firstChild)
      }

      const firstMethod=body.querySelector<HTMLElement>('.dfm-method')
      if(firstMethod&&!body.querySelector('.driver-payments-title')){
        const title=document.createElement('div')
        title.className='driver-payments-title'
        title.textContent=ht?'Kont pou resevwa peman':'Comptes de versement'
        firstMethod.insertAdjacentElement('beforebegin',title)
      }
    }

    apply()
    const observer=new MutationObserver(apply)
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])
  return null
}
