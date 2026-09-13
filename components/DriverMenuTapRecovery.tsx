'use client'

import { useEffect } from 'react'

export default function DriverMenuTapRecovery(){
  useEffect(()=>{
    if(window.location.pathname!=='/driver/dashboard') return

    const apply=()=>{
      const button=document.querySelector<HTMLButtonElement>('button.menuButton')
      if(!button) return
      button.style.position='relative'
      button.style.zIndex='100'
      button.style.pointerEvents='auto'
      button.style.touchAction='manipulation'
      button.style.minWidth='44px'
      button.style.minHeight='44px'
    }

    apply()
    const observer=new MutationObserver(apply)
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])

  return null
}
