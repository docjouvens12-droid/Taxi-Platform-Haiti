'use client'

import { useEffect } from 'react'

export default function DriverCleanLanguagePolish(){
  useEffect(()=>{
    if(!window.location.pathname.startsWith('/driver/dashboard-v2')) return

    const styleId='driver-clean-language-polish-style'
    if(!document.getElementById(styleId)){
      const style=document.createElement('style')
      style.id=styleId
      style.textContent=`
        .driver-clean-language-polish{background:#f8faf9!important;border-radius:18px!important;padding:12px!important}
        .driver-clean-language-card{background:#fff;border:1px solid #e3ebe7;border-radius:18px;padding:12px;box-shadow:0 6px 16px rgba(16,32,51,.04)}
        .driver-clean-language-head{margin-bottom:12px}.driver-clean-language-head strong{display:block;color:#102033;font-size:14px}.driver-clean-language-head small{display:block;margin-top:3px;color:#75837d;font-size:10px}
        .driver-clean-language-polish .dcm-lang{width:100%!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}
        .driver-clean-language-polish .dcm-lang button{min-height:68px!important;border:1px solid #dfe8e4!important;border-radius:14px!important;background:#fff!important;color:#31433d!important;padding:10px 12px!important;text-align:left!important;position:relative!important;font-size:12px!important;box-shadow:0 4px 12px rgba(16,32,51,.04)!important}
        .driver-clean-language-polish .dcm-lang button:first-child::before{content:'🇫🇷';display:block;font-size:20px;margin-bottom:5px}
        .driver-clean-language-polish .dcm-lang button:last-child::before{content:'🇭🇹';display:block;font-size:20px;margin-bottom:5px}
        .driver-clean-language-polish .dcm-lang button.active{background:#eaf5f1!important;border-color:#8fc7b7!important;color:#0f705a!important;box-shadow:0 5px 14px rgba(15,112,90,.08)!important}
        .driver-clean-language-polish .dcm-lang button.active::after{content:'✓';position:absolute;right:10px;top:10px;width:19px;height:19px;border-radius:50%;background:#0f705a;color:#fff;display:grid;place-items:center;font-size:11px;font-weight:900}
      `
      document.head.appendChild(style)
    }

    const apply=()=>{
      const rows=Array.from(document.querySelectorAll<HTMLButtonElement>('.dcm-row'))
      const row=rows.find(el=>{
        const t=(el.textContent||'').toLowerCase()
        return t.includes('langue') || t.includes('lang')
      })
      const panel=row?.nextElementSibling as HTMLElement|null
      if(!panel?.classList.contains('dcm-panel')) return
      panel.classList.add('driver-clean-language-polish')
      const switcher=panel.querySelector<HTMLElement>('.dcm-lang')
      if(!switcher || panel.querySelector('.driver-clean-language-card')) return

      const ht=localStorage.getItem('taxi-language')==='ht'
      const card=document.createElement('div')
      card.className='driver-clean-language-card'
      const head=document.createElement('div')
      head.className='driver-clean-language-head'
      head.innerHTML=`<strong>${ht?'Lang aplikasyon an':'Langue de l’application'}</strong><small>${ht?'Chwazi lang ou prefere itilize':'Choisissez la langue que vous préférez'}</small>`
      card.appendChild(head)
      card.appendChild(switcher)
      panel.appendChild(card)
    }

    apply()
    const timer=window.setInterval(apply,250)
    return()=>window.clearInterval(timer)
  },[])

  return null
}
