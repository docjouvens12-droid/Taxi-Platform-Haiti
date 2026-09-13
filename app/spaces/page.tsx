'use client'

import { useEffect, useState } from 'react'

type Lang = 'fr' | 'ht'

const copy = {
  fr: {
    title: 'Choisissez votre espace',
    subtitle: 'Taxi Platform Haiti',
    description: 'Sélectionnez votre espace pour continuer.',
    passenger: 'Espace passager',
    passengerText: 'Commander un taxi et suivre vos trajets.',
    driver: 'Espace chauffeur',
    driverText: 'Passer en ligne, recevoir et gérer les courses.',
    admin: 'Administration',
    adminText: 'Valider les chauffeurs et gérer la plateforme.',
  },
  ht: {
    title: 'Chwazi espas ou',
    subtitle: 'Taxi Platform Haiti',
    description: 'Chwazi espas ou pou kontinye.',
    passenger: 'Espas pasaje',
    passengerText: 'Mande taksi epi swiv trajè ou yo.',
    driver: 'Espas chofè',
    driverText: 'Mete tèt ou sou liy, resevwa epi jere trajè.',
    admin: 'Administrasyon',
    adminText: 'Apwouve chofè epi jere platfòm lan.',
  },
}

export default function SpacesPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = copy[lang]

  useEffect(() => {
    const saved = localStorage.getItem('taxi-language') as Lang | null
    if (saved === 'fr' || saved === 'ht') setLang(saved)
  }, [])

  function changeLang(next: Lang) {
    setLang(next)
    localStorage.setItem('taxi-language', next)
  }

  return <main className="page"><section className="card">
    <div className="topbar">
      <div className="brand"><span>T</span><div><strong>{t.subtitle}</strong><small>{t.description}</small></div></div>
      <select value={lang} onChange={(e)=>changeLang(e.target.value as Lang)}><option value="fr">Français</option><option value="ht">Kreyòl</option></select>
    </div>

    <h1>{t.title}</h1>

    <div className="spaces">
      <a className="space passenger" href="/passenger/login"><div className="icon">👤</div><div><strong>{t.passenger}</strong><span>{t.passengerText}</span></div><b>›</b></a>
      <a className="space driver" href="/driver/login"><div className="icon">🚕</div><div><strong>{t.driver}</strong><span>{t.driverText}</span></div><b>›</b></a>
      <a className="space admin" href="/admin/login"><div className="icon">🛡️</div><div><strong>{t.admin}</strong><span>{t.adminText}</span></div><b>›</b></a>
    </div>
  </section>
  <style jsx>{`
    .page{min-height:100vh;background:linear-gradient(160deg,#e4f1ed,#eef2f7 55%,#e7edf3);padding:22px;color:#102033;font-family:Inter,system-ui,sans-serif;display:grid;place-items:center}.card{width:min(100%,720px);background:#fff;border-radius:28px;padding:22px;box-shadow:0 24px 70px rgba(18,36,61,.14)}.topbar{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.brand{display:flex;gap:11px;align-items:center}.brand>span{width:48px;height:48px;border-radius:15px;background:#0f6f59;color:#fff;display:grid;place-items:center;font-weight:900}.brand strong,.brand small{display:block}.brand small{color:#7a8998;margin-top:2px}.topbar select{border:1px solid #d8e1e8;border-radius:13px;background:#fff;padding:10px 12px;min-height:44px}.card h1{font-size:34px;margin:30px 0 22px}.spaces{display:grid;gap:14px}.space{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;text-decoration:none;color:#102033;border:1px solid #dce5eb;border-radius:20px;padding:18px;background:#fff;min-height:92px}.space .icon{width:54px;height:54px;border-radius:16px;background:#eef5f3;display:grid;place-items:center;font-size:27px}.space strong,.space span{display:block}.space strong{font-size:20px}.space span{color:#77879a;margin-top:4px}.space b{font-size:30px;color:#8292a2}.passenger{border-color:#bddfd5}.driver{border-color:#b9ded2}.admin{border-color:#d8dce7}@media(max-width:600px){.page{padding:0;display:block}.card{min-height:100vh;border-radius:0;padding:20px 16px}.brand small{max-width:220px}.card h1{font-size:30px;margin-top:42px}.space{min-height:96px}}
  `}</style>
  </main>
}
