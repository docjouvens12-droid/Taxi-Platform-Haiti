'use client'

import { useEffect } from 'react'

export default function PassengerDriverApplicationMenuItem(){
  useEffect(()=>{
    if(window.location.pathname!=='/passenger/dashboard') return

    const removeDriverItem=()=>{
      const nav=document.querySelector<HTMLElement>('.nav-drawer .drawer-nav')
      if(!nav) return

      Array.from(nav.querySelectorAll<HTMLButtonElement>(':scope > button')).forEach(button=>{
        const text=(button.textContent||'').toLowerCase()
        if(
          text.includes('devenir chauffeur') ||
          text.includes('vin chofè') ||
          text.includes('demand devni chofè') ||
          text.includes('demande devenir chauffeur')
        ){
          button.remove()
        }
      })

      nav.querySelectorAll('.passenger-driver-application-target').forEach(el=>el.remove())
    }

    removeDriverItem()
    const observer=new MutationObserver(removeDriverItem)
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])

  return null
}
