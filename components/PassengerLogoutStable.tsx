'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

export default function PassengerLogoutStable(){
  const [target,setTarget]=useState<HTMLElement|null>(null)
  const [confirm,setConfirm]=useState(false)
  const [busy,setBusy]=useState(false)

  useEffect(()=>{
    const sync=()=>{
      const el=document.querySelector<HTMLElement>('.shell .nav-drawer .drawer-logout')
      if(el){
        el.classList.add('passenger-logout-host')
        setTarget(el)
      }else{
        setTarget(null)
      }
    }
    sync()
    const onClick=()=>window.setTimeout(sync,20)
    document.addEventListener('click',onClick,true)
    return()=>{
      document.removeEventListener('click',onClick,true)
      document.querySelector<HTMLElement>('.shell .nav-drawer .drawer-logout')?.classList.remove('passenger-logout-host')
    }
  },[])

  async function logout(){
    setBusy(true)
    try{
      await supabase.auth.signOut()
      localStorage.removeItem('taxi-auth-token')
      localStorage.removeItem('driver-auth-token')
      window.location.href='/'
    }finally{
      setBusy(false)
    }
  }

  if(!target||!document.contains(target)) return null
  const ht=localStorage.getItem('taxi-language')==='ht'

  return createPortal(<>
    <style>{`
      .drawer-logout.passenger-logout-host{display:none!important}
      .plo-wrap{margin-top:10px}
      .plo-btn{width:100%;min-height:48px;border:1px solid #f2d7d2;border-radius:16px;background:#fff8f7;color:#c44b3b;font-weight:900;font-size:14px;display:flex;align-items:center;justify-content:center;gap:9px}
      .plo-btn span{font-size:17px}
      .plo-confirm{margin-top:8px;padding:11px;border:1px solid #eddeda;border-radius:15px;background:#fff}
      .plo-confirm b{display:block;font-size:12px;color:#10243a}.plo-confirm small{display:block;margin-top:3px;font-size:9px;line-height:1.3;color:#7b8984}
      .plo-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}
      .plo-actions button{min-height:40px;border-radius:12px;font-weight:900;font-size:11px}
      .plo-cancel{border:1px solid #dde6e2;background:#f6f9f8;color:#30473f}
      .plo-go{border:0;background:#c94f40;color:#fff}
    `}</style>
    <div className="plo-wrap">
      <button type="button" className="plo-btn" onClick={()=>setConfirm(v=>!v)}><span>↪</span>{ht?'Dekonekte':'Se déconnecter'}</button>
      {confirm&&<div className="plo-confirm">
        <b>{ht?'Ou vle dekonekte?':'Voulez-vous vous déconnecter ?'}</b>
        <small>{ht?'W ap bezwen konekte ankò pou itilize kont ou.':'Vous devrez vous reconnecter pour accéder à votre compte.'}</small>
        <div className="plo-actions">
          <button type="button" className="plo-cancel" onClick={()=>setConfirm(false)}>{ht?'Anile':'Annuler'}</button>
          <button type="button" className="plo-go" disabled={busy} onClick={logout}>{busy?(ht?'Tanpri tann…':'Veuillez patienter…'):(ht?'Dekonekte':'Se déconnecter')}</button>
        </div>
      </div>}
    </div>
  </>,target.parentElement ?? target)
}
