'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

type SupportRow = {
  id: string
  category: string
  message: string
  status: string
  admin_note: string | null
  created_at: string
}

export default function PassengerNativeHelpPanelPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/passenger/dashboard') return

    const styleId = 'passenger-native-help-panel-polish'
    document.getElementById(styleId)?.remove()
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .native-help-center{display:grid;gap:10px;padding:14px 16px 24px;color:#243747}
      .native-help-card{border:1px solid #e1e8ec;border-radius:14px;background:#fff;overflow:hidden}
      .native-help-title{display:flex;align-items:center;gap:9px;width:100%;border:0;background:#fff;color:#243747;padding:13px 14px;text-align:left;font-size:13px;font-weight:850}
      .native-help-title span:last-child{margin-left:auto;color:#83919d}
      .native-help-body{display:none;padding:0 14px 14px;font-size:11.5px;line-height:1.45;color:#5d6d7b}
      .native-help-body.open{display:grid;gap:8px}
      .native-help-input,.native-help-select,.native-help-text{width:100%;box-sizing:border-box;border:1px solid #d8e1e6;border-radius:10px;background:#fff;color:#243747;font:inherit;padding:9px 10px}
      .native-help-text{min-height:82px;resize:vertical}
      .native-help-send{width:100%;border:0;border-radius:10px;background:#0f6f59;color:#fff;font-size:11.5px;font-weight:850;padding:10px}
      .native-help-send:disabled{opacity:.55}
      .native-help-status{font-size:10.5px;color:#0f6f59;min-height:14px}
      .native-help-emergency{border-color:#f0cccc;background:#fff8f8}
      .native-help-emergency .native-help-title{background:#fff8f8;color:#9a3030}
      .native-help-emergency .native-help-send{background:#9a3030}
      .native-help-faq button{border:0;background:#f6f8f9;border-radius:9px;padding:9px 10px;color:#243747;font-size:11px;font-weight:750;text-align:left}
      .native-help-faq p{display:none;margin:0;padding:0 8px 4px;color:#637382}
      .native-help-faq p.open{display:block}
      .native-help-ticket{border:1px solid #e7ecef;border-radius:10px;padding:9px;background:#fafcfc;display:grid;gap:4px}
      .native-help-ticket strong{font-size:11px;color:#243747}
      .native-help-ticket small{font-size:9.5px;color:#7b8996}
      .native-help-admin{padding:7px 8px;border-radius:8px;background:#eef7f4;color:#315c50;font-size:10.5px}
      .native-help-ai-answer{padding:9px 10px;border-radius:10px;background:#f4f8f7;color:#4d5e6b;white-space:pre-line}
    `
    document.head.appendChild(style)

    let applying = false

    const apply = () => {
      if (applying) return
      const panel = document.querySelector<HTMLElement>('.account-panel')
      if (!panel) return
      const header = panel.querySelector<HTMLElement>('.panel-header strong')
      const title = (header?.textContent || '').trim().toLowerCase()
      if (!/(centre d’aide|centre d'aide|sant èd|sant ed)/i.test(title)) return

      const body = panel.querySelector<HTMLElement>('.panel-body')
      if (!body || body.dataset.nativeHelpReady === 'true') return
      applying = true
      body.dataset.nativeHelpReady = 'true'

      const ht = window.localStorage.getItem('taxi-language') === 'ht'
      if (header) header.textContent = ht ? 'Èd' : 'Aide'

      body.className = 'panel-body native-help-center'
      body.innerHTML = `
        <div class="native-help-card">
          <button type="button" class="native-help-title"><span>🤖</span><b>${ht ? 'Asistan Taxi Haiti' : 'Assistant Taxi Haiti'}</b><span>›</span></button>
          <div class="native-help-body">
            <div class="native-help-ai-answer">${ht ? 'Mwen ka verifye dènye trajè ou, pri, peman, chofè ak machin si done yo disponib.' : 'Je peux vérifier votre dernier trajet, son prix, son paiement, son chauffeur et son véhicule si les données sont disponibles.'}</div>
            <input class="native-help-input native-help-ai-input" placeholder="${ht ? 'Ekri kesyon ou…' : 'Écrivez votre question…'}" />
            <button type="button" class="native-help-send native-help-ai-send">${ht ? 'Mande asistan an' : 'Demander à l’assistant'}</button>
          </div>
        </div>

        <div class="native-help-card native-help-faq">
          <button type="button" class="native-help-title"><span>❓</span><b>FAQ</b><span>›</span></button>
          <div class="native-help-body">
            <button type="button">${ht ? 'Kijan pou anile yon trajè?' : 'Comment annuler un trajet ?'}</button><p>${ht ? 'Si trajè a poko kòmanse, sèvi ak opsyon anilasyon ki parèt sou trajè aktif la.' : 'Si le trajet n’a pas encore commencé, utilisez l’option d’annulation affichée sur le trajet actif.'}</p>
            <button type="button">${ht ? 'Kisa pou m fè si chofè a pa vini?' : 'Que faire si le chauffeur ne vient pas ?'}</button><p>${ht ? 'Verifye estati trajè a, epi itilize Rapòte pwoblèm ak trajè oswa Kontakte sipò.' : 'Vérifiez le statut du trajet, puis utilisez Signaler un problème de trajet ou Contacter le support.'}</p>
            <button type="button">${ht ? 'Kijan peman an mache?' : 'Comment fonctionne le paiement ?'}</button><p>${ht ? 'Peman dijital ap pase atravè platfòm nan lè entegrasyon MonCash/NatCash reyèl la aktive. Kounye a app la prepare estrikti a.' : 'Le paiement numérique passera par la plateforme lorsque l’intégration réelle MonCash/NatCash sera activée. La structure est actuellement préparée.'}</p>
          </div>
        </div>

        <div class="native-help-card">
          <button type="button" class="native-help-title"><span>📋</span><b>${ht ? 'Suivi demann mwen yo' : 'Suivi de mes demandes'}</b><span>›</span></button>
          <div class="native-help-body native-help-tracking"><div class="native-help-status">${ht ? 'Peze pou wè demann ou yo.' : 'Ouvrez pour voir vos demandes.'}</div></div>
        </div>

        <div class="native-help-card">
          <button type="button" class="native-help-title"><span>🚕</span><b>${ht ? 'Rapòte pwoblèm ak trajè' : 'Signaler un problème de trajet'}</b><span>›</span></button>
          <div class="native-help-body">
            <select class="native-help-select native-help-ride-reason"><option>${ht ? 'Chofè pa vini' : 'Chauffeur absent'}</option><option>${ht ? 'Trajè anile san rezon' : 'Trajet annulé sans raison'}</option><option>${ht ? 'Move destinasyon' : 'Mauvaise destination'}</option><option>${ht ? 'Twòp reta' : 'Retard important'}</option><option>${ht ? 'Lòt' : 'Autre'}</option></select>
            <textarea class="native-help-text native-help-ride-text" maxlength="2000" placeholder="${ht ? 'Eksplike pwoblèm nan…' : 'Expliquez le problème…'}"></textarea>
            <button type="button" class="native-help-send native-help-ride-send">${ht ? 'Voye rapò a' : 'Envoyer le signalement'}</button>
            <div class="native-help-status native-help-ride-status"></div>
          </div>
        </div>

        <div class="native-help-card">
          <button type="button" class="native-help-title"><span>🚘</span><b>${ht ? 'Rapòte yon chofè' : 'Signaler un chauffeur'}</b><span>›</span></button>
          <div class="native-help-body">
            <select class="native-help-select native-help-driver-reason"><option>${ht ? 'Konpòtman' : 'Comportement'}</option><option>${ht ? 'Sekirite' : 'Sécurité'}</option><option>${ht ? 'Pri oswa peman' : 'Prix ou paiement'}</option><option>${ht ? 'Machin oswa plak' : 'Véhicule ou plaque'}</option><option>${ht ? 'Lòt' : 'Autre'}</option></select>
            <textarea class="native-help-text native-help-driver-text" maxlength="2000" placeholder="${ht ? 'Eksplike sa ki pase…' : 'Expliquez ce qui s’est passé…'}"></textarea>
            <button type="button" class="native-help-send native-help-driver-send">${ht ? 'Voye rapò a' : 'Envoyer le signalement'}</button>
            <div class="native-help-status native-help-driver-status"></div>
          </div>
        </div>

        <div class="native-help-card native-help-emergency">
          <button type="button" class="native-help-title"><span>🆘</span><b>${ht ? 'Sekirite ijan' : 'Sécurité urgente'}</b><span>›</span></button>
          <div class="native-help-body">
            <div>${ht ? 'Pou danje imedya, kontakte sèvis ijans lokal yo an premye. Bouton sa a voye yon rapò ijans bay admin Taxi Haiti; li pa rele sèvis ijans otomatikman.' : 'En cas de danger immédiat, contactez d’abord les services d’urgence locaux. Ce bouton envoie un signalement urgent à l’administrateur Taxi Haiti; il n’appelle pas automatiquement les secours.'}</div>
            <textarea class="native-help-text native-help-emergency-text" maxlength="2000" placeholder="${ht ? 'Eksplike sitiyasyon an…' : 'Décrivez la situation…'}"></textarea>
            <button type="button" class="native-help-send native-help-emergency-send">${ht ? 'Voye rapò IJAN' : 'Envoyer le signalement URGENT'}</button>
            <div class="native-help-status native-help-emergency-status"></div>
          </div>
        </div>

        <div class="native-help-card">
          <button type="button" class="native-help-title"><span>💬</span><b>${ht ? 'Kontakte sipò' : 'Contacter le support'}</b><span>›</span></button>
          <div class="native-help-body">
            <select class="native-help-select native-help-support-category"><option value="general">${ht ? 'Jeneral' : 'Général'}</option><option value="ride">${ht ? 'Trajè' : 'Trajet'}</option><option value="payment">${ht ? 'Peman' : 'Paiement'}</option><option value="account">${ht ? 'Kont' : 'Compte'}</option><option value="safety">${ht ? 'Sekirite' : 'Sécurité'}</option><option value="price">${ht ? 'Pri' : 'Prix'}</option></select>
            <textarea class="native-help-text native-help-support-text" maxlength="2000" placeholder="${ht ? 'Ekri mesaj ou…' : 'Écrivez votre message…'}"></textarea>
            <button type="button" class="native-help-send native-help-support-send">${ht ? 'Voye bay sipò' : 'Envoyer au support'}</button>
            <div class="native-help-status native-help-support-status"></div>
          </div>
        </div>
      `

      body.querySelectorAll<HTMLButtonElement>('.native-help-title').forEach((button) => {
        button.addEventListener('click', () => {
          const content = button.nextElementSibling as HTMLElement | null
          content?.classList.toggle('open')
          const arrow = button.querySelector<HTMLElement>('span:last-child')
          if (arrow) arrow.textContent = content?.classList.contains('open') ? '⌄' : '›'
          if (content?.classList.contains('native-help-tracking') && content.classList.contains('open')) void loadTickets(content)
        })
      })

      body.querySelectorAll<HTMLElement>('.native-help-faq .native-help-body > button').forEach((button) => {
        button.addEventListener('click', () => (button.nextElementSibling as HTMLElement | null)?.classList.toggle('open'))
      })

      const currentUser = async () => (await supabase.auth.getUser()).data.user
      const latestRide = async (withDriver = false) => {
        const user = await currentUser()
        if (!user) return null
        let query = supabase.from('rides').select('id,driver_id,vehicle_id,status,pickup_address,destination_address,estimated_fare_htg,final_fare_htg').eq('passenger_id', user.id)
        if (withDriver) query = query.not('driver_id', 'is', null)
        const { data } = await query.order('requested_at', { ascending: false }).limit(1)
        return (data ?? [])[0] ?? null
      }

      const insertSupport = async (category: string, message: string, rideId: string | null) => {
        const user = await currentUser()
        if (!user) return { error: new Error('not-authenticated') }
        return supabase.from('support_requests').insert({ passenger_id: user.id, ride_id: rideId, category, message })
      }

      const sendSimple = async (kind: 'ride' | 'driver' | 'emergency' | 'support') => {
        const textEl = body.querySelector<HTMLTextAreaElement>(`.native-help-${kind}-text`)
        const statusEl = body.querySelector<HTMLElement>(`.native-help-${kind}-status`)
        const sendEl = body.querySelector<HTMLButtonElement>(`.native-help-${kind}-send`)
        const message = textEl?.value.trim() || ''
        if (message.length < 3) { if (statusEl) statusEl.textContent = ht ? 'Ekri kèk detay anvan ou voye.' : 'Ajoutez quelques détails avant l’envoi.'; return }
        if (sendEl) sendEl.disabled = true
        if (statusEl) statusEl.textContent = ht ? 'N ap voye…' : 'Envoi…'
        const ride = await latestRide(kind === 'driver')
        if ((kind === 'ride' || kind === 'driver') && !ride?.id) {
          if (statusEl) statusEl.textContent = ht ? 'Nou pa jwenn trajè ki konsène a.' : 'Aucun trajet concerné n’a été trouvé.'
          if (sendEl) sendEl.disabled = false
          return
        }
        const reason = kind === 'ride' ? body.querySelector<HTMLSelectElement>('.native-help-ride-reason')?.value : kind === 'driver' ? body.querySelector<HTMLSelectElement>('.native-help-driver-reason')?.value : ''
        const category = kind === 'ride' ? 'ride' : kind === 'support' ? (body.querySelector<HTMLSelectElement>('.native-help-support-category')?.value || 'general') : 'safety'
        const prefix = kind === 'emergency' ? '[IJAN / URGENT] ' : kind === 'driver' ? `[Rapò chofè / Signalement chauffeur — ${reason}] ` : kind === 'ride' ? `[Pwoblèm trajè / Problème de trajet — ${reason}] ` : ''
        const { error } = await insertSupport(category, `${prefix}${message}`, ride?.id ?? null)
        if (statusEl) statusEl.textContent = error ? (ht ? 'Mesaj la pa pase. Eseye ankò.' : 'Échec de l’envoi. Réessayez.') : (ht ? 'Voye avèk siksè. ✅' : 'Envoyé avec succès. ✅')
        if (!error && textEl) textEl.value = ''
        if (sendEl) sendEl.disabled = false
      }

      body.querySelector<HTMLButtonElement>('.native-help-ride-send')?.addEventListener('click', () => void sendSimple('ride'))
      body.querySelector<HTMLButtonElement>('.native-help-driver-send')?.addEventListener('click', () => void sendSimple('driver'))
      body.querySelector<HTMLButtonElement>('.native-help-emergency-send')?.addEventListener('click', () => void sendSimple('emergency'))
      body.querySelector<HTMLButtonElement>('.native-help-support-send')?.addEventListener('click', () => void sendSimple('support'))

      async function loadTickets(container: HTMLElement) {
        const user = await currentUser()
        if (!user) { container.innerHTML = `<div class="native-help-status">${ht ? 'Ou bezwen konekte.' : 'Vous devez être connecté.'}</div>`; return }
        const { data, error } = await supabase.from('support_requests').select('id,category,message,status,admin_note,created_at').eq('passenger_id', user.id).order('created_at', { ascending: false }).limit(10)
        if (error) { container.innerHTML = `<div class="native-help-status">${ht ? 'Nou pa ka chaje demann yo kounye a.' : 'Impossible de charger les demandes.'}</div>`; return }
        const rows = (data ?? []) as SupportRow[]
        if (!rows.length) { container.innerHTML = `<div class="native-help-status">${ht ? 'Ou poko voye okenn demann.' : 'Vous n’avez encore envoyé aucune demande.'}</div>`; return }
        const statusMap: Record<string,string> = ht ? { open:'Ouvè', in_progress:'An tretman', resolved:'Rezoud', closed:'Fèmen' } : { open:'Ouverte', in_progress:'En traitement', resolved:'Résolue', closed:'Fermée' }
        container.innerHTML = rows.map((row) => `<div class="native-help-ticket"><strong>${statusMap[row.status] || row.status} · ${row.category}</strong><small>${new Date(row.created_at).toLocaleString()}</small><div>${row.message.replace(/</g,'&lt;')}</div>${row.admin_note ? `<div class="native-help-admin"><b>${ht ? 'Repons sipò' : 'Réponse du support'}:</b> ${row.admin_note.replace(/</g,'&lt;')}</div>` : ''}</div>`).join('')
      }

      const aiInput = body.querySelector<HTMLInputElement>('.native-help-ai-input')
      const aiAnswer = body.querySelector<HTMLElement>('.native-help-ai-answer')
      const aiSend = body.querySelector<HTMLButtonElement>('.native-help-ai-send')
      aiSend?.addEventListener('click', async () => {
        const q = (aiInput?.value || '').toLowerCase()
        if (!q.trim()) return
        aiSend.disabled = true
        if (aiAnswer) aiAnswer.textContent = ht ? 'M ap verifye done yo…' : 'Vérification des données…'
        const ride = await latestRide(false)
        if (!ride) {
          if (aiAnswer) aiAnswer.textContent = ht ? 'Pa gen trajè pou m verifye kounye a.' : 'Aucun trajet à vérifier pour le moment.'
        } else if (/chof|chauff|machin|voiture|vehicule|véhicule|plak|plaque/.test(q) && ride.driver_id) {
          const [{ data: driver }, { data: vehicle }] = await Promise.all([
            supabase.from('profiles').select('full_name').eq('id', ride.driver_id).maybeSingle(),
            ride.vehicle_id ? supabase.from('vehicles').select('make,model,color,plate_number').eq('id', ride.vehicle_id).maybeSingle() : Promise.resolve({ data: null } as any),
          ])
          if (aiAnswer) aiAnswer.textContent = ht
            ? `Chofè: ${driver?.full_name || '—'}\nMachin: ${vehicle ? `${vehicle.make} ${vehicle.model}` : '—'}\nKoulè: ${vehicle?.color || '—'}\nPlak: ${vehicle?.plate_number || '—'}`
            : `Chauffeur : ${driver?.full_name || '—'}\nVéhicule : ${vehicle ? `${vehicle.make} ${vehicle.model}` : '—'}\nCouleur : ${vehicle?.color || '—'}\nPlaque : ${vehicle?.plate_number || '—'}`
        } else {
          const fare = ride.final_fare_htg ?? ride.estimated_fare_htg
          if (aiAnswer) aiAnswer.textContent = ht
            ? `Estati: ${ride.status}\nDepa: ${ride.pickup_address || '—'}\nDestinasyon: ${ride.destination_address || '—'}${fare != null ? `\nPri: ${Number(fare).toLocaleString()} HTG` : ''}`
            : `Statut : ${ride.status}\nDépart : ${ride.pickup_address || '—'}\nDestination : ${ride.destination_address || '—'}${fare != null ? `\nPrix : ${Number(fare).toLocaleString()} HTG` : ''}`
        }
        aiSend.disabled = false
        if (aiInput) aiInput.value = ''
      })

      applying = false
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
