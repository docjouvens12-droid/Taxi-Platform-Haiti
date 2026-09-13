'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function DriverMenuAccordionPolish() {
  useEffect(() => {
    if (location.pathname !== '/driver/dashboard') return

    const cleanups: Array<() => void> = []

    const makeRow = (label: string, value: string) => {
      const row = document.createElement('p')
      const left = document.createElement('span')
      const right = document.createElement('b')
      left.textContent = `${label}: `
      right.textContent = value || '—'
      row.append(left, right)
      return row
    }

    const apply = async () => {
      const drawer = document.querySelector('.drawer') as HTMLElement | null
      if (!drawer || drawer.dataset.accordionPolished === 'true') return
      drawer.dataset.accordionPolished = 'true'
      drawer.style.width = 'min(68vw, 280px)'
      drawer.style.boxSizing = 'border-box'

      // Support both the restored/current driver drawer markup and the older one.
      const head = drawer.querySelector('.drawerTop, .drawerHead') as HTMLElement | null
      const headTitle = head?.querySelector('strong') as HTMLElement | null
      if (headTitle) headTitle.style.display = 'none'
      if (head) head.style.justifyContent = 'flex-start'

      const profile = drawer.querySelector('.profile, .profileBlock') as HTMLElement | null
      const profileText = profile?.querySelector(':scope > div:last-child') as HTMLElement | null
      const visibleName = profileText?.querySelector('strong')?.textContent?.trim() || ''
      if (profileText) profileText.style.display = 'none'
      if (profile) {
        profile.style.justifyContent = 'center'
        profile.style.paddingLeft = '0'
        profile.style.paddingRight = '0'
      }

      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user
      let licenseNumber = ''
      let licenseDocumentPath = ''
      let fullName = visibleName
      let phone = ''
      const email = user?.email ?? ''
      let birthDate = ''
      let sex = ''

      if (user) {
        const [{ data: driver }, { data: person }] = await Promise.all([
          supabase.from('driver_profiles').select('license_number,license_document_path').eq('user_id', user.id).maybeSingle(),
          supabase.from('profiles').select('full_name,phone').eq('id', user.id).maybeSingle(),
        ])
        licenseNumber = driver?.license_number ?? ''
        licenseDocumentPath = driver?.license_document_path ?? ''
        fullName = person?.full_name ?? fullName
        phone = person?.phone ?? ''
        const meta = user.user_metadata || {}
        birthDate = meta.birth_date || meta.date_of_birth || ''
        sex = meta.sex || meta.gender || ''
      }

      const lang = localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'
      const sections = Array.from(drawer.querySelectorAll('.menuSection')) as HTMLElement[]
      for (const section of sections) {
        const title = section.querySelector('h3') as HTMLElement | null
        if (!title) continue
        const label = (title.textContent || '').trim().toLowerCase()
        const isPersonal = label.includes('person') || label.includes('pèson')
        const isVehicle = label.includes('véhic') || label.includes('veyikil') || label === 'vehicle'
        if (!isPersonal && !isVehicle) continue

        if (isPersonal) {
          Array.from(section.children).forEach((child) => { if (child !== title) child.remove() })
          section.append(
            makeRow(lang === 'ht' ? 'Non' : 'Nom', fullName),
            makeRow(lang === 'ht' ? 'Dat nesans' : 'Date de naissance', birthDate),
            makeRow(lang === 'ht' ? 'Sèks' : 'Sexe', sex),
            makeRow(lang === 'ht' ? 'Nimewo lisans' : 'N° de permis', licenseNumber),
            makeRow(lang === 'ht' ? 'Tel' : 'Tél.', phone),
            makeRow(lang === 'ht' ? 'Imèl' : 'E-mail', email),
          )

          const uploadRow = document.createElement('div')
          Object.assign(uploadRow.style, { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' })

          const uploadLabel = document.createElement('span')
          uploadLabel.textContent = `${lang === 'ht' ? 'Telechaje lisans' : 'Téléverser le permis'}: `
          uploadLabel.style.color = '#7a8998'
          uploadLabel.style.fontSize = '13px'

          const fileInput = document.createElement('input')
          fileInput.type = 'file'
          fileInput.accept = 'image/*,application/pdf'
          fileInput.style.display = 'none'

          const uploadButton = document.createElement('button')
          uploadButton.type = 'button'
          uploadButton.textContent = licenseDocumentPath
            ? (lang === 'ht' ? 'Ranplase' : 'Remplacer')
            : (lang === 'ht' ? 'Pran foto / Upload' : 'Photo / Fichier')
          Object.assign(uploadButton.style, {
            padding: '8px 11px', borderRadius: '10px', border: '1px solid #b8d8ce',
            background: '#eef8f4', color: '#0f6f59', fontWeight: '800', cursor: 'pointer'
          })

          const status = document.createElement('small')
          status.textContent = licenseDocumentPath ? (lang === 'ht' ? '✓ Dokiman an anrejistre' : '✓ Document enregistré') : ''
          Object.assign(status.style, { width: '100%', color: '#688074', marginLeft: '0', fontSize: '11px' })

          const openPicker = () => fileInput.click()
          uploadButton.addEventListener('click', openPicker)
          cleanups.push(() => uploadButton.removeEventListener('click', openPicker))

          const onFile = async () => {
            const file = fileInput.files?.[0]
            if (!file || !user) return

            uploadButton.disabled = true
            uploadButton.textContent = lang === 'ht' ? 'N ap voye…' : 'Envoi…'
            status.textContent = ''

            if (file.size > 10 * 1024 * 1024) {
              status.textContent = lang === 'ht' ? 'Fichye a depase 10 MB.' : 'Le fichier dépasse 10 Mo.'
              status.style.color = '#9a3030'
              uploadButton.disabled = false
              uploadButton.textContent = lang === 'ht' ? 'Pran foto / Upload' : 'Photo / Fichier'
              return
            }

            const mime = file.type || ''
            const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
            if (!allowed.includes(mime)) {
              status.textContent = lang === 'ht' ? 'Chwazi yon foto JPG/PNG/WEBP oswa PDF.' : 'Choisissez une image JPG/PNG/WEBP ou un PDF.'
              status.style.color = '#9a3030'
              uploadButton.disabled = false
              uploadButton.textContent = lang === 'ht' ? 'Pran foto / Upload' : 'Photo / Fichier'
              return
            }

            const ext = mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
            const path = `${user.id}/driver-license.${ext}`

            if (licenseDocumentPath && licenseDocumentPath !== path) {
              await supabase.storage.from('driver-documents').remove([licenseDocumentPath])
            }

            const { error: uploadError } = await supabase.storage
              .from('driver-documents')
              .upload(path, file, { upsert: true, contentType: mime })

            if (uploadError) {
              status.textContent = uploadError.message
              status.style.color = '#9a3030'
              uploadButton.disabled = false
              uploadButton.textContent = licenseDocumentPath
                ? (lang === 'ht' ? 'Ranplase' : 'Remplacer')
                : (lang === 'ht' ? 'Pran foto / Upload' : 'Photo / Fichier')
              return
            }

            const { error: saveError } = await supabase
              .from('driver_profiles')
              .update({ license_document_path: path })
              .eq('user_id', user.id)

            if (saveError) {
              status.textContent = saveError.message
              status.style.color = '#9a3030'
              uploadButton.disabled = false
              return
            }

            licenseDocumentPath = path
            status.textContent = lang === 'ht' ? '✓ Lisans lan anrejistre' : '✓ Permis enregistré'
            status.style.color = '#0f6f59'
            uploadButton.textContent = lang === 'ht' ? 'Ranplase' : 'Remplacer'
            uploadButton.disabled = false
            fileInput.value = ''
          }

          fileInput.addEventListener('change', onFile)
          cleanups.push(() => fileInput.removeEventListener('change', onFile))

          uploadRow.append(uploadLabel, uploadButton, fileInput, status)
          section.append(uploadRow)
        }

        const rows = Array.from(section.children).filter((el) => el !== title) as HTMLElement[]
        let open = false
        const arrow = document.createElement('span')
        arrow.textContent = '›'
        arrow.setAttribute('aria-hidden', 'true')
        Object.assign(arrow.style, { marginLeft: 'auto', fontSize: '22px', lineHeight: '1', transition: 'transform .18s ease' })
        Object.assign(title.style, { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 0', marginBottom: '0', userSelect: 'none' })
        title.setAttribute('role', 'button')
        title.setAttribute('tabindex', '0')
        title.setAttribute('aria-expanded', 'false')
        title.appendChild(arrow)

        const setOpen = (next: boolean) => {
          open = next
          rows.forEach((row) => { row.style.display = next ? '' : 'none' })
          arrow.style.transform = next ? 'rotate(90deg)' : 'rotate(0deg)'
          title.setAttribute('aria-expanded', String(next))
          section.style.paddingBottom = next ? '16px' : '12px'
        }
        const toggle = () => setOpen(!open)
        const keyToggle = (e: Event) => {
          const ke = e as KeyboardEvent
          if (ke.key === 'Enter' || ke.key === ' ') { e.preventDefault(); toggle() }
        }
        title.addEventListener('click', toggle)
        title.addEventListener('keydown', keyToggle)
        cleanups.push(() => {
          title.removeEventListener('click', toggle)
          title.removeEventListener('keydown', keyToggle)
        })
        setOpen(false)
      }
    }

    void apply()
    const observer = new MutationObserver(() => { void apply() })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      cleanups.forEach((fn) => fn())
    }
  }, [])

  return null
}
