'use client'

import { useEffect } from 'react'

export default function DriverRefreshSearchPolish(){
  useEffect(()=>{
    if(location.pathname!=='/driver/dashboard') return

    const apply=()=>{
      const section=document.querySelector<HTMLElement>('.section-title')
      const button=section?.querySelector<HTMLButtonElement>('button')
      if(!button) return

      button.classList.add('driver-map-search-refresh')
      button.textContent='🔍'
      button.setAttribute('aria-label','Rafrechi demann trajè')
      button.setAttribute('title','Rafrechi demann trajè')
    }

    apply()
    const observer=new MutationObserver(apply)
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])

  return <style>{`
    .section-title .driver-map-search-refresh{
      width:46px!important;
      height:46px!important;
      min-width:46px!important;
      padding:0!important;
      display:grid!important;
      place-items:center!important;
      border:1px solid #d9e1e7!important;
      border-radius:14px!important;
      background:#fff!important;
      color:#102033!important;
      font-size:20px!important;
      box-shadow:0 8px 22px rgba(16,32,51,.10)!important;
      cursor:pointer!important;
    }
    .section-title .driver-map-search-refresh:active{
      transform:scale(.96);
    }
    .section-title .driver-map-search-refresh:disabled{
      opacity:.55!important;
      cursor:default!important;
    }
  `}</style>
}
