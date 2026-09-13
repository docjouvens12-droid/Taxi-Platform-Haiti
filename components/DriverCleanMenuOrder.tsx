'use client'

import { useEffect } from 'react'

export default function DriverCleanMenuOrder(){
  useEffect(()=>{
    if(!window.location.pathname.startsWith('/driver/dashboard-v2')) return

    const getRank=(text:string)=>{
      const t=text.toLowerCase()
      if(t.includes('profil')||t.includes('pwofil')) return 0
      if(t.includes('véhicule')||t.includes('vehicule')||t.includes('veyikil')) return 1
      if(t.includes('demande devenir chauffeur')||t.includes('demand devni chofè')||t.includes('demand devni chofe')) return 2
      if(t.includes('paiements')||t.includes('peman')) return 3
      if(t.includes('historique')||t.includes('istwa trajè')) return 4
      if(t.includes('revenus')||t.includes('revni')) return 5
      if(t.includes('langue')||t.includes('lang')) return 6
      if(t.includes('aide')||t.includes('èd')) return 7
      return 20
    }

    const apply=()=>{
      const list=document.querySelector<HTMLElement>('.dcm-list')
      if(!list) return
      list.style.display='flex'
      list.style.flexDirection='column'

      const rows=Array.from(list.children).filter((el):el is HTMLButtonElement=>el instanceof HTMLButtonElement && el.classList.contains('dcm-row'))
      for(const row of rows){
        const rank=getRank(row.textContent||'')
        row.style.order=String(rank*2)
        const panel=row.nextElementSibling
        if(panel instanceof HTMLElement && panel.classList.contains('dcm-panel')){
          panel.style.order=String(rank*2+1)
        }
      }
    }

    let raf=0
    const schedule=()=>{
      cancelAnimationFrame(raf)
      raf=requestAnimationFrame(()=>apply())
    }

    schedule()
    const observer=new MutationObserver(schedule)
    observer.observe(document.body,{childList:true,subtree:true})
    document.addEventListener('click',schedule,false)

    return()=>{
      cancelAnimationFrame(raf)
      observer.disconnect()
      document.removeEventListener('click',schedule,false)
    }
  },[])

  return null
}
