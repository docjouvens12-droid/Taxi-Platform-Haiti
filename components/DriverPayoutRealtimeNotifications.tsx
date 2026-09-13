'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed'
type Notice = {
  id: string
  amount_htg: number | string
  status: PayoutStatus
  provider: string | null
  payout_reference: string | null
  paid_at: string | null
}

export default function DriverPayoutRealtimeNotifications() {
  const [notice, setNotice] = useState<Notice | null>(null)
  const [lang, setLang] = useState<'fr' | 'ht'>('fr')

  useEffect(() => {
    if (window.location.pathname !== '/driver/dashboard') return
    const saved = localStorage.getItem('taxi-language')
    if (saved === 'ht') setLang('ht')

    let channel: ReturnType<typeof supabase.channel> | null = null
    let disposed = false

    const setup = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user || disposed) return
      const driverId = auth.user.id

      channel = supabase
        .channel(`driver-payout-notify-${driverId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_payouts',
          filter: `driver_id=eq.${driverId}`,
        }, (payload) => {
          const row = payload.new as Record<string, unknown>
          const previous = payload.old as Record<string, unknown>
          const status = String(row.status ?? '') as PayoutStatus
          if (!['processing', 'paid', 'failed'].includes(status)) return
          if (String(previous.status ?? '') === status) return
          setNotice({
            id: String(row.id ?? ''),
            amount_htg: (row.amount_htg as number | string | undefined) ?? 0,
            status,
            provider: row.provider ? String(row.provider) : null,
            payout_reference: row.payout_reference ? String(row.payout_reference) : null,
            paid_at: row.paid_at ? String(row.paid_at) : null,
          })
        })
        .subscribe()
    }

    void setup()
    return () => {
      disposed = true
      if (channel) void supabase.removeChannel(channel)
    }
  }, [])

  if (!notice) return null

  const money = `${Number(notice.amount_htg ?? 0).toLocaleString('fr-HT', { maximumFractionDigits: 2 })} HTG`
  const provider = notice.provider || (lang === 'ht' ? 'metòd payout ou' : 'votre méthode de versement')
  const title = notice.status === 'processing'
    ? (lang === 'ht' ? 'Payout ou ap trete' : 'Votre versement est en traitement')
    : notice.status === 'paid'
      ? (lang === 'ht' ? 'Payout ou peye' : 'Votre versement est payé')
      : (lang === 'ht' ? 'Payout la echwe' : 'Le versement a échoué')

  const text = notice.status === 'processing'
    ? (lang === 'ht' ? `${money} ap prepare pou ${provider}.` : `${money} est en préparation vers ${provider}.`)
    : notice.status === 'paid'
      ? (lang === 'ht'
          ? `${money} make kòm peye sou ${provider}${notice.payout_reference ? ` · Ref: ${notice.payout_reference}` : ''}.`
          : `${money} est marqué payé vers ${provider}${notice.payout_reference ? ` · Réf: ${notice.payout_reference}` : ''}.`)
      : (lang === 'ht'
          ? `Nou pa t kapab konplete payout ${money}. Verifye enfòmasyon MonCash/NatCash ou nan meni Peman an.`
          : `Le versement de ${money} n’a pas pu être finalisé. Vérifiez vos informations MonCash/NatCash dans Paiements.`)

  return <>
    <div className={`driverPayoutNotice ${notice.status}`} role="status" aria-live="polite">
      <div className="icon">{notice.status === 'paid' ? '✓' : notice.status === 'failed' ? '!' : '↻'}</div>
      <div className="copy"><strong>{title}</strong><span>{text}</span>{notice.paid_at && notice.status === 'paid' && <small>{new Intl.DateTimeFormat(lang === 'ht' ? 'fr-HT' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(notice.paid_at))}</small>}</div>
      <button type="button" onClick={() => setNotice(null)} aria-label={lang === 'ht' ? 'Fèmen' : 'Fermer'}>×</button>
    </div>
    <style jsx>{`
      .driverPayoutNotice{position:fixed;z-index:1200;left:50%;top:18px;transform:translateX(-50%);width:min(calc(100vw - 28px),520px);box-sizing:border-box;display:grid;grid-template-columns:auto 1fr auto;gap:11px;align-items:flex-start;padding:13px 14px;border-radius:17px;background:#eef6ff;border:1px solid #cddff8;box-shadow:0 14px 40px rgba(20,42,73,.22);color:#102033}.driverPayoutNotice.paid{background:#eaf7f2;border-color:#bfe4d6}.driverPayoutNotice.failed{background:#fff0f0;border-color:#efcaca}.icon{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:#1b70eb;color:#fff;font-weight:950}.paid .icon{background:#0b7a5d}.failed .icon{background:#b63232}.copy strong,.copy span,.copy small{display:block}.copy strong{font-size:14px}.copy span{font-size:12px;line-height:1.4;margin-top:3px;color:#526273}.copy small{font-size:10px;margin-top:5px;color:#7a8794}.driverPayoutNotice>button{border:0;background:transparent;color:#6d7b89;font-size:24px;line-height:1;padding:0 2px;cursor:pointer}@media(max-width:600px){.driverPayoutNotice{top:10px}}
    `}</style>
  </>
}
