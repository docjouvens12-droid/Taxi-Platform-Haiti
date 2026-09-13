'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Lang = 'fr' | 'ht'
type Filter = 'all' | 'new' | 'acknowledged' | 'resolved'
type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low'

type SafetyRow = {
  id: string
  ride_id: string
  passenger_id: string
  event_type: string
  severity: string
  details: Record<string, unknown> | null
  acknowledged_at: string | null
  resolved_at: string | null
  admin_note: string | null
  created_at: string
  passenger_name?: string | null
  driver_name?: string | null
  driver_id?: string | null
  pickup_address?: string | null
  destination_address?: string | null
}

type IncidentDetail = {
  event_id: string
  ride_id: string
  event_type: string
  severity: string
  acknowledged_at: string | null
  resolved_at: string | null
  created_at: string
  ride_status: string
  passenger_id: string
  passenger_name: string | null
  passenger_phone: string | null
  driver_id: string | null
  driver_name: string | null
  driver_phone: string | null
  pickup_address: string | null
  pickup_latitude: number | null
  pickup_longitude: number | null
  destination_address: string | null
  destination_latitude: number | null
  destination_longitude: number | null
  driver_latitude: number | null
  driver_longitude: number | null
  driver_heading: number | null
  driver_speed_kph: number | null
  driver_location_updated_at: string | null
}

const text = {
  fr: {
    title: 'Sécurité des trajets', subtitle: 'Surveillez, priorisez et traitez les alertes de sécurité', back: 'Tableau de bord', logout: 'Se déconnecter', loading: 'Chargement des alertes…', denied: 'Accès réservé aux administrateurs.', notSigned: 'Vous devez être connecté.', all: 'Toutes', fresh: 'Nouvelles', ack: 'Reconnues', resolved: 'Résolues', noAlerts: 'Aucune alerte dans cette catégorie.', passenger: 'Passager', driver: 'Chauffeur', route: 'Trajet', created: 'Détectée', status: 'Statut', type: 'Type', severity: 'Niveau', note: 'Note admin', resolve: 'Marquer résolue', reopen: 'Rouvrir', save: 'Enregistrer la note', saved: 'Mise à jour enregistrée.', error: 'Impossible de mettre à jour cette alerte.', stopped: 'Arrêt prolongé', deviation: 'Écart d’itinéraire', safetyOpen: 'Centre de sécurité ouvert', unknown: 'Alerte de sécurité', newStatus: 'Nouvelle', ackStatus: 'Reconnue', resolvedStatus: 'Résolue', live: 'Temps réel', track: 'Suivre le trajet', tracking: 'Suivi du trajet', close: 'Fermer', callPassenger: 'Appeler le passager', callDriver: 'Appeler le chauffeur', acknowledge: 'Reconnaître', gps: 'Position chauffeur', speed: 'Vitesse', lastGps: 'Dernier GPS', noGps: 'Position GPS indisponible', activeStatus: 'Statut du trajet', search: 'Rechercher passager, chauffeur, trajet ou type…', open: 'Alertes ouvertes', critical: 'Critiques', active: 'À traiter', severityFilter: 'Gravité'
  },
  ht: {
    title: 'Sekirite trajè yo', subtitle: 'Siveye, klase epi trete alèt sekirite yo', back: 'Dashboard', logout: 'Dekonekte', loading: 'N ap chaje alèt yo…', denied: 'Se administratè sèlman ki gen aksè.', notSigned: 'Ou dwe konekte.', all: 'Tout', fresh: 'Nouvo', ack: 'Rekonèt', resolved: 'Rezoud', noAlerts: 'Pa gen alèt nan kategori sa a.', passenger: 'Kliyan', driver: 'Chofè', route: 'Trajè', created: 'Detekte', status: 'Estati', type: 'Kalite', severity: 'Nivo', note: 'Nòt admin', resolve: 'Make kòm rezoud', reopen: 'Relouvri', save: 'Anrejistre nòt', saved: 'Mizajou anrejistre.', error: 'Nou pa ka modifye alèt sa a.', stopped: 'Machin kanpe lontan', deviation: 'Devyasyon wout', safetyOpen: 'Sant sekirite ouvri', unknown: 'Alèt sekirite', newStatus: 'Nouvo', ackStatus: 'Rekonèt', resolvedStatus: 'Rezoud', live: 'An tan reyèl', track: 'Swiv trajè', tracking: 'Swivi trajè', close: 'Fèmen', callPassenger: 'Rele kliyan', callDriver: 'Rele chofè', acknowledge: 'Rekonèt', gps: 'Pozisyon chofè', speed: 'Vitès', lastGps: 'Dènye GPS', noGps: 'Pozisyon GPS pa disponib', activeStatus: 'Estati trajè', search: 'Chèche kliyan, chofè, trajè oswa kalite…', open: 'Alèt ouvè', critical: 'Kritik', active: 'Pou trete', severityFilter: 'Gravite'
  },
}

const severityRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }

export default function AdminSafetyPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = text[lang]
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [rows, setRows] = useState<SafetyRow[]>([])
  const [filter, setFilter] = useState<Filter>('new')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [incident, setIncident] = useState<IncidentDetail | null>(null)
  const [incidentLoading, setIncidentLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('taxi-language') as Lang | null
    if (saved === 'fr' || saved === 'ht') setLang(saved)
    void init()
  }, [])

  useEffect(() => {
    if (!authorized) return
    const channel = supabase
      .channel('admin-safety-events-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_safety_events' }, () => {
        void loadAlerts(false)
        if (incident?.event_id) void loadIncident(incident.event_id, false)
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [authorized, incident?.event_id])

  useEffect(() => {
    if (!incident?.event_id) return
    const id = incident.event_id
    const timer = window.setInterval(() => void loadIncident(id, false), 5000)
    return () => window.clearInterval(timer)
  }, [incident?.event_id])

  async function init() {
    setBusy(true)
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) { setAuthorized(false); setMessage(t.notSigned); setBusy(false); return }
    const { data: me } = await supabase.from('profiles').select('role').eq('id', auth.user.id).maybeSingle()
    if (me?.role !== 'admin') { setAuthorized(false); setMessage(t.denied); setBusy(false); return }
    setAuthorized(true)
    await loadAlerts()
    setBusy(false)
  }

  async function loadAlerts(showBusy = true) {
    if (showBusy) setBusy(true)
    setMessage('')
    const { data: events, error } = await supabase.from('ride_safety_events').select('id,ride_id,passenger_id,event_type,severity,details,acknowledged_at,resolved_at,admin_note,created_at').order('created_at', { ascending: false }).limit(100)
    if (error) { setMessage(error.message); if (showBusy) setBusy(false); return }

    const base = (events ?? []) as SafetyRow[]
    const rideIds = Array.from(new Set(base.map((e) => e.ride_id)))
    const passengerIds = Array.from(new Set(base.map((e) => e.passenger_id)))
    const ridesResp = rideIds.length ? await supabase.from('rides').select('id,passenger_id,driver_id,pickup_address,destination_address').in('id', rideIds) : { data: [] as any[] }
    const rides = ridesResp.data ?? []
    const driverIds = Array.from(new Set(rides.map((r: any) => r.driver_id).filter(Boolean))) as string[]
    const profileIds = Array.from(new Set([...passengerIds, ...driverIds]))
    const profilesResp = profileIds.length ? await supabase.from('profiles').select('id,full_name').in('id', profileIds) : { data: [] as any[] }
    const rideMap = new Map(rides.map((r: any) => [r.id, r]))
    const profileMap = new Map((profilesResp.data ?? []).map((p: any) => [p.id, p.full_name]))

    const merged = base.map((event) => {
      const ride: any = rideMap.get(event.ride_id)
      return { ...event, passenger_name: profileMap.get(event.passenger_id) ?? null, driver_id: ride?.driver_id ?? null, driver_name: ride?.driver_id ? profileMap.get(ride.driver_id) ?? null : null, pickup_address: ride?.pickup_address ?? null, destination_address: ride?.destination_address ?? null }
    }).sort((a, b) => {
      const aOpen = !a.resolved_at ? 1 : 0
      const bOpen = !b.resolved_at ? 1 : 0
      if (aOpen !== bOpen) return bOpen - aOpen
      const severityDiff = (severityRank[b.severity] ?? 0) - (severityRank[a.severity] ?? 0)
      if (severityDiff) return severityDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    setRows(merged)
    setNotes(Object.fromEntries(merged.map((r) => [r.id, r.admin_note ?? ''])))
    if (showBusy) setBusy(false)
  }

  async function loadIncident(eventId: string, showBusy = true) {
    if (showBusy) setIncidentLoading(true)
    const { data, error } = await supabase.rpc('admin_get_safety_incident_detail', { p_event_id: eventId })
    if (!error) setIncident(((Array.isArray(data) ? data[0] : data) as IncidentDetail | null) ?? null)
    else if (showBusy) setMessage(error.message)
    if (showBusy) setIncidentLoading(false)
  }

  async function acknowledgeIncident() {
    if (!incident || incident.acknowledged_at) return
    const { error } = await supabase.from('ride_safety_events').update({ acknowledged_at: new Date().toISOString() }).eq('id', incident.event_id)
    if (!error) await Promise.all([loadAlerts(false), loadIncident(incident.event_id, false)])
  }

  async function updateEvent(row: SafetyRow, resolved: boolean) {
    setBusy(true); setMessage('')
    const { error } = await supabase.from('ride_safety_events').update({ resolved_at: resolved ? new Date().toISOString() : null, admin_note: notes[row.id]?.trim() || null }).eq('id', row.id)
    if (error) setMessage(`${t.error} ${error.message}`)
    else { setMessage(t.saved); await loadAlerts(); if (incident?.event_id === row.id) await loadIncident(row.id, false) }
    setBusy(false)
  }

  async function saveNote(row: SafetyRow) {
    setBusy(true); setMessage('')
    const { error } = await supabase.from('ride_safety_events').update({ admin_note: notes[row.id]?.trim() || null }).eq('id', row.id)
    if (error) setMessage(`${t.error} ${error.message}`)
    else { setMessage(t.saved); await loadAlerts() }
    setBusy(false)
  }

  async function logout() { await supabase.auth.signOut(); location.href = '/admin/login' }
  function changeLang(next: Lang) { setLang(next); localStorage.setItem('taxi-language', next) }

  const counts = useMemo(() => ({
    all: rows.length,
    new: rows.filter((r) => !r.acknowledged_at && !r.resolved_at).length,
    acknowledged: rows.filter((r) => r.acknowledged_at && !r.resolved_at).length,
    resolved: rows.filter((r) => r.resolved_at).length,
    open: rows.filter((r) => !r.resolved_at).length,
    critical: rows.filter((r) => !r.resolved_at && r.severity === 'critical').length,
  }), [rows])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      const statusOk = filter === 'all' ? true : filter === 'resolved' ? Boolean(r.resolved_at) : filter === 'acknowledged' ? Boolean(r.acknowledged_at) && !r.resolved_at : !r.acknowledged_at && !r.resolved_at
      const severityOk = severityFilter === 'all' || r.severity === severityFilter
      const hay = [r.passenger_name, r.driver_name, r.pickup_address, r.destination_address, r.event_type, r.severity, r.ride_id].filter(Boolean).join(' ').toLowerCase()
      return statusOk && severityOk && (!q || hay.includes(q))
    })
  }, [rows, filter, severityFilter, search])

  const mapUrl = useMemo(() => {
    if (!incident) return null
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!token) return null
    const pins: string[] = []
    if (incident.pickup_latitude != null && incident.pickup_longitude != null) pins.push(`pin-s-a+1b70eb(${incident.pickup_longitude},${incident.pickup_latitude})`)
    if (incident.destination_latitude != null && incident.destination_longitude != null) pins.push(`pin-s-b+102033(${incident.destination_longitude},${incident.destination_latitude})`)
    if (incident.driver_latitude != null && incident.driver_longitude != null) pins.push(`pin-l-car+e55353(${incident.driver_longitude},${incident.driver_latitude})`)
    if (!pins.length) return null
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pins.join(',')}/auto/720x360@2x?padding=42&access_token=${encodeURIComponent(token)}`
  }, [incident])

  const typeLabel = (value: string) => value === 'stalled' ? t.stopped : value === 'route_deviation' ? t.deviation : value === 'safety_opened' ? t.safetyOpen : t.unknown
  const statusLabel = (r: SafetyRow) => r.resolved_at ? t.resolvedStatus : r.acknowledged_at ? t.ackStatus : t.newStatus
  const statusClass = (r: SafetyRow) => r.resolved_at ? 'resolved' : r.acknowledged_at ? 'acknowledged' : 'new'
  const dateLabel = (value: string) => new Intl.DateTimeFormat(lang === 'ht' ? 'fr-HT' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  const telHref = (value: string | null) => value ? `tel:${value.replace(/[^+\d]/g, '')}` : undefined

  if (authorized === null) return <main className="page"><section className="card"><p>{t.loading}</p></section></main>
  if (!authorized) return <main className="page"><section className="card denied"><h1>{t.title}</h1><p>{message || t.denied}</p><button onClick={() => location.href = '/admin/login'}>Admin login</button></section></main>

  return <main className="page"><section className="card">
    <div className="topbar"><button className="back" onClick={() => location.href = '/admin'}>‹ {t.back}</button><div className="topActions"><span className="liveBadge">● {t.live}</span><select value={lang} onChange={(e) => changeLang(e.target.value as Lang)}><option value="fr">Français</option><option value="ht">Kreyòl</option></select><button className="logout" onClick={() => void logout()}>{t.logout}</button></div></div>
    <div className="brand"><span>T</span><div><strong>Taxi Platform Haiti</strong><small>Admin Safety Center</small></div></div>
    <div className="titleRow"><div><h1>{t.title}</h1><p>{t.subtitle}</p></div><button className="refresh" onClick={() => void loadAlerts()} disabled={busy}>↻</button></div>

    <div className="summary"><div className="open"><small>{t.open}</small><strong>{counts.open}</strong></div><div className="critical"><small>{t.critical}</small><strong>{counts.critical}</strong></div><div><small>{t.resolved}</small><strong>{counts.resolved}</strong></div><div><small>{t.all}</small><strong>{counts.all}</strong></div></div>

    <div className="controls"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} /><div className="filterGrid"><select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}><option value="new">{t.fresh} ({counts.new})</option><option value="acknowledged">{t.ack} ({counts.acknowledged})</option><option value="resolved">{t.resolved} ({counts.resolved})</option><option value="all">{t.all} ({counts.all})</option></select><select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}><option value="all">{t.severityFilter}: {t.all}</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div></div>

    {message && <div className="message">{message}</div>}
    {busy && <p className="muted">{t.loading}</p>}
    {!busy && visible.length === 0 && <div className="empty">{t.noAlerts}</div>}

    <div className="list">{visible.map((r) => <article className={`alert ${statusClass(r)} severity-${r.severity}`} key={r.id}>
      <div className="alertHead"><div><span className="kind">🛡 {typeLabel(r.event_type)}</span><strong>{r.passenger_name || t.passenger}</strong><small>{r.driver_name ? `${t.driver}: ${r.driver_name}` : t.driver}</small></div><div className="badgeStack"><span className={`severityBadge ${r.severity}`}>{r.severity || '—'}</span><span className={`status ${statusClass(r)}`}>{statusLabel(r)}</span></div></div>
      <div className="details"><div><span>{t.route}</span><strong>{r.pickup_address || '—'} → {r.destination_address || '—'}</strong></div><div><span>{t.created}</span><strong>{dateLabel(r.created_at)}</strong></div></div>
      <button className="track" onClick={() => void loadIncident(r.id)}>📍 {t.track}</button>
      <label className="note"><span>{t.note}</span><textarea value={notes[r.id] ?? ''} onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))} placeholder={t.note} /></label>
      <div className="actions"><button className="save" onClick={() => void saveNote(r)} disabled={busy}>{t.save}</button><button className={r.resolved_at ? 'reopen' : 'resolve'} onClick={() => void updateEvent(r, !r.resolved_at)} disabled={busy}>{r.resolved_at ? t.reopen : t.resolve}</button></div>
    </article>)}</div>
  </section>

  {(incident || incidentLoading) && <div className="incidentOverlay" role="dialog" aria-modal="true"><section className="incidentPanel"><div className="incidentHead"><div><small>🛡 {t.tracking}</small><h2>{incident ? typeLabel(incident.event_type) : t.loading}</h2></div><button onClick={() => setIncident(null)}>×</button></div>{incident && <>{mapUrl ? <img className="incidentMap" src={mapUrl} alt={t.gps} /> : <div className="noMap">{t.noGps}</div>}<div className="incidentGrid"><div><span>{t.passenger}</span><strong>{incident.passenger_name || '—'}</strong></div><div><span>{t.driver}</span><strong>{incident.driver_name || '—'}</strong></div><div><span>{t.activeStatus}</span><strong>{incident.ride_status}</strong></div><div><span>{t.speed}</span><strong>{incident.driver_speed_kph == null ? '—' : `${Math.round(incident.driver_speed_kph)} km/h`}</strong></div><div className="wide"><span>{t.route}</span><strong>{incident.pickup_address || '—'} → {incident.destination_address || '—'}</strong></div><div className="wide"><span>{t.lastGps}</span><strong>{incident.driver_location_updated_at ? dateLabel(incident.driver_location_updated_at) : '—'}</strong></div></div><div className="incidentActions">{incident.passenger_phone && <a href={telHref(incident.passenger_phone)}>☎ {t.callPassenger}</a>}{incident.driver_phone && <a href={telHref(incident.driver_phone)}>☎ {t.callDriver}</a>}{!incident.acknowledged_at && !incident.resolved_at && <button onClick={() => void acknowledgeIncident()}>✓ {t.acknowledge}</button>}<button className="closePanel" onClick={() => setIncident(null)}>{t.close}</button></div></>}</section></div>}

  <style jsx>{`
    .page{min-height:100vh;background:linear-gradient(160deg,#e7f0ff,#eef3f8 48%,#e8edf4);padding:24px;color:#102033;font-family:Inter,system-ui,sans-serif}.card{width:min(100%,940px);margin:auto;background:#fff;border-radius:28px;padding:24px;box-shadow:0 24px 70px rgba(18,36,61,.14);box-sizing:border-box}.denied{margin-top:8vh}.topbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px}.back{border:0;background:none;color:#185fc2;font-weight:900}.topActions{display:flex;gap:8px;align-items:center}.liveBadge{display:inline-flex;align-items:center;gap:5px;border-radius:999px;background:#e9f8f1;color:#087052;padding:7px 9px;font-size:10px;font-weight:900}.topActions select{border:1px solid #d8e1e9;border-radius:12px;background:#fff;padding:9px 11px}.logout{border:1px solid #efd4d4;border-radius:12px;background:#fff5f5;color:#9c2d2d;padding:9px 11px;font-weight:900}.brand{display:flex;gap:10px;align-items:center}.brand>span{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#1b70eb;color:#fff;font-weight:950}.brand strong,.brand small{display:block}.brand small{color:#77879a}.titleRow{display:flex;align-items:end;justify-content:space-between;gap:12px}.titleRow h1{font-size:30px;margin:18px 0 3px}.titleRow p{margin:0 0 16px;color:#78889a;font-size:12px}.refresh{width:42px;height:42px;border:0;border-radius:13px;background:#102033;color:#fff;font-size:18px;margin-bottom:12px}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:8px 0 14px}.summary>div{background:#f6f8fb;border:1px solid #e1e8ef;border-radius:15px;padding:12px}.summary small,.summary strong{display:block}.summary small{font-size:9px;color:#718192;text-transform:uppercase;font-weight:900}.summary strong{font-size:21px;margin-top:5px}.summary .open{background:#fff8e9}.summary .critical{background:#fff1f1}.summary .critical strong{color:#b42318}.controls{display:grid;gap:8px;margin-bottom:14px}.controls input,.controls select{min-height:44px;border:1px solid #d8e1e9;border-radius:13px;background:#fff;padding:10px 12px;font-size:13px;box-sizing:border-box}.controls input{width:100%;font-size:16px}.filterGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.message{padding:11px 13px;border-radius:12px;background:#eef5ff;color:#185fc2;font-size:12px;font-weight:750;margin-bottom:12px}.muted{color:#78889a}.empty{padding:30px;text-align:center;border:1px dashed #d7e0e8;border-radius:18px;color:#78889a}.list{display:grid;gap:14px}.alert{border:1px solid #dfe6ed;border-radius:20px;padding:16px;background:#fff;box-shadow:0 6px 18px rgba(18,36,61,.04)}.alert.new{border-left:4px solid #d97706}.alert.acknowledged{border-left:4px solid #1b70eb}.alert.resolved{border-left:4px solid #0f7a5d}.alert.severity-critical:not(.resolved){box-shadow:0 0 0 1px rgba(185,28,28,.06),0 10px 24px rgba(185,28,28,.08)}.alertHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.alertHead>div{min-width:0}.kind{display:block;color:#6d7d8d;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}.alertHead strong,.alertHead small{display:block}.alertHead strong{font-size:16px}.alertHead small{color:#7b8997;margin-top:3px}.badgeStack{display:grid;gap:5px;justify-items:end}.severityBadge,.status{border-radius:999px;padding:6px 9px;font-size:9px;font-weight:900;white-space:nowrap;text-transform:uppercase}.severityBadge.critical{background:#feecec;color:#b42318}.severityBadge.high{background:#fff1df;color:#9a5a00}.severityBadge.medium{background:#fff7d6;color:#7a6200}.severityBadge.low{background:#edf4ff;color:#275d9c}.status.new{background:#fff3df;color:#9a5a00}.status.acknowledged{background:#eaf2ff;color:#185fc2}.status.resolved{background:#e8f7f1;color:#0b6a50}.details{display:grid;gap:8px;margin-top:14px}.details>div{background:#f7f9fb;border-radius:12px;padding:10px;min-width:0}.details span,.details strong{display:block}.details span{font-size:9px;text-transform:uppercase;color:#8492a0;font-weight:900}.details strong{font-size:12px;margin-top:3px;overflow-wrap:anywhere}.track{width:100%;margin-top:10px;border:1px solid #cfe0fb;border-radius:12px;padding:11px;background:#eef5ff;color:#185fc2;font-weight:900}.note{display:grid;gap:6px;margin-top:12px}.note span{font-size:10px;font-weight:900;color:#718192}.note textarea{min-height:68px;resize:vertical;border:1px solid #dce4ec;border-radius:12px;padding:10px;font:inherit;font-size:12px;color:#102033;box-sizing:border-box;width:100%}.actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.actions button{border:0;border-radius:12px;padding:11px;font-weight:900}.save{background:#eef3f8;color:#334d66}.resolve{background:#1b70eb;color:#fff}.reopen{background:#fff2df;color:#9a5a00}.incidentOverlay{position:fixed;inset:0;z-index:17000;background:rgba(9,20,34,.52);display:flex;align-items:flex-end;justify-content:center;padding:16px;box-sizing:border-box;backdrop-filter:blur(4px)}.incidentPanel{width:min(100%,680px);max-height:92vh;overflow:auto;background:#fff;border-radius:24px;padding:16px;box-shadow:0 24px 80px rgba(0,0,0,.28)}.incidentHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.incidentHead small{font-size:10px;font-weight:900;color:#185fc2;text-transform:uppercase}.incidentHead h2{margin:4px 0 12px;font-size:22px}.incidentHead button{width:36px;height:36px;border:0;border-radius:12px;background:#eef3f8;font-size:24px;color:#334d66}.incidentMap{width:100%;height:auto;max-height:290px;object-fit:cover;border-radius:16px;border:1px solid #dce5ee}.noMap{padding:36px;text-align:center;background:#f6f8fb;border-radius:16px;color:#7b8997}.incidentGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.incidentGrid>div{background:#f7f9fb;border-radius:12px;padding:10px}.incidentGrid .wide{grid-column:1/-1}.incidentGrid span,.incidentGrid strong{display:block}.incidentGrid span{font-size:9px;text-transform:uppercase;color:#8492a0;font-weight:900}.incidentGrid strong{font-size:12px;margin-top:3px;overflow-wrap:anywhere}.incidentActions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.incidentActions a,.incidentActions button{min-height:43px;border:0;border-radius:12px;padding:10px;font-weight:900;text-decoration:none;display:flex;align-items:center;justify-content:center;box-sizing:border-box}.incidentActions a{background:#eaf2ff;color:#185fc2}.incidentActions button{background:#1b70eb;color:#fff}.incidentActions .closePanel{background:#eef3f8;color:#334d66}@media(max-width:650px){.page{padding:0}.card{min-height:100vh;border-radius:0;padding:18px 14px}.topbar{align-items:flex-start}.topActions{flex-direction:column;align-items:stretch}.summary{grid-template-columns:1fr 1fr}.filterGrid{grid-template-columns:1fr}.titleRow h1{font-size:26px}.actions{grid-template-columns:1fr}.incidentOverlay{padding:0}.incidentPanel{max-height:94vh;border-radius:24px 24px 0 0}.incidentGrid,.incidentActions{grid-template-columns:1fr}.incidentGrid .wide{grid-column:auto}}
  `}</style></main>
}
