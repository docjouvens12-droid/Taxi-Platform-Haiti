'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Lang = 'fr' | 'ht'
type Filter = 'all' | 'passed' | 'failed'
type CheckRow = { check_key: string; ok: boolean; detail: string }

const copy = {
  fr: {
    title: 'État du système', subtitle: 'Surveillez les services essentiels de Taxi Platform Haiti', loading: 'Vérification en cours…', denied: 'Accès réservé aux administrateurs.', healthy: 'Tous les systèmes sont opérationnels', issue: 'Intervention requise', refresh: 'Relancer les contrôles', back: 'Administration', passed: 'Opérationnels', failed: 'À vérifier', total: 'Contrôles', score: 'Disponibilité', allGood: 'Tous les contrôles critiques sont au vert.', someFail: 'Un ou plusieurs composants nécessitent une vérification.', lastCheck: 'Dernière vérification', all: 'Tous', showPassed: 'Réussis', showFailed: 'Échecs', noRows: 'Aucun contrôle dans ce filtre.', realtime: 'Surveillance système', detail: 'Détail du contrôle'
  },
  ht: {
    title: 'Eta sistèm nan', subtitle: 'Siveye sèvis enpòtan Taxi Platform Haiti yo', loading: 'N ap verifye sistèm nan…', denied: 'Se administratè sèlman ki gen aksè.', healthy: 'Tout sistèm yo ap fonksyone', issue: 'Bezwen entèvansyon', refresh: 'Relanse kontwòl yo', back: 'Administrasyon', passed: 'Ap fonksyone', failed: 'Pou verifye', total: 'Kontwòl', score: 'Disponibilite', allGood: 'Tout kontwòl kritik yo vèt.', someFail: 'Gen youn oswa plizyè sèvis ki bezwen verifye.', lastCheck: 'Dènye verifikasyon', all: 'Tout', showPassed: 'Ki pase', showFailed: 'Ki echwe', noRows: 'Pa gen kontwòl nan filtè sa a.', realtime: 'Siveyans sistèm', detail: 'Detay kontwòl la'
  }
}

const humanize = (key: string) => key
  .replace(/^check_/, '')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, c => c.toUpperCase())

export default function AdminSystemCheckPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [rows, setRows] = useState<CheckRow[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const t = copy[lang]

  useEffect(() => {
    const saved = localStorage.getItem('taxi-language') as Lang | null
    if (saved === 'fr' || saved === 'ht') setLang(saved)
    void init()
  }, [])

  async function init() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) { setAuthorized(false); setLoading(false); return }
    const { data: me } = await supabase.from('profiles').select('role').eq('id', auth.user.id).maybeSingle()
    if (me?.role !== 'admin') { setAuthorized(false); setLoading(false); return }
    setAuthorized(true)
    await load()
  }

  async function load() {
    setLoading(true)
    setMessage('')
    const { data, error } = await supabase.rpc('get_admin_system_health')
    if (error) setMessage(error.message)
    else {
      setRows((data ?? []) as CheckRow[])
      setLastChecked(new Date())
    }
    setLoading(false)
  }

  const passed = useMemo(() => rows.filter(r => r.ok).length, [rows])
  const failed = rows.length - passed
  const score = rows.length ? Math.round((passed / rows.length) * 100) : 0
  const visible = useMemo(() => rows.filter(r => filter === 'all' ? true : filter === 'passed' ? r.ok : !r.ok), [rows, filter])
  const dateLabel = (d: Date | null) => d ? new Intl.DateTimeFormat(lang === 'ht' ? 'fr-HT' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(d) : '—'

  if (authorized === null) return <main className="page"><section className="card"><p>{t.loading}</p></section></main>
  if (!authorized) return <main className="page"><section className="card denied"><span>🔒</span><h1>{t.title}</h1><p>{t.denied}</p><button onClick={() => location.href='/admin/login'}>Admin login</button></section></main>

  return <main className="page"><section className="card">
    <div className="top">
      <button className="back" onClick={() => location.href='/admin'}>‹ {t.back}</button>
      <div className="topRight"><span className="live">● {t.realtime}</span><select value={lang} onChange={e => { const v=e.target.value as Lang; setLang(v); localStorage.setItem('taxi-language', v) }}><option value="fr">Français</option><option value="ht">Kreyòl</option></select></div>
    </div>

    <div className="brand"><span>⚙️</span><div><strong>Taxi Platform Haiti</strong><small>{t.subtitle}</small></div></div>
    <div className="titleRow"><div><h1>{t.title}</h1><p>{t.subtitle}</p></div><button className="refresh" onClick={() => void load()} disabled={loading}>↻ {t.refresh}</button></div>

    <div className={`heroStatus ${failed === 0 && rows.length ? 'good' : 'bad'}`}>
      <div className="statusIcon">{failed === 0 && rows.length ? '✓' : '!'}</div>
      <div><small>{failed === 0 && rows.length ? t.healthy : t.issue}</small><strong>{failed === 0 && rows.length ? t.allGood : t.someFail}</strong><span>{t.lastCheck}: {dateLabel(lastChecked)}</span></div>
      <div className="score"><b>{score}%</b><span>{t.score}</span></div>
    </div>

    <div className="stats">
      <button className={filter==='passed' ? 'active passed' : 'passed'} onClick={() => setFilter('passed')}><span>✓</span><small>{t.passed}</small><strong>{passed}</strong></button>
      <button className={filter==='failed' ? 'active failed' : 'failed'} onClick={() => setFilter('failed')}><span>!</span><small>{t.failed}</small><strong>{failed}</strong></button>
      <button className={filter==='all' ? 'active' : ''} onClick={() => setFilter('all')}><span>≡</span><small>{t.total}</small><strong>{rows.length}</strong></button>
    </div>

    <div className="filters"><button className={filter==='all'?'active':''} onClick={() => setFilter('all')}>{t.all}</button><button className={filter==='passed'?'active':''} onClick={() => setFilter('passed')}>{t.showPassed}</button><button className={filter==='failed'?'active danger':''} onClick={() => setFilter('failed')}>{t.showFailed}</button></div>

    {message && <div className="message">⚠ {message}</div>}
    {loading ? <div className="loadingBox"><span className="spinner"/><p>{t.loading}</p></div> : visible.length === 0 ? <div className="empty">{t.noRows}</div> : <div className="checks">{visible.map(r => <article key={r.check_key} className={r.ok ? 'ok' : 'fail'}>
      <span className="checkIcon">{r.ok ? '✓' : '!'}</span>
      <div className="checkBody"><div className="checkTitle"><strong>{humanize(r.check_key)}</strong><em>{r.ok ? t.passed : t.failed}</em></div><p>{r.detail}</p><small>{t.detail}: {r.check_key}</small></div>
    </article>)}</div>}
  </section>

  <style jsx>{`
    .page{min-height:100vh;background:radial-gradient(circle at 50% -10%,#dceee8 0,#eef3f1 34%,#e7ecef 100%);padding:18px;color:#102033;font-family:Inter,system-ui,sans-serif}.card{width:min(100%,920px);margin:auto;background:rgba(255,255,255,.97);border:1px solid #dce7e3;border-radius:28px;padding:22px;box-shadow:0 24px 70px rgba(16,32,51,.13);box-sizing:border-box}.top{display:flex;align-items:center;justify-content:space-between;gap:12px}.back{border:0;background:none;color:#0f705a;font-weight:900}.topRight{display:flex;align-items:center;gap:8px}.live{font-size:10px;font-weight:900;color:#087052;background:#edf8f4;border:1px solid #d8ece5;padding:7px 9px;border-radius:999px}.top select{border:1px solid #d8e4df;border-radius:12px;padding:9px;background:#fff}.brand{display:flex;gap:10px;align-items:center;margin-top:20px}.brand>span{width:44px;height:44px;border-radius:14px;background:#0f705a;color:#fff;display:grid;place-items:center;font-size:21px}.brand strong,.brand small{display:block}.brand small{color:#77879a;margin-top:2px}.titleRow{display:flex;align-items:end;justify-content:space-between;gap:14px;margin-top:17px}.titleRow h1{font-size:30px;margin:0 0 4px}.titleRow p{margin:0;color:#78889a;font-size:12px}.refresh{border:1px solid #d9e5e0;border-radius:13px;background:#fff;color:#0f705a;padding:10px 12px;font-weight:900;white-space:nowrap}.heroStatus{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:13px;margin:18px 0 12px;border-radius:19px;padding:15px;border:1px solid}.heroStatus.good{background:#edf8f4;border-color:#d4eadf;color:#0b6a50}.heroStatus.bad{background:#fff5f5;border-color:#f1d7d7;color:#9d3232}.statusIcon{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:#fff;font-size:21px;font-weight:950}.heroStatus small,.heroStatus strong,.heroStatus span{display:block}.heroStatus small{font-size:10px;text-transform:uppercase;font-weight:950}.heroStatus strong{font-size:13px;margin-top:3px}.heroStatus span{font-size:10px;margin-top:4px;opacity:.78}.score{text-align:center;min-width:72px}.score b{display:block;font-size:22px}.score span{font-size:9px;margin-top:1px;text-transform:uppercase;font-weight:900}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.stats button{display:grid;grid-template-columns:32px 1fr;grid-template-rows:auto auto;gap:0 9px;text-align:left;border:1px solid #dfe8e4;border-radius:16px;background:#f8faf9;padding:12px;color:#4c615a}.stats button>span{grid-row:1/3;width:32px;height:32px;border-radius:10px;background:#edf3f0;display:grid;place-items:center;font-weight:950}.stats small{font-size:9px;text-transform:uppercase;font-weight:900;color:#7d8b86}.stats strong{font-size:19px}.stats .passed>span{background:#e4f5ed;color:#087052}.stats .failed>span{background:#ffeaea;color:#a12e2e}.stats button.active{border-color:#8fc9b7;box-shadow:0 0 0 2px rgba(15,112,90,.07)}.filters{display:flex;gap:7px;margin:14px 0}.filters button{border:1px solid #dfe7e3;border-radius:999px;background:#fff;color:#5d7069;padding:8px 11px;font-size:11px;font-weight:900}.filters button.active{background:#e9f6f1;border-color:#a8d5c7;color:#0f705a}.filters button.active.danger{background:#fff0f0;border-color:#edc8c8;color:#a12e2e}.message{background:#fff0f0;color:#9b2c2c;border-radius:13px;padding:11px 13px;margin-bottom:12px;font-size:12px}.checks{display:grid;gap:10px}.checks article{display:flex;align-items:flex-start;gap:11px;border:1px solid #dfe7e3;border-radius:17px;padding:13px;background:#fff}.checks article.ok{border-left:4px solid #0f7a5d}.checks article.fail{border-left:4px solid #c83c3c;background:#fffafa}.checkIcon{flex:0 0 auto;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;font-weight:950}.ok .checkIcon{background:#e5f5ee;color:#087052}.fail .checkIcon{background:#ffe8e8;color:#a12e2e}.checkBody{min-width:0;flex:1}.checkTitle{display:flex;align-items:center;justify-content:space-between;gap:10px}.checkTitle strong{font-size:13px}.checkTitle em{font-style:normal;font-size:9px;font-weight:900;text-transform:uppercase;border-radius:999px;padding:5px 7px;background:#f0f5f3;color:#5d7069}.fail .checkTitle em{background:#fff0f0;color:#a12e2e}.checkBody p{font-size:12px;line-height:1.45;color:#4f625b;margin:7px 0 4px;overflow-wrap:anywhere}.checkBody small{font-size:9px;color:#8a9893;overflow-wrap:anywhere}.loadingBox,.empty{padding:32px;text-align:center;border:1px dashed #d6e1dc;border-radius:18px;color:#788984}.spinner{display:inline-block;width:24px;height:24px;border:3px solid #dce8e3;border-top-color:#0f705a;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.denied{text-align:center;margin-top:12vh}.denied>span{font-size:34px}.denied button{border:0;border-radius:13px;background:#0f705a;color:#fff;padding:12px 16px;font-weight:900}@media(max-width:650px){.page{padding:0}.card{min-height:100vh;border-radius:0;padding:17px 14px}.titleRow{align-items:flex-start;flex-direction:column}.titleRow h1{font-size:26px}.refresh{width:100%}.heroStatus{grid-template-columns:auto 1fr}.score{grid-column:1/-1;text-align:left;display:flex;align-items:center;gap:7px}.score b{font-size:18px}.score span{margin:0}.stats{grid-template-columns:1fr 1fr 1fr}.stats button{grid-template-columns:1fr;text-align:center;place-items:center;gap:4px}.stats button>span{grid-row:auto}.topRight{gap:5px}.live{display:none}.checkTitle{align-items:flex-start;flex-direction:column;gap:5px}}@media(max-width:390px){.stats{grid-template-columns:1fr}.stats button{grid-template-columns:32px 1fr;grid-template-rows:auto auto;text-align:left;place-items:initial}.stats button>span{grid-row:1/3}}
  `}</style>
  </main>
}
