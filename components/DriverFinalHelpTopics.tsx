'use client'

import { useEffect } from 'react'

type Topic = [string,string]

const HT: Topic[] = [
  ['Trajè ak demann','Lè ou sou liy, nouvo demann trajè ka parèt sou dashboard la. Verifye kote pasaje a ye, destinasyon an ak enfòmasyon trajè a anvan ou aksepte. Si demann lan pa enterese w, pa aksepte li. Apre ou fin aksepte, swiv enstriksyon navigasyon an epi kenbe GPS ou aktive.'],
  ['Aksepte oswa kòmanse trajè','Peze Aksepte sou demann ou vle pran an. Ale nan pwen pickup la, verifye pasaje a, epi sèlman kòmanse trajè a lè pasaje a antre nan veyikil la. Pa make trajè a kòm kòmanse anvan sa. Lè ou rive nan destinasyon an, fini trajè a nan aplikasyon an pou pri ak revni yo anrejistre.'],
  ['Pwoblèm ak pasaje','Si pasaje a pa parèt, rete nan zòn pickup la pou yon ti tan epi eseye kontakte li atravè enfòmasyon ki disponib nan trajè a. Si gen move adrès oswa konfizyon, konfime nouvo kote a anvan ou deplase. Si gen menas, vyolans oswa yon sitiyasyon ki pa an sekirite, mete sekirite w an premye epi rapòte pwoblèm nan.'],
  ['Peman ak revni','Pou chak trajè ki fini epi ki peye, sistèm nan separe montan an otomatikman: 85% pou chofè a ak 15% pou platfòm lan. Nan seksyon Revni, ou ka wè brut, komisyon platfòm lan ak net chofè a. Toujou verifye yon trajè fini anvan ou konte li kòm revni.'],
  ['MonCash ak NatCash','Nan seksyon Peman, chwazi MonCash oswa NatCash kòm metòd prensipal ou. Mete non ki sou kont lan ak nimewo telefòn ki asosye ak kont lan. Verifye nimewo a byen anvan ou anrejistre. Si ou bezwen chanje kont lan pita, peze Modifye epi sove nouvo enfòmasyon yo.'],
  ['Pwofil ak kont','Nan Pwofil, verifye non konplè, dat nesans, sèks, adrès, nimewo lisans, nimewo idantifikasyon ak telefòn ou. Eta sivil ak imel ka opsyonèl. Si yon enfòmasyon chanje, peze Modifye pwofil, fè koreksyon an epi anrejistre. Enfòmasyon yo dwe rete egzak paske yo sèvi pou verifikasyon kont chofè a.'],
  ['Veyikil ak dokiman','Verifye kalite veyikil la, mak, modèl, koulè, ane, plak ak kantite plas yo. Si ou chanje veyikil oswa plak, mete enfòmasyon yo ajou anvan ou pran trajè. Pa itilize yon veyikil ki pa koresponn ak sa ki anrejistre sou kont chofè a.'],
  ['Sekirite','Toujou respekte règ sikilasyon yo, mete senti sekirite epi mande pasaje yo fè menm bagay la. Pa itilize telefòn pandan w ap kondwi sof si li monte sou yon sipò pou navigasyon. Pa pran trajè si ou twò fatige oswa si veyikil la pa an bon kondisyon. Si yon sitiyasyon sanble danjere, pa kontinye trajè a san nesesite.'],
  ['Aksidan oswa ijans','Si gen aksidan, premye priyorite a se sekirite moun yo. Kanpe nan yon kote ki an sekirite si sa posib, rele sèvis ijans lokal yo si gen blese oswa danje, epi pa deplase yon moun ki grav blese sof si gen yon danje imedya. Apre sa, rapòte ensidan an nan platfòm la ak tout detay ou genyen.'],
  ['Pwoblèm teknik','Si yon paj pa chaje oswa yon bouton pa reponn, rafrechi paj la yon fwa. Verifye koneksyon entènèt ou, fèmen epi relouvri aplikasyon an si sa nesesè. Si pwoblèm nan kontinye, pran yon screenshot epi sèvi ak Kontakte sipò pou eksplike egzakteman sa ki pa mache.'],
  ['GPS ak pozisyon','Pou resevwa ak jere trajè, aktive Location/GPS sou telefòn ou epi bay Taxi Haiti pèmisyon pou itilize pozisyon an. Si kat la montre move kote, verifye GPS la, deplase nan yon zòn ki gen pi bon siyal epi relouvri paj la. Pa fèmen GPS pandan yon trajè aktif.'],
  ['Kont sispann oswa limite','Si kont ou sispann oswa limite, pa kreye yon lòt kont pou evite restriksyon an. Verifye mesaj ki parèt nan aplikasyon an epi kontakte sipò pou konnen rezon an. Yo ka mande w korije enfòmasyon pwofil, veyikil, dokiman oswa yon pwoblèm ki te rapòte anvan yo reaktive kont lan.'],
  ['Anile yon trajè','Anile sèlman lè sa nesesè, pa egzanp si pasaje a pa parèt, gen yon pwoblèm sekirite oswa ou pa ka kontinye trajè a. Si posib, chwazi rezon ki pi egzak la. Pa itilize anilasyon pou fòse pasaje a fè yon lòt aranjman oswa pou evite yon trajè ou te deja aksepte san rezon valab.'],
  ['Rapòte yon pwoblèm','Pou rapòte yon pwoblèm, note dat trajè a, sa ki te pase, ak nenpòt enfòmasyon ki ka ede ekip sipò a konprann sitiyasyon an. Si sa konsène yon pasaje, peman, sekirite oswa erè teknik, bay detay klè epi ajoute screenshot si ou genyen youn.'],
  ['Règ ak kondisyon chofè','Chofè a dwe kenbe enfòmasyon kont ak veyikil li ajou, respekte pasaje yo, respekte lwa sikilasyon, pa fè diskriminasyon, pa manipile pri trajè, epi pa pataje kont li ak yon lòt moun. Vyolasyon grav oswa repete ka mennen nan limitasyon oswa sispansyon kont lan.'],
  ['Kontakte sipò','Sèvi ak seksyon sipò a lè ou pa ka rezoud yon pwoblèm ak etap ki anlè yo. Lè w ap kontakte sipò, bay non ou, kalite pwoblèm nan, dat ak lè li te rive, epi si sa konsène yon trajè, bay enfòmasyon trajè a. Pou yon ijans fizik oswa yon danje imedya, kontakte sèvis ijans lokal yo an premye.']
]

const FR: Topic[] = [
  ['Trajets et demandes','Lorsque vous êtes en ligne, de nouvelles demandes peuvent apparaître sur le tableau de bord. Vérifiez le point de prise en charge, la destination et les informations du trajet avant d’accepter. Après acceptation, suivez la navigation et gardez le GPS activé.'],
  ['Accepter ou démarrer un trajet','Appuyez sur Accepter pour prendre une demande. Rejoignez le point de prise en charge, vérifiez le passager, puis démarrez le trajet uniquement lorsque le passager est dans le véhicule. À destination, terminez le trajet dans l’application afin d’enregistrer correctement le prix et vos revenus.'],
  ['Problèmes avec un passager','Si le passager ne se présente pas, attendez un court moment au point de prise en charge et essayez de le contacter. En cas de mauvaise adresse, confirmez le nouveau lieu avant de vous déplacer. En cas de menace ou de danger, privilégiez votre sécurité et signalez le problème.'],
  ['Paiements et revenus','Pour chaque trajet terminé et payé, le système répartit automatiquement le montant : 85 % pour le chauffeur et 15 % pour la plateforme. La rubrique Revenus affiche le brut, la commission de la plateforme et le net chauffeur.'],
  ['MonCash et NatCash','Dans Paiements, choisissez MonCash ou NatCash comme méthode principale. Saisissez le nom du titulaire et le numéro de téléphone associé au compte, puis vérifiez-les avant d’enregistrer. Utilisez Modifier pour changer ces informations plus tard.'],
  ['Profil et compte','Vérifiez votre nom complet, date de naissance, sexe, adresse, permis, numéro d’identification et téléphone. L’état civil et l’e-mail peuvent être facultatifs. Utilisez Modifier le profil lorsque vous devez corriger une information.'],
  ['Véhicule et documents','Vérifiez le type de véhicule, la marque, le modèle, la couleur, l’année, la plaque et le nombre de places. Si vous changez de véhicule ou de plaque, mettez le compte à jour avant de prendre de nouveaux trajets.'],
  ['Sécurité','Respectez le code de la route, utilisez la ceinture de sécurité et demandez au passager d’en faire autant. Évitez de manipuler le téléphone pendant la conduite. Ne conduisez pas si vous êtes trop fatigué ou si le véhicule n’est pas en bon état.'],
  ['Accident ou urgence','En cas d’accident, protégez d’abord les personnes. Arrêtez-vous dans un endroit sûr si possible et contactez les services d’urgence locaux s’il y a des blessés ou un danger. Signalez ensuite l’incident à la plateforme avec les informations disponibles.'],
  ['Problème technique','Si une page ne charge pas ou si un bouton ne répond pas, actualisez une fois, vérifiez votre connexion Internet puis relancez l’application si nécessaire. Si le problème continue, prenez une capture d’écran et contactez le support.'],
  ['GPS et localisation','Activez la localisation du téléphone et autorisez Taxi Haiti à utiliser votre position. Si la carte affiche une mauvaise position, vérifiez le GPS, améliorez le signal si possible et rechargez la page. Ne désactivez pas le GPS pendant un trajet actif.'],
  ['Compte suspendu ou limité','Si votre compte est suspendu ou limité, ne créez pas un autre compte pour contourner la restriction. Consultez le message affiché puis contactez le support. Une correction du profil, du véhicule ou d’un problème signalé peut être nécessaire avant réactivation.'],
  ['Annuler un trajet','Annulez uniquement lorsque cela est nécessaire, par exemple si le passager ne se présente pas, en cas de problème de sécurité ou si vous ne pouvez vraiment pas poursuivre. Choisissez le motif le plus précis lorsque l’application le demande.'],
  ['Signaler un problème','Indiquez la date du trajet, ce qui s’est passé et les informations utiles au support. Pour un problème de passager, paiement, sécurité ou technique, donnez des détails clairs et ajoutez une capture d’écran si vous en avez une.'],
  ['Règles et conditions chauffeur','Le chauffeur doit maintenir ses informations et son véhicule à jour, respecter les passagers et les règles de circulation, ne pas discriminer, ne pas manipuler les prix et ne pas partager son compte. Des violations graves ou répétées peuvent entraîner une restriction ou une suspension.'],
  ['Contacter le support','Contactez le support lorsque les étapes d’aide ne suffisent pas. Donnez votre nom, le type de problème, la date et l’heure, ainsi que les informations du trajet si nécessaire. En cas de danger physique immédiat, contactez d’abord les services d’urgence locaux.']
]

const ICONS=['🚕','✅','👤','💳','📱','👤','🚗','🛡️','🚨','🛠️','📍','🔒','✖️','⚠️','📋','💬']

export default function DriverFinalHelpTopics(){
  useEffect(()=>{
    if(window.location.pathname!=='/driver/dashboard') return

    const styleId='driver-help-center-polish-style'
    if(!document.getElementById(styleId)){
      const style=document.createElement('style')
      style.id=styleId
      style.textContent=`
        .driver-help-center-head{background:linear-gradient(145deg,#0f705a,#155f51);color:#fff;border-radius:18px;padding:15px;margin:2px 0 12px;display:flex;gap:12px;align-items:center;box-shadow:0 8px 20px rgba(15,112,90,.16)}
        .driver-help-center-head .dhc-icon{width:44px;height:44px;border-radius:14px;background:rgba(255,255,255,.16);display:grid;place-items:center;font-size:21px;border:1px solid rgba(255,255,255,.28)}
        .driver-help-center-head strong{display:block;font-size:14px}.driver-help-center-head small{display:block;margin-top:3px;font-size:10px;line-height:1.35;opacity:.86}
        .driver-help-topic{border:1px solid #e2e9e6;border-radius:14px;background:#fff;margin:8px 0;overflow:hidden;box-shadow:0 4px 12px rgba(16,32,51,.04)}
        .driver-help-topic button{width:100%;border:0;background:#fff;padding:12px;display:grid;grid-template-columns:34px 1fr 22px;gap:10px;align-items:center;text-align:left;color:#102033;cursor:pointer;touch-action:manipulation}
        .driver-help-topic .dht-icon{width:34px;height:34px;border-radius:10px;background:#eaf5f1;display:grid;place-items:center;font-size:16px}
        .driver-help-topic .dht-title{font-size:11px;font-weight:850;line-height:1.25}
        .driver-help-topic .dht-chevron{font-size:18px;color:#0f705a;text-align:center;transition:transform .2s ease}
        .driver-help-topic.open{border-color:#9fd1c1;background:#f8fcfa}
        .driver-help-topic.open .dht-chevron{transform:rotate(90deg)}
        .driver-help-topic .dht-answer{display:none;margin:0;padding:0 12px 14px 56px;font-size:10.5px;line-height:1.62;color:#566861}
        .driver-help-topic.open .dht-answer{display:block}
        .driver-help-support{margin-top:12px;border-radius:14px;padding:13px;background:#f2f7f5;border:1px solid #dce9e4;text-align:center}
        .driver-help-support strong{display:block;font-size:11px;color:#102033;margin-bottom:4px}.driver-help-support span{font-size:10px;color:#6b7b75;line-height:1.4;display:block}
      `
      document.head.appendChild(style)
    }

    const render=()=>{
      const sections=Array.from(document.querySelectorAll<HTMLElement>('.driver-final-menu-stable-root .dfm-section'))
      const help=sections.find(section=>{
        const text=section.querySelector('.dfm-trigger span')?.textContent?.trim().toLowerCase()
        return text==='aide'||text==='èd'
      })
      const body=help?.querySelector<HTMLElement>('.dfm-body')
      if(!body) return

      const ht=localStorage.getItem('taxi-language')==='ht'
      const langKey=ht?'ht':'fr'
      if(body.dataset.fullHelpTopics===langKey) return

      const topics=ht?HT:FR
      body.replaceChildren()

      const head=document.createElement('div')
      head.className='driver-help-center-head'
      head.innerHTML=`<div class="dhc-icon">❓</div><div><strong>${ht?'Sant Èd chofè':'Centre d’aide chauffeur'}</strong><small>${ht?'Peze sou yon sijè pou wè tout enfòmasyon ak etap ou bezwen.':'Appuyez sur un sujet pour afficher les informations et étapes utiles.'}</small></div>`
      body.appendChild(head)

      topics.forEach(([title,description],index)=>{
        const card=document.createElement('div')
        card.className='driver-help-topic'
        const button=document.createElement('button')
        button.type='button'
        button.setAttribute('aria-expanded','false')
        button.innerHTML=`<span class="dht-icon">${ICONS[index]||'❓'}</span><span class="dht-title"></span><span class="dht-chevron">›</span>`
        const titleEl=button.querySelector<HTMLElement>('.dht-title')
        if(titleEl) titleEl.textContent=title
        const answer=document.createElement('p')
        answer.className='dht-answer'
        answer.textContent=description
        button.addEventListener('click',()=>{
          const open=card.classList.toggle('open')
          button.setAttribute('aria-expanded',String(open))
        })
        card.append(button,answer)
        body.appendChild(card)
      })

      const support=document.createElement('div')
      support.className='driver-help-support'
      support.innerHTML=`<strong>💬 ${ht?'Bezwen plis èd?':'Besoin de plus d’aide ?'}</strong><span>${ht?'Louvri Kontakte sipò pou asistans dirèk. Pou yon ijans fizik, kontakte sèvis ijans lokal yo an premye.':'Ouvrez Contacter le support pour une assistance directe. En cas d’urgence physique, contactez d’abord les services d’urgence locaux.'}</span>`
      body.appendChild(support)
      body.dataset.fullHelpTopics=langKey
    }

    render()
    const observer=new MutationObserver(render)
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])

  return null
}
