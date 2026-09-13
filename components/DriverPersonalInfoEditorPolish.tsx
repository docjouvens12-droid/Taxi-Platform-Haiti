'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function DriverPersonalInfoEditorPolish() {
  useEffect(() => {
    if (location.pathname !== '/driver/dashboard') return

    let disposed = false
    const cleanups: Array<() => void> = []

    const apply = async () => {
      const drawer = document.querySelector('.drawer') as HTMLElement | null
      if (!drawer) return
      const sections = Array.from(drawer.querySelectorAll('.menuSection')) as HTMLElement[]
      const section = sections.find((s) => {
        const text = (s.querySelector('h3')?.textContent || '').toLowerCase()
        return text.includes('person') || text.includes('pèson') || text.includes('profil') || text.includes('pwofil')
      })
      if (!section) return
      if (section.querySelector('[data-driver-personal-editor="true"]')) return

      const title = section.querySelector('h3') as HTMLElement | null
      if (!title) return
      const htNow = localStorage.getItem('taxi-language') === 'ht'
      title.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) node.textContent = htNow ? 'Pwofil' : 'Profil'
      })

      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user
      if (!user || disposed) return
      if (section.querySelector('[data-driver-personal-editor="true"]')) return

      const [{ data: person }, { data: driver }] = await Promise.all([
        supabase.from('profiles').select('full_name,phone').eq('id', user.id).maybeSingle(),
        supabase.from('driver_profiles').select('license_number,license_document_path').eq('user_id', user.id).maybeSingle(),
      ])
      if (disposed || section.querySelector('[data-driver-personal-editor="true"]')) return

      const meta = user.user_metadata || {}
      let values = {
        fullName: person?.full_name || '',
        birthDate: meta.birth_date || meta.date_of_birth || '',
        sex: meta.sex || meta.gender || '',
        license: driver?.license_number || '',
        phone: person?.phone || '',
        email: user.email || '',
      }
      let licenseDocumentPath = driver?.license_document_path || ''
      let editing = !Boolean(values.fullName || values.birthDate || values.sex || values.license || values.phone)

      Array.from(section.children).forEach((child) => { if (child !== title) child.remove() })

      const container = document.createElement('div')
      container.dataset.driverPersonalEditor = 'true'
      container.style.display = title.getAttribute('aria-expanded') === 'true' ? '' : 'none'
      container.style.paddingTop = '10px'
      section.appendChild(container)

      const styleInput = (el: HTMLInputElement | HTMLSelectElement) => {
        Object.assign(el.style, {
          width: '100%', boxSizing: 'border-box', padding: '10px 11px', border: '1px solid #d8e2e8',
          borderRadius: '10px', background: '#fff', color: '#173246', fontSize: '14px', marginTop: '4px'
        })
      }

      const makeDisplayRow = (label: string, value: string) => {
        const p = document.createElement('p')
        p.style.margin = '7px 0'
        const span = document.createElement('span')
        span.textContent = `${label}: `
        span.style.color = '#71808f'
        const b = document.createElement('b')
        b.textContent = value || '—'
        b.style.color = '#173246'
        p.append(span, b)
        return p
      }

      const makeField = (label: string, input: HTMLInputElement | HTMLSelectElement) => {
        const wrap = document.createElement('label')
        Object.assign(wrap.style, { display: 'block', margin: '9px 0', color: '#617180', fontSize: '12px', fontWeight: '700' })
        wrap.append(document.createTextNode(label), input)
        return wrap
      }

      const buttonStyle = (button: HTMLButtonElement, primary = true) => {
        Object.assign(button.style, {
          width: '100%', marginTop: '12px', padding: '11px 12px', borderRadius: '11px',
          border: primary ? '0' : '1px solid #cbd8df', background: primary ? '#0f765e' : '#fff',
          color: primary ? '#fff' : '#173246', fontWeight: '900', fontSize: '14px'
        })
      }

      const render = () => {
        container.innerHTML = ''
        const ht = localStorage.getItem('taxi-language') === 'ht'

        if (!editing) {
          container.append(
            makeDisplayRow(ht ? 'Non' : 'Nom', values.fullName),
            makeDisplayRow(ht ? 'Dat nesans' : 'Date de naissance', values.birthDate),
            makeDisplayRow(ht ? 'Sèks' : 'Sexe', values.sex),
            makeDisplayRow(ht ? 'Nimewo lisans' : 'N° de permis', values.license),
            makeDisplayRow(ht ? 'Tel' : 'Tél.', values.phone),
            makeDisplayRow(ht ? 'Imèl' : 'E-mail', values.email),
          )
          const edit = document.createElement('button')
          edit.type = 'button'
          edit.textContent = ht ? 'Modifye' : 'Modifier'
          buttonStyle(edit)
          edit.onclick = () => { editing = true; render() }
          container.appendChild(edit)
          return
        }

        const fullName = document.createElement('input'); fullName.value = values.fullName; styleInput(fullName)
        const birthDate = document.createElement('input'); birthDate.type = 'date'; birthDate.value = values.birthDate; styleInput(birthDate)
        const sex = document.createElement('select'); styleInput(sex)
        ;[['', ht ? 'Chwazi' : 'Choisir'], ['Masculin', ht ? 'Gason' : 'Masculin'], ['Féminin', ht ? 'Fi' : 'Féminin']].forEach(([value,label]) => {
          const option = document.createElement('option'); option.value = value; option.textContent = label; if (values.sex === value) option.selected = true; sex.appendChild(option)
        })
        const license = document.createElement('input'); license.value = values.license; styleInput(license)
        const phone = document.createElement('input'); phone.type = 'tel'; phone.value = values.phone; styleInput(phone)
        const email = document.createElement('input'); email.type = 'email'; email.value = values.email; email.readOnly = true; styleInput(email); email.style.background = '#f3f6f7'

        container.append(
          makeField(ht ? 'Non' : 'Nom', fullName),
          makeField(ht ? 'Dat nesans' : 'Date de naissance', birthDate),
          makeField(ht ? 'Sèks' : 'Sexe', sex),
          makeField(ht ? 'Nimewo lisans' : 'N° de permis', license),
          makeField(ht ? 'Tel' : 'Tél.', phone),
          makeField(ht ? 'Imèl kont lan' : 'E-mail du compte', email),
        )

        const docRow = document.createElement('div')
        Object.assign(docRow.style, { marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #edf1f3' })
        const fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = 'image/jpeg,image/png,image/webp,application/pdf'; fileInput.style.display = 'none'
        const upload = document.createElement('button'); upload.type = 'button'
        upload.textContent = licenseDocumentPath ? (ht ? 'Ranplase foto/dokiman lisans' : 'Remplacer le permis') : (ht ? 'Pran foto / Upload lisans' : 'Photo / Fichier du permis')
        buttonStyle(upload, false)
        const status = document.createElement('small')
        status.textContent = licenseDocumentPath ? (ht ? '✓ Lisans lan anrejistre' : '✓ Permis enregistré') : ''
        Object.assign(status.style, { display: 'block', marginTop: '6px', color: '#0f765e', fontSize: '11px' })
        upload.onclick = () => fileInput.click()
        fileInput.onchange = async () => {
          const file = fileInput.files?.[0]
          if (!file) return
          if (file.size > 10 * 1024 * 1024) { status.textContent = ht ? 'Fichye a depase 10 MB.' : 'Le fichier dépasse 10 Mo.'; return }
          const mime = file.type
          if (!['image/jpeg','image/png','image/webp','application/pdf'].includes(mime)) { status.textContent = ht ? 'Fòma fichye a pa valab.' : 'Format de fichier non valide.'; return }
          upload.disabled = true; status.textContent = ht ? 'N ap voye…' : 'Envoi…'
          const ext = mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
          const path = `${user.id}/driver-license.${ext}`
          const { error: upErr } = await supabase.storage.from('driver-documents').upload(path, file, { upsert: true, contentType: mime })
          if (upErr) { status.textContent = upErr.message; upload.disabled = false; return }
          const { error: saveErr } = await supabase.from('driver_profiles').update({ license_document_path: path }).eq('user_id', user.id)
          if (saveErr) { status.textContent = saveErr.message; upload.disabled = false; return }
          licenseDocumentPath = path; status.textContent = ht ? '✓ Lisans lan anrejistre' : '✓ Permis enregistré'; upload.disabled = false
        }
        docRow.append(upload, fileInput, status)
        container.appendChild(docRow)

        const save = document.createElement('button')
        save.type = 'button'; save.textContent = ht ? 'Anrejistre' : 'Enregistrer'; buttonStyle(save)
        const msg = document.createElement('small')
        Object.assign(msg.style, { display: 'block', minHeight: '16px', marginTop: '7px', fontSize: '11px', fontWeight: '700' })
        save.onclick = async () => {
          save.disabled = true; save.textContent = ht ? 'N ap anrejistre…' : 'Enregistrement…'; msg.textContent = ''
          const next = {
            fullName: fullName.value.trim(), birthDate: birthDate.value, sex: sex.value,
            license: license.value.trim(), phone: phone.value.trim(), email: values.email,
          }
          const [{ error: pErr }, { error: dErr }, { error: uErr }] = await Promise.all([
            supabase.from('profiles').update({ full_name: next.fullName, phone: next.phone }).eq('id', user.id),
            supabase.from('driver_profiles').update({ license_number: next.license }).eq('user_id', user.id),
            supabase.auth.updateUser({ data: { ...user.user_metadata, full_name: next.fullName, birth_date: next.birthDate, gender: next.sex, phone: next.phone } }),
          ])
          const err = pErr || dErr || uErr
          if (err) {
            msg.style.color = '#a33'; msg.textContent = err.message; save.disabled = false; save.textContent = ht ? 'Anrejistre' : 'Enregistrer'; return
          }
          values = next; editing = false; render()
        }
        container.append(save, msg)
      }

      const syncVisibility = () => {
        window.setTimeout(() => { container.style.display = title.getAttribute('aria-expanded') === 'true' ? '' : 'none' }, 0)
      }
      title.addEventListener('click', syncVisibility)
      title.addEventListener('keydown', syncVisibility)
      cleanups.push(() => { title.removeEventListener('click', syncVisibility); title.removeEventListener('keydown', syncVisibility) })

      render()
    }

    void apply()
    const observer = new MutationObserver(() => { void apply() })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      disposed = true
      observer.disconnect()
      cleanups.forEach((fn) => fn())
    }
  }, [])

  return null
}
