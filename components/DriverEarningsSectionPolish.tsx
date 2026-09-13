'use client'

import { useEffect } from 'react'

export default function DriverEarningsSectionPolish(){
  useEffect(()=>{
    if(window.location.pathname!=='/driver/dashboard') return

    const styleId='driver-earnings-section-polish-style'
    if(!document.getElementById(styleId)){
      const style=document.createElement('style')
      style.id=styleId
      style.textContent=`
        .dfm-section.driver-earnings-polish .dfm-body{background:#f8faf9;border-radius:18px;padding:12px!important}
        .driver-earnings-summary{background:linear-gradient(145deg,#102033,#173246);color:#fff;border-radius:18px;padding:14px;margin-bottom:12px;box-shadow:0 8px 20px rgba(16,32,51,.16)}
        .driver-earnings-summary-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
        .driver-earnings-summary-top>div:first-child{display:flex;align-items:center;gap:10px}.driver-earnings-icon{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:rgba(255,255,255,.12);font-size:20px}
        .driver-earnings-summary strong{display:block;font-size:14px}.driver-earnings-summary small{display:block;margin-top:3px;font-size:10px;opacity:.78}
        .driver-earnings-net{font-size:19px!important;font-weight:950!important;color:#fff!important;text-align:right!important}
        .driver-earnings-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.driver-earnings-card{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:9px 7px;text-align:center}.driver-earnings-card span{display:block;font-size:8px;opacity:.76;text-transform:uppercase;font-weight:850;letter-spacing:.03em}.driver-earnings-card b{display:block;font-size:11px;margin-top:4px;color:#fff}
        .driver-earnings-label{margin:12px 2px 7px;font-size:10px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:#708078}
        .dfm-section.driver-earnings-polish .dfm-row{background:#fff;border:1px solid #e5ebe8;border-radius:12px;padding:10px 11px;margin:7px 0!important;align-items:center}.dfm-section.driver-earnings-polish .dfm-row span{font-size:10px}.dfm-section.driver-earnings-polish .dfm-row b{font-size:11px}
        .dfm-section.driver-earnings-polish .driver-earnings-fee{border-color:#f3dfad;background:#fffbef}.dfm-section.driver-earnings-polish .driver-earnings-fee b{color:#9a6a00}.dfm-section.driver-earnings-polish .driver-earnings-driver{border-color:#cfe8df;background:#eef8f4}.dfm-section.driver-earnings-polish .driver-earnings-driver b{color:#0f705a;font-size:13px}
      `
      document.head.appendChild(style)
    }

    const parseAmount=(text:string)=>{
      const cleaned=text.replace(/[^0-9.,-]/g,'').replace(/,/g,'')
      const n=Number(cleaned)
      return Number.isFinite(n)?n:0
    }
    const fmt=(n:number)=>`${Math.round(n).toLocaleString('fr-HT')} HTG`

    const apply=()=>{
      const sections=Array.from(document.querySelectorAll<HTMLElement>('.dfm-section'))
      const section=sections.find(s=>{
        const text=(s.querySelector('.dfm-trigger')?.textContent||'').toLowerCase()
        return text.includes('revni')||text.includes('revenus')
      })
      if(!section)return
      section.classList.add('driver-earnings-polish')
      const body=section.querySelector<HTMLElement>('.dfm-body')
      if(!body)return

      const rows=Array.from(body.querySelectorAll<HTMLElement>(':scope > .dfm-row'))
      if(rows.length<3)return
      const gross=parseAmount(rows[0].textContent||'')
      const fee=parseAmount(rows[1].textContent||'')
      const net=parseAmount(rows[2].textContent||'')
      const trips=parseAmount(rows[3]?.textContent||'')
      rows[1]?.classList.add('driver-earnings-fee')
      rows[2]?.classList.add('driver-earnings-driver')

      if(!body.querySelector('.driver-earnings-summary')){
        const ht=localStorage.getItem('taxi-language')==='ht'
        const summary=document.createElement('div')
        summary.className='driver-earnings-summary'
        summary.innerHTML=`
          <div class="driver-earnings-summary-top">
            <div><div class="driver-earnings-icon">💰</div><div><strong>${ht?'Revni chofè':'Revenus chauffeur'}</strong><small>${ht?'Rezime aktivite ou':'Résumé de votre activité'}</small></div></div>
            <b class="driver-earnings-net">${fmt(net)}</b>
          </div>
          <div class="driver-earnings-cards">
            <div class="driver-earnings-card"><span>${ht?'Brut':'Brut'}</span><b>${fmt(gross)}</b></div>
            <div class="driver-earnings-card"><span>${ht?'Platfòm 15%':'Plateforme 15%'}</span><b>${fmt(fee)}</b></div>
            <div class="driver-earnings-card"><span>${ht?'Trajè':'Trajets'}</span><b>${Math.round(trips)}</b></div>
          </div>`
        body.insertBefore(summary,body.firstChild)
        const label=document.createElement('div')
        label.className='driver-earnings-label'
        label.textContent=ht?'Detay revni':'Détail des revenus'
        summary.insertAdjacentElement('afterend',label)
      }
    }

    apply()
    const observer=new MutationObserver(apply)
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])
  return null
}
