'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PassengerLogoutPolish(){
  const [confirmOpen,setConfirmOpen]=useState(false)
  const [busy,setBusy]=useState(false)
  const [ht,setHt]=useState(false)

  useEffect(()=>{
    if(window.location.pathname.startsWith('/driver')) return
    setHt(localStorage.getItem('taxi-language')==='ht')
    let current:HTMLButtonElement|null=null
    let handler:((event:MouseEvent)=>void)|null=null

    const apply=()=>{
      if(window.location.pathname.startsWith('/driver')) return
      const drawer=document.querySelector('.nav-drawer')
      if(!drawer) return
      const buttons=Array.from(drawer.querySelectorAll<HTMLButtonElement>('.drawer-nav > button'))
      const logout=buttons.find(button=>{
        const text=(button.textContent||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
        return text.includes('deconnecter')||text.includes('dekonekte')
      })||null
      if(!logout) return

      logout.classList.add('passenger-logout-polish')
      logout.style.order='100'
      if(current!==logout){
        if(current&&handler) current.removeEventListener('click',handler,true)
        current=logout
        handler=(event:MouseEvent)=>{
          event.preventDefault();event.stopPropagation();event.stopImmediatePropagation()
          setHt(localStorage.getItem('taxi-language')==='ht')
          setConfirmOpen(true)
        }
        logout.addEventListener('click',handler,true)
      }
    }

    apply()
    const observer=new MutationObserver(apply)
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>{
      observer.disconnect()
      if(current&&handler) current.removeEventListener('click',handler,true)
    }
  },[])

  async function logout(){
    setBusy(true)
    await supabase.auth.signOut()
    setBusy(false)
    setConfirmOpen(false)
    window.location.assign('/')
  }

  return <>
    <style>{`
      .nav-drawer .drawer-nav>button.passenger-logout-polish{
        margin-top:14px!important;
        border:1px solid #f0c9c9!important;
        background:#fff7f7!important;
        color:#b13b3b!important;
        border-radius:14px!important;
        min-height:46px!important;
        font-weight:900!important;
      }
      .nav-drawer .drawer-nav>button.passenger-logout-polish span{filter:none!important}
      .passenger-logout-backdrop{position:fixed;inset:0;z-index:9998;background:rgba(12,26,38,.42);backdrop-filter:blur(2px)}
      .passenger-logout-modal{position:fixed;z-index:9999;left:50%;top:50%;transform:translate(-50%,-50%);width:min(88vw,340px);background:#fff;border-radius:22px;padding:18px;box-shadow:0 24px 70px rgba(16,32,51,.28);border:1px solid #e8ecea}
      .passenger-logout-icon{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:#fff1f1;margin-bottom:12px;font-size:22px}
      .passenger-logout-modal h3{margin:0;color:#102033;font-size:17px}.passenger-logout-modal p{margin:7px 0 16px;color:#6c7a74;font-size:12px;line-height:1.45}
      .passenger-logout-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.passenger-logout-actions button{min-height:43px;border-radius:12px;font-size:11px;font-weight:900;cursor:pointer}.passenger-logout-cancel{border:1px solid #dbe3df;background:#fff;color:#42564e}.passenger-logout-confirm{border:0;background:#b23c3c;color:#fff}.passenger-logout-confirm:disabled{opacity:.6}
    `}</style>
    {confirmOpen&&<>
      <button className="passenger-logout-backdrop" aria-label="Close" onClick={()=>!busy&&setConfirmOpen(false)} />
      <div className="passenger-logout-modal" role="dialog" aria-modal="true">
        <div className="passenger-logout-icon">↪️</div>
        <h3>{ht?'Dekonekte?':'Se déconnecter ?'}</h3>
        <p>{ht?'Ou pral soti nan kont ou. Ou ka konekte ankò nenpòt ki lè.':'Vous allez quitter votre compte. Vous pourrez vous reconnecter à tout moment.'}</p>
        <div className="passenger-logout-actions">
          <button className="passenger-logout-cancel" onClick={()=>setConfirmOpen(false)} disabled={busy}>{ht?'Anile':'Annuler'}</button>
          <button className="passenger-logout-confirm" onClick={()=>void logout()} disabled={busy}>{busy?(ht?'Ap dekonekte…':'Déconnexion…'):(ht?'Dekonekte':'Se déconnecter')}</button>
        </div>
      </div>
    </>}
  </>
}
