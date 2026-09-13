'use client'

import { FormEvent, useState } from 'react'
import HomePage from '../../page'
import { supabase } from '../../../lib/supabase'

export default function PassengerLoginPage() {
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

  const inputStyle = {
    fontSize: 18,
    minHeight: 58,
    width: '100%',
    padding: '13px 14px',
    border: '2px solid #777',
    borderRadius: 10,
    background: '#fff',
    color: '#111',
    pointerEvents: 'auto' as const,
    touchAction: 'auto' as const,
    WebkitUserSelect: 'text' as const,
    userSelect: 'text' as const,
    WebkitAppearance: 'none' as const,
    appearance: 'none' as const,
    position: 'relative' as const,
    zIndex: 2147483647,
  }

  return (
    <main style={{position:'fixed',inset:0,zIndex:2147483647,background:'#fff',padding:'32px 20px',overflow:'auto',fontFamily:'system-ui,sans-serif',pointerEvents:'auto',touchAction:'auto'}}>
      <div style={{maxWidth:420,margin:'40px auto',position:'relative',zIndex:2147483647,pointerEvents:'auto'}}>
        <h1 style={{fontSize:28,marginBottom:24}}>Connexion passager</h1>
        <form onSubmit={submit} style={{display:'grid',gap:18,position:'relative',zIndex:2147483647,pointerEvents:'auto'}}>
          <label style={{display:'grid',gap:8,fontWeight:700,pointerEvents:'auto'}}>E-mail
            <input
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              onTouchStart={e=>e.currentTarget.focus()}
              onPointerDown={e=>e.currentTarget.focus()}
              onClick={e=>e.currentTarget.focus()}
              required
              style={inputStyle}
            />
          </label>
          <label style={{display:'grid',gap:8,fontWeight:700,pointerEvents:'auto'}}>Mot de passe
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              onTouchStart={e=>e.currentTarget.focus()}
              onPointerDown={e=>e.currentTarget.focus()}
              onClick={e=>e.currentTarget.focus()}
              required
              style={inputStyle}
            />
          </label>
          {message && <div style={{color:'#a00'}}>{message}</div>}
          <button type="submit" disabled={busy} style={{minHeight:56,fontSize:18,fontWeight:800,border:0,borderRadius:10,background:'#0f6f59',color:'#fff',pointerEvents:'auto',touchAction:'manipulation',position:'relative',zIndex:2147483647}}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        </form>
      </div>
    </main>
  )
}
