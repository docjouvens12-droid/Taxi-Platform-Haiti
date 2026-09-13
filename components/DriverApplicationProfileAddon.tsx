'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

type DriverStatus = 'pending' | 'approved' | 'suspended' | 'rejected' | 'cancelled' | null

export default function DriverApplicationProfileAddon() {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [status, setStatus] = useState<DriverStatus>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [lang, setLang] = useState<'fr' | 'ht'>('fr')

  useEffect(() => {
    if (window.location.pathname !== '/driver/dashboard') return
    setLang(localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr')

    const sync = () => {
      const root = document.querySelector<HTMLElement>('.driver-final-menu-root')
      if (!root) { setTarget(null); return }
      const sections = Array.from(root.querySelectorAll<HTMLElement>('.dfm-section'))
      const profileSection = sections.find((section) => {
        const text = (section.querySelector('.dfm-trigger span')?.textContent || '').trim().toLowerCase()
        return text === 'profil' || text === 'pwofil'
      })
      const body = profileSection?.querySelector<HTMLElement>('.dfm-body')
      if (!body) { setTarget(null); return }
      let mount = body.querySelector<HTMLElement>('.driver-application-profile-addon-target')
      if (!mount) {
        mount = document.createElement('div')
        mount.className = 'driver-application-profile-addon-target'
        body.appendChild(mount)
      }
      setTarget(mount)
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!target) return
    void loadStatus()
  }, [target])

  async function loadStatus() {
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user
    if (!user) return
    const { data } = await supabase.from('driver_profiles').select('status').eq('user_id', user.id).maybeSingle()
    setStatus((data?.status as DriverStatus) || null)
  }

  async function cancelApplication() {
    if (status !== 'pending') return
    setBusy(true)
    setMessage('')
    const { error } = await supabase.rpc('cancel_driver_application')
    setBusy(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setStatus('cancelled')
    setMessage(lang === 'ht' ? '✓ Demann lan anile.' : '✓ Demande annulée.')
  }

  if (!target) return null
  const ht = lang === 'ht'
  const statusText = status === 'approved'
    ? (ht ? 'Chofè apwouve' : 'Chauffeur approuvé')
    : status === 'pending'
      ? (ht ? 'Demann lan ap tann verifikasyon' : 'Demande en attente de vérification')
      : status === 'suspended'
        ? (ht ? 'Kont chofè a sispann' : 'Compte chauffeur suspendu')
        : status === 'rejected'
          ? (ht ? 'Yo te refize demann lan' : 'Demande refusée')
          : status === 'cancelled'
            ? (ht ? 'Demann lan anile' : 'Demande annulée')
            : (ht ? 'Pa gen demann aktif' : 'Aucune demande active')

  return createPortal(
    <section style={{marginTop:12,paddingTop:12,borderTop:'1px solid #e5eaee'}}>
      <strong style={{display:'block',fontSize:12,color:'#173246',marginBottom:6}}>
        {ht ? 'Demann pou vin chofè' : 'Demande devenir chauffeur'}
      </strong>
      <div style={{fontSize:11,color:'#71808f',lineHeight:1.4,marginBottom:8}}>{statusText}</div>
      {status === 'pending' && (
        <button type="button" onClick={() => void cancelApplication()} disabled={busy}
          style={{width:'100%',border:'1px solid #efcaca',background:'#fff2f2',color:'#a83232',borderRadius:10,padding:'10px 12px',fontSize:12,fontWeight:850}}>
          {busy ? (ht ? 'N ap anile…' : 'Annulation…') : (ht ? 'Anile demann lan' : 'Annuler la demande')}
        </button>
      )}
      {(status === null || status === 'rejected' || status === 'cancelled') && (
        <button type="button" onClick={() => { window.location.href = '/driver' }}
          style={{width:'100%',border:0,background:'#0f6f59',color:'#fff',borderRadius:10,padding:'10px 12px',fontSize:12,fontWeight:850}}>
          {ht ? 'Voye yon demann' : 'Envoyer une demande'}
        </button>
      )}
      {message && <div style={{fontSize:10,fontWeight:800,color:'#0f6f59',marginTop:7}}>{message}</div>}
    </section>,
    target,
  )
}
