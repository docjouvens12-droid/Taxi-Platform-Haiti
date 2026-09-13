'use client'

import { useEffect } from 'react'

export default function DriverAccordionTapFix(){
  useEffect(()=>{
    if(window.location.pathname!=='/driver/dashboard') return

    const toggle=(event:Event)=>{
      const target=event.target as HTMLElement | null
      const summary=target?.closest?.('.dfm-trigger') as HTMLElement | null
      if(!summary) return
      const details=summary.closest('details.dfm-section') as HTMLDetailsElement | null
      if(!details) return
      event.preventDefault()
      event.stopPropagation()
      details.open=!details.open
    }

    document.addEventListener('click',toggle,true)
    return()=>document.removeEventListener('click',toggle,true)
  },[])

  return null
}
