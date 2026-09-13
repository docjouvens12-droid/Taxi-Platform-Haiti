'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

type Ride={id:string;completed_at:string|null;final_fare_htg:number|null}
type Payment={ride_id:string;amount_htg:number|string|null;platform_fee_htg:number|string|null;driver_net_htg:number|string|null;status:string|null}

export default function DriverCleanEarningsPolish(){
  const [target,setTarget]=useState<HTMLElement|null>(null)
  const [rides,setRides]=useState<Ride[]>([])
  const [payments,setPayments]=useState<Payment[]>([])
  const [loading,setLoading]=useState(false)
  const [ht,setHt]=useState(false)

  useEffect(()=>{
    if(!window.location.pathname.startsWith('/driver/dashboard-v2')) return
    setHt(localStorage.getItem('taxi-language')==='ht')

    const locate=()=>{
      const rows=Array.from(document.querySelectorAll<HTMLButtonElement>('.dcm-row'))
      const row=rows.find(el=>{
        const t=(el.textContent||'').toLowerCase()
        return t.includes('revni')||t.includes('revenus')
      })
      const panel=row?.nextElementSibling as HTMLElement|null
      if(panel?.classList.contains('dcm-panel')){
        panel.classList.add('dcm-earnings-polish')
        Array.from(panel.children).forEach(el=>{
          const node=el as HTMLElement
          if(!node.classList.contains('driver-clean-earnings-root')) node.style.display='none'
        })
        let mount=panel.querySelector<HTMLElement>('.driver-clean-earnings-root')
        if(!mount){mount=document.createElement('div');mount.className='driver-clean-earnings-root';panel.appendChild(mount)}
        setTarget(mount)
      }else setTarget(null)
    }

    locate()
    const timer=window.setInterval(locate,250)
    return()=>window.clearInterval(timer)
  },[])

  async function load(){
    setLoading(true)
    try{
      const {data:s}=await supabase.auth.getSession()
      const user=s.session?.user
      if(!user) return
      const {data:r}=await supabase.from('rides').select('id,completed_at,final_fare_htg').eq('driver_id',user.id).eq('status','completed').order('completed_at',{ascending:false})
      const rideRows=(r||[]) as Ride[]
      setRides(rideRows)
      const ids=rideRows.map(x=>x.id)
      if(!ids.length){setPayments([]);return}
      const {data:p}=await supabase.from('payments').select('ride_id,amount_htg,platform_fee_htg,driver_net_htg,status').in('ride_id',ids)
      setPayments((p||[]) as Payment[])
    }finally{setLoading(false)}
  }

  useEffect(()=>{if(target) void load()},[target])

  useEffect(()=>{
    let rideChannel:ReturnType<typeof supabase.channel>|null=null
    let paymentChannel:ReturnType<typeof supabase.channel>|null=null
    void (async()=>{
      const {data:s}=await supabase.auth.getSession();const user=s.session?.user
      if(!user) return
      rideChannel=supabase.channel(`clean-earnings-rides-${user.id}`).on('postgres_changes',{event:'*',schema:'public',table:'rides',filter:`driver_id=eq.${user.id}`},()=>window.setTimeout(()=>void load(),200)).subscribe()
      paymentChannel=supabase.channel(`clean-earnings-payments-${user.id}`).on('postgres_changes',{event:'*',schema:'public',table:'payments'},()=>window.setTimeout(()=>void load(),200)).subscribe()
    })()
    return()=>{if(rideChannel)void supabase.removeChannel(rideChannel);if(paymentChannel)void supabase.removeChannel(paymentChannel)}
  },[])

  const values=useMemo(()=>{
    const byRide=new Map(payments.map(p=>[p.ride_id,p]))
    const startToday=new Date();startToday.setHours(0,0,0,0)
    const sevenAgo=Date.now()-7*24*60*60*1000
    const amount=(ride:Ride)=>{
      const p=byRide.get(ride.id)
      const gross=Number(p?.amount_htg ?? ride.final_fare_htg ?? 0)
      const fee=Number(p?.platform_fee_htg ?? gross*0.15)
      const net=Number(p?.driver_net_htg ?? Math.max(0,gross-fee))
      return {gross,fee,net,status:p?.status||null}
    }
    const sums=(list:Ride[])=>list.reduce((a,r)=>{const x=amount(r);return{gross:a.gross+x.gross,fee:a.fee+x.fee,net:a.net+x.net}},{gross:0,fee:0,net:0})
    const today=rides.filter(r=>r.completed_at&&new Date(r.completed_at).getTime()>=startToday.getTime())
    const week=rides.filter(r=>r.completed_at&&new Date(r.completed_at).getTime()>=sevenAgo)
    const latest=rides[0]?amount(rides[0]):null
    return {total:sums(rides),today:sums(today),week:sums(week),todayCount:today.length,totalCount:rides.length,latest}
  },[rides,payments])

  const fmt=(n:number)=>`${Math.round(n).toLocaleString('fr-HT')} HTG`
  if(!target)return null

  return createPortal(<div className="dce-wrap">
    <style>{`
      .dcm-earnings-polish{background:#f8faf9!important;border-radius:18px!important;padding:12px!important}
      .dce-wrap{display:grid;gap:10px;color:#102033}.dce-summary{background:linear-gradient(145deg,#102033,#173246);color:#fff;border-radius:18px;padding:14px;box-shadow:0 8px 20px rgba(16,32,51,.16)}
      .dce-top{display:flex;justify-content:space-between;align-items:center;gap:10px}.dce-title{display:flex;align-items:center;gap:9px}.dce-icon{width:42px;height:42px;border-radius:14px;background:rgba(255,255,255,.12);display:grid;place-items:center;font-size:20px}.dce-title strong{display:block;font-size:13px}.dce-title small{display:block;font-size:9px;opacity:.72;margin-top:2px}.dce-net{text-align:right}.dce-net small{display:block;font-size:8px;opacity:.7}.dce-net b{display:block;font-size:20px;margin-top:3px}
      .dce-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:12px}.dce-card{background:rgba(255,255,255,.1);border-radius:11px;padding:8px;text-align:center}.dce-card span{display:block;font-size:7px;opacity:.75;text-transform:uppercase}.dce-card b{display:block;font-size:10px;margin-top:4px}
      .dce-section{background:#fff;border:1px solid #e4ebe8;border-radius:15px;padding:11px}.dce-section h4{margin:0 0 8px;font-size:10px;text-transform:uppercase;color:#718078;letter-spacing:.04em}.dce-row{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-top:1px solid #eef2f0;font-size:10px}.dce-row:first-of-type{border-top:0}.dce-row span{color:#75847e}.dce-row b{color:#102033;text-align:right}.dce-row.net b{color:#0f705a;font-size:12px}.dce-row.fee b{color:#9a6a00}
      .dce-refresh{width:100%;border:0;border-radius:11px;background:#edf5f2;color:#0f705a;padding:9px;font-weight:900;font-size:10px}.dce-loading{text-align:center;font-size:10px;color:#718078;padding:4px}
    `}</style>
    <div className="dce-summary">
      <div className="dce-top"><div className="dce-title"><div className="dce-icon">💰</div><div><strong>{ht?'Revni chofè':'Revenus chauffeur'}</strong><small>{ht?'Rezime aktivite ou':'Résumé de votre activité'}</small></div></div><div className="dce-net"><small>{ht?'NET TOTAL':'NET TOTAL'}</small><b>{fmt(values.total.net)}</b></div></div>
      <div className="dce-cards"><div className="dce-card"><span>{ht?'Brut':'Brut'}</span><b>{fmt(values.total.gross)}</b></div><div className="dce-card"><span>{ht?'Platfòm 15%':'Plateforme 15%'}</span><b>{fmt(values.total.fee)}</b></div><div className="dce-card"><span>{ht?'Trajè':'Trajets'}</span><b>{values.totalCount}</b></div></div>
    </div>

    <div className="dce-section"><h4>{ht?'Jodi a':'Aujourd’hui'}</h4><div className="dce-row"><span>{ht?'Trajè jodi a':'Trajets aujourd’hui'}</span><b>{values.todayCount}</b></div><div className="dce-row net"><span>{ht?'Net jodi a':'Net aujourd’hui'}</span><b>{fmt(values.today.net)}</b></div></div>
    <div className="dce-section"><h4>{ht?'7 dènye jou':'7 derniers jours'}</h4><div className="dce-row"><span>{ht?'Brut 7 jou':'Brut sur 7 jours'}</span><b>{fmt(values.week.gross)}</b></div><div className="dce-row fee"><span>{ht?'Komisyon platfòm':'Commission plateforme'}</span><b>{fmt(values.week.fee)}</b></div><div className="dce-row net"><span>{ht?'Net 7 jou':'Net sur 7 jours'}</span><b>{fmt(values.week.net)}</b></div></div>
    <div className="dce-section"><h4>{ht?'Dènye trajè':'Dernier trajet'}</h4><div className="dce-row"><span>{ht?'Brut':'Brut'}</span><b>{values.latest?fmt(values.latest.gross):'—'}</b></div><div className="dce-row fee"><span>{ht?'Komisyon 15%':'Commission 15 %'}</span><b>{values.latest?fmt(values.latest.fee):'—'}</b></div><div className="dce-row net"><span>{ht?'Net chofè':'Net chauffeur'}</span><b>{values.latest?fmt(values.latest.net):'—'}</b></div><div className="dce-row"><span>{ht?'Estati peman':'Statut du paiement'}</span><b>{values.latest?.status?String(values.latest.status).toUpperCase():'—'}</b></div></div>
    {loading&&<div className="dce-loading">{ht?'Chajman...':'Chargement...'}</div>}
    <button className="dce-refresh" onClick={()=>void load()}>↻ {ht?'Rafrechi revni':'Rafraîchir les revenus'}</button>
  </div>,target)
}
