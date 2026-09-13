'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import PassengerProfilePanel from './PassengerProfilePanel'

export default function PassengerProfilePageRestore(){
  const [target,setTarget]=useState<HTMLElement|null>(null)
  const [user,setUser]=useState<User|null>(null)
  const [lang,setLang]=useState<'fr'|'ht'>('fr')

  useEffect(()=>{
    const saved=localStorage.getItem('taxi-language')
    setLang(saved==='ht'?'ht':'fr')
    void supabase.auth.getUser().then(({data})=>setUser(data.user??null))

    const sync=()=>{
      const panel=document.querySelector<HTMLElement>('.account-panel')
      if(!panel){setTarget(null);return}
      const title=(panel.querySelector('.panel-header strong')?.textContent||'').toLowerCase()
      const isProfile=title.includes('profil')||title.includes('pwofil')
      if(!isProfile){setTarget(null);return}
      const body=panel.querySelector<HTMLElement>('.panel-body')
      if(!body){setTarget(null);return}
      body.classList.add('passenger-profile-restored-body')
      let mount=body.querySelector<HTMLElement>('.passenger-profile-restored-target')
      if(!mount){
        mount=document.createElement('div')
        mount.className='passenger-profile-restored-target'
        body.appendChild(mount)
      }
      setTarget(mount)
    }

    sync()
    const observer=new MutationObserver(sync)
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])

  if(!target||!user)return null
  return createPortal(<>
    <style>{`
      .passenger-profile-restored-body>h2,
      .passenger-profile-restored-body>.profile-avatar,
      .passenger-profile-restored-body>.profile-info{display:none!important}
      .passenger-profile-restored-body{padding-top:18px!important}
      .passenger-profile-restored-target{display:block!important;width:100%!important}
    `}</style>
    <PassengerProfilePanel user={user} lang={lang} onUserChange={setUser}/>
  </>,target)
}
