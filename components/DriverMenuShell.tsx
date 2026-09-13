'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function DriverMenuShell(){
  const [open,setOpen]=useState(false)

  useEffect(()=>{
    if(window.location.pathname!=='/driver/dashboard') return

    const openFromEvent=(event:Event)=>{
      const target=event.target as HTMLElement | null
      const button=target?.closest?.('button.menuButton') as HTMLButtonElement | null
      if(!button) return
      event.preventDefault()
      event.stopPropagation()
      setOpen(true)
    }

    document.addEventListener('pointerup',openFromEvent,true)
    document.addEventListener('touchend',openFromEvent,true)
    document.addEventListener('click',openFromEvent,true)

    const hideNativeDrawer=()=>{
      const overlays=Array.from(document.querySelectorAll<HTMLElement>('.overlay'))
      overlays.forEach(el=>{
        if(!el.closest('.driver-menu-shell-overlay')) el.style.display='none'
      })
    }
    const observer=new MutationObserver(hideNativeDrawer)
    observer.observe(document.body,{childList:true,subtree:true})

    return()=>{
      document.removeEventListener('pointerup',openFromEvent,true)
      document.removeEventListener('touchend',openFromEvent,true)
      document.removeEventListener('click',openFromEvent,true)
      observer.disconnect()
    }
  },[])

  useEffect(()=>{
    const old=document.body.style.overflow
    document.body.style.overflow=open?'hidden':old
    return()=>{document.body.style.overflow=old}
  },[open])

  if(!open) return null

  return createPortal(
    <div
      className="driver-menu-shell-overlay"
      onClick={()=>setOpen(false)}
      style={{position:'fixed',inset:0,zIndex:2147483000,background:'rgba(15,30,43,.45)',display:'block'}}
    >
      <aside
        className="drawer driver-menu-shell-drawer"
        onClick={e=>e.stopPropagation()}
        style={{position:'absolute',left:0,top:0,bottom:0,width:'min(88vw,360px)',background:'#fff',padding:'18px',overflowY:'auto',WebkitOverflowScrolling:'touch',display:'block',visibility:'visible',pointerEvents:'auto'}}
      >
        <div className="drawerTop" style={{display:'flex',alignItems:'center',minHeight:44}}>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={()=>setOpen(false)}
            style={{width:42,height:42,border:0,borderRadius:12,background:'#eef2f4',fontSize:25,lineHeight:1,cursor:'pointer'}}
          >×</button>
        </div>
        <div className="driver-menu-shell-anchor" />
      </aside>
    </div>,
    document.body,
  )
}
