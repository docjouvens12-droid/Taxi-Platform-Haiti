'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type HelpItem={icon:string,title:string,desc:string,details:string[]}

export default function PassengerHelpStableInline(){
  const [target,setTarget]=useState<HTMLElement|null>(null)
  const [open,setOpen]=useState(false)
  const [active,setActive]=useState<number|null>(null)

  useEffect(()=>{
    const onClick=(event:MouseEvent)=>{
      const button=(event.target as HTMLElement|null)?.closest<HTMLButtonElement>('.shell .nav-drawer .drawer-nav > button')
      if(!button)return
      const text=(button.textContent||'').toLowerCase()
      if(!text.includes('aide')&&!text.includes('èd')&&!text.includes('ed'))return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      let mount=button.nextElementSibling as HTMLElement|null
      if(!mount||!mount.classList.contains('passenger-help-inline-target')){
        mount=document.createElement('div')
        mount.className='passenger-help-inline-target'
        button.insertAdjacentElement('afterend',mount)
      }
      setTarget(mount)
      setOpen(v=>!v)
      setActive(null)
    }

    document.addEventListener('click',onClick,true)
    return()=>document.removeEventListener('click',onClick,true)
  },[])

  if(!target||!open||!document.contains(target))return null
  const ht=localStorage.getItem('taxi-language')==='ht'

  const items:HelpItem[]=ht ? [
    {icon:'🚕',title:'Pwoblèm ak yon trajè',desc:'Pwoblèm pandan oswa apre yon trajè.',details:['Chofè a pa rive oswa pa jwenn mwen','Move adrès pickup oswa destinasyon','Pri trajè a pa sanble kòrèk','Trajè a te anile san rezon','Lòt pwoblèm sou yon trajè']},
    {icon:'🧳',title:'Mwen bliye yon bagay',desc:'Atik ou pèdi oswa bliye nan machin.',details:['Rapòte yon objè ki pèdi','Bay detay sou trajè a ak objè a','Tcheke dènye trajè yo pou idantifye chofè a']},
    {icon:'👨‍✈️',title:'Pwoblèm ak yon chofè',desc:'Konpòtman, sèvis oswa lòt plent.',details:['Konpòtman ki pa apwopriye','Kondwi ki pa an sekirite','Machin nan pa koresponn ak enfòmasyon yo','Chofè a mande yon montan diferan']},
    {icon:'💳',title:'Peman ak pri',desc:'MonCash, NatCash, kach oswa pri trajè.',details:['Pwoblèm MonCash oswa NatCash','Peman an te fèt men li pa parèt','Kesyon sou pri oswa frè','Chanje metòd peman']},
    {icon:'👤',title:'Kont ak pwofil',desc:'Non, telefòn, imel, foto oswa aksè kont.',details:['Mwen pa ka konekte','Modifye enfòmasyon pwofil','Chanje nimewo telefòn oswa imel','Pwoblèm ak foto pwofil']},
    {icon:'📍',title:'Kote ak GPS',desc:'Pozisyon, pickup oswa kat la pa kòrèk.',details:['GPS mwen pa jwenn pozisyon mwen','Pwen pickup la pa kòrèk','Kat la pa chaje','Destinasyon an pa jwenn']},
    {icon:'🌐',title:'Lang ak aplikasyon',desc:'Lang, ekran oswa fonksyon aplikasyon an.',details:['Chanje Français / Kreyòl','Bouton oswa paj pa mache','Aplikasyon an twò dousman','Rapòte yon erè teknik']},
    {icon:'🛡️',title:'Sekirite',desc:'Pwoblèm sekirite pandan yon trajè.',details:['Mwen santi mwen an danje','Rapòte yon ensidan sekirite','Pwoblèm grav ak chofè oswa machin','Pou ijans imedya, kontakte sèvis ijans lokal yo']},
    {icon:'💬',title:'Lòt èd ak fidbak',desc:'Kesyon jeneral oswa sijesyon.',details:['Mwen bezwen lòt asistans','Voye yon sijesyon','Rapòte yon pwoblèm nan sèvis la']},
  ] : [
    {icon:'🚕',title:'Problème avec un trajet',desc:'Un problème pendant ou après une course.',details:['Le chauffeur n’arrive pas ou ne me trouve pas','Mauvaise adresse de départ ou destination','Le prix de la course semble incorrect','La course a été annulée sans raison','Autre problème lié à une course']},
    {icon:'🧳',title:'Objet oublié',desc:'Un objet perdu ou oublié dans le véhicule.',details:['Signaler un objet perdu','Donner les détails de la course et de l’objet','Consulter les trajets récents pour identifier le chauffeur']},
    {icon:'👨‍✈️',title:'Problème avec un chauffeur',desc:'Comportement, service ou autre plainte.',details:['Comportement inapproprié','Conduite dangereuse','Le véhicule ne correspond pas aux informations','Le chauffeur demande un montant différent']},
    {icon:'💳',title:'Paiement et tarif',desc:'MonCash, NatCash, espèces ou prix de la course.',details:['Problème MonCash ou NatCash','Paiement effectué mais non affiché','Question sur le tarif ou les frais','Changer le mode de paiement']},
    {icon:'👤',title:'Compte et profil',desc:'Nom, téléphone, e-mail, photo ou accès au compte.',details:['Je n’arrive pas à me connecter','Modifier les informations du profil','Changer le téléphone ou l’e-mail','Problème avec la photo de profil']},
    {icon:'📍',title:'Localisation et GPS',desc:'Position, point de départ ou carte incorrecte.',details:['Le GPS ne trouve pas ma position','Le point de départ est incorrect','La carte ne se charge pas','La destination est introuvable']},
    {icon:'🌐',title:'Langue et application',desc:'Langue, écran ou fonctionnement de l’application.',details:['Changer Français / Kreyòl','Un bouton ou une page ne fonctionne pas','L’application est trop lente','Signaler un bug technique']},
    {icon:'🛡️',title:'Sécurité',desc:'Problème de sécurité pendant une course.',details:['Je me sens en danger','Signaler un incident de sécurité','Problème grave avec le chauffeur ou le véhicule','Pour une urgence immédiate, contactez les services d’urgence locaux']},
    {icon:'💬',title:'Autre aide et avis',desc:'Question générale ou suggestion.',details:['J’ai besoin d’une autre assistance','Envoyer une suggestion','Signaler un problème de service']},
  ]

  return createPortal(
    <section className="phs-wrap">
      <style>{`
        .phs-wrap{margin:6px 0 10px;padding:12px;border:1px solid #dfe8e4;border-radius:17px;background:#f8faf9}
        .phs-head{display:flex;align-items:center;gap:9px;margin-bottom:10px}.phs-head>span{width:34px;height:34px;border-radius:11px;background:#eef5f3;display:grid;place-items:center;font-size:17px}
        .phs-head div{flex:1}.phs-head strong{display:block;font-size:13px;color:#10243a}.phs-head small{display:block;margin-top:2px;font-size:9px;color:#7b8984}.phs-close{border:0;border-radius:10px;background:#edf5f2;padding:7px 9px;font-size:9px;font-weight:900;color:#0f705a}
        .phs-list{display:grid;gap:7px}.phs-item{width:100%;border:1px solid #e0e8e5;border-radius:13px;background:#fff;padding:10px;display:grid;grid-template-columns:34px 1fr 14px;align-items:center;gap:8px;text-align:left;color:#10243a}
        .phs-item>span:first-child{font-size:17px}.phs-item b{display:block;font-size:11px}.phs-item small{display:block;margin-top:2px;font-size:9px;line-height:1.25;color:#7b8984}.phs-item>span:last-child{font-size:18px;color:#9aaba5;transition:.15s}.phs-item.open>span:last-child{transform:rotate(90deg)}
        .phs-details{margin:-2px 0 3px;padding:8px 10px 10px 52px;border:1px solid #e0e8e5;border-top:0;border-radius:0 0 13px 13px;background:#fff}.phs-details button{display:block;width:100%;border:0;background:transparent;padding:7px 0;text-align:left;font-size:9px;line-height:1.3;color:#344b5f;border-bottom:1px solid #eef2f0}.phs-details button:last-child{border-bottom:0}
      `}</style>
      <div className="phs-head">
        <span>❓</span>
        <div><strong>{ht?'Sant Èd':'Centre d’aide'}</strong><small>{ht?'Chwazi sijè ki pi pre pwoblèm ou an':'Choisissez le sujet qui correspond à votre problème'}</small></div>
        <button type="button" className="phs-close" onClick={()=>setOpen(false)}>{ht?'Fèmen':'Fermer'}</button>
      </div>
      <div className="phs-list">
        {items.map((item,index)=><div key={item.title}>
          <button type="button" className={`phs-item ${active===index?'open':''}`} onClick={()=>setActive(active===index?null:index)}><span>{item.icon}</span><span><b>{item.title}</b><small>{item.desc}</small></span><span>›</span></button>
          {active===index&&<div className="phs-details">{item.details.map(detail=><button type="button" key={detail}>{detail}</button>)}</div>}
        </div>)}
      </div>
    </section>,target
  )
}
