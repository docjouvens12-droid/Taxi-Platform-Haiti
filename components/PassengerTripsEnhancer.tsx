'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

type Ride = {
  id: string
  status: string
  pickup_address: string
  destination_address: string
  final_fare_htg: number | null
  estimated_fare_htg: number | null
  requested_at: string
}

type Filter = 'today' | '7d' | '30d' | 'all'

function statusLabel(status: string, ht: boolean) {
  if (status === 'completed') return ht ? 'Konplete' : 'Terminé'
  if (status === 'cancelled') return ht ? 'Anile' : 'Annulé'
  if (status === 'in_progress') return ht ? 'An kou' : 'En cours'
  if (status === 'driver_arriving') return ht ? 'Chofè rive' : 'Chauffeur arrivé'
  if (status === 'accepted') return ht ? 'Aksepte' : 'Accepté'
  if (status === 'requested') return ht ? 'Ap chèche chofè' : 'Recherche chauffeur'
  return status || '—'
}

export default function PassengerTripsEnhancer() {
  const [target, setTarget] = useState<Element | null>(null)
  const [open, setOpen] = useState(false)
  const [rides, setRides] = useState<Ride[]>([])
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState<Filter>('30d')
  const [expandedRide, setExpandedRide] = useState<string | null>(null)
  const [lang, setLang] = useState<'fr' | 'ht'>('fr')

  useEffect(() => {
    let currentButton: HTMLButtonElement | null = null
    let currentHandler: ((event: MouseEvent) => void) | null = null

    const syncTarget = () => {
      const drawer = document.querySelector('.nav-drawer')
      if (!drawer) {
        setTarget(null)
        setOpen(false)
        return
      }

      const buttons = Array.from(drawer.querySelectorAll<HTMLButtonElement>('.drawer-nav > button'))
      const ridesButton = buttons.find((button) => {
        const text = (button.textContent || '').toLowerCase()
        return text.includes('mes trajets') || text.includes('trajè mwen yo')
      }) || null

      if (!ridesButton) {
        setTarget(null)
        setOpen(false)
        return
      }

      if (currentButton !== ridesButton) {
        if (currentButton && currentHandler) currentButton.removeEventListener('click', currentHandler, true)
        currentButton = ridesButton
        currentHandler = (event: MouseEvent) => {
          event.preventDefault()
          event.stopPropagation()
          event.stopImmediatePropagation()
          const saved = window.localStorage.getItem('taxi-language')
          setLang(saved === 'ht' ? 'ht' : 'fr')
          setOpen((value) => !value)
          setExpandedRide(null)
        }
        ridesButton.addEventListener('click', currentHandler, true)
      }

      let mount = drawer.querySelector('.drawer-trips-inline-target') as HTMLElement | null
      if (!mount) {
        mount = document.createElement('div')
        mount.className = 'drawer-trips-inline-target'
        ridesButton.insertAdjacentElement('afterend', mount)
      }
      setTarget(mount)
    }

    syncTarget()
    const observer = new MutationObserver(syncTarget)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      if (currentButton && currentHandler) currentButton.removeEventListener('click', currentHandler, true)
    }
  }, [])

  useEffect(() => {
    if (!target || !open) return
    let active = true
    const load = async () => {
      setBusy(true)
      try {
        const { data } = await supabase
          .from('rides')
          .select('id,status,pickup_address,destination_address,final_fare_htg,estimated_fare_htg,requested_at')
          .order('requested_at', { ascending: false })
          .limit(100)
        if (active) setRides((data ?? []) as Ride[])
      } finally {
        if (active) setBusy(false)
      }
    }
    void load()
    return () => { active = false }
  }, [target, open])

  const shown = useMemo(() => {
    if (filter === 'all') return rides
    const now = new Date()
    const cutoff = new Date(now)
    if (filter === 'today') cutoff.setHours(0, 0, 0, 0)
    if (filter === '7d') cutoff.setDate(now.getDate() - 7)
    if (filter === '30d') cutoff.setDate(now.getDate() - 30)
    return rides.filter((r) => new Date(r.requested_at) >= cutoff)
  }, [rides, filter])

  const completed = shown.filter((r) => r.status === 'completed').length
  const totalSpent = shown
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + Number(r.final_fare_htg ?? r.estimated_fare_htg ?? 0), 0)

  if (!target || !open) return null
  const ht = lang === 'ht'

  return createPortal(
    <section className="drawer-trips-inline passenger-trips-polish">
      <style>{`
        .passenger-trips-polish{padding:12px!important;border-radius:18px!important;background:#f8faf9!important;border:1px solid #dfe8e4!important;box-shadow:0 8px 22px rgba(16,32,51,.06)!important}
        .ptp-hero{background:linear-gradient(145deg,#0f705a,#155f51);color:#fff;border-radius:17px;padding:13px;display:flex;align-items:center;gap:10px;margin-bottom:10px;box-shadow:0 8px 20px rgba(15,112,90,.14)}
        .ptp-hero-icon{width:42px;height:42px;border-radius:13px;background:rgba(255,255,255,.15);display:grid;place-items:center;font-size:20px}
        .ptp-hero-copy{display:grid;gap:2px}.ptp-hero-copy strong{font-size:13px}.ptp-hero-copy small{font-size:9px;opacity:.82}
        .ptp-close{margin-left:auto;border:0!important;border-radius:10px!important;background:rgba(255,255,255,.14)!important;color:#fff!important;padding:7px 9px!important;font-size:9px!important;font-weight:900!important}
        .ptp-summary{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:9px}.ptp-stat{background:#fff;border:1px solid #e5ece9;border-radius:13px;padding:10px;text-align:center}.ptp-stat span{display:block;font-size:8px;color:#7a8983;font-weight:850;text-transform:uppercase}.ptp-stat strong{display:block;margin-top:3px;font-size:14px;color:#102033}
        .ptp-filters{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:4px;border-radius:12px;background:#edf2f0;margin-bottom:9px}.ptp-filters button{border:0;border-radius:9px;background:transparent;padding:7px 3px;font-size:8px;font-weight:900;color:#708079}.ptp-filters button.active{background:#fff;color:#0f705a;box-shadow:0 3px 8px rgba(16,32,51,.07)}
        .ptp-list{display:grid;gap:7px;max-height:350px;overflow:auto;padding-right:1px}.ptp-trip{background:#fff;border:1px solid #e4ebe8;border-radius:14px;padding:10px}.ptp-trip-head{display:flex;justify-content:space-between;align-items:center;gap:8px}.ptp-trip-head time{font-size:8px;color:#7f8d87;font-weight:800}.ptp-badge{font-size:8px;font-weight:900;border-radius:999px;padding:4px 7px;background:#e8f6f1;color:#0f705a}.ptp-badge.cancelled{background:#fff0f0;color:#a43b3b}.ptp-route{display:grid;gap:6px;margin:9px 0}.ptp-route div{display:flex;gap:6px;align-items:flex-start}.ptp-route span{font-size:10px}.ptp-route strong{font-size:9px;line-height:1.3;color:#294037;overflow-wrap:anywhere}.ptp-trip-foot{border-top:1px solid #eef2f0;padding-top:8px;display:flex;justify-content:space-between;align-items:center;gap:8px}.ptp-trip-foot strong{font-size:11px;color:#102033}.ptp-trip-foot button{border:0;border-radius:9px;background:#edf8f4;color:#0f705a;padding:6px 8px;font-size:8px;font-weight:900}.ptp-details{margin-top:7px;background:#f7f9f8;border-radius:10px;padding:8px;display:grid;gap:5px}.ptp-details div{display:flex;justify-content:space-between;gap:8px}.ptp-details span{font-size:8px;color:#7c8a84}.ptp-details b{font-size:8px;color:#2c4038;text-align:right}.ptp-empty{padding:20px 10px;background:#fff;border:1px dashed #d6e0dc;border-radius:13px;text-align:center;color:#74837d;font-size:10px}
      `}</style>

      <div className="ptp-hero">
        <div className="ptp-hero-icon">🧾</div>
        <div className="ptp-hero-copy"><strong>{ht ? 'Istorik trajè' : 'Historique des trajets'}</strong><small>{ht ? 'Gade trajè ou yo ak depans yo' : 'Consultez vos trajets et vos dépenses'}</small></div>
        <button className="ptp-close" type="button" onClick={() => { setOpen(false); setExpandedRide(null) }}>{ht ? 'Fèmen' : 'Fermer'}</button>
      </div>

      <div className="ptp-summary">
        <div className="ptp-stat"><span>{ht ? 'Trajè' : 'Trajets'}</span><strong>{shown.length}</strong></div>
        <div className="ptp-stat"><span>{ht ? 'Depans' : 'Dépenses'}</span><strong>{totalSpent.toLocaleString('fr-HT')} HTG</strong></div>
      </div>

      <div className="ptp-filters">
        {([['today', ht ? 'Jodi a' : "Aujourd’hui"], ['7d', '7 jou'], ['30d', '30 jou'], ['all', ht ? 'Tout' : 'Tout']] as [Filter,string][]).map(([key, text]) => <button key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{text}</button>)}
      </div>

      {busy ? <div className="ptp-empty">{ht ? 'N ap chaje trajè yo…' : 'Chargement des trajets…'}</div> : shown.length === 0 ? <div className="ptp-empty">🚕 {ht ? 'Pa gen trajè nan peryòd sa a.' : 'Aucun trajet pour cette période.'}</div> : <div className="ptp-list">
        {shown.slice(0, 20).map((ride) => {
          const detailOpen = expandedRide === ride.id
          const fare = Number(ride.final_fare_htg ?? ride.estimated_fare_htg ?? 0)
          return <article className="ptp-trip" key={ride.id}>
            <div className="ptp-trip-head"><time>{new Date(ride.requested_at).toLocaleString(ht ? 'fr-HT' : 'fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</time><span className={`ptp-badge ${ride.status}`}>{statusLabel(ride.status, ht)}</span></div>
            <div className="ptp-route"><div><span>📍</span><strong>{ride.pickup_address || '—'}</strong></div><div><span>🏁</span><strong>{ride.destination_address || '—'}</strong></div></div>
            <div className="ptp-trip-foot"><strong>{fare.toLocaleString('fr-HT')} HTG</strong><button type="button" onClick={() => setExpandedRide(detailOpen ? null : ride.id)}>{detailOpen ? (ht ? 'Kache' : 'Masquer') : (ht ? 'Detay' : 'Détails')}</button></div>
            {detailOpen && <div className="ptp-details"><div><span>{ht ? 'Nimewo trajè' : 'N° trajet'}</span><b>#{ride.id.slice(0,8).toUpperCase()}</b></div><div><span>{ht ? 'Estati' : 'Statut'}</span><b>{statusLabel(ride.status, ht)}</b></div><div><span>{ht ? 'Dat ak lè' : 'Date et heure'}</span><b>{new Date(ride.requested_at).toLocaleString(ht ? 'fr-HT' : 'fr-FR')}</b></div></div>}
          </article>
        })}
      </div>}
    </section>,
    target,
  )
}
