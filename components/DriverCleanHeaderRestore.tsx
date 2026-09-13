'use client'

import { useEffect } from 'react'

export default function DriverCleanHeaderRestore(){
  useEffect(()=>{
    if(!window.location.pathname.startsWith('/driver/dashboard-v2')) return

    const styleId='driver-clean-header-restore-style'
    if(!document.getElementById(styleId)){
      const style=document.createElement('style')
      style.id=styleId
      style.textContent=`
        .dcm-head{
          margin:72px 0 16px!important;
          padding:18px 14px!important;
          border:0!important;
          border-radius:22px!important;
          background:#fff!important;
          display:flex!important;
          flex-direction:column!important;
          align-items:center!important;
          justify-content:center!important;
          gap:9px!important;
          box-shadow:0 8px 24px rgba(16,32,51,.07)!important;
        }
        .dcm-head>div:not(.dcm-avatar):not(.dcm-driver-status){display:none!important}
        .dcm-avatar{
          width:68px!important;
          height:68px!important;
          border-radius:50%!important;
          border:3px solid #dcefe8!important;
          background:#0f8065!important;
          color:#fff!important;
          display:grid!important;
          place-items:center!important;
          font-size:28px!important;
          font-weight:900!important;
          box-shadow:0 5px 15px rgba(15,112,90,.16)!important;
        }
        .dcm-driver-status{
          display:flex!important;
          align-items:center!important;
          gap:7px!important;
          background:#eef2f4!important;
          color:#657483!important;
          border-radius:999px!important;
          padding:7px 11px!important;
          font-size:11px!important;
          font-weight:900!important;
        }
        .dcm-driver-status span{width:8px;height:8px;border-radius:50%;background:#9aa6b2}
        .dcm-driver-status.on{background:#e8f6f1!important;color:#0f705a!important}
        .dcm-driver-status.on span{background:#58ad98;box-shadow:0 0 0 4px rgba(88,173,152,.15)}
      `
      document.head.appendChild(style)
    }

    const apply=()=>{
      const head=document.querySelector<HTMLElement>('.dcm-head')
      if(!head) return
      let badge=head.querySelector<HTMLElement>('.dcm-driver-status')
      if(!badge){
        badge=document.createElement('div')
        badge.className='dcm-driver-status'
        head.appendChild(badge)
      }
      const online=Boolean(document.querySelector('.online-card .dot.on, .onlineCard .dot.on, .status-dot.on, .drv2-pill.online'))
      const ht=localStorage.getItem('taxi-language')==='ht'
      const label=online?(ht?'Sou liy':'En ligne'):(ht?'Pa sou liy':'Hors ligne')
      const wanted=`<span></span>${label}`
      if(badge.innerHTML!==wanted) badge.innerHTML=wanted
      if(badge.classList.contains('on')!==online) badge.classList.toggle('on',online)
    }

    apply()
    const observer=new MutationObserver(()=>apply())
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})
    return()=>observer.disconnect()
  },[])

  return null
}
