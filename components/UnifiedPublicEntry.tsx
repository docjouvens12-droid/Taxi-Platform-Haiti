'use client'

import { FormEvent, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

type Lang = 'fr' | 'ht'
type Mode = 'signin' | 'signup'
type AccountType = 'passenger' | 'driver'

export default function UnifiedPublicEntry() {
  const pathname = usePathname()
  const isPublicEntry = pathname === '/' || pathname === '/movi' || pathname === '/movi-app-v2'
  const [lang, setLang] = useState<Lang>('fr')
  const [visible, setVisible] = useState(false)
  const [checking, setChecking] = useState(true)
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('passenger')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isPublicEntry) { setChecking(false); setVisible(false); return }
    const saved = window.localStorage.getItem('taxi-language') as Lang | null
    if (saved === 'fr' || saved === 'ht') setLang(saved)

    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setVisible(!data.session?.user)
      setChecking(false)
    }).catch(() => {
      if (!mounted) return
      setVisible(true)
      setChecking(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setVisible(!session?.user)
    })
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [isPublicEntry])

  useEffect(() => {
    document.body.classList.toggle('unified-public-entry-open', visible)
    return () => document.body.classList.remove('unified-public-entry-open')
  }, [visible])

  function chooseLanguage(next: Lang) {
    setLang(next)
    window.localStorage.setItem('taxi-language', next)
  }

  function persistFastSession(session: unknown) {
    try {
      const current = session as { access_token?: string; user?: { id?: string } } | null
      if (current?.access_token && current?.user?.id) {
        window.localStorage.setItem('movi-session', JSON.stringify(current))
      }
    } catch {
      // Fast session persistence must never block sign-in.
    }
  }

  async function routeSignedInUser(userId: string) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role,passenger_onboarding_completed')
      .eq('id', userId)
      .maybeSingle()

    if (profileError || !profile) {
      setMessage(lang === 'ht' ? 'Nou pa rive verifye wòl kont lan.' : 'Impossible de vérifier le rôle du compte.')
      return false
    }

    if (profile.role === 'admin' || profile.role === 'super_admin') {
      const { data: mustChange } = await supabase.rpc('admin_requires_password_change')
      window.location.replace(mustChange ? '/admin/set-password' : '/admin')
      return true
    }

    if (profile.role === 'driver') {
      const { data: driver } = await supabase
        .from('driver_profiles')
        .select('status,application_submitted_at')
        .eq('user_id', userId)
        .maybeSingle()

      window.location.replace(driver?.status === 'approved' ? '/driver/dashboard' : '/driver')
      return true
    }

    if (profile.role === 'passenger') {
      window.location.replace(profile.passenger_onboarding_completed ? '/' : '/passenger/complete-registration')
      return true
    }

    setMessage(lang === 'ht' ? 'Wòl kont sa a pa rekonèt.' : 'Le rôle de ce compte n’est pas reconnu.')
    return false
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const cleanEmail = email.trim().toLowerCase()

    if (mode === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
      if (error || !data.user) {
        setMessage(lang === 'ht' ? 'Imel oswa modpas la pa kòrèk.' : 'E-mail ou mot de passe incorrect.')
        setBusy(false)
        return
      }

      persistFastSession(data.session)
      const routed = await routeSignedInUser(data.user.id)
      if (!routed) setBusy(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/movi-app-v2`,
        data: { account_type: accountType },
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage(lang === 'ht'
        ? 'Kont lan kreye. Nou voye yon imel konfimasyon ba ou. Louvri imel la, konfime kont ou, epi retounen konekte ak imel ak modpas ou.'
        : 'Compte créé. Nous vous avons envoyé un e-mail de confirmation. Confirmez votre compte, puis revenez vous connecter avec votre e-mail et votre mot de passe.')
      setMode('signin')
      setPassword('')
    }
    setBusy(false)
  }

  if (!isPublicEntry || checking || !visible) return null
  const ht = lang === 'ht'

  return <main className="upe-shell" aria-label={ht ? 'Akèy MOVI' : 'Accueil MOVI'}>
    <section className="upe-card">
      <header className="upe-top">
        <div className="upe-brand"><span>M</span><div><strong>MOVI</strong><small>{ht ? 'Deplase fasil. Deplase an sekirite.' : 'Déplacez-vous facilement, en toute sécurité.'}</small></div></div>
        <div className="upe-lang"><button className={lang==='ht'?'active':''} onClick={()=>chooseLanguage('ht')}>KR</button><button className={lang==='fr'?'active':''} onClick={()=>chooseLanguage('fr')}>FR</button></div>
      </header>

      <section className="upe-hero">
        <div className="upe-badge">🇭🇹 MOVI</div>
        <h1>{mode === 'signin' ? (ht ? 'Konekte' : 'Connectez-vous') : (ht ? 'Enskri' : 'Inscrivez-vous')}</h1>
        <p>{mode === 'signin'
          ? (ht ? 'Antre imel ou ak modpas ou pou kontinye.' : 'Entrez votre e-mail et votre mot de passe pour continuer.')
          : (ht ? 'Kreye kont ou. Apre sa n ap voye yon imel konfimasyon ba ou.' : 'Créez votre compte. Un e-mail de confirmation vous sera ensuite envoyé.')}</p>
      </section>

      <form className="upe-auth-form" onSubmit={submit}>
        {mode === 'signup' && <div className="upe-account-types">
          <button type="button" className={accountType==='passenger'?'active':''} onClick={()=>setAccountType('passenger')}><span>👤</span><strong>{ht?'Pasaje':'Passager'}</strong></button>
          <button type="button" className={accountType==='driver'?'active':''} onClick={()=>setAccountType('driver')}><span>🚘</span><strong>{ht?'Chofè':'Chauffeur'}</strong></button>
        </div>}

        <label htmlFor="upe-email">{ht ? 'Imel' : 'E-mail'}</label>
        <div className="upe-input"><span>✉️</span><input id="upe-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
        <label htmlFor="upe-password">{ht ? 'Modpas' : 'Mot de passe'}</label>
        <div className="upe-input"><span>🔒</span><input id="upe-password" type="password" autoComplete={mode==='signin'?'current-password':'new-password'} minLength={6} value={password} onChange={e=>setPassword(e.target.value)} required /></div>

        {message && <div className="upe-message">{message}</div>}
        <button className="upe-submit" type="submit" disabled={busy}>{busy ? (ht?'Tanpri tann…':'Veuillez patienter…') : mode==='signin' ? (ht?'Konekte':'Se connecter') : (ht?'Enskri':'S’inscrire')}</button>
      </form>

      <div className="upe-switch">
        {mode === 'signin' ? <><span>{ht?'Ou poko gen kont?':'Vous n’avez pas encore de compte ?'}</span><button onClick={()=>{setMode('signup');setMessage('')}}>{ht?'Enskri':'S’inscrire'}</button></> : <><span>{ht?'Ou deja gen kont?':'Vous avez déjà un compte ?'}</span><button onClick={()=>{setMode('signin');setMessage('')}}>{ht?'Konekte':'Se connecter'}</button></>}
      </div>

      <div className="upe-trust"><span>✓ {ht?'Imel verifye':'E-mail vérifié'}</span><span>✓ FR / Kreyòl</span><span>✓ {ht?'Kont sekirize':'Compte sécurisé'}</span></div>
    </section>
    <style jsx>{`
      .upe-shell{position:fixed;inset:0;z-index:2147480000;overflow:auto;background:radial-gradient(circle at 20% 0,#17735f 0,#0a3f35 42%,#062b25 100%);padding:max(18px,env(safe-area-inset-top)) 14px max(18px,env(safe-area-inset-bottom));display:grid;place-items:center;font-family:Inter,system-ui,-apple-system,sans-serif;color:#102033}.upe-card{width:min(100%,440px);background:#fff;border-radius:30px;padding:18px;box-shadow:0 28px 80px rgba(0,0,0,.28)}.upe-top{display:flex;align-items:center;justify-content:space-between;gap:12px}.upe-brand{display:flex;align-items:center;gap:10px;min-width:0}.upe-brand>span{width:46px;height:46px;border-radius:15px;background:linear-gradient(145deg,#18a06f,#08794f);color:#fff;display:grid;place-items:center;font-size:22px;font-weight:950}.upe-brand strong,.upe-brand small{display:block}.upe-brand strong{font-size:16px}.upe-brand small{font-size:9px;color:#71817b;margin-top:2px}.upe-lang{display:flex;background:#edf3f1;padding:3px;border-radius:11px}.upe-lang button{border:0;background:transparent;border-radius:8px;padding:7px 8px;font-size:10px;font-weight:900;color:#63736d}.upe-lang button.active{background:#fff;color:#0f705a}.upe-hero{padding:30px 4px 19px}.upe-badge{display:inline-flex;padding:7px 10px;border-radius:999px;background:#eaf6f1;color:#0f705a;font-size:10px;font-weight:900}.upe-hero h1{font-size:34px;line-height:1.03;margin:13px 0 9px;letter-spacing:-.035em}.upe-hero p{margin:0;color:#6b7a75;font-size:13px;line-height:1.5}.upe-auth-form{display:grid;gap:8px}.upe-auth-form label{font-size:10px;text-transform:uppercase;letter-spacing:.07em;font-weight:900;color:#5e7069;margin-top:3px}.upe-input{display:grid;grid-template-columns:28px 1fr;align-items:center;border:1.5px solid #d8e4df;background:#fbfdfc;border-radius:16px;padding:0 13px;min-height:56px}.upe-input:focus-within{border-color:#0f705a;box-shadow:0 0 0 4px rgba(15,112,90,.1)}.upe-input input{border:0;outline:0;background:transparent;font-size:16px;min-width:0;width:100%}.upe-submit{border:0;border-radius:16px;min-height:56px;background:#0f705a;color:#fff;font-size:15px;font-weight:900;margin-top:7px;box-shadow:0 12px 28px rgba(15,112,90,.23)}.upe-submit:disabled{opacity:.65}.upe-account-types{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:4px}.upe-account-types button{border:1.5px solid #dce7e3;background:#f8fbfa;border-radius:15px;padding:12px 8px;display:grid;gap:4px;place-items:center;color:#51645d}.upe-account-types button.active{border-color:#0f705a;background:#eaf6f1;color:#0f705a}.upe-account-types span{font-size:21px}.upe-account-types strong{font-size:11px}.upe-message{background:#edf8f4;color:#0f705a;border-radius:12px;padding:10px 11px;font-size:11px;line-height:1.45;font-weight:750;margin-top:3px}.upe-switch{display:flex;justify-content:center;gap:5px;flex-wrap:wrap;margin-top:17px;font-size:11px;color:#71817b}.upe-switch button{border:0;background:transparent;color:#0f705a;font-weight:900;text-decoration:underline}.upe-trust{display:flex;justify-content:center;flex-wrap:wrap;gap:8px 13px;margin-top:15px;padding-top:14px;border-top:1px solid #edf1ef;color:#71817b;font-size:9px;font-weight:750}@media(max-width:390px){.upe-card{padding:14px;border-radius:24px}.upe-hero{padding:24px 2px 16px}.upe-hero h1{font-size:29px}}
    `}</style>
  </main>
}
