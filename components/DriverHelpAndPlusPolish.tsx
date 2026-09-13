'use client'

import { useEffect } from 'react'

export default function DriverHelpAndPlusPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/driver/dashboard') return

    const keepPlusOnly = () => {
      const drawer = document.querySelector('.drawer') as HTMLElement | null
      if (!drawer) return
      ;['[data-driver-history="true"]','[data-driver-earnings="true"]'].forEach((selector) => {
        const section = drawer.querySelector<HTMLElement>(selector)
        const title = section?.querySelector<HTMLElement>('h3')
        const mark = title?.querySelector<HTMLElement>('span[aria-hidden="true"]')
        if (!title || !mark) return
        mark.textContent = '+'
        if (title.dataset.plusOnlyBound !== 'true') {
          title.dataset.plusOnlyBound = 'true'
          title.addEventListener('click', () => window.setTimeout(() => { mark.textContent = '+' }, 0), true)
          title.addEventListener('keydown', () => window.setTimeout(() => { mark.textContent = '+' }, 0), true)
        }
      })
    }

    const addHelp = () => {
      const drawer = document.querySelector('.drawer') as HTMLElement | null
      if (!drawer || drawer.querySelector('[data-driver-help="true"]')) return

      const lang = localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'
      const section = document.createElement('div')
      section.className = 'menuSection'
      section.dataset.driverHelp = 'true'

      const title = document.createElement('h3')
      title.textContent = lang === 'ht' ? 'Èd' : 'Aide'
      Object.assign(title.style, {
        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
        padding: '4px 0', marginBottom: '0', userSelect: 'none'
      })
      title.setAttribute('role', 'button')
      title.setAttribute('tabindex', '0')
      title.setAttribute('aria-expanded', 'false')

      const plus = document.createElement('span')
      plus.textContent = '+'
      plus.setAttribute('aria-hidden', 'true')
      Object.assign(plus.style, { marginLeft: 'auto', fontSize: '24px', fontWeight: '700', lineHeight: '1' })
      title.appendChild(plus)

      const content = document.createElement('div')
      content.style.display = 'none'
      content.style.padding = '8px 0 4px'

      const items = lang === 'ht'
        ? [
            ['Trajè ak demann', 'Rete sou En ligne pou resevwa demann. Verifye pwen depa ak destinasyon an anvan ou kòmanse trajè a.'],
            ['Peman', 'Sèvi ak MonCash oswa NatCash ou anrejistre a. Se yon sèl metòd payout ki ka aktif a la fwa.'],
            ['Kont ak veyikil', 'Nan Profil ak Veyikil, ou ka anrejistre epi modifye enfòmasyon ou yo ak dokiman yo.'],
            ['Pwoblèm teknik', 'Peze Actualiser epi relouvri aplikasyon an si yon demann oswa done pa mete ajou. Si pwoblèm nan kontinye, kontakte administrasyon Taxi Platform Haiti.'],
            ['Sekirite', 'Pa kòmanse yon trajè si enfòmasyon yo pa koresponn oswa si sitiyasyon an pa sanble an sekirite.'],
          ]
        : [
            ['Trajets et demandes', 'Restez En ligne pour recevoir des demandes. Vérifiez le point de départ et la destination avant de commencer le trajet.'],
            ['Paiement', 'Utilisez le compte MonCash ou NatCash enregistré. Un seul mode de versement peut être actif à la fois.'],
            ['Compte et véhicule', 'Dans Profil et Véhicule, vous pouvez enregistrer puis modifier vos informations et documents.'],
            ['Problème technique', 'Appuyez sur Actualiser et rouvrez l’application si une demande ou une donnée ne se met pas à jour. Si le problème continue, contactez l’administration de Taxi Platform Haiti.'],
            ['Sécurité', 'Ne commencez pas un trajet si les informations ne correspondent pas ou si la situation ne semble pas sûre.'],
          ]

      items.forEach(([heading, text]) => {
        const card = document.createElement('div')
        Object.assign(card.style, { padding: '9px 0', borderBottom: '1px solid #edf1f3' })
        const strong = document.createElement('strong')
        strong.textContent = heading
        Object.assign(strong.style, { display: 'block', color: '#173246', fontSize: '12px', marginBottom: '3px' })
        const p = document.createElement('p')
        p.textContent = text
        Object.assign(p.style, { margin: '0', color: '#71808f', fontSize: '11px', lineHeight: '1.4' })
        card.append(strong, p)
        content.appendChild(card)
      })

      section.append(title, content)

      let open = false
      const toggle = () => {
        open = !open
        content.style.display = open ? 'block' : 'none'
        title.setAttribute('aria-expanded', String(open))
        plus.textContent = '+'
      }
      title.addEventListener('click', toggle)
      title.addEventListener('keydown', (event) => {
        const e = event as KeyboardEvent
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle()
        }
      })

      const languageSection = Array.from(drawer.querySelectorAll<HTMLElement>('.menuSection')).find((item) => {
        const text = (item.querySelector('h3')?.textContent || '').toLowerCase()
        return text.includes('langue') || text === 'lang'
      })
      if (languageSection?.nextSibling) drawer.insertBefore(section, languageSection.nextSibling)
      else {
        const logout = drawer.querySelector('.drawerLogout')
        if (logout) drawer.insertBefore(section, logout)
        else drawer.appendChild(section)
      }
    }

    const apply = () => {
      keepPlusOnly()
      addHelp()
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  return null
}
