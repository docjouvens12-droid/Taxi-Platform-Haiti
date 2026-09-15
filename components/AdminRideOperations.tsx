'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type Lang = 'fr' | 'ht'
type Ride = {
  id: string
  status: string
  passenger_id: string
  driver_id: string | null
  pickup_address: string | null
  destination_address: string | null
  pickup_latitude: number | null
  pickup_longitude: number | null
  destination_latitude: number | null
  destination_longitude: number | null
  estimated_fare_htg: number | null
  final_fare_htg: number | null
  requested_at: string
  completed_at: string | null
}
type DriverLocation = { driver_id: string; latitude: number; longitude: number; updated_at: string | null }
type Filter = 'all' | 'requested' | 'pickup' | 'in_progress' | 'completed' | 'attention'

const activeStatuses = ['requested', 'accepted', 'driver_arriving', 'in_progress']
const fields = 'id,status,passenger_id,driver_id,pickup_address,destination_address,pickup_latitude,pickup_longitude,destination_latitude,destination_longitude,estimated_fare_htg,final_fare_htg,requested_at,completed_at'

export default function AdminRideOperations({ lang, canViewSafety }: { lang: Lang; canViewSafety: boolean }) {
  const [rides, setRides] = useState<Ride[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [locations, setLocations] = useState<Record<string, DriverLocation>>({})
  const [openSafetyRideIds, setOpenSafetyRideIds] = useState<string[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    async function load() {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const [active, recent, safety] = await Promise.all([
        supabase.from('rides').select(fields).in('status', activeStatuses).order('requested_at', { ascending: false }).limit(80),
        supabase.from('rides').select(fields).in('status', ['completed', 'cancelled']).gte('requested_at', since).order('requested_at', { ascending: false }).limit(30),
        canViewSafety ? supabase.from('ride_safety_events').select('ride_id').is('acknowledged_at', null).is('resolved_at', null) : Promise.resolve({ data: [], error: null }),
      ])
      if (!alive) return
      if (active.error || recent.error) {
        setError(lang === 'ht' ? 'Nou pa rive chaje trajè yo.' : 'Impossible de charger les trajets.')
        setLoading(false)
        return
      }
      const list = [...((active.data ?? []) as Ride[]), ...((recent.data ?? []) as Ride[])]
      const ids = [...new Set(list.flatMap(ride => [ride.passenger_id, ride.driver_id].filter((id): id is string => Boolean(id))))]
      const driverIds = [...new Set(list.map(ride => ride.driver_id).filter((id): id is string => Boolean(id)))]
      const [profiles, driverLocations] = await Promise.all([
        ids.length ? supabase.from('profiles').select('id,full_name').in('id', ids) : Promise.resolve({ data: [] }),
        driverIds.length ? supabase.from('driver_locations').select('driver_id,latitude,longitude,updated_at').in('driver_id', driverIds) : Promise.resolve({ data: [] }),
      ])
      if (!alive) return
      setRides(list)
      setNames(Object.fromEntries((profiles.data ?? []).map(row => [row.id, row.full_name || '—'])))
      setLocations(Object.fromEntries(((driverLocations.data ?? []) as DriverLocation[]).map(row => [row.driver_id, row])))
      setOpenSafetyRideIds((safety.data ?? []).map(row => row.ride_id).filter((id): id is string => Boolean(id)))
      setError('')
      setLoading(false)
    }
    void load()
    const timer = window.setInterval(() => void load(), 8000)
    return () => { alive = false; window.clearInterval(timer) }
  }, [canViewSafety, lang])

  const labels = lang === 'ht' ? {
    title: 'Sant operasyon trajè', live: 'Mizajou chak 8 segonn', all: 'Tout', requested: 'K ap tann', pickup: 'Chofè ap vini', progress: 'An kou', completed: 'Fini', attention: 'Pou verifye', empty: 'Pa gen trajè nan kategori sa a.', passenger: 'Pasaje', driver: 'Chofè', pickupLabel: 'Kote pou pran', destination: 'Destinasyon', fare: 'Pri', location: 'Pozisyon chofè', updated: 'Dènye GPS', noGps: 'GPS chofè a pa disponib.', close: 'Fèmen', safety: 'Gade ensidan sekirite', unknown: 'Pa asiyen', refresh: 'Rafrechi paj la',
  } : {
    title: 'Centre des opérations', live: 'Actualisé toutes les 8 secondes', all: 'Tous', requested: 'En attente', pickup: 'Vers le client', progress: 'En cours', completed: 'Terminés', attention: 'À vérifier', empty: 'Aucun trajet dans cette catégorie.', passenger: 'Passager', driver: 'Chauffeur', pickupLabel: 'Prise en charge', destination: 'Destination', fare: 'Prix', location: 'Position chauffeur', updated: 'Dernier GPS', noGps: 'GPS du chauffeur indisponible.', close: 'Fermer', safety: 'Voir les incidents de sécurité', unknown: 'Non assigné', refresh: 'Actualiser la page',
  }
  const statusLabel = (status: string) => ({
    requested: labels.requested, accepted: labels.pickup, driver_arriving: lang === 'ht' ? 'Chofè rive' : 'Chauffeur arrivé', in_progress: labels.progress, completed: labels.completed, cancelled: lang === 'ht' ? 'Anile' : 'Annulé',
  }[status] || status)
  const count = (key: Filter) => rides.filter(ride => matches(ride, key)).length
  function matches(ride: Ride, key: Filter) {
    if (key === 'all') return true
    if (key === 'pickup') return ride.status === 'accepted' || ride.status === 'driver_arriving'
    if (key === 'attention') return ride.status === 'cancelled' || openSafetyRideIds.includes(ride.id)
    return ride.status === key
  }
  const visible = rides.filter(ride => matches(ride, filter)).slice(0, 30)
  const selected = rides.find(ride => ride.id === selectedId) ?? null
  const location = selected?.driver_id ? locations[selected.driver_id] : null
  const mapUrl = useMemo(() => {
    if (!selected) return null
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!token) return null
    const pins: string[] = []
    if (location && Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude))) pins.push(`pin-s-car+126d5a(${location.longitude},${location.latitude})`)
    if (selected.pickup_latitude != null && selected.pickup_longitude != null) pins.push(`pin-s-a+2563eb(${selected.pickup_longitude},${selected.pickup_latitude})`)
    if (selected.destination_latitude != null && selected.destination_longitude != null) pins.push(`pin-s-b+ef4444(${selected.destination_longitude},${selected.destination_latitude})`)
    if (!pins.length) return null
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pins.join(',')}/auto/700x350@2x?padding=48&access_token=${encodeURIComponent(token)}`
  }, [selected, location])

  return <section className="operations" aria-label={labels.title}>
    <div className="operationsHead"><div><small>● LIVE</small><h2>{labels.title}</h2><p>{labels.live}</p></div><button type="button" onClick={() => window.location.reload()}>{labels.refresh}</button></div>
    <div className="filters" role="group" aria-label={labels.title}>
      {([['all', labels.all], ['requested', labels.requested], ['pickup', labels.pickup], ['in_progress', labels.progress], ['completed', labels.completed], ['attention', labels.attention]] as [Filter, string][]).map(([key, title]) => <button key={key} type="button" className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)}>{title}<b>{count(key)}</b></button>)}
    </div>
    {error ? <p className="empty">{error}</p> : loading ? <p className="empty">{lang === 'ht' ? 'N ap chaje trajè yo…' : 'Chargement des trajets…'}</p> : visible.length === 0 ? <p className="empty">{labels.empty}</p> : <div className="rideList">{visible.map(ride => <button key={ride.id} type="button" className="rideRow" onClick={() => setSelectedId(ride.id)}>
      <span className={`status ${ride.status}`}>{statusLabel(ride.status)}</span><strong>{ride.pickup_address || '—'} → {ride.destination_address || '—'}</strong><small>{names[ride.passenger_id] || labels.passenger} · {ride.driver_id ? names[ride.driver_id] || labels.driver : labels.unknown}</small>{openSafetyRideIds.includes(ride.id) && <em>⚠ {labels.attention}</em>}
    </button>)}</div>}
    {selected && <div className="shade" role="presentation" onClick={() => setSelectedId(null)}><div className="detail" role="dialog" aria-modal="true" aria-label={`${labels.title}: ${statusLabel(selected.status)}`} onClick={event => event.stopPropagation()}><header><div><small>{statusLabel(selected.status)}</small><h3>{selected.id.slice(0, 8)}</h3></div><button type="button" onClick={() => setSelectedId(null)} aria-label={labels.close}>×</button></header>
      {mapUrl ? <img className="rideMap" src={mapUrl} alt={labels.location} /> : <p className="noMap">{labels.noGps}</p>}
      <div className="detailGrid"><div><small>{labels.passenger}</small><strong>{names[selected.passenger_id] || '—'}</strong></div><div><small>{labels.driver}</small><strong>{selected.driver_id ? names[selected.driver_id] || '—' : labels.unknown}</strong></div><div><small>{labels.pickupLabel}</small><strong>{selected.pickup_address || '—'}</strong></div><div><small>{labels.destination}</small><strong>{selected.destination_address || '—'}</strong></div><div><small>{labels.fare}</small><strong>{selected.final_fare_htg ?? selected.estimated_fare_htg ?? '—'} HTG</strong></div><div><small>{labels.updated}</small><strong>{location?.updated_at ? new Date(location.updated_at).toLocaleString(lang === 'ht' ? 'fr-HT' : 'fr-FR') : '—'}</strong></div></div>
      {canViewSafety && openSafetyRideIds.includes(selected.id) && <a className="safetyLink" href="/admin/safety">⚠ {labels.safety}</a>}
    </div></div>}
    <style jsx>{`
      .operations{margin:16px 0;background:#fff;border:1px solid #dce7e3;border-radius:23px;padding:16px;box-shadow:0 10px 28px rgba(16,32,51,.06)}.operationsHead{display:flex;justify-content:space-between;align-items:center;gap:12px}.operationsHead small{color:#0f8065;font-size:9px;font-weight:950;letter-spacing:.12em}.operationsHead h2{margin:3px 0 0;font-size:20px}.operationsHead p{margin:3px 0 0;color:#75847e;font-size:10px}.operationsHead button{border:1px solid #d8e5df;background:#f6faf8;border-radius:12px;padding:9px;color:#0f705a;font-size:10px;font-weight:900}.filters{display:flex;gap:6px;overflow-x:auto;padding:15px 0 12px}.filters button{flex:0 0 auto;display:flex;align-items:center;gap:5px;border:1px solid #dce7e3;background:#f7faf9;border-radius:999px;padding:8px 10px;color:#51635b;font-size:10px;font-weight:850}.filters button.selected{background:#0f705a;border-color:#0f705a;color:#fff}.filters b{border-radius:999px;background:rgba(0,0,0,.08);padding:2px 5px;font-size:9px}.empty{padding:24px 10px;text-align:center;color:#75847e;font-size:12px}.rideList{display:grid;gap:7px;max-height:330px;overflow:auto}.rideRow{width:100%;display:grid;grid-template-columns:auto 1fr;gap:3px 10px;text-align:left;border:1px solid #e2ebe7;background:#f9fbfa;border-radius:14px;padding:10px;color:#102033}.rideRow .status{grid-row:1/3;align-self:center;border-radius:9px;background:#eaf3ef;color:#0f705a;padding:6px 7px;font-size:9px;font-weight:900}.rideRow .status.cancelled{background:#fff0f0;color:#a43a3a}.rideRow strong{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rideRow small{font-size:9px;color:#7a8984}.rideRow em{grid-column:2;color:#a43a3a;font-size:9px;font-style:normal;font-weight:900}.shade{position:fixed;inset:0;z-index:32000;background:rgba(10,22,34,.5);display:grid;place-items:center;padding:14px}.detail{width:min(100%,640px);max-height:92dvh;overflow:auto;background:#fff;border-radius:22px;padding:16px;box-shadow:0 24px 65px rgba(0,0,0,.25)}.detail header{display:flex;align-items:center;justify-content:space-between}.detail header small{color:#0f705a;font-size:10px;font-weight:900}.detail h3{margin:2px 0 12px;font-size:18px}.detail header button{width:34px;height:34px;border:0;border-radius:10px;background:#eef4f1;font-size:22px}.rideMap{display:block;width:100%;height:auto;border-radius:15px}.noMap{padding:35px 10px;text-align:center;background:#f5f8f7;border-radius:15px;color:#778782}.detailGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}.detailGrid>div{padding:10px;background:#f6faf8;border-radius:12px;min-width:0}.detailGrid small,.detailGrid strong{display:block}.detailGrid small{color:#7b8a83;font-size:9px}.detailGrid strong{margin-top:3px;font-size:11px;overflow-wrap:anywhere}.safetyLink{display:block;margin-top:11px;padding:11px;border-radius:12px;background:#fff1f1;color:#9a3434;text-decoration:none;font-size:11px;font-weight:900;text-align:center}@media(max-width:500px){.operations{padding:12px}.operationsHead h2{font-size:17px}.rideRow{grid-template-columns:1fr}.rideRow .status{grid-row:auto;justify-self:start}.rideRow em{grid-column:1}}
    `}</style>
  </section>
}
