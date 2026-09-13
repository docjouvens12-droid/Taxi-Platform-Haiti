'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

type Lang = 'fr' | 'ht'
type Section = 'profile' | 'vehicle' | 'payment' | 'history' | 'earnings' | 'help' | null

type RideRow = {
  id: string
  pickup_address: string | null
  destination_address: string | null
  final_fare_htg: number | null
  completed_at: string | null
}

type PaymentRow = {
  ride_id: string
  amount_htg: number | string
  platform_fee_htg: number | string | null
  driver_net_htg: number | string | null
  status: string
}

export default function DriverFinalMenu() {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [lang, setLang] = useState<Lang>('fr')
  const [open, setOpen] = useState<Section>(null)
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [profileEditing, setProfileEditing] = useState(false)
  const [vehicleEditing, setVehicleEditing] = useState(false)
  const [status, setStatus] = useState('')

  const [profile, setProfile] = useState({ fullName: '', birthDate: '', sex: '', license: '', phone: '' })
  const [vehicleId, setVehicleId] = useState('')
  const [vehicle, setVehicle] = useState({ type: 'standard', make: '', model: '', color: '', year: '', plate: '', seats: '' })
  const [payout, setPayout] = useState({ selected: '' as '' | 'moncash' | 'natcash', moncashName: '', moncashPhone: '', natcashName: '', natcashPhone: '' })
  const [rides, setRides] = useState<RideRow[]>([])
  const [payments, setPayments] = useState<PaymentRow[]>([])

  useEffect(() => {
    if (window.location.pathname !== '/driver/dashboard') return
    setLang(localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr')

    const install = () => {
      const drawer = document.querySelector<HTMLElement>('.drawer')
      if (!drawer) { setTarget(null); return }

      drawer.querySelectorAll<HTMLElement>('.menuSection,.driver-payment-menu-section,[data-driver-history="true"],[data-driver-earnings="true"],[data-driver-help="true"]').forEach((el) => {
        if (!el.closest('.driver-final-menu-root')) el.style.display = 'none'
      })

      let mount = drawer.querySelector<HTMLElement>('.driver-final-menu-root')
      if (!mount) {
        mount = document.createElement('div')
        mount.className = 'driver-final-menu-root'
        const logout = drawer.querySelector('.logout,.drawerLogout')
        if (logout) drawer.insertBefore(mount, logout)
        else drawer.appendChild(mount)
      }
      setTarget(mount)
    }

    install()
    const observer = new MutationObserver(install)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!target) return
    void loadAll()
  }, [target])

  async function loadAll() {
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user
    if (!user) return
    setUserId(user.id)
    setEmail(user.email || '')
    const [{ data: person }, { data: driver }, { data: v }, { data: rideData }] = await Promise.all([
      supabase.from('profiles').select('full_name,phone').eq('id', user.id).maybeSingle(),
      supabase.from('driver_profiles').select('license_number,moncash_enabled,moncash_name,moncash_phone,natcash_enabled,natcash_name,natcash_phone,preferred_payout_provider').eq('user_id', user.id).maybeSingle(),
      supabase.from('vehicles').select('id,vehicle_type,make,model,color,year,plate_number,seats').eq('driver_id', user.id).eq('is_active', true).order('created_at', { ascending: true }).limit(1).maybeSingle(),
      supabase.from('rides').select('id,pickup_address,destination_address,final_fare_htg,completed_at').eq('driver_id', user.id).eq('status', 'completed').order('completed_at', { ascending: false }).limit(10),
    ])
    const meta = user.user_metadata || {}
    setProfile({
      fullName: person?.full_name || meta.full_name || '',
      birthDate: meta.birth_date || meta.date_of_birth || '',
      sex: meta.gender || meta.sex || '',
      license: driver?.license_number || '',
      phone: person?.phone || '',
    })
    if (v) {
      setVehicleId(v.id)
      setVehicle({ type: v.vehicle_type || 'standard', make: v.make || '', model: v.model || '', color: v.color || '', year: v.year ? String(v.year) : '', plate: v.plate_number || '', seats: v.seats ? String(v.seats) : '' })
    }
    const preferred = driver?.preferred_payout_provider === 'moncash' || driver?.preferred_payout_provider === 'natcash' ? driver.preferred_payout_provider : ''
    setPayout({ selected: preferred, moncashName: driver?.moncash_name || '', moncashPhone: driver?.moncash_phone || '', natcashName: driver?.natcash_name || '', natcashPhone: driver?.natcash_phone || '' })
    const completed = (rideData || []) as RideRow[]
    setRides(completed)
    const ids = completed.map(r => r.id)
    if (ids.length) {
      const { data: p } = await supabase.from('payments').select('ride_id,amount_htg,platform_fee_htg,driver_net_htg,status').in('ride_id', ids)
      setPayments((p || []) as PaymentRow[])
    } else setPayments([])
  }

  const earnings = useMemo(() => {
    const byRide = new Map(payments.map(p => [p.ride_id, p]))
    const totalNet = rides.reduce((sum, r) => sum + Number(byRide.get(r.id)?.driver_net_htg || 0), 0)
    const totalGross = rides.reduce((sum, r) => sum + Number(byRide.get(r.id)?.amount_htg || r.final_fare_htg || 0), 0)
    const totalFee = rides.reduce((sum, r) => sum + Number(byRide.get(r.id)?.platform_fee_htg || 0), 0)
    return { totalNet, totalGross, totalFee }
  }, [rides, payments])

  const ht = lang === 'ht'
  const toggle = (section: Section) => setOpen(prev => prev === section ? null : section)

  async function saveProfile() {
    if (!userId) return
    setStatus(ht ? 'N ap anrejistre…' : 'Enregistrement…')
    const [{ error: pErr }, { error: dErr }, { error: mErr }] = await Promise.all([
      supabase.from('profiles').upsert({ id: userId, full_name: profile.fullName, phone: profile.phone }, { onConflict: 'id' }),
      supabase.from('driver_profiles').update({ license_number: profile.license }).eq('user_id', userId),
      supabase.auth.updateUser({ data: { birth_date: profile.birthDate, gender: profile.sex, full_name: profile.fullName } }),
    ])
    if (pErr || dErr || mErr) { setStatus(ht ? 'Gen yon erè pandan anrejistreman an.' : 'Erreur pendant l’enregistrement.'); return }
    setStatus(ht ? '✓ Anrejistre' : '✓ Enregistré')
    setProfileEditing(false)
  }

  async function saveVehicle() {
    if (!vehicleId) return
    setStatus(ht ? 'N ap anrejistre…' : 'Enregistrement…')
    const { error } = await supabase.from('vehicles').update({
      vehicle_type: vehicle.type,
      make: vehicle.make,
      model: vehicle.model,
      color: vehicle.color || null,
      year: vehicle.year ? Number(vehicle.year) : null,
      plate_number: vehicle.plate,
      seats: vehicle.seats ? Number(vehicle.seats) : null,
    }).eq('id', vehicleId)
    if (error) { setStatus(error.message); return }
    setStatus(ht ? '✓ Anrejistre' : '✓ Enregistré')
    setVehicleEditing(false)
  }

  async function savePayout(provider: 'moncash' | 'natcash') {
    if (!userId) return
    const name = provider === 'moncash' ? payout.moncashName.trim() : payout.natcashName.trim()
    const phone = provider === 'moncash' ? payout.moncashPhone.trim() : payout.natcashPhone.trim()
    if (!name || !phone) { setStatus(ht ? 'Antre non ak telefòn lan.' : 'Entrez le nom et le téléphone.'); return }
    const update = provider === 'moncash'
      ? { moncash_enabled: true, natcash_enabled: false, preferred_payout_provider: 'moncash', moncash_name: name, moncash_phone: phone }
      : { moncash_enabled: false, natcash_enabled: true, preferred_payout_provider: 'natcash', natcash_name: name, natcash_phone: phone }
    const { error } = await supabase.from('driver_profiles').update(update).eq('user_id', userId)
    if (error) { setStatus(error.message); return }
    setPayout(prev => ({ ...prev, selected: provider }))
    setStatus(ht ? '✓ Metòd la anrejistre' : '✓ Mode enregistré')
  }

  function changeLanguage(next: Lang) {
    localStorage.setItem('taxi-language', next)
    setLang(next)
    const drawer = document.querySelector<HTMLElement>('.drawer')
    const hiddenButtons = Array.from(drawer?.querySelectorAll<HTMLButtonElement>('.langBtns button,.langButtons button') || [])
    const targetButton = hiddenButtons.find(b => next === 'ht' ? (b.textContent || '').toLowerCase().includes('krey') : (b.textContent || '').toLowerCase().includes('fran'))
    targetButton?.click()
  }

  if (!target) return null

  const row = (label: string, value: string) => <p className="dfm-row"><span>{label}</span><b>{value || '—'}</b></p>
  const sectionButton = (id: Exclude<Section, null>, label: string, mark: 'arrow' | 'plus' = 'arrow') => (
    <button type="button" className="dfm-trigger" onClick={() => toggle(id)} aria-expanded={open === id}>
      <span>{label}</span><b>{mark === 'plus' ? '+' : '›'}</b>
    </button>
  )

  return createPortal(<div className="dfm-wrap">
    <style>{`
      .dfm-wrap{font-family:Inter,system-ui,sans-serif;color:#102033}
      .dfm-section{border-bottom:1px solid #e5eaee}
      .dfm-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;border:0;background:transparent;padding:16px 0;color:#0f6f59;font-size:15px;font-weight:850;text-align:left}
      .dfm-trigger b{font-size:23px;line-height:1;color:#0f6f59}
      .dfm-body{padding:0 0 14px}
      .dfm-row{display:flex;justify-content:space-between;gap:12px;margin:8px 0;font-size:12px}.dfm-row span{color:#778697}.dfm-row b{text-align:right;color:#173246}
      .dfm-field{display:grid;gap:4px;margin:9px 0;font-size:11px;font-weight:750;color:#657483}.dfm-field input,.dfm-field select{width:100%;box-sizing:border-box;border:1px solid #d9e1e7;border-radius:10px;padding:9px 10px;font-size:13px;background:#fff;color:#102033}
      .dfm-primary,.dfm-secondary{width:100%;border-radius:10px;padding:10px 12px;font-weight:850;font-size:12px;margin-top:8px}.dfm-primary{border:0;background:#0f6f59;color:#fff}.dfm-secondary{border:1px solid #c7d8d2;background:#eef8f4;color:#0f6f59}
      .dfm-method{border:1px solid #e0e7eb;border-radius:13px;padding:11px;margin:8px 0;background:#f8fafb}.dfm-method.active{border-color:#9fd1c1;background:#f2faf7}.dfm-method-head{display:flex;justify-content:space-between;align-items:center;font-weight:850}.dfm-switch{width:44px;height:25px;border:0;border-radius:999px;background:#c2cbd1;padding:3px}.dfm-switch i{display:block;width:19px;height:19px;border-radius:50%;background:#fff}.dfm-method.active .dfm-switch{background:#0f6f59}.dfm-method.active .dfm-switch i{margin-left:19px}
      .dfm-trip{border:1px solid #e4eaee;border-radius:12px;padding:9px;margin:8px 0;background:#f8fafb;font-size:11px}.dfm-trip strong{display:block;color:#0f6f59;margin-bottom:5px}
      .dfm-lang{border-bottom:1px solid #e5eaee;padding:15px 0}.dfm-lang>strong{display:block;color:#0f6f59;font-size:15px;margin-bottom:10px}.dfm-lang-switch{width:156px;border:1px solid #d7e1e8;border-radius:999px;background:#eef3f5;padding:3px;display:grid;grid-template-columns:1fr 1fr}.dfm-lang-switch button{border:0;border-radius:999px;padding:8px 10px;background:transparent;font-size:11px;font-weight:850;color:#657483}.dfm-lang-switch button.active{background:#0f6f59;color:#fff}
      .dfm-help-card{padding:8px 0;border-bottom:1px solid #edf1f3}.dfm-help-card strong{display:block;font-size:11px;color:#173246;margin-bottom:3px}.dfm-help-card p{margin:0;font-size:10px;line-height:1.4;color:#71808f}.dfm-status{min-height:14px;font-size:10px;font-weight:800;color:#0f6f59;margin-top:6px}
    `}</style>

    <div className="dfm-section">{sectionButton('profile', ht ? 'Pwofil' : 'Profil')}{open === 'profile' && <div className="dfm-body">{profileEditing ? <>
      <label className="dfm-field">{ht ? 'Non' : 'Nom'}<input value={profile.fullName} onChange={e=>setProfile({...profile,fullName:e.target.value})}/></label>
      <label className="dfm-field">{ht ? 'Dat nesans' : 'Date de naissance'}<input type="date" value={profile.birthDate} onChange={e=>setProfile({...profile,birthDate:e.target.value})}/></label>
      <label className="dfm-field">{ht ? 'Sèks' : 'Sexe'}<select value={profile.sex} onChange={e=>setProfile({...profile,sex:e.target.value})}><option value="">—</option><option value="male">{ht?'Gason':'Homme'}</option><option value="female">{ht?'Fi':'Femme'}</option></select></label>
      <label className="dfm-field">{ht ? 'Nimewo lisans' : 'N° de permis'}<input value={profile.license} onChange={e=>setProfile({...profile,license:e.target.value})}/></label>
      <label className="dfm-field">{ht ? 'Telefòn' : 'Téléphone'}<input type="tel" value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})}/></label>
      <label className="dfm-field">{ht ? 'Imèl' : 'E-mail'}<input value={email} disabled/></label>
      <button className="dfm-primary" onClick={saveProfile}>{ht?'Anrejistre':'Enregistrer'}</button>
    </> : <>
      {row(ht?'Non':'Nom',profile.fullName)}{row(ht?'Dat nesans':'Date de naissance',profile.birthDate)}{row(ht?'Sèks':'Sexe',profile.sex)}{row(ht?'Nimewo lisans':'N° de permis',profile.license)}{row(ht?'Telefòn':'Téléphone',profile.phone)}{row(ht?'Imèl':'E-mail',email)}
      <button className="dfm-primary" onClick={()=>setProfileEditing(true)}>{ht?'Modifye':'Modifier'}</button>
    </>}<div className="dfm-status">{status}</div></div>}</div>

    <div className="dfm-section">{sectionButton('vehicle', ht ? 'Veyikil' : 'Véhicule')}{open === 'vehicle' && <div className="dfm-body">{vehicleEditing ? <>
      <label className="dfm-field">{ht?'Kalite':'Type'}<select value={vehicle.type} onChange={e=>setVehicle({...vehicle,type:e.target.value})}><option value="standard">Standard</option><option value="moto">Moto</option></select></label>
      <label className="dfm-field">{ht?'Mak':'Marque'}<input value={vehicle.make} onChange={e=>setVehicle({...vehicle,make:e.target.value})}/></label>
      <label className="dfm-field">{ht?'Modèl':'Modèle'}<input value={vehicle.model} onChange={e=>setVehicle({...vehicle,model:e.target.value})}/></label>
      <label className="dfm-field">{ht?'Koulè':'Couleur'}<input value={vehicle.color} onChange={e=>setVehicle({...vehicle,color:e.target.value})}/></label>
      <label className="dfm-field">{ht?'Ane':'Année'}<input type="number" value={vehicle.year} onChange={e=>setVehicle({...vehicle,year:e.target.value})}/></label>
      <label className="dfm-field">{ht?'Plak':'Plaque'}<input value={vehicle.plate} onChange={e=>setVehicle({...vehicle,plate:e.target.value})}/></label>
      <label className="dfm-field">{ht?'Kantite plas':'Nombre de places'}<input type="number" value={vehicle.seats} onChange={e=>setVehicle({...vehicle,seats:e.target.value})}/></label>
      <button className="dfm-primary" onClick={saveVehicle}>{ht?'Anrejistre':'Enregistrer'}</button>
    </> : <>
      {row(ht?'Kalite':'Type',vehicle.type)}{row(ht?'Mak':'Marque',vehicle.make)}{row(ht?'Modèl':'Modèle',vehicle.model)}{row(ht?'Koulè':'Couleur',vehicle.color)}{row(ht?'Ane':'Année',vehicle.year)}{row(ht?'Plak':'Plaque',vehicle.plate)}{row(ht?'Plas':'Places',vehicle.seats)}
      <button className="dfm-primary" onClick={()=>setVehicleEditing(true)}>{ht?'Modifye':'Modifier'}</button>
    </>}<div className="dfm-status">{status}</div></div>}</div>

    <div className="dfm-section">{sectionButton('payment', ht ? 'Peman' : 'Paiements')}{open === 'payment' && <div className="dfm-body">
      {(['moncash','natcash'] as const).map(provider => { const active=payout.selected===provider; const label=provider==='moncash'?'MonCash':'NatCash'; const name=provider==='moncash'?payout.moncashName:payout.natcashName; const phone=provider==='moncash'?payout.moncashPhone:payout.natcashPhone; return <div key={provider} className={`dfm-method ${active?'active':''}`}>
        <div className="dfm-method-head"><span>{label}</span><button className="dfm-switch" onClick={()=>setPayout(prev=>({...prev,selected:provider}))}><i/></button></div>
        {active && <><label className="dfm-field">{ht?'Non':'Nom'}<input value={name} onChange={e=>setPayout(prev=>provider==='moncash'?{...prev,moncashName:e.target.value}:{...prev,natcashName:e.target.value})}/></label><label className="dfm-field">{ht?'Telefòn kont lan':'Téléphone du compte'}<input type="tel" value={phone} onChange={e=>setPayout(prev=>provider==='moncash'?{...prev,moncashPhone:e.target.value}:{...prev,natcashPhone:e.target.value})}/></label><button className="dfm-primary" onClick={()=>savePayout(provider)}>{ht?'Anrejistre':'Enregistrer'}</button></>}
      </div>})}<div className="dfm-status">{status}</div></div>}</div>

    <div className="dfm-section">{sectionButton('history', ht ? 'Istorik trajè' : 'Historique des trajets','plus')}{open === 'history' && <div className="dfm-body">{rides.length===0?<p className="dfm-row">{ht?'Pa gen trajè fini pou kounye a.':'Aucun trajet terminé pour le moment.'}</p>:rides.map(r=><div className="dfm-trip" key={r.id}><strong>{r.completed_at?new Date(r.completed_at).toLocaleString(ht?'fr-HT':'fr-FR'):'—'}</strong><div>📍 {r.pickup_address||'—'}</div><div>🏁 {r.destination_address||'—'}</div><div>{Number(r.final_fare_htg||0).toLocaleString('fr-HT')} HTG</div></div>)}</div>}</div>

    <div className="dfm-section">{sectionButton('earnings', ht ? 'Revni' : 'Revenus','plus')}{open === 'earnings' && <div className="dfm-body">{row(ht?'Brut':'Brut',`${earnings.totalGross.toLocaleString('fr-HT')} HTG`)}{row(ht?'Komisyon platfòm':'Commission plateforme',`${earnings.totalFee.toLocaleString('fr-HT')} HTG`)}{row(ht?'Net chofè':'Net chauffeur',`${earnings.totalNet.toLocaleString('fr-HT')} HTG`)}{row(ht?'Trajè fini':'Trajets terminés',String(rides.length))}</div>}</div>

    <div className="dfm-lang"><strong>{ht?'Lang':'Langue'}</strong><div className="dfm-lang-switch"><button className={lang==='fr'?'active':''} onClick={()=>changeLanguage('fr')}>Français</button><button className={lang==='ht'?'active':''} onClick={()=>changeLanguage('ht')}>Kreyòl</button></div></div>

    <div className="dfm-section">{sectionButton('help', ht?'Èd':'Aide','plus')}{open === 'help' && <div className="dfm-body">{(ht?[
      ['Trajè ak demann','Rete sou liy pou resevwa demann epi verifye pwen depa ak destinasyon an.'],['Peman','Chwazi yon sèl metòd payout: MonCash oswa NatCash.'],['Kont ak veyikil','Ou ka anrejistre epi modifye enfòmasyon Profil ak Veyikil ou.'],['Sekirite','Pa kòmanse yon trajè si enfòmasyon yo pa koresponn oswa sitiyasyon an pa sanble an sekirite.']
    ]:[
      ['Trajets et demandes','Restez en ligne pour recevoir les demandes et vérifiez le départ et la destination.'],['Paiements','Choisissez un seul mode de versement : MonCash ou NatCash.'],['Compte et véhicule','Vous pouvez enregistrer et modifier votre Profil et votre Véhicule.'],['Sécurité','Ne commencez pas un trajet si les informations ne correspondent pas ou si la situation semble dangereuse.']
    ]).map(([h,p])=><div className="dfm-help-card" key={h}><strong>{h}</strong><p>{p}</p></div>)}</div>}</div>
  </div>, target)
}
