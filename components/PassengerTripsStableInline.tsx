'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

type Ride={id:string;status:string;pickup_address:string;destination_address:string;final_fare_htg:number|null;estimated_fare_htg:number|null;requested_at:string}
type Filter='today'|'7d'|'30d'|'all'

function label(status:string,ht:boolean){
  if(status==='completed')return ht?'Konplete':'Terminé'
  if(status==='cancelled')return ht?'Anile':'Annulé'
  if(status==='in_progress')return ht?'An kou':'En cours'
  if(status==='driver_arriving')return ht?'Chofè rive':'Chauffeur arrivé'
  if(status==='accepted')return ht?'Aksepte':'Accepté'
  if(status==='requested')return ht?'Ap chèche chofè':'Recherche chauffeur'
  return status||'—'
}

export default function PassengerTripsStableInline(){
  const [target,setTarget]=useState<HTMLElement|null>(null)
  const [open,setOpen]=useState(false)
  const [rides,setRides]=useState<Ride[]>([])
  const [busy,setBusy]=useState(false)
  const [filter,setFilter]=useState<Filter>('30d')
  const [expanded,setExpanded]=useState<string|null>(null)
  const [ht,setHt]=useState(false)

  useEffect(()=>{
    const onClick=(event:MouseEvent)=>{
      const el=(event.target as HTMLElement|null)?.closest<HTMLButtonElement>('.shell .nav-drawer .drawer-nav > button')
      if(!el)return
      const text=(el.textContent||'').toLowerCase()
      if(!text.includes('mes trajets')&&!text.includes('trajè mwen yo'))return
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation()
      setHt(localStorage.getItem('taxi-language')==='ht')
      let mount=el.nextElementSibling as HTMLElement|null
      if(!mount||!mount.classList.contains('drawer-trips-stable-target')){
        mount=document.createElement('div');mount.className='drawer-trips-stable-target';el.insertAdjacentElement('afterend',mount)
      }
      setTarget(mount);setOpen(v=>!v);setExpanded(null)
    }
    document.addEventListener('click',onClick,true)
    return()=>document.removeEventListener('click',onClick,true)
  },[])

  useEffect(()=>{
    if(!open||!target)return
    let active=true
    const load=async()=>{
      setBusy(true)
      try{
        const {data}=await supabase.from('rides').select('id,status,pickup_address,destination_address,final_fare_htg,estimated_fare_htg,requested_at').order('requested_at',{ascending:false}).limit(100)
        if(active)setRides((data||[]) as Ride[])
      }finally{
        if(active)setBusy(false)
      }
    }
    void load()
    return()=>{active=false}
  },[open,target])

  const shown=useMemo(()=>{
    if(filter==='all')return rides
    const now=new Date();const cutoff=new Date(now)
    if(filter==='today')cutoff.setHours(0,0,0,0)
    if(filter==='7d')cutoff.setDate(now.getDate()-7)
    if(filter==='30d')cutoff.setDate(now.getDate()-30)
    return rides.filter(r=>new Date(r.requested_at)>=cutoff)
  },[rides,filter])
  const total=shown.filter(r=>r.status==='completed').reduce((s,r)=>s+Number(r.final_fare_htg??r.estimated_fare_htg??0),0)

  if(!target||!open||!document.contains(target))return null
  return createPortal(<section className="pst-wrap">
    <style>{`
      .pst-wrap{margin:4px 0 10px;padding:11px;border:1px solid #dfe8e4;border-radius:17px;background:#f8faf9}
      .pst-head{display:flex;align-items:center;gap:8px;margin-bottom:9px}.pst-head strong{font-size:13px;color:#10243a}.pst-head small{display:block;font-size:9px;color:#7e8b86;margin-top:2px}.pst-head button{margin-left:auto;border:0;border-radius:10px;background:#edf5f2;padding:7px 9px;font-size:9px;font-weight:900;color:#0f705a}
      .pst-summary{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:8px}.pst-box{background:#fff;border:1px solid #e5ece9;border-radius:12px;padding:9px;text-align:center}.pst-box span{display:block;font-size:8px;color:#7b8984;font-weight:800;text-transform:uppercase}.pst-box b{display:block;margin-top:3px;font-size:13px;color:#10243a}
      .pst-filters{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;background:#edf2f0;border-radius:11px;padding:4px;margin-bottom:8px}.pst-filters button{border:0;border-radius:8px;background:transparent;padding:7px 2px;font-size:8px;font-weight:900;color:#6f7f78}.pst-filters button.active{background:#fff;color:#0f705a}
      .pst-list{display:grid;gap:7px;max-height:330px;overflow:auto}.pst-trip{background:#fff;border:1px solid #e4ebe8;border-radius:13px;padding:10px}.pst-top,.pst-foot{display:flex;justify-content:space-between;align-items:center;gap:8px}.pst-top time{font-size:8px;color:#83908b}.pst-badge{font-size:8px;font-weight:900;padding:4px 7px;border-radius:999px;background:#e8f6f1;color:#0f705a}.pst-badge.cancelled{background:#fff0f0;color:#a43b3b}.pst-route{display:grid;gap:5px;margin:8px 0}.pst-route div{display:flex;gap:6px}.pst-route b{font-size:9px;line-height:1.3;color:#294037}.pst-foot{border-top:1px solid #eef2f0;padding-top:7px}.pst-foot strong{font-size:11px;color:#10243a}.pst-foot button{border:0;border-radius:8px;background:#edf8f4;color:#0f705a;padding:6px 8px;font-size:8px;font-weight:900}.pst-details{margin-top:7px;padding:8px;border-radius:9px;background:#f7f9f8;font-size:8px;color:#5f6f68}.pst-empty{padding:18px 8px;text-align:center;font-size:10px;color:#74837d;background:#fff;border:1px dashed #d6e0dc;border-radius:12px}
    `}</style>
    <div className="pst-head"><span>🧾</span><div><strong>{ht?'Istwa trajè mwen yo':'Mes trajets'}</strong><small>{ht?'Gade trajè ak depans ou yo':'Consultez vos trajets et dépenses'}</small></div><button onClick={()=>setOpen(false)}>{ht?'Fèmen':'Fermer'}</button></div>
    <div className="pst-summary"><div className="pst-box"><span>{ht?'Trajè':'Trajets'}</span><b>{shown.length}</b></div><div className="pst-box"><span>{ht?'Depans':'Dépenses'}</span><b>{total.toLocaleString('fr-HT')} HTG</b></div></div>
    <div className="pst-filters">{([['today',ht?'Jodi a':"Aujourd’hui"],['7d','7 j'],['30d','30 j'],['all',ht?'Tout':'Tout']] as [Filter,string][]).map(([k,t])=><button key={k} className={filter===k?'active':''} onClick={()=>setFilter(k)}>{t}</button>)}</div>
    {busy?<div className="pst-empty">{ht?'N ap chaje trajè yo…':'Chargement des trajets…'}</div>:shown.length===0?<div className="pst-empty">🚕 {ht?'Pa gen trajè pou peryòd sa a.':'Aucun trajet pour cette période.'}</div>:<div className="pst-list">{shown.slice(0,20).map(r=>{const fare=Number(r.final_fare_htg??r.estimated_fare_htg??0);const isOpen=expanded===r.id;return <article className="pst-trip" key={r.id}><div className="pst-top"><time>{new Date(r.requested_at).toLocaleString(ht?'fr-HT':'fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</time><span className={`pst-badge ${r.status}`}>{label(r.status,ht)}</span></div><div className="pst-route"><div><span>📍</span><b>{r.pickup_address||'—'}</b></div><div><span>🏁</span><b>{r.destination_address||'—'}</b></div></div><div className="pst-foot"><strong>{fare.toLocaleString('fr-HT')} HTG</strong><button onClick={()=>setExpanded(isOpen?null:r.id)}>{isOpen?(ht?'Kache':'Masquer'):(ht?'Detay':'Détails')}</button></div>{isOpen&&<div className="pst-details">#{r.id.slice(0,8).toUpperCase()} · {label(r.status,ht)}</div>}</article>})}</div>}
  </section>,target)
}
