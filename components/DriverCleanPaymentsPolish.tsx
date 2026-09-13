'use client'

import { useEffect } from 'react'

export default function DriverCleanPaymentsPolish(){
  useEffect(()=>{
    if(!window.location.pathname.startsWith('/driver/dashboard-v2')) return

    const styleId='driver-clean-payments-polish-style'
    if(!document.getElementById(styleId)){
      const style=document.createElement('style')
      style.id=styleId
      style.textContent=`
        .dcm-payments-polish{background:#f8faf9!important;border-radius:18px!important;padding:12px!important}
        .dcm-payments-summary{background:linear-gradient(145deg,#102033,#173246);color:#fff;border-radius:18px;padding:14px;margin-bottom:12px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 20px rgba(16,32,51,.15)}
        .dcm-payments-summary .dpy-icon{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:rgba(255,255,255,.12);font-size:21px;border:1px solid rgba(255,255,255,.18)}
        .dcm-payments-summary strong{display:block;font-size:14px}.dcm-payments-summary small{display:block;margin-top:3px;font-size:10px;opacity:.8;line-height:1.35}
        .dcm-payments-title{margin:12px 2px 7px;font-size:10px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:#708078}
        .dcm-payments-polish .dcm-method{position:relative;background:#fff!important;border:1px solid #e2e9e6!important;border-radius:16px!important;padding:13px!important;margin:9px 0!important;box-shadow:0 4px 14px rgba(16,32,51,.04)}
        .dcm-payments-polish .dcm-method.active{border-color:#8bc8b7!important;background:#f2faf7!important;box-shadow:0 6px 18px rgba(15,112,90,.08)}
        .dcm-payments-polish .dcm-method-head{min-height:34px;gap:8px;color:#102033}
        .dcm-payments-polish .dcm-method-head::before{content:'💳';width:32px;height:32px;border-radius:11px;background:#f1f5f4;display:grid;place-items:center;font-size:14px;margin-right:2px}
        .dcm-payments-polish .dcm-method.active .dcm-method-head::before{background:#dff1ea}
        .dcm-payments-polish .dcm-method.active::after{content:'Principal';position:absolute;right:12px;top:52px;background:#e4f5ee;color:#0f705a;border-radius:999px;padding:4px 7px;font-size:8px;font-weight:900;letter-spacing:.02em}
        html[lang='ht'] .dcm-payments-polish .dcm-method.active::after{content:'Prensipal'}
        .dcm-payments-polish .dcm-field{background:#f7f9f8;border:1px solid #e7ecea;border-radius:11px;padding:8px 9px;margin:7px 0!important}
        .dcm-payments-polish .dcm-field input{border:0!important;background:#fff!important}
        .dcm-payments-polish .dcm-primary{border-radius:13px!important;padding:11px!important;box-shadow:0 6px 15px rgba(15,112,90,.12)}
      `
      document.head.appendChild(style)
    }

    const apply=()=>{
      const rows=Array.from(document.querySelectorAll<HTMLButtonElement>('.dcm-row'))
      const row=rows.find(el=>{
        const t=(el.textContent||'').toLowerCase()
        return t.includes('paiements')||t.includes('peman')
      })
      const panel=row?.nextElementSibling as HTMLElement|null
      if(!panel?.classList.contains('dcm-panel')) return
      panel.classList.add('dcm-payments-polish')

      const ht=localStorage.getItem('taxi-language')==='ht'
      if(!panel.querySelector('.dcm-payments-summary')){
        const summary=document.createElement('div')
        summary.className='dcm-payments-summary'
        summary.innerHTML=`<div class="dpy-icon">💳</div><div><strong>${ht?'Metòd peman':'Modes de paiement'}</strong><small>${ht?'Chwazi kote pou resevwa revni trajè ou':'Choisissez où recevoir vos revenus de trajets'}</small></div>`
        panel.insertBefore(summary,panel.firstChild)
      }
      const firstMethod=panel.querySelector<HTMLElement>('.dcm-method')
      if(firstMethod&&!panel.querySelector('.dcm-payments-title')){
        const title=document.createElement('div')
        title.className='dcm-payments-title'
        title.textContent=ht?'Kont pou resevwa peman':'Comptes de versement'
        firstMethod.insertAdjacentElement('beforebegin',title)
      }
    }

    const onClick=(event:MouseEvent)=>{
      const el=event.target as Element|null
      if(!el?.closest('.dcm-row')) return
      window.setTimeout(apply,30)
    }
    document.addEventListener('click',onClick,true)
    return()=>document.removeEventListener('click',onClick,true)
  },[])

  return null
}
