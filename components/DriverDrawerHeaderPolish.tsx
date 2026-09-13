'use client'

import { useEffect } from 'react'

const iconFor=(text:string)=>{
  const s=text.toLowerCase()
  if(s.includes('pwofil')||s.includes('profil')) return '👤'
  if(s.includes('veyikil')||s.includes('véhicule')) return '🚗'
  if(s.includes('peman')||s.includes('paiement')) return '💳'
  if(s.includes('istorik')||s.includes('historique')) return '🕘'
  if(s.includes('revni')||s.includes('revenus')) return '💰'
  if(s.includes('èd')||s.includes('aide')) return '❓'
  return '•'
}

export default function DriverDrawerHeaderPolish(){
  useEffect(()=>{
    if(window.location.pathname!=='/driver/dashboard') return

    const styleId='driver-drawer-header-polish'
    if(!document.getElementById(styleId)){
      const style=document.createElement('style')
      style.id=styleId
      style.textContent=`
        .drawer .drawerTitle,.drawer .drawer-title,.drawer .drawerHeaderTitle,.drawer .drawer-header-title,.drawer .drawerHeadTitle,.drawer .drawer-head-title,.drawer .drawerBrand,.drawer .drawer-brand,.drawer .driverMenuTitle,.drawer .driver-menu-title{display:none!important}
        .drawer .drawerUser strong,.drawer .drawerUser small,.drawer .drawer-user strong,.drawer .drawer-user small,.drawer .driverIdentity strong,.drawer .driverIdentity small,.drawer .driver-identity strong,.drawer .driver-identity small,.drawer .drawerProfile strong,.drawer .drawerProfile small,.drawer .drawer-profile strong,.drawer .drawer-profile small{display:none!important}
        .drawer.driver-premium-drawer{background:#f6f8fa!important;padding:16px!important}
        .drawer.driver-premium-drawer .drawerTop{background:#fff;border-radius:18px;padding:8px 10px;margin-bottom:12px;box-shadow:0 6px 20px rgba(16,32,51,.06)}
        .drawer.driver-premium-drawer .profile{background:#fff!important;border:0!important;border-radius:22px!important;padding:18px 14px!important;margin:0 0 14px!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:9px!important;box-shadow:0 8px 24px rgba(16,32,51,.07)}
        .drawer.driver-premium-drawer .profile>div:not(.avatar):not(.premium-driver-status){display:none!important}
        .drawer.driver-premium-drawer .profile .avatar{width:68px!important;height:68px!important;border:3px solid #dcefe8!important;box-shadow:0 5px 15px rgba(15,112,90,.16)!important}
        .premium-driver-status{display:flex;align-items:center;gap:7px;background:#eef2f4;color:#657483;border-radius:999px;padding:7px 11px;font-size:11px;font-weight:900}
        .premium-driver-status span{width:8px;height:8px;border-radius:50%;background:#9aa6b2}
        .premium-driver-status.on{background:#e8f6f1;color:#0f705a}
        .premium-driver-status.on span{background:#58ad98;box-shadow:0 0 0 4px rgba(88,173,152,.15)}
        .drawer.driver-premium-drawer .dfm-wrap{display:grid!important;gap:8px!important}
        .drawer.driver-premium-drawer .dfm-section{border:0!important;background:#fff!important;border-radius:16px!important;overflow:hidden!important;box-shadow:0 4px 16px rgba(16,32,51,.045)!important}
        .drawer.driver-premium-drawer .dfm-trigger{display:grid!important;grid-template-columns:34px 1fr 24px!important;align-items:center!important;gap:10px!important;padding:13px 14px!important;color:#102033!important;background:#fff!important;border:1px solid transparent!important;border-radius:16px!important}
        .drawer.driver-premium-drawer .dfm-trigger[aria-expanded="true"]{background:#eaf7f2!important;color:#0f705a!important;border-color:#cde9df!important}
        .drawer.driver-premium-drawer .dfm-trigger>span{font-size:14px!important;font-weight:850!important}
        .drawer.driver-premium-drawer .dfm-trigger>b{font-size:20px!important;color:#7b8995!important;text-align:right!important}
        .drawer.driver-premium-drawer .dfm-trigger[aria-expanded="true"]>b{color:#0f705a!important}
        .drawer.driver-premium-drawer .dfm-menu-icon{width:32px;height:32px;border-radius:11px;background:#f1f5f6;display:grid;place-items:center;font-style:normal;font-size:15px}
        .drawer.driver-premium-drawer .dfm-trigger[aria-expanded="true"] .dfm-menu-icon{background:#d8f0e7}
        .drawer.driver-premium-drawer .dfm-body{padding:2px 14px 14px!important}
        .drawer.driver-premium-drawer .dfm-lang{position:relative;border:0!important;background:#fff!important;border-radius:16px!important;padding:13px 14px 13px 58px!important;box-shadow:0 4px 16px rgba(16,32,51,.045)!important;min-height:58px;box-sizing:border-box}
        .drawer.driver-premium-drawer .dfm-lang>.dfm-menu-icon{position:absolute;left:14px;top:13px}
        .drawer.driver-premium-drawer .dfm-lang>strong{color:#102033!important;font-size:14px!important;margin:0 0 8px!important}
        .drawer.driver-premium-drawer .logout,.drawer.driver-premium-drawer .drawerLogout{background:#fff0f0!important;color:#b83d3d!important;border:1px solid #f1cccc!important;border-radius:16px!important;box-shadow:none!important;margin-top:14px!important}
      `
      document.head.appendChild(style)
    }

    const hideIdentityText=(drawer:HTMLElement)=>{
      const candidates=Array.from(drawer.querySelectorAll<HTMLElement>('strong,small,p,span,div'))
      candidates.forEach(el=>{
        if(el.closest('.driver-final-menu-root')) return
        const text=(el.textContent||'').trim()
        const lower=text.toLowerCase()
        const looksLikeEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
        const isDriverTitle=lower==='espace chauffeur'||lower==='espas chofè'
        if(isDriverTitle||looksLikeEmail||lower==='jouvens'){
          if(el.style.display!=='none') el.style.display='none'
        }
      })
    }

    const apply=()=>{
      const drawer=document.querySelector<HTMLElement>('.drawer')
      if(!drawer)return
      if(!drawer.classList.contains('driver-premium-drawer')) drawer.classList.add('driver-premium-drawer')
      hideIdentityText(drawer)

      drawer.querySelectorAll<HTMLButtonElement>('.dfm-trigger').forEach(btn=>{
        const label=btn.querySelector('span')
        if(!label)return
        const text=(label.textContent||'').toLowerCase()
        if(text.includes('demand devni chofè')||text.includes('demande devenir chauffeur')){
          const section=btn.closest<HTMLElement>('.dfm-section')
          if(section) section.style.display='none'
          return
        }
        let icon=btn.querySelector<HTMLElement>('.dfm-menu-icon')
        if(!icon){
          icon=document.createElement('i')
          icon.className='dfm-menu-icon'
          label.insertAdjacentElement('beforebegin',icon)
        }
        const nextIcon=iconFor(label.textContent||'')
        if(icon.textContent!==nextIcon) icon.textContent=nextIcon
      })

      const langBox=drawer.querySelector<HTMLElement>('.dfm-lang')
      if(langBox&&!langBox.querySelector('.dfm-menu-icon')){
        const icon=document.createElement('i')
        icon.className='dfm-menu-icon'
        icon.textContent='🌐'
        langBox.insertBefore(icon,langBox.firstChild)
      }

      const profile=drawer.querySelector<HTMLElement>('.profile')
      if(profile){
        let badge=profile.querySelector<HTMLElement>('.premium-driver-status')
        if(!badge){
          badge=document.createElement('div')
          badge.className='premium-driver-status'
          profile.appendChild(badge)
        }
        const online=Boolean(document.querySelector('.online-card .dot.on'))
        const ht=localStorage.getItem('taxi-language')==='ht'
        const label=online?(ht?'Sou liy':'En ligne'):(ht?'Pa sou liy':'Hors ligne')
        const wanted=`<span></span>${label}`
        if(badge.innerHTML!==wanted) badge.innerHTML=wanted
        if(badge.classList.contains('on')!==online) badge.classList.toggle('on',online)
      }
    }

    apply()
    const observer=new MutationObserver(()=>apply())
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])

  return null
}
