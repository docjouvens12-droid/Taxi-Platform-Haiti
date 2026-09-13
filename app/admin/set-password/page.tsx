'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Lang = 'fr' | 'ht'

export default function AdminSetPasswordPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('taxi-language') as Lang | null
    if (saved === 'fr' || saved === 'ht') setLang(saved)
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.replace('/')
        return
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
      if (profile?.role !== 'admin') {
        window.location.replace('/')
        return
      }
      const { data: mustChange } = await supabase.rpc('admin_requires_password_change')
      if (!mustChange) {
        window.location.replace('/admin')
        return
      }
      setReady(true)
    })
  }, [])

  async function save(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    if (password.length < 8) {
      setMessage(lang === 'ht' ? 'Modpas la dwe genyen omwen 8 karaktè.' : 'Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setMessage(lang === 'ht' ? 'De modpas yo pa menm.' : 'Les deux mots de passe ne correspondent pas.')
      return
    }
    setBusy(true)
    const { error: passwordError } = await supabase.auth.updateUser({ password })
    if (passwordError) {
      setMessage(passwordError.message)
      setBusy(false)
      return
    }
    const { error: completeError } = await supabase.rpc('admin_complete_initial_password')
    if (completeError) {
      setMessage(completeError.message)
      setBusy(false)
      return
    }
    window.location.replace('/admin')
  }

  if (!ready) return <main className="page"><section className="card">{lang === 'ht' ? 'N ap verifye envitasyon an…' : 'Vérification de votre invitation…'}</section><style jsx>{styles}</style></main>

  return <main className="page">
    <section className="card">
      <div className="brand">🚕 <strong>Taxi Platform Haiti</strong></div>
      <div className="badge">🛡️ {lang === 'ht' ? 'Premye koneksyon admin' : 'Première connexion administrateur'}</div>
      <h1>{lang === 'ht' ? 'Kreye nouvo modpas ou' : 'Créez votre nouveau mot de passe'}</h1>
      <p>{lang === 'ht' ? 'Pou sekirite, ou dwe chwazi yon modpas pèsonèl anvan ou ka antre nan dashboard administrasyon an.' : 'Pour votre sécurité, choisissez un mot de passe personnel avant d’accéder au tableau de bord administrateur.'}</p>
      <form onSubmit={save}>
        <label>{lang === 'ht' ? 'Nouvo modpas' : 'Nouveau mot de passe'}<input type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        <label>{lang === 'ht' ? 'Konfime modpas' : 'Confirmer le mot de passe'}<input type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required /></label>
        {message && <div className="message">{message}</div>}
        <button disabled={busy}>{busy ? '…' : (lang === 'ht' ? 'Sove epi antre nan Admin' : 'Enregistrer et ouvrir Admin')}</button>
      </form>
      <div className="lang"><button onClick={() => { setLang('fr'); localStorage.setItem('taxi-language','fr') }}>FR</button><button onClick={() => { setLang('ht'); localStorage.setItem('taxi-language','ht') }}>KR</button></div>
    </section>
    <style jsx>{styles}</style>
  </main>
}

const styles = `
  .page{min-height:100dvh;background:radial-gradient(circle at 20% 0,#17735f 0,#0a3f35 45%,#062b25 100%);display:grid;place-items:center;padding:18px;font-family:Inter,system-ui,sans-serif;color:#102033}
  .card{width:min(100%,430px);box-sizing:border-box;background:#fff;border-radius:28px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.25)}
  .brand{display:flex;align-items:center;gap:8px;color:#0f705a;font-size:14px}.badge{display:inline-block;margin-top:28px;background:#eaf6f1;color:#0f705a;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:900}
  h1{font-size:29px;line-height:1.05;margin:13px 0 9px;letter-spacing:-.03em}p{font-size:12px;line-height:1.55;color:#6f7e79;margin:0 0 20px}
  form{display:grid;gap:13px}label{font-size:10px;font-weight:900;color:#52645d;text-transform:uppercase;letter-spacing:.05em}input{display:block;width:100%;box-sizing:border-box;margin-top:6px;height:52px;border:1.5px solid #d7e3df;border-radius:14px;padding:0 12px;font-size:16px;outline:none}input:focus{border-color:#0f705a;box-shadow:0 0 0 4px rgba(15,112,90,.1)}
  form button{height:52px;border:0;border-radius:14px;background:#0f705a;color:#fff;font-weight:900;font-size:14px}.message{background:#fff3e8;color:#8b4d13;border:1px solid #efd3b4;border-radius:12px;padding:10px;font-size:11px;font-weight:800}
  .lang{display:flex;justify-content:center;gap:8px;margin-top:16px}.lang button{border:1px solid #d9e4e0;background:#fff;border-radius:10px;padding:7px 11px;font-weight:900;color:#0f705a}
`