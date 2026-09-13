'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const topics = {
  fr: [
    ['Trajets et demandes','Recevoir, consulter et gérer les nouvelles demandes de trajet.'],
    ['Accepter et commencer un trajet','Étapes pour accepter, arriver au point de départ et démarrer la course.'],
    ['Problème avec un passager','Que faire en cas de désaccord, absence, mauvais comportement ou information incorrecte.'],
    ['Paiements et revenus','Comprendre les paiements, les revenus nets et la commission de la plateforme.'],
    ['MonCash et NatCash','Choisir et mettre à jour votre méthode de versement.'],
    ['Profil et compte','Modifier vos informations personnelles et gérer votre compte chauffeur.'],
    ['Véhicule et documents','Mettre à jour le véhicule, la plaque, les documents et les informations obligatoires.'],
    ['Sécurité du chauffeur','Conseils de sécurité avant, pendant et après un trajet.'],
    ['Accident ou urgence','Actions à prendre en cas d’accident, blessure ou situation urgente.'],
    ['Problème technique','Aide si un bouton, une page ou une fonction de l’application ne marche pas.'],
    ['GPS et localisation','Résoudre les problèmes de position, carte, itinéraire ou localisation.'],
    ['Compte suspendu ou limité','Comprendre pourquoi un compte peut être limité et comment demander une révision.'],
    ['Annuler un trajet','Quand et comment annuler un trajet correctement.'],
    ['Signaler un problème','Signaler un passager, un trajet, un paiement ou un problème de sécurité.'],
    ['Règles et conditions chauffeur','Consulter les principales règles d’utilisation de la plateforme.'],
    ['Contacter le support','Obtenir de l’aide directe pour un problème qui n’est pas résolu.'],
  ],
  ht: [
    ['Trajè ak demann','Resevwa, gade epi jere nouvo demann trajè yo.'],
    ['Aksepte epi kòmanse yon trajè','Etap pou aksepte, rive kote pasaje a epi kòmanse kous la.'],
    ['Pwoblèm ak yon pasaje','Sa pou fè si gen dezakò, pasaje pa parèt, move konpòtman oswa move enfòmasyon.'],
    ['Peman ak revni','Konprann peman, revni nèt ak komisyon platfòm nan.'],
    ['MonCash ak NatCash','Chwazi epi modifye metòd pou resevwa lajan ou.'],
    ['Pwofil ak kont','Modifye enfòmasyon pèsonèl ou epi jere kont chofè a.'],
    ['Veyikil ak dokiman','Mete veyikil, plak, dokiman ak tout enfòmasyon obligatwa yo ajou.'],
    ['Sekirite chofè','Konsèy sekirite anvan, pandan ak apre yon trajè.'],
    ['Aksidan oswa ijans','Sa pou fè si gen aksidan, blesi oswa yon sitiyasyon ijans.'],
    ['Pwoblèm teknik','Èd si yon bouton, paj oswa fonksyon nan app la pa mache.'],
    ['GPS ak pozisyon','Rezoud pwoblèm pozisyon, kat, wout oswa lokalizasyon.'],
    ['Kont sispann oswa limite','Konprann poukisa kont lan limite epi kijan pou mande yon revizyon.'],
    ['Anile yon trajè','Kilè ak kijan pou anile yon trajè kòrèkteman.'],
    ['Rapòte yon pwoblèm','Rapòte yon pasaje, trajè, peman oswa pwoblèm sekirite.'],
    ['Règ ak kondisyon chofè','Gade prensipal règ pou itilize platfòm nan kòm chofè.'],
    ['Kontakte sipò','Jwenn èd dirèk pou yon pwoblèm ki poko rezoud.'],
  ],
}

export default function DriverHelpTopicsAddon(){
  const [mount,setMount]=useState<HTMLElement|null>(null)
  const [lang,setLang]=useState<'fr'|'ht'>('fr')

  useEffect(()=>{
    if(window.location.pathname!=='/driver/dashboard') return
    const sync=()=>{
      setLang(localStorage.getItem('taxi-language')==='ht'?'ht':'fr')
      const root=document.querySelector<HTMLElement>('.driver-final-menu-stable-root')
      if(!root){setMount(null);return}
      const details=Array.from(root.querySelectorAll<HTMLDetailsElement>('details.dfm-section')).find(d=>{
        const text=(d.querySelector('summary')?.textContent||'').toLowerCase()
        return text.includes('aide')||text.includes('èd')
      })
      const body=details?.querySelector<HTMLElement>('.dfm-body')
      if(!body){setMount(null);return}
      body.querySelectorAll<HTMLElement>('.dfm-help-card').forEach(el=>el.style.display='none')
      let target=body.querySelector<HTMLElement>('.driver-help-topics-addon-root')
      if(!target){target=document.createElement('div');target.className='driver-help-topics-addon-root';body.appendChild(target)}
      setMount(target)
    }
    sync()
    const observer=new MutationObserver(sync);observer.observe(document.body,{childList:true,subtree:true})
    window.addEventListener('storage',sync)
    return()=>{observer.disconnect();window.removeEventListener('storage',sync)}
  },[])

  if(!mount)return null
  return createPortal(<div className="driver-help-topics-addon">
    <style>{`.driver-help-topics-addon{display:grid;gap:7px;padding-top:4px}.dhta-card{padding:10px 11px;border:1px solid #e4eaee;border-radius:11px;background:#f8fafb}.dhta-card strong{display:block;font-size:11px;color:#173246;margin-bottom:3px}.dhta-card p{margin:0;font-size:10px;line-height:1.45;color:#71808f}`}</style>
    {topics[lang].map(([title,desc])=><div className="dhta-card" key={title}><strong>{title}</strong><p>{desc}</p></div>)}
  </div>,mount)
}
