'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type Method = 'moncash' | 'natcash'

const METHODS: { id: Method; icon: string; fr: string; ht: string; subFr: string; subHt: string }[] = [
  { id: 'moncash', icon: '📱', fr: 'MonCash', ht: 'MonCash', subFr: 'Paiement mobile', subHt: 'Peman mobil' },
  { id: 'natcash', icon: '📲', fr: 'NatCash', ht: 'NatCash', subFr: 'Paiement mobile', subHt: 'Peman mobil' },
]

export default function PassengerDashboardPaymentPanel() {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)
  const [ht, setHt] = useState(false)
  const [method, setMethod] = useState<Method>('moncash')

  const syncMainRow = (next: Method) => {
    const row = document.querySelector<HTMLElement>('.shell .payment-row')
    const strong = row?.querySelector<HTMLElement>('strong')
    const icon = row?.querySelector<HTMLElement>('.payment-icon')
    if (strong) strong.textContent = next === 'moncash' ? 'MonCash' : 'NatCash'
    if (icon) icon.textContent = next === 'moncash' ? '📱' : '📲'
  }

  const closeSheet = () => {
    const panel = target?.closest<HTMLElement>('.account-panel')
    setOpen(false)
    panel?.classList.remove('pdp-active')
    window.setTimeout(() => {
      panel?.querySelector<HTMLButtonElement>('.panel-header button')?.click()
      setTarget(null)
    }, 40)
  }

  useEffect(() => {
    const saved = localStorage.getItem('taxi-payment-method') as Method | null
    const initial: Method = saved === 'natcash' ? 'natcash' : 'moncash'
    localStorage.setItem('taxi-payment-method', initial)
    localStorage.setItem('taxi-dashboard-payment-method', initial)
    setMethod(initial)
    syncMainRow(initial)
    const syncChoice = () => {
      const next: Method = localStorage.getItem('taxi-payment-method') === 'natcash' ? 'natcash' : 'moncash'
      setMethod(next)
      syncMainRow(next)
    }
    window.addEventListener('taxi-payment-method-change', syncChoice)

    const onClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('.shell .payment-row button')
      if (!button) return
      window.setTimeout(() => {
        const panel = document.querySelector<HTMLElement>('.shell .account-panel')
        const body = panel?.querySelector<HTMLElement>('.panel-body')
        if (!panel || !body) return
        panel.classList.add('pdp-active')
        setHt(localStorage.getItem('taxi-language') === 'ht')
        setTarget(body)
        setOpen(true)
      }, 20)
    }

    document.addEventListener('click', onClick, true)
    return () => { document.removeEventListener('click', onClick, true); window.removeEventListener('taxi-payment-method-change', syncChoice) }
  }, [])

  const choose = (next: Method) => {
    setMethod(next)
    localStorage.setItem('taxi-dashboard-payment-method', next)
    localStorage.setItem('taxi-payment-method', next)
    if (next === 'moncash' || next === 'natcash') localStorage.setItem('taxi-payment-provider', next)
    syncMainRow(next)
    window.dispatchEvent(new CustomEvent('taxi-payment-method-change', { detail: next }))
    closeSheet()
  }

  if (!open || !target || !document.contains(target)) return null

  return createPortal(
    <div className="pdp-root">
      <style>{`
        .account-panel.pdp-active{
          position:fixed!important;
          left:12px!important;
          right:12px!important;
          top:auto!important;
          bottom:max(12px,env(safe-area-inset-bottom))!important;
          width:auto!important;
          min-height:0!important;
          height:auto!important;
          max-height:72dvh!important;
          z-index:2147483645!important;
          border-radius:26px!important;
          overflow:hidden!important;
          background:#fff!important;
          box-shadow:0 22px 60px rgba(16,36,31,.24)!important;
          border:1px solid #e2ebe7!important;
        }
        .account-panel.pdp-active + .app-underlay.panel-hidden{
          display:block!important;
          visibility:visible!important;
          opacity:1!important;
          pointer-events:none!important;
        }
        .account-panel.pdp-active::before{
          content:'';
          display:block;
          width:38px;
          height:4px;
          margin:10px auto 2px;
          border-radius:999px;
          background:#d7e1dd;
        }
        .account-panel.pdp-active .panel-header{display:none!important}
        .account-panel.pdp-active .panel-body{padding:8px 12px 14px!important;overflow:auto!important;max-height:calc(72dvh - 20px)!important}
        .pdp-active .panel-body > *:not(.pdp-root){display:none!important}
        .pdp-root{display:grid;gap:8px;padding:0}
        .pdp-title{margin:0;font-size:17px;line-height:1.15;color:#10243a;font-weight:900;text-align:center}
        .pdp-sub{margin:0 0 2px;color:#71817b;font-size:10px;line-height:1.35;text-align:center}
        .pdp-list{display:grid;gap:7px}
        .pdp-card{width:100%;border:1px solid #dfe8e4;border-radius:16px;background:#fff;padding:10px 11px;display:flex;align-items:center;gap:10px;text-align:left;box-shadow:0 5px 14px rgba(24,58,47,.04)}
        .pdp-card.active{border-color:#0f8065;box-shadow:0 0 0 1.5px #0f8065 inset,0 7px 18px rgba(15,128,101,.07)}
        .pdp-icon{width:40px;height:40px;border-radius:12px;background:#edf8f4;display:grid;place-items:center;font-size:20px;flex:0 0 auto}
        .pdp-copy{display:grid;gap:2px;min-width:0;flex:1}.pdp-copy strong{font-size:14px;color:#10243a}.pdp-copy small{font-size:9px;color:#7c8b85;line-height:1.3}
        .pdp-check{width:24px;height:24px;border-radius:50%;border:1.5px solid #cbd8d3;display:grid;place-items:center;font-size:13px;color:transparent;flex:0 0 auto}
        .pdp-card.active .pdp-check{background:#0f8065;border-color:#0f8065;color:#fff}
        .pdp-note{display:none}
        @media(max-width:420px){
          .account-panel.pdp-active{left:10px!important;right:10px!important;bottom:max(10px,env(safe-area-inset-bottom))!important;border-radius:23px!important}
          .pdp-card{padding:9px 10px!important}
        }
      `}</style>
      <h2 className="pdp-title">{ht ? 'Chwazi metòd peman' : 'Choisir le paiement'}</h2>
      <p className="pdp-sub">{ht ? 'Peze yon opsyon; l ap aplike otomatikman.' : 'Touchez une option; elle sera appliquée automatiquement.'}</p>
      <div className="pdp-list">
        {METHODS.map(item => {
          const active = method === item.id
          return <button key={item.id} type="button" className={`pdp-card ${active ? 'active' : ''}`} onClick={() => choose(item.id)}>
            <span className="pdp-icon">{item.icon}</span>
            <span className="pdp-copy"><strong>{ht ? item.ht : item.fr}</strong><small>{ht ? item.subHt : item.subFr}</small></span>
            <span className="pdp-check">✓</span>
          </button>
        })}
      </div>
    </div>,
    target,
  )
}
