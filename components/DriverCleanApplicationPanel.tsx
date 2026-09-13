'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

type DriverStatus = '' | 'pending' | 'approved' | 'suspended' | 'rejected' | 'cancelled'

export default function DriverCleanApplicationPanel(){
  const [target,setTarget]=useState<HTMLElement|null>(null)
  const [status,setStatus]=useState<DriverStatus>('')
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const ht=typeof window!=='undefined' && localStorage.getItem('taxi-language')==='ht'

  useEffect(()=>{
    if(!window.location.pathname.startsWith('/driver/dashboard-v2')) return

    const locate=()=>{
      const rows=Array.from(document.querySelectorAll<HTMLButtonElement>('.dcm-row'))
      const row=rows.find(el=>{
        const t=(el.textContent||'').toLowerCase()
        return t.includes('demande devenir chauffeur')||t.includes('demand devni chofè')
      })
      const panel=row?.nextElementSibling as HTMLElement|null
      if(panel?.classList.contains('dcm-panel')){
        const old=panel.querySelector<HTMLElement>(':scope > .dcm-note')
        if(old) old.style.display='none'
        setTarget(current=>current===panel?current:panel)
      } else {
        setTarget(current=>current && document.body.contains(current) ? current : null)
      }
    }

    locate()
    const timer=window.setInterval(locate,200)
    return()=>window.clearInterval(timer)
  },[])

  useEffect(()=>{
    if(!target) return
    void loadStatus()
  },[target])

  async function loadStatus(){
    const {data:auth}=await supabase.auth.getUser()
    if(!auth.user) return
    const {data}=await supabase.from('driver_profiles').select('status').eq('user_id',auth.user.id).maybeSingle()
    setStatus((data?.status||'') as DriverStatus)
  }

  async function submit(){
    if(busy) return
    setBusy(true);setMessage('')
    const {data:auth}=await supabase.auth.getUser(); const user=auth.user
    if(!user){setMessage(ht?'Ou dwe konekte anvan.':'Vous devez être connecté.');setBusy(false);return}

    const metadata=user.user_metadata||{}
    const [{data:person},{data:driver},{data:vehicle}]=await Promise.all([
      supabase.from('profiles').select('full_name,phone').eq('id',user.id).maybeSingle(),
      supabase.from('driver_profiles').select('status,license_number,national_id_number').eq('user_id',user.id).maybeSingle(),
      supabase.from('vehicles').select('vehicle_type,make,model,color,year,plate_number,seats').eq('driver_id',user.id).order('created_at',{ascending:true}).limit(1).maybeSingle(),
    ])

    const fullName=String(person?.full_name||metadata.full_name||'').trim()
    const birthDate=String(metadata.birth_date||metadata.date_of_birth||'').trim()
    const gender=String(metadata.gender||metadata.sex||'').trim()
    const address=String(metadata.address||metadata.driver_address||'').trim()
    const maritalStatus=String(metadata.marital_status||'').trim()
    const phone=String(person?.phone||metadata.phone||'').trim()
    const license=String(driver?.license_number||'').trim()
    const nationalId=String(driver?.national_id_number||'').trim()
    const vehicleType=String(vehicle?.vehicle_type||'').trim()
    const make=String(vehicle?.make||'').trim()
    const model=String(vehicle?.model||'').trim()
    const color=String(vehicle?.color||'').trim()
    const year=vehicle?.year?Number(vehicle.year):0
    const plate=String(vehicle?.plate_number||'').trim()
    const seats=vehicle?.seats?Number(vehicle.seats):0

    if(!fullName||!birthDate||!gender||!address||!phone||!license||!nationalId||!vehicleType||!make||!model||!color||!year||!plate||!seats){
      setMessage(ht?'Tanpri ranpli tout chan obligatwa nan Pwofil ak tout chan Veyikil yo. Eta sivil ak imèl opsyonèl.':'Veuillez compléter tous les champs obligatoires du Profil et tous les champs du Véhicule. L’état civil et l’e-mail sont facultatifs.')
      setBusy(false);return
    }

    const normalizedType=vehicleType==='moto'?'moto':'car'
    const {error}=await supabase.rpc('submit_driver_application_with_profile',{
      p_full_name:fullName,p_birth_date:birthDate,p_gender:gender,p_address:address,p_marital_status:maritalStatus,p_phone:phone,p_email:user.email||'',p_license_number:license,p_national_id_number:nationalId,p_vehicle_type:normalizedType,p_vehicle_make:make,p_vehicle_model:model,p_vehicle_color:color,p_vehicle_year:year,p_plate_number:plate,p_seats:seats,
    })
    if(error){setMessage(error.message);setBusy(false);return}
    setStatus('pending')
    setMessage(ht?'Demand lan voye avèk siksè. Li an attente verifikasyon.':'Demande envoyée avec succès. Elle est en attente de vérification.')
    setBusy(false)
  }

  if(!target) return null
  const locked=status==='pending'||status==='approved'||status==='suspended'
  const intro=status==='approved'
    ? (ht?'Kont chofè sa a deja apwouve.':'Ce compte chauffeur est déjà approuvé.')
    : status==='pending'
      ? (ht?'Demand ou an attente verifikasyon administrasyon an.':'Votre demande est en attente de vérification par l’administration.')
      : status==='suspended'
        ? (ht?'Kont chofè a sispann. Kontakte sipò si sa nesesè.':'Le compte chauffeur est suspendu. Contactez le support si nécessaire.')
        : (ht?'Ranpli Pwofil ak Veyikil, epi voye demand ou pou vin chofè.':'Complétez Profil et Véhicule, puis envoyez votre demande pour devenir chauffeur.')
  const label=status==='pending'?(ht?'Demand lan an attente':'Demande en attente')
    :status==='approved'?(ht?'Chofè apwouve':'Chauffeur approuvé')
    :status==='suspended'?(ht?'Kont chofè sispann':'Compte chauffeur suspendu')
    :busy?(ht?'N ap voye…':'Envoi…'):(ht?'Voye demand lan':'Envoyer la demande')

  return createPortal(<div data-clean-driver-application-react="true">
    <div className="dcm-note" style={{display:'block'}}>{intro}</div>
    <button type="button" className="dcm-primary" disabled={busy||locked} onClick={()=>void submit()} style={locked?{opacity:.65,cursor:'default'}:undefined}>{label}</button>
    {message&&<div className="dcm-status" style={{marginTop:8,lineHeight:1.4}}>{message}</div>}
  </div>,target)
}
