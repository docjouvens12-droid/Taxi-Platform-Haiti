'use client'

import { useEffect, useState } from 'react'

export default function DriverVehicleRequiredFieldsGuard() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    const path = window.location.pathname
    if (path !== '/driver/dashboard' && path !== '/driver') return

    const ht = () => localStorage.getItem('taxi-language') === 'ht'

    const markRequired = () => {
      if (path === '/driver/dashboard') {
        const root = document.querySelector<HTMLElement>('.driver-final-menu-root')
        if (!root) return
        const vehicleTrigger = Array.from(root.querySelectorAll<HTMLButtonElement>('.dfm-trigger')).find((button) => {
          const text = (button.textContent || '').toLowerCase()
          return text.includes('véhicule') || text.includes('veyikil')
        })
        const body = vehicleTrigger?.closest<HTMLElement>('.dfm-section')?.querySelector<HTMLElement>('.dfm-body')
        body?.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select').forEach((control) => { control.required = true })
      } else {
        const form = document.querySelector<HTMLFormElement>('.driver-form')
        if (!form) return
        form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select').forEach((control) => {
          if (!control.disabled && control.type !== 'email') control.required = true
        })
      }
    }

    const validateVehicle = (event: Event) => {
      if (path === '/driver/dashboard') {
        const target = event.target as HTMLElement | null
        const button = target?.closest<HTMLButtonElement>('button.dfm-primary')
        if (!button) return
        const body = button.closest<HTMLElement>('.dfm-body')
        const trigger = body?.closest<HTMLElement>('.dfm-section')?.querySelector<HTMLButtonElement>('.dfm-trigger')
        const text = (trigger?.textContent || '').toLowerCase()
        if (!(text.includes('véhicule') || text.includes('veyikil'))) return
        const controls = Array.from(body?.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select') || [])
        const missing = controls.some((control) => !String(control.value || '').trim())
        if (missing) {
          event.preventDefault()
          event.stopPropagation()
          ;(event as any).stopImmediatePropagation?.()
          setMessage(ht() ? 'Tout enfòmasyon veyikil yo obligatwa.' : 'Toutes les informations du véhicule sont obligatoires.')
          return
        }
        setMessage('')
      } else {
        const form = event.target as HTMLFormElement | null
        if (!form?.classList.contains('driver-form')) return
        const labels = Array.from(form.querySelectorAll<HTMLLabelElement>('label'))
        const vehicleLabels = labels.filter((label) => {
          const text = (label.textContent || '').toLowerCase()
          return ['marque','mak','modèle','modèl','couleur','koulè','année','ane','plaque','plak','nombre de places','kantite plas'].some((key) => text.includes(key))
        })
        const controls = vehicleLabels.map((label) => label.querySelector<HTMLInputElement>('input')).filter(Boolean) as HTMLInputElement[]
        const vehicleType = form.querySelector<HTMLButtonElement>('.vehicle-type button.selected')
        const missing = !vehicleType || controls.some((control) => !String(control.value || '').trim())
        if (missing) {
          event.preventDefault()
          event.stopPropagation()
          ;(event as any).stopImmediatePropagation?.()
          setMessage(ht() ? 'Ranpli tout enfòmasyon veyikil yo anvan ou voye demann lan.' : 'Complétez toutes les informations du véhicule avant d’envoyer la demande.')
          return
        }
        setMessage('')
      }
    }

    markRequired()
    const observer = new MutationObserver(markRequired)
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('click', validateVehicle, true)
    document.addEventListener('submit', validateVehicle, true)
    return () => {
      observer.disconnect()
      document.removeEventListener('click', validateVehicle, true)
      document.removeEventListener('submit', validateVehicle, true)
    }
  }, [])

  if (!message) return null
  return <div style={{ position: 'fixed', left: 16, right: 16, bottom: 110, zIndex: 9999, maxWidth: 520, margin: '0 auto', background: '#fff1f1', border: '1px solid #f3c2c2', color: '#9d2d2d', borderRadius: 12, padding: '10px 12px', fontSize: 12, fontWeight: 800, boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}>{message}</div>
}
