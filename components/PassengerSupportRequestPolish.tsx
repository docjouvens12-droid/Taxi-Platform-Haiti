'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PassengerSupportRequestPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/passenger/dashboard') return

    const styleId = 'passenger-support-request-polish'
    document.getElementById(styleId)?.remove()
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .passenger-support-box,.passenger-driver-report-box,.passenger-ride-report-box{display:none;gap:6px;padding:7px;border:1px solid #dce4e8;border-radius:9px;background:#f8fafb}
      .passenger-support-box.open,.passenger-driver-report-box.open,.passenger-ride-report-box.open{display:grid}
      .passenger-support-select,.passenger-support-text,.passenger-driver-report-select,.passenger-driver-report-text,.passenger-ride-report-select,.passenger-ride-report-text{width:100%;box-sizing:border-box;border:1px solid #d6e0e5;border-radius:8px;background:#fff;color:#243747;font-size:10px;padding:7px 8px}
      .passenger-support-text,.passenger-driver-report-text,.passenger-ride-report-text{min-height:72px;resize:vertical;font-family:inherit}
      .passenger-support-send,.passenger-driver-report-send,.passenger-ride-report-send{width:100%;border:0;border-radius:8px;background:#0f6f59;color:#fff;font-size:10.5px;font-weight:850;padding:8px}
      .passenger-support-send:disabled,.passenger-driver-report-send:disabled,.passenger-ride-report-send:disabled{opacity:.55}
      .passenger-support-status,.passenger-driver-report-status,.passenger-ride-report-status{min-height:14px;font-size:9.5px;line-height:1.3;color:#0f6f59}
      .passenger-driver-report,.passenger-ride-report{display:block;width:100%;border:0;border-radius:10px;padding:9px 10px;font-size:11px;font-weight:850;text-align:center}
      .passenger-ride-report{background:#f3f7f9;color:#243747}
      .passenger-driver-report{background:#fff4f4;color:#9a3030}
    `
    document.head.appendChild(style)

    const apply = () => {
      const details = document.querySelector<HTMLElement>('.passenger-help-details')
      const oldContact = details?.querySelector<HTMLButtonElement>('.passenger-help-contact')
      if (!details || !oldContact || oldContact.dataset.realSupportReady === 'true') return

      const ht = window.localStorage.getItem('taxi-language') === 'ht'

      const contact = oldContact.cloneNode(true) as HTMLButtonElement
      contact.dataset.realSupportReady = 'true'
      contact.textContent = ht ? 'Kontakte sipò' : 'Contacter le support'
      oldContact.replaceWith(contact)

      const rideReport = document.createElement('button')
      rideReport.type = 'button'
      rideReport.className = 'passenger-ride-report'
      rideReport.textContent = ht ? 'Rapòte pwoblèm ak trajè' : 'Signaler un problème de trajet'

      const rideReportBox = document.createElement('div')
      rideReportBox.className = 'passenger-ride-report-box'
      rideReportBox.innerHTML = `
        <select class="passenger-ride-report-select" aria-label="${ht ? 'Kalite pwoblèm trajè' : 'Type de problème de trajet'}">
          <option value="driver_no_show">${ht ? 'Chofè pa vini' : 'Chauffeur absent'}</option>
          <option value="cancelled">${ht ? 'Trajè anile san rezon' : 'Trajet annulé sans raison'}</option>
          <option value="wrong_destination">${ht ? 'Move destinasyon' : 'Mauvaise destination'}</option>
          <option value="delay">${ht ? 'Twòp reta' : 'Retard important'}</option>
          <option value="route">${ht ? 'Pwoblèm ak wout la' : 'Problème d’itinéraire'}</option>
          <option value="other">${ht ? 'Lòt' : 'Autre'}</option>
        </select>
        <textarea class="passenger-ride-report-text" maxlength="2000" placeholder="${ht ? 'Eksplike pwoblèm trajè a…' : 'Expliquez le problème du trajet…'}"></textarea>
        <button type="button" class="passenger-ride-report-send">${ht ? 'Voye pwoblèm nan' : 'Envoyer le problème'}</button>
        <div class="passenger-ride-report-status" aria-live="polite"></div>
      `

      const report = document.createElement('button')
      report.type = 'button'
      report.className = 'passenger-driver-report'
      report.textContent = ht ? 'Rapòte yon chofè' : 'Signaler un chauffeur'

      const reportBox = document.createElement('div')
      reportBox.className = 'passenger-driver-report-box'
      reportBox.innerHTML = `
        <select class="passenger-driver-report-select" aria-label="${ht ? 'Rezon rapò a' : 'Motif du signalement'}">
          <option value="behavior">${ht ? 'Konpòtman' : 'Comportement'}</option>
          <option value="safety">${ht ? 'Sekirite' : 'Sécurité'}</option>
          <option value="price">${ht ? 'Pri oswa peman' : 'Prix ou paiement'}</option>
          <option value="vehicle">${ht ? 'Machin oswa plak' : 'Véhicule ou plaque'}</option>
          <option value="other">${ht ? 'Lòt' : 'Autre'}</option>
        </select>
        <textarea class="passenger-driver-report-text" maxlength="2000" placeholder="${ht ? 'Eksplike sa ki pase…' : 'Expliquez ce qui s’est passé…'}"></textarea>
        <button type="button" class="passenger-driver-report-send">${ht ? 'Voye rapò a' : 'Envoyer le signalement'}</button>
        <div class="passenger-driver-report-status" aria-live="polite"></div>
      `

      contact.insertAdjacentElement('beforebegin', rideReport)
      rideReport.insertAdjacentElement('afterend', rideReportBox)
      rideReportBox.insertAdjacentElement('afterend', report)
      report.insertAdjacentElement('afterend', reportBox)

      rideReport.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        rideReportBox.classList.toggle('open')
      })

      const rideSelect = rideReportBox.querySelector<HTMLSelectElement>('.passenger-ride-report-select')
      const rideText = rideReportBox.querySelector<HTMLTextAreaElement>('.passenger-ride-report-text')
      const rideSend = rideReportBox.querySelector<HTMLButtonElement>('.passenger-ride-report-send')
      const rideStatus = rideReportBox.querySelector<HTMLElement>('.passenger-ride-report-status')

      rideSend?.addEventListener('click', async (event) => {
        event.preventDefault()
        event.stopPropagation()
        const message = rideText?.value.trim() || ''
        if (message.length < 3) {
          if (rideStatus) rideStatus.textContent = ht ? 'Eksplike pwoblèm trajè a anvan ou voye.' : 'Expliquez le problème du trajet avant de l’envoyer.'
          return
        }

        rideSend.disabled = true
        if (rideStatus) rideStatus.textContent = ht ? 'N ap voye pwoblèm nan…' : 'Envoi du problème…'

        const { data: auth } = await supabase.auth.getUser()
        const user = auth.user
        if (!user) {
          if (rideStatus) rideStatus.textContent = ht ? 'Ou bezwen konekte pou voye pwoblèm nan.' : 'Vous devez être connecté pour envoyer le problème.'
          rideSend.disabled = false
          return
        }

        const { data: rideData } = await supabase
          .from('rides')
          .select('id')
          .eq('passenger_id', user.id)
          .order('requested_at', { ascending: false })
          .limit(1)

        const rideId = (rideData ?? [])[0]?.id ?? null
        if (!rideId) {
          if (rideStatus) rideStatus.textContent = ht ? 'Nou pa jwenn okenn trajè pou rapòte.' : 'Aucun trajet n’a été trouvé.'
          rideSend.disabled = false
          return
        }

        const reasonMap: Record<string, string> = ht
          ? { driver_no_show: 'Chofè pa vini', cancelled: 'Trajè anile san rezon', wrong_destination: 'Move destinasyon', delay: 'Twòp reta', route: 'Pwoblèm ak wout la', other: 'Lòt' }
          : { driver_no_show: 'Chauffeur absent', cancelled: 'Trajet annulé sans raison', wrong_destination: 'Mauvaise destination', delay: 'Retard important', route: 'Problème d’itinéraire', other: 'Autre' }
        const reason = reasonMap[rideSelect?.value || 'other'] || reasonMap.other

        const { error } = await supabase.from('support_requests').insert({
          passenger_id: user.id,
          ride_id: rideId,
          category: 'ride',
          message: `[${ht ? 'Pwoblèm trajè' : 'Problème trajet'} — ${reason}] ${message}`,
        })

        if (error) {
          if (rideStatus) rideStatus.textContent = ht ? 'Pwoblèm nan pa pase. Eseye ankò.' : 'Le problème n’a pas été envoyé. Réessayez.'
        } else {
          if (rideStatus) rideStatus.textContent = ht ? 'Pwoblèm trajè a voye bay admin. ✅' : 'Le problème du trajet a été envoyé à l’administrateur. ✅'
          if (rideText) rideText.value = ''
        }
        rideSend.disabled = false
      })

      report.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        reportBox.classList.toggle('open')
      })

      const reportSelect = reportBox.querySelector<HTMLSelectElement>('.passenger-driver-report-select')
      const reportText = reportBox.querySelector<HTMLTextAreaElement>('.passenger-driver-report-text')
      const reportSend = reportBox.querySelector<HTMLButtonElement>('.passenger-driver-report-send')
      const reportStatus = reportBox.querySelector<HTMLElement>('.passenger-driver-report-status')

      reportSend?.addEventListener('click', async (event) => {
        event.preventDefault()
        event.stopPropagation()
        const message = reportText?.value.trim() || ''
        if (message.length < 3) {
          if (reportStatus) reportStatus.textContent = ht ? 'Eksplike pwoblèm nan anvan ou voye.' : 'Expliquez le problème avant de l’envoyer.'
          return
        }

        reportSend.disabled = true
        if (reportStatus) reportStatus.textContent = ht ? 'N ap voye rapò a…' : 'Envoi du signalement…'

        const { data: auth } = await supabase.auth.getUser()
        const user = auth.user
        if (!user) {
          if (reportStatus) reportStatus.textContent = ht ? 'Ou bezwen konekte pou voye rapò a.' : 'Vous devez être connecté pour envoyer le signalement.'
          reportSend.disabled = false
          return
        }

        const { data: rideData } = await supabase
          .from('rides')
          .select('id,driver_id')
          .eq('passenger_id', user.id)
          .not('driver_id', 'is', null)
          .order('requested_at', { ascending: false })
          .limit(1)

        const ride = (rideData ?? [])[0] as { id?: string; driver_id?: string | null } | undefined
        if (!ride?.id || !ride.driver_id) {
          if (reportStatus) reportStatus.textContent = ht ? 'Nou pa jwenn yon trajè ki gen chofè pou rapòte.' : 'Aucun trajet avec chauffeur n’a été trouvé.'
          reportSend.disabled = false
          return
        }

        const reasonMap: Record<string, string> = ht
          ? { behavior: 'Konpòtman', safety: 'Sekirite', price: 'Pri oswa peman', vehicle: 'Machin oswa plak', other: 'Lòt' }
          : { behavior: 'Comportement', safety: 'Sécurité', price: 'Prix ou paiement', vehicle: 'Véhicule ou plaque', other: 'Autre' }
        const reason = reasonMap[reportSelect?.value || 'other'] || reasonMap.other

        const { error } = await supabase.from('support_requests').insert({
          passenger_id: user.id,
          ride_id: ride.id,
          category: 'safety',
          message: `[${ht ? 'Rapò chofè' : 'Signalement chauffeur'} — ${reason}] ${message}`,
        })

        if (error) {
          if (reportStatus) reportStatus.textContent = ht ? 'Rapò a pa pase. Eseye ankò.' : 'Le signalement n’a pas été envoyé. Réessayez.'
        } else {
          if (reportStatus) reportStatus.textContent = ht ? 'Rapò a voye bay admin. ✅' : 'Signalement envoyé à l’administrateur. ✅'
          if (reportText) reportText.value = ''
        }
        reportSend.disabled = false
      })

      const box = document.createElement('div')
      box.className = 'passenger-support-box'
      box.innerHTML = `
        <select class="passenger-support-select" aria-label="${ht ? 'Kategori' : 'Catégorie'}">
          <option value="general">${ht ? 'Jeneral' : 'Général'}</option>
          <option value="ride">${ht ? 'Pwoblèm ak trajè' : 'Problème de trajet'}</option>
          <option value="payment">${ht ? 'Pwoblèm ak peman' : 'Problème de paiement'}</option>
          <option value="account">${ht ? 'Kont mwen' : 'Mon compte'}</option>
          <option value="safety">${ht ? 'Sekirite' : 'Sécurité'}</option>
          <option value="price">${ht ? 'Kesyon sou pri' : 'Question sur le prix'}</option>
        </select>
        <textarea class="passenger-support-text" maxlength="2000" placeholder="${ht ? 'Ekri mesaj ou pou sipò…' : 'Écrivez votre message au support…'}"></textarea>
        <button type="button" class="passenger-support-send">${ht ? 'Voye bay sipò' : 'Envoyer au support'}</button>
        <div class="passenger-support-status" aria-live="polite"></div>
      `
      contact.insertAdjacentElement('afterend', box)

      contact.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        box.classList.toggle('open')
      })

      const select = box.querySelector<HTMLSelectElement>('.passenger-support-select')
      const text = box.querySelector<HTMLTextAreaElement>('.passenger-support-text')
      const send = box.querySelector<HTMLButtonElement>('.passenger-support-send')
      const status = box.querySelector<HTMLElement>('.passenger-support-status')

      send?.addEventListener('click', async (event) => {
        event.preventDefault()
        event.stopPropagation()
        const message = text?.value.trim() || ''
        if (message.length < 3) {
          if (status) status.textContent = ht ? 'Ekri yon mesaj anvan ou voye.' : 'Écrivez un message avant de l’envoyer.'
          return
        }

        send.disabled = true
        if (status) status.textContent = ht ? 'N ap voye mesaj la…' : 'Envoi du message…'

        const { data: auth } = await supabase.auth.getUser()
        const user = auth.user
        if (!user) {
          if (status) status.textContent = ht ? 'Ou bezwen konekte pou voye mesaj la.' : 'Vous devez être connecté pour envoyer le message.'
          send.disabled = false
          return
        }

        const { data: rideData } = await supabase
          .from('rides')
          .select('id')
          .eq('passenger_id', user.id)
          .order('requested_at', { ascending: false })
          .limit(1)
        const rideId = (rideData ?? [])[0]?.id ?? null

        const { error } = await supabase.from('support_requests').insert({
          passenger_id: user.id,
          ride_id: rideId,
          category: select?.value || 'general',
          message,
        })

        if (error) {
          if (status) status.textContent = ht ? 'Mesaj la pa pase. Eseye ankò.' : 'Le message n’a pas été envoyé. Réessayez.'
        } else {
          if (status) status.textContent = ht ? 'Mesaj la voye bay sipò. ✅' : 'Message envoyé au support. ✅'
          if (text) text.value = ''
        }
        send.disabled = false
      })
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
