'use client'

import { useEffect } from 'react'

type Topic = [string,string]

const HT: Topic[] = [
  ['Trajè ak demann','Lè ou sou liy, nouvo demann trajè ka parèt sou dashboard la. Verifye pickup, destinasyon ak enfòmasyon trajè a anvan ou aksepte. Kenbe GPS ou aktive pandan trajè a.'],
  ['Aksepte oswa kòmanse trajè','Peze Aksepte sou demann ou vle pran an. Ale nan pickup la, verifye pasaje a, epi kòmanse trajè a sèlman lè pasaje a antre nan veyikil la. Lè ou rive, fini trajè a nan aplikasyon an.'],
  ['Pwoblèm ak pasaje','Si pasaje a pa parèt, tann yon ti tan epi eseye kontakte li. Si gen move adrès, konfime nouvo kote a. Si gen menas oswa danje, mete sekirite w an premye epi rapòte pwoblèm nan.'],
  ['Peman ak revni','Pou chak trajè ki fini epi ki peye, sistèm nan separe montan an otomatikman. Nan Revni, ou ka wè brit, komisyon platfòm lan ak net chofè a.'],
  ['MonCash ak NatCash','Nan Peman, chwazi MonCash oswa NatCash kòm metòd prensipal ou. Mete non ki sou kont lan ak nimewo telefòn ki asosye ak kont lan epi verifye yo anvan ou anrejistre.'],
  ['Pwofil ak kont','Verifye non konplè, dat nesans, sèks, adrès, lisans, ID ak telefòn ou. Si yon enfòmasyon chanje, sèvi ak Modifye pou mete li ajou.'],
  ['Veyikil ak dokiman','Verifye kalite veyikil la, mak, modèl, koulè, ane, plak ak kantite plas. Si ou chanje veyikil oswa plak, mete enfòmasyon yo ajou anvan ou pran trajè.'],
  ['Sekirite','Respekte règ sikilasyon, sèvi ak senti sekirite, epi pa manipile telefòn pandan w ap kondwi. Pa pran trajè si ou twò fatige oswa veyikil la pa an bon kondisyon.'],
  ['Aksidan oswa ijans','Si gen aksidan, sekirite moun yo se premye priyorite. Rele sèvis ijans lokal yo si gen blese oswa danje, epi rapòte ensidan an nan platfòm la apre sa.'],
  ['Pwoblèm teknik','Si yon paj pa chaje oswa yon bouton pa reponn, rafrechi paj la, verifye entènèt ou epi relouvri aplikasyon an. Si pwoblèm nan kontinye, pran screenshot epi kontakte sipò.'],
  ['GPS ak pozisyon','Aktive Location/GPS epi bay MOVI pèmisyon pou itilize pozisyon an. Pa fèmen GPS pandan yon trajè aktif.'],
  ['Kont sispann oswa limite','Si kont ou sispann oswa limite, pa kreye yon lòt kont pou evite restriksyon an. Kontakte sipò pou konnen rezon an ak etap pou reaktive li.'],
  ['Anile yon trajè','Anile sèlman lè sa nesesè, tankou lè pasaje a pa parèt, gen pwoblèm sekirite oswa ou pa ka kontinye trajè a.'],
  ['Rapòte yon pwoblèm','Bay dat trajè a, sa ki te pase, ak tout detay ki ka ede sipò a. Ajoute screenshot si ou genyen youn.'],
  ['Règ ak kondisyon chofè','Kenbe enfòmasyon kont ak veyikil ou ajou, respekte pasaje yo ak lwa sikilasyon yo, pa manipile pri epi pa pataje kont ou ak lòt moun.'],
  ['Kontakte sipò','Sèvi ak sipò lè etap èd yo pa rezoud pwoblèm nan. Bay non ou, kalite pwoblèm nan, dat/lè, ak enfòmasyon trajè a si sa nesesè. Pou yon danje fizik imedya, kontakte sèvis ijans lokal yo an premye.']
]

const FR: Topic[] = [
  ['Trajets et demandes','Lorsque vous êtes en ligne, de nouvelles demandes peuvent apparaître sur le tableau de bord. Vérifiez la prise en charge, la destination et les informations du trajet avant d’accepter. Gardez le GPS activé.'],
  ['Accepter ou démarrer un trajet','Appuyez sur Accepter, rejoignez le point de prise en charge, vérifiez le passager, puis démarrez seulement lorsque le passager est dans le véhicule. Terminez le trajet dans l’application à destination.'],
  ['Problèmes avec un passager','Si le passager ne se présente pas, attendez un court moment et essayez de le contacter. En cas de mauvaise adresse, confirmez le nouveau lieu. En cas de danger, privilégiez votre sécurité.'],
  ['Paiements et revenus','Pour chaque trajet terminé et payé, le montant est réparti automatiquement. Revenus affiche le brut, la commission de la plateforme et le net chauffeur.'],
  ['MonCash et NatCash','Dans Paiements, choisissez MonCash ou NatCash comme méthode principale. Saisissez le nom du titulaire et le numéro de téléphone associé, puis vérifiez-les avant d’enregistrer.'],
  ['Profil et compte','Vérifiez votre nom complet, date de naissance, sexe, adresse, permis, identification et téléphone. Utilisez Modifier lorsque vous devez corriger une information.'],
  ['Véhicule et documents','Vérifiez le type de véhicule, la marque, le modèle, la couleur, l’année, la plaque et le nombre de places. Mettez ces informations à jour avant de prendre de nouveaux trajets.'],
  ['Sécurité','Respectez le code de la route, utilisez la ceinture et évitez de manipuler le téléphone pendant la conduite. Ne conduisez pas si vous êtes trop fatigué ou si le véhicule n’est pas en bon état.'],
  ['Accident ou urgence','En cas d’accident, protégez d’abord les personnes. Contactez les services d’urgence locaux s’il y a des blessés ou un danger, puis signalez l’incident à la plateforme.'],
  ['Problème technique','Si une page ne charge pas ou si un bouton ne répond pas, actualisez, vérifiez Internet et relancez l’application. Si le problème continue, prenez une capture et contactez le support.'],
  ['GPS et localisation','Activez la localisation et autorisez MOVI à utiliser votre position. Ne désactivez pas le GPS pendant un trajet actif.'],
  ['Compte suspendu ou limité','Si votre compte est suspendu ou limité, ne créez pas un autre compte pour contourner la restriction. Contactez le support pour connaître la raison et les étapes de réactivation.'],
  ['Annuler un trajet','Annulez seulement lorsque cela est nécessaire, par exemple si le passager ne se présente pas, en cas de problème de sécurité ou si vous ne pouvez pas poursuivre.'],
  ['Signaler un problème','Indiquez la date du trajet, ce qui s’est passé et les informations utiles. Ajoutez une capture d’écran si vous en avez une.'],
  ['Règles et conditions chauffeur','Maintenez vos informations et votre véhicule à jour, respectez les passagers et les règles de circulation, ne manipulez pas les prix et ne partagez pas votre compte.'],
  ['Contacter le support','Utilisez le support lorsque les étapes d’aide ne suffisent pas. Donnez votre nom, le type de problème, la date et l’heure, ainsi que les informations du trajet si nécessaire. En cas de danger immédiat, contactez d’abord les services d’urgence locaux.']
]

const ICONS=['🚕','✅','👤','💳','📱','👤','🚗','🛡️','🚨','🛠️','📍','🔒','✖️','⚠️','📋','💬']

export default function DriverCleanHelpTopics(){
  useEffect(()=>{
    if(!window.location.pathname.startsWith('/driver/dashboard-v2')) return

    const styleId='driver-clean-help-topics-style'
    if(!document.getElementById(styleId)){
      const style=document.createElement('style')
      style.id=styleId
      style.textContent=`
        .dcm-help-full{display:grid;gap:8px}
        .dcm-help-head{background:linear-gradient(145deg,#0f705a,#155f51);color:#fff;border-radius:16px;padding:14px;display:flex;gap:11px;align-items:center;box-shadow:0 8px 20px rgba(15,112,90,.14)}
        .dcm-help-head i{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.16);display:grid;place-items:center;font-style:normal;font-size:20px;border:1px solid rgba(255,255,255,.26)}
        .dcm-help-head strong{display:block;font-size:13px}.dcm-help-head small{display:block;margin-top:3px;font-size:10px;line-height:1.4;opacity:.88}
        .dcm-help-topic{border:1px solid #e2e9e6;border-radius:13px;background:#fff;overflow:hidden}
        .dcm-help-topic button{width:100%;border:0;background:#fff;padding:11px;display:grid;grid-template-columns:32px 1fr 20px;gap:9px;align-items:center;text-align:left;color:#102033;touch-action:manipulation}
        .dcm-help-topic .ico{width:32px;height:32px;border-radius:10px;background:#eaf5f1;display:grid;place-items:center;font-size:15px}
        .dcm-help-topic .ttl{font-size:11px;font-weight:850;line-height:1.25}.dcm-help-topic .chev{font-size:17px;color:#0f705a;text-align:center;transition:transform .2s ease}
        .dcm-help-topic .ans{display:none;margin:0;padding:0 11px 13px 52px;font-size:10.5px;line-height:1.6;color:#566861}
        .dcm-help-topic.open{border-color:#9fd1c1;background:#f8fcfa}.dcm-help-topic.open .chev{transform:rotate(90deg)}.dcm-help-topic.open .ans{display:block}
        .dcm-help-support{margin-top:5px;border-radius:13px;padding:12px;background:#f2f7f5;border:1px solid #dce9e4;text-align:center}.dcm-help-support strong{display:block;font-size:11px;color:#102033;margin-bottom:4px}.dcm-help-support span{font-size:10px;color:#6b7b75;line-height:1.4;display:block}
      `
      document.head.appendChild(style)
    }

    const render=()=>{
      const help=document.querySelector<HTMLElement>('.dcm-help')
      if(!help || help.dataset.fullHelp==='1') return
      const ht=localStorage.getItem('taxi-language')==='ht'
      const topics=ht?HT:FR
      help.dataset.fullHelp='1'
      help.innerHTML=`<div class="dcm-help-full"><div class="dcm-help-head"><i>❓</i><div><strong>${ht?'Sant Èd Chofè':'Centre d’aide chauffeur'}</strong><small>${ht?'Chwazi yon sijè pou wè enstriksyon detaye.':'Choisissez un sujet pour afficher les instructions détaillées.'}</small></div></div>${topics.map((t,i)=>`<div class="dcm-help-topic"><button type="button"><span class="ico">${ICONS[i]}</span><span class="ttl">${t[0]}</span><span class="chev">›</span></button><p class="ans">${t[1]}</p></div>`).join('')}<div class="dcm-help-support"><strong>💬 ${ht?'Kontakte sipò MOVI':'Contacter le support MOVI'}</strong><span>${ht?'Si ou pa jwenn repons ou bezwen an, kontakte sipò ak detay pwoblèm nan ak screenshot si sa posib.':'Si vous ne trouvez pas la réponse, contactez le support avec les détails du problème et une capture si possible.'}</span></div></div>`
      help.querySelectorAll<HTMLButtonElement>('.dcm-help-topic button').forEach(btn=>btn.addEventListener('click',()=>btn.closest('.dcm-help-topic')?.classList.toggle('open')))
    }

    render()
    const observer=new MutationObserver(()=>render())
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])
  return null
}
