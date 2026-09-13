'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Ride = {
  id: string
  status: string
  destination_address: string | null
  final_fare_htg: number | null
  estimated_fare_htg: number | null
  requested_at: string
}

export default function PassengerDashboardQuickInfo() {
  useEffect(() => {
    if (window.location.pathname !== '/passenger/dashboard') return

    const styleId = 'passenger-dashboard-quick-info'
    document.getElementById(styleId)?.remove()
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .passenger-quick-wrap{display:grid;gap:12px;margin:14px 0 2px}
      .passenger-status-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      .passenger-status-card{border:1px solid #dfe7f0;border-radius:14px;background:#fbfcfe;padding:10px;min-width:0;box-shadow:0 4px 14px rgba(18,36,61,.04)}
      .passenger-status-card small{display:block;color:#7a8998;font-size:9px;font-weight:750;margin-bottom:4px}
      .passenger-status-card strong{display:block;color:#102033;font-size:11px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .passenger-status-card.active{border-color:#bfd4f8;background:#f2f7ff}
      .passenger-status-card.active strong{color:#185fc2}
      .passenger-shortcuts{display:grid;gap:7px}
      .passenger-shortcuts-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
      .passenger-shortcuts-head strong{font-size:12px;color:#102033}
      .passenger-shortcuts-head small{font-size:9px;color:#83909b}
      .passenger-chip-row{display:flex;gap:7px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
      .passenger-chip-row::-webkit-scrollbar{display:none}
      .passenger-place-chip{flex:0 0 auto;border:1px solid #dfe7f0;background:#fff;color:#2c4052;border-radius:999px;padding:8px 10px;font-size:10px;font-weight:800;max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .passenger-place-chip.favorite{background:#eef5ff;border-color:#cfe0fb;color:#185fc2}
      .passenger-place-chip.add{border-style:dashed;color:#637587;background:#fbfcfe}
      .passenger-quick-note{font-size:9px;color:#6f7f8d;min-height:12px}
      @media(max-width:390px){.passenger-status-grid{grid-template-columns:1fr}.passenger-status-card{padding:9px}.passenger-status-card strong{white-space:normal}}
    `
    document.head.appendChild(style)

    let mounted = true
    let building = false

    const setDestination = (value: string) => {
      const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('.route-card input'))
      const input = inputs[1]
      if (!input) return
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(input, value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
      input.focus()
    }

    const build = async () => {
      const sheet = document.querySelector<HTMLElement>('.booking-sheet')
      const greeting = sheet?.querySelector<HTMLElement>('.greeting-row')
      if (!sheet || !greeting || building) return

      const existing = Array.from(sheet.querySelectorAll<HTMLElement>('.passenger-quick-wrap'))
      if (existing.length > 0) {
        existing.slice(1).forEach((node) => node.remove())
        return
      }

      building = true
      sheet.dataset.passengerQuickInfoBuilding = '1'

      try {
        const { data: auth } = await supabase.auth.getUser()
        const user = auth.user
        if (!user || !mounted) return

        const [{ data: profile }, { data: rides }] = await Promise.all([
          supabase.from('profiles').select('full_name,preferred_payment_provider,moncash_enabled,natcash_enabled').eq('id', user.id).maybeSingle(),
          supabase.from('rides').select('id,status,destination_address,final_fare_htg,estimated_fare_htg,requested_at').eq('passenger_id', user.id).order('requested_at', { ascending: false }).limit(12),
        ])
        if (!mounted) return

        const currentSheet = document.querySelector<HTMLElement>('.booking-sheet')
        const currentGreeting = currentSheet?.querySelector<HTMLElement>('.greeting-row')
        if (!currentSheet || !currentGreeting) return

        const alreadyBuilt = currentSheet.querySelector('.passenger-quick-wrap')
        if (alreadyBuilt) return

        const ht = window.localStorage.getItem('taxi-language') === 'ht'
        const firstName = (profile?.full_name || user.user_metadata?.full_name || '').trim().split(/\s+/)[0] || ''
        const eyebrow = currentGreeting.querySelector<HTMLElement>('.eyebrow')
        if (eyebrow) eyebrow.textContent = `${ht ? 'Bonjou' : 'Bonjour'}${firstName ? `, ${firstName}` : ''} 👋`

        const list = (rides ?? []) as Ride[]
        const active = list.find((r) => !['completed','cancelled','canceled'].includes((r.status || '').toLowerCase()))
        const latestDone = list.find((r) => (r.status || '').toLowerCase() === 'completed')
        const recentDestinations = Array.from(new Set(list.map((r) => r.destination_address?.trim()).filter(Boolean) as string[])).slice(0,4)

        let payment = ht ? 'Lajan kach' : 'Espèces'
        if (profile?.preferred_payment_provider === 'moncash' && profile?.moncash_enabled) payment = 'MonCash'
        if (profile?.preferred_payment_provider === 'natcash' && profile?.natcash_enabled) payment = 'NatCash'

        const wrap = document.createElement('div')
        wrap.className = 'passenger-quick-wrap'
        wrap.dataset.passengerQuickInfo = 'true'

        const statusGrid = document.createElement('div')
        statusGrid.className = 'passenger-status-grid'
        const statusCard = (label: string, value: string, activeCard = false) => {
          const el = document.createElement('div')
          el.className = `passenger-status-card${activeCard ? ' active' : ''}`
          el.innerHTML = `<small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong>`
          return el
        }
        const activeText = active ? (ht ? 'An kou' : 'En cours') : (ht ? 'Pa gen trajè' : 'Aucun trajet')
        const lastText = latestDone?.destination_address || (ht ? 'Poko gen trajè' : 'Aucun trajet récent')
        statusGrid.append(
          statusCard(ht ? 'Trajè aktif' : 'Trajet actif', activeText, Boolean(active)),
          statusCard(ht ? 'Dènye trajè' : 'Dernier trajet', lastText),
          statusCard(ht ? 'Peman' : 'Paiement', payment),
        )

        const shortcuts = document.createElement('div')
        shortcuts.className = 'passenger-shortcuts'
        shortcuts.innerHTML = `<div class="passenger-shortcuts-head"><strong>${ht ? 'Kote rapid' : 'Raccourcis'}</strong><small>${ht ? 'Favori ak dènye kote' : 'Favoris et lieux récents'}</small></div>`
        const chips = document.createElement('div')
        chips.className = 'passenger-chip-row'
        const note = document.createElement('div')
        note.className = 'passenger-quick-note'

        const favorites = [
          { key: 'home', label: ht ? '🏠 Lakay' : '🏠 Maison' },
          { key: 'work', label: ht ? '💼 Travay' : '💼 Travail' },
        ]
        favorites.forEach(({ key, label }) => {
          const saved = window.localStorage.getItem(`taxi-passenger-favorite-${key}`) || ''
          const button = document.createElement('button')
          button.type = 'button'
          button.className = `passenger-place-chip ${saved ? 'favorite' : 'add'}`
          button.textContent = saved ? `${label}: ${saved}` : `${label} +`
          button.addEventListener('click', () => {
            const currentSaved = window.localStorage.getItem(`taxi-passenger-favorite-${key}`) || ''
            if (currentSaved) { setDestination(currentSaved); note.textContent = ''; return }
            const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('.route-card input'))
            const current = inputs[1]?.value.trim() || ''
            if (!current) {
              note.textContent = ht ? 'Ekri oswa chwazi yon destinasyon anvan ou anrejistre favori a.' : 'Choisissez une destination avant de l’enregistrer en favori.'
              return
            }
            window.localStorage.setItem(`taxi-passenger-favorite-${key}`, current)
            button.className = 'passenger-place-chip favorite'
            button.textContent = `${label}: ${current}`
            note.textContent = ht ? 'Favori a anrejistre.' : 'Favori enregistré.'
          })
          chips.appendChild(button)
        })

        recentDestinations.forEach((destination) => {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'passenger-place-chip'
          button.textContent = `🕘 ${destination}`
          button.addEventListener('click', () => { setDestination(destination); note.textContent = '' })
          chips.appendChild(button)
        })

        shortcuts.append(chips, note)
        wrap.append(statusGrid, shortcuts)
        currentGreeting.insertAdjacentElement('afterend', wrap)
      } finally {
        building = false
        delete sheet.dataset.passengerQuickInfoBuilding
      }
    }

    document.querySelectorAll('.passenger-quick-wrap').forEach((node, index) => {
      if (index > 0) node.remove()
    })

    void build()
    const observer = new MutationObserver(() => {
      const sheet = document.querySelector<HTMLElement>('.booking-sheet')
      if (!sheet) return
      const duplicates = Array.from(sheet.querySelectorAll('.passenger-quick-wrap'))
      duplicates.slice(1).forEach((node) => node.remove())
      if (duplicates.length === 0 && !building) void build()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      mounted = false
      observer.disconnect()
      document.querySelectorAll('.passenger-quick-wrap').forEach((node) => node.remove())
      document.getElementById(styleId)?.remove()
    }
  }, [])

  return null
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] ?? char))
}
