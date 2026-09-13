'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type Topic = {
  icon: string
  category: 'ride' | 'payment' | 'account' | 'safety' | 'technical' | 'support'
  fr: string
  ht: string
  bodyFr: string
  bodyHt: string
}

type Category = { id: Topic['category'] | 'all'; icon: string; fr: string; ht: string }

const CATEGORIES: Category[] = [
  { id:'all', icon:'✨', fr:'Tous', ht:'Tout' },
  { id:'ride', icon:'🚕', fr:'Trajets', ht:'Trajè' },
  { id:'payment', icon:'💳', fr:'Paiements', ht:'Peman' },
  { id:'account', icon:'👤', fr:'Compte', ht:'Kont' },
  { id:'safety', icon:'🛡️', fr:'Sécurité', ht:'Sekirite' },
  { id:'technical', icon:'🛠️', fr:'Technique', ht:'Teknik' },
  { id:'support', icon:'💬', fr:'Support', ht:'Sipò' },
]

const TOPICS: Topic[] = [
  { icon:'🚕', category:'ride', fr:'Commander un trajet', ht:'Mande yon trajè', bodyFr:'Entrez le lieu de prise en charge et la destination, vérifiez le type de véhicule et le prix estimé, puis confirmez la demande. Gardez votre téléphone disponible pendant la recherche du chauffeur.', bodyHt:'Antre kote pou pran ou ak destinasyon an, verifye kalite machin nan ak pri estime a, epi konfime demann nan. Kenbe telefòn ou disponib pandan sistèm nan ap chèche chofè.' },
  { icon:'📍', category:'ride', fr:'Choisir ou corriger le point de prise en charge', ht:'Chwazi oswa korije kote pou pran ou', bodyFr:'Placez le point de prise en charge à un endroit accessible et sûr. Si l’adresse ou le repère est incorrect, corrigez-le avant de confirmer le trajet. Si un chauffeur a déjà accepté, communiquez clairement tout changement.', bodyHt:'Mete kote pou pran ou a nan yon kote ki fasil pou jwenn epi ki an sekirite. Si adrès oswa repè a pa bon, korije li anvan ou konfime trajè a. Si yon chofè deja aksepte, esplike nenpòt chanjman byen klè.' },
  { icon:'🏁', category:'ride', fr:'Modifier ou vérifier la destination', ht:'Modifye oswa verifye destinasyon an', bodyFr:'Vérifiez la destination avant de commander. Si vous devez la changer après acceptation, informez le chauffeur et vérifiez le nouveau prix ou itinéraire affiché lorsque l’application le permet.', bodyHt:'Verifye destinasyon an anvan ou mande trajè a. Si ou bezwen chanje li apre chofè a aksepte, enfòme chofè a epi verifye nouvo pri oswa wout la si aplikasyon an montre li.' },
  { icon:'⏳', category:'ride', fr:'Le chauffeur tarde à arriver', ht:'Chofè a pran tan pou rive', bodyFr:'Consultez l’état du trajet et la position disponible dans l’application. Attendez au point de prise en charge indiqué. Si le retard devient important ou si le chauffeur ne se rapproche pas, utilisez les options disponibles dans le trajet ou contactez le support.', bodyHt:'Gade estati trajè a ak pozisyon ki disponib nan aplikasyon an. Rete nan kote ou te mete pou pickup la. Si reta a vin twòp oswa chofè a pa pwoche, sèvi ak opsyon ki nan trajè a oswa kontakte sipò.' },
  { icon:'🚫', category:'ride', fr:'Le chauffeur ne se présente pas', ht:'Chofè a pa parèt', bodyFr:'Vérifiez que vous êtes au bon point de prise en charge. Si le chauffeur ne se présente pas et que vous ne pouvez pas résoudre la situation, annulez avec le motif le plus exact et signalez le problème au support si nécessaire.', bodyHt:'Verifye ou nan bon kote pickup la. Si chofè a pa parèt epi ou pa ka rezoud sitiyasyon an, anile ak rezon ki pi egzak la epi rapòte pwoblèm nan bay sipò si sa nesesè.' },
  { icon:'✖️', category:'ride', fr:'Annuler un trajet', ht:'Anile yon trajè', bodyFr:'Annulez seulement si nécessaire. Si un chauffeur a déjà accepté, choisissez le motif le plus exact afin que l’historique reste clair. Des règles ou frais d’annulation pourront être appliqués plus tard si la plateforme les active.', bodyHt:'Anile sèlman lè sa nesesè. Si yon chofè deja aksepte, chwazi rezon ki pi egzak la pou istorik la rete klè. Règ oswa frè anilasyon ka aplike pita si platfòm nan aktive yo.' },
  { icon:'🧾', category:'ride', fr:'Historique et détails des trajets', ht:'Istorik ak detay trajè', bodyFr:'Dans Mes trajets, consultez vos trajets récents, leur statut, la date, le départ, la destination et le montant. Ouvrez Détails pour retrouver les informations utiles à une demande de support.', bodyHt:'Nan Trajè mwen yo, gade dènye trajè yo, estati, dat, kote depa, destinasyon ak montan. Louvri Detay pou jwenn enfòmasyon ou ka bezwen lè w ap kontakte sipò.' },
  { icon:'🎒', category:'ride', fr:'Objet oublié dans un véhicule', ht:'Bagay ou bliye nan machin', bodyFr:'Notez immédiatement le trajet concerné dans Mes trajets. Conservez l’heure, le lieu et la description de l’objet. Contactez ensuite le support afin qu’il puisse vous aider à identifier le trajet et la marche à suivre.', bodyHt:'Note trajè ki konsène a touswit nan Trajè mwen yo. Kenbe lè, kote ak deskripsyon bagay la. Apre sa kontakte sipò pou yo ka ede idantifye trajè a ak pwochen etap yo.' },

  { icon:'💳', category:'payment', fr:'Choisir MonCash ou NatCash', ht:'Chwazi MonCash oswa NatCash', bodyFr:'Ouvrez Paiement, sélectionnez MonCash ou NatCash, puis vérifiez le nom du titulaire et le numéro de téléphone du compte. Le mode sélectionné devient votre préférence de paiement.', bodyHt:'Louvri Peman, chwazi MonCash oswa NatCash, epi verifye non moun ki sou kont lan ak nimewo telefòn kont lan. Metòd ou chwazi a vin metòd peman prefere ou.' },
  { icon:'📱', category:'payment', fr:'Modifier un compte de paiement', ht:'Modifye yon kont peman', bodyFr:'Dans Paiement, ouvrez la méthode concernée, appuyez sur Modifier, corrigez le nom ou le numéro, puis enregistrez. Vérifiez soigneusement le numéro avant de confirmer.', bodyHt:'Nan Peman, louvri metòd ki konsène a, peze Modifye, korije non oswa nimewo a, epi anrejistre. Verifye nimewo a byen anvan ou konfime.' },
  { icon:'💰', category:'payment', fr:'Le montant du trajet semble incorrect', ht:'Montan trajè a sanble pa bon', bodyFr:'Comparez le montant affiché avec les détails du trajet. Ne modifiez pas vous-même le montant. Notez le numéro du trajet et contactez le support avec une capture d’écran si vous pensez qu’il y a une erreur.', bodyHt:'Konpare montan ki parèt la ak detay trajè a. Pa chanje montan an ou menm. Note nimewo trajè a epi kontakte sipò ak yon screenshot si ou panse gen yon erè.' },
  { icon:'🔁', category:'payment', fr:'Paiement en double ou paiement non reconnu', ht:'Peman double oswa peman ou pa rekonèt', bodyFr:'Ne répétez pas le paiement avant de vérifier l’historique de votre compte MonCash ou NatCash. Conservez toute référence de transaction et contactez le support avec le trajet, le montant, la date et la référence disponible.', bodyHt:'Pa repete peman an anvan ou verifye istorik kont MonCash oswa NatCash ou. Kenbe tout referans tranzaksyon epi kontakte sipò ak trajè a, montan an, dat la ak referans ki disponib.' },
  { icon:'↩️', category:'payment', fr:'Demande de vérification ou remboursement', ht:'Mande verifikasyon oswa ranbousman', bodyFr:'Pour toute demande liée à un remboursement ou à une correction de paiement, rassemblez le numéro du trajet, le montant, la date et la preuve de transaction. Le support pourra vérifier le dossier selon les règles de la plateforme.', bodyHt:'Pou nenpòt demann ranbousman oswa koreksyon peman, rasanble nimewo trajè a, montan, dat ak prèv tranzaksyon an. Sipò a ap kapab verifye dosye a selon règ platfòm nan.' },

  { icon:'👤', category:'account', fr:'Modifier mon profil', ht:'Modifye pwofil mwen', bodyFr:'Dans Profil, vous pouvez mettre à jour les informations disponibles comme le nom, la date de naissance, le sexe et le téléphone. L’e-mail du compte reste affiché comme identifiant de connexion.', bodyHt:'Nan Pwofil, ou ka mete ajou enfòmasyon ki disponib tankou non, dat nesans, sèks ak telefòn. Imèl kont lan rete kòm idantifyan pou koneksyon.' },
  { icon:'🔐', category:'account', fr:'Problème de connexion ou mot de passe', ht:'Pwoblèm koneksyon oswa modpas', bodyFr:'Vérifiez l’adresse e-mail et le mot de passe saisis. Utilisez la récupération de mot de passe lorsqu’elle est disponible. Si vous restez bloqué, contactez le support avec l’adresse e-mail du compte, sans envoyer votre mot de passe.', bodyHt:'Verifye adrès imèl ak modpas ou antre yo. Sèvi ak rekiperasyon modpas lè li disponib. Si ou toujou bloke, kontakte sipò ak adrès imèl kont lan, men pa voye modpas ou.' },
  { icon:'📧', category:'account', fr:'Changer ou corriger mon e-mail', ht:'Chanje oswa korije imèl mwen', bodyFr:'Si l’adresse e-mail de connexion doit être corrigée, contactez le support avant de créer un autre compte. Cela aide à éviter les doublons et la perte d’historique.', bodyHt:'Si adrès imèl koneksyon an bezwen korije, kontakte sipò anvan ou kreye yon lòt kont. Sa ede evite kont double ak pèt istorik.' },
  { icon:'🔒', category:'account', fr:'Compte bloqué, limité ou accès refusé', ht:'Kont bloke, limite oswa aksè refize', bodyFr:'Lisez le message affiché dans l’application. Ne créez pas un nouveau compte pour contourner une restriction. Contactez le support avec votre e-mail et une capture du message afin qu’il puisse vérifier la situation.', bodyHt:'Li mesaj ki parèt nan aplikasyon an. Pa kreye yon lòt kont pou kontoune yon restriksyon. Kontakte sipò ak imèl ou ak yon screenshot mesaj la pou yo ka verifye sitiyasyon an.' },
  { icon:'🌐', category:'account', fr:'Changer la langue', ht:'Chanje lang', bodyFr:'Dans Langue, choisissez Français ou Kreyòl. La langue sélectionnée doit être conservée pour les prochains écrans et les prochaines ouvertures de l’application.', bodyHt:'Nan Lang, chwazi Français oswa Kreyòl. Lang ou chwazi a dwe rete pou lòt ekran yo ak pwochen fwa ou louvri aplikasyon an.' },

  { icon:'🛡️', category:'safety', fr:'Vérifier le chauffeur et le véhicule', ht:'Verifye chofè a ak machin nan', bodyFr:'Avant de monter, comparez les informations visibles dans l’application avec le chauffeur et le véhicule présents. Si les informations ne correspondent pas, ne montez pas et signalez la situation.', bodyHt:'Anvan ou monte, konpare enfòmasyon ki nan aplikasyon an ak chofè a ak machin ki devan ou. Si enfòmasyon yo pa koresponn, pa monte epi rapòte sitiyasyon an.' },
  { icon:'🚨', category:'safety', fr:'Danger, menace ou agression', ht:'Danje, menas oswa agresyon', bodyFr:'Si vous êtes en danger immédiat, éloignez-vous si possible et contactez d’abord les services d’urgence locaux. Lorsque vous êtes en sécurité, notez les informations du trajet et signalez l’incident au support.', bodyHt:'Si ou nan danje imedya, deplase ale nan yon kote ki an sekirite si sa posib epi kontakte sèvis ijans lokal yo an premye. Lè ou an sekirite, note enfòmasyon trajè a epi rapòte ensidan an bay sipò.' },
  { icon:'🚑', category:'safety', fr:'Accident pendant le trajet', ht:'Aksidan pandan trajè', bodyFr:'En cas d’accident, privilégiez la sécurité et les soins urgents. Contactez les services d’urgence locaux si nécessaire. Ensuite, conservez les informations du trajet et signalez l’accident à la plateforme.', bodyHt:'Si gen aksidan, mete sekirite ak swen ijans an premye. Kontakte sèvis ijans lokal yo si sa nesesè. Apre sa, kenbe enfòmasyon trajè a epi rapòte aksidan an bay platfòm nan.' },
  { icon:'🤝', category:'safety', fr:'Comportement inapproprié, harcèlement ou discrimination', ht:'Move konpòtman, arasman oswa diskriminasyon', bodyFr:'Mettez fin à l’interaction si vous ne vous sentez pas en sécurité. Notez le trajet, l’heure et ce qui s’est passé, puis contactez le support. En cas de danger immédiat, contactez d’abord les services d’urgence locaux.', bodyHt:'Sispann entèraksyon an si ou pa santi ou an sekirite. Note trajè a, lè a ak sa ki te pase, epi kontakte sipò. Si gen danje imedya, kontakte sèvis ijans lokal yo an premye.' },
  { icon:'♿', category:'safety', fr:'Besoin particulier ou accessibilité', ht:'Bezwen espesyal oswa aksesibilite', bodyFr:'Si vous avez un besoin particulier lié à la mobilité, aux bagages ou à l’assistance, préparez les informations avant la prise en charge et communiquez-les clairement. Si l’application ne permet pas encore de préciser ce besoin, contactez le support.', bodyHt:'Si ou gen yon bezwen espesyal pou mobilite, bagaj oswa asistans, prepare enfòmasyon yo anvan pickup la epi esplike yo byen klè. Si aplikasyon an poko pèmèt ou mete bezwen sa a, kontakte sipò.' },

  { icon:'📍', category:'technical', fr:'GPS ou position incorrecte', ht:'GPS oswa pozisyon pa bon', bodyFr:'Activez la localisation du téléphone et autorisez Taxi Haiti à utiliser votre position. Si le point reste incorrect, désactivez puis réactivez la localisation, vérifiez votre connexion et actualisez la page une fois.', bodyHt:'Aktive Location sou telefòn ou epi bay Taxi Haiti pèmisyon pou itilize pozisyon an. Si pozisyon an toujou pa bon, fè Location la off/on, verifye entènèt la epi rafrechi paj la yon fwa.' },
  { icon:'🗺️', category:'technical', fr:'La carte ne charge pas', ht:'Kat la pa chaje', bodyFr:'Vérifiez votre connexion Internet et l’autorisation de localisation. Fermez puis rouvrez l’application si nécessaire. Si le problème continue, prenez une capture d’écran et contactez le support.', bodyHt:'Verifye koneksyon entènèt la ak pèmisyon Location. Fèmen epi relouvri aplikasyon an si sa nesesè. Si pwoblèm nan kontinye, pran yon screenshot epi kontakte sipò.' },
  { icon:'🛠️', category:'technical', fr:'Un bouton ne répond pas', ht:'Yon bouton pa reponn', bodyFr:'Attendez quelques secondes, puis essayez une seule fois de nouveau. Actualisez la page si nécessaire. Évitez d’appuyer plusieurs fois sur un bouton de commande ou de paiement afin de ne pas créer d’action en double.', bodyHt:'Tann kèk segond epi eseye yon sèl fwa ankò. Rafrechi paj la si sa nesesè. Evite peze plizyè fwa sou bouton demann oswa peman pou pa kreye aksyon double.' },
  { icon:'📶', category:'technical', fr:'Connexion Internet faible ou coupée', ht:'Entènèt fèb oswa koupe', bodyFr:'Passez sur une connexion plus stable lorsque possible. Ne confirmez pas plusieurs fois une demande ou un paiement pendant une coupure. Après le retour du réseau, vérifiez d’abord l’état du trajet ou du paiement.', bodyHt:'Pase sou yon koneksyon ki pi estab si sa posib. Pa konfime demann oswa peman plizyè fwa pandan entènèt koupe. Lè rezo a retounen, verifye estati trajè oswa peman an anvan.' },
  { icon:'📱', category:'technical', fr:'L’application semble bloquée sur iPhone', ht:'Aplikasyon an sanble bloke sou iPhone', bodyFr:'Fermez complètement la page ou l’onglet puis ouvrez de nouveau le lien principal de Taxi Haiti. Si le problème revient, notez l’écran concerné et envoyez une capture au support.', bodyHt:'Fèmen paj oswa tab la nèt epi relouvri lyen prensipal Taxi Haiti a. Si pwoblèm nan retounen, note ki ekran ki bloke a epi voye yon screenshot bay sipò.' },

  { icon:'⚠️', category:'support', fr:'Signaler un problème de trajet', ht:'Rapòte yon pwoblèm trajè', bodyFr:'Préparez le numéro ou la date du trajet, le lieu, l’heure, une description claire du problème et toute capture utile. Plus les informations sont précises, plus le support peut vérifier rapidement.', bodyHt:'Prepare nimewo oswa dat trajè a, kote, lè, yon deskripsyon klè sou pwoblèm nan ak nenpòt screenshot itil. Plis enfòmasyon yo presi, se plis sipò ka verifye rapid.' },
  { icon:'💬', category:'support', fr:'Contacter le support', ht:'Kontakte sipò', bodyFr:'Contactez le support lorsque les étapes d’aide ne suffisent pas. Indiquez votre nom, l’e-mail du compte, le type de problème, la date et l’heure, ainsi que les informations du trajet si nécessaire. Ne partagez jamais votre mot de passe.', bodyHt:'Kontakte sipò lè etap èd yo pa sifi. Bay non ou, imèl kont lan, kalite pwoblèm nan, dat ak lè, epi enfòmasyon trajè a si sa nesesè. Pa janm pataje modpas ou.' },
  { icon:'📸', category:'support', fr:'Quoi envoyer au support', ht:'Kisa pou voye bay sipò', bodyFr:'Envoyez une description courte, le trajet concerné, une capture d’écran si utile et toute référence de paiement disponible. Masquez les informations sensibles qui ne sont pas nécessaires.', bodyHt:'Voye yon deskripsyon kout, trajè ki konsène a, yon screenshot si li itil ak nenpòt referans peman ki disponib. Kache enfòmasyon sansib ki pa nesesè.' },
  { icon:'🧭', category:'support', fr:'Quand contacter les services d’urgence', ht:'Kilè pou kontakte sèvis ijans', bodyFr:'Le support de Taxi Haiti ne remplace pas les services d’urgence. En cas de danger immédiat, blessure grave, violence ou menace en cours, contactez d’abord les services d’urgence locaux, puis la plateforme lorsque vous êtes en sécurité.', bodyHt:'Sipò Taxi Haiti pa ranplase sèvis ijans. Si gen danje imedya, gwo blesi, vyolans oswa menas k ap fèt, kontakte sèvis ijans lokal yo an premye, epi kontakte platfòm nan lè ou an sekirite.' },
]

export default function PassengerHelpDirectNavigation() {
  const [target, setTarget] = useState<Element | null>(null)
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState<'fr'|'ht'>('fr')
  const [active, setActive] = useState<number | null>(null)
  const [category, setCategory] = useState<Category['id']>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let currentButton: HTMLButtonElement | null = null
    let currentHandler: ((event: MouseEvent) => void) | null = null

    const sync = () => {
      const drawer = document.querySelector('.nav-drawer')
      if (!drawer) { setTarget(null); setOpen(false); return }
      const buttons = Array.from(drawer.querySelectorAll<HTMLButtonElement>('.drawer-nav > button'))
      const helpButton = buttons.find((button) => {
        const text = (button.textContent || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
        return text.includes('aide') || text.includes('ed')
      }) || null
      if (!helpButton) { setTarget(null); return }

      if (currentButton !== helpButton) {
        if (currentButton && currentHandler) currentButton.removeEventListener('click', currentHandler, true)
        currentButton = helpButton
        currentHandler = (event: MouseEvent) => {
          event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation()
          setLang(localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr')
          setOpen((value) => !value)
          setActive(null)
          setCategory('all')
          setQuery('')
        }
        helpButton.addEventListener('click', currentHandler, true)
      }

      let mount = drawer.querySelector('.drawer-help-inline-target') as HTMLElement | null
      if (!mount) {
        mount = document.createElement('div')
        mount.className = 'drawer-help-inline-target'
        helpButton.insertAdjacentElement('afterend', mount)
      }
      setTarget(mount)
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList:true, subtree:true })
    return () => {
      observer.disconnect()
      if (currentButton && currentHandler) currentButton.removeEventListener('click', currentHandler, true)
    }
  }, [])

  const ht = lang === 'ht'
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    return TOPICS.map((topic, index) => ({ topic, index })).filter(({ topic }) => {
      if (category !== 'all' && topic.category !== category) return false
      if (!q) return true
      const haystack = `${topic.fr} ${topic.ht} ${topic.bodyFr} ${topic.bodyHt}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      return haystack.includes(q)
    })
  }, [category, query])

  if (!target || !open) return null

  return createPortal(
    <section className="passenger-help-center">
      <style>{`
        .drawer-help-inline-target{width:100%;order:51}
        .passenger-help-center{margin:4px 4px 10px;padding:11px;border:1px solid #dce9e5;border-radius:16px;background:#f8fcfa}
        .passenger-help-head{background:linear-gradient(145deg,#0f705a,#155f51);color:#fff;border-radius:16px;padding:13px;margin-bottom:9px;display:grid;grid-template-columns:40px 1fr auto;gap:10px;align-items:center;box-shadow:0 7px 18px rgba(15,112,90,.14)}
        .passenger-help-icon{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.16);display:grid;place-items:center;font-size:19px;border:1px solid rgba(255,255,255,.18)}
        .passenger-help-head strong{display:block;font-size:12px}.passenger-help-head small{display:block;margin-top:3px;font-size:8.5px;line-height:1.35;opacity:.88}
        .passenger-help-head button{border:0;border-radius:9px;background:rgba(255,255,255,.16);color:#fff;font-size:9px;font-weight:850;padding:6px 8px}
        .passenger-help-emergency{display:grid;grid-template-columns:30px 1fr;gap:8px;align-items:start;padding:10px;margin-bottom:9px;border:1px solid #f0d2d2;border-radius:12px;background:#fff6f6;color:#8f3434}
        .passenger-help-emergency>span{font-size:18px}.passenger-help-emergency strong{display:block;font-size:9.5px}.passenger-help-emergency small{display:block;margin-top:2px;font-size:8.5px;line-height:1.4}
        .passenger-help-search{position:relative;margin-bottom:8px}.passenger-help-search span{position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px}.passenger-help-search input{width:100%;box-sizing:border-box;border:1px solid #dce7e3;border-radius:12px;background:#fff;padding:10px 10px 10px 32px;font-size:10px;color:#173246;outline:none}.passenger-help-search input:focus{border-color:#91cbb8;box-shadow:0 0 0 2px rgba(15,112,90,.08)}
        .passenger-help-categories{display:flex;gap:5px;overflow-x:auto;padding:1px 0 8px;scrollbar-width:none}.passenger-help-categories::-webkit-scrollbar{display:none}.passenger-help-categories button{flex:0 0 auto;border:1px solid #e1e9e6;border-radius:999px;background:#fff;color:#62726c;padding:7px 9px;font-size:8.5px;font-weight:850;white-space:nowrap}.passenger-help-categories button.active{background:#0f705a;border-color:#0f705a;color:#fff}
        .passenger-help-count{display:flex;justify-content:space-between;align-items:center;padding:1px 2px 4px;color:#7b8984;font-size:8.5px}.passenger-help-count strong{color:#0f705a}
        .passenger-help-topic{border:1px solid #e3ebe8;border-radius:12px;background:#fff;margin:7px 0;overflow:hidden;box-shadow:0 3px 9px rgba(16,32,51,.025)}
        .passenger-help-topic>button{width:100%;border:0;background:#fff;padding:10px;display:grid;grid-template-columns:30px 1fr 18px;gap:8px;align-items:center;text-align:left;color:#173246}
        .passenger-help-topic-icon{width:30px;height:30px;border-radius:9px;background:#eaf5f1;display:grid;place-items:center;font-size:14px}
        .passenger-help-topic-title{font-size:10px;font-weight:850;line-height:1.25}.passenger-help-chevron{font-size:15px;color:#0f705a;transition:.2s}.passenger-help-topic.open{border-color:#a9d4c6;background:#f9fcfb}.passenger-help-topic.open .passenger-help-chevron{transform:rotate(90deg)}
        .passenger-help-answer{padding:0 10px 11px 48px;font-size:9.5px;line-height:1.58;color:#5d6d67}
        .passenger-help-empty{padding:18px 10px;text-align:center;border:1px dashed #d8e3df;border-radius:12px;background:#fff;color:#74837e;font-size:9.5px}
        .passenger-help-support{margin-top:10px;padding:11px;border-radius:12px;background:#eef7f3;border:1px solid #dbe9e3;color:#566a62}.passenger-help-support strong{display:block;font-size:9.5px;color:#173246;margin-bottom:3px}.passenger-help-support span{font-size:8.7px;line-height:1.45;display:block}
      `}</style>

      <div className="passenger-help-head">
        <div className="passenger-help-icon">❓</div>
        <div><strong>{ht ? 'Sant èd kliyan' : 'Centre d’aide client'}</strong><small>{ht ? 'Jwenn repons rapid pou trajè, peman, kont ak sekirite' : 'Réponses rapides pour trajets, paiements, compte et sécurité'}</small></div>
        <button type="button" onClick={() => setOpen(false)}>{ht ? 'Fèmen' : 'Fermer'}</button>
      </div>

      <div className="passenger-help-emergency">
        <span>🚨</span>
        <div><strong>{ht ? 'Ijans oswa danje imedya' : 'Urgence ou danger immédiat'}</strong><small>{ht ? 'Kontakte sèvis ijans lokal yo an premye. Sipò Taxi Haiti pa ranplase sèvis ijans.' : 'Contactez d’abord les services d’urgence locaux. Le support Taxi Haiti ne remplace pas les services d’urgence.'}</small></div>
      </div>

      <label className="passenger-help-search">
        <span>🔎</span>
        <input value={query} onChange={(e) => { setQuery(e.target.value); setActive(null) }} placeholder={ht ? 'Chèche yon pwoblèm oswa yon sijè…' : 'Rechercher un problème ou un sujet…'} />
      </label>

      <div className="passenger-help-categories">
        {CATEGORIES.map((item) => <button type="button" key={item.id} className={category === item.id ? 'active' : ''} onClick={() => { setCategory(item.id); setActive(null) }}>{item.icon} {ht ? item.ht : item.fr}</button>)}
      </div>

      <div className="passenger-help-count"><span>{ht ? 'Sijè disponib' : 'Sujets disponibles'}</span><strong>{shown.length}</strong></div>

      {shown.length === 0 ? <div className="passenger-help-empty">{ht ? 'Nou pa jwenn sijè sa a. Eseye yon lòt mo oswa chwazi Tout.' : 'Aucun sujet trouvé. Essayez un autre mot ou sélectionnez Tous.'}</div> : shown.map(({ topic, index }) => {
        const isOpen = active === index
        return <div className={`passenger-help-topic ${isOpen ? 'open' : ''}`} key={`${topic.category}-${topic.fr}`}>
          <button type="button" onClick={() => setActive(isOpen ? null : index)}>
            <span className="passenger-help-topic-icon">{topic.icon}</span>
            <span className="passenger-help-topic-title">{ht ? topic.ht : topic.fr}</span>
            <span className="passenger-help-chevron">›</span>
          </button>
          {isOpen && <div className="passenger-help-answer">{ht ? topic.bodyHt : topic.bodyFr}</div>}
        </div>
      })}

      <div className="passenger-help-support">
        <strong>{ht ? 'Ou toujou bezwen èd?' : 'Vous avez encore besoin d’aide ?'}</strong>
        <span>{ht ? 'Prepare non ou, imèl kont lan, dat/lè pwoblèm nan, nimewo trajè a si genyen, epi yon screenshot si li itil. Pa janm pataje modpas ou.' : 'Préparez votre nom, l’e-mail du compte, la date/heure du problème, le trajet concerné si nécessaire et une capture utile. Ne partagez jamais votre mot de passe.'}</span>
      </div>
    </section>,
    target,
  )
}
