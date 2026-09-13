'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../../lib/supabase'

type Lang = 'fr' | 'ht'
type SafetyEvent = { id:string; ride_id:string; passenger_id:string; event_type:string; severity:string; resolved_at:string|null; created_at:string }
type RideInfo = { id:string; passenger_id:string; driver_id:string|null; pickup_address:string|null; destination_address:string|null }
type MessageRow = { id:string; safety_event_id:string; ride_id:string; sender_id:string; recipient_id:string; message:string; created_at:string }
type Person = { id:string; full_name:string|null; role:string|null }

const copy = {
  fr: { title:'Messages de sécurité', sub:'Communication sécurisée liée aux dossiers d’intervention', back:'Dossiers', loading:'Chargement…', denied:'Accès réservé aux administrateurs.', choose:'Choisissez un dossier', passenger:'Passager', driver:'Chauffeur', to:'Destinataire', placeholder:'Écrire un message de sécurité…', send:'Envoyer', none:'Aucun message pour ce dossier.', route:'Trajet', open:'Ouvert', resolved:'Résolu', sent:'Message envoyé.', error:'Impossible d’envoyer le message.' },
  ht: { title:'Mesaj sekirite', sub:'Kominikasyon sekirize ki mare ak dosye entèvansyon yo', back:'Dosye yo', loading:'N ap chaje…', denied:'Se administratè sèlman ki gen aksè.', choose:'Chwazi yon dosye', passenger:'Kliyan', driver:'Chofè', to:'Voye bay', placeholder:'Ekri yon mesaj sekirite…', send:'Voye', none:'Poko gen mesaj pou dosye sa a.', route:'Trajè', open:'Ouvè', resolved:'Rezoud', sent:'Mesaj la voye.', error:'Nou pa ka voye mesaj la.' }
}

export default function AdminSafetyMessagesPage(){
  const [lang,setLang]=useState<Lang>('fr')
  const t=copy[lang]
  const [authorized,setAuthorized]=useState<boolean|null>(null)
  const [adminId,setAdminId]=useState<string|null>(null)
  const [events,setEvents]=useState<SafetyEvent[]>([])
  const [rides,setRides]=useState<Record<string,RideInfo>>({})
  const [people,setPeople]=useState<Record<string,Person>>({})
  const [selected,setSelected]=useState<SafetyEvent|null>(null)
  const [recipientId,setRecipientId]=useState('')
  const [messages,setMessages]=useState<MessageRow[]>([])
  const [draft,setDraft]=useState('')
  const [busy,setBusy]=useState(false)
  const [notice,setNotice]=useState('')

  useEffect(()=>{ const saved=localStorage.getItem('taxi-language') as Lang|null; if(saved==='fr'||saved==='ht') setLang(saved); void init() },[])

  useEffect(()=>{
    if(!authorized) return
    const channel=supabase.channel('admin-safety-messages-live')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'ride_safety_messages'},payload=>{
        const row=payload.new as MessageRow
        if(selected?.id===row.safety_event_id) setMessages(prev=>prev.some(x=>x.id===row.id)?prev:[...prev,row])
      }).subscribe()
    return()=>{void supabase.removeChannel(channel)}
  },[authorized,selected?.id])

  async function init(){
    setBusy(true)
    const {data:auth}=await supabase.auth.getUser()
    if(!auth.user){setAuthorized(false);setBusy(false);return}
    const {data:me}=await supabase.from('profiles').select('id,role').eq('id',auth.user.id).maybeSingle()
    if(me?.role!=='admin'){setAuthorized(false);setBusy(false);return}
    setAdminId(auth.user.id);setAuthorized(true)
    await loadCases();setBusy(false)
  }

  async function loadCases(){
    const {data:eventRows}=await supabase.from('ride_safety_events').select('id,ride_id,passenger_id,event_type,severity,resolved_at,created_at').order('created_at',{ascending:false}).limit(100)
    const ev=(eventRows??[]) as SafetyEvent[];setEvents(ev)
    const rideIds=Array.from(new Set(ev.map(x=>x.ride_id)))
    const {data:rideRows}=rideIds.length?await supabase.from('rides').select('id,passenger_id,driver_id,pickup_address,destination_address').in('id',rideIds):{data:[] as any[]}
    const rr=(rideRows??[]) as RideInfo[];setRides(Object.fromEntries(rr.map(r=>[r.id,r])))
    const ids=Array.from(new Set(rr.flatMap(r=>[r.passenger_id,r.driver_id]).filter(Boolean) as string[]))
    const {data:profiles}=ids.length?await supabase.from('profiles').select('id,full_name,role').in('id',ids):{data:[] as any[]}
    setPeople(Object.fromEntries(((profiles??[]) as Person[]).map(p=>[p.id,p])))
  }

  async function chooseCase(row:SafetyEvent){
    setSelected(row);setNotice('')
    const ride=rides[row.ride_id]
    setRecipientId(ride?.passenger_id||'')
    const {data}=await supabase.from('ride_safety_messages').select('id,safety_event_id,ride_id,sender_id,recipient_id,message,created_at').eq('safety_event_id',row.id).order('created_at',{ascending:true}).limit(200)
    setMessages((data??[]) as MessageRow[])
  }

  async function send(e:FormEvent){
    e.preventDefault(); if(!selected||!adminId||!recipientId||!draft.trim()) return
    setBusy(true);setNotice('')
    const {error}=await supabase.from('ride_safety_messages').insert({safety_event_id:selected.id,ride_id:selected.ride_id,sender_id:adminId,recipient_id:recipientId,message:draft.trim()})
    if(error)setNotice(`${t.error} ${error.message}`);else{setDraft('');setNotice(t.sent)}
    setBusy(false)
  }

  const selectedRide=selected?rides[selected.ride_id]:null
  const recipientOptions=useMemo(()=>{
    if(!selectedRide)return [] as {id:string;label:string}[]
    const out=[{id:selectedRide.passenger_id,label:`${t.passenger} — ${people[selectedRide.passenger_id]?.full_name||t.passenger}`}]
    if(selectedRide.driver_id) out.push({id:selectedRide.driver_id,label:`${t.driver} — ${people[selectedRide.driver_id]?.full_name||t.driver}`})
    return out
  },[selectedRide,people,lang])
  const dateLabel=(v:string)=>new Intl.DateTimeFormat(lang==='ht'?'fr-HT':'fr-FR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v))

  if(authorized===null)return <main className="page"><section className="card"><p>{t.loading}</p></section></main>
  if(!authorized)return <main className="page"><section className="card"><h1>{t.title}</h1><p>{t.denied}</p><button onClick={()=>location.href='/admin/login'}>Admin login</button></section></main>

  return <main className="page"><section className="card">
    <div className="top"><button onClick={()=>location.href='/admin/safety/cases'}>‹ {t.back}</button><select value={lang} onChange={e=>{const v=e.target.value as Lang;setLang(v);localStorage.setItem('taxi-language',v)}}><option value="fr">Français</option><option value="ht">Kreyòl</option></select></div>
    <div className="brand"><span>T</span><div><strong>Taxi Platform Haiti</strong><small>{t.sub}</small></div></div><h1>{t.title}</h1>
    <div className="grid"><div className="cases">{events.map(ev=>{const r=rides[ev.ride_id];return <button key={ev.id} className={`case ${selected?.id===ev.id?'active':''}`} onClick={()=>void chooseCase(ev)}><strong>{people[ev.passenger_id]?.full_name||t.passenger}</strong><span>{ev.event_type.replaceAll('_',' ')} · {ev.severity}</span><small>{r?.pickup_address||'—'} → {r?.destination_address||'—'}</small><em>{ev.resolved_at?t.resolved:t.open}</em></button>})}</div>
      <div className="chat">{!selected?<div className="empty">← {t.choose}</div>:<><div className="chatHead"><div><strong>{people[selected.passenger_id]?.full_name||t.passenger}</strong><small>{selected.event_type.replaceAll('_',' ')} · {selected.severity}</small></div><span>{selected.resolved_at?t.resolved:t.open}</span></div><div className="route"><b>{t.route}</b><span>{selectedRide?.pickup_address||'—'} → {selectedRide?.destination_address||'—'}</span></div><label className="recipient"><span>{t.to}</span><select value={recipientId} onChange={e=>setRecipientId(e.target.value)}>{recipientOptions.map(o=><option value={o.id} key={o.id}>{o.label}</option>)}</select></label><div className="messages">{messages.length===0?<p className="muted">{t.none}</p>:messages.map(m=><div key={m.id} className={`msg ${m.sender_id===adminId?'mine':'theirs'}`}><p>{m.message}</p><small>{m.sender_id===adminId?'Admin':people[m.sender_id]?.full_name||'Utilisateur'} · {dateLabel(m.created_at)}</small></div>)}</div><form onSubmit={send}><textarea value={draft} onChange={e=>setDraft(e.target.value)} maxLength={1500} placeholder={t.placeholder}/><button disabled={busy||!draft.trim()}>{t.send}</button></form>{notice&&<div className="notice">{notice}</div>}</>}</div></div>
  </section><style jsx>{`
  .page{min-height:100vh;background:linear-gradient(160deg,#e8f1ff,#eef3f8);padding:24px;color:#102033;font-family:Inter,system-ui,sans-serif}.card{max-width:1100px;margin:auto;background:#fff;border-radius:28px;padding:24px;box-shadow:0 24px 70px rgba(18,36,61,.14)}.top{display:flex;justify-content:space-between}.top button{border:0;background:none;color:#185fc2;font-weight:900}.top select,.recipient select{border:1px solid #d8e1e9;border-radius:11px;padding:9px;background:white}.brand{display:flex;gap:10px;align-items:center;margin-top:18px}.brand>span{width:42px;height:42px;border-radius:13px;background:#1b70eb;color:white;display:grid;place-items:center;font-weight:950}.brand strong,.brand small{display:block}.brand small{color:#77879a}.card h1{margin:18px 0}.grid{display:grid;grid-template-columns:340px 1fr;gap:16px}.cases{display:grid;gap:8px;align-content:start;max-height:72vh;overflow:auto}.case{border:1px solid #dfe7ef;border-radius:14px;background:#fff;padding:12px;text-align:left}.case.active{background:#eef5ff;border-color:#9fc2f6}.case strong,.case span,.case small,.case em{display:block}.case span{font-size:10px;color:#64788d;margin:4px 0}.case small{font-size:9px;color:#82909e}.case em{font-size:9px;font-style:normal;font-weight:900;color:#185fc2;margin-top:6px}.chat{border:1px solid #e0e7ef;border-radius:18px;padding:16px;min-height:520px;display:flex;flex-direction:column}.empty{margin:auto;color:#82909e}.chatHead{display:flex;justify-content:space-between}.chatHead strong,.chatHead small{display:block}.chatHead small{color:#75879a}.chatHead span{font-size:10px;font-weight:900;background:#eef5ff;color:#185fc2;border-radius:999px;padding:7px 9px;height:max-content}.route{background:#f7f9fb;border-radius:12px;padding:10px;margin:10px 0}.route b,.route span{display:block}.route b{font-size:9px;color:#8090a0;text-transform:uppercase}.route span{font-size:12px;margin-top:4px}.recipient{display:flex;align-items:center;gap:8px;margin-bottom:10px}.recipient span{font-size:10px;font-weight:900;color:#718192}.messages{flex:1;min-height:260px;max-height:420px;overflow:auto;background:#f7f9fb;border-radius:14px;padding:10px;display:flex;flex-direction:column;gap:8px}.msg{max-width:82%;border-radius:13px;padding:9px 11px}.msg.mine{align-self:flex-end;background:#1b70eb;color:white}.msg.theirs{align-self:flex-start;background:white;border:1px solid #dfe7ef}.msg p{margin:0;font-size:13px}.msg small{display:block;margin-top:5px;font-size:9px;opacity:.75}.muted{color:#8191a0}.chat form{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px}.chat textarea{min-height:58px;border:1px solid #dce4ec;border-radius:12px;padding:10px;resize:vertical}.chat form button{border:0;border-radius:12px;background:#1b70eb;color:#fff;font-weight:900;padding:0 18px}.notice{margin-top:8px;font-size:11px;color:#185fc2}@media(max-width:760px){.page{padding:10px}.card{padding:14px;border-radius:20px}.grid{grid-template-columns:1fr}.cases{max-height:240px}.chat{min-height:500px}.chat form{grid-template-columns:1fr}.chat form button{padding:12px}}
  `}</style></main>
}