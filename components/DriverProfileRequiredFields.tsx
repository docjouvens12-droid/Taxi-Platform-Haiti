'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

type Lang = 'fr' | 'ht'

export default function DriverProfileRequiredFields() {
  const [mount, setMount] = useState<HTMLElement | null>(null)
  const [editing, setEditing] = useState(false)
  const [address, setAddress] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('')
  const [lang, setLang] = useState<Lang>('fr')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (window.location.pathname !== '/driver/dashboard') return
    setLang(localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr')

    let loaded = false
    const sync = async () => {
      const root = document.querySelector<HTMLElement>('.driver-final-menu-root')
      if (!root) { setMount(null); return }
      const triggers = Array.from(root.querySelectorAll<HTMLButtonElement>('.dfm-trigger'))
      const profileTrigger = triggers.find((button) => {
        const text = (button.textContent || '').toLowerCase()
        return text.includes('profil') || text.includes('pwofil')
      })
      const section = profileTrigger?.closest<HTMLElement>('.dfm-section')
      const body = section?.querySelector<HTMLElement>('.dfm-body')
      if (!body) { setMount(null); return }

      const isEditing = !!body.querySelector('input:not([disabled]), select')
      setEditing(isEditing)

      let target = body.querySelector<HTMLElement>('.driver-required-profile-fields-target')
      if (!target) {
        target = document.createElement('div')
        target.className = 'driver-required-profile-fields-target'
      }

      const labels = Array.from(body.querySelectorAll<HTMLLabelElement>('label'))
      const rows = Array.from(body.querySelectorAll<HTMLElement>('.dfm-row'))
      const sexElement = isEditing
        ? labels.find((label) => {
            const text = (label.textContent || '').toLowerCase()
            return text.includes('sexe') || text.includes('sèks') || text.includes('seks')
          })
        : rows.find((row) => {
            const text = (row.textContent || '').toLowerCase()
            return text.includes('sexe') || text.includes('sèks') || text.includes('seks')
          })

      if (sexElement) {
        sexElement.insertAdjacentElement('afterend', target)
      } else if (!target.parentElement) {
        const emailLabel = labels.find((label) => {
          const text = (label.textContent || '').toLowerCase()
          return text.includes('e-mail') || text.includes('imèl') || text.includes('imel')
        })
        const action = Array.from(body.querySelectorAll<HTMLButtonElement>('button')).find((button) => {
          const text = (button.textContent || '').toLowerCase()
          return text.includes('enregistrer') || text.includes('anrejistre') || text.includes('modifier') || text.includes('modifye')
        })
        if (emailLabel) body.insertBefore(target, emailLabel)
        else if (action) body.insertBefore(target, action)
        else body.appendChild(target)
      }
      setMount(target)

      if (!loaded) {
        loaded = true
        const { data } = await supabase.auth.getSession()
        const metadata = data.session?.user?.user_metadata || {}
        setAddress(metadata.address || metadata.driver_address || '')
        setMaritalStatus(metadata.marital_status || '')
      }

      body.querySelectorAll<HTMLInputElement>('input:not([disabled])').forEach((input) => { input.required = true })
      body.querySelectorAll<HTMLSelectElement>('select').forEach((select) => { select.required = true })
    }

    void sync()
    const observer = new MutationObserver(() => { void sync() })
    observer.observe(document.body, { childList: true, subtree: true })

    const validateSave = (event: MouseEvent) => {
      const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('button.dfm-primary')
      if (!button) return
      const body = button.closest<HTMLElement>('.dfm-body')
      const trigger = body?.closest('.dfm-section')?.querySelector<HTMLButtonElement>('.dfm-trigger')
      const triggerText = (trigger?.textContent || '').toLowerCase()
      const buttonText = (button.textContent || '').toLowerCase()
      if (!(triggerText.includes('profil') || triggerText.includes('pwofil'))) return
      if (!(buttonText.includes('enregistrer') || buttonText.includes('anrejistre'))) return

      const requiredControls = Array.from(body?.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input:not([disabled]), select') || [])
      const missingExisting = requiredControls.some((control) => !String(control.value || '').trim())
      const missingExtra = !address.trim() || !maritalStatus.trim()

      if (missingExisting || missingExtra) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        setMessage(lang === 'ht' ? 'Tout enfòmasyon yo obligatwa sof imèl la.' : 'Toutes les informations sont obligatoires sauf l’e-mail.')
        return
      }

      setMessage('')
      void supabase.auth.updateUser({
        data: {
          address: address.trim(),
          driver_address: address.trim(),
          marital_status: maritalStatus,
        },
      })
    }

    document.addEventListener('click', validateSave, true)
    return () => {
      observer.disconnect()
      document.removeEventListener('click', validateSave, true)
    }
  }, [address, maritalStatus, lang])

  if (!mount) return null

  const ht = lang === 'ht'
  const maritalLabel = maritalStatus === 'single' ? (ht ? 'Selibatè' : 'Célibataire')
    : maritalStatus === 'married' ? (ht ? 'Marye' : 'Marié(e)')
    : maritalStatus === 'divorced' ? (ht ? 'Divòse' : 'Divorcé(e)')
    : maritalStatus === 'widowed' ? (ht ? 'Vèf/Vèv' : 'Veuf/Veuve')
    : '—'

  return createPortal(
    <div className="driver-required-profile-fields">
      {editing ? <>
        <label className="dfm-field">{ht ? 'Eta sivil' : 'État civil'}<select required value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)}><option value="">—</option><option value="single">{ht ? 'Selibatè' : 'Célibataire'}</option><option value="married">{ht ? 'Marye' : 'Marié(e)'}</option><option value="divorced">{ht ? 'Divòse' : 'Divorcé(e)'}</option><option value="widowed">{ht ? 'Vèf/Vèv' : 'Veuf/Veuve'}</option></select></label>
        <label className="dfm-field">{ht ? 'Adrès' : 'Adresse'}<input required value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" /></label>
      </> : <>
        <p className="dfm-row"><span>{ht ? 'Eta sivil' : 'État civil'}</span><b>{maritalLabel}</b></p>
        <p className="dfm-row"><span>{ht ? 'Adrès' : 'Adresse'}</span><b>{address || '—'}</b></p>
      </>}
      {message && <div className="dfm-status" style={{ color: '#b42318' }}>{message}</div>}
    </div>,
    mount,
  )
}
