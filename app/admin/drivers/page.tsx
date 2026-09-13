'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Lang = 'fr' | 'ht'
type DriverStatus = 'pending' | 'approved' | 'rejected' | 'suspended'
type DriverRow = {
  user_id: string; status: DriverStatus; license_number: string | null; national_id_number: string | null; created_at: string
  full_name?: string | null; phone?: string | null; vehicle_type?: string | null; make?: string | null; model?: string | null
  color?: string | null; year?: number | null; plate_number?: string | null; seats?: number | null; is_active?: boolean | null
}

const copy = {
  fr: { title:'Chauffeurs', subtitle:'Gérez les demandes, validations et véhicules', back:'Tableau de bord', logout:'Se déconnecter', pending:'En attente', approved:'Approuvé', rejected:'Refusé', suspended:'Suspendu', approve:'Approuver', reject:'Refuser', driver:'Chauffeur', license:'Permis', nationalId:'Identification', vehicle:'Véhicule', plate:'Plaque', seats:'Places', noApps:'Aucun chauffeur dans ce filtre.', loading:'Chargement des chauffeurs…', denied:'Accès réservé aux administrateurs.', notSigned:'Vous devez être connecté.', actionError:'Impossible de mettre à jour la demande.', car:'Voiture', moto:'Moto', all:'Tous', search:'Rechercher un chauffeur', updated:'Demande mise à jour.', pendingCount:'À vérifier', approvedCount:'Approuvés', totalCount:'Total', created:'Demande envoyée' },
  ht: { title:'Chofè yo', subtitle:'Jere aplikasyon, apwobasyon ak veyikil yo', back:'Dashboard', logout:'Dekonekte', pending:'Ap tann', approved:'Apwouve', rejected:'Refize', suspended:'Sispann', approve:'Apwouve', reject:'Refize', driver:'Chofè', license:'Lisans', nationalId:'Idantifikasyon', vehicle:'Veyikil', plate:'Plak', seats:'Plas', noApps:'Pa gen chofè nan filtè sa a.', loading:'N ap chaje chofè yo…', denied:'Se administratè sèlman ki gen aksè.', notSigned:'Ou dwe konekte.', actionError:'Nou pa ka modifye aplikasyon an.', car:'Machin', moto:'Moto', all:'Tout', search:'Chèche yon chofè', updated:'Aplikasyon an modifye.', pendingCount:'Pou verifye', approvedCount:'Apwouve', totalCount:'Total', created:'Dat aplikasyon' }
}

export default function AdminDriversPage() {
  const [lang,setLang] = useState<Lang>('fr')
  const [authorized,setAuthorized] = useState<boolean|null>(null)
  const [rows,setRows] = useState<DriverRow[]>([])
  const [busy,setBusy] = useState(false)
  const [message,setMessage] = useState('')
  const [filter,setFilter] = useState<'all'|DriverStatus>('pending')
  const [query,setQuery] = useState('')
  const t = copy[lang]

  useEffect(()=>{ const saved=localStorage.getItem('taxi-language') as Lang|null; if(saved==='fr'||saved==='ht') setLang(saved); void init() },[])

  async function init(){
    setBusy(true)
    const {data:auth}=await supabase.auth.getUser()
    if(!auth.user){setAuthorized(false);setMessage(t.notSigned);setBusy(false);return}
    const {data:me}=await supabase.from('profiles').select('role').eq('id',auth.user.id).maybeSingle()
    if(me?.role!=='admin'){setAuthorized(false);setMessage(t.denied);setBusy(false);return}
    setAuthorized(true); await loadApplications(); setBusy(false)
  }

  async function loadApplications(){
    setBusy(true); setMessage('')
    const {data:drivers,error}=await supabase.from('driver_profiles').select('user_id,status,license_number,national_id_number,created_at').order('created_at',{ascending:false})
    if(error){setMessage(error.message);setBusy(false);return}
    const ids=(drivers??[]).map(d=>d.user_id)
    if(!ids.length){setRows([]);setBusy(false);return}
    const [{data:profiles},{data:vehicles}]=await Promise.all([
      supabase.from('profiles').select('id,full_name,phone').in('id',ids),
      supabase.from('vehicles').select('driver_id,vehicle_type,make,model,color,year,plate_number,seats,is_active').in('driver_id',ids).order('created_at',{ascending:true})
    ])
    const pmap=new Map((profiles??[]).map(p=>[p.id,p]))
    const vmap=new Map<string,any>(); for(const v of vehicles??[]) if(!vmap.has(v.driver_id)) vmap.set(v.driver_id,v)
    setRows((drivers??[]).map(d=>({...d,full_name:pmap.get(d.user_id)?.full_name??null,phone:pmap.get(d.user_id)?.phone??null,...(vmap.get(d.user_id)??{})})) as DriverRow[])
    setBusy(false)
  }

  async function setStatus(driverId:string,status:'approved'|'rejected'){
    setBusy(true);setMessage('')
    const {error}=await supabase.rpc('set_driver_application_status',{p_driver_id:driverId,p_status:status})
    if(error)setMessage(`${t.actionError} ${error.message}`)
    else{setMessage(t.updated);await loadApplications()}
    setBusy(false)
  }

  async function logout(){await supabase.auth.signOut();location.href='/'}
  function changeLang(next:Lang){setLang(next);localStorage.setItem('taxi-language',next)}

  const pendingCount=rows.filter(r=>r.status==='pending').length
  const approvedCount=rows.filter(r=>r.status==='approved').length
  const visible=useMemo(()=>{
    const q=query.trim().toLowerCase()
    return rows.filter(r=>(filter==='all'||r.status===filter)&&(!q||[r.full_name,r.phone,r.license_number,r.plate_number,r.make,r.model].some(v=>String(v??'').toLowerCase().includes(q))))
  },[rows,filter,query])

  if(authorized===null)return <main className="page"><section className="shell"><div className="loader">{t.loading}</div></section></main>
  if(!authorized)return <main className="page"><section className="shell denied"><button className="back" onClick={()=>location.href='/'}>‹ {t.back}</button><h1>{t.title}</h1><p>{message||t.denied}</p></section></main>

  return <main className="page"><section className="shell">
    <header className="topbar">
      <button className="back" onClick={()=>location.href='/admin'}>‹ {t.back}</button>
      <div className="topActions"><select value={lang} onChange={e=>changeLang(e.target.value as Lang)}><option value="fr">FR</option><option value="ht">KR</option></select><button className="logout" onClick={()=>void logout()}>{t.logout}</button></div>
    </header>

    <div className="hero"><div className="brandmark">🚕</div><div><small>Taxi Platform Haiti</small><h1>{t.title}</h1><p>{t.subtitle}</p></div></div>

    <div className="stats"><button onClick={()=>setFilter('pending')}><span>⏳</span><strong>{pendingCount}</strong><small>{t.pendingCount}</small></button><button onClick={()=>setFilter('approved')}><span>✓</span><strong>{approvedCount}</strong><small>{t.approvedCount}</small></button><button onClick={()=>setFilter('all')}><span>👥</span><strong>{rows.length}</strong><small>{t.totalCount}</small></button></div>

    <section className="toolbar">
      <input aria-label={t.search} placeholder={`🔎 ${t.search}`} value={query} onChange={e=>setQuery(e.target.value)} />
      <select value={filter} onChange={e=>setFilter(e.target.value as any)}><option value="pending">{t.pending}</option><option value="approved">{t.approved}</option><option value="rejected">{t.rejected}</option><option value="suspended">{t.suspended}</option><option value="all">{t.all}</option></select>
      <button onClick={()=>void loadApplications()} disabled={busy}>↻</button>
    </section>

    {message&&<div className="message">{message}</div>}
    {busy&&<div className="loading">{t.loading}</div>}
    {!busy&&visible.length===0&&<div className="empty">🚕<strong>{t.noApps}</strong></div>}

    <div className="list">{visible.map(r=><article className="driverCard" key={r.user_id}>
      <div className="cardHead"><div className="avatar">{(r.full_name||'C').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()}</div><div className="identity"><strong>{r.full_name||t.driver}</strong><small>{r.phone||'—'}</small></div><span className={`status ${r.status}`}>{t[r.status]}</span></div>
      <div className="vehicleLine"><span>{r.vehicle_type==='moto'?'🏍️':'🚕'}</span><div><strong>{[r.make,r.model,r.year].filter(Boolean).join(' ')||t.vehicle}</strong><small>{r.color||'—'} · {t.plate}: {r.plate_number||'—'}</small></div></div>
      <div className="details"><div><span>{t.license}</span><strong>{r.license_number||'—'}</strong></div><div><span>{t.nationalId}</span><strong>{r.national_id_number||'—'}</strong></div><div><span>{t.seats}</span><strong>{r.seats??'—'}</strong></div><div><span>{t.created}</span><strong>{new Date(r.created_at).toLocaleDateString(lang==='ht'?'fr-HT':'fr-FR')}</strong></div></div>
      {(r.status==='pending'||r.status==='rejected')&&<div className="actions"><button className="reject" onClick={()=>void setStatus(r.user_id,'rejected')} disabled={busy}>{t.reject}</button><button className="approve" onClick={()=>void setStatus(r.user_id,'approved')} disabled={busy}>✓ {t.approve}</button></div>}
    </article>)}</div>
  </section>
  <style jsx>{`
    .page{min-height:100dvh;background:radial-gradient(circle at 50% -10%,#dceee8 0,#edf3f0 38%,#e8edf0 100%);padding:18px;color:#102033;font-family:Inter,system-ui,sans-serif}.shell{width:min(100%,880px);margin:auto;background:rgba(255,255,255,.96);border:1px solid #dce7e3;border-radius:30px;padding:22px;box-shadow:0 24px 70px rgba(16,32,51,.13)}.topbar{display:flex;justify-content:space-between;gap:12px;align-items:center}.back{border:0;background:#eef7f4;color:#0f705a;padding:10px 13px;border-radius:12px;font-weight:900}.topActions{display:flex;gap:8px}.topActions select,.toolbar select{border:1px solid #dbe5e1;background:#fff;border-radius:12px;padding:10px;min-height:42px}.logout{border:1px solid #f0d4d4;background:#fff6f6;color:#a33434;border-radius:12px;padding:10px 12px;font-weight:850}.hero{display:flex;align-items:center;gap:13px;margin:24px 0 18px}.brandmark{width:52px;height:52px;border-radius:17px;background:#0f705a;color:#fff;display:grid;place-items:center;font-size:25px}.hero small{color:#0f705a;font-weight:900}.hero h1{margin:2px 0;font-size:30px}.hero p{margin:0;color:#74827d}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.stats button{border:1px solid #e1e9e6;background:#f9fbfa;border-radius:18px;padding:13px;text-align:left}.stats span,.stats strong,.stats small{display:block}.stats span{font-size:19px}.stats strong{font-size:23px;margin:5px 0 1px}.stats small{color:#72817b;font-weight:800}.toolbar{display:grid;grid-template-columns:1fr auto auto;gap:9px;margin:18px 0}.toolbar input{min-width:0;border:1px solid #dbe5e1;border-radius:14px;padding:12px 13px;font-size:16px}.toolbar button{border:0;border-radius:12px;background:#102033;color:#fff;padding:0 15px;font-size:18px}.message,.loading{padding:11px 13px;border-radius:13px;background:#edf8f4;color:#0f705a;font-weight:800;margin-bottom:12px}.empty{display:grid;gap:8px;place-items:center;padding:34px;border:1px dashed #cddbd6;border-radius:18px;color:#75837e;background:#fafcfb}.empty:first-letter{font-size:30px}.list{display:grid;gap:13px}.driverCard{border:1px solid #dfe8e4;border-radius:20px;padding:15px;background:#fff;box-shadow:0 8px 22px rgba(16,32,51,.045)}.cardHead{display:grid;grid-template-columns:46px 1fr auto;gap:10px;align-items:center}.avatar{width:46px;height:46px;border-radius:15px;background:#e9f5f1;color:#0f705a;display:grid;place-items:center;font-weight:950}.identity strong,.identity small{display:block}.identity small{color:#778681;margin-top:2px}.status{font-size:10px;font-weight:950;padding:7px 9px;border-radius:999px}.status.pending{background:#fff4d5;color:#7c5b00}.status.approved{background:#e6f7ef;color:#087052}.status.rejected,.status.suspended{background:#fff0f0;color:#a02c2c}.vehicleLine{display:flex;gap:10px;align-items:center;margin:13px 0;padding:11px 12px;background:#f5f8f7;border-radius:14px}.vehicleLine>span{font-size:23px}.vehicleLine strong,.vehicleLine small{display:block}.vehicleLine small{margin-top:2px;color:#71807b}.details{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.details div{background:#fafbfb;border:1px solid #e8eeeb;border-radius:12px;padding:9px}.details span,.details strong{display:block}.details span{font-size:9px;color:#7b8984;text-transform:uppercase;font-weight:900}.details strong{font-size:12px;margin-top:3px;overflow-wrap:anywhere}.actions{display:grid;grid-template-columns:1fr 1.25fr;gap:9px;margin-top:12px}.actions button{min-height:44px;border:0;border-radius:13px;font-weight:900}.reject{background:#fff0f0;color:#a02c2c}.approve{background:#0f705a;color:#fff}.denied{margin-top:8vh}.loader{padding:30px;text-align:center;color:#6f7e79;font-weight:800}@media(max-width:680px){.page{padding:0}.shell{min-height:100dvh;border-radius:0;border:0;padding:16px}.hero{margin-top:18px}.hero h1{font-size:25px}.hero p{font-size:13px}.stats{gap:7px}.stats button{padding:11px 9px}.stats strong{font-size:20px}.toolbar{grid-template-columns:1fr auto}.toolbar input{grid-column:1/-1}.details{grid-template-columns:1fr 1fr}.cardHead{grid-template-columns:42px 1fr auto}.avatar{width:42px;height:42px}.logout{font-size:11px}.topActions select{min-width:56px}}
  `}</style>
  </main>
}
