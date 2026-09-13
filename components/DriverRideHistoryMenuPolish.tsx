'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

type RideHistoryRow = {
  id: string
  pickup_address: string | null
  destination_address: string | null
  final_fare_htg: number | null
  completed_at: string | null
}

export default function DriverRideHistoryMenuPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/driver/dashboard') return

    let applying = false
    const cleanups: Array<() => void> = []

    const formatFare = (value: number | null) => value == null
      ? '—'
      : `${new Intl.NumberFormat('fr-HT', { maximumFractionDigits: 0 }).format(Number(value))} HTG`

    const formatDate = (value: string | null, lang: 'ht' | 'fr') => {
      if (!value) return '—'
      const date = new Date(value)
      return new Intl.DateTimeFormat(lang === 'ht' ? 'fr-HT' : 'fr-FR', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      }).format(date)
    }

    const getRecentRides = async (userId: string) => {
      const { data } = await supabase
        .from('rides')
        .select('id,pickup_address,destination_address,final_fare_htg,completed_at')
        .eq('driver_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(10)
      return (data ?? []) as RideHistoryRow[]
    }

    const removeDuplicates = (drawer: HTMLElement) => {
      const sections = Array.from(drawer.querySelectorAll<HTMLElement>('[data-driver-history="true"]'))
      sections.slice(1).forEach((section) => section.remove())
      return sections[0] ?? null
    }

    const apply = async () => {
      const drawer = document.querySelector('.drawer') as HTMLElement | null
      if (!drawer) return
      if (removeDuplicates(drawer) || applying) return
      applying = true

      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const user = sessionData.session?.user
        if (!user || !drawer.isConnected || removeDuplicates(drawer)) return

        const lang = localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'
        const rides = await getRecentRides(user.id)
        if (!drawer.isConnected || removeDuplicates(drawer)) return

        const section = document.createElement('div')
        section.className = 'menuSection'
        section.dataset.driverHistory = 'true'

        const title = document.createElement('h3')
        title.textContent = lang === 'ht' ? 'Istorik trajè' : 'Historique des trajets'
        Object.assign(title.style, {
          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
          padding: '4px 0', marginBottom: '0', userSelect: 'none'
        })
        title.setAttribute('role', 'button')
        title.setAttribute('tabindex', '0')
        title.setAttribute('aria-expanded', 'false')

        const toggleMark = document.createElement('span')
        toggleMark.textContent = '+'
        toggleMark.setAttribute('aria-hidden', 'true')
        Object.assign(toggleMark.style, { marginLeft: 'auto', fontSize: '24px', fontWeight: '700', lineHeight: '1' })
        title.appendChild(toggleMark)

        const content = document.createElement('div')
        content.style.display = 'none'
        content.style.marginTop = '10px'

        if (rides.length === 0) {
          const empty = document.createElement('div')
          empty.textContent = lang === 'ht' ? 'Ou poko gen trajè ki fini.' : 'Aucun trajet terminé pour le moment.'
          Object.assign(empty.style, { color: '#77879a', fontSize: '12px', padding: '10px 0' })
          content.appendChild(empty)
        } else {
          rides.forEach((ride) => {
            const card = document.createElement('div')
            Object.assign(card.style, {
              border: '1px solid #e3e9ed', borderRadius: '13px', padding: '10px', marginBottom: '8px', background: '#f8fafb'
            })
            const top = document.createElement('div')
            Object.assign(top.style, { display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center', marginBottom: '7px' })
            const date = document.createElement('span')
            date.textContent = formatDate(ride.completed_at, lang)
            Object.assign(date.style, { fontSize: '10px', color: '#7a8998', fontWeight: '700' })
            const fare = document.createElement('strong')
            fare.textContent = formatFare(ride.final_fare_htg)
            Object.assign(fare.style, { fontSize: '12px', color: '#0f6f59' })
            top.append(date, fare)
            const route = document.createElement('div')
            Object.assign(route.style, { fontSize: '11px', lineHeight: '1.4', color: '#34485a' })
            const pickup = document.createElement('div')
            pickup.textContent = `📍 ${ride.pickup_address || '—'}`
            const destination = document.createElement('div')
            destination.textContent = `🏁 ${ride.destination_address || '—'}`
            route.append(pickup, destination)
            card.append(top, route)
            content.appendChild(card)
          })
        }

        section.append(title, content)
        const earnings = drawer.querySelector('[data-driver-earnings="true"]')
        const languageSection = Array.from(drawer.querySelectorAll('.menuSection')).find((el) => {
          const h = el.querySelector('h3')?.textContent?.toLowerCase() || ''
          return h.includes('lang')
        })
        if (earnings) drawer.insertBefore(section, earnings)
        else if (languageSection) drawer.insertBefore(section, languageSection)
        else {
          const logout = drawer.querySelector('.drawerLogout')
          if (logout) drawer.insertBefore(section, logout)
          else drawer.appendChild(section)
        }

        let open = false
        const setOpen = (next: boolean) => {
          open = next
          content.style.display = next ? 'block' : 'none'
          toggleMark.textContent = '+'
          title.setAttribute('aria-expanded', String(next))
        }
        const toggle = () => setOpen(!open)
        const keyToggle = (event: Event) => {
          const keyboard = event as KeyboardEvent
          if (keyboard.key === 'Enter' || keyboard.key === ' ') {
            event.preventDefault()
            toggle()
          }
        }
        title.addEventListener('click', toggle)
        title.addEventListener('keydown', keyToggle)
        cleanups.push(() => {
          title.removeEventListener('click', toggle)
          title.removeEventListener('keydown', keyToggle)
        })
      } finally {
        applying = false
      }
    }

    void apply()
    const retry = window.setInterval(() => { void apply() }, 2000)
    const observer = new MutationObserver(() => { void apply() })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.clearInterval(retry)
      observer.disconnect()
      cleanups.forEach((fn) => fn())
    }
  }, [])

  return null
}
