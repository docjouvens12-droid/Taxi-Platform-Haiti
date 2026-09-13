'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

type Msg={id:string;safety_event_id:string;ride_id:string;sender_id:string;recipient_id:string;message:string;created_at:string}
type Lang='fr'|'ht'

export default function SafetyInterventionChat(){
  const pathname=usePathname()
  const eligible=pathname.startsWith('/passenger')||pathname.startsWith('/driver')
  const isDriver=pathname.startsWith('/driver')
  const [userId,setUserId]=useState<string|null>(null)
  const [lang,setLang]=useState<Lang>('fr')
  const [messages,setMessages]=useState<Msg[]>([])
  const [eventId,setEventId]=useState<string|null>(null)
  const [adminId,setAdminId]=useState<string|null>(null)
  const [draft,setDraft]=useState('')
  const [open,setOpen]=useState(false)
  const [busy,setBusy]=useState(false)

  useEffect(()=>{
    if(!eligible)return
    const saved=localStorage.getItem('taxi-language') as Lang|null;if(saved==='fr'||saved==='ht')setLang(saved)
    supabase.auth.getUser().then(({data})=>{const id=data.user?.id??null;setUserId(id);if(id)void loadLatest(id)})
  },[eligible])

  useEffect(()=>{
    if(!eligible||!userId)return
    const channel=supabase.channel(`safety-chat-${userId}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'ride_safety_messages'},payload=>{
        const row=payload.new as Msg
        if(row.sender_id===userId||row.recipient_id===userId){void loadLatest(userId);if(row.recipient_id===userId)setOpen(true)}
      }).subscribe()
    return()=>{void supabase.removeChannel(channel)}
  },[eligible,userId])

  async function loadLatest(uid:string){
    const {data}=await supabase.from('ride_safety_messages').select('id,safety_event_id,ride_id,sender_id,recipient_id,message,created_at').or(`sender_id.eq.${uid},recipient_id.eq.${uid}`).order('created_at',{ascending:false}).limit(100)
    const all=(data??[]) as Msg[]
    const inbound=all.find(m=>m.recipient_id===uid)
    if(!inbound){setMessages([]);setEventId(null);setAdminId(null);return}
    const eid=inbound.safety_event_id
    const thread=all.filter(m=>m.safety_event_id===eid).sort((a,b)=>new Date(a.created_at).getTime()-new Date(b.created_at).getTime())
    setEventId(eid);setAdminId(inbound.sender_id);setMessages(thread)
  }

  async function send(e:FormEvent){
    e.preventDefault();if(!userId||!eventId||!adminId||!draft.trim())return
    const latest=messages[messages.length-1];if(!latest)return
    setBusy(true)
    const {error}=await supabase.from('ride_safety_messages').insert({safety_event_id:eventId,ride_id:latest.ride_id,sender_id:userId,recipient_id:adminId,message:draft.trim()})
    if(!error)setDraft('')
    setBusy(false)
  }

  const unread=useMemo(()=>messages.filter(m=>m.recipient_id===userId).length,[messages,userId])
  if(!eligible||!userId||!eventId||messages.length===0)return null
  const title=lang==='ht'?'Mesaj Sekirite':'Messages de sécurité'
  const subtitle=lang==='ht'?'Admin sekirite Taxi Platform Haiti':'Administration sécurité Taxi Platform Haiti'
  const placeholder=lang==='ht'?'Ekri repons ou…':'Écrire votre réponse…'
  const sendLabel=lang==='ht'?'Voye':'Envoyer'
  const accent=isDriver?'#11966f':'#1b70eb'

  return <div className="safetyChatRoot">
    {!open?<button className="safetyChatPill" onClick={()=>setOpen(true)}>🛡 💬 {title}{unread>0&&<b>{unread}</b>}</button>:<section className="safetyChatPanel"><header><div><strong>{title}</strong><small>{subtitle}</small></div><button onClick={()=>setOpen(false)}>×</button></header><div className="safetyMessages">{messages.map(m=><div key={m.id} className={`bubble ${m.sender_id===userId?'mine':'admin'}`}><p>{m.message}</p><small>{m.sender_id===userId?(lang==='ht'?'Ou':'Vous'):'Admin'} · {new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small></div>)}</div><form onSubmit={send}><input value={draft} onChange={e=>setDraft(e.target.value)} maxLength={1500} placeholder={placeholder}/><button disabled={busy||!draft.trim()}>{sendLabel}</button></form><p className="hint">🛡 {lang==='ht'?'Mesaj sa yo mare ak yon dosye sekirite espesifik.':'Ces messages sont liés à un dossier de sécurité précis.'}</p></section>}
    <style jsx>{`
      .safetyChatRoot{position:fixed;right:14px;bottom:calc(72px + env(safe-area-inset-bottom));z-index:10030;font-family:Inter,system-ui,sans-serif}.safetyChatPill{border:0;border-radius:999px;background:${accent};color:#fff;padding:11px 14px;font-weight:900;box-shadow:0 12px 28px rgba(16,32,51,.22)}.safetyChatPill b{margin-left:7px;background:#fff;color:${accent};border-radius:999px;padding:2px 6px}.safetyChatPanel{width:min(360px,calc(100vw - 24px));background:#fff;border:1px solid #dce5ee;border-radius:18px;box-shadow:0 24px 70px rgba(16,32,51,.25);overflow:hidden}.safetyChatPanel header{background:${accent};color:#fff;padding:13px 14px;display:flex;justify-content:space-between;align-items:center}.safetyChatPanel header strong,.safetyChatPanel header small{display:block}.safetyChatPanel header small{font-size:9px;opacity:.85;margin-top:2px}.safetyChatPanel header button{border:0;background:rgba(255,255,255,.16);color:#fff;width:30px;height:30px;border-radius:50%;font-size:20px}.safetyMessages{max-height:300px;min-height:130px;overflow:auto;padding:10px;background:#f6f8fb;display:flex;flex-direction:column;gap:7px}.bubble{max-width:82%;padding:8px 10px;border-radius:12px}.bubble p{margin:0;font-size:12px}.bubble small{display:block;font-size:8px;margin-top:4px;opacity:.7}.bubble.mine{align-self:flex-end;background:${accent};color:#fff}.bubble.admin{align-self:flex-start;background:#fff;border:1px solid #dce5ee;color:#102033}.safetyChatPanel form{display:grid;grid-template-columns:1fr auto;gap:7px;padding:9px}.safetyChatPanel input{min-width:0;border:1px solid #d7e0e9;border-radius:11px;padding:10px}.safetyChatPanel form button{border:0;border-radius:11px;background:${accent};color:#fff;font-weight:900;padding:0 12px}.hint{margin:0;padding:0 10px 10px;color:#7b8998;font-size:9px}@media(max-width:520px){.safetyChatRoot{right:8px;bottom:calc(68px + env(safe-area-inset-bottom))}.safetyChatPanel{width:calc(100vw - 16px)}}
    `}</style>
  </div>
}