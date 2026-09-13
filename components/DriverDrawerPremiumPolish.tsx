'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const iconFor = (text:string) => {
  const s=text.toLowerCase()
  if(s.includes('pwofil')||s.includes('profil')) return '👤'
  if(s.includes('veyikil')||s.includes('véhicule')) return '🚗'
  if(s.includes('demand')||s.includes('demande')) return '📝'
  if(s.includes('peman')||s.includes('paiement')) return '💳'
  if(s.includes('istorik')||s.includes('historique')) return '🕘'
  if(s.includes('revni')||s.includes('revenus')) return '💰'
  if(s.includes('èd')||s.includes('aide')) return '❓'
  return '•'
}

export default function DriverDrawerPremiumPolish(){
  const [online,setOnline]=useState(false)
  const [lang,setLang]=useState<'fr'|'ht'>('fr')

  useEffect(()=>{
    if(location.pathname!=='/driver/dashboard') return
    setLang(localStorage.getItem('taxi-language')==='ht'?'ht':'fr')
    void (async()=>{
      const {data:auth}=await supabase.auth.getUser()
      if(!auth.user)return
      const {data}=await supabase.from('driver_profiles').select('is_online').eq('user_id',auth.user.id).maybeSingle()
      setOnline(Boolean(data?.is_online))
    })()

    const apply=()=>{
      const drawer=document.querySelector<HTMLElement>('.drawer')
      if(!drawer)return
      drawer.classList.add('driver-premium-drawer')

      drawer.querySelectorAll<HTMLButtonElement>('.dfm-trigger').forEach(btn=>{
        const label=btn.querySelector('span')
        if(!label)return
        let icon=btn.querySelector<HTMLElement>('.dfm-menu-icon')
        if(!icon){
          icon=document.createElement('i')
          icon.className='dfm-menu-icon'
          label.insertAdjacentElement('beforebegin',icon)
        }
        icon.textContent=iconFor(label.textContent||'')
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
        profile.classList.add('premium-driver-profile')
        let badge=profile.querySelector<HTMLElement>('.premium-driver-status')
        if(!badge){
          badge=document.createElement('div')
          badge.className='premium-driver-status'
          profile.appendChild(badge)
        }
        badge.innerHTML=`<span></span>${online?(lang==='ht'?'Sou liy':'En ligne'):(lang==='ht'?'Pa sou liy':'Hors ligne')}`
        badge.classList.toggle('on',online)
      }
    }

    apply()
    const observer=new MutationObserver(apply)
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[online,lang])

  if(typeof window==='undefined'||window.location.pathname!=='/driver/dashboard')return null

  return <style>{`
    .driver-premium-drawer{background:#f6f8fa!important;padding:16px!important}
    .driver-premium-drawer .drawerTop{background:#fff;border-radius:18px;padding:8px 10px;margin-bottom:12px;box-shadow:0 6px 20px rgba(16,32,51,.06)}
    .driver-premium-drawer .premium-driver-profile{background:#fff!important;border:0!important;border-radius:22px!important;padding:18px 14px!important;margin:0 0 14px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:center!important;gap:9px!important;box-shadow:0 8px 24px rgba(16,32,51,.07)}
    .driver-premium-drawer .premium-driver-profile>div:not(.avatar):not(.premium-driver-status){display:none!important}
    .driver-premium-drawer .premium-driver-profile .avatar{width:68px!important;height:68px!important;border:3px solid #dcefe8!important;box-shadow:0 5px 15px rgba(15,112,90,.16)!important}
    .premium-driver-status{display:flex;align-items:center;gap:7px;background:#eef2f4;color:#657483;border-radius:999px;padding:7px 11px;font-size:11px;font-weight:900}
    .premium-driver-status span{width:8px;height:8px;border-radius:50%;background:#9aa6b2}
    .premium-driver-status.on{background:#e8f6f1;color:#0f705a}
    .premium-driver-status.on span{background:#58ad98;box-shadow:0 0 0 4px rgba(88,173,152,.15)}
    .driver-premium-drawer .driver-final-menu-stable-root{margin-top:0!important}
    .driver-premium-drawer .dfm-wrap{display:grid!important;gap:8px!important}
    .driver-premium-drawer .dfm-section{border:0!important;background:#fff!important;border-radius:16px!important;overflow:hidden!important;box-shadow:0 4px 16px rgba(16,32,51,.045)!important}
    .driver-premium-drawer .dfm-trigger{display:grid!important;grid-template-columns:34px 1fr 24px!important;align-items:center!important;gap:10px!important;padding:13px 14px!important;color:#102033!important;background:#fff!important;border:1px solid transparent!important;border-radius:16px!important}
    .driver-premium-drawer .dfm-trigger[aria-expanded="true"]{background:#eaf7f2!important;color:#0f705a!important;border-color:#cde9df!important}
    .driver-premium-drawer .dfm-trigger>span{font-size:14px!important;font-weight:850!important}
    .driver-premium-drawer .dfm-trigger>b{font-size:20px!important;color:#7b8995!important;text-align:right!important}
    .driver-premium-drawer .dfm-trigger[aria-expanded="true"]>b{color:#0f705a!important}
    .driver-premium-drawer .dfm-menu-icon{width:32px;height:32px;border-radius:11px;background:#f1f5f6;display:grid;place-items:center;font-style:normal;font-size:15px;flex:0 0 auto}
    .driver-premium-drawer .dfm-trigger[aria-expanded="true"] .dfm-menu-icon{background:#d8f0e7}
    .driver-premium-drawer .dfm-body{padding:2px 14px 14px!important}
    .driver-premium-drawer .dfm-lang{position:relative;border:0!important;background:#fff!important;border-radius:16px!important;padding:13px 14px 13px 58px!important;box-shadow:0 4px 16px rgba(16,32,51,.045)!important;min-height:58px;box-sizing:border-box}
    .driver-premium-drawer .dfm-lang>.dfm-menu-icon{position:absolute;left:14px;top:13px}
    .driver-premium-drawer .dfm-lang>strong{color:#102033!important;font-size:14px!important;margin:0 0 8px!important}
    .driver-premium-drawer .logout,.driver-premium-drawer .drawerLogout{background:#fff0f0!important;color:#b83d3d!important;border:1px solid #f1cccc!important;border-radius:16px!important;box-shadow:none!important;margin-top:14px!important}
  `}</style>
}
