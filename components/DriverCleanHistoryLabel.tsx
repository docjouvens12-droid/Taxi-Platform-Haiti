'use client'

import { useEffect } from 'react'

export default function DriverCleanHistoryLabel(){
  useEffect(()=>{
    if(!window.location.pathname.startsWith('/driver/dashboard-v2')) return

    const styleId='driver-refresh-spin-style'
    if(!document.getElementById(styleId)){
      const style=document.createElement('style')
      style.id=styleId
      style.textContent=`
        @keyframes drv2RefreshSpin{to{transform:rotate(360deg)}}
        .drv2-refresh.drv2-refresh-spin{
          width:42px!important;height:42px!important;min-width:42px!important;padding:0!important;
          border-radius:50%!important;display:grid!important;place-items:center!important;
          font-size:22px!important;font-weight:900!important;line-height:1!important;
          background:#eef7f3!important;color:#0f8065!important;border:1px solid #cfe4dc!important;
          box-shadow:0 5px 14px rgba(15,128,101,.10)!important;
        }
        .drv2-refresh.drv2-refresh-spin:active{transform:rotate(35deg) scale(.95)}
        .drv2-refresh.drv2-refresh-spin:disabled{opacity:.8!important}
        .drv2-refresh.drv2-refresh-spin.drv2-refresh-busy{animation:drv2RefreshSpin .75s linear infinite}
      `
      document.head.appendChild(style)
    }

    const apply=()=>{
      const ht=localStorage.getItem('taxi-language')==='ht'
      const rows=Array.from(document.querySelectorAll<HTMLButtonElement>('.dcm-row'))
      const row=rows.find(el=>{
        const t=(el.textContent||'').toLowerCase()
        return t.includes('historique')||t.includes('istwa trajè')
      })
      const label=row?.querySelector<HTMLElement>('b')
      if(label) label.textContent=ht?'Istwa trajè yo':'Historique des trajets'

      const refresh=document.querySelector<HTMLButtonElement>('.drv2-refresh')
      if(refresh){
        refresh.classList.add('drv2-refresh-spin')
        refresh.classList.toggle('drv2-refresh-busy',refresh.disabled)
        refresh.textContent='↻'
        refresh.setAttribute('aria-label',ht?'Aktyalize':'Actualiser')
        refresh.title=ht?'Aktyalize':'Actualiser'
      }
    }

    apply()
    const timer=window.setInterval(apply,150)
    return()=>window.clearInterval(timer)
  },[])

  return null
}
