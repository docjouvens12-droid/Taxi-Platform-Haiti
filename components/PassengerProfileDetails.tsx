'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

export default function PassengerProfileDetails() {
  const [target, setTarget] = useState<Element | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState(false)
  const [ht, setHt] = useState(false)

  useEffect(() => {
    setHt(localStorage.getItem('taxi-language') === 'ht')
    const onStorage = () => setHt(localStorage.getItem('taxi-language') === 'ht')
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    let currentButton: HTMLButtonElement | null = null
    let currentHandler: ((event: MouseEvent) => void) | null = null

    const syncTarget = () => {
      const drawer = document.querySelector('.nav-drawer')
      if (!drawer) {
        setTarget(null)
        setExpanded(false)
        return
      }

      const buttons = Array.from(drawer.querySelectorAll<HTMLButtonElement>('.drawer-nav > button'))
      const profileButton = buttons.find((button) => {
        const text = (button.textContent || '').toLowerCase()
        return text.includes('profil') || text.includes('pwofil')
      }) || null

      if (!profileButton) {
        setTarget(null)
        setExpanded(false)
        return
      }

      if (currentButton !== profileButton) {
        if (currentButton && currentHandler) currentButton.removeEventListener('click', currentHandler, true)
        currentButton = profileButton
        currentHandler = (event: MouseEvent) => {
          event.preventDefault()
          event.stopPropagation()
          event.stopImmediatePropagation()
          setExpanded((value) => !value)
          setEditing(false)
          setMessage('')
        }
        profileButton.addEventListener('click', currentHandler, true)
      }

      let mount = drawer.querySelector('.drawer-profile-inline-target') as HTMLElement | null
      if (!mount) {
        mount = document.createElement('div')
        mount.className = 'drawer-profile-inline-target'
        profileButton.insertAdjacentElement('afterend', mount)
      }
      setTarget(mount)
    }

    syncTarget()
    const observer = new MutationObserver(syncTarget)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      if (currentButton && currentHandler) currentButton.removeEventListener('click', currentHandler, true)
    }
  }, [])

  useEffect(() => {
    if (!target || !expanded) return
    void (async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) return
      const metadata = user.user_metadata || {}
      setName(metadata.full_name || '')
      setBirthDate(metadata.birth_date || '')
      setGender(metadata.gender || '')
      setPhone(metadata.phone || '')
      setEmail(user.email || '')
    })()
  }, [target, expanded])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage('')

    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: name.trim(),
        birth_date: birthDate,
        gender,
        phone: phone.trim(),
      },
    })

    setBusy(false)
    if (error) {
      setMessage(error.message)
      return
    }

    const metadata = data.user?.user_metadata || {}
    setName(metadata.full_name || name.trim())
    setBirthDate(metadata.birth_date || birthDate)
    setGender(metadata.gender || gender)
    setPhone(metadata.phone || phone.trim())
    setEditing(false)
    setMessage(ht ? 'Pwofil anrejistre ✓' : 'Profil enregistré ✓')
  }

  if (!target || !expanded) return null

  const genderLabel = gender === 'homme' ? (ht ? 'Gason' : 'Homme') : gender === 'femme' ? (ht ? 'Fi' : 'Femme') : gender === 'autre' ? (ht ? 'Lòt / Pa presize' : 'Autre / Non précisé') : '—'
  const displayBirthDate = birthDate ? new Date(`${birthDate}T00:00:00`).toLocaleDateString(ht ? 'fr-HT' : 'fr-FR') : '—'

  return createPortal(
    <section className="drawer-profile-inline passenger-profile-card">
      <div className="passenger-profile-hero">
        <div className="passenger-profile-hero-icon">👤</div>
        <div className="passenger-profile-hero-copy">
          <strong>{ht ? 'Pwofil pasaje' : 'Profil passager'}</strong>
          <small>{ht ? 'Enfòmasyon kont ou' : 'Informations de votre compte'}</small>
        </div>
        <span className="passenger-profile-active">{ht ? 'Aktif' : 'Actif'}</span>
      </div>

      {editing ? (
        <form className="drawer-profile-form passenger-profile-form" onSubmit={saveProfile}>
          <div className="passenger-profile-group-title">{ht ? 'Enfòmasyon pèsonèl' : 'Informations personnelles'}</div>
          <label><span>{ht ? 'Non' : 'Nom'}</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
          <label><span>{ht ? 'Dat nesans' : 'Date de naissance'}</span><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></label>
          <label><span>{ht ? 'Sèks' : 'Sexe'}</span><select value={gender} onChange={(e) => setGender(e.target.value)}><option value="">{ht ? 'Chwazi' : 'Sélectionner'}</option><option value="homme">{ht ? 'Gason' : 'Homme'}</option><option value="femme">{ht ? 'Fi' : 'Femme'}</option><option value="autre">{ht ? 'Lòt / Pa presize' : 'Autre / Non précisé'}</option></select></label>
          <div className="passenger-profile-group-title">{ht ? 'Kontak' : 'Contact'}</div>
          <label><span>{ht ? 'Telefòn' : 'Téléphone'}</span><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+509 ..." inputMode="tel" autoComplete="tel" /></label>
          <label><span>{ht ? 'Imèl' : 'E-mail'}</span><input value={email} readOnly className="drawer-profile-readonly" /></label>
          {message && <div className="drawer-profile-message">{message}</div>}
          <div className="drawer-profile-actions"><button type="button" onClick={() => { setEditing(false); setMessage('') }}>{ht ? 'Anile' : 'Annuler'}</button><button type="submit" disabled={busy}>{busy ? (ht ? 'Ap anrejistre…' : 'Enregistrement…') : (ht ? 'Anrejistre' : 'Enregistrer')}</button></div>
        </form>
      ) : (
        <div className="drawer-profile-saved passenger-profile-saved">
          {message && <div className="drawer-profile-message success">{message}</div>}
          <div className="passenger-profile-group-title">{ht ? 'Enfòmasyon pèsonèl' : 'Informations personnelles'}</div>
          <div className="passenger-profile-info"><span>{ht ? 'Non' : 'Nom'}</span><strong>{name || '—'}</strong></div>
          <div className="passenger-profile-info"><span>{ht ? 'Dat nesans' : 'Date de naissance'}</span><strong>{displayBirthDate}</strong></div>
          <div className="passenger-profile-info"><span>{ht ? 'Sèks' : 'Sexe'}</span><strong>{genderLabel}</strong></div>
          <div className="passenger-profile-group-title">{ht ? 'Kontak' : 'Contact'}</div>
          <div className="passenger-profile-info"><span>{ht ? 'Telefòn' : 'Téléphone'}</span><strong>{phone || '—'}</strong></div>
          <div className="passenger-profile-info"><span>{ht ? 'Imèl' : 'E-mail'}</span><strong>{email || '—'}</strong></div>
          <button type="button" className="drawer-profile-edit" onClick={() => { setEditing(true); setMessage('') }}>{ht ? 'Modifye pwofil' : 'Modifier le profil'}</button>
          <button type="button" className="passenger-profile-close" onClick={() => { setExpanded(false); setEditing(false); setMessage('') }}>{ht ? 'Fèmen' : 'Fermer'}</button>
        </div>
      )}
    </section>,
    target,
  )
}
