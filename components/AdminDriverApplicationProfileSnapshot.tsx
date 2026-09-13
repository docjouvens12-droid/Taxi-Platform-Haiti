'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

type Snapshot = {
  user_id: string
  status: string
  application_full_name: string | null
  application_birth_date: string | null
  application_gender: string | null
  application_address: string | null
  application_marital_status: string | null
  application_phone: string | null
  application_email: string | null
  application_submitted_at: string | null
}

export default function AdminDriverApplicationProfileSnapshot() {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [rows, setRows] = useState<Snapshot[]>([])
  const [lang, setLang] = useState<'fr' | 'ht'>('fr')

  useEffect(() => {
    if (window.location.pathname !== '/admin/drivers') return
    setLang(localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr')

    const install = () => {
      const list = document.querySelector<HTMLElement>('.admin-card .list')
      if (!list) { setTarget(null); return }
      let mount = document.querySelector<HTMLElement>('.admin-driver-profile-snapshot-root')
      if (!mount) {
        mount = document.createElement('div')
        mount.className = 'admin-driver-profile-snapshot-root'
        list.parentElement?.insertBefore(mount, list)
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
    void load()
  }, [target])

  async function load() {
    const { data } = await supabase
      .from('driver_profiles')
      .select('user_id,status,application_full_name,application_birth_date,application_gender,application_address,application_marital_status,application_phone,application_email,application_submitted_at')
      .not('application_submitted_at', 'is', null)
      .order('application_submitted_at', { ascending: false })
    setRows((data || []) as Snapshot[])
  }

  if (!target || rows.length === 0) return null
  const ht = lang === 'ht'

  const genderLabel = (value: string | null) => {
    if (value === 'male' || value === 'homme') return ht ? 'Gason' : 'Homme'
    if (value === 'female' || value === 'femme') return ht ? 'Fi' : 'Femme'
    return value || '—'
  }
  const maritalLabel = (value: string | null) => {
    const labels: Record<string, [string, string]> = {
      single: ['Célibataire', 'Selibatè'], married: ['Marié(e)', 'Marye'], divorced: ['Divorcé(e)', 'Divòse'], widowed: ['Veuf/Veuve', 'Vèf/Vèv'],
    }
    return value && labels[value] ? labels[value][ht ? 1 : 0] : value || '—'
  }

  return createPortal(
    <section className="admin-profile-snapshots">
      <style>{`
        .admin-profile-snapshots{margin:14px 0 18px;padding:14px;border:1px solid #dfe8e5;border-radius:18px;background:#f7fbf9;font-family:Inter,system-ui,sans-serif}.admin-profile-snapshots>h2{margin:0 0 5px;font-size:17px;color:#0f5f4d}.admin-profile-snapshots>p{margin:0 0 12px;font-size:11px;color:#748493}.aps-list{display:grid;gap:10px}.aps-card{background:#fff;border:1px solid #e1e8ec;border-radius:15px;padding:12px}.aps-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:9px}.aps-head strong{font-size:13px;color:#14283a}.aps-head span{font-size:9px;font-weight:900;text-transform:uppercase;padding:5px 7px;border-radius:999px;background:#eef3f5;color:#526474}.aps-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.aps-grid div{background:#f7f9fb;border-radius:10px;padding:8px}.aps-grid small,.aps-grid b{display:block}.aps-grid small{font-size:8px;text-transform:uppercase;font-weight:900;color:#84909c}.aps-grid b{font-size:11px;color:#203548;margin-top:2px;word-break:break-word}@media(max-width:700px){.aps-grid{grid-template-columns:1fr}}
      `}</style>
      <h2>{ht ? 'Enfòmasyon Profil ki te soumèt' : 'Profil soumis avec la demande'}</h2>
      <p>{ht ? 'Sa se kopi enfòmasyon chofè a te voye lè li te fè demann lan.' : 'Ces informations correspondent au profil au moment où la demande a été envoyée.'}</p>
      <div className="aps-list">
        {rows.map((r) => <article className="aps-card" key={r.user_id}>
          <div className="aps-head"><strong>{r.application_full_name || (ht ? 'Chofè' : 'Chauffeur')}</strong><span>{r.status}</span></div>
          <div className="aps-grid">
            <div><small>{ht ? 'Dat nesans' : 'Date de naissance'}</small><b>{r.application_birth_date || '—'}</b></div>
            <div><small>{ht ? 'Sèks' : 'Sexe'}</small><b>{genderLabel(r.application_gender)}</b></div>
            <div><small>{ht ? 'Adrès' : 'Adresse'}</small><b>{r.application_address || '—'}</b></div>
            <div><small>{ht ? 'Eta sivil' : 'État civil'}</small><b>{maritalLabel(r.application_marital_status)}</b></div>
            <div><small>{ht ? 'Telefòn' : 'Téléphone'}</small><b>{r.application_phone || '—'}</b></div>
            <div><small>{ht ? 'Imèl' : 'E-mail'}</small><b>{r.application_email || '—'}</b></div>
            <div><small>{ht ? 'Dat demann' : 'Date de la demande'}</small><b>{r.application_submitted_at ? new Date(r.application_submitted_at).toLocaleString(ht ? 'fr-HT' : 'fr-FR') : '—'}</b></div>
          </div>
        </article>)}
      </div>
    </section>,
    target,
  )
}
