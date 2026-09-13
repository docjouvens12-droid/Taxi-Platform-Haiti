'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

type Method='moncash'|'natcash'
type Account={name:string;phone:string}

const empty:Account={name:'',phone:''}

export default function PassengerPaymentStableInline(){
  const [target,setTarget]=useState<HTMLElement|null>(null)
  const [open,setOpen]=useState(false)
  const [ht,setHt]=useState(false)
  const [method,setMethod]=useState<Method>('moncash')
  const [accounts,setAccounts]=useState<Record<Method,Account>>({moncash:empty,natcash:empty})
  const [drafts,setDrafts]=useState<Record<Method,Account>>({moncash:empty,natcash:empty})
  const [editing,setEditing]=useState<Record<Method,boolean>>({moncash:false,natcash:false})
  const [saving,setSaving]=useState<Method|null>(null)
  const [message,setMessage]=useState('')

  useEffect(()=>{
    const saved=localStorage.getItem('taxi-payment-method')
    if(saved==='natcash'||saved==='moncash')setMethod(saved)

    const onClick=(event:MouseEvent)=>{
      const el=(event.target as HTMLElement|null)?.closest<HTMLButtonElement>('.shell .nav-drawer .drawer-nav > button')
      if(!el)return
      const text=(el.textContent||'').toLowerCase()
      if(!text.includes('paiement')&&!text.includes('peman'))return
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation()
      setHt(localStorage.getItem('taxi-language')==='ht')
      let mount=el.nextElementSibling as HTMLElement|null
      if(!mount||!mount.classList.contains('drawer-payment-stable-target')){
        mount=document.createElement('div');mount.className='drawer-payment-stable-target';el.insertAdjacentElement('afterend',mount)
      }
      setTarget(mount);setOpen(v=>!v);setMessage('')
    }
    document.addEventListener('click',onClick,true)
    return()=>document.removeEventListener('click',onClick,true)
  },[])

  useEffect(()=>{
    if(!open||!target)return
    let active=true
    const load=async()=>{
      const {data:{user}}=await supabase.auth.getUser()
      if(!user||!active)return
      const meta=user.user_metadata||{}
      const {data:profile}=await supabase.from('profiles').select('moncash_name,moncash_phone,natcash_name,natcash_phone,preferred_payment_provider').eq('id',user.id).maybeSingle()
      if(!active)return
      const next={
        moncash:{name:String(profile?.moncash_name||meta.moncash_name||''),phone:String(profile?.moncash_phone||meta.moncash_phone||'')},
        natcash:{name:String(profile?.natcash_name||meta.natcash_name||''),phone:String(profile?.natcash_phone||meta.natcash_phone||'')},
      }
      const preferred:Method=profile?.preferred_payment_provider==='natcash'?'natcash':profile?.preferred_payment_provider==='moncash'?'moncash':method
      setMethod(preferred);localStorage.setItem('taxi-payment-method',preferred)
      setAccounts(next)
      setDrafts({
        moncash:{name:next.moncash.name||String(meta.full_name||''),phone:next.moncash.phone||String(meta.phone||'')},
        natcash:{name:next.natcash.name||String(meta.full_name||''),phone:next.natcash.phone||String(meta.phone||'')},
      })
      setEditing({moncash:!next.moncash.name||!next.moncash.phone,natcash:!next.natcash.name||!next.natcash.phone})
    }
    void load()
    return()=>{active=false}
  },[open,target])

  async function choose(next:Method){
    setMethod(next);localStorage.setItem('taxi-payment-method',next);localStorage.setItem('taxi-payment-provider',next)
    window.dispatchEvent(new CustomEvent('taxi-payment-method-change',{detail:next}))
    await supabase.rpc('set_preferred_payment_provider',{p_provider:next})
  }

  async function save(e:FormEvent,id:Method){
    e.preventDefault();setMessage('')
    const draft=drafts[id]
    if(!draft.name.trim()||!draft.phone.trim()){setMessage(ht?'Antre non ak nimewo telefòn lan.':'Entrez le nom et le numéro de téléphone.');return}
    setSaving(id)
    const payload=id==='moncash'?{moncash_name:draft.name.trim(),moncash_phone:draft.phone.trim()}:{natcash_name:draft.name.trim(),natcash_phone:draft.phone.trim()}
    const [{error:metaError},{error:profileError}]=await Promise.all([
      supabase.auth.updateUser({data:payload}),
      supabase.rpc('save_passenger_payment_account',{p_provider:id,p_account_name:draft.name.trim(),p_account_phone:draft.phone.trim()}),
    ])
    setSaving(null)
    if(metaError||profileError){setMessage(ht?'Nou pa ka anrejistre enfòmasyon yo.':'Impossible d’enregistrer les informations.');return}
    const account={name:draft.name.trim(),phone:draft.phone.trim()}
    setAccounts(current=>({...current,[id]:account}));setEditing(current=>({...current,[id]:false}));await choose(id)
    setMessage(ht?'Enfòmasyon yo anrejistre ✓':'Informations enregistrées ✓')
  }

  if(!target||!open||!document.contains(target))return null
  const options:{id:Method;icon:string;label:string}[]=[{id:'moncash',icon:'📱',label:'MonCash'},{id:'natcash',icon:'📲',label:'NatCash'}]

  return createPortal(<section className="pps-wrap">
    <style>{`
      .pps-wrap{margin:4px 0 10px;padding:11px;border:1px solid #dfe8e4;border-radius:17px;background:#f8faf9}
      .pps-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}.pps-head>span{font-size:20px}.pps-head strong{font-size:13px;color:#10243a}.pps-head small{display:block;margin-top:2px;font-size:9px;color:#7e8b86}.pps-head button{margin-left:auto;border:0;border-radius:10px;background:#edf5f2;color:#0f705a;padding:7px 9px;font-size:9px;font-weight:900}
      .pps-methods{display:grid;gap:8px}.pps-card{background:#fff;border:1px solid #e2e9e6;border-radius:14px;padding:10px}.pps-card.active{border-color:#98d7c4;box-shadow:0 0 0 1px #d9f0e8 inset}.pps-top{display:flex;align-items:center;gap:8px}.pps-icon{width:38px;height:38px;border-radius:11px;background:#edf8f4;display:grid;place-items:center;font-size:18px}.pps-copy{display:grid;gap:2px;flex:1}.pps-copy strong{font-size:11px;color:#10243a}.pps-copy small{font-size:8px;color:#7a8983}.pps-switch{position:relative;width:44px;height:25px;border:0;border-radius:999px;background:#c7d0cc;padding:0}.pps-switch i{position:absolute;width:19px;height:19px;left:3px;top:3px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.18);transition:.15s}.pps-switch.on{background:#0f8065}.pps-switch.on i{transform:translateX(19px)}
      .pps-form{display:grid;gap:8px;margin-top:10px;padding-top:9px;border-top:1px solid #eef2f0}.pps-form label{display:grid;gap:4px}.pps-form label span{font-size:8px;font-weight:850;color:#66766f}.pps-form input{width:100%;box-sizing:border-box;border:1px solid #dce5e1;border-radius:10px;background:#fff;padding:9px 10px;font-size:11px;color:#10243a}.pps-save,.pps-edit{border:0;border-radius:10px;background:#0f8065;color:#fff;padding:9px;font-size:9px;font-weight:900}.pps-saved{display:grid;gap:6px;margin-top:10px;padding-top:9px;border-top:1px solid #eef2f0}.pps-saved div{display:flex;justify-content:space-between;gap:8px}.pps-saved span{font-size:8px;color:#7b8984}.pps-saved strong{font-size:9px;color:#253a32;text-align:right}.pps-edit{background:#edf8f4;color:#0f705a}.pps-message{margin-top:8px;padding:8px;border-radius:9px;background:#edf8f4;color:#0f705a;font-size:8px;font-weight:800}.pps-note{margin:9px 1px 0;color:#74837d;font-size:8px;line-height:1.4}
    `}</style>
    <div className="pps-head"><span>💳</span><div><strong>{ht?'Peman':'Paiement'}</strong><small>{ht?'Chwazi epi jere metòd peman ou':'Choisissez et gérez votre moyen de paiement'}</small></div><button onClick={()=>setOpen(false)}>{ht?'Fèmen':'Fermer'}</button></div>
    <div className="pps-methods">{options.map(option=>{const active=method===option.id;const account=accounts[option.id];const edit=editing[option.id];return <div className={`pps-card ${active?'active':''}`} key={option.id}>
      <div className="pps-top"><span className="pps-icon">{option.icon}</span><span className="pps-copy"><strong>{option.label}</strong><small>{active?(ht?'Metòd chwazi':'Mode sélectionné'):(ht?'Peze switch la pou chwazi':'Activez pour sélectionner')}</small></span><button className={`pps-switch ${active?'on':''}`} onClick={()=>void choose(option.id)} aria-label={option.label}><i/></button></div>
      {edit?<form className="pps-form" onSubmit={e=>void save(e,option.id)}><label><span>{ht?'Non sou kont lan':'Nom sur le compte'}</span><input value={drafts[option.id].name} onChange={e=>setDrafts(c=>({...c,[option.id]:{...c[option.id],name:e.target.value}}))}/></label><label><span>{ht?'Telefòn kont lan':'Téléphone du compte'}</span><input type="tel" inputMode="tel" value={drafts[option.id].phone} onChange={e=>setDrafts(c=>({...c,[option.id]:{...c[option.id],phone:e.target.value}}))} placeholder="+509 ..."/></label><button className="pps-save" disabled={saving===option.id}>{saving===option.id?(ht?'N ap sove…':'Enregistrement…'):(ht?'Anrejistre':'Enregistrer')}</button></form>:<div className="pps-saved"><div><span>{ht?'Non':'Nom'}</span><strong>{account.name||'—'}</strong></div><div><span>{ht?'Telefòn':'Téléphone'}</span><strong>{account.phone||'—'}</strong></div><button className="pps-edit" onClick={()=>{setDrafts(c=>({...c,[option.id]:account}));setEditing(c=>({...c,[option.id]:true}))}}>{ht?'Modifye':'Modifier'}</button></div>}
    </div>})}</div>
    {message&&<div className="pps-message">{message}</div>}
    <p className="pps-note">{ht?'Peman trajè a ap pase nan app la. 85% pou chofè a, 15% pou platfòm nan.':'Le paiement du trajet passe par l’app : 85 % au chauffeur et 15 % à la plateforme.'}</p>
  </section>,target)
}
