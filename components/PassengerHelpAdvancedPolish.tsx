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
  updated_at: string
}

export default function PassengerHelpAdvancedPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/passenger/dashboard') return

    const ht = window.localStorage.getItem('taxi-language') === 'ht'
    const styleId = 'passenger-help-advanced-polish'
    document.getElementById(styleId)?.remove()
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .passenger-help-advanced-btn{width:100%;display:grid;grid-template-columns:22px minmax(0,1fr) 12px;align-items:center;gap:7px;border:0;background:#f7f9fa;color:#243747;border-radius:10px;padding:9px 8px;text-align:left;font-size:11px;font-weight:750;line-height:1.2}
      .passenger-help-advanced-btn span:first-child{font-size:14px}.passenger-help-advanced-btn span:last-child{font-size:14px;color:#8794a0;text-align:right}
      .passenger-help-advanced-box{display:none;gap:6px;padding:7px;border:1px solid #dce4e8;border-radius:9px;background:#f8fafb}.passenger-help-advanced-box.open{display:grid}
      .passenger-faq-q{width:100%;border:0;border-radius:8px;background:#fff;color:#243747;padding:8px;text-align:left;font-size:10px;font-weight:800}.passenger-faq-a{display:none;padding:7px 8px;border-radius:8px;background:#fff;color:#607080;font-size:9.7px;line-height:1.35}.passenger-faq-a.open{display:block}
      .passenger-support-history-card{display:grid;gap:3px;padding:7px 8px;border-radius:8px;background:#fff;border:1px solid #e4eaed;font-size:9.6px;color:#526273}.passenger-support-history-top{display:flex;justify-content:space-between;gap:8px;font-weight:800;color:#243747}.passenger-support-history-status{font-weight:850;color:#0f6f59}.passenger-support-history-note{padding-top:3px;border-top:1px solid #edf1f3;color:#43586a}.passenger-support-history-empty{font-size:9.7px;color:#6d7b88;text-align:center;padding:8px}
      .passenger-urgent-btn{width:100%;display:grid;grid-template-columns:22px minmax(0,1fr) 12px;align-items:center;gap:7px;border:1px solid #f1d0d0;background:#fff4f4;color:#9a3030;border-radius:10px;padding:9px 8px;text-align:left;font-size:11px;font-weight:850}.passenger-urgent-box{display:none;gap:6px;padding:8px;border:1px solid #f0d4d4;border-radius:9px;background:#fff8f8}.passenger-urgent-box.open{display:grid}.passenger-urgent-note{font-size:9.3px;line-height:1.35;color:#7d4a4a}.passenger-urgent-text{width:100%;min-height:66px;box-sizing:border-box;border:1px solid #e3caca;border-radius:8px;padding:7px 8px;font-family:inherit;font-size:10px}.passenger-urgent-send{border:0;border-radius:8px;background:#a83232;color:#fff;padding:8px;font-size:10.5px;font-weight:850}.passenger-urgent-status{font-size:9.4px;color:#9a3030;min-height:13px}
      .passenger-support-toast{position:fixed;z-index:9999;left:50%;top:14px;transform:translateX(-50%);max-width:calc(100vw - 28px);background:#243747;color:#fff;border-radius:10px;padding:9px 12px;font-size:10.5px;font-weight:750;box-shadow:0 8px 22px rgba(0,0,0,.18);opacity:0;pointer-events:none;transition:opacity .2s ease}.passenger-support-toast.show{opacity:1}
    `
    document.head.appendChild(style)

    const statusLabel = (value: string) => {
      if (ht) return ({ open: 'Ouvè', in_progress: 'An tretman', resolved: 'Rezoud', closed: 'Fèmen' } as Record<string,string>)[value] || value
      return ({ open: 'Ouvert', in_progress: 'En traitement', resolved: 'Résolu', closed: 'Fermé' } as Record<string,string>)[value] || value
    }

    const categoryLabel = (value: string) => {
      if (ht) return ({ general:'Jeneral', ride:'Trajè', payment:'Peman', account:'Kont', safety:'Sekirite', price:'Pri' } as Record<string,string>)[value] || value
      return ({ general:'Général', ride:'Trajet', payment:'Paiement', account:'Compte', safety:'Sécurité', price:'Prix' } as Record<string,string>)[value] || value
    }

    const toast = (message: string) => {
      let el = document.querySelector<HTMLElement>('.passenger-support-toast')
      if (!el) {
        el = document.createElement('div')
        el.className = 'passenger-support-toast'
        document.body.appendChild(el)
      }
      el.textContent = message
      el.classList.add('show')
      window.setTimeout(() => el?.classList.remove('show'), 3600)
    }

    const build = () => {
      const details = document.querySelector<HTMLElement>('.passenger-help-details')
      if (!details || details.dataset.advancedHelpReady === 'true') return
      details.dataset.advancedHelpReady = 'true'

      const faqBtn = document.createElement('button')
      faqBtn.type = 'button'
      faqBtn.className = 'passenger-help-advanced-btn'
      faqBtn.innerHTML = `<span>❓</span><b>${ht ? 'Kesyon rapid (FAQ)' : 'Questions rapides (FAQ)'}</b><span>›</span>`
      const faqBox = document.createElement('div')
      faqBox.className = 'passenger-help-advanced-box'
      const faq = ht ? [
        ['Kijan pou anile yon trajè?', 'Si trajè a toujou ap tann oswa sistèm nan pèmèt anilasyon, sèvi ak bouton anile sou ekran trajè a. Yon trajè ki deja an kou pa dwe anile tankou yon demann nòmal.'],
        ['Kisa pou m fè si chofè a pa vini?', 'Tcheke estati trajè a ak Asistan AI a. Si chofè a pa rive, sèvi ak Rapòte pwoblèm ak trajè pou voye detay yo bay sipò.'],
        ['Kijan peman an mache?', 'Peman mobil la fèt atravè metòd ou chwazi a lè entegrasyon founisè a aktif. App la kenbe komisyon platfòm la epi kalkile pati chofè a.'],
        ['Kijan mwen rapòte yon pwoblèm?', 'Nan Èd, sèvi ak Rapòte pwoblèm ak trajè, Rapòte yon chofè, oswa Kontakte sipò selon kalite pwoblèm nan.'],
      ] : [
        ['Comment annuler un trajet ?', 'Si le trajet est encore en attente et que l’annulation est permise, utilisez le bouton d’annulation sur l’écran du trajet.'],
        ['Que faire si le chauffeur ne vient pas ?', 'Vérifiez le statut avec l’Assistant IA puis utilisez le signalement de problème de trajet si nécessaire.'],
        ['Comment fonctionne le paiement ?', 'Le paiement mobile utilise le fournisseur choisi lorsque son intégration réelle est active. La plateforme calcule ensuite sa commission et la part du chauffeur.'],
        ['Comment signaler un problème ?', 'Dans Aide, utilisez Problème de trajet, Signaler un chauffeur ou Contacter le support selon le cas.'],
      ]
      faq.forEach(([q,a]) => {
        const qb = document.createElement('button'); qb.type = 'button'; qb.className = 'passenger-faq-q'; qb.textContent = q
        const ab = document.createElement('div'); ab.className = 'passenger-faq-a'; ab.textContent = a
        qb.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); ab.classList.toggle('open') })
        faqBox.append(qb, ab)
      })
      faqBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const open = faqBox.classList.toggle('open'); const arrow=faqBtn.querySelector<HTMLElement>('span:last-child'); if (arrow) arrow.style.transform=open?'rotate(90deg)':'rotate(0deg)' })

      const trackBtn = document.createElement('button')
      trackBtn.type = 'button'; trackBtn.className = 'passenger-help-advanced-btn'
      trackBtn.innerHTML = `<span>📋</span><b>${ht ? 'Suivi demann mwen yo' : 'Suivi de mes demandes'}</b><span>›</span>`
      const trackBox = document.createElement('div'); trackBox.className = 'passenger-help-advanced-box'
      const loadHistory = async () => {
        trackBox.innerHTML = `<div class="passenger-support-history-empty">${ht ? 'N ap chaje…' : 'Chargement…'}</div>`
        const { data: auth } = await supabase.auth.getUser(); const user = auth.user
        if (!user) { trackBox.innerHTML = `<div class="passenger-support-history-empty">${ht ? 'Ou bezwen konekte.' : 'Vous devez être connecté.'}</div>`; return }
        const { data, error } = await supabase.from('support_requests').select('id,category,message,status,admin_note,created_at,updated_at').eq('passenger_id', user.id).order('created_at',{ascending:false}).limit(8)
        if (error) { trackBox.innerHTML = `<div class="passenger-support-history-empty">${ht ? 'Nou pa ka chaje demann yo.' : 'Impossible de charger les demandes.'}</div>`; return }
        const rows = (data ?? []) as SupportRow[]
        if (!rows.length) { trackBox.innerHTML = `<div class="passenger-support-history-empty">${ht ? 'Ou poko voye okenn demann.' : 'Vous n’avez encore envoyé aucune demande.'}</div>`; return }
        trackBox.innerHTML = ''
        rows.forEach((row) => {
          const card = document.createElement('div'); card.className = 'passenger-support-history-card'
          const date = new Date(row.created_at).toLocaleDateString(ht ? 'fr-HT' : 'fr-FR')
          card.innerHTML = `<div class="passenger-support-history-top"><span>${categoryLabel(row.category)} • ${date}</span><span class="passenger-support-history-status">${statusLabel(row.status)}</span></div><div>${row.message}</div>${row.admin_note ? `<div class="passenger-support-history-note"><b>${ht ? 'Repons sipò:' : 'Réponse du support :'}</b> ${row.admin_note}</div>` : ''}`
          trackBox.appendChild(card)
        })
      }
      trackBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const open = trackBox.classList.toggle('open'); const arrow=trackBtn.querySelector<HTMLElement>('span:last-child'); if (arrow) arrow.style.transform=open?'rotate(90deg)':'rotate(0deg)'; if (open) void loadHistory() })

      const urgentBtn = document.createElement('button'); urgentBtn.type='button'; urgentBtn.className='passenger-urgent-btn'
      urgentBtn.innerHTML = `<span>🚨</span><b>${ht ? 'Sekirite ijan' : 'Sécurité urgente'}</b><span>›</span>`
      const urgentBox = document.createElement('div'); urgentBox.className='passenger-urgent-box'
      urgentBox.innerHTML = `<div class="passenger-urgent-note">${ht ? 'Sa voye yon rapò IJAN bay admin Taxi Haiti. Li pa rele lapolis oswa sèvis ijans otomatikman. Si gen danje imedya, kontakte sèvis ijans ki disponib kote ou ye a.' : 'Cela envoie un signalement URGENT à l’administration Taxi Haiti. Cela n’appelle pas automatiquement les services d’urgence. En cas de danger immédiat, contactez les services d’urgence disponibles là où vous vous trouvez.'}</div><textarea class="passenger-urgent-text" maxlength="2000" placeholder="${ht ? 'Dekri sitiyasyon ijans lan…' : 'Décrivez la situation urgente…'}"></textarea><button type="button" class="passenger-urgent-send">${ht ? 'Voye rapò ijan' : 'Envoyer le signalement urgent'}</button><div class="passenger-urgent-status" aria-live="polite"></div>`
      urgentBtn.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();const open=urgentBox.classList.toggle('open');const arrow=urgentBtn.querySelector<HTMLElement>('span:last-child');if(arrow)arrow.style.transform=open?'rotate(90deg)':'rotate(0deg)'})
      const urgentText=urgentBox.querySelector<HTMLTextAreaElement>('.passenger-urgent-text'); const urgentSend=urgentBox.querySelector<HTMLButtonElement>('.passenger-urgent-send'); const urgentStatus=urgentBox.querySelector<HTMLElement>('.passenger-urgent-status')
      urgentSend?.addEventListener('click', async (e)=>{
        e.preventDefault();e.stopPropagation();const message=urgentText?.value.trim()||''
        if(message.length<3){if(urgentStatus)urgentStatus.textContent=ht?'Dekri sitiyasyon an anvan ou voye.':'Décrivez la situation avant l’envoi.';return}
        urgentSend.disabled=true;if(urgentStatus)urgentStatus.textContent=ht?'N ap voye rapò ijan an…':'Envoi du signalement urgent…'
        const {data:auth}=await supabase.auth.getUser();const user=auth.user
        if(!user){if(urgentStatus)urgentStatus.textContent=ht?'Ou bezwen konekte.':'Vous devez être connecté.';urgentSend.disabled=false;return}
        const {data:rideData}=await supabase.from('rides').select('id').eq('passenger_id',user.id).order('requested_at',{ascending:false}).limit(1)
        const rideId=(rideData??[])[0]?.id??null
        const {error}=await supabase.from('support_requests').insert({passenger_id:user.id,ride_id:rideId,category:'safety',message:`[${ht?'IJANS SEKIRITE':'URGENCE SÉCURITÉ'}] ${message}`})
        if(error){if(urgentStatus)urgentStatus.textContent=ht?'Rapò ijan an pa pase. Eseye ankò.':'Le signalement urgent n’a pas été envoyé. Réessayez.'}
        else{if(urgentStatus)urgentStatus.textContent=ht?'Rapò ijan an voye bay admin. ✅':'Signalement urgent envoyé à l’administration. ✅';if(urgentText)urgentText.value='';toast(ht?'Rapò sekirite ijan an voye.':'Signalement de sécurité urgent envoyé.')}
        urgentSend.disabled=false
      })

      const firstReport = details.querySelector('.passenger-ride-report, .passenger-driver-report, .passenger-help-contact')
      if (firstReport) firstReport.insertAdjacentElement('beforebegin', urgentBox), urgentBox.insertAdjacentElement('beforebegin', urgentBtn), urgentBtn.insertAdjacentElement('beforebegin', trackBox), trackBox.insertAdjacentElement('beforebegin', trackBtn), trackBtn.insertAdjacentElement('beforebegin', faqBox), faqBox.insertAdjacentElement('beforebegin', faqBtn)
      else details.append(faqBtn, faqBox, trackBtn, trackBox, urgentBtn, urgentBox)
    }

    build()
    const observer = new MutationObserver(build)
    observer.observe(document.body,{childList:true,subtree:true})

    let channel: ReturnType<typeof supabase.channel> | null = null
    void supabase.auth.getUser().then(({data})=>{
      const user=data.user
      if(!user) return
      channel=supabase.channel(`passenger-support-${user.id}`)
        .on('postgres_changes',{event:'UPDATE',schema:'public',table:'support_requests',filter:`passenger_id=eq.${user.id}`},(payload)=>{
          const row=payload.new as SupportRow
          toast(ht ? `Sipò mete demann ou a: ${statusLabel(row.status)}${row.admin_note?' • Gen yon repons.':''}` : `Support : demande ${statusLabel(row.status)}${row.admin_note?' • Une réponse est disponible.':''}`)
        }).subscribe()
    })

    return ()=>{
      observer.disconnect(); document.getElementById(styleId)?.remove(); document.querySelector('.passenger-support-toast')?.remove(); if(channel) void supabase.removeChannel(channel)
    }
  },[])
  return null
}
