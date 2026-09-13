'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Lang = 'fr' | 'ht'
type Provider = 'moncash' | 'natcash'
type Account = { provider: Provider; account_name: string; account_phone: string; enabled: boolean; updated_at?: string }

const empty: Record<Provider, Account> = {
  moncash: { provider: 'moncash', account_name: '', account_phone: '', enabled: false },
  natcash: { provider: 'natcash', account_name: '', account_phone: '', enabled: false },
}

export default function PlatformPaymentAccountsPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [accounts, setAccounts] = useState<Record<Provider, Account>>(empty)
  const [saving, setSaving] = useState<Provider | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('taxi-language') as Lang | null
    if (saved === 'fr' || saved === 'ht') setLang(saved)
    void load()
  }, [])

  async function load() {
    const { data: perms, error: permError } = await supabase.rpc('get_my_admin_permissions')
    const p = Array.isArray(perms) ? perms[0] : perms
    if (permError || !p?.is_super_admin) { setAllowed(false); return }
    setAllowed(true)
    const { data, error } = await supabase.rpc('super_admin_get_platform_payment_accounts')
    if (error) { setMessage(error.message); return }
    const next = { ...empty }
    for (const row of (data ?? []) as Account[]) next[row.provider] = { ...row }
    setAccounts(next)
  }

  function update(provider: Provider, patch: Partial<Account>) {
    setAccounts(current => ({ ...current, [provider]: { ...current[provider], ...patch } }))
  }

  async function save(provider: Provider) {
    const account = accounts[provider]
    setSaving(provider)
    setMessage('')
    const { error } = await supabase.rpc('super_admin_save_platform_payment_account', {
      p_provider: provider,
      p_account_name: account.account_name,
      p_account_phone: account.account_phone,
      p_enabled: account.enabled,
    })
    setSaving(null)
    if (error) { setMessage(error.message); return }
    setMessage(lang === 'ht' ? `${provider === 'moncash' ? 'MonCash' : 'NatCash'} anrejistre.` : `${provider === 'moncash' ? 'MonCash' : 'NatCash'} enregistré.`)
    await load()
  }

  const tx = lang === 'ht' ? {
    title: 'Kont peman platfòm', subtitle: 'Kont Super Admin pou resevwa peman kliyan yo', back: 'Retounen',
    name: 'Non sou kont lan', phone: 'Nimewo telefòn kont lan', active: 'Aktif pou resevwa peman', save: 'Anrejistre', saving: 'N ap anrejistre…',
    denied: 'Se Super Admin sèlman ki ka wè oswa modifye kont sa yo.', note: 'Lè yon kont aktive, li vin yon kont resepsyon ofisyèl platfòm nan pou sèvis sa a.'
  } : {
    title: 'Comptes de paiement plateforme', subtitle: 'Comptes du Super Admin pour recevoir les paiements clients', back: 'Retour',
    name: 'Nom du compte', phone: 'Numéro de téléphone du compte', active: 'Actif pour recevoir les paiements', save: 'Enregistrer', saving: 'Enregistrement…',
    denied: 'Seul le Super Admin peut voir ou modifier ces comptes.', note: 'Lorsqu’un compte est activé, il devient un compte officiel de réception de la plateforme pour ce service.'
  }

  if (allowed === null) return <main className="page"><section className="card"><p>Chargement…</p></section></main>
  if (!allowed) return <main className="page"><section className="card"><h1>{tx.title}</h1><p>{tx.denied}</p><button onClick={() => location.assign('/admin')}>{tx.back}</button></section></main>

  return <main className="page"><section className="card">
    <div className="top"><button onClick={() => location.assign('/admin')}>← {tx.back}</button><select value={lang} onChange={e => { const v=e.target.value as Lang; setLang(v); localStorage.setItem('taxi-language',v) }}><option value="fr">FR</option><option value="ht">KR</option></select></div>
    <div className="hero"><div className="icon">💳</div><div><small>SUPER ADMIN</small><h1>{tx.title}</h1><p>{tx.subtitle}</p></div></div>
    <div className="notice">🔐 {tx.note}</div>
    <div className="grid">{(['moncash','natcash'] as Provider[]).map(provider => {
      const a = accounts[provider]
      const label = provider === 'moncash' ? 'MonCash' : 'NatCash'
      return <article key={provider} className="provider">
        <div className="providerHead"><div><span>{provider === 'moncash' ? '📱' : '💵'}</span><strong>{label}</strong></div><label className="switch"><input type="checkbox" checked={a.enabled} onChange={e => update(provider,{enabled:e.target.checked})}/><span /></label></div>
        <label>{tx.name}<input value={a.account_name} onChange={e => update(provider,{account_name:e.target.value})} placeholder={lang==='ht'?'Non moun oswa biznis':'Nom de la personne ou entreprise'} /></label>
        <label>{tx.phone}<input inputMode="tel" autoComplete="tel" value={a.account_phone} onChange={e => update(provider,{account_phone:e.target.value})} placeholder="+509 …" /></label>
        <div className="status"><span className={a.enabled?'on':'off'}>{a.enabled ? (lang==='ht'?'Aktif':'Actif') : (lang==='ht'?'Dezaktive':'Désactivé')}</span><small>{tx.active}</small></div>
        <button className="save" disabled={saving===provider} onClick={() => void save(provider)}>{saving===provider?tx.saving:tx.save}</button>
      </article>
    })}</div>
    {message && <div className="message">{message}</div>}
  </section>
  <style jsx>{`
    .page{min-height:100dvh;background:radial-gradient(circle at 50% -10%,#dceee8 0,#eef3f1 35%,#e7ecef 100%);padding:16px;color:#102033;font-family:Inter,system-ui,sans-serif;box-sizing:border-box}.card{width:min(100%,850px);margin:auto;background:#fbfdfc;border:1px solid #dae6e1;border-radius:26px;padding:18px;box-sizing:border-box;box-shadow:0 22px 60px rgba(16,32,51,.11)}.top{display:flex;justify-content:space-between;gap:10px}.top button,.top select{border:1px solid #d9e4e0;background:#fff;border-radius:12px;padding:10px 12px;font-weight:850;color:#0f705a}.hero{display:flex;align-items:center;gap:14px;padding:24px 2px 16px}.icon{width:54px;height:54px;border-radius:17px;background:#0f705a;display:grid;place-items:center;font-size:25px}.hero small{font-size:9px;font-weight:950;letter-spacing:.12em;color:#0f705a}.hero h1{margin:4px 0 3px;font-size:27px}.hero p{margin:0;color:#74837d;font-size:12px}.notice{background:#eef8f4;border:1px solid #d4e9e1;border-radius:14px;padding:11px 12px;font-size:11px;color:#31594d;font-weight:700}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.provider{background:#fff;border:1px solid #dfe8e4;border-radius:20px;padding:16px;display:grid;gap:13px}.providerHead{display:flex;justify-content:space-between;align-items:center}.providerHead>div{display:flex;align-items:center;gap:8px}.providerHead strong{font-size:18px}.providerHead span{font-size:22px}.provider label:not(.switch){display:grid;gap:6px;font-size:10px;font-weight:850;color:#60716a}.provider input:not([type=checkbox]){border:1px solid #dbe5e1;border-radius:12px;padding:12px;font-size:15px;color:#102033;background:#fff}.switch{position:relative;width:48px;height:28px}.switch input{opacity:0;position:absolute}.switch span{position:absolute;inset:0;background:#bcc9c4;border-radius:999px;transition:.2s}.switch span:after{content:'';position:absolute;width:22px;height:22px;top:3px;left:3px;border-radius:50%;background:#fff;box-shadow:0 2px 5px rgba(0,0,0,.18);transition:.2s}.switch input:checked+span{background:#0f705a}.switch input:checked+span:after{transform:translateX(20px)}.status{display:flex;justify-content:space-between;align-items:center;gap:8px}.status small{font-size:9px;color:#82908a}.status>span{font-size:9px;font-weight:900;border-radius:999px;padding:5px 8px}.status .on{background:#e8f6f0;color:#0f705a}.status .off{background:#f1f3f2;color:#718079}.save{border:0;border-radius:13px;background:#0f705a;color:#fff;padding:12px;font-weight:900}.save:disabled{opacity:.6}.message{margin-top:12px;border-radius:12px;padding:10px 12px;background:#fff7da;border:1px solid #ebddb1;font-size:11px;font-weight:800}@media(max-width:650px){.page{padding:9px}.card{border-radius:22px;padding:13px}.grid{grid-template-columns:1fr}.hero h1{font-size:22px}.hero p{font-size:10px}.provider{padding:14px}}
  `}</style></main>
}
