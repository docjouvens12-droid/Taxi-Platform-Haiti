'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type Lang = 'fr' | 'ht'

export default function PassengerLanguageStableInline(){
  const [target,setTarget]=useState<HTMLElement|null>(null)
  const [open,setOpen]=useState(false)
  const [lang,setLang]=useState<Lang>('fr')

  useEffect(()=>{
    const onClick=(event:MouseEvent)=>{
      const languageRow=(event.target as HTMLElement|null)?.closest<HTMLElement>('.shell .nav-drawer .drawer-language')
      if(!languageRow)return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      const saved=localStorage.getItem('taxi-language')
      setLang(saved==='ht'?'ht':'fr')

      let mount=languageRow.nextElementSibling as HTMLElement|null
      if(!mount||!mount.classList.contains('drawer-language-stable-target')){
        mount=document.createElement('div')
        mount.className='drawer-language-stable-target'
        languageRow.insertAdjacentElement('afterend',mount)
      }
      setTarget(mount)
      setOpen(v=>!v)
    }

    document.addEventListener('click',onClick,true)
    return()=>document.removeEventListener('click',onClick,true)
  },[])

  function choose(next:Lang){
    setLang(next)
    localStorage.setItem('taxi-language',next)
    window.location.reload()
  }

  if(!target||!open||!document.contains(target))return null
  const ht=lang==='ht'

  return createPortal(
    <section className="psl-wrap">
      <style>{`
        .psl-wrap{margin:4px 0 10px;padding:11px;border:1px solid #dfe8e4;border-radius:17px;background:#f8faf9}
        .psl-head{display:flex;align-items:center;gap:8px;margin-bottom:9px}
        .psl-head span{font-size:17px}.psl-head div{min-width:0}.psl-head strong{display:block;font-size:13px;color:#10243a}.psl-head small{display:block;font-size:9px;color:#7e8b86;margin-top:2px}
        .psl-head button{margin-left:auto;border:0;border-radius:10px;background:#edf5f2;padding:7px 9px;font-size:9px;font-weight:900;color:#0f705a}
        .psl-options{display:grid;gap:7px}.psl-option{width:100%;border:1px solid #e0e8e5;border-radius:13px;background:#fff;padding:11px;display:flex;align-items:center;gap:10px;text-align:left;color:#10243a}
        .psl-option.active{border-color:#9acdbd;background:#eff9f5}.psl-flag{font-size:20px}.psl-copy{flex:1}.psl-copy b{display:block;font-size:12px}.psl-copy small{display:block;margin-top:2px;font-size:9px;color:#7b8984}.psl-check{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#edf2f0;color:#8b9993;font-size:11px;font-weight:900}.psl-option.active .psl-check{background:#0f705a;color:#fff}
        .drawer-language .language-options{display:none!important}
      `}</style>
      <div className="psl-head">
        <span>🌐</span>
        <div><strong>{ht?'Lang':'Langue'}</strong><small>{ht?'Chwazi lang aplikasyon an':'Choisissez la langue de l’application'}</small></div>
        <button type="button" onClick={()=>setOpen(false)}>{ht?'Fèmen':'Fermer'}</button>
      </div>
      <div className="psl-options">
        <button type="button" className={`psl-option ${lang==='fr'?'active':''}`} onClick={()=>choose('fr')}>
          <span className="psl-flag">🇫🇷</span><span className="psl-copy"><b>Français</b><small>{ht?'Fransè':'Français'}</small></span><span className="psl-check">{lang==='fr'?'✓':''}</span>
        </button>
        <button type="button" className={`psl-option ${lang==='ht'?'active':''}`} onClick={()=>choose('ht')}>
          <span className="psl-flag">🇭🇹</span><span className="psl-copy"><b>Kreyòl</b><small>{ht?'Kreyòl Ayisyen':'Créole haïtien'}</small></span><span className="psl-check">{lang==='ht'?'✓':''}</span>
        </button>
      </div>
    </section>,target
  )
}
