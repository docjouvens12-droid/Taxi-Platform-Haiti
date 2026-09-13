'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function GlobalLogoutButton() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [lang, setLang] = useState<'fr' | 'ht'>('fr')

  useEffect(() => {
    const saved = window.localStorage.getItem('taxi-language')
    if (saved === 'ht' || saved === 'fr') setLang(saved)

    let active = true
    supabase.auth.getUser().then(({ data }) => {
      if (active) setVisible(Boolean(data.user))
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setVisible(Boolean(session?.user))
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  // Admin, driver, and passenger dashboard pages render their own logout controls.
  if (!visible || pathname.startsWith('/admin') || pathname.startsWith('/driver') || pathname.startsWith('/passenger')) return null

  async function logout(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return

    setBusy(true)
    setVisible(false)

    try {
      await supabase.auth.signOut({ scope: 'local' })
    } finally {
      window.location.replace('/')
    }
  }

  return (
    <button type="button" className="global-logout" onClick={logout} disabled={busy} aria-label={lang === 'ht' ? 'Dekonekte' : 'Se déconnecter'}>
      {busy ? '…' : lang === 'ht' ? 'Dekonekte' : 'Se déconnecter'}
      <style jsx>{`
        .global-logout{position:fixed;right:18px;top:118px;z-index:1200;border:0;border-radius:999px;background:#102033;color:#fff;padding:11px 15px;font:800 13px Inter,system-ui,sans-serif;box-shadow:0 10px 28px rgba(16,32,51,.22);cursor:pointer}.global-logout:disabled{opacity:.7;cursor:wait}@media(max-width:600px){.global-logout{right:16px;top:112px;padding:10px 13px;font-size:12px}}
      `}</style>
    </button>
  )
}
