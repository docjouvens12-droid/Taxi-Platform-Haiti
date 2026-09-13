'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

type Section = 'profile' | 'application' | 'vehicle' | 'payments' | 'history' | 'earnings' | 'language' | 'help'
type Lang = 'fr' | 'ht'
type MenuData = {
  email?: string
  profile?: { full_name?: string|null; phone?: string|null } | null
  driver?: { license_number?: string|null; national_id_number?: string|null; preferred_payout_provider?: string|null; moncash_name?: string|null; moncash_phone?: string|null; natcash_name?: string|null; natcash_phone?: string|null } | null
  vehicle?: { vehicle_type?: string|null; make?: string|null; model?: string|null; color?: string|null; year?: number|null; plate_number?: string|null; seats?: number|null } | null
  rides?: Array<{ id:string; pickup_address?:string|null; destination_address?:string|null; final_fare_htg?:number|null; completed_at?:string|null }>
  earnings?: { gross:number; fee:number; net:number }
}

type ProfileForm = { fullName:string; birthDate:string; sex:string; maritalStatus:string; address:string; license:string; nationalId:string; phone:string }
type VehicleForm = { type:string; make:string; model:string; color:string; year:string; plate:string; seats:string }
type PayoutForm = { selected:''|'moncash'|'natcash'; moncashName:string; moncashPhone:string; natcashName:string; natcashPhone:string }

function parseSession(raw: string | null) {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    const session = parsed?.currentSession ?? parsed?.session ?? parsed
    return session?.access_token ? session : null
  } catch { return null }
}

function getToken() {
  if (typeof window === 'undefined') return null
  const preferred = parseSession(localStorage.getItem('movi-session')) || parseSession(localStorage.getItem('taxi-auth-default'))
  if (preferred?.access_token) return preferred.access_token as string
  for (let i=0;i<localStorage.length;i+=1) {
    const key = localStorage.key(i)
    if (!key) continue
    const session = parseSession(localStorage.getItem(key))
    if (session?.access_token) return session.access_token as string
  }
  return null
}

export default function DriverCleanMenu() {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<Section | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [data, setData] = useState<MenuData | null>(null)
  const [lang, setLang] = useState<Lang>('fr')
  const [userId,setUserId] = useState('')
  const [vehicleId,setVehicleId] = useState('')
  const [profileEditing,setProfileEditing] = useState(false)
  const [vehicleEditing,setVehicleEditing] = useState(false)
  const [profile,setProfile] = useState<ProfileForm>({fullName:'',birthDate:'',sex:'',maritalStatus:'',address:'',license:'',nationalId:'',phone:''})
  const [vehicle,setVehicle] = useState<VehicleForm>({type:'standard',make:'',model:'',color:'',year:'',plate:'',seats:''})
  const [payout,setPayout] = useState<PayoutForm>({selected:'',moncashName:'',moncashPhone:'',natcashName:'',natcashPhone:''})
  const ht = lang === 'ht'

  useEffect(() => {
    if (!location.pathname.startsWith('/driver/dashboard-v2')) return
    setLang(localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr')
    const handler = (event: MouseEvent) => {
      const target = event.target as Element | null
      if (!target?.closest('.menu')) return
      event.preventDefault()
      event.stopPropagation()
      setOpen(true)
      setSection(null)
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [])

  useEffect(() => {
    if (!open || loading) return
    if (!data) void load()
  }, [open])

  async function load() {
    const token = getToken()
    if (!token) { setError(ht ? 'Sesyon an pa disponib.' : 'Session indisponible.'); return }
    setLoading(true); setError(''); setStatus('')
    try {
      const response = await fetch('/api/driver/menu', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || `Erreur ${response.status}`)
      setData(payload)

      const {data:s} = await supabase.auth.getSession()
      const user = s.session?.user
      if (user) {
        setUserId(user.id)
        const m = user.user_metadata || {}
        const fullName = payload?.profile?.full_name || m.full_name || ''
        setProfile({
          fullName,
          birthDate:m.birth_date || m.date_of_birth || '',
          sex:m.gender || m.sex || '',
          maritalStatus:m.marital_status || '',
          address:m.address || m.driver_address || '',
          license:payload?.driver?.license_number || '',
          nationalId:payload?.driver?.national_id_number || '',
          phone:payload?.profile?.phone || m.phone || ''
        })
        setPayout({
          selected:payload?.driver?.preferred_payout_provider === 'moncash' || payload?.driver?.preferred_payout_provider === 'natcash' ? payload.driver.preferred_payout_provider : '',
          moncashName:payload?.driver?.moncash_name || '',
          moncashPhone:payload?.driver?.moncash_phone || '',
          natcashName:payload?.driver?.natcash_name || '',
          natcashPhone:payload?.driver?.natcash_phone || ''
        })
        const {data:v} = await supabase.from('vehicles').select('id,vehicle_type,make,model,color,year,plate_number,seats').eq('driver_id',user.id).order('created_at',{ascending:true}).limit(1).maybeSingle()
        if (v) {
          setVehicleId(v.id)
          setVehicle({type:v.vehicle_type || 'standard',make:v.make || '',model:v.model || '',color:v.color || '',year:v.year ? String(v.year) : '',plate:v.plate_number || '',seats:v.seats ? String(v.seats) : ''})
        } else if (payload?.vehicle) {
          setVehicle({type:payload.vehicle.vehicle_type || 'standard',make:payload.vehicle.make || '',model:payload.vehicle.model || '',color:payload.vehicle.color || '',year:payload.vehicle.year ? String(payload.vehicle.year) : '',plate:payload.vehicle.plate_number || '',seats:payload.vehicle.seats ? String(payload.vehicle.seats) : ''})
        }
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur') }
    finally { setLoading(false) }
  }

  async function saveProfile() {
    if (!userId) return
    if (!profile.fullName.trim() || !profile.birthDate || !profile.sex || !profile.address.trim() || !profile.license.trim() || !profile.nationalId.trim() || !profile.phone.trim()) {
      setStatus(ht ? 'Tout chan Pwofil yo obligatwa sof Eta sivil ak Imèl.' : 'Tous les champs du Profil sont obligatoires sauf l’état civil et l’e-mail.'); return
    }
    const [{error:a},{error:b},{error:c}] = await Promise.all([
      supabase.from('profiles').upsert({id:userId,full_name:profile.fullName.trim(),phone:profile.phone.trim()},{onConflict:'id'}),
      supabase.from('driver_profiles').update({license_number:profile.license.trim(),national_id_number:profile.nationalId.trim()}).eq('user_id',userId),
      supabase.auth.updateUser({data:{full_name:profile.fullName.trim(),birth_date:profile.birthDate,gender:profile.sex,marital_status:profile.maritalStatus || null,address:profile.address.trim(),driver_address:profile.address.trim(),phone:profile.phone.trim()}})
    ])
    if (a || b || c) { setStatus(ht ? 'Gen yon erè pandan anrejistreman an.' : 'Erreur pendant l’enregistrement.'); return }
    setStatus(ht ? '✓ Anrejistre' : '✓ Enregistré')
    setProfileEditing(false)
    setData(x => x ? {...x,profile:{...(x.profile||{}),full_name:profile.fullName.trim(),phone:profile.phone.trim()},driver:{...(x.driver||{}),license_number:profile.license.trim(),national_id_number:profile.nationalId.trim()}} : x)
  }

  async function saveVehicle() {
    if (!vehicleId) { setStatus(ht ? 'Ou dwe gen yon veyikil anrejistre.' : 'Vous devez avoir un véhicule enregistré.'); return }
    if (!vehicle.type || !vehicle.make.trim() || !vehicle.model.trim() || !vehicle.color.trim() || !vehicle.year || !vehicle.plate.trim() || !vehicle.seats) {
      setStatus(ht ? 'Tout chan Veyikil yo obligatwa.' : 'Tous les champs du Véhicule sont obligatoires.'); return
    }
    const {error} = await supabase.from('vehicles').update({vehicle_type:vehicle.type,make:vehicle.make.trim(),model:vehicle.model.trim(),color:vehicle.color.trim(),year:Number(vehicle.year),plate_number:vehicle.plate.trim(),seats:Number(vehicle.seats)}).eq('id',vehicleId)
    if (error) { setStatus(error.message); return }
    setStatus(ht ? '✓ Anrejistre' : '✓ Enregistré')
    setVehicleEditing(false)
  }

  async function savePayout(provider:'moncash'|'natcash') {
    if (!userId) return
    const name = provider === 'moncash' ? payout.moncashName.trim() : payout.natcashName.trim()
    const phone = provider === 'moncash' ? payout.moncashPhone.trim() : payout.natcashPhone.trim()
    if (!name || !phone) { setStatus(ht ? 'Antre non ak telefòn lan.' : 'Entrez le nom et le téléphone.'); return }
    const update = provider === 'moncash'
      ? {moncash_enabled:true,natcash_enabled:false,preferred_payout_provider:'moncash',moncash_name:name,moncash_phone:phone}
      : {moncash_enabled:false,natcash_enabled:true,preferred_payout_provider:'natcash',natcash_name:name,natcash_phone:phone}
    const {error} = await supabase.from('driver_profiles').update(update).eq('user_id',userId)
    if (error) { setStatus(error.message); return }
    setPayout(x => ({...x,selected:provider}))
    setStatus(ht ? '✓ Metòd la anrejistre' : '✓ Mode enregistré')
  }

  const rides = data?.rides ?? []
  const earnings = data?.earnings ?? {gross:0,fee:0,net:0}
  const name = profile.fullName?.trim() || data?.profile?.full_name?.trim() || 'Chauffeur'
  const initial = name.slice(0,1).toUpperCase()
  const labels = useMemo(() => ht ? {
    profile:'Pwofil', application:'Demand devni chofè', vehicle:'Veyikil', payments:'Peman', history:'Istwa trajè', earnings:'Revni', language:'Lang', help:'Èd', logout:'Dekonekte'
  } : {
    profile:'Profil', application:'Demande devenir chauffeur', vehicle:'Véhicule', payments:'Paiements', history:'Historique', earnings:'Revenus', language:'Langue', help:'Aide', logout:'Se déconnecter'
  }, [ht])

  function chooseLanguage(next: Lang) {
    localStorage.setItem('taxi-language', next)
    setLang(next)
  }

  async function logout() {
    try { await supabase.auth.signOut() } catch {}
    try { localStorage.removeItem('movi-session'); localStorage.removeItem('taxi-auth-default') } catch {}
    window.location.replace('/movi-app-v2')
  }

  const field = (label:string,value:string,onChange:(v:string)=>void,type='text') => <label className="dcm-field"><span>{label}</span><input type={type} value={value} onChange={e=>onChange(e.target.value)}/></label>
  const info = (label:string,value:string) => <p><span>{label}</span><b>{value || '—'}</b></p>

  if (!open || typeof document === 'undefined') return null

  const Row = ({id,icon,label}:{id:Section;icon:string;label:string}) => (
    <button className="dcm-row" onClick={() => { setStatus(''); setSection(section === id ? null : id) }}>
      <span className="dcm-icon">{icon}</span><b>{label}</b><span className="dcm-arrow">{section === id ? '⌃' : '›'}</span>
    </button>
  )

  return createPortal(<div className="dcm-overlay" onClick={() => setOpen(false)}>
    <aside className="dcm-drawer" onClick={e => e.stopPropagation()}>
      <button className="dcm-close" onClick={() => setOpen(false)}>×</button>
      <div className="dcm-head">
        <div className="dcm-avatar">{initial}</div>
        <div><h2>{name}</h2><small>{data?.email || ''}</small></div>
      </div>
      {loading && <div className="dcm-note">{ht?'Chajman...':'Chargement...'}</div>}
      {error && <div className="dcm-error">{error}</div>}

      <div className="dcm-list">
        <Row id="profile" icon="👤" label={labels.profile}/>
        {section==='profile' && <div className="dcm-panel">
          {profileEditing ? <>
            {field(ht?'Non':'Nom',profile.fullName,v=>setProfile({...profile,fullName:v}))}
            {field(ht?'Dat nesans':'Date de naissance',profile.birthDate,v=>setProfile({...profile,birthDate:v}),'date')}
            <label className="dcm-field"><span>{ht?'Sèks':'Sexe'}</span><select value={profile.sex} onChange={e=>setProfile({...profile,sex:e.target.value})}><option value="">—</option><option value="male">{ht?'Gason':'Homme'}</option><option value="female">{ht?'Fi':'Femme'}</option></select></label>
            <label className="dcm-field"><span>{ht?'Eta sivil (opsyonèl)':'État civil (facultatif)'}</span><select value={profile.maritalStatus} onChange={e=>setProfile({...profile,maritalStatus:e.target.value})}><option value="">—</option><option value="single">{ht?'Selibatè':'Célibataire'}</option><option value="married">{ht?'Marye':'Marié(e)'}</option><option value="divorced">{ht?'Divòse':'Divorcé(e)'}</option><option value="widowed">{ht?'Vèf/Vèv':'Veuf/Veuve'}</option></select></label>
            {field(ht?'Adrès':'Adresse',profile.address,v=>setProfile({...profile,address:v}))}
            {field(ht?'Nimewo lisans':'N° de permis',profile.license,v=>setProfile({...profile,license:v}))}
            {field(ht?'Nimewo idantifikasyon':'N° d’identification',profile.nationalId,v=>setProfile({...profile,nationalId:v}))}
            {field(ht?'Telefòn':'Téléphone',profile.phone,v=>setProfile({...profile,phone:v}))}
            <button className="dcm-primary" onClick={()=>void saveProfile()}>{ht?'Anrejistre':'Enregistrer'}</button>
          </> : <>
            {info(ht?'Non':'Nom',name)}
            {info('E-mail',data?.email || '')}
            {info(ht?'Dat nesans':'Date de naissance',profile.birthDate)}
            {info(ht?'Sèks':'Sexe',profile.sex)}
            {info(ht?'Eta sivil':'État civil',profile.maritalStatus)}
            {info(ht?'Adrès':'Adresse',profile.address)}
            {info(ht?'Telefòn':'Téléphone',profile.phone)}
            {info(ht?'Lisans':'Permis',profile.license)}
            {info('ID',profile.nationalId)}
            <button className="dcm-primary" onClick={()=>setProfileEditing(true)}>{ht?'Modifye':'Modifier'}</button>
          </>}
          {status && <div className="dcm-status">{status}</div>}
        </div>}

        <Row id="application" icon="📄" label={labels.application}/>
        {section==='application' && <div className="dcm-panel"><div className="dcm-note">{ht?'Pwofil chofè ou deja lye ak kont sa a. Si administrasyon mande yon chanjman, mete Pwofil ak Veyikil ajou isit la.':'Votre profil chauffeur est déjà lié à ce compte. Si l’administration demande une modification, mettez à jour Profil et Véhicule ici.'}</div></div>}

        <Row id="vehicle" icon="🚙" label={labels.vehicle}/>
        {section==='vehicle' && <div className="dcm-panel">
          {vehicleEditing ? <>
            <label className="dcm-field"><span>{ht?'Kalite':'Type'}</span><select value={vehicle.type} onChange={e=>setVehicle({...vehicle,type:e.target.value})}><option value="standard">Standard</option><option value="moto">Moto</option></select></label>
            {field(ht?'Mak':'Marque',vehicle.make,v=>setVehicle({...vehicle,make:v}))}
            {field(ht?'Modèl':'Modèle',vehicle.model,v=>setVehicle({...vehicle,model:v}))}
            {field(ht?'Koulè':'Couleur',vehicle.color,v=>setVehicle({...vehicle,color:v}))}
            {field(ht?'Ane':'Année',vehicle.year,v=>setVehicle({...vehicle,year:v}),'number')}
            {field(ht?'Plak':'Plaque',vehicle.plate,v=>setVehicle({...vehicle,plate:v}))}
            {field(ht?'Kantite plas':'Nombre de places',vehicle.seats,v=>setVehicle({...vehicle,seats:v}),'number')}
            <button className="dcm-primary" onClick={()=>void saveVehicle()}>{ht?'Anrejistre':'Enregistrer'}</button>
          </> : <>
            {info(ht?'Kalite':'Type',vehicle.type)}{info(ht?'Mak':'Marque',vehicle.make)}{info(ht?'Modèl':'Modèle',vehicle.model)}{info(ht?'Koulè':'Couleur',vehicle.color)}{info(ht?'Ane':'Année',vehicle.year)}{info(ht?'Plak':'Plaque',vehicle.plate)}{info(ht?'Plas':'Places',vehicle.seats)}
            <button className="dcm-primary" onClick={()=>setVehicleEditing(true)}>{ht?'Modifye':'Modifier'}</button>
          </>}
          {status && <div className="dcm-status">{status}</div>}
        </div>}

        <Row id="payments" icon="💳" label={labels.payments}/>
        {section==='payments' && <div className="dcm-panel">
          {(['moncash','natcash'] as const).map(provider=>{const active=payout.selected===provider;const n=provider==='moncash'?payout.moncashName:payout.natcashName;const p=provider==='moncash'?payout.moncashPhone:payout.natcashPhone;return <div className={`dcm-method ${active?'active':''}`} key={provider}><div className="dcm-method-head"><b>{provider==='moncash'?'MonCash':'NatCash'}</b><button className="dcm-switch" onClick={()=>setPayout(x=>({...x,selected:provider}))}><i/></button></div>{active&&<>{field(ht?'Non':'Nom',n,v=>setPayout(x=>provider==='moncash'?{...x,moncashName:v}:{...x,natcashName:v}))}{field(ht?'Telefòn kont lan':'Téléphone du compte',p,v=>setPayout(x=>provider==='moncash'?{...x,moncashPhone:v}:{...x,natcashPhone:v}))}<button className="dcm-primary" onClick={()=>void savePayout(provider)}>{ht?'Anrejistre':'Enregistrer'}</button></>}</div>})}
          {status && <div className="dcm-status">{status}</div>}
        </div>}

        <Row id="history" icon="🧾" label={labels.history}/>
        {section==='history' && <div className="dcm-panel dcm-trips">
          {rides.length===0 ? <div className="dcm-note">{ht?'Pa gen trajè fini pou montre.':'Aucun trajet terminé à afficher.'}</div> : rides.map(r => <div className="dcm-trip" key={r.id}><b>{r.destination_address || 'Destination'}</b><span>{r.pickup_address || '—'}</span><small>{Number(r.final_fare_htg||0).toLocaleString()} HTG</small></div>)}
        </div>}

        <Row id="earnings" icon="💰" label={labels.earnings}/>
        {section==='earnings' && <div className="dcm-panel">{info(ht?'Brit':'Brut',`${earnings.gross.toLocaleString()} HTG`)}{info(ht?'Komisyon platfòm':'Commission plateforme',`${earnings.fee.toLocaleString()} HTG`)}{info(ht?'Net chofè':'Net chauffeur',`${earnings.net.toLocaleString()} HTG`)}{info(ht?'Trajè fini':'Trajets terminés',String(rides.length))}</div>}

        <Row id="language" icon="🌐" label={labels.language}/>
        {section==='language' && <div className="dcm-panel"><div className="dcm-lang"><button className={lang==='fr'?'active':''} onClick={()=>chooseLanguage('fr')}>🇫🇷 Français</button><button className={lang==='ht'?'active':''} onClick={()=>chooseLanguage('ht')}>🇭🇹 Kreyòl</button></div></div>}

        <Row id="help" icon="❓" label={labels.help}/>
        {section==='help' && <div className="dcm-panel"><div className="dcm-help"><b>{ht?'Pwoblèm ak trajè':'Problème de trajet'}</b><span>{ht?'Pou yon trajè ki pa mache byen oswa ki pa parèt.':'Pour un trajet qui ne fonctionne pas ou n’apparaît pas.'}</span><b>{ht?'Peman':'Paiement'}</b><span>{ht?'Pou MonCash, NatCash oswa montan revni.':'Pour MonCash, NatCash ou le montant des revenus.'}</span><b>{ht?'Kont chofè':'Compte chauffeur'}</b><span>{ht?'Pou pwoblèm pwofil, veyikil oswa aksè.':'Pour les problèmes de profil, véhicule ou accès.'}</span></div></div>}
      </div>

      <button className="dcm-logout" onClick={logout}>↪ {labels.logout}</button>
    </aside>
    <style jsx global>{`
      .dcm-overlay{position:fixed;inset:0;z-index:2147481000;background:rgba(17,45,39,.48);backdrop-filter:blur(5px)}
      .dcm-drawer{position:absolute;left:0;top:0;bottom:0;width:min(86vw,390px);overflow-y:auto;background:#fff;padding:28px 24px calc(42px + env(safe-area-inset-bottom));box-shadow:14px 0 50px rgba(0,0,0,.16);font-family:Inter,system-ui,-apple-system,sans-serif;color:#10253a;-webkit-overflow-scrolling:touch}
      .dcm-close{position:absolute;right:22px;top:24px;width:46px;height:46px;border:0;border-radius:15px;background:#edf5f2;color:#14604f;font-size:30px;line-height:1}
      .dcm-head{display:flex;align-items:center;gap:16px;padding:82px 0 24px;border-bottom:1px solid #e3ece8}.dcm-avatar{width:72px;height:72px;border-radius:22px;background:#0f8065;color:#fff;display:grid;place-items:center;font-size:30px;font-weight:900}.dcm-head h2{margin:0;font-size:25px}.dcm-head small{display:block;color:#788781;margin-top:4px;max-width:220px;overflow:hidden;text-overflow:ellipsis}
      .dcm-list{margin-top:12px}.dcm-row{width:100%;display:grid;grid-template-columns:44px 1fr 24px;align-items:center;gap:10px;border:0;border-bottom:1px solid #edf2ef;background:#fff;padding:13px 0;text-align:left;color:#19372f;font-size:16px;touch-action:manipulation}.dcm-icon{width:40px;height:40px;border-radius:13px;background:#f1f6f4;display:grid;place-items:center;font-size:20px}.dcm-arrow{text-align:right;color:#8da09a;font-size:23px}
      .dcm-panel{padding:12px 6px 16px;border-bottom:1px solid #e7efec;background:#fbfdfc;max-height:none!important;overflow:visible!important}.dcm-panel p{display:flex;justify-content:space-between;gap:16px;margin:9px 0;font-size:12px}.dcm-panel p span{color:#7b8a85}.dcm-panel p b{text-align:right;color:#17362e}.dcm-note,.dcm-error{margin:12px 0;padding:11px 12px;border-radius:12px;background:#eef7f3;color:#245c4d;font-size:12px;font-weight:700;line-height:1.45}.dcm-error{background:#fff2f2;color:#9e3f3f}.dcm-status{margin-top:8px;color:#0f8065;font-size:11px;font-weight:800}
      .dcm-field{display:grid;gap:5px;margin:9px 0}.dcm-field span{font-size:11px;font-weight:750;color:#657483}.dcm-field input,.dcm-field select{width:100%;box-sizing:border-box;border:1px solid #d9e1e7;border-radius:10px;padding:10px;font-size:13px;background:#fff;color:#10253a}.dcm-primary{width:100%;border:0;border-radius:10px;background:#0f8065;color:#fff;padding:11px 12px;font-weight:850;font-size:12px;margin-top:8px}
      .dcm-method{border:1px solid #e0e7eb;border-radius:13px;padding:11px;margin:8px 0;background:#f8fafb}.dcm-method.active{border-color:#9fd1c1;background:#f2faf7}.dcm-method-head{display:flex;justify-content:space-between;align-items:center}.dcm-switch{width:44px;height:25px;border:0;border-radius:999px;background:#c2cbd1;padding:3px}.dcm-switch i{display:block;width:19px;height:19px;border-radius:50%;background:#fff}.dcm-method.active .dcm-switch{background:#0f8065}.dcm-method.active .dcm-switch i{margin-left:19px}
      .dcm-trips{display:grid;gap:8px;max-height:min(300px,34vh)!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch}.dcm-trip{display:grid;gap:3px;padding:10px;border:1px solid #e0eae6;border-radius:12px;background:#fff}.dcm-trip b{font-size:12px}.dcm-trip span,.dcm-trip small{font-size:11px;color:#778781}.dcm-trip small{color:#0f8065;font-weight:800}.dcm-lang{display:grid;grid-template-columns:1fr 1fr;gap:8px}.dcm-lang button{border:1px solid #d9e6e1;border-radius:12px;background:#fff;padding:10px;font-weight:800;color:#405b53}.dcm-lang button.active{border-color:#0f8065;background:#eaf7f2;color:#0f8065}.dcm-help{display:grid;gap:6px;font-size:11px}.dcm-help b{color:#17362e}.dcm-help span{color:#71808f;margin-bottom:5px}
      .dcm-logout{position:static!important;width:100%;margin-top:22px;border:1px solid #efcaca;background:#fff7f7;color:#ae3939;border-radius:14px;padding:14px;font-size:15px;font-weight:900;box-shadow:none!important}
    `}</style>
  </div>, document.body)
}
