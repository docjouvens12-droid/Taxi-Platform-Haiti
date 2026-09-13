'use client'

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type Props={user:User;lang:'fr'|'ht';onUserChange:(user:User)=>void}

function resizeImage(file:File):Promise<string>{
  return new Promise((resolve,reject)=>{
    const reader=new FileReader()
    reader.onload=()=>{
      const img=new Image()
      img.onload=()=>{
        const size=220
        const canvas=document.createElement('canvas')
        canvas.width=size;canvas.height=size
        const ctx=canvas.getContext('2d')
        if(!ctx)return reject(new Error('canvas'))
        const scale=Math.max(size/img.width,size/img.height)
        const w=img.width*scale,h=img.height*scale
        ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h)
        resolve(canvas.toDataURL('image/jpeg',.78))
      }
      img.onerror=reject
      img.src=String(reader.result)
    }
    reader.onerror=reject
    reader.readAsDataURL(file)
  })
}

export default function PassengerProfilePanel({user,lang,onUserChange}:Props){
  const ht=lang==='ht'
  const meta=user.user_metadata||{}
  const inputRef=useRef<HTMLInputElement|null>(null)
  const [editing,setEditing]=useState(false)
  const [name,setName]=useState(String(meta.full_name||''))
  const [birthDate,setBirthDate]=useState(String(meta.birth_date||''))
  const [gender,setGender]=useState(String(meta.gender||''))
  const [phone,setPhone]=useState(String(meta.phone||''))
  const [avatar,setAvatar]=useState(String(meta.avatar_data_url||''))
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  useEffect(()=>{
    const m=user.user_metadata||{}
    setName(String(m.full_name||''));setBirthDate(String(m.birth_date||''));setGender(String(m.gender||''));setPhone(String(m.phone||''));setAvatar(String(m.avatar_data_url||''))
  },[user])

  async function save(e:FormEvent){
    e.preventDefault();setBusy(true);setMessage('')
    const {data,error}=await supabase.auth.updateUser({data:{full_name:name.trim(),birth_date:birthDate,gender,phone:phone.trim(),avatar_data_url:avatar}})
    setBusy(false)
    if(error){setMessage(error.message);return}
    if(data.user)onUserChange(data.user)
    setEditing(false);setMessage(ht?'Pwofil anrejistre ✓':'Profil enregistré ✓')
  }

  async function pickPhoto(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]
    if(!file||!file.type.startsWith('image/'))return
    const dataUrl=await resizeImage(file)
    setAvatar(dataUrl)
    const {data,error}=await supabase.auth.updateUser({data:{avatar_data_url:dataUrl}})
    if(data.user)onUserChange(data.user)
    if(error)setMessage(error.message)
    e.target.value=''
  }

  const genderText=gender==='homme'?(ht?'Gason':'Homme'):gender==='femme'?(ht?'Fi':'Femme'):gender==='autre'?(ht?'Lòt / Pa presize':'Autre / Non précisé'):'—'
  const birthText=birthDate?new Date(`${birthDate}T00:00:00`).toLocaleDateString(ht?'fr-HT':'fr-FR'):'—'
  const initial=(name?.[0]||user.email?.[0]||'U').toUpperCase()

  return <div className="profile-full-v2">
    <input ref={inputRef} type="file" accept="image/*" onChange={pickPhoto} hidden/>
    <div className="profile-photo-wrap">
      <button type="button" className="profile-photo-button" onClick={()=>inputRef.current?.click()} aria-label={ht?'Chanje foto pwofil':'Changer la photo de profil'}>
        {avatar?<img src={avatar} alt={ht?'Foto pwofil':'Photo de profil'}/>:<span>{initial}</span>}
        <b>📷</b>
      </button>
      <small>{ht?'Peze pou ajoute oswa chanje foto':'Touchez pour ajouter ou changer la photo'}</small>
    </div>

    <div className="profile-status-row"><div><strong>{ht?'Pwofil pasaje':'Profil passager'}</strong><small>{ht?'Enfòmasyon kont ou':'Informations de votre compte'}</small></div><span>{ht?'Aktif':'Actif'}</span></div>

    {editing?<form className="profile-edit-form" onSubmit={save}>
      <h3>{ht?'Enfòmasyon pèsonèl':'Informations personnelles'}</h3>
      <label>{ht?'Non konplè':'Nom complet'}<input value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></label>
      <label>{ht?'Dat nesans':'Date de naissance'}<input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)}/></label>
      <label>{ht?'Sèks':'Sexe'}<select value={gender} onChange={e=>setGender(e.target.value)}><option value="">{ht?'Chwazi':'Sélectionner'}</option><option value="homme">{ht?'Gason':'Homme'}</option><option value="femme">{ht?'Fi':'Femme'}</option><option value="autre">{ht?'Lòt / Pa presize':'Autre / Non précisé'}</option></select></label>
      <h3>{ht?'Kontak':'Contact'}</h3>
      <label>{ht?'Telefòn':'Téléphone'}<input type="tel" inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+509 ..."/></label>
      <label>{ht?'Imèl':'E-mail'}<input value={user.email||''} readOnly/></label>
      {message&&<div className="profile-message">{message}</div>}
      <div className="profile-actions"><button type="button" onClick={()=>{setEditing(false);setMessage('')}}>{ht?'Anile':'Annuler'}</button><button type="submit" disabled={busy}>{busy?(ht?'Ap anrejistre…':'Enregistrement…'):(ht?'Anrejistre':'Enregistrer')}</button></div>
    </form>:<div className="profile-info-list">
      {message&&<div className="profile-message success">{message}</div>}
      <h3>{ht?'Enfòmasyon pèsonèl':'Informations personnelles'}</h3>
      <div><span>{ht?'Non':'Nom'}</span><strong>{name||'—'}</strong></div>
      <div><span>{ht?'Dat nesans':'Date de naissance'}</span><strong>{birthText}</strong></div>
      <div><span>{ht?'Sèks':'Sexe'}</span><strong>{genderText}</strong></div>
      <h3>{ht?'Kontak':'Contact'}</h3>
      <div><span>{ht?'Telefòn':'Téléphone'}</span><strong>{phone||'—'}</strong></div>
      <div><span>{ht?'Imèl':'E-mail'}</span><strong>{user.email||'—'}</strong></div>
      <button className="profile-edit-button" type="button" onClick={()=>{setEditing(true);setMessage('')}}>{ht?'Modifye pwofil':'Modifier le profil'}</button>
    </div>}

    <style>{`
      .profile-full-v2{display:grid;gap:14px;padding-bottom:24px}.profile-photo-wrap{display:grid;justify-items:center;gap:8px;margin:2px 0 4px}.profile-photo-wrap small{color:#7c8a97;font-size:11px;font-weight:700}.profile-photo-button{position:relative;width:112px;height:112px;border-radius:34px;border:4px solid #fff;background:linear-gradient(145deg,#18a06f,#08794f);box-shadow:0 12px 28px rgba(15,112,90,.2);display:grid;place-items:center;color:#fff;font-size:40px;font-weight:950;padding:0}.profile-photo-button img{width:100%;height:100%;object-fit:cover;border-radius:29px}.profile-photo-button b{position:absolute;right:-4px;bottom:-4px;width:34px;height:34px;border-radius:12px;background:#fff;border:1px solid #dbe6e1;box-shadow:0 5px 14px rgba(16,32,51,.14);display:grid;place-items:center;font-size:15px}.profile-status-row{display:flex;justify-content:space-between;align-items:center;padding:14px 15px;border-radius:18px;background:#f4f8f6;border:1px solid #e2ebe7}.profile-status-row strong,.profile-status-row small{display:block}.profile-status-row strong{font-size:15px;color:#10243a}.profile-status-row small{font-size:10px;color:#82918b;margin-top:3px}.profile-status-row>span{padding:7px 10px;border-radius:999px;background:#e7f7ef;color:#0f8065;font-size:11px;font-weight:900}.profile-info-list,.profile-edit-form{display:grid;gap:9px;background:#fff;border:1px solid #e2e9e6;border-radius:20px;padding:15px;box-shadow:0 8px 22px rgba(16,32,51,.05)}.profile-info-list h3,.profile-edit-form h3{margin:4px 0 2px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#83918c}.profile-info-list>div:not(.profile-message){display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid #edf1ef}.profile-info-list>div:not(.profile-message):last-of-type{border-bottom:0}.profile-info-list span{color:#758680;font-size:12px}.profile-info-list strong{color:#10243a;font-size:13px;text-align:right}.profile-edit-form label{display:grid;gap:6px;color:#5c6f68;font-size:11px;font-weight:800}.profile-edit-form input,.profile-edit-form select{width:100%;border:1px solid #dbe6e1;border-radius:13px;padding:12px;background:#fbfdfc;color:#10243a;outline:none}.profile-edit-form input:focus,.profile-edit-form select:focus{border-color:#0f8065;box-shadow:0 0 0 3px rgba(15,128,101,.09)}.profile-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:4px}.profile-actions button,.profile-edit-button{border:0;border-radius:14px;padding:13px;font-weight:900}.profile-actions button:first-child{background:#eef3f1;color:#425750}.profile-actions button:last-child,.profile-edit-button{background:#0f8065;color:#fff}.profile-edit-button{width:100%;margin-top:5px}.profile-message{padding:10px;border-radius:12px;background:#fff1f1;color:#9d2d2d;font-size:11px;font-weight:800}.profile-message.success{background:#ecf8f2;color:#0f8065}
    `}</style>
  </div>
}
