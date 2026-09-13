'use client'

import { useEffect } from 'react'

export default function PassengerTripExperiencePolish() {
  useEffect(() => {
    if (window.location.pathname !== '/passenger/dashboard') return

    const styleId = 'passenger-trip-experience-polish'
    document.getElementById(styleId)?.remove()
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .passenger-eta-card{margin:10px 0 2px;border:1px solid #cfe0fb;background:#f4f8ff;border-radius:15px;padding:11px 12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;box-shadow:0 5px 16px rgba(27,112,235,.06)}
      .passenger-eta-card>div{min-width:0}.passenger-eta-card small{display:block;font-size:9px;font-weight:800;color:#718299;text-transform:uppercase;letter-spacing:.04em}.passenger-eta-card strong{display:block;margin-top:3px;font-size:15px;line-height:1.15;color:#102033}.passenger-eta-card .price strong{color:#1b70eb;font-size:17px}
      .receiptCard .check{background:#eaf2ff!important;color:#1b70eb!important}.receiptCard .eyebrow{color:#1b70eb!important}.receiptCard .summary .fareBlock{background:#1b70eb!important}.receiptCard .ratingBox{background:#f4f8ff!important}.receiptCard .submit{background:#1b70eb!important}.receiptCard textarea:focus{border-color:#8fb8f5!important;box-shadow:0 0 0 3px rgba(27,112,235,.10)!important}
    `
    document.head.appendChild(style)

    const translateNotice = () => {
      if (window.localStorage.getItem('taxi-language') !== 'ht') return
      const notices = Array.from(document.querySelectorAll<HTMLElement>('[role="status"]'))
      for (const notice of notices) {
        if (!notice.textContent) continue
        const title = notice.querySelector<HTMLElement>('strong')
        const body = title?.parentElement?.querySelector<HTMLElement>('span')
        const text = notice.textContent
        if (text.includes('Chauffeur trouvé')) { if (title) title.textContent = 'Chofè jwenn'; if (body) body.textContent = 'Chofè ou a aksepte trajè a.' }
        else if (text.includes('Chauffeur en approche')) { if (title) title.textContent = 'Chofè ap vini'; if (body) body.textContent = 'Chofè ou a ap pwoche kote pou pran ou a.' }
        else if (text.includes('Trajet commencé')) { if (title) title.textContent = 'Trajè kòmanse'; if (body) body.textContent = 'Trajè ou a an kou kounye a.' }
        else if (text.includes('Trajet terminé')) { if (title) title.textContent = 'Trajè fini'; if (body) body.textContent = 'Ou rive nan destinasyon ou.' }
        else if (text.includes('Trajet annulé')) { if (title) title.textContent = 'Trajè anile'; if (body) body.textContent = 'Trajè sa a anile.' }
      }
    }

    const updateEtaCard = () => {
      const sheet = document.querySelector<HTMLElement>('.booking-sheet')
      const heading = sheet?.querySelector<HTMLElement>('.section-heading')
      const selected = sheet?.querySelector<HTMLElement>('.ride-option.selected')
      if (!sheet || !heading || !selected) return

      const meta = heading.querySelector<HTMLElement>(':scope > span')?.textContent?.trim() || ''
      const price = selected.querySelector<HTMLElement>('.ride-price')?.textContent?.trim() || '—'
      const hasUseful = meta.includes('km') || meta.includes('min') || price.includes('HTG')
      let card = sheet.querySelector<HTMLElement>('.passenger-eta-card')
      if (!hasUseful) { card?.remove(); return }
      if (!card) {
        card = document.createElement('div')
        card.className = 'passenger-eta-card'
        const list = sheet.querySelector('.ride-list')
        if (list) list.insertAdjacentElement('afterend', card)
      }
      const ht = window.localStorage.getItem('taxi-language') === 'ht'
      card.innerHTML = `<div><small>${ht ? 'ETA / Distans' : 'ETA / Distance'}</small><strong>${escapeHtml(meta || '—')}</strong></div><div class="price"><small>${ht ? 'Pri estime' : 'Prix estimé'}</small><strong>${escapeHtml(price || '—')}</strong></div>`
    }

    const translateReceipt = () => {
      if (window.localStorage.getItem('taxi-language') !== 'ht') return
      const card = document.querySelector<HTMLElement>('.receiptCard')
      if (!card) return
      const replacements: Array<[string,string]> = [
        ['TRAJET TERMINÉ','TRAJÈ FINI'],
        ['Merci d’avoir voyagé avec Taxi Platform Haiti','Mèsi paske ou te vwayaje ak Taxi Platform Haiti'],
        ['Prise en charge','Kote yo te pran ou'],
        ['Montant final','Montan final'],
        ['Paiement','Peman'],
        ['Espèces','Lajan kach'],
        ['Comment s’est passé votre trajet ?','Kijan trajè ou a te pase?'],
        ['Évaluation envoyée','Evalyasyon voye'],
        ['Envoyer mon évaluation','Voye evalyasyon mwen'],
        ['Plus tard','Pita'],
        ['Terminer','Fini'],
      ]
      const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT)
      let node = walker.nextNode()
      while (node) {
        let value = node.nodeValue || ''
        for (const [from,to] of replacements) value = value.replace(from,to)
        node.nodeValue = value
        node = walker.nextNode()
      }
      const textarea = card.querySelector<HTMLTextAreaElement>('textarea')
      if (textarea) textarea.placeholder = 'Ajoute yon kòmantè (opsyonèl)'
    }

    const apply = () => { translateNotice(); updateEtaCard(); translateReceipt() }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    window.addEventListener('taxi-language-changed', apply)

    return () => {
      observer.disconnect()
      window.removeEventListener('taxi-language-changed', apply)
      document.querySelector('.passenger-eta-card')?.remove()
      document.getElementById(styleId)?.remove()
    }
  }, [])

  return null
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] ?? char))
}
