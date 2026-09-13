'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

type Filter='today'|'7d'|'30d'|'all'
type Ride={id:string;pickup_address:string|null;destination_address:string|null;final_fare_htg:number|null;completed_at:string|null;status:string|null}

export default function DriverHistorySectionPolish(){
  const [target,setTarget]=useState<HTMLElement|null>(null)
  const [rides,setRides]=useState<Ride[]>([])
  const [filter,setFilter]=useState<Filter>('30d')
  const [ht,setHt]=useState(true)

  useEffect(()=>{
    if(location.pathname!=='/driver/dashboard') return
    setHt(localStorage.getItem('taxi-language')==='ht')
    const install=()=>{
      const sections=Array.from(document.querySelectorAll<HTMLElement>('.dfm-section'))
      const section=sections.find(s=>{
        const text=(s.querySelector('.dfm-trigger')?.textContent||'').toLowerCase()
        return text.includes('istorik trajè')||text.includes('historique des trajets')
      })
      if(!section){setTarget(null);return}
      section.classList.add('driver-history-polish')
      const body=section.querySelector<HTMLElement>('.dfm-body')
      if(!body){setTarget(null);return}
      Array.from(body.children).forEach(el=>{if(!(el as HTMLElement).classList.contains('driver-history-polish-root'))(el as HTMLElement).style.display='none'})
      let mount=body.querySelector<HTMLElement>('.driver-history-polish-root')
      if(!mount){mount=document.createElement('div');mount.className='driver-history-polish-root';body.appendChild(mount)}
      setTarget(mount)
    }
    install()
    const observer=new MutationObserver(install)
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])

  useEffect(()=>{
    if(!target)return
    void (async()=>{
      const {data:s}=await supabase.auth.getSession();const user=s.session?.user;if(!user)return
      const {data}=await supabase.from('rides').select('id,pickup_address,destination_address,final_fare_htg,completed_at,status').eq('driver_id',user.id).eq('status','completed').order('completed_at',{ascending:false}).limit(100)
      setRides((data||[]) as Ride[])
    })()
  },[target])

  const filtered=useMemo(()=>{
    if(filter==='all')return rides
    const now=new Date()
    const cutoff=new Date(now)
    if(filter==='today')cutoff.setHours(0,0,0,0)
    if(filter==='7d')cutoff.setDate(now.getDate()-7)
    if(filter==='30d')cutoff.setDate(now.getDate()-30)
    return rides.filter(r=>r.completed_at&&new Date(r.completed_at)>=cutoff)
  },[rides,filter])

  const total=filtered.reduce((sum,r)=>sum+Number(r.final_fare_htg||0),0)
  if(!target)return null

  return createPortal(<div className="dhp-wrap">
    <style>{`
      .driver-history-polish .dfm-body{background:#f8faf9;border-radius:18px;padding:12px!important}
      .dhp-wrap{display:grid;gap:10px;color:#102033}
      .dhp-summary{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .dhp-stat{background:linear-gradient(145deg,#0f705a,#155f51);color:#fff;border-radius:16px;padding:13px;box-shadow:0 8px 18px rgba(15,112,90,.13)}
      .dhp-stat span{display:block;font-size:9px;opacity:.82;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.dhp-stat strong{display:block;margin-top:4px;font-size:16px}
      .dhp-filters{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;background:#eef3f1;padding:4px;border-radius:13px}
      .dhp-filters button{border:0;background:transparent;border-radius:10px;padding:8px 4px;font-size:9px;font-weight:900;color:#718078}.dhp-filters button.active{background:#fff;color:#0f705a;box-shadow:0 3px 8px rgba(16,32,51,.07)}
      .dhp-list{display:grid;gap:8px;max-height:390px;overflow:auto;padding-right:1px}
      .dhp-trip{background:#fff;border:1px solid #e4ebe8;border-radius:15px;padding:11px}
      .dhp-trip-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.dhp-trip-head strong{font-size:10px;color:#52645d}.dhp-badge{font-size:8px;font-weight:900;background:#e8f6f1;color:#0f705a;border-radius:999px;padding:5px 7px}
      .dhp-route{display:grid;gap:6px;font-size:10px;color:#40534c}.dhp-route div{display:flex;gap:6px;align-items:flex-start}.dhp-fare{margin-top:9px;padding-top:8px;border-top:1px solid #edf1ef;display:flex;justify-content:space-between;align-items:center}.dhp-fare span{font-size:9px;color:#7b8983}.dhp-fare strong{font-size:13px;color:#102033}.dhp-empty{padding:22px 12px;text-align:center;color:#73827b;font-size:11px;background:#fff;border:1px dashed #d5dfdb;border-radius:14px}
    `}</style>
    <div className="dhp-summary">
      <div className="dhp-stat"><span>{ht?'Trajè':'Trajets'}</span><strong>{filtered.length}</strong></div>
      <div className="dhp-stat"><span>{ht?'Total':'Total'}</span><strong>{total.toLocaleString('fr-HT')} HTG</strong></div>
    </div>
    <div className="dhp-filters">
      {([['today',ht?'Jodi a':'Aujourd’hui'],['7d','7 jou'],['30d','30 jou'],['all',ht?'Tout':'Tout']] as [Filter,string][]).map(([key,label])=><button key={key} className={filter===key?'active':''} onClick={()=>setFilter(key)}>{label}</button>)}
    </div>
    <div className="dhp-list">
      {filtered.length===0?<div className="dhp-empty">{ht?'Pa gen trajè nan peryòd sa a.':'Aucun trajet pour cette période.'}</div>:filtered.map(r=><div className="dhp-trip" key={r.id}>
        <div className="dhp-trip-head"><strong>{r.completed_at?new Date(r.completed_at).toLocaleString(ht?'fr-HT':'fr-FR'):'—'}</strong><span className="dhp-badge">{ht?'Konplete':'Terminé'}</span></div>
        <div className="dhp-route"><div><span>📍</span><span>{r.pickup_address||'—'}</span></div><div><span>🏁</span><span>{r.destination_address||'—'}</span></div></div>
        <div className="dhp-fare"><span>{ht?'Montan trajè':'Montant du trajet'}</span><strong>{Number(r.final_fare_htg||0).toLocaleString('fr-HT')} HTG</strong></div>
      </div>)}
    </div>
  </div>,target)
}
