'use client'

import { FormEvent, useState } from 'react'
import { supabase } from '../../lib/supabase'
import HomePage from '../page'

type Target = {
  path: string
}

export default function UnifiedLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [passengerReady, setPassengerReady] = useState(false)
  const [passengerTransition, setPassengerTransition] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error || !data.user || !data.session) {
      setMessage(error?.message || 'Connexion impossible. Vérifiez vos informations.')
      setBusy(false)
      return
    }

    const { error: persistError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })

    if (persistError) {
      setMessage('La connexion a réussi, mais la session n’a pas pu être enregistrée. Réessayez.')
      setBusy(false)
      return
    }

    const { data: verified, error: verifyError } = await supabase.auth.getSession()
    if (verifyError || !verified.session?.user || verified.session.user.id !== data.user.id) {
      setMessage('La session n’a pas pu être vérifiée. Réessayez.')
      setBusy(false)
      return
    }

    let target: Target = { path: '/passenger/dashboard' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profile?.role === 'admin') {
      target = { path: '/admin/drivers' }
    } else {
      const { data: driver } = await supabase
        .from('driver_profiles')
        .select('status')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (driver?.status === 'approved') {
        target = { path: '/driver/dashboard-v2' }
      }
    }

    if (target.path === '/passenger/dashboard') {
      window.history.replaceState({}, '', '/passenger/dashboard')
      setPassengerTransition(true)
      setPassengerReady(true)
      setBusy(false)
      window.setTimeout(() => setPassengerTransition(false), 450)
      return
    }

    await new Promise((resolve) => window.setTimeout(resolve, 120))
    window.location.replace(target.path)
  }

  if (passengerReady) {
    return <>
      <HomePage />
      {passengerTransition && <div style={{position:'fixed',inset:0,zIndex:2147483647,display:'grid',placeItems:'center',background:'linear-gradient(160deg,#e3f1ed,#eef2f7 48%,#e7edf3)',fontFamily:'system-ui,sans-serif'}}>
        <div style={{display:'grid',gap:12,justifyItems:'center',color:'#0f6f59',fontWeight:900}}>
          <div style={{width:48,height:48,borderRadius:16,display:'grid',placeItems:'center',background:'#0f6f59',color:'#fff',fontSize:22}}>M</div>
          <span>Ou konekte. N ap louvri espas kliyan an…</span>
        </div>
      </div>}
    </>
  }

  return (
    <main style={{position:'fixed',inset:0,zIndex:2147483647,background:'linear-gradient(160deg,#e3f1ed,#eef2f7 48%,#e7edf3)',padding:'28px 20px',overflow:'auto',fontFamily:'system-ui,sans-serif',pointerEvents:'auto',touchAction:'auto'}}>
      <section style={{maxWidth:430,margin:'56px auto',background:'#fff',borderRadius:28,padding:'28px 24px',boxShadow:'0 24px 70px rgba(18,36,61,.15)',position:'relative',zIndex:2147483647}}>
        <div style={{display:'flex',alignItems:'center',marginBottom:28}}>
          <div style={{width:52,height:52,borderRadius:16,display:'grid',placeItems:'center',background:'#0f6f59',color:'#fff',fontSize:24,fontWeight:900}}>M</div>
        </div>
        <div style={{fontSize:13,fontWeight:900,letterSpacing:1.5,color:'#0f7a62',marginBottom:6}}>BON RETOUR</div>
        <h1 style={{fontSize:36,lineHeight:1.05,margin:'0 0 24px',color:'#102033'}}>Connectez-vous</h1>
        <form onSubmit={submit} style={{display:'grid',gap:18,position:'relative',zIndex:2147483647}}>
          <label style={{display:'grid',gap:8,fontWeight:800,color:'#506174'}}>E-mail
            <input type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} onTouchStart={(e)=>e.currentTarget.focus()} required style={{fontSize:18,minHeight:58,width:'100%',padding:'13px 14px',border:'2px solid #d7e0e7',borderRadius:14,background:'#fff',color:'#111',pointerEvents:'auto',touchAction:'auto',WebkitUserSelect:'text',userSelect:'text',WebkitAppearance:'none',appearance:'none',position:'relative',zIndex:2147483647}} />
          </label>
          <label style={{display:'grid',gap:8,fontWeight:800,color:'#506174'}}>Mot de passe
            <input type="password" autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} onTouchStart={(e)=>e.currentTarget.focus()} required style={{fontSize:18,minHeight:58,width:'100%',padding:'13px 14px',border:'2px solid #d7e0e7',borderRadius:14,background:'#fff',color:'#111',pointerEvents:'auto',touchAction:'auto',WebkitUserSelect:'text',userSelect:'text',WebkitAppearance:'none',appearance:'none',position:'relative',zIndex:2147483647}} />
          </label>
          {message && <div style={{padding:'11px 13px',borderRadius:12,background:'#fff1f1',color:'#9d2d2d',fontWeight:700}}>{message}</div>}
          <button type="submit" disabled={busy} style={{minHeight:58,fontSize:18,fontWeight:900,border:0,borderRadius:15,background:'#0f6f59',color:'#fff',pointerEvents:'auto',touchAction:'manipulation',position:'relative',zIndex:2147483647,opacity:busy?.72:1}}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        </form>
        <p style={{textAlign:'center',margin:'18px 0 0',color:'#748395',fontSize:13}}>Le système vous dirigera automatiquement vers votre espace.</p>
      </section>
    </main>
  )
}
