'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

type Contact = { id: string; name: string; phone: string }
type RideBundle = {
  ride_id: string
  ride_status: string
  pickup_address?: string | null
  destination_address?: string | null
  driver_name?: string | null
  vehicle_make?: string | null
  vehicle_model?: string | null
  vehicle_color?: string | null
  plate_number?: string | null
  estimated_duration_min?: number | null
}

export default function PassengerTrustedRideShare() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/passenger/dashboard') return

    const styleId = 'passenger-trusted-ride-share-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .trusted-ride-share{margin-top:8px;border-top:1px solid #e4eaf1;padding-top:8px}
        .trusted-ride-share>small{display:block;margin-bottom:6px;color:#7a8997;font-size:9px;font-weight:750}
        .trusted-ride-share-buttons{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}.trusted-ride-share-buttons::-webkit-scrollbar{display:none}
        .trusted-ride-share-buttons a{flex:0 0 auto;text-decoration:none;border:1px solid #cfe0fb;background:#f2f7ff;color:#185fc2;border-radius:11px;padding:8px 10px;font-size:10px;font-weight:900;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      `
      document.head.appendChild(style)
    }

    let stopped = false
    let building = false

    const getLang = () => localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'

    async function build() {
      if (stopped || building) return
      const card = document.querySelector<HTMLElement>('.driverCard')
      const actions = card?.querySelector<HTMLElement>('.safetyActions')
      if (!card || !actions || card.querySelector('.trusted-ride-share')) return

      building = true
      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user
      if (!user || stopped) { building = false; return }

      const [{ data: contacts }, { data: rideData }] = await Promise.all([
        supabase.from('trusted_contacts').select('id,name,phone').eq('passenger_id', user.id).order('created_at', { ascending: true }).limit(2),
        supabase.rpc('get_passenger_active_ride_bundle'),
      ])
      if (stopped || !actions.isConnected) { building = false; return }
      const list = (contacts ?? []) as Contact[]
      const ride = (Array.isArray(rideData) ? rideData[0] : rideData) as RideBundle | null
      if (!list.length || !ride) { building = false; return }

      const ht = getLang() === 'ht'
      const vehicle = [ride.vehicle_make, ride.vehicle_model].filter(Boolean).join(' ') || (ht ? 'Veyikil' : 'Véhicule')
      const statusMap: Record<string, string> = ht
        ? { accepted: 'Chofè a ap vini', driver_arriving: 'Chofè a rive', in_progress: 'Trajè an kou' }
        : { accepted: 'Chauffeur en route', driver_arriving: 'Chauffeur arrivé', in_progress: 'Trajet en cours' }
      const status = statusMap[ride.ride_status] || ride.ride_status
      const pickup = ride.pickup_address || (ht ? 'Pa disponib' : 'Indisponible')
      const destination = ride.destination_address || (ht ? 'Pa disponib' : 'Indisponible')
      const text = ht
        ? `M ap pataje trajè Taxi Platform Haiti mwen an.\nChofè: ${ride.driver_name || '—'}\nMachin: ${vehicle} (${ride.vehicle_color || '—'})\nPlak: ${ride.plate_number || '—'}\nSoti: ${pickup}\nAle: ${destination}\nEstati: ${status}${ride.estimated_duration_min ? `\nTan estime: ${ride.estimated_duration_min} min` : ''}`
        : `Je partage mon trajet Taxi Platform Haiti.\nChauffeur : ${ride.driver_name || '—'}\nVéhicule : ${vehicle} (${ride.vehicle_color || '—'})\nPlaque : ${ride.plate_number || '—'}\nDépart : ${pickup}\nDestination : ${destination}\nStatut : ${status}${ride.estimated_duration_min ? `\nDurée estimée : ${ride.estimated_duration_min} min` : ''}`

      const wrap = document.createElement('div')
      wrap.className = 'trusted-ride-share'
      const label = document.createElement('small')
      label.textContent = ht ? 'Pataje rapid ak kontak konfyans' : 'Partager rapidement avec un contact de confiance'
      const buttons = document.createElement('div')
      buttons.className = 'trusted-ride-share-buttons'
      list.forEach((contact) => {
        const link = document.createElement('a')
        link.href = `sms:${contact.phone}?body=${encodeURIComponent(text)}`
        link.textContent = `✉ ${contact.name}`
        link.setAttribute('aria-label', ht ? `Pataje trajè ak ${contact.name}` : `Partager le trajet avec ${contact.name}`)
        buttons.appendChild(link)
      })
      wrap.append(label, buttons)
      actions.insertAdjacentElement('afterend', wrap)
      building = false
    }

    void build()
    const observer = new MutationObserver(() => { void build() })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      stopped = true
      observer.disconnect()
      document.querySelectorAll('.trusted-ride-share').forEach((el) => el.remove())
      document.getElementById(styleId)?.remove()
    }
  }, [pathname])

  return null
}
