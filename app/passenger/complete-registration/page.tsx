'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Lang = 'fr' | 'ht'

export default function PassengerCompleteRegistrationPage() {
  const [lang,setLang] = useState<Lang>('fr')
  const [fullName,setFullName] = useState('')
  const [phone,setPhone] = useState('')
  const [email,setEmail] = useState('')
  const [busy,setBusy] = useState(false)
  const [message,setMessage] = useState('')
  const [ready,setReady] = useState(false)

  useEffect(()=>{
    const saved = localStorage.getItem('taxi-language') as Lang|null
    if(saved==='fr'||saved==='ht') setLang(saved)
    supabase.auth.getUser().then(async ({data})=>{
      if(!data.user){location.replace('/');return}
      setEmail(data.user.email??'')
      const {data:profile}=await supabase.from('profiles').select('role,full_name,phone,passenger_onboarding_completed').eq('id',data.user.id).maybeSingle()
      if(profile?.role==='admin'){location.replace('/admin');return}
      if(profile?.role==='driver'){location.replace('/driver');return}
      if(profile?.role==='passenger' && profile.passenger_onboarding_completed){location.replace('/');return}
      setFullName(profile?.full_name??'')
      setPhone(profile?.phone??'')
      setReady(true)
    })
  },[])

  async function submit(e:FormEvent){
    e.preventDefault();setBusy(true);setMessage('')
    const {data:auth}=await supabase.auth.getUser()
    if(!auth.user){location.replace('/');return}
    const {error}=await supabase.from('profiles').update({full_name:fullName.trim(),phone:phone.trim(),passenger_onboarding_completed:true,updated_at:new Date().toISOString()}).eq('id',auth.user.id)
    if(error){setMessage(error.message);setBusy(false);return}
    location.replace('/')
  }

  if(!ready)return <main className="page"><div className="card">{lang==='ht'?'N ap prepare enskripsyon ou…':'Préparation de votre inscription…'}</div><style jsx>{`.page{min-height:100dvh;display:grid;place-items:center;background:#0a493d;padding:16px}.card{background:#fff;border-radius:20px;padding:24px;font-family:Inter,system-ui,sans-serif;font-weight:800}`}</style></main>
  const ht=lang==='ht'
  return <main className="page">
    <section className="card">
      <header><div className="logo">🚕</div><div><strong>Taxi Platform Haiti</strong><small>{ht?'Fini enskripsyon pasaje ou':'Finalisez votre inscription passager'}</small></div></header>
      <div className="hero"><span>👤</span><h1>{ht?'Fini enskripsyon ou':'Terminez votre inscription'}</h1><p>{ht?'Ajoute enfòmasyon debaz sa yo anvan ou antre nan espas pasaje a.':'Ajoutez ces informations de base avant d’accéder à votre espace passager.'}</p></div>
      <form onSubmit={submit}>
        <label>{ht?'Imel verifye':'E-mail vérifié'}</label><input value={email} disabled />
        <label>{ht?'Non konplè':'Nom complet'}</label><input value={fullName} onChange={e=>setFullName(e.target.value)} required minLength={2} autoComplete="name" />
        <label>{ht?'Telefòn':'Téléphone'}</label><input value={phone} onChange={e=>setPhone(e.target.value)} required minLength={5} inputMode="tel" autoComplete="tel" />
        {message&&<div className="message">{message}</div>}
        <button disabled={busy}>{busy?(ht?'N ap anrejistre…':'Enregistrement…'):(ht?'Fini enskripsyon an':'Terminer l’inscription')}</button>
      </form>
    </section>
    <style jsx>{`
      .page{min-height:100dvh;background:radial-gradient(circle at 20% 0,#17735f 0,#0a3f35 45%,#062b25 100%);display:grid;place-items:center;padding:max(18px,env(safe-area-inset-top)) 14px max(18px,env(safe-area-inset-bottom));font-family:Inter,system-ui,-apple-system,sans-serif;color:#102033}.card{width:min(100%,440px);background:#fff;border-radius:28px;padding:18px;box-shadow:0 28px 80px rgba(0,0,0,.28)}header{display:flex;align-items:center;gap:10px}.logo{width:46px;height:46px;border-radius:15px;background:#0f705a;display:grid;place-items:center;font-size:24px}header strong,header small{display:block}header strong{font-size:14px}header small{font-size:10px;color:#71817b;margin-top:2px}.hero{padding:28px 3px 18px}.hero>span{display:inline-grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#eaf6f1}.hero h1{font-size:30px;line-height:1.05;margin:12px 0 8px}.hero p{font-size:12px;line-height:1.5;color:#6b7a75;margin:0}form{display:grid;gap:8px}label{font-size:10px;text-transform:uppercase;letter-spacing:.07em;font-weight:900;color:#5e7069;margin-top:4px}input{min-height:54px;border:1.5px solid #d8e4df;border-radius:15px;padding:0 13px;font-size:16px;outline:none;background:#fbfdfc;color:#102033}input:focus{border-color:#0f705a;box-shadow:0 0 0 4px rgba(15,112,90,.1)}input:disabled{background:#f0f4f2;color:#72817b}button{border:0;border-radius:16px;min-height:56px;background:#0f705a;color:#fff;font-size:15px;font-weight:900;margin-top:8px}.message{padding:10px 11px;border-radius:12px;background:#fff1f1;color:#a33434;font-size:11px;font-weight:750}@media(max-width:390px){.card{padding:14px;border-radius:24px}.hero h1{font-size:27px}}
    `}</style>
  </main>
}
