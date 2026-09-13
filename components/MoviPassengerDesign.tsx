'use client'

import { useEffect } from 'react'

export default function MoviPassengerDesign() {
  useEffect(() => {
    let stopped = false
    let timer = 0
    let attempts = 0

    const apply = () => {
      if (stopped) return true
      const booking = document.querySelector('.booking-sheet')
      const map = document.querySelector('.map-panel.real-map-panel')
      if (!booking || !map) return false

      document.body.classList.add('movi-passenger-ui')

      const brand = document.querySelector<HTMLElement>('.brand-chip strong')
      const mark = document.querySelector<HTMLElement>('.brand-chip .brand-mark')
      if (brand && brand.textContent !== 'MOVI') brand.textContent = 'MOVI'
      if (mark && mark.textContent !== 'M') mark.textContent = 'M'

      document.querySelectorAll<HTMLElement>('.nav-drawer strong').forEach((el) => {
        if (/Taxi Haiti|Taxi Platform Haiti/i.test(el.textContent || '')) el.textContent = 'MOVI'
      })
      return true
    }

    const boot = () => {
      if (stopped || apply() || attempts >= 12) return
      attempts += 1
      timer = window.setTimeout(boot, 120)
    }

    boot()

    return () => {
      stopped = true
      window.clearTimeout(timer)
      document.body.classList.remove('movi-passenger-ui')
    }
  }, [])

  return <style>{`
    body.movi-passenger-ui .brand-chip{
      min-width:120px!important;
      height:46px!important;
      padding:6px 13px 6px 7px!important;
      border-radius:17px!important;
      background:rgba(255,255,255,.98)!important;
      border:1px solid #dce9e4!important;
      box-shadow:0 10px 26px rgba(16,32,51,.12)!important;
      justify-self:center!important;
    }
    body.movi-passenger-ui .brand-chip .brand-mark{
      width:33px!important;height:33px!important;border-radius:12px!important;
      display:grid!important;place-items:center!important;
      background:linear-gradient(145deg,#18a06f,#08794f)!important;
      color:#fff!important;font-size:18px!important;font-weight:950!important;
      box-shadow:0 7px 18px rgba(11,132,88,.24)!important;
    }
    body.movi-passenger-ui .brand-chip strong{
      display:block!important;font-size:17px!important;line-height:1!important;
      color:#0b2037!important;font-weight:950!important;letter-spacing:-.035em!important;
    }
    body.movi-passenger-ui .brand-chip strong:after{content:none!important}
    body.movi-passenger-ui .brand-chip small{display:none!important}

    body.movi-passenger-ui{background:#f4f8f6!important}
    body.movi-passenger-ui .phone-frame{background:#f4f8f6!important}
    body.movi-passenger-ui .phone-frame,
    body.movi-passenger-ui .map-panel.real-map-panel,
    body.movi-passenger-ui .booking-sheet{
      transition:none!important;
      animation:none!important;
      overflow-anchor:none!important;
    }
    body.movi-passenger-ui .map-panel.real-map-panel{
      height:clamp(322px,43svh,460px)!important;
      min-height:322px!important;max-height:460px!important;
      border-radius:0 0 32px 32px!important;overflow:hidden!important;
      box-shadow:0 18px 44px rgba(10,34,28,.09)!important;
    }
    body.movi-passenger-ui .topbar{
      top:calc(12px + env(safe-area-inset-top))!important;
      left:14px!important;right:14px!important;z-index:60!important;
      display:grid!important;
      grid-template-columns:46px minmax(0,1fr) 46px!important;
      align-items:center!important;
    }
    body.movi-passenger-ui .round-button{
      width:46px!important;height:46px!important;border-radius:16px!important;
      background:rgba(255,255,255,.98)!important;border:1px solid #dce8e3!important;
      box-shadow:0 10px 25px rgba(16,32,51,.13)!important;
    }
    body.movi-passenger-ui .booking-sheet{
      width:calc(100% - 12px)!important;max-width:454px!important;
      margin:-52px auto 0!important;padding:14px 14px calc(108px + env(safe-area-inset-bottom))!important;
      border-radius:30px 30px 0 0!important;background:#fff!important;
      border:1px solid #e1ebe6!important;border-bottom:0!important;
      box-shadow:0 -10px 34px rgba(16,32,51,.09)!important;z-index:50!important;
    }
    body.movi-passenger-ui .passenger-booking-head strong{font-size:22px!important;color:#0d2037!important}
    body.movi-passenger-ui .passenger-booking-head small{color:#0b8c5d!important}
    body.movi-passenger-ui .route-card{
      border-radius:20px!important;border:1px solid #dae7e1!important;background:#fff!important;
      box-shadow:0 9px 24px rgba(16,32,51,.055)!important;
    }
    body.movi-passenger-ui .input-wrap input{font-size:16px!important;color:#10243a!important;font-weight:800!important}
    body.movi-passenger-ui .ride-option{
      border-radius:20px!important;background:#fff!important;border:1px solid #dfe9e4!important;
      box-shadow:0 7px 20px rgba(16,32,51,.045)!important;
    }
    body.movi-passenger-ui .ride-option.selected{
      border-color:#43a27f!important;background:linear-gradient(180deg,#f3fbf8,#ebf7f2)!important;
      box-shadow:0 10px 24px rgba(13,139,92,.11)!important;
    }
    body.movi-passenger-ui .request-button{
      min-height:61px!important;border-radius:19px!important;
      background:linear-gradient(135deg,#13a16d,#087c53)!important;
      box-shadow:0 13px 30px rgba(8,124,83,.24)!important;
    }
    body.movi-passenger-ui .payment-row{border-radius:18px!important;background:#f7fbf9!important;border:1px solid #dbe8e3!important}
  `}</style>
}
