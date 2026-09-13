'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Lang = 'fr' | 'ht'
type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded'
type PaymentRow = {
  id: string
  ride_id: string
  passenger_id: string
  amount_htg: number | string
  method: string
  status: PaymentStatus
  platform_fee_percent: number | string
  platform_fee_htg: number | string | null
  driver_net_htg: number | string | null
  provider: string | null
  provider_status: string | null
  created_at: string
  passenger_name?: string | null
  driver_name?: string | null
  driver_id?: string | null
  pickup_address?: string | null
  destination_address?: string | null
}

const copy = {
  fr: {
    title: 'Paiements & commissions', subtitle: 'Vue financière de Taxi Platform Haiti', back: 'Tableau de bord', loading: 'Chargement des paiements…', denied: 'Accès réservé aux administrateurs.', all: 'Tous', pending: 'En attente', authorized: 'Autorisé', paid: 'Payé', failed: 'Échoué', refunded: 'Remboursé', gross: 'Montant brut', fee: 'Commission plateforme', driverNet: 'Net chauffeur', transactions: 'Transactions', method: 'Méthode', status: 'Statut', passenger: 'Passager', driver: 'Chauffeur', route: 'Trajet', created: 'Créé', noRows: 'Aucun paiement ne correspond à votre recherche.', todayFee: "Commission aujourd’hui", totalFee: 'Commission totale', pendingAmount: 'Montant à traiter', live: 'Temps réel', search: 'Rechercher un passager, chauffeur, trajet ou moyen de paiement…', refresh: 'Actualiser', finance: 'Résumé financier', transactionList: 'Dernières transactions', paidAmount: 'Montant payé', mobileMoney: 'Mobile money', cash: 'Espèces'
  },
  ht: {
    title: 'Peman & komisyon', subtitle: 'Apèsi finansye Taxi Platform Haiti', back: 'Dashboard', loading: 'N ap chaje peman yo…', denied: 'Se administratè sèlman ki gen aksè.', all: 'Tout', pending: 'Ap tann', authorized: 'Otorize', paid: 'Peye', failed: 'Echwe', refunded: 'Ranbouse', gross: 'Montan brit', fee: 'Komisyon platfòm', driverNet: 'Net chofè', transactions: 'Tranzaksyon', method: 'Metòd', status: 'Estati', passenger: 'Kliyan', driver: 'Chofè', route: 'Trajè', created: 'Kreye', noRows: 'Pa gen peman ki koresponn ak rechèch ou a.', todayFee: 'Komisyon jodi a', totalFee: 'Komisyon total', pendingAmount: 'Montan pou trete', live: 'An tan reyèl', search: 'Chèche kliyan, chofè, trajè oswa metòd peman…', refresh: 'Rafrechi', finance: 'Rezime finansye', transactionList: 'Dènye tranzaksyon yo', paidAmount: 'Montan ki peye', mobileMoney: 'Mobile money', cash: 'Lajan kach'
  }
}

export default function AdminPaymentsPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = copy[lang]
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [filter, setFilter] = useState<'all' | PaymentStatus>('all')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('taxi-language') as Lang | null
    if (saved === 'fr' || saved === 'ht') setLang(saved)
    void init()
  }, [])

  useEffect(() => {
    if (!authorized) return
    const channel = supabase.channel('admin-payments-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => void loadPayments(false))
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [authorized])

  async function init() {
    setBusy(true)
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) { setAuthorized(false); setBusy(false); return }
    const { data: me } = await supabase.from('profiles').select('role').eq('id', auth.user.id).maybeSingle()
    if (me?.role !== 'admin') { setAuthorized(false); setBusy(false); return }
    setAuthorized(true)
    await loadPayments()
    setBusy(false)
  }

  async function loadPayments(showBusy = true) {
    if (showBusy) setBusy(true)
    setMessage('')
    const { data: payments, error } = await supabase
      .from('payments')
      .select('id,ride_id,passenger_id,amount_htg,method,status,platform_fee_percent,platform_fee_htg,driver_net_htg,provider,provider_status,created_at')
      .order('created_at', { ascending: false })
      .limit(250)
    if (error) {
      setMessage(error.message)
      if (showBusy) setBusy(false)
      return
    }

    const base = (payments ?? []) as PaymentRow[]
    const rideIds = Array.from(new Set(base.map(p => p.ride_id)))
    const passengerIds = Array.from(new Set(base.map(p => p.passenger_id)))
    const { data: rides } = rideIds.length
      ? await supabase.from('rides').select('id,driver_id,pickup_address,destination_address').in('id', rideIds)
      : { data: [] as any[] }
    const driverIds = Array.from(new Set((rides ?? []).map((r: any) => r.driver_id).filter(Boolean))) as string[]
    const profileIds = Array.from(new Set([...passengerIds, ...driverIds]))
    const { data: profiles } = profileIds.length
      ? await supabase.from('profiles').select('id,full_name').in('id', profileIds)
      : { data: [] as any[] }

    const rideMap = new Map((rides ?? []).map((r: any) => [r.id, r]))
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]))
    setRows(base.map(p => {
      const ride: any = rideMap.get(p.ride_id)
      return {
        ...p,
        passenger_name: profileMap.get(p.passenger_id) ?? null,
        driver_id: ride?.driver_id ?? null,
        driver_name: ride?.driver_id ? profileMap.get(ride.driver_id) ?? null : null,
        pickup_address: ride?.pickup_address ?? null,
        destination_address: ride?.destination_address ?? null,
      }
    }))
    if (showBusy) setBusy(false)
  }

  const number = (v: number | string | null | undefined) => Number(v ?? 0)
  const money = (v: number | string | null | undefined) => `${number(v).toLocaleString('fr-HT', { maximumFractionDigits: 2 })} HTG`
  const methodLabel = (r: PaymentRow) => r.provider?.toLowerCase() === 'moncash' ? 'MonCash' : r.provider?.toLowerCase() === 'natcash' ? 'NatCash' : r.method === 'mobile_money' ? 'Mobile Money' : r.method === 'card' ? (lang === 'ht' ? 'Kat' : 'Carte') : t.cash
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(r => {
      if (filter !== 'all' && r.status !== filter) return false
      if (!q) return true
      return [r.passenger_name, r.driver_name, r.pickup_address, r.destination_address, r.provider, r.method, r.status, r.ride_id]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [rows, filter, query])

  const startToday = new Date(); startToday.setHours(0,0,0,0)
  const totalFee = rows.reduce((s, r) => s + number(r.platform_fee_htg), 0)
  const todayFee = rows.filter(r => new Date(r.created_at) >= startToday).reduce((s, r) => s + number(r.platform_fee_htg), 0)
  const pendingAmount = rows.filter(r => r.status === 'pending' || r.status === 'authorized').reduce((s, r) => s + number(r.amount_htg), 0)
  const paidAmount = rows.filter(r => r.status === 'paid').reduce((s, r) => s + number(r.amount_htg), 0)
  const mobileMoneyCount = rows.filter(r => r.method === 'mobile_money').length
  const cashCount = rows.filter(r => r.method === 'cash').length
  const dateLabel = (v: string) => new Intl.DateTimeFormat(lang === 'ht' ? 'fr-HT' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v))
  const statusLabel = (s: PaymentStatus) => t[s]

  if (authorized === null) return <main className="page"><section className="card"><p>{t.loading}</p></section></main>
  if (!authorized) return <main className="page"><section className="card denied"><h1>{t.title}</h1><p>{t.denied}</p><button onClick={() => location.href='/admin/login'}>Admin login</button></section></main>

  return <main className="page"><section className="card">
    <div className="topbar">
      <button className="back" onClick={() => location.href='/admin'}>← {t.back}</button>
      <div className="topactions"><span className="live">● {t.live}</span><select value={lang} onChange={e => { const v=e.target.value as Lang; setLang(v); localStorage.setItem('taxi-language',v) }}><option value="fr">Français</option><option value="ht">Kreyòl</option></select></div>
    </div>

    <div className="hero">
      <div className="brandmark">T</div>
      <div><span className="eyebrow">Taxi Platform Haiti · Admin</span><h1>{t.title}</h1><p>{t.subtitle}</p></div>
    </div>

    <section className="finance-section">
      <div className="section-head"><div><span>💼</span><div><strong>{t.finance}</strong><small>{rows.length} {t.transactions.toLowerCase()}</small></div></div><button onClick={() => void loadPayments()} disabled={busy}>↻ {t.refresh}</button></div>
      <div className="stats">
        <div className="stat primary"><small>{t.totalFee}</small><strong>{money(totalFee)}</strong><span>{number(rows[0]?.platform_fee_percent || 15)}% plateforme</span></div>
        <div className="stat"><small>{t.todayFee}</small><strong>{money(todayFee)}</strong><span>{new Date().toLocaleDateString('fr-HT')}</span></div>
        <div className="stat warning"><small>{t.pendingAmount}</small><strong>{money(pendingAmount)}</strong><span>{rows.filter(r => r.status === 'pending' || r.status === 'authorized').length} {t.transactions.toLowerCase()}</span></div>
        <div className="stat success"><small>{t.paidAmount}</small><strong>{money(paidAmount)}</strong><span>{rows.filter(r => r.status === 'paid').length} {t.paid.toLowerCase()}</span></div>
      </div>
      <div className="method-summary"><div><span>📱</span><div><small>{t.mobileMoney}</small><strong>{mobileMoneyCount}</strong></div></div><div><span>💵</span><div><small>{t.cash}</small><strong>{cashCount}</strong></div></div><div><span>🧾</span><div><small>{t.transactions}</small><strong>{rows.length}</strong></div></div></div>
    </section>

    <section className="transactions-section">
      <div className="transactions-title"><div><span>↕</span><div><strong>{t.transactionList}</strong><small>{visible.length} / {rows.length}</small></div></div></div>
      <div className="toolbar">
        <div className="search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search} /></div>
        <select value={filter} onChange={e => setFilter(e.target.value as any)}><option value="all">{t.all}</option><option value="pending">{t.pending}</option><option value="authorized">{t.authorized}</option><option value="paid">{t.paid}</option><option value="failed">{t.failed}</option><option value="refunded">{t.refunded}</option></select>
      </div>

      {message && <div className="message">{message}</div>}
      {busy && <p className="muted">{t.loading}</p>}
      {!busy && visible.length === 0 && <div className="empty">{t.noRows}</div>}

      <div className="list">{visible.map(r => <article key={r.id} className="payment">
        <div className="head"><div className="who"><div className="avatar">{(r.passenger_name || 'P').slice(0,1).toUpperCase()}</div><div><strong>{r.passenger_name || t.passenger}</strong><small>{r.driver_name ? `${t.driver}: ${r.driver_name}` : t.driver}</small></div></div><span className={`status ${r.status}`}>{statusLabel(r.status)}</span></div>
        <div className="money-grid"><div><small>{t.gross}</small><strong>{money(r.amount_htg)}</strong></div><div className="fee"><small>{t.fee} · {number(r.platform_fee_percent)}%</small><strong>{money(r.platform_fee_htg)}</strong></div><div className="net"><small>{t.driverNet}</small><strong>{money(r.driver_net_htg)}</strong></div></div>
        <div className="meta"><span>💳 <b>{t.method}:</b> {methodLabel(r)}</span><span>🕒 <b>{t.created}:</b> {dateLabel(r.created_at)}</span></div>
        <div className="route"><small>{t.route}</small><strong><span className="dot pickup"></span>{r.pickup_address || '—'}</strong><strong><span className="dot destination"></span>{r.destination_address || '—'}</strong></div>
      </article>)}</div>
    </section>
  </section>
  <style jsx>{`
    .page{min-height:100vh;background:radial-gradient(circle at 50% -10%,#dceee8 0,#edf3f0 35%,#e7ecef 100%);padding:24px;color:#102033;font-family:Inter,system-ui,sans-serif;box-sizing:border-box}.card{width:min(100%,980px);margin:auto;background:#fbfdfc;border:1px solid rgba(213,225,220,.8);border-radius:30px;padding:22px;box-shadow:0 24px 75px rgba(16,32,51,.13);box-sizing:border-box}.denied{margin-top:8vh}.topbar{display:flex;justify-content:space-between;align-items:center;gap:12px}.back{border:1px solid #dfe8e4;background:#fff;border-radius:13px;padding:10px 13px;color:#0f6552;font-weight:900}.topactions{display:flex;gap:9px;align-items:center}.topactions select{border:1px solid #dce5e1;border-radius:12px;padding:9px 11px;background:#fff}.live{font-size:10px;font-weight:900;color:#0b805f;background:#eaf7f1;border:1px solid #cde9dd;border-radius:999px;padding:7px 9px}.hero{display:flex;align-items:center;gap:14px;padding:28px 3px 18px}.brandmark{width:52px;height:52px;border-radius:17px;display:grid;place-items:center;background:linear-gradient(145deg,#0f705a,#174d42);color:#fff;font-size:22px;font-weight:950;box-shadow:0 10px 24px rgba(15,112,90,.2)}.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#0f705a;font-weight:900}.hero h1{font-size:30px;line-height:1.05;margin:5px 0 6px}.hero p{margin:0;color:#74827d;font-size:13px}.finance-section,.transactions-section{background:#fff;border:1px solid #e0e9e5;border-radius:23px;padding:15px;margin-top:12px;box-shadow:0 8px 24px rgba(16,32,51,.045)}.section-head,.transactions-title{display:flex;justify-content:space-between;align-items:center;gap:10px}.section-head>div,.transactions-title>div{display:flex;align-items:center;gap:9px}.section-head>div>span,.transactions-title>div>span{width:34px;height:34px;border-radius:11px;background:#edf7f3;display:grid;place-items:center}.section-head strong,.section-head small,.transactions-title strong,.transactions-title small{display:block}.section-head small,.transactions-title small{font-size:10px;color:#80908a;margin-top:2px}.section-head button{border:1px solid #dce6e2;background:#fff;border-radius:11px;padding:9px 11px;color:#0f6f59;font-weight:850}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:13px}.stat{border:1px solid #e4ebe8;border-radius:16px;padding:12px;background:#f8faf9}.stat.primary{background:#eef8f4;border-color:#d4e9e0}.stat.warning{background:#fff8e9;border-color:#f0e2bc}.stat.success{background:#edf8f2;border-color:#d2eadd}.stat small,.stat strong,.stat span{display:block}.stat small{font-size:9px;color:#71817b;text-transform:uppercase;font-weight:900}.stat strong{font-size:17px;margin-top:5px}.stat span{font-size:9px;color:#8b9792;margin-top:4px}.method-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:9px}.method-summary>div{display:flex;gap:9px;align-items:center;background:#f7f9f8;border-radius:13px;padding:10px}.method-summary>div>span{font-size:18px}.method-summary small,.method-summary strong{display:block}.method-summary small{font-size:9px;color:#7d8b86}.method-summary strong{font-size:15px;margin-top:2px}.toolbar{display:grid;grid-template-columns:1fr 170px;gap:9px;margin-top:13px}.search{display:flex;align-items:center;gap:7px;background:#f7f9f8;border:1px solid #e0e8e5;border-radius:13px;padding:0 11px}.search input{width:100%;min-height:44px;border:0;background:transparent;outline:0;font-size:16px;color:#102033}.toolbar select{border:1px solid #dce6e2;border-radius:13px;background:#fff;padding:10px}.message{margin-top:12px;background:#fff1f1;color:#9b2c2c;border-radius:13px;padding:11px;font-weight:700}.muted{color:#7d8a86}.empty{padding:30px;text-align:center;border:1px dashed #cad9d4;border-radius:17px;color:#73837d;margin-top:12px}.list{display:grid;gap:11px;margin-top:12px}.payment{border:1px solid #e0e8e5;border-radius:18px;padding:13px;background:#fff;box-shadow:0 4px 13px rgba(16,32,51,.03)}.head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.who{display:flex;gap:10px;align-items:center}.avatar{width:38px;height:38px;border-radius:12px;background:#e9f5f0;color:#0f705a;display:grid;place-items:center;font-weight:950}.who strong,.who small{display:block}.who small{font-size:10px;color:#7c8a85;margin-top:2px}.status{height:max-content;border-radius:999px;padding:6px 9px;font-size:10px;font-weight:900}.status.pending{background:#fff4d8;color:#805c00}.status.authorized{background:#eaf2ff;color:#185fc2}.status.paid{background:#e7f7ef;color:#087052}.status.failed{background:#fff0f0;color:#a12e2e}.status.refunded{background:#f1edff;color:#6840a8}.money-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.money-grid>div{background:#f6f8f7;border-radius:13px;padding:10px}.money-grid .fee{background:#fff8eb}.money-grid .net{background:#edf8f3}.money-grid small,.money-grid strong{display:block}.money-grid small{font-size:9px;color:#74817c;font-weight:900}.money-grid strong{font-size:14px;margin-top:3px}.meta{display:flex;gap:16px;flex-wrap:wrap;margin-top:10px;font-size:11px;color:#65756f}.route{margin-top:10px;background:#f8faf9;border-radius:13px;padding:10px;display:grid;gap:7px}.route small{font-size:9px;color:#7b8984;text-transform:uppercase;font-weight:900}.route strong{font-size:11px;display:flex;align-items:flex-start;gap:7px}.dot{width:7px;height:7px;border-radius:50%;display:block;flex:0 0 7px;margin-top:4px}.pickup{background:#0f8067}.destination{background:#d14b4b}@media(max-width:700px){.page{padding:0}.card{min-height:100vh;border-radius:0;padding:16px 13px}.hero{padding:22px 2px 14px}.hero h1{font-size:25px}.brandmark{width:46px;height:46px;border-radius:15px}.stats{grid-template-columns:1fr 1fr}.toolbar{grid-template-columns:1fr}.money-grid{grid-template-columns:1fr}.method-summary{grid-template-columns:1fr 1fr 1fr}.finance-section,.transactions-section{border-radius:19px;padding:12px}.topbar{align-items:flex-start}.topactions{flex-direction:column;align-items:flex-end}.back{font-size:12px}.stat strong{font-size:15px}}@media(max-width:390px){.method-summary{grid-template-columns:1fr}.stats{grid-template-columns:1fr 1fr}.hero h1{font-size:23px}}
  `}</style>
  </main>
}
