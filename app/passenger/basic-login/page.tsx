'use client'

import { FormEvent, useState } from 'react'
import HomePage from '../../page'
import { supabase } from '../../../lib/supabase'

export default function BasicPassengerLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setMessage(error.message)
      setBusy(false)
      return
    }

    if (!data.session) {
      setMessage('Connexion réussie, mais la session n’a pas été créée. Réessayez.')
      setBusy(false)
      return
    }

    const { error: persistError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })

    if (persistError) {
      setMessage(persistError.message)
      setBusy(false)
      return
    }

    setSignedIn(true)
    setBusy(false)
  }

  if (signedIn) return <HomePage />

  return (
    <main style={{position:'fixed',inset:0,zIndex:2147483647,background:'#fff',padding:'32px 20px',overflow:'auto',fontFamily:'system-ui,sans-serif',pointerEvents:'auto',touchAction:'manipulation'}}>
      <div style={{maxWidth:420,margin:'40px auto'}}>
        <h1 style={{fontSize:28,marginBottom:24}}>Connexion passager</h1>
        <form onSubmit={submit} style={{display:'grid',gap:18}}>
          <label style={{display:'grid',gap:8,fontWeight:700}}>E-mail
            <input type="email" inputMode="email" autoCapitalize="none" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required style={{fontSize:18,minHeight:56,padding:'12px 14px',border:'2px solid #777',borderRadius:10,background:'#fff',color:'#111',pointerEvents:'auto',touchAction:'manipulation',WebkitUserSelect:'text'}} />
          </label>
          <label style={{display:'grid',gap:8,fontWeight:700}}>Mot de passe
            <input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required style={{fontSize:18,minHeight:56,padding:'12px 14px',border:'2px solid #777',borderRadius:10,background:'#fff',color:'#111',pointerEvents:'auto',touchAction:'manipulation',WebkitUserSelect:'text'}} />
          </label>
          {message && <div style={{color:'#a00'}}>{message}</div>}
          <button type="submit" disabled={busy} style={{minHeight:56,fontSize:18,fontWeight:800,border:0,borderRadius:10,background:'#0f6f59',color:'#fff',pointerEvents:'auto',touchAction:'manipulation'}}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        </form>
      </div>
    </main>
  )
}
