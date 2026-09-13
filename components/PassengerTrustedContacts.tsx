'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

type TrustedContact = { id: string; name: string; phone: string }

export default function PassengerTrustedContacts() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/passenger/dashboard') return

    const styleId = 'passenger-trusted-contacts-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .trusted-wrap{margin-top:12px;padding-top:11px;border-top:1px solid #e6ebf0}
        .trusted-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
        .trusted-head strong{font-size:12px;color:#102033}.trusted-head small{font-size:9px;color:#81909e}
        .trusted-list{display:grid;gap:7px}.trusted-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;border:1px solid #dfe7ef;border-radius:12px;background:#f8fafc;padding:9px}
        .trusted-copy{min-width:0}.trusted-copy b,.trusted-copy span{display:block}.trusted-copy b{font-size:11px;color:#102033}.trusted-copy span{font-size:10px;color:#6f7f8d;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .trusted-actions{display:flex;gap:5px}.trusted-actions button{border:0;border-radius:9px;padding:6px 7px;font-size:10px;font-weight:850;background:#edf4ff;color:#1b70eb}.trusted-actions button.delete{background:#fff0f0;color:#9a3030}
        .trusted-form{display:none;gap:7px;margin-top:8px}.trusted-form.open{display:grid}.trusted-form input{width:100%;box-sizing:border-box;border:1px solid #d9e1e8;border-radius:10px;padding:8px 9px;font-size:12px;color:#102033;background:#fff}.trusted-form-row{display:grid;grid-template-columns:1fr 1fr;gap:6px}.trusted-form button{border:0;border-radius:10px;padding:8px 9px;font-size:11px;font-weight:900}.trusted-save{background:#1b70eb;color:#fff}.trusted-cancel{background:#eef2f6;color:#526273}.trusted-add{width:100%;margin-top:8px;border:1px dashed #bfd0e6;border-radius:10px;background:#f6f9fd;color:#1b70eb;padding:8px;font-size:11px;font-weight:850}.trusted-status{min-height:12px;margin-top:6px;font-size:9.5px;color:#6f7f8d}.trusted-empty{font-size:10px;color:#7c8b99;padding:2px 0}
      `
      document.head.appendChild(style)
    }

    let stopped = false
    let mounting = false

    const lang = () => localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'

    async function mount() {
      if (stopped || mounting) return
      const profileDetails = document.querySelector<HTMLElement>('.passenger-profile-details')
      if (!profileDetails || profileDetails.querySelector('.trusted-wrap')) return

      mounting = true
      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user
      if (!user || stopped) { mounting = false; return }
      const { data } = await supabase.from('trusted_contacts').select('id,name,phone').eq('passenger_id', user.id).order('created_at', { ascending: true })
      if (stopped || !profileDetails.isConnected) { mounting = false; return }

      const wrap = document.createElement('div')
      wrap.className = 'trusted-wrap'
      const head = document.createElement('div')
      head.className = 'trusted-head'
      const title = document.createElement('strong')
      const hint = document.createElement('small')
      const list = document.createElement('div')
      list.className = 'trusted-list'
      const add = document.createElement('button')
      add.type = 'button'
      add.className = 'trusted-add'
      const form = document.createElement('div')
      form.className = 'trusted-form'
      form.innerHTML = `<input name="trusted-name" type="text" autocomplete="name"/><input name="trusted-phone" type="tel" autocomplete="tel" inputmode="tel"/><div class="trusted-form-row"><button type="button" class="trusted-save"></button><button type="button" class="trusted-cancel"></button></div>`
      const status = document.createElement('div')
      status.className = 'trusted-status'
      wrap.append(head, list, add, form, status)
      head.append(title, hint)
      profileDetails.appendChild(wrap)

      let contacts = ((data ?? []) as TrustedContact[]).slice(0, 2)
      let editingId: string | null = null
      const nameInput = form.querySelector<HTMLInputElement>('input[name="trusted-name"]')!
      const phoneInput = form.querySelector<HTMLInputElement>('input[name="trusted-phone"]')!
      const save = form.querySelector<HTMLButtonElement>('.trusted-save')!
      const cancel = form.querySelector<HTMLButtonElement>('.trusted-cancel')!

      const setLabels = () => {
        const ht = lang() === 'ht'
        title.textContent = ht ? 'Kontak konfyans' : 'Contacts de confiance'
        hint.textContent = ht ? 'Jiska 2 moun' : 'Jusqu’à 2 personnes'
        add.textContent = ht ? '+ Ajoute kontak' : '+ Ajouter un contact'
        nameInput.placeholder = ht ? 'Non moun nan' : 'Nom du contact'
        phoneInput.placeholder = ht ? 'Nimewo telefòn' : 'Numéro de téléphone'
        save.textContent = ht ? 'Anrejistre' : 'Enregistrer'
        cancel.textContent = ht ? 'Anile' : 'Annuler'
      }

      const render = () => {
        setLabels()
        list.innerHTML = ''
        const ht = lang() === 'ht'
        if (!contacts.length) {
          const empty = document.createElement('div')
          empty.className = 'trusted-empty'
          empty.textContent = ht ? 'Ou poko ajoute okenn kontak konfyans.' : 'Aucun contact de confiance pour le moment.'
          list.appendChild(empty)
        }
        contacts.forEach((contact) => {
          const card = document.createElement('div')
          card.className = 'trusted-card'
          const copy = document.createElement('div')
          copy.className = 'trusted-copy'
          const b = document.createElement('b'); b.textContent = contact.name
          const span = document.createElement('span'); span.textContent = contact.phone
          copy.append(b, span)
          const actions = document.createElement('div'); actions.className = 'trusted-actions'
          const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = ht ? 'Modifye' : 'Modifier'
          const del = document.createElement('button'); del.type = 'button'; del.className = 'delete'; del.textContent = ht ? 'Efase' : 'Supprimer'
          edit.addEventListener('click', (event) => {
            event.preventDefault(); event.stopPropagation(); editingId = contact.id; nameInput.value = contact.name; phoneInput.value = contact.phone; form.classList.add('open'); status.textContent = ''
          })
          del.addEventListener('click', async (event) => {
            event.preventDefault(); event.stopPropagation()
            const ok = confirm(ht ? `Efase ${contact.name} nan kontak konfyans ou?` : `Supprimer ${contact.name} de vos contacts de confiance ?`)
            if (!ok) return
            const { error } = await supabase.from('trusted_contacts').delete().eq('id', contact.id).eq('passenger_id', user.id)
            if (error) { status.textContent = ht ? 'Nou pa ka efase kontak la.' : 'Impossible de supprimer ce contact.'; return }
            contacts = contacts.filter((item) => item.id !== contact.id); render(); status.textContent = ht ? 'Kontak la efase.' : 'Contact supprimé.'
          })
          actions.append(edit, del); card.append(copy, actions); list.appendChild(card)
        })
        add.style.display = contacts.length >= 2 ? 'none' : 'block'
      }

      add.addEventListener('click', (event) => {
        event.preventDefault(); event.stopPropagation(); editingId = null; nameInput.value = ''; phoneInput.value = ''; form.classList.add('open'); status.textContent = ''
      })
      cancel.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); form.classList.remove('open'); status.textContent = '' })
      save.addEventListener('click', async (event) => {
        event.preventDefault(); event.stopPropagation()
        const ht = lang() === 'ht'
        const name = nameInput.value.trim(); const phone = phoneInput.value.trim()
        if (!name || !phone) { status.textContent = ht ? 'Antre non ak nimewo telefòn lan.' : 'Entrez le nom et le numéro de téléphone.'; return }
        save.disabled = true; status.textContent = ht ? 'N ap anrejistre…' : 'Enregistrement…'
        if (editingId) {
          const { data: updated, error } = await supabase.from('trusted_contacts').update({ name, phone }).eq('id', editingId).eq('passenger_id', user.id).select('id,name,phone').single()
          if (error) status.textContent = ht ? 'Nou pa ka modifye kontak la.' : 'Impossible de modifier ce contact.'
          else { contacts = contacts.map((item) => item.id === editingId ? updated as TrustedContact : item); form.classList.remove('open'); render(); status.textContent = ht ? 'Kontak la modifye.' : 'Contact modifié.' }
        } else {
          const { data: created, error } = await supabase.from('trusted_contacts').insert({ passenger_id: user.id, name, phone }).select('id,name,phone').single()
          if (error) status.textContent = contacts.length >= 2 ? (ht ? 'Ou deja gen 2 kontak.' : 'Vous avez déjà 2 contacts.') : (ht ? 'Nou pa ka ajoute kontak la.' : 'Impossible d’ajouter ce contact.')
          else { contacts = [...contacts, created as TrustedContact].slice(0, 2); form.classList.remove('open'); render(); status.textContent = ht ? 'Kontak la anrejistre.' : 'Contact enregistré.' }
        }
        save.disabled = false
      })

      render()
      const labelTimer = window.setInterval(setLabels, 900)
      wrap.dataset.labelTimer = String(labelTimer)
      mounting = false
    }

    void mount()
    const observer = new MutationObserver(() => { void mount() })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      stopped = true
      observer.disconnect()
      document.querySelectorAll<HTMLElement>('.trusted-wrap').forEach((el) => {
        const timer = Number(el.dataset.labelTimer || 0); if (timer) window.clearInterval(timer); el.remove()
      })
      document.getElementById(styleId)?.remove()
    }
  }, [pathname])

  return null
}
