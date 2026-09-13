'use client'

import { useEffect } from 'react'

export default function DriverLanguageSectionPolish(){
  useEffect(()=>{
    if(window.location.pathname!=='/driver/dashboard') return

    const styleId='driver-language-section-polish-style'
    if(!document.getElementById(styleId)){
      const style=document.createElement('style')
      style.id=styleId
      style.textContent=`
        .dfm-lang.driver-language-polish{padding:14px 0 16px!important}
        .driver-language-card{background:#f8faf9;border:1px solid #e3ebe7;border-radius:18px;padding:12px}
        .driver-language-head{display:flex;align-items:center;margin-bottom:12px}
        .driver-language-head strong{display:block;color:#102033!important;font-size:14px!important;margin:0!important}
        .driver-language-head small{display:block;margin-top:3px;color:#75837d;font-size:10px}
        .dfm-lang.driver-language-polish .dfm-lang-switch{width:100%!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;padding:0!important;border:0!important;background:transparent!important}
        .dfm-lang.driver-language-polish .dfm-lang-switch button{min-height:64px!important;border:1px solid #dfe8e4!important;border-radius:14px!important;background:#fff!important;color:#31433d!important;padding:10px 12px!important;text-align:left!important;position:relative!important;font-size:12px!important;box-shadow:0 4px 12px rgba(16,32,51,.04)!important}
        .dfm-lang.driver-language-polish .dfm-lang-switch button::before{display:block;font-size:18px;margin-bottom:5px}
        .dfm-lang.driver-language-polish .dfm-lang-switch button:first-child::before{content:'🇫🇷'}
        .dfm-lang.driver-language-polish .dfm-lang-switch button:last-child::before{content:'🇭🇹'}
        .dfm-lang.driver-language-polish .dfm-lang-switch button.active{background:#eaf5f1!important;border-color:#8fc7b7!important;color:#0f705a!important;box-shadow:0 5px 14px rgba(15,112,90,.08)!important}
        .dfm-lang.driver-language-polish .dfm-lang-switch button.active::after{content:'✓';position:absolute;right:10px;top:10px;width:19px;height:19px;border-radius:50%;background:#0f705a;color:#fff;display:grid;place-items:center;font-size:11px;font-weight:900}
      `
      document.head.appendChild(style)
    }

    const apply=()=>{
      const lang=document.querySelector<HTMLElement>('.dfm-lang')
      if(!lang) return
      lang.classList.add('driver-language-polish')
      if(lang.querySelector('.driver-language-card')) return

      const currentTitle=lang.querySelector(':scope > strong')
      const switcher=lang.querySelector<HTMLElement>('.dfm-lang-switch')
      if(!switcher) return

      const ht=localStorage.getItem('taxi-language')==='ht'
      const card=document.createElement('div')
      card.className='driver-language-card'
      const head=document.createElement('div')
      head.className='driver-language-head'
      head.innerHTML=`<div><strong>${ht?'Lang aplikasyon an':'Langue de l’application'}</strong><small>${ht?'Chwazi lang ou prefere itilize':'Choisissez la langue que vous préférez'}</small></div>`
      card.appendChild(head)
      card.appendChild(switcher)
      if(currentTitle) currentTitle.remove()
      lang.appendChild(card)
    }

    apply()
    const observer=new MutationObserver(apply)
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])

  return null
}
