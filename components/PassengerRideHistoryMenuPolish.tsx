'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Ride = {
  id: string
  status: string
  pickup_address: string
  destination_address: string
  final_fare_htg: number | null
  estimated_fare_htg: number | null
  requested_at: string
}

export default function PassengerRideHistoryMenuPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/passenger/dashboard') return

    const styleId = 'passenger-rides-inline-polish'
    document.getElementById(styleId)?.remove()
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .passenger-rides-details{display:none;padding:4px 4px 10px 30px;border-bottom:1px solid #e7ecef}
      .passenger-rides-details.open{display:grid;gap:7px}
      .passenger-rides-loading,.passenger-rides-empty{font-size:10.5px;color:#73818e;padding:8px 4px}
      .passenger-ride-card{padding:9px;border:1px solid #e2e8ed;border-radius:11px;background:#f8fafb}
      .passenger-ride-card.active{border-color:#b7d8ce;background:#eef8f5}
      .passenger-ride-card.passenger-ride-extra{display:none}
      .passenger-rides-details.show-more .passenger-ride-card.passenger-ride-extra{display:block}
      .passenger-ride-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:5px}
      .passenger-ride-status{font-size:10px;font-weight:850;color:#0f6f59}
      .passenger-ride-date{font-size:9px;color:#83909a;text-align:right}
      .passenger-ride-route{font-size:10px;line-height:1.35;color:#334654;margin:2px 0}
      .passenger-ride-price{font-size:10px;font-weight:850;color:#102033;margin-top:5px}
      .passenger-rides-more{width:100%;min-height:32px;border:0;border-radius:8px;background:#eef3f5;color:#243747;font-size:10.5px;font-weight:800;padding:6px 8px}
      .passenger-rides-more-note{font-size:9.5px;color:#7a8998;text-align:center;padding:2px 4px 0}
    `
    document.head.appendChild(style)

    const statusLabel = (status: string, ht: boolean) => {
      const value = status.toLowerCase()
      if (ht) {
        if (['requested','pending','searching'].includes(value)) return 'Ap tann'
        if (['accepted','assigned'].includes(value)) return 'Chofè jwenn'
        if (['arrived'].includes(value)) return 'Chofè rive'
        if (['in_progress','ongoing','started'].includes(value)) return 'An kou'
        if (['completed','done'].includes(value)) return 'Fini'
        if (['cancelled','canceled'].includes(value)) return 'Anile'
      } else {
        if (['requested','pending','searching'].includes(value)) return 'En attente'
        if (['accepted','assigned'].includes(value)) return 'Chauffeur trouvé'
        if (['arrived'].includes(value)) return 'Chauffeur arrivé'
        if (['in_progress','ongoing','started'].includes(value)) return 'En cours'
        if (['completed','done'].includes(value)) return 'Terminé'
        if (['cancelled','canceled'].includes(value)) return 'Annulé'
      }
      return status
    }

    const isActive = (status: string) => !['completed','done','cancelled','canceled'].includes(status.toLowerCase())

    const addMoreButton = (details: HTMLElement, ht: boolean, hasExtra: boolean) => {
      const more = document.createElement('button')
      more.type = 'button'
      more.className = 'passenger-rides-more'
      more.textContent = ht ? 'Plis' : 'Plus'
      more.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!hasExtra) {
          let note = details.querySelector<HTMLElement>('.passenger-rides-more-note')
          if (!note) {
            note = document.createElement('div')
            note.className = 'passenger-rides-more-note'
            more.insertAdjacentElement('afterend', note)
          }
          note.textContent = ht ? 'Pa gen lòt trajè pou montre kounye a.' : 'Aucun autre trajet à afficher pour le moment.'
          return
        }
        const showingMore = details.classList.toggle('show-more')
        more.textContent = showingMore ? (ht ? 'Mwens' : 'Moins') : (ht ? 'Plis' : 'Plus')
      })
      details.appendChild(more)
    }

    const apply = () => {
      const drawer = document.querySelector<HTMLElement>('.nav-drawer')
      const nav = drawer?.querySelector<HTMLElement>('.drawer-nav')
      if (!drawer || !nav) return

      const buttons = Array.from(nav.querySelectorAll<HTMLButtonElement>(':scope > button'))
      const ridesButton = buttons.find((button) => /mes trajets|trajè mwen yo/i.test((button.textContent || '').trim()))
      if (!ridesButton || ridesButton.dataset.passengerRidesReady === 'true') return

      ridesButton.dataset.passengerRidesReady = 'true'
      const details = document.createElement('div')
      details.className = 'passenger-rides-details'
      details.innerHTML = '<div class="passenger-rides-loading">…</div>'
      ridesButton.insertAdjacentElement('afterend', details)

      const arrow = ridesButton.querySelector<HTMLElement>('b:last-child')
      let loaded = false

      const loadRides = async () => {
        if (loaded) return
        const ht = window.localStorage.getItem('taxi-language') === 'ht'
        details.innerHTML = `<div class="passenger-rides-loading">${ht ? 'N ap chaje trajè yo…' : 'Chargement des trajets…'}</div>`
        const { data: auth } = await supabase.auth.getUser()
        const user = auth.user
        if (!user) {
          details.innerHTML = `<div class="passenger-rides-empty">${ht ? 'Konekte pou wè trajè ou yo.' : 'Connectez-vous pour voir vos trajets.'}</div>`
          addMoreButton(details, ht, false)
          return
        }

        const { data, error } = await supabase
          .from('rides')
          .select('id,status,pickup_address,destination_address,final_fare_htg,estimated_fare_htg,requested_at')
          .eq('passenger_id', user.id)
          .order('requested_at', { ascending: false })
          .limit(20)

        if (error) {
          details.innerHTML = `<div class="passenger-rides-empty">${ht ? 'Nou pa ka chaje trajè yo kounye a.' : 'Impossible de charger les trajets pour le moment.'}</div>`
          addMoreButton(details, ht, false)
          return
        }

        const rides = (data ?? []) as Ride[]
        if (!rides.length) {
          details.innerHTML = `<div class="passenger-rides-empty">${ht ? 'Ou poko gen okenn trajè.' : 'Vous n’avez encore aucun trajet.'}</div>`
          addMoreButton(details, ht, false)
          loaded = true
          return
        }

        details.innerHTML = ''
        rides.sort((a, b) => Number(isActive(b.status)) - Number(isActive(a.status)))
        rides.forEach((ride, index) => {
          const card = document.createElement('div')
          card.className = `passenger-ride-card${isActive(ride.status) ? ' active' : ''}${index >= 3 ? ' passenger-ride-extra' : ''}`
          const date = new Date(ride.requested_at)
          const fare = ride.final_fare_htg ?? ride.estimated_fare_htg
          card.innerHTML = `
            <div class="passenger-ride-top">
              <span class="passenger-ride-status">${escapeHtml(statusLabel(ride.status, ht))}</span>
              <span class="passenger-ride-date">${escapeHtml(date.toLocaleString(ht ? 'fr-HT' : 'fr-FR', { dateStyle: 'short', timeStyle: 'short' }))}</span>
            </div>
            <div class="passenger-ride-route">📍 ${escapeHtml(ride.pickup_address || '—')}</div>
            <div class="passenger-ride-route">→ ${escapeHtml(ride.destination_address || '—')}</div>
            <div class="passenger-ride-price">${fare != null ? `${Number(fare).toLocaleString()} HTG` : '—'}</div>
          `
          details.appendChild(card)
        })

        addMoreButton(details, ht, rides.length > 3)
        loaded = true
      }

      ridesButton.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        const open = details.classList.toggle('open')
        if (arrow) arrow.style.transform = open ? 'rotate(90deg)' : 'rotate(0deg)'
        if (open) void loadRides()
      }, true)
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      document.getElementById(styleId)?.remove()
    }
  }, [])

  return null
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] ?? char))
}
