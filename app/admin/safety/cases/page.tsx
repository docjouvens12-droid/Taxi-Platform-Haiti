'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../../lib/supabase'

type Lang = 'fr' | 'ht'
type SafetyEvent = {
  id: string
  ride_id: string
  passenger_id: string
  event_type: string
  severity: string
  acknowledged_at: string | null
  resolved_at: string | null
  admin_note: string | null
  assigned_admin_id: string | null
  assigned_at: string | null
  response_due_at: string | null
  created_at: string
  passenger_name?: string | null
  assigned_admin_name?: string | null
}
type ActionRow = {
  id: string
  safety_event_id: string
  admin_id: string
  action_type: string
  note: string | null
  created_at: string
  admin_name?: string | null
}
type IncidentDetail = {
  event_id: string
  ride_id: string
  ride_status: string
  passenger_name: string | null
  passenger_phone: string | null
  driver_name: string | null
  driver_phone: string | null
  pickup_address: string | null
  destination_address: string | null
}

const copy = {
  fr: {
    title: 'Dossiers d’intervention', subtitle: 'Attribuez, traitez et auditez chaque alerte de sécurité', back: 'Sécurité', loading: 'Chargement…', denied: 'Accès réservé aux administrateurs.', open: 'Ouverts', resolved: 'Résolus', overdue: 'En retard', take: 'Prendre en charge', mine: 'Pris en charge par vous', assigned: 'Pris en charge par', unassigned: 'Non attribué', timeline: 'Journal d’intervention', noActions: 'Aucune action enregistrée.', callPassenger: 'Appeler le passager', callDriver: 'Appeler le chauffeur', acknowledge: 'Reconnaître', resolve: 'Résoudre', reopen: 'Rouvrir', note: 'Note admin', saveNote: 'Enregistrer la note', route: 'Trajet', status: 'Statut', detected: 'Détectée', driver: 'Chauffeur', passenger: 'Passager', error: 'Impossible de terminer cette action.', responseTime: 'Temps de réponse', dueNow: 'À traiter maintenant', dueIn: 'À traiter dans', lateBy: 'En retard de'
  },
  ht: {
    title: 'Dosye entèvansyon', subtitle: 'Pran, trete epi verifye chak alèt sekirite', back: 'Sekirite', loading: 'N ap chaje…', denied: 'Se administratè sèlman ki gen aksè.', open: 'Ouvè', resolved: 'Rezoud', overdue: 'An reta', take: 'Pran dosye a', mine: 'Se ou ki pran dosye sa a', assigned: 'Dosye a sou', unassigned: 'Poko gen admin', timeline: 'Jounal entèvansyon', noActions: 'Poko gen okenn aksyon anrejistre.', callPassenger: 'Rele kliyan', callDriver: 'Rele chofè', acknowledge: 'Rekonèt', resolve: 'Rezoud', reopen: 'Relouvri', note: 'Nòt admin', saveNote: 'Anrejistre nòt', route: 'Trajè', status: 'Estati', detected: 'Detekte', driver: 'Chofè', passenger: 'Kliyan', error: 'Nou pa ka fini aksyon sa a.', responseTime: 'Tan repons', dueNow: 'Trete kounye a', dueIn: 'Pou trete nan', lateBy: 'An reta depi'
  }
}

const severityRank: Record<string, number> = { critical: 5, high: 4, warning: 3, medium: 3, low: 2 }

export default function AdminSafetyCasesPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = copy[lang]
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [events, setEvents] = useState<SafetyEvent[]>([])
  const [selected, setSelected] = useState<SafetyEvent | null>(null)
  const [detail, setDetail] = useState<IncidentDetail | null>(null)
  const [actions, setActions] = useState<ActionRow[]>([])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const saved = localStorage.getItem('taxi-language') as Lang | null
    if (saved === 'fr' || saved === 'ht') setLang(saved)
    void init()
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!authorized) return
    const channel = supabase.channel('admin-safety-cases-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_safety_events' }, () => void loadEvents(false))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ride_safety_actions' }, () => {
        if (selected) void loadActions(selected.id)
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [authorized, selected?.id])

  async function init() {
    setBusy(true)
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) { setAuthorized(false); setBusy(false); return }
    const { data: me } = await supabase.from('profiles').select('role').eq('id', auth.user.id).maybeSingle()
    if (me?.role !== 'admin') { setAuthorized(false); setBusy(false); return }
    setAdminId(auth.user.id)
    setAuthorized(true)
    await loadEvents()
    setBusy(false)
  }

  async function loadEvents(showBusy = true) {
    if (showBusy) setBusy(true)
    const { data, error } = await supabase.from('ride_safety_events')
      .select('id,ride_id,passenger_id,event_type,severity,acknowledged_at,resolved_at,admin_note,assigned_admin_id,assigned_at,response_due_at,created_at')
      .order('created_at', { ascending: false }).limit(100)
    if (error) { setMessage(error.message); if (showBusy) setBusy(false); return }
    const base = (data ?? []) as SafetyEvent[]
    const ids = Array.from(new Set([...base.map(x => x.passenger_id), ...base.map(x => x.assigned_admin_id).filter(Boolean) as string[]]))
    const { data: profiles } = ids.length ? await supabase.from('profiles').select('id,full_name').in('id', ids) : { data: [] as any[] }
    const names = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]))
    setEvents(base.map(x => ({ ...x, passenger_name: names.get(x.passenger_id) ?? null, assigned_admin_name: x.assigned_admin_id ? names.get(x.assigned_admin_id) ?? null : null })))
    if (showBusy) setBusy(false)
  }

  async function selectEvent(row: SafetyEvent) {
    setSelected(row)
    setNote(row.admin_note ?? '')
    const [{ data: d }] = await Promise.all([
      supabase.rpc('admin_get_safety_incident_detail', { p_event_id: row.id }),
      loadActions(row.id)
    ])
    setDetail((Array.isArray(d) ? d[0] : d) as IncidentDetail | null)
  }

  async function loadActions(eventId: string) {
    const { data } = await supabase.from('ride_safety_actions').select('id,safety_event_id,admin_id,action_type,note,created_at').eq('safety_event_id', eventId).order('created_at', { ascending: false })
    const rows = (data ?? []) as ActionRow[]
    const ids = Array.from(new Set(rows.map(x => x.admin_id)))
    const { data: profiles } = ids.length ? await supabase.from('profiles').select('id,full_name').in('id', ids) : { data: [] as any[] }
    const names = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]))
    setActions(rows.map(x => ({ ...x, admin_name: names.get(x.admin_id) ?? null })))
  }

  async function logAction(eventId: string, actionType: string, actionNote?: string | null) {
    if (!adminId) return
    await supabase.from('ride_safety_actions').insert({ safety_event_id: eventId, admin_id: adminId, action_type: actionType, note: actionNote?.trim() || null })
  }

  async function takeCase() {
    if (!selected || !adminId) return
    setBusy(true)
    const now = new Date().toISOString()
    const { error } = await supabase.from('ride_safety_events').update({ assigned_admin_id: adminId, assigned_at: now }).eq('id', selected.id)
    if (!error) {
      await logAction(selected.id, 'assigned')
      await Promise.all([loadEvents(false), loadActions(selected.id)])
      setSelected({ ...selected, assigned_admin_id: adminId, assigned_at: now })
    } else setMessage(`${t.error} ${error.message}`)
    setBusy(false)
  }

  async function acknowledge() {
    if (!selected || selected.acknowledged_at) return
    const now = new Date().toISOString()
    const { error } = await supabase.from('ride_safety_events').update({ acknowledged_at: now }).eq('id', selected.id)
    if (!error) {
      await logAction(selected.id, 'acknowledged')
      setSelected({ ...selected, acknowledged_at: now })
      await Promise.all([loadEvents(false), loadActions(selected.id)])
    }
  }

  async function saveNote() {
    if (!selected) return
    const { error } = await supabase.from('ride_safety_events').update({ admin_note: note.trim() || null }).eq('id', selected.id)
    if (!error) {
      await logAction(selected.id, 'note_saved', note)
      await Promise.all([loadEvents(false), loadActions(selected.id)])
    }
  }

  async function toggleResolved() {
    if (!selected) return
    const resolving = !selected.resolved_at
    const value = resolving ? new Date().toISOString() : null
    const { error } = await supabase.from('ride_safety_events').update({ resolved_at: value }).eq('id', selected.id)
    if (!error) {
      await logAction(selected.id, resolving ? 'resolved' : 'reopened')
      setSelected({ ...selected, resolved_at: value })
      await Promise.all([loadEvents(false), loadActions(selected.id)])
    }
  }

  async function recordCall(kind: 'passenger' | 'driver') {
    if (!selected) return
    await logAction(selected.id, kind === 'passenger' ? 'called_passenger' : 'called_driver')
    await loadActions(selected.id)
  }

  const isOverdue = (e: SafetyEvent) => Boolean(!e.resolved_at && !e.assigned_at && e.response_due_at && new Date(e.response_due_at).getTime() < nowMs)
  const dueLabel = (e: SafetyEvent) => {
    if (e.resolved_at) return t.resolved
    if (e.assigned_at) return lang === 'ht' ? 'Pran alè' : 'Pris en charge'
    if (!e.response_due_at) return '—'
    const diff = new Date(e.response_due_at).getTime() - nowMs
    const abs = Math.max(0, Math.abs(diff))
    const min = Math.floor(abs / 60000)
    const sec = Math.floor((abs % 60000) / 1000)
    if (diff <= 0) return `${t.lateBy} ${min}:${String(sec).padStart(2, '0')}`
    if (diff < 1000) return t.dueNow
    return `${t.dueIn} ${min}:${String(sec).padStart(2, '0')}`
  }

  const sortedEvents = useMemo(() => [...events].sort((a, b) => {
    const aResolved = a.resolved_at ? 1 : 0
    const bResolved = b.resolved_at ? 1 : 0
    if (aResolved !== bResolved) return aResolved - bResolved
    const aOver = isOverdue(a) ? 1 : 0
    const bOver = isOverdue(b) ? 1 : 0
    if (aOver !== bOver) return bOver - aOver
    const sev = (severityRank[b.severity] ?? 0) - (severityRank[a.severity] ?? 0)
    if (sev) return sev
    const aDue = a.response_due_at ? new Date(a.response_due_at).getTime() : Number.MAX_SAFE_INTEGER
    const bDue = b.response_due_at ? new Date(b.response_due_at).getTime() : Number.MAX_SAFE_INTEGER
    if (aDue !== bDue) return aDue - bDue
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  }), [events, nowMs])

  const openCount = useMemo(() => events.filter(x => !x.resolved_at).length, [events])
  const overdueCount = useMemo(() => events.filter(isOverdue).length, [events, nowMs])
  const resolvedCount = events.length - openCount
  const dateLabel = (v: string) => new Intl.DateTimeFormat(lang === 'ht' ? 'fr-HT' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v))
  const actionLabel = (a: string) => ({ assigned: lang === 'ht' ? 'Pran dosye a' : 'Prise en charge', acknowledged: t.acknowledge, called_passenger: t.callPassenger, called_driver: t.callDriver, note_saved: t.saveNote, resolved: t.resolve, reopened: t.reopen } as Record<string,string>)[a] || a
  const tel = (v: string | null) => v ? `tel:${v.replace(/[^+\d]/g, '')}` : undefined

  if (authorized === null) return <main className="page"><section className="card"><p>{t.loading}</p></section></main>
  if (!authorized) return <main className="page"><section className="card"><h1>{t.title}</h1><p>{t.denied}</p><button onClick={() => location.href='/admin/login'}>Admin login</button></section></main>

  return <main className="page"><section className="card">
    <div className="top"><button onClick={() => location.href='/admin/safety'}>‹ {t.back}</button><select value={lang} onChange={e => { const v=e.target.value as Lang; setLang(v); localStorage.setItem('taxi-language',v) }}><option value="fr">Français</option><option value="ht">Kreyòl</option></select></div>
    <div className="brand"><span>T</span><div><strong>Taxi Platform Haiti</strong><small>{t.subtitle}</small></div></div>
    <h1>{t.title}</h1>
    <div className="stats"><div><b>{openCount}</b><span>{t.open}</span></div><div className={overdueCount ? 'dangerStat' : ''}><b>{overdueCount}</b><span>{t.overdue}</span></div><div><b>{resolvedCount}</b><span>{t.resolved}</span></div></div>
    {message && <div className="message">{message}</div>}
    {busy && <p className="muted">{t.loading}</p>}
    <div className="grid">
      <div className="cases">{sortedEvents.map(e => <button key={e.id} className={`case ${selected?.id===e.id?'active':''} ${isOverdue(e)?'overdueCase':''}`} onClick={() => void selectEvent(e)}><div><strong>{e.passenger_name || t.passenger}</strong><span>{e.event_type.replaceAll('_',' ')} · {e.severity}</span>{isOverdue(e) && <em>⚠ {t.overdue}</em>}</div><small>{e.assigned_admin_name ? `${t.assigned} ${e.assigned_admin_name}` : t.unassigned}<br/>{dueLabel(e)}<br/>{dateLabel(e.created_at)}</small></button>)}</div>
      <div className="workspace">{!selected ? <div className="empty">← {t.title}</div> : <>
        <div className="caseHead"><div><small>{selected.event_type.replaceAll('_',' ')}</small><h2>{selected.passenger_name || t.passenger}</h2></div><span className={selected.resolved_at?'done':isOverdue(selected)?'lateState':'openState'}>{selected.resolved_at?t.resolved:isOverdue(selected)?t.overdue:t.open}</span></div>
        <div className={`sla ${isOverdue(selected)?'slaLate':''}`}><span>{t.responseTime}</span><strong>{dueLabel(selected)}</strong></div>
        <div className="meta"><div><span>{t.status}</span><strong>{detail?.ride_status || '—'}</strong></div><div><span>{t.driver}</span><strong>{detail?.driver_name || '—'}</strong></div><div className="wide"><span>{t.route}</span><strong>{detail ? `${detail.pickup_address || '—'} → ${detail.destination_address || '—'}` : '—'}</strong></div><div className="wide"><span>{t.detected}</span><strong>{dateLabel(selected.created_at)}</strong></div></div>
        <div className="assignment">{selected.assigned_admin_id===adminId ? <strong>✓ {t.mine}</strong> : selected.assigned_admin_name ? <span>{t.assigned} <b>{selected.assigned_admin_name}</b></span> : <button onClick={() => void takeCase()} disabled={busy}>👤 {t.take}</button>}</div>
        <div className="quick">
          {detail?.passenger_phone && <a href={tel(detail.passenger_phone)} onClick={() => void recordCall('passenger')}>☎ {t.callPassenger}</a>}
          {detail?.driver_phone && <a href={tel(detail.driver_phone)} onClick={() => void recordCall('driver')}>☎ {t.callDriver}</a>}
          {!selected.acknowledged_at && <button onClick={() => void acknowledge()}>✓ {t.acknowledge}</button>}
          <button onClick={() => void toggleResolved()}>{selected.resolved_at ? t.reopen : t.resolve}</button>
        </div>
        <label className="note"><span>{t.note}</span><textarea value={note} onChange={e=>setNote(e.target.value)} /><button onClick={() => void saveNote()}>{t.saveNote}</button></label>
        <div className="timeline"><h3>{t.timeline}</h3>{actions.length===0 ? <p>{t.noActions}</p> : actions.map(a => <div className="action" key={a.id}><span className="dot"/><div><strong>{actionLabel(a.action_type)}</strong><small>{a.admin_name || 'Admin'} · {dateLabel(a.created_at)}</small>{a.note && <p>{a.note}</p>}</div></div>)}</div>
      </>}</div>
    </div>
  </section>
  <style jsx>{`
    .page{min-height:100vh;background:linear-gradient(160deg,#e8f1ff,#eef3f8 48%,#e7edf3);padding:24px;color:#102033;font-family:Inter,system-ui,sans-serif}.card{width:min(100%,1100px);margin:auto;background:#fff;border-radius:28px;padding:24px;box-sizing:border-box;box-shadow:0 24px 70px rgba(18,36,61,.14)}.top{display:flex;justify-content:space-between}.top button{border:0;background:none;color:#185fc2;font-weight:900}.top select{border:1px solid #d8e1e9;border-radius:12px;padding:9px;background:white}.brand{display:flex;gap:10px;align-items:center;margin-top:18px}.brand>span{width:42px;height:42px;border-radius:13px;background:#1b70eb;color:#fff;display:grid;place-items:center;font-weight:950}.brand small,.brand strong{display:block}.brand small{color:#77879a}.card h1{font-size:30px;margin:18px 0}.stats{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}.stats div{min-width:100px;background:#f5f8fc;border-radius:14px;padding:12px}.stats .dangerStat{background:#fff0f0;color:#b42318}.stats b,.stats span{display:block}.stats b{font-size:22px}.stats span{font-size:10px;color:#718192;font-weight:900}.dangerStat span{color:#b42318}.grid{display:grid;grid-template-columns:340px 1fr;gap:16px}.cases{display:grid;gap:8px;align-content:start;max-height:70vh;overflow:auto}.case{border:1px solid #dfe7ef;border-radius:14px;background:#fff;padding:12px;text-align:left;display:flex;justify-content:space-between;gap:10px}.case.active{background:#eef5ff;border-color:#b9d2fb}.case.overdueCase{border-color:#f2b8b5;background:#fff8f7}.case strong,.case span,.case small,.case em{display:block}.case span{font-size:10px;color:#6e7f90;margin-top:3px}.case em{font-size:9px;font-style:normal;color:#b42318;font-weight:900;margin-top:5px}.case small{font-size:9px;color:#82909e;text-align:right}.workspace{border:1px solid #e0e7ef;border-radius:18px;padding:16px;min-height:440px}.empty{height:100%;display:grid;place-items:center;color:#82909e}.caseHead{display:flex;justify-content:space-between;gap:12px}.caseHead small{font-size:10px;color:#185fc2;text-transform:uppercase;font-weight:900}.caseHead h2{margin:3px 0 12px}.openState,.done,.lateState{padding:7px 9px;border-radius:999px;font-size:10px;font-weight:900;height:max-content}.openState{background:#fff1df;color:#9a5a00}.lateState{background:#ffe8e7;color:#b42318}.done{background:#e8f7f1;color:#0b6a50}.sla{display:flex;justify-content:space-between;gap:12px;align-items:center;background:#eef5ff;color:#185fc2;border-radius:12px;padding:10px 12px;margin-bottom:10px}.sla span{font-size:10px;text-transform:uppercase;font-weight:900}.sla strong{font-size:13px}.slaLate{background:#fff0f0;color:#b42318}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px}.meta>div{background:#f7f9fb;border-radius:12px;padding:10px}.meta .wide{grid-column:1/-1}.meta span,.meta strong{display:block}.meta span{font-size:9px;color:#8492a0;text-transform:uppercase;font-weight:900}.meta strong{font-size:12px;margin-top:3px}.assignment{margin-top:10px;padding:11px;background:#f5f8fc;border-radius:12px}.assignment button{border:0;border-radius:10px;padding:9px 11px;background:#102033;color:#fff;font-weight:900}.assignment strong{color:#087052}.quick{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:10px}.quick a,.quick button{border:0;border-radius:12px;padding:11px;text-decoration:none;text-align:center;font-weight:900;background:#eaf2ff;color:#185fc2}.quick button:last-child{background:#1b70eb;color:#fff}.note{display:grid;gap:6px;margin-top:12px}.note span{font-size:10px;font-weight:900;color:#718192}.note textarea{min-height:70px;border:1px solid #dce4ec;border-radius:12px;padding:10px;resize:vertical}.note button{justify-self:end;border:0;border-radius:10px;padding:9px 12px;background:#eef3f8;color:#334d66;font-weight:900}.timeline{margin-top:16px;border-top:1px solid #e4eaf0;padding-top:12px}.timeline h3{margin:0 0 12px}.action{display:grid;grid-template-columns:14px 1fr;gap:8px;margin:10px 0}.dot{width:9px;height:9px;background:#1b70eb;border-radius:50%;margin-top:4px}.action strong,.action small{display:block}.action small{font-size:10px;color:#7f8d99;margin-top:2px}.action p{margin:4px 0 0;font-size:12px}.message{padding:10px;background:#fff0f0;color:#9c2d2d;border-radius:10px;margin-bottom:10px}.muted{color:#78889a}@media(max-width:760px){.page{padding:0}.card{min-height:100vh;border-radius:0;padding:16px}.grid{grid-template-columns:1fr}.cases{max-height:260px}.workspace{min-height:360px}.meta,.quick{grid-template-columns:1fr}.meta .wide{grid-column:auto}}
  `}</style></main>
}
