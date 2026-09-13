'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

type Row = {
  user_id: string
  application_full_name: string | null
  application_submitted_at: string | null
  vehicle_type: string | null
  make: string | null
  model: string | null
  color: string | null
  year: number | null
  plate_number: string | null
  seats: number | null
}

export default function AdminDriverVehicleSnapshot() {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [lang, setLang] = useState<'fr' | 'ht'>('fr')

  useEffect(() => {
    if (window.location.pathname !== '/admin/drivers') return
    setLang(localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr')
    const install = () => {
      const profileBlock = document.querySelector<HTMLElement>('.admin-profile-snapshots')
      const list = document.querySelector<HTMLElement>('.admin-card .list')
      const anchor = profileBlock || list
      if (!anchor) { setTarget(null); return }
      let mount = document.querySelector<HTMLElement>('.admin-driver-vehicle-snapshot-root')
      if (!mount) {
        mount = document.createElement('div')
        mount.className = 'admin-driver-vehicle-snapshot-root'
        if (profileBlock?.parentElement) profileBlock.parentElement.insertBefore(mount, profileBlock.nextSibling)
        else list?.parentElement?.insertBefore(mount, list)
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
    const { data: drivers } = await supabase
      .from('driver_profiles')
      .select('user_id,application_full_name,application_submitted_at')
      .not('application_submitted_at', 'is', null)
      .order('application_submitted_at', { ascending: false })
    const ids = (drivers || []).map((d) => d.user_id)
    if (!ids.length) { setRows([]); return }
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('driver_id,vehicle_type,make,model,color,year,plate_number,seats,created_at')
      .in('driver_id', ids)
      .order('created_at', { ascending: true })
    const map = new Map<string, any>()
    for (const vehicle of vehicles || []) if (!map.has(vehicle.driver_id)) map.set(vehicle.driver_id, vehicle)
    setRows((drivers || []).map((d) => ({
      user_id: d.user_id,
      application_full_name: d.application_full_name,
      application_submitted_at: d.application_submitted_at,
      vehicle_type: map.get(d.user_id)?.vehicle_type ?? null,
      make: map.get(d.user_id)?.make ?? null,
      model: map.get(d.user_id)?.model ?? null,
      color: map.get(d.user_id)?.color ?? null,
      year: map.get(d.user_id)?.year ?? null,
      plate_number: map.get(d.user_id)?.plate_number ?? null,
      seats: map.get(d.user_id)?.seats ?? null,
    })))
  }

  if (!target || rows.length === 0) return null
  const ht = lang === 'ht'
  return createPortal(
    <section className="admin-vehicle-snapshots">
      <style>{`
        .admin-vehicle-snapshots{margin:14px 0 18px;padding:14px;border:1px solid #dfe6ed;border-radius:18px;background:#f8fafb;font-family:Inter,system-ui,sans-serif}.admin-vehicle-snapshots>h2{margin:0 0 12px;font-size:17px;color:#0f5f4d}.avs-list{display:grid;gap:10px}.avs-card{background:#fff;border:1px solid #e1e8ec;border-radius:15px;padding:12px}.avs-card>strong{display:block;font-size:13px;color:#14283a;margin-bottom:9px}.avs-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.avs-grid div{background:#f7f9fb;border-radius:10px;padding:8px}.avs-grid small,.avs-grid b{display:block}.avs-grid small{font-size:8px;text-transform:uppercase;font-weight:900;color:#84909c}.avs-grid b{font-size:11px;color:#203548;margin-top:2px;word-break:break-word}@media(max-width:700px){.avs-grid{grid-template-columns:1fr}}
      `}</style>
      <h2>{ht ? 'Enfòmasyon veyikil ki te soumèt' : 'Informations du véhicule soumis'}</h2>
      <div className="avs-list">
        {rows.map((r) => <article className="avs-card" key={r.user_id}>
          <strong>{r.application_full_name || (ht ? 'Chofè' : 'Chauffeur')}</strong>
          <div className="avs-grid">
            <div><small>{ht ? 'Kalite' : 'Type'}</small><b>{r.vehicle_type || '—'}</b></div>
            <div><small>{ht ? 'Mak' : 'Marque'}</small><b>{r.make || '—'}</b></div>
            <div><small>{ht ? 'Modèl' : 'Modèle'}</small><b>{r.model || '—'}</b></div>
            <div><small>{ht ? 'Koulè' : 'Couleur'}</small><b>{r.color || '—'}</b></div>
            <div><small>{ht ? 'Ane' : 'Année'}</small><b>{r.year ?? '—'}</b></div>
            <div><small>{ht ? 'Plak' : 'Plaque'}</small><b>{r.plate_number || '—'}</b></div>
            <div><small>{ht ? 'Kantite plas' : 'Nombre de places'}</small><b>{r.seats ?? '—'}</b></div>
          </div>
        </article>)}
      </div>
    </section>,
    target,
  )
}
