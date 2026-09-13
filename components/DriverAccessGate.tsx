'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function DriverAccessGate(){
  useEffect(()=>{
    let cancelled=false

    const removeStaleOpeningOverlay=()=>{
      if(window.location.pathname!=='/driver/dashboard') return
      const phrases=['ouverture de votre espace chauffeur','opening your driver space','ouvri espas chofè','n ap ouvri espas chofè']
      const nodes=Array.from(document.body.querySelectorAll<HTMLElement>('div,main,section,aside'))
      for(const node of nodes){
        const text=(node.textContent||'').trim().toLowerCase()
        if(!phrases.some(p=>text.includes(p))) continue

        let candidate:HTMLElement|null=node
        while(candidate && candidate!==document.body){
          const style=window.getComputedStyle(candidate)
          const rect=candidate.getBoundingClientRect()
          const looksFullscreen=(style.position==='fixed'||style.position==='absolute') && rect.width>=window.innerWidth*.9 && rect.height>=window.innerHeight*.75
          if(looksFullscreen){
            candidate.remove()
            break
          }
          candidate=candidate.parentElement
        }
      }
    }

    const enforce=async()=>{
      const path=window.location.pathname
      if(path!=='/driver' && path!=='/driver/dashboard') return

      removeStaleOpeningOverlay()
      const {data:auth}=await supabase.auth.getUser()
      if(cancelled) return

      if(!auth.user){
        if(path==='/driver/dashboard') window.location.replace('/driver/login?test=haiti')
        return
      }

      const {data:driver}=await supabase
        .from('driver_profiles')
        .select('status')
        .eq('user_id',auth.user.id)
        .maybeSingle()

      if(cancelled) return
      const approved=driver?.status==='approved'

      if(path==='/driver/dashboard' && !approved){
        window.location.replace('/driver')
        return
      }

      if(path==='/driver' && approved){
        window.location.replace('/driver/dashboard')
      }

      removeStaleOpeningOverlay()
    }

    void enforce()

    const observer=new MutationObserver(()=>removeStaleOpeningOverlay())
    observer.observe(document.body,{childList:true,subtree:true})
    const timer=window.setInterval(removeStaleOpeningOverlay,500)

    return()=>{
      cancelled=true
      observer.disconnect()
      window.clearInterval(timer)
    }
  },[])

  return null
}
