'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Lang = 'fr' | 'ht'
type VehicleType = 'car' | 'moto'
type DriverStatus = 'pending' | 'approved' | 'suspended' | 'rejected' | 'cancelled' | null

const copy = {
  fr: {
    title: 'Devenir chauffeur', subtitle: 'Envoyez vos informations pour vérification', back: 'Retour', logout: 'Se déconnecter',
    license: 'Numéro de permis de conduire', nationalId: 'Numéro d’identification nationale',
    vehicleType: 'Type de véhicule', car: 'Voiture', moto: 'Moto', vehicleInfo: 'Informations du véhicule',
    make: 'Marque', model: 'Modèle', color: 'Couleur', year: 'Année', plate: 'Plaque d’immatriculation', seats: 'Nombre de places',
    submit: 'Envoyer ma demande', sending: 'Envoi en cours…', pending: 'Votre demande est en attente de vérification.',
    approved: 'Votre compte chauffeur est approuvé.', suspended: 'Votre compte chauffeur est suspendu.',
    rejected: 'Votre demande a été refusée. Vous pouvez corriger vos informations et la renvoyer.',
    cancelled: 'Votre demande a été annulée. Vous pouvez la renvoyer quand vous le souhaitez.',
    success: 'Demande envoyée avec succès.', auth: 'Vous devez être connecté pour envoyer une demande chauffeur.',
    incompleteProfile: 'Complétez d’abord votre Profil : nom, date de naissance, sexe, adresse, état civil et téléphone sont obligatoires.'
  },
  ht: {
    title: 'Vin chofè', subtitle: 'Voye enfòmasyon ou pou verifikasyon', back: 'Retounen', logout: 'Dekonekte',
    license: 'Nimewo lisans kondwi', nationalId: 'Nimewo idantifikasyon nasyonal',
    vehicleType: 'Kalite veyikil', car: 'Machin', moto: 'Moto', vehicleInfo: 'Enfòmasyon machin oswa moto',
    make: 'Mak', model: 'Modèl', color: 'Koulè', year: 'Ane', plate: 'Nimewo plak', seats: 'Kantite plas',
    submit: 'Voye aplikasyon mwen', sending: 'N ap voye aplikasyon an…', pending: 'Aplikasyon ou an ap tann verifikasyon.',
    approved: 'Kont chofè ou a apwouve.', suspended: 'Kont chofè ou a sispann.',
    rejected: 'Yo te refize aplikasyon an. Ou ka korije enfòmasyon yo epi voye l ankò.',
    cancelled: 'Ou te anile aplikasyon an. Ou ka voye yon nouvo demann nenpòt lè.',
    success: 'Aplikasyon an voye avèk siksè.', auth: 'Ou dwe konekte pou voye yon aplikasyon chofè.',
    incompleteProfile: 'Ranpli Profil ou an premye: non, dat nesans, sèks, adrès, eta sivil ak telefòn obligatwa.'
  }
}

export default function DriverApplicationPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = copy[lang]
  const [status, setStatus] = useState<DriverStatus>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ vehicleType: 'car' as VehicleType, license: '', nationalId: '', make: '', model: '', color: '', year: '', plate: '', seats: '4' })

  useEffect(() => {
    const saved = window.localStorage.getItem('taxi-language') as Lang | null
    if (saved === 'fr' || saved === 'ht') setLang(saved)
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { setMessage((saved === 'ht' ? copy.ht : copy.fr).auth); return }
      const { data } = await supabase.from('driver_profiles').select('status,license_number,national_id_number').eq('user_id', auth.user.id).maybeSingle()
      if (data) {
        setStatus(data.status as DriverStatus)
        setForm((f) => ({ ...f, license: data.license_number ?? '', nationalId: data.national_id_number ?? '' }))
        const { data: vehicle } = await supabase.from('vehicles').select('vehicle_type,make,model,color,year,plate_number,seats').eq('driver_id', auth.user.id).order('created_at', { ascending: true }).limit(1).maybeSingle()
        if (vehicle) setForm((f) => ({ ...f, vehicleType: (vehicle.vehicle_type === 'moto' ? 'moto' : 'car') as VehicleType, make: vehicle.make ?? '', model: vehicle.model ?? '', color: vehicle.color ?? '', year: vehicle.year ? String(vehicle.year) : '', plate: vehicle.plate_number ?? '', seats: String(vehicle.seats ?? (vehicle.vehicle_type === 'moto' ? 2 : 4)) }))
      }
    })()
  }, [])

  function chooseVehicleType(vehicleType: VehicleType) {
    setForm((f) => ({ ...f, vehicleType, seats: vehicleType === 'moto' ? '2' : (Number(f.seats) > 2 ? f.seats : '4') }))
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('')
    const { data: auth } = await supabase.auth.getUser()
    const user = auth.user
    if (!user) { setMessage(t.auth); setBusy(false); return }

    const { data: person } = await supabase.from('profiles').select('full_name,phone').eq('id', user.id).maybeSingle()
    const metadata = user.user_metadata || {}
    const fullName = String(person?.full_name || metadata.full_name || '').trim()
    const birthDate = String(metadata.birth_date || metadata.date_of_birth || '').trim()
    const gender = String(metadata.gender || metadata.sex || '').trim()
    const address = String(metadata.address || metadata.driver_address || '').trim()
    const maritalStatus = String(metadata.marital_status || '').trim()
    const phone = String(person?.phone || metadata.phone || '').trim()

    if (!fullName || !birthDate || !gender || !address || !maritalStatus || !phone) {
      setMessage(t.incompleteProfile)
      setBusy(false)
      return
    }

    const { error } = await supabase.rpc('submit_driver_application_with_profile', {
      p_full_name: fullName,
      p_birth_date: birthDate,
      p_gender: gender,
      p_address: address,
      p_marital_status: maritalStatus,
      p_phone: phone,
      p_email: user.email || '',
      p_license_number: form.license,
      p_national_id_number: form.nationalId,
      p_vehicle_type: form.vehicleType,
      p_vehicle_make: form.make,
      p_vehicle_model: form.model,
      p_vehicle_color: form.color,
      p_vehicle_year: form.year ? Number(form.year) : null,
      p_plate_number: form.plate,
      p_seats: Number(form.seats || (form.vehicleType === 'moto' ? 2 : 4)),
    })
    if (error) setMessage(error.message)
    else { setStatus('pending'); setMessage(t.success) }
    setBusy(false)
  }

  const statusText = status ? t[status] : ''
  const locked = status === 'approved' || status === 'suspended'

  return <main className="driver-page"><section className="driver-card">
    <div className="driver-top"><button onClick={() => history.back()}>‹ {t.back}</button><div className="driver-actions"><select value={lang} onChange={(e) => { const next = e.target.value as Lang; setLang(next); localStorage.setItem('taxi-language', next) }}><option value="fr">Français</option><option value="ht">Kreyòl</option></select><button className="logout" onClick={() => void logout()}>↪ {t.logout}</button></div></div>
    <div className="driver-brand"><span>T</span><div><strong>Taxi Platform Haiti</strong><small>{t.subtitle}</small></div></div>
    <h1>{t.title}</h1>{statusText && <div className={`driver-status ${status}`}>{statusText}</div>}
    <form onSubmit={submit} className="driver-form">
      <label>{t.license}<input required disabled={locked} value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })} /></label>
      <label>{t.nationalId}<input required disabled={locked} value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} /></label>
      <fieldset className="vehicle-type" disabled={locked}><legend>{t.vehicleType}</legend><button type="button" className={form.vehicleType === 'car' ? 'selected' : ''} onClick={() => chooseVehicleType('car')}>🚕 {t.car}</button><button type="button" className={form.vehicleType === 'moto' ? 'selected' : ''} onClick={() => chooseVehicleType('moto')}>🏍️ {t.moto}</button></fieldset>
      <h2>{t.vehicleInfo}</h2>
      <div className="grid2"><label>{t.make}<input required disabled={locked} value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} /></label><label>{t.model}<input required disabled={locked} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></label></div>
      <div className="grid2"><label>{t.color}<input disabled={locked} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></label><label>{t.year}<input type="number" min="1980" max="2030" disabled={locked} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></label></div>
      <div className="grid2"><label>{t.plate}<input required disabled={locked} value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} /></label><label>{t.seats}<input type="number" min="1" max={form.vehicleType === 'moto' ? 2 : 20} required disabled={locked} value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} /></label></div>
      {message && <div className="driver-message">{message}</div>}{!locked && <button className="submit-driver" disabled={busy}>{busy ? t.sending : t.submit}</button>}
    </form>
  </section><style jsx>{`
    .driver-page{min-height:100vh;background:linear-gradient(160deg,#e5f1ed,#eef2f7 45%,#e7edf3);padding:24px;display:grid;place-items:center;color:#102033;font-family:Inter,system-ui,sans-serif}.driver-card{width:min(100%,520px);background:#fff;border-radius:28px;padding:24px;box-shadow:0 24px 70px rgba(18,36,61,.15)}.driver-top{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:22px}.driver-top>button{border:0;background:none;font-weight:800;color:#0f5f4d}.driver-actions{display:flex;align-items:center;gap:8px}.driver-actions select,.driver-form input{border:1px solid #dbe3eb;border-radius:12px;background:#fff;padding:10px 12px}.logout{border:0;border-radius:12px;background:#fff1f1;color:#a83232;padding:10px 12px;font-weight:850}.driver-brand{display:flex;align-items:center;gap:10px;margin-bottom:18px}.driver-brand>span{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:#0f5f4d;color:#fff;font-weight:900}.driver-brand strong,.driver-brand small{display:block}.driver-brand small{color:#758596}.driver-card h1{font-size:30px;margin:0 0 16px}.driver-card h2{font-size:16px;margin:4px 0 0}.driver-status,.driver-message{padding:12px 14px;border-radius:14px;margin-bottom:14px;font-size:13px;font-weight:750}.driver-status.pending{background:#fff7df;color:#795d00}.driver-status.approved,.driver-message{background:#e8f7ef;color:#0b704f}.driver-status.suspended,.driver-status.rejected,.driver-status.cancelled{background:#fff0f0;color:#9d2d2d}.driver-form{display:grid;gap:13px}.driver-form label{display:grid;gap:6px;font-size:12px;font-weight:800;color:#4f6072}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.vehicle-type{border:0;padding:0;margin:2px 0;display:grid;grid-template-columns:1fr 1fr;gap:10px}.vehicle-type legend{grid-column:1/-1;font-size:12px;font-weight:800;color:#4f6072;margin-bottom:7px}.vehicle-type button{border:1px solid #dbe3eb;background:#fff;border-radius:15px;padding:14px;font-weight:850;color:#405365}.vehicle-type button.selected{border:2px solid #0f7a62;background:#eff9f5;color:#0f5f4d}.submit-driver{border:0;border-radius:15px;background:#0f5f4d;color:#fff;padding:14px;font-weight:900;margin-top:4px;position:sticky;bottom:18px;z-index:25;box-shadow:0 12px 28px rgba(15,95,77,.28)}.submit-driver:disabled{opacity:.7}@media(max-width:560px){.driver-page{padding:0}.driver-card{min-height:100vh;border-radius:0;padding:22px 18px 130px}.grid2{grid-template-columns:1fr}.driver-top{align-items:flex-start}.driver-actions{flex-direction:column;align-items:flex-end}.logout{font-size:11px;padding:8px 10px}.submit-driver{bottom:96px;font-size:15px;padding:16px}}
  `}</style></main>
}
