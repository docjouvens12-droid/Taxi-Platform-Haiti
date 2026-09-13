'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

type Lang = 'fr' | 'ht'
type SectionKey = 'profile' | 'application' | 'vehicle' | 'payments' | 'history' | 'earnings' | 'help'
type RideRow = { id:string; pickup_address:string|null; destination_address:string|null; final_fare_htg:number|null; completed_at:string|null }
type PaymentRow = { ride_id:string; amount_htg:number|string; platform_fee_htg:number|string|null; driver_net_htg:number|string|null }

export default function DriverFinalMenuStable(){
  const [target,setTarget]=useState<HTMLElement|null>(null)
  const [lang,setLang]=useState<Lang>('fr')
  const [openSection,setOpenSection]=useState<SectionKey|null>(null)
  const [userId,setUserId]=useState('')
  const [email,setEmail]=useState('')
  const [profileEditing,setProfileEditing]=useState(false)
  const [vehicleEditing,setVehicleEditing]=useState(false)
  const [status,setStatus]=useState('')
  const [profile,setProfile]=useState({fullName:'',birthDate:'',sex:'',maritalStatus:'',address:'',license:'',nationalId:'',phone:''})
  const [vehicleId,setVehicleId]=useState('')
  const [vehicle,setVehicle]=useState({type:'standard',make:'',model:'',color:'',year:'',plate:'',seats:''})
  const [payout,setPayout]=useState({selected:'' as ''|'moncash'|'natcash',moncashName:'',moncashPhone:'',natcashName:'',natcashPhone:''})
  const [rides,setRides]=useState<RideRow[]>([])
  const [payments,setPayments]=useState<PaymentRow[]>([])

  useEffect(()=>{
    if(location.pathname!=='/driver/dashboard') return
    setLang(localStorage.getItem('taxi-language')==='ht'?'ht':'fr')
    const install=()=>{
      const drawer=document.querySelector<HTMLElement>('.drawer')
      if(!drawer){setTarget(null);return}
      drawer.querySelectorAll<HTMLElement>('.menuSection,.driver-payment-menu-section,[data-driver-history="true"],[data-driver-earnings="true"],[data-driver-help="true"],.driver-final-menu-root').forEach(el=>el.style.display='none')
      let mount=drawer.querySelector<HTMLElement>('.driver-final-menu-stable-root')
      if(!mount){
        mount=document.createElement('div'); mount.className='driver-final-menu-stable-root driver-final-menu-root'
        const logout=drawer.querySelector('.logout,.drawerLogout')
        if(logout) drawer.insertBefore(mount,logout); else drawer.appendChild(mount)
      }
      mount.style.display='block'; mount.style.position='relative'; mount.style.zIndex='50'; mount.style.pointerEvents='auto'
      setTarget(mount)
    }
    install()
    const observer=new MutationObserver(install); observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])

  useEffect(()=>{ if(target) void loadAll() },[target])

  async function loadAll(){
    const {data:s}=await supabase.auth.getSession(); const user=s.session?.user; if(!user)return
    setUserId(user.id); setEmail(user.email||'')
    const [{data:p},{data:d},{data:v},{data:r}]=await Promise.all([
      supabase.from('profiles').select('full_name,phone').eq('id',user.id).maybeSingle(),
      supabase.from('driver_profiles').select('license_number,national_id_number,moncash_name,moncash_phone,natcash_name,natcash_phone,preferred_payout_provider').eq('user_id',user.id).maybeSingle(),
      supabase.from('vehicles').select('id,vehicle_type,make,model,color,year,plate_number,seats').eq('driver_id',user.id).order('created_at',{ascending:true}).limit(1).maybeSingle(),
      supabase.from('rides').select('id,pickup_address,destination_address,final_fare_htg,completed_at').eq('driver_id',user.id).eq('status','completed').order('completed_at',{ascending:false}).limit(10)
    ])
    const m=user.user_metadata||{}
    setProfile({fullName:p?.full_name||m.full_name||'',birthDate:m.birth_date||m.date_of_birth||'',sex:m.gender||m.sex||'',maritalStatus:m.marital_status||'',address:m.address||m.driver_address||'',license:d?.license_number||'',nationalId:d?.national_id_number||'',phone:p?.phone||m.phone||''})
    if(v){setVehicleId(v.id);setVehicle({type:v.vehicle_type||'standard',make:v.make||'',model:v.model||'',color:v.color||'',year:v.year?String(v.year):'',plate:v.plate_number||'',seats:v.seats?String(v.seats):''})}
    const selected=d?.preferred_payout_provider==='moncash'||d?.preferred_payout_provider==='natcash'?d.preferred_payout_provider:''
    setPayout({selected,moncashName:d?.moncash_name||'',moncashPhone:d?.moncash_phone||'',natcashName:d?.natcash_name||'',natcashPhone:d?.natcash_phone||''})
    const rr=(r||[]) as RideRow[]; setRides(rr)
    if(rr.length){const {data:pay}=await supabase.from('payments').select('ride_id,amount_htg,platform_fee_htg,driver_net_htg').in('ride_id',rr.map(x=>x.id));setPayments((pay||[]) as PaymentRow[])}else setPayments([])
  }

  const earnings=useMemo(()=>{const map=new Map(payments.map(p=>[p.ride_id,p]));return rides.reduce((a,r)=>{const p=map.get(r.id);a.gross+=Number(p?.amount_htg||r.final_fare_htg||0);a.fee+=Number(p?.platform_fee_htg||0);a.net+=Number(p?.driver_net_htg||0);return a},{gross:0,fee:0,net:0})},[rides,payments])
  const ht=lang==='ht'
  const row=(l:string,v:string)=><p className="dfm-row"><span>{l}</span><b>{v||'—'}</b></p>

  async function saveProfile(){
    if(!userId)return
    if(!profile.fullName.trim()||!profile.birthDate||!profile.sex||!profile.address.trim()||!profile.license.trim()||!profile.nationalId.trim()||!profile.phone.trim()){
      setStatus(ht?'Tout chan Pwofil yo obligatwa sof Eta sivil ak Imèl la.':'Tous les champs du Profil sont obligatoires sauf l’état civil et l’e-mail.');return
    }
    const [{error:a},{error:b},{error:c}]=await Promise.all([
      supabase.from('profiles').upsert({id:userId,full_name:profile.fullName.trim(),phone:profile.phone.trim()},{onConflict:'id'}),
      supabase.from('driver_profiles').update({license_number:profile.license.trim(),national_id_number:profile.nationalId.trim()}).eq('user_id',userId),
      supabase.auth.updateUser({data:{full_name:profile.fullName.trim(),birth_date:profile.birthDate,gender:profile.sex,marital_status:profile.maritalStatus||null,address:profile.address.trim(),driver_address:profile.address.trim(),phone:profile.phone.trim()}})
    ])
    if(a||b||c){setStatus(ht?'Gen yon erè pandan anrejistreman an.':'Erreur pendant l’enregistrement.');return}
    setStatus(ht?'✓ Anrejistre':'✓ Enregistré');setProfileEditing(false)
  }

  async function saveVehicle(){
    if(!vehicleId){setStatus(ht?'Ou dwe gen yon veyikil anrejistre.':'Vous devez avoir un véhicule enregistré.');return}
    if(!vehicle.type||!vehicle.make.trim()||!vehicle.model.trim()||!vehicle.color.trim()||!vehicle.year||!vehicle.plate.trim()||!vehicle.seats){setStatus(ht?'Tout chan Veyikil yo obligatwa.':'Tous les champs du Véhicule sont obligatoires.');return}
    const {error}=await supabase.from('vehicles').update({vehicle_type:vehicle.type,make:vehicle.make.trim(),model:vehicle.model.trim(),color:vehicle.color.trim(),year:Number(vehicle.year),plate_number:vehicle.plate.trim(),seats:Number(vehicle.seats)}).eq('id',vehicleId)
    if(error){setStatus(error.message);return} setStatus(ht?'✓ Anrejistre':'✓ Enregistré');setVehicleEditing(false)
  }

  async function savePayout(provider:'moncash'|'natcash'){
    if(!userId)return
    const name=provider==='moncash'?payout.moncashName.trim():payout.natcashName.trim(); const phone=provider==='moncash'?payout.moncashPhone.trim():payout.natcashPhone.trim()
    if(!name||!phone){setStatus(ht?'Antre non ak telefòn lan.':'Entrez le nom et le téléphone.');return}
    const update=provider==='moncash'?{moncash_enabled:true,natcash_enabled:false,preferred_payout_provider:'moncash',moncash_name:name,moncash_phone:phone}:{moncash_enabled:false,natcash_enabled:true,preferred_payout_provider:'natcash',natcash_name:name,natcash_phone:phone}
    const {error}=await supabase.from('driver_profiles').update(update).eq('user_id',userId); if(error){setStatus(error.message);return}
    setPayout(x=>({...x,selected:provider}));setStatus(ht?'✓ Metòd la anrejistre':'✓ Mode enregistré')
  }

  function changeLanguage(next:Lang){localStorage.setItem('taxi-language',next);setLang(next);const drawer=document.querySelector<HTMLElement>('.drawer');const buttons=Array.from(drawer?.querySelectorAll<HTMLButtonElement>('.langBtns button,.langButtons button')||[]);buttons.find(b=>next==='ht'?(b.textContent||'').toLowerCase().includes('krey'):(b.textContent||'').toLowerCase().includes('fran'))?.click()}
  if(!target)return null

  const Section=({id,label,plus=false,children}:{id:SectionKey;label:string;plus?:boolean;children:React.ReactNode})=>{const open=openSection===id;return <div className="dfm-section"><button type="button" className="dfm-trigger" onClick={()=>setOpenSection(open?null:id)} aria-expanded={open}><span>{label}</span><b>{open?'−':plus?'+':'›'}</b></button>{open&&<div className="dfm-body">{children}</div>}</div>}

  return createPortal(<div className="dfm-wrap" onClick={e=>e.stopPropagation()}>
    <style>{`.dfm-wrap{font-family:Inter,system-ui,sans-serif;color:#102033;position:relative;z-index:60;pointer-events:auto}.dfm-section{border-bottom:1px solid #e5eaee}.dfm-trigger{appearance:none;-webkit-appearance:none;border:0;background:transparent;width:100%;display:flex;align-items:center;justify-content:space-between;padding:16px 0;color:#0f6f59;font-size:15px;font-weight:850;cursor:pointer;touch-action:manipulation;user-select:none;text-align:left}.dfm-trigger b{font-size:23px;line-height:1}.dfm-body{display:block;padding:0 0 14px}.dfm-row{display:flex;justify-content:space-between;gap:12px;margin:8px 0;font-size:12px}.dfm-row span{color:#778697}.dfm-row b{text-align:right;color:#173246}.dfm-field{display:grid;gap:4px;margin:9px 0;font-size:11px;font-weight:750;color:#657483}.dfm-field input,.dfm-field select{width:100%;box-sizing:border-box;border:1px solid #d9e1e7;border-radius:10px;padding:9px 10px;font-size:13px;background:#fff;color:#102033}.dfm-primary{width:100%;border:0;border-radius:10px;background:#0f6f59;color:#fff;padding:10px 12px;font-weight:850;font-size:12px;margin-top:8px}.dfm-note{margin:2px 0 0;padding:12px 13px;border-radius:12px;background:#f2f7f5;color:#31594f;font-size:12px;font-weight:750;line-height:1.45}.dfm-method{border:1px solid #e0e7eb;border-radius:13px;padding:11px;margin:8px 0;background:#f8fafb}.dfm-method.active{border-color:#9fd1c1;background:#f2faf7}.dfm-method-head{display:flex;justify-content:space-between;align-items:center;font-weight:850}.dfm-switch{width:44px;height:25px;border:0;border-radius:999px;background:#c2cbd1;padding:3px}.dfm-switch i{display:block;width:19px;height:19px;border-radius:50%;background:#fff}.dfm-method.active .dfm-switch{background:#0f6f59}.dfm-method.active .dfm-switch i{margin-left:19px}.dfm-trip{border:1px solid #e4eaee;border-radius:12px;padding:9px;margin:8px 0;background:#f8fafb;font-size:11px}.dfm-trip strong{display:block;color:#0f6f59;margin-bottom:5px}.dfm-lang{border-bottom:1px solid #e5eaee;padding:15px 0}.dfm-lang>strong{display:block;color:#0f6f59;font-size:15px;margin-bottom:10px}.dfm-lang-switch{width:156px;border:1px solid #d7e1e8;border-radius:999px;background:#eef3f5;padding:3px;display:grid;grid-template-columns:1fr 1fr}.dfm-lang-switch button{border:0;border-radius:999px;padding:8px 10px;background:transparent;font-size:11px;font-weight:850;color:#657483}.dfm-lang-switch button.active{background:#0f6f59;color:#fff}.dfm-help-card{padding:8px 0;border-bottom:1px solid #edf1f3}.dfm-help-card strong{display:block;font-size:11px;color:#173246;margin-bottom:3px}.dfm-help-card p{margin:0;font-size:10px;line-height:1.4;color:#71808f}.dfm-status{min-height:14px;font-size:10px;font-weight:800;color:#0f6f59;margin-top:6px}`}</style>

    <Section id="profile" label={ht?'Pwofil':'Profil'}>{profileEditing?<>
      <label className="dfm-field">{ht?'Non':'Nom'}<input required value={profile.fullName} onChange={e=>setProfile({...profile,fullName:e.target.value})}/></label>
      <label className="dfm-field">{ht?'Dat nesans':'Date de naissance'}<input required type="date" value={profile.birthDate} onChange={e=>setProfile({...profile,birthDate:e.target.value})}/></label>
      <label className="dfm-field">{ht?'Sèks':'Sexe'}<select required value={profile.sex} onChange={e=>setProfile({...profile,sex:e.target.value})}><option value="">—</option><option value="male">{ht?'Gason':'Homme'}</option><option value="female">{ht?'Fi':'Femme'}</option></select></label>
      <label className="dfm-field">{ht?'Eta sivil (opsyonèl)':'État civil (facultatif)'}<select value={profile.maritalStatus} onChange={e=>setProfile({...profile,maritalStatus:e.target.value})}><option value="">—</option><option value="single">{ht?'Selibatè':'Célibataire'}</option><option value="married">{ht?'Marye':'Marié(e)'}</option><option value="divorced">{ht?'Divòse':'Divorcé(e)'}</option><option value="widowed">{ht?'Vèf/Vèv':'Veuf/Veuve'}</option></select></label>
      <label className="dfm-field">{ht?'Adrès':'Adresse'}<input required value={profile.address} onChange={e=>setProfile({...profile,address:e.target.value})}/></label>
      <label className="dfm-field">{ht?'Nimewo lisans':'N° de permis'}<input required value={profile.license} onChange={e=>setProfile({...profile,license:e.target.value})}/></label>
      <label className="dfm-field">{ht?'Nimewo idantifikasyon':'N° d’identification'}<input required value={profile.nationalId} onChange={e=>setProfile({...profile,nationalId:e.target.value})}/></label>
      <label className="dfm-field">{ht?'Telefòn':'Téléphone'}<input required value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})}/></label>
      <label className="dfm-field">{ht?'Imèl (opsyonèl)':'E-mail (facultatif)'}<input value={email} disabled/></label><button className="dfm-primary" onClick={()=>void saveProfile()}>{ht?'Anrejistre':'Enregistrer'}</button>
    </>:<>{row(ht?'Non':'Nom',profile.fullName)}{row(ht?'Dat nesans':'Date de naissance',profile.birthDate)}{row(ht?'Sèks':'Sexe',profile.sex)}{row(ht?'Eta sivil (opsyonèl)':'État civil (facultatif)',profile.maritalStatus)}{row(ht?'Adrès':'Adresse',profile.address)}{row(ht?'Nimewo lisans':'N° de permis',profile.license)}{row(ht?'Nimewo idantifikasyon':'N° d’identification',profile.nationalId)}{row(ht?'Telefòn':'Téléphone',profile.phone)}{row(ht?'Imèl (opsyonèl)':'E-mail (facultatif)',email)}<button className="dfm-primary" onClick={()=>setProfileEditing(true)}>{ht?'Modifye':'Modifier'}</button></>}<div className="dfm-status">{status}</div></Section>

    <Section id="vehicle" label={ht?'Veyikil':'Véhicule'}>{vehicleEditing?<>
      <label className="dfm-field">{ht?'Kalite':'Type'}<select required value={vehicle.type} onChange={e=>setVehicle({...vehicle,type:e.target.value})}><option value="standard">Standard</option><option value="moto">Moto</option></select></label>
      <label className="dfm-field">{ht?'Mak':'Marque'}<input required value={vehicle.make} onChange={e=>setVehicle({...vehicle,make:e.target.value})}/></label><label className="dfm-field">{ht?'Modèl':'Modèle'}<input required value={vehicle.model} onChange={e=>setVehicle({...vehicle,model:e.target.value})}/></label><label className="dfm-field">{ht?'Koulè':'Couleur'}<input required value={vehicle.color} onChange={e=>setVehicle({...vehicle,color:e.target.value})}/></label><label className="dfm-field">{ht?'Ane':'Année'}<input required type="number" value={vehicle.year} onChange={e=>setVehicle({...vehicle,year:e.target.value})}/></label><label className="dfm-field">{ht?'Plak':'Plaque'}<input required value={vehicle.plate} onChange={e=>setVehicle({...vehicle,plate:e.target.value})}/></label><label className="dfm-field">{ht?'Kantite plas':'Nombre de places'}<input required type="number" value={vehicle.seats} onChange={e=>setVehicle({...vehicle,seats:e.target.value})}/></label><button className="dfm-primary" onClick={()=>void saveVehicle()}>{ht?'Anrejistre':'Enregistrer'}</button>
    </>:<>{row(ht?'Kalite':'Type',vehicle.type)}{row(ht?'Mak':'Marque',vehicle.make)}{row(ht?'Modèl':'Modèle',vehicle.model)}{row(ht?'Koulè':'Couleur',vehicle.color)}{row(ht?'Ane':'Année',vehicle.year)}{row(ht?'Plak':'Plaque',vehicle.plate)}{row(ht?'Plas':'Places',vehicle.seats)}<button className="dfm-primary" onClick={()=>setVehicleEditing(true)}>{ht?'Modifye':'Modifier'}</button></>}<div className="dfm-status">{status}</div></Section>

    <Section id="application" label={ht?'Demand devni chofè':'Demande devenir chauffeur'}><p className="dfm-note">{ht?'Tanpri ranpli tout chan obligatwa nan Pwofil la ak tout chan nan Veyikil la anvan ou voye demand lan. Eta sivil ak Imèl sèlman opsyonèl.':'Veuillez remplir tous les champs obligatoires du Profil et tous les champs du Véhicule avant d’envoyer la demande. Seuls l’état civil et l’e-mail sont facultatifs.'}</p></Section>

    <Section id="payments" label={ht?'Peman':'Paiements'}>{(['moncash','natcash'] as const).map(provider=>{const active=payout.selected===provider;const name=provider==='moncash'?payout.moncashName:payout.natcashName;const phone=provider==='moncash'?payout.moncashPhone:payout.natcashPhone;return <div key={provider} className={`dfm-method ${active?'active':''}`}><div className="dfm-method-head"><span>{provider==='moncash'?'MonCash':'NatCash'}</span><button className="dfm-switch" onClick={()=>setPayout(x=>({...x,selected:provider}))}><i/></button></div>{active&&<><label className="dfm-field">{ht?'Non':'Nom'}<input value={name} onChange={e=>setPayout(x=>provider==='moncash'?{...x,moncashName:e.target.value}:{...x,natcashName:e.target.value})}/></label><label className="dfm-field">{ht?'Telefòn kont lan':'Téléphone du compte'}<input value={phone} onChange={e=>setPayout(x=>provider==='moncash'?{...x,moncashPhone:e.target.value}:{...x,natcashPhone:e.target.value})}/></label><button className="dfm-primary" onClick={()=>void savePayout(provider)}>{ht?'Anrejistre':'Enregistrer'}</button></>}</div>})}<div className="dfm-status">{status}</div></Section>
    <Section id="history" label={ht?'Istorik trajè':'Historique des trajets'} plus>{rides.length===0?<p className="dfm-row">{ht?'Pa gen trajè fini pou kounye a.':'Aucun trajet terminé pour le moment.'}</p>:rides.map(r=><div className="dfm-trip" key={r.id}><strong>{r.completed_at?new Date(r.completed_at).toLocaleString(ht?'fr-HT':'fr-FR'):'—'}</strong><div>📍 {r.pickup_address||'—'}</div><div>🏁 {r.destination_address||'—'}</div><div>{Number(r.final_fare_htg||0).toLocaleString('fr-HT')} HTG</div></div>)}</Section>
    <Section id="earnings" label={ht?'Revni':'Revenus'} plus>{row('Brut',`${earnings.gross.toLocaleString('fr-HT')} HTG`)}{row(ht?'Komisyon platfòm':'Commission plateforme',`${earnings.fee.toLocaleString('fr-HT')} HTG`)}{row(ht?'Net chofè':'Net chauffeur',`${earnings.net.toLocaleString('fr-HT')} HTG`)}{row(ht?'Trajè fini':'Trajets terminés',String(rides.length))}</Section>
    <div className="dfm-lang"><strong>{ht?'Lang':'Langue'}</strong><div className="dfm-lang-switch"><button className={lang==='fr'?'active':''} onClick={()=>changeLanguage('fr')}>Français</button><button className={lang==='ht'?'active':''} onClick={()=>changeLanguage('ht')}>Kreyòl</button></div></div>
    <Section id="help" label={ht?'Èd':'Aide'} plus>{(ht?[["Trajè ak demann","Rete sou liy pou resevwa demann epi verifye pwen depa ak destinasyon an."],["Peman","Chwazi yon sèl metòd payout: MonCash oswa NatCash."],["Kont ak veyikil","Ou ka anrejistre epi modifye enfòmasyon Profil ak Veyikil ou."],["Sekirite","Pa kòmanse yon trajè si enfòmasyon yo pa koresponn oswa sitiyasyon an pa sanble an sekirite."]]:[["Trajets et demandes","Restez en ligne pour recevoir les demandes et vérifiez le départ et la destination."],["Paiements","Choisissez un seul mode de versement : MonCash ou NatCash."],["Compte et véhicule","Vous pouvez enregistrer et modifier votre Profil et votre Véhicule."],["Sécurité","Ne commencez pas un trajet si les informations ne correspondent pas ou si la situation semble dangereuse."]]).map(([h,p])=><div className="dfm-help-card" key={h}><strong>{h}</strong><p>{p}</p></div>)}</Section>
  </div>,target)
}
