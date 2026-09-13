'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Lang = 'fr' | 'ht'
type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed'
type PayoutRow = {
  id:string; payment_id:string; ride_id:string; driver_id:string; amount_htg:number|string; status:PayoutStatus;
  provider:string|null; payout_reference:string|null; failure_reason:string|null; created_at:string; paid_at:string|null;
  driver_name?:string|null; pickup_address?:string|null; destination_address?:string|null;
  preferred_payout_provider?:'moncash'|'natcash'|null; payout_account_name?:string|null; payout_account_phone?:string|null; payout_ready?:boolean
}
type PayoutHistoryRow = { id:string; payout_id:string; old_status:string|null; new_status:string; payout_reference:string|null; created_at:string }

const copy = {
  fr:{title:'Paiements chauffeurs',subtitle:'Suivez les montants dus aux chauffeurs et leur statut de versement',back:'Tableau de bord',loading:'Chargement des paiements chauffeurs…',denied:'Accès réservé aux administrateurs.',all:'Tous',pending:'À payer',processing:'En traitement',paid:'Payé',failed:'Échoué',driver:'Chauffeur',amount:'Net chauffeur',route:'Trajet',paidAt:'Payé le',noRows:'Aucun versement dans cette catégorie.',readyTotal:'À payer',processingTotal:'En traitement',paidTotal:'Déjà payé',count:'Dossiers',reference:'Référence',referencePlaceholder:'Référence MonCash/NatCash',provider:'Fournisseur',destination:'Destination du versement',missingDestination:'Informations de versement manquantes',markProcessing:'Marquer en traitement',markPaid:'Marquer payé',markFailed:'Marquer échoué',note:"Ces actions mettent à jour le suivi interne. Elles n’envoient pas automatiquement l’argent à MonCash ou NatCash.",error:'Impossible de mettre à jour ce versement.',incomplete:'Le chauffeur doit configurer MonCash ou NatCash avec son nom et son numéro.',referenceRequired:'Une référence de transaction est obligatoire avant de marquer ce versement payé.',history:'Historique',search:'Rechercher chauffeur, téléphone, référence, trajet…',ready:'Prêt',notReady:'À compléter'},
  ht:{title:'Payout chofè',subtitle:'Swiv lajan ki pou chofè yo ak estati peman yo',back:'Dashboard',loading:'N ap chaje payout chofè yo…',denied:'Se administratè sèlman ki gen aksè.',all:'Tout',pending:'Pou peye',processing:'Ap trete',paid:'Peye',failed:'Echwe',driver:'Chofè',amount:'Net chofè',route:'Trajè',paidAt:'Peye nan',noRows:'Pa gen payout nan kategori sa a.',readyTotal:'Pou peye',processingTotal:'Ap trete',paidTotal:'Deja peye',count:'Dosye',reference:'Referans',referencePlaceholder:'Referans MonCash/NatCash',provider:'Founisè',destination:'Kote payout la prale',missingDestination:'Enfòmasyon payout manke',markProcessing:'Mete ap trete',markPaid:'Make kòm peye',markFailed:'Make kòm echwe',note:'Aksyon sa yo mete swivi entèn lan ajou. Yo pa voye lajan otomatikman sou MonCash oswa NatCash.',error:'Nou pa ka modifye payout sa a.',incomplete:'Chofè a dwe konfigire MonCash oswa NatCash ak non ak nimewo li.',referenceRequired:'Ou dwe antre referans tranzaksyon an anvan ou make payout la kòm peye.',history:'Istwa',search:'Chèche chofè, telefòn, referans, trajè…',ready:'Pare',notReady:'Pou konplete'}
}

export default function AdminPayoutsPage(){
  const [lang,setLang]=useState<Lang>('fr'); const t=copy[lang]
  const [authorized,setAuthorized]=useState<boolean|null>(null)
  const [rows,setRows]=useState<PayoutRow[]>([])
  const [history,setHistory]=useState<Record<string,PayoutHistoryRow[]>>({})
  const [referenceDrafts,setReferenceDrafts]=useState<Record<string,string>>({})
  const [filter,setFilter]=useState<'all'|PayoutStatus>('all')
  const [query,setQuery]=useState('')
  const [busyId,setBusyId]=useState<string|null>(null)
  const [message,setMessage]=useState('')

  useEffect(()=>{ const saved=localStorage.getItem('taxi-language') as Lang|null; if(saved==='fr'||saved==='ht') setLang(saved); void init() },[])
  useEffect(()=>{ if(!authorized)return; const channel=supabase.channel('admin-driver-payouts-live').on('postgres_changes',{event:'*',schema:'public',table:'driver_payouts'},()=>void loadRows()).on('postgres_changes',{event:'*',schema:'public',table:'driver_payout_status_history'},()=>void loadRows()).on('postgres_changes',{event:'UPDATE',schema:'public',table:'driver_profiles'},()=>void loadRows()).subscribe(); return()=>{void supabase.removeChannel(channel)} },[authorized])

  async function init(){
    const {data:auth}=await supabase.auth.getUser(); if(!auth.user){setAuthorized(false);return}
    const {data:me}=await supabase.from('profiles').select('role').eq('id',auth.user.id).maybeSingle(); if(me?.role!=='admin'){setAuthorized(false);return}
    setAuthorized(true); await loadRows()
  }

  async function loadRows(){
    setMessage('')
    const {data,error}=await supabase.from('driver_payouts').select('id,payment_id,ride_id,driver_id,amount_htg,status,provider,payout_reference,failure_reason,created_at,paid_at').order('created_at',{ascending:false}).limit(250)
    if(error){setMessage(error.message);return}
    const base=(data??[]) as PayoutRow[]; const driverIds=[...new Set(base.map(x=>x.driver_id))]; const rideIds=[...new Set(base.map(x=>x.ride_id))]; const payoutIds=base.map(x=>x.id)
    const [{data:profiles},{data:driverProfiles},{data:rides},{data:historyRows}]=await Promise.all([
      driverIds.length?supabase.from('profiles').select('id,full_name').in('id',driverIds):Promise.resolve({data:[] as any[]}),
      driverIds.length?supabase.from('driver_profiles').select('user_id,preferred_payout_provider,moncash_enabled,moncash_name,moncash_phone,natcash_enabled,natcash_name,natcash_phone').in('user_id',driverIds):Promise.resolve({data:[] as any[]}),
      rideIds.length?supabase.from('rides').select('id,pickup_address,destination_address').in('id',rideIds):Promise.resolve({data:[] as any[]}),
      payoutIds.length?supabase.from('driver_payout_status_history').select('id,payout_id,old_status,new_status,payout_reference,created_at').in('payout_id',payoutIds).order('created_at',{ascending:false}):Promise.resolve({data:[] as any[]})
    ])
    const names=new Map((profiles??[]).map((p:any)=>[p.id,p.full_name])); const dmap=new Map((driverProfiles??[]).map((p:any)=>[p.user_id,p])); const rmap=new Map((rides??[]).map((r:any)=>[r.id,r]))
    const grouped:Record<string,PayoutHistoryRow[]>={}; for(const item of (historyRows??[]) as PayoutHistoryRow[]){(grouped[item.payout_id]??=[]).push(item)}; setHistory(grouped)
    setRows(base.map(x=>{ const p:any=dmap.get(x.driver_id); const pref=p?.preferred_payout_provider==='moncash'||p?.preferred_payout_provider==='natcash'?p.preferred_payout_provider:null; const name=pref==='moncash'?p?.moncash_name:pref==='natcash'?p?.natcash_name:null; const phone=pref==='moncash'?p?.moncash_phone:pref==='natcash'?p?.natcash_phone:null; const enabled=pref==='moncash'?Boolean(p?.moncash_enabled):pref==='natcash'?Boolean(p?.natcash_enabled):false; return {...x,driver_name:names.get(x.driver_id)??null,pickup_address:(rmap.get(x.ride_id) as any)?.pickup_address??null,destination_address:(rmap.get(x.ride_id) as any)?.destination_address??null,preferred_payout_provider:pref,payout_account_name:name??null,payout_account_phone:phone??null,payout_ready:Boolean(pref&&enabled&&name?.trim()&&phone?.trim())} }))
    setReferenceDrafts(current=>{const next={...current}; for(const payout of base) if(next[payout.id]===undefined) next[payout.id]=payout.payout_reference??''; return next})
  }

  async function setStatus(row:PayoutRow,status:PayoutStatus){
    if((status==='processing'||status==='paid')&&!row.payout_ready){setMessage(t.incomplete);return}
    const ref=(referenceDrafts[row.id]??row.payout_reference??'').trim(); if(status==='paid'&&!ref){setMessage(t.referenceRequired);return}
    setBusyId(row.id); setMessage(''); const payload:Record<string,any>={status}; if(status==='processing'||status==='paid') payload.provider=row.preferred_payout_provider; if(ref) payload.payout_reference=ref
    const {error}=await supabase.from('driver_payouts').update(payload).eq('id',row.id); if(error)setMessage(`${t.error} ${error.message}`); else await loadRows(); setBusyId(null)
  }

  const visible=useMemo(()=>rows.filter(r=>{if(filter!=='all'&&r.status!==filter)return false; const q=query.trim().toLowerCase(); if(!q)return true; return [r.driver_name,r.payout_account_phone,r.payout_reference,r.pickup_address,r.destination_address,r.provider,r.preferred_payout_provider].some(v=>String(v??'').toLowerCase().includes(q))}),[rows,filter,query])
  const money=(v:number|string|null|undefined)=>`${Number(v??0).toLocaleString('fr-HT',{maximumFractionDigits:2})} HTG`
  const pendingTotal=rows.filter(r=>r.status==='pending').reduce((s,r)=>s+Number(r.amount_htg??0),0); const processingTotal=rows.filter(r=>r.status==='processing').reduce((s,r)=>s+Number(r.amount_htg??0),0); const paidTotal=rows.filter(r=>r.status==='paid').reduce((s,r)=>s+Number(r.amount_htg??0),0)
  const dateLabel=(v:string|null)=>v?new Intl.DateTimeFormat(lang==='ht'?'fr-HT':'fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v)):'—'
  const providerLabel=(r:PayoutRow)=>r.preferred_payout_provider==='moncash'?'MonCash':r.preferred_payout_provider==='natcash'?'NatCash':'—'
  const hs=(s:string|null)=>s==='pending'?t.pending:s==='processing'?t.processing:s==='paid'?t.paid:s==='failed'?t.failed:'—'

  if(authorized===null)return <main className="page"><section className="shell"><p>{t.loading}</p></section></main>
  if(!authorized)return <main className="page"><section className="shell"><h1>{t.title}</h1><p>{t.denied}</p><button onClick={()=>location.href='/admin/login'}>Admin login</button></section></main>

  return <main className="page"><section className="shell">
    <header className="top"><button onClick={()=>location.href='/admin'}>‹ {t.back}</button><select value={lang} onChange={e=>{const v=e.target.value as Lang;setLang(v);localStorage.setItem('taxi-language',v)}}><option value="fr">Français</option><option value="ht">Kreyòl</option></select></header>
    <div className="brand"><span>₲</span><div><strong>Taxi Platform Haiti</strong><small>{t.subtitle}</small></div></div><h1>{t.title}</h1>
    <div className="warning">⚠️ {t.note}</div>
    <div className="stats"><div><small>{t.readyTotal}</small><strong>{money(pendingTotal)}</strong></div><div><small>{t.processingTotal}</small><strong>{money(processingTotal)}</strong></div><div><small>{t.paidTotal}</small><strong>{money(paidTotal)}</strong></div><div><small>{t.count}</small><strong>{rows.length}</strong></div></div>
    <div className="toolbar"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search}/><select value={filter} onChange={e=>setFilter(e.target.value as any)}><option value="all">{t.all}</option><option value="pending">{t.pending}</option><option value="processing">{t.processing}</option><option value="paid">{t.paid}</option><option value="failed">{t.failed}</option></select><button onClick={()=>void loadRows()}>↻</button></div>
    {message&&<div className="message">{message}</div>}{visible.length===0&&<div className="empty">{t.noRows}</div>}
    <div className="list">{visible.map(r=><article className="payout" key={r.id}>
      <div className="head"><div><strong>{r.driver_name||t.driver}</strong><small>{dateLabel(r.created_at)}</small></div><div className="badges"><span className={r.payout_ready?'readyTag':'missingTag'}>{r.payout_ready?`✓ ${t.ready}`:`! ${t.notReady}`}</span><span className={`status ${r.status}`}>{t[r.status]}</span></div></div>
      <div className="amount"><small>{t.amount}</small><strong>{money(r.amount_htg)}</strong></div>
      <div className={`destination ${r.payout_ready?'ready':'missing'}`}><small>{t.destination}</small>{r.payout_ready?<><strong>{providerLabel(r)} · {r.payout_account_name}</strong><span>{r.payout_account_phone}</span></>:<><strong>⚠ {t.missingDestination}</strong><span>{t.incomplete}</span></>}</div>
      <div className="route"><small>{t.route}</small><strong>{r.pickup_address||'—'} → {r.destination_address||'—'}</strong></div>
      <label className="reference">{t.reference}<input value={referenceDrafts[r.id]??''} onChange={e=>setReferenceDrafts(c=>({...c,[r.id]:e.target.value}))} placeholder={t.referencePlaceholder} disabled={r.status==='paid'}/></label>
      <div className="meta"><span><b>{t.provider}:</b> {r.provider||providerLabel(r)}</span>{r.paid_at&&<span><b>{t.paidAt}:</b> {dateLabel(r.paid_at)}</span>}</div>
      <div className="actions">{r.status!=='processing'&&r.status!=='paid'&&<button onClick={()=>void setStatus(r,'processing')} disabled={busyId===r.id||!r.payout_ready}>{t.markProcessing}</button>}{r.status!=='paid'&&<button className="paidBtn" onClick={()=>void setStatus(r,'paid')} disabled={busyId===r.id||!r.payout_ready||!(referenceDrafts[r.id]??r.payout_reference??'').trim()}>{t.markPaid}</button>}{r.status!=='failed'&&r.status!=='paid'&&<button className="failedBtn" onClick={()=>void setStatus(r,'failed')} disabled={busyId===r.id}>{t.markFailed}</button>}</div>
      {(history[r.id]??[]).length>0&&<div className="history"><small>{t.history}</small>{(history[r.id]??[]).slice(0,4).map(h=><div key={h.id}><span>{hs(h.old_status)} → {hs(h.new_status)}</span><span>{dateLabel(h.created_at)}</span></div>)}</div>}
    </article>)}</div>
  </section><style jsx>{`
    .page{min-height:100vh;background:linear-gradient(160deg,#e6f1ee,#eef3f8 48%,#e7edf3);padding:24px;color:#102033;font-family:Inter,system-ui,sans-serif}.shell{width:min(100%,980px);margin:auto;background:#fff;border-radius:28px;padding:24px;box-shadow:0 24px 70px rgba(18,36,61,.14);box-sizing:border-box}.top{display:flex;justify-content:space-between;align-items:center}.top button{border:0;background:none;color:#0f5f4d;font-weight:900}.top select,.toolbar select{border:1px solid #d8e1e9;border-radius:12px;background:#fff;padding:10px}.brand{display:flex;gap:10px;align-items:center;margin-top:18px}.brand>span{width:44px;height:44px;border-radius:14px;background:#0f5f4d;color:#fff;display:grid;place-items:center;font-weight:950}.brand strong,.brand small{display:block}.brand small{color:#77879a;margin-top:2px}.shell h1{font-size:30px;margin:18px 0}.warning{background:#fff8e8;border:1px solid #f1dfb2;color:#795500;border-radius:15px;padding:12px 14px;font-size:12px;font-weight:800}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.stats>div{border:1px solid #e2e8ef;border-radius:16px;padding:13px;background:#f7faf9}.stats small,.stats strong{display:block}.stats small{font-size:9px;color:#718192;text-transform:uppercase;font-weight:900}.stats strong{font-size:17px;margin-top:5px}.toolbar{display:grid;grid-template-columns:1fr auto auto;gap:8px;margin-bottom:14px}.toolbar input{min-height:44px;border:1px solid #d8e1e9;border-radius:12px;padding:0 13px;font-size:16px}.toolbar button{border:0;border-radius:12px;background:#102033;color:#fff;padding:0 14px}.message{background:#fff0f0;color:#9b2c2c;border-radius:12px;padding:11px;margin-bottom:12px}.empty{padding:28px;text-align:center;border:1px dashed #d8e1e9;border-radius:16px;color:#78889a}.list{display:grid;gap:12px}.payout{border:1px solid #dfe6ee;border-radius:20px;padding:15px;background:#fff;box-shadow:0 6px 18px rgba(16,32,51,.04)}.head{display:flex;justify-content:space-between;gap:10px}.head strong,.head small{display:block}.head small{color:#7c8996;margin-top:3px}.badges{display:flex;gap:6px;align-items:flex-start;flex-wrap:wrap;justify-content:flex-end}.status,.readyTag,.missingTag{border-radius:999px;padding:6px 9px;font-size:10px;font-weight:900}.readyTag{background:#e7f7ef;color:#087052}.missingTag{background:#fff4d8;color:#805c00}.status.pending{background:#fff4d8;color:#805c00}.status.processing{background:#eaf2ff;color:#185fc2}.status.paid{background:#e7f7ef;color:#087052}.status.failed{background:#fff0f0;color:#a12e2e}.amount{margin-top:12px;background:#eaf7f2;border-radius:14px;padding:12px}.amount small,.amount strong{display:block}.amount small{font-size:9px;color:#53756a;font-weight:900;text-transform:uppercase}.amount strong{font-size:19px;margin-top:3px}.destination,.route{margin-top:9px;border-radius:13px;padding:11px}.destination{border:1px solid}.destination.ready{background:#f1faf7;border-color:#c9e8dd;color:#155f4e}.destination.missing{background:#fff7e8;border-color:#f0d7a5;color:#7a5200}.destination small,.destination strong,.destination span,.route small,.route strong{display:block}.destination small,.route small{font-size:9px;text-transform:uppercase;font-weight:900}.destination strong,.route strong{font-size:13px;margin-top:3px}.destination span{font-size:11px;margin-top:3px}.route{background:#f8fafc}.route small{color:#7b8997}.reference{display:grid;gap:6px;margin-top:10px;font-size:10px;font-weight:900;color:#657487}.reference input{min-height:43px;border:1px solid #d8e1e9;border-radius:11px;padding:0 11px;font-size:16px}.meta{display:flex;gap:16px;flex-wrap:wrap;margin-top:10px;font-size:11px;color:#657487}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.actions button{border:0;border-radius:11px;padding:10px 12px;background:#eaf2ff;color:#185fc2;font-weight:900}.actions button:disabled{opacity:.45}.actions .paidBtn{background:#0b7a5d;color:#fff}.actions .failedBtn{background:#fff0f0;color:#a12e2e}.history{margin-top:13px;border-top:1px solid #e8edf2;padding-top:10px}.history>small{display:block;font-size:9px;text-transform:uppercase;font-weight:900;color:#778594;margin-bottom:6px}.history>div{display:flex;justify-content:space-between;gap:8px;font-size:10px;color:#5f6f7f;padding:4px 0}@media(max-width:700px){.page{padding:0}.shell{min-height:100vh;border-radius:0;padding:18px 14px}.stats{grid-template-columns:1fr 1fr}.toolbar{grid-template-columns:1fr auto}.toolbar input{grid-column:1/-1}.shell h1{font-size:26px}.actions{display:grid;grid-template-columns:1fr}.actions button{width:100%}.head{align-items:flex-start}}
  `}</style></main>
}
