'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PassengerAiDriverInfoPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/passenger/dashboard') return

    const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const isDriverQuestion = (q: string) => /chofe|chauffeur|driver|machin|voiture|vehicle|vehicule|plak|plaque|koule|couleur|model|modele/.test(normalize(q))

    const answer = async (question: string) => {
      const ht = window.localStorage.getItem('taxi-language') === 'ht'
      const message = document.querySelector<HTMLElement>('.passenger-ai-message')
      const send = document.querySelector<HTMLButtonElement>('.passenger-ai-send')
      if (send) send.disabled = true
      if (message) message.textContent = ht ? 'M ap verifye chofè ak machin nan…' : 'Vérification du chauffeur et du véhicule…'

      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user
      if (!user) {
        if (message) message.textContent = ht ? 'Ou bezwen konekte pou m verifye chofè a.' : 'Vous devez être connecté pour vérifier le chauffeur.'
        if (send) send.disabled = false
        return
      }

      const { data: rides } = await supabase
        .from('rides')
        .select('id,status,driver_id,vehicle_id,requested_at')
        .eq('passenger_id', user.id)
        .not('driver_id', 'is', null)
        .order('requested_at', { ascending: false })
        .limit(1)

      const ride = (rides ?? [])[0] as { driver_id?: string | null; vehicle_id?: string | null; status?: string } | undefined
      if (!ride?.driver_id) {
        if (message) message.textContent = ht ? 'Mwen poko jwenn yon chofè ki asosye ak trajè ou a.' : 'Aucun chauffeur n’est encore associé à votre trajet.'
        if (send) send.disabled = false
        return
      }

      const [{ data: profile }, { data: vehicles }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', ride.driver_id).maybeSingle(),
        ride.vehicle_id
          ? supabase.from('vehicles').select('make,model,color,year,plate_number').eq('id', ride.vehicle_id).maybeSingle()
          : supabase.from('vehicles').select('make,model,color,year,plate_number').eq('driver_id', ride.driver_id).eq('is_active', true).limit(1).maybeSingle(),
      ])

      const driverName = profile?.full_name || (ht ? 'Non chofè a poko disponib' : 'Nom du chauffeur indisponible')
      const vehicle = vehicles as { make?: string | null; model?: string | null; color?: string | null; year?: number | null; plate_number?: string | null } | null
      const q = normalize(question)

      if (!vehicle) {
        if (message) message.textContent = ht
          ? `Chofè: ${driverName}. Mwen poko jwenn enfòmasyon machin nan nan sistèm nan.`
          : `Chauffeur : ${driverName}. Les informations du véhicule ne sont pas encore disponibles.`
        if (send) send.disabled = false
        return
      }

      const vehicleName = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')
      if (/plak|plaque/.test(q)) {
        if (message) message.textContent = ht ? `Plak machin chofè a: ${vehicle.plate_number || 'poko disponib'}.` : `Plaque du véhicule : ${vehicle.plate_number || 'indisponible'}.`
      } else if (/koule|couleur/.test(q)) {
        if (message) message.textContent = ht ? `Koulè machin nan: ${vehicle.color || 'poko disponib'}.` : `Couleur du véhicule : ${vehicle.color || 'indisponible'}.`
      } else {
        if (message) message.textContent = ht
          ? `Chofè: ${driverName}\nMachin: ${vehicleName || '—'}\nKoulè: ${vehicle.color || '—'}\nPlak: ${vehicle.plate_number || '—'}`
          : `Chauffeur : ${driverName}\nVéhicule : ${vehicleName || '—'}\nCouleur : ${vehicle.color || '—'}\nPlaque : ${vehicle.plate_number || '—'}`
      }
      if (send) send.disabled = false
    }

    const clickCapture = (event: Event) => {
      const target = event.target as HTMLElement | null
      const send = target?.closest('.passenger-ai-send')
      if (!send) return
      const input = document.querySelector<HTMLInputElement>('.passenger-ai-input')
      const question = input?.value.trim() || ''
      if (!question || !isDriverQuestion(question)) return
      event.preventDefault(); event.stopPropagation(); if ('stopImmediatePropagation' in event) event.stopImmediatePropagation()
      void answer(question).finally(() => { if (input) input.value = '' })
    }

    const keyCapture = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (event.key !== 'Enter' || !target?.classList.contains('passenger-ai-input')) return
      const input = target as HTMLInputElement
      const question = input.value.trim()
      if (!question || !isDriverQuestion(question)) return
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation()
      void answer(question).finally(() => { input.value = '' })
    }

    document.addEventListener('click', clickCapture, true)
    document.addEventListener('keydown', keyCapture, true)
    return () => {
      document.removeEventListener('click', clickCapture, true)
      document.removeEventListener('keydown', keyCapture, true)
    }
  }, [])
  return null
}
