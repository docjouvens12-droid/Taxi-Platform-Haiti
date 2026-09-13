'use client'

import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type CompletedRide = {
  id: string
  driver_id: string | null
  pickup_address: string
  destination_address: string
  estimated_fare_htg: number | string | null
  final_fare_htg: number | string | null
  completed_at: string | null
}

type RidePayment = {
  method: string | null
  provider: string | null
  status: string | null
}

const dismissedKey = (userId: string, rideId: string) => `taxi-dismissed-receipt:${userId}:${rideId}`
const MAX_RECEIPT_AGE_MS = 15 * 60 * 1000

export default function PassengerRideCompletion() {
  const [user, setUser] = useState<User | null>(null)
  const [ride, setRide] = useState<CompletedRide | null>(null)
  const [payment, setPayment] = useState<RidePayment | null>(null)
  const [hiddenRideId, setHiddenRideId] = useState<string | null>(null)
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [rated, setRated] = useState(false)
  const [lang, setLang] = useState<'fr' | 'ht'>('fr')

  const fare = useMemo(() => Number(ride?.final_fare_htg ?? ride?.estimated_fare_htg ?? 0), [ride])

  useEffect(() => {
    const saved = localStorage.getItem('taxi-language')
    if (saved === 'ht' || saved === 'fr') setLang(saved)
    const timer = window.setInterval(() => {
      const next = localStorage.getItem('taxi-language')
      if (next === 'ht' || next === 'fr') setLang(next)
    }, 800)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true
    async function syncUser() {
      const { data } = await supabase.auth.getUser()
      if (active) setUser(data.user ?? null)
    }
    void syncUser()
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setRide(null)
      setPayment(null)
      setHiddenRideId(null)
    })
    const authTimer = window.setInterval(() => void syncUser(), 5000)
    return () => {
      active = false
      window.clearInterval(authTimer)
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setRide(null)
      setPayment(null)
      return
    }
    const currentUser = user
    let active = true

    async function getLatestCompleted(): Promise<CompletedRide | null> {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_latest_completed_ride')
      if (!rpcError) {
        const rpcRow = Array.isArray(rpcData) ? rpcData[0] : rpcData
        if (rpcRow) return rpcRow as CompletedRide
      }

      const { data: fallbackData } = await supabase
        .from('rides')
        .select('id,driver_id,pickup_address,destination_address,estimated_fare_htg,final_fare_htg,completed_at')
        .eq('passenger_id', currentUser.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return (fallbackData as CompletedRide | null) ?? null
    }

    async function loadLatestCompleted() {
      const row = await getLatestCompleted()
      if (!active) return
      if (!row) {
        setRide(null)
        setPayment(null)
        return
      }

      const completedAtMs = row.completed_at ? Date.parse(row.completed_at) : Number.NaN
      const receiptIsStale = !Number.isFinite(completedAtMs) || Date.now() - completedAtMs > MAX_RECEIPT_AGE_MS
      if (receiptIsStale) {
        window.localStorage.setItem(dismissedKey(currentUser.id, row.id), '1')
        setHiddenRideId(row.id)
        setRide(null)
        setPayment(null)
        return
      }

      if (row.id === hiddenRideId) return
      if (window.localStorage.getItem(dismissedKey(currentUser.id, row.id)) === '1') {
        setRide((current) => current?.id === row.id ? null : current)
        return
      }

      const [{ data: existingRating }, { data: paymentRow }] = await Promise.all([
        supabase
          .from('ratings')
          .select('id,stars')
          .eq('ride_id', row.id)
          .eq('rater_id', currentUser.id)
          .maybeSingle(),
        supabase
          .from('payments')
          .select('method,provider,status')
          .eq('ride_id', row.id)
          .eq('passenger_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      if (!active) return
      if (existingRating) {
        window.localStorage.setItem(dismissedKey(currentUser.id, row.id), '1')
        setRide(null)
        setPayment(null)
        return
      }

      setPayment((paymentRow as RidePayment | null) ?? null)
      setRide((current) => {
        if (current?.id !== row.id) {
          setRated(false)
          setStars(0)
          setComment('')
          setMessage('')
        }
        return row
      })
    }

    void loadLatestCompleted()
    const pollTimer = window.setInterval(() => void loadLatestCompleted(), 2500)
    const channel = supabase
      .channel(`passenger-completed-${currentUser.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rides',
        filter: `passenger_id=eq.${currentUser.id}`,
      }, (payload) => {
        if ((payload.new as any)?.status === 'completed') void loadLatestCompleted()
      })
      .subscribe()

    return () => {
      active = false
      window.clearInterval(pollTimer)
      void supabase.removeChannel(channel)
    }
  }, [user, hiddenRideId])

  async function submitRating() {
    if (!user || !ride || !ride.driver_id || stars < 1 || stars > 5 || rated) return
    setBusy(true)
    setMessage('')
    const { error } = await supabase.from('ratings').insert({
      ride_id: ride.id,
      rater_id: user.id,
      rated_user_id: ride.driver_id,
      stars,
      comment: comment.trim() || null,
    })
    if (error) setMessage(error.message)
    else {
      setRated(true)
      window.localStorage.setItem(dismissedKey(user.id, ride.id), '1')
      setMessage(lang === 'ht' ? 'Mèsi! Evalyasyon ou anrejistre.' : 'Merci ! Votre évaluation a été enregistrée.')
    }
    setBusy(false)
  }

  function closeReceipt() {
    if (!ride || !user) return
    window.localStorage.setItem(dismissedKey(user.id, ride.id), '1')
    setHiddenRideId(ride.id)
    setRide(null)
    setPayment(null)
  }

  if (!user || !ride) return null

  const isHt = lang === 'ht'
  const provider = payment?.provider?.trim().toLowerCase() || ''
  const paymentLabel = provider === 'moncash'
    ? 'MonCash'
    : provider === 'natcash'
      ? 'NatCash'
      : payment?.method === 'card'
        ? (isHt ? 'Kat' : 'Carte')
        : payment?.method === 'mobile_money'
          ? 'Mobile Money'
          : (isHt ? 'Lajan kach' : 'Espèces')

  return <div
    className="receiptBackdrop"
    role="dialog"
    aria-modal="true"
    aria-label={isHt ? 'Trajè fini' : 'Trajet terminé'}
    onClick={(event) => { if (event.target === event.currentTarget) closeReceipt() }}
  >
    <section className="receiptCard">
      <button type="button" className="receiptCloseX" onClick={closeReceipt} aria-label={isHt ? 'Fèmen' : 'Fermer'}>×</button>
      <div className="check">✓</div>
      <p className="eyebrow">{isHt ? 'TRAJÈ FINI' : 'TRAJET TERMINÉ'}</p>
      <h2>{isHt ? 'Mèsi paske ou te vwayaje ak MOVI' : 'Merci d’avoir voyagé avec MOVI'}</h2>

      <div className="route">
        <div><span>📍</span><small>{isHt ? 'Depa' : 'Prise en charge'}</small><strong>{ride.pickup_address}</strong></div>
        <div><span>🏁</span><small>{isHt ? 'Destinasyon' : 'Destination'}</small><strong>{ride.destination_address}</strong></div>
      </div>

      <div className="summary">
        <div className="fareBlock"><small>{isHt ? 'Montan final' : 'Montant final'}</small><strong>{fare.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} HTG</strong></div>
        <div><small>{isHt ? 'Peman' : 'Paiement'}</small><strong>{payment?.method === 'cash' || !payment ? '💵 ' : '📱 '}{paymentLabel}</strong></div>
      </div>

      <div className="ratingBox">
        <h3>{rated ? (isHt ? 'Evalyasyon voye' : 'Évaluation envoyée') : (isHt ? 'Kijan trajè ou te pase?' : 'Comment s’est passé votre trajet ?')}</h3>
        <div className="stars" aria-label={isHt ? 'Evalyasyon sou senk etwal' : 'Évaluation sur cinq étoiles'}>
          {[1,2,3,4,5].map((n) => <button type="button" key={n} disabled={rated || busy} className={n <= stars ? 'selected' : ''} onClick={() => setStars(n)} aria-label={`${n}`}>★</button>)}
        </div>
        {!rated && <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={isHt ? 'Ajoute yon kòmantè (opsyonèl)' : 'Ajouter un commentaire (facultatif)'} maxLength={500} />}
        {message && <p className={rated ? 'success' : 'error'}>{message}</p>}
        {!rated && <button type="button" className="submit" disabled={busy || stars === 0} onClick={submitRating}>{busy ? (isHt ? 'N ap voye…' : 'Envoi…') : (isHt ? 'Voye evalyasyon mwen' : 'Envoyer mon évaluation')}</button>}
      </div>

      <button type="button" className="close" onClick={closeReceipt}>{rated ? (isHt ? 'Fini' : 'Terminer') : (isHt ? 'Pita' : 'Plus tard')}</button>
    </section>

    <style jsx>{`
      .receiptBackdrop{position:fixed;inset:0;z-index:2147483000;background:rgba(10,22,34,.58);display:flex;align-items:flex-end;justify-content:center;padding:10px;padding-bottom:calc(10px + env(safe-area-inset-bottom));backdrop-filter:blur(5px)}
      .receiptCard{position:relative;width:min(100%,520px);max-height:92vh;overflow:auto;background:#fff;border-radius:26px 26px 22px 22px;padding:18px;color:#102033;box-shadow:0 28px 80px rgba(0,0,0,.3);font-family:Inter,system-ui,sans-serif;box-sizing:border-box;-webkit-overflow-scrolling:touch}
      .receiptCloseX{position:absolute;top:12px;right:12px;width:42px;height:42px;border:0;border-radius:14px;background:#eef4f1;color:#23483e;font-size:28px;line-height:1;display:grid;place-items:center;font-weight:700;z-index:3;cursor:pointer;touch-action:manipulation}
      .check{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:#e8f1ff;color:#1b70eb;font-size:27px;font-weight:900;margin:0 auto 8px}
      .eyebrow{text-align:center;margin:0;color:#1b70eb;font-size:10px;font-weight:900;letter-spacing:.13em}
      h2{text-align:center;margin:6px auto 14px;font-size:20px;line-height:1.18;max-width:390px}
      .route{display:grid;gap:9px;border:1px solid #e2e8ee;border-radius:16px;padding:12px;background:#f9fbfc}.route div{display:grid;grid-template-columns:28px minmax(0,1fr);column-gap:8px;align-items:start}.route span{grid-row:1/3;font-size:20px;line-height:1.2}.route small{color:#7b8998;font-size:10px;font-weight:700}.route strong{font-size:13px;line-height:1.3;margin-top:2px;overflow-wrap:anywhere}
      .summary{display:grid;grid-template-columns:1.2fr .8fr;gap:9px;margin-top:10px}.summary div{background:#102033;color:#fff;border-radius:15px;padding:12px;min-width:0}.summary small,.summary strong{display:block}.summary small{font-size:9px;color:#b9c7d4;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.summary strong{margin-top:4px;font-size:14px;line-height:1.15;overflow-wrap:anywhere}.summary .fareBlock{background:#1b70eb}.summary .fareBlock strong{font-size:18px}
      .ratingBox{margin-top:11px;border-radius:16px;background:#f5f8fb;padding:12px}.ratingBox h3{margin:0 0 8px;font-size:15px;line-height:1.2}.stars{display:flex;justify-content:space-between;gap:4px}.stars button{flex:1;min-width:0;height:46px;border:0;border-radius:12px;background:#fff;color:#cbd3dc;font-size:30px;line-height:1;padding:0;cursor:pointer;box-shadow:inset 0 0 0 1px #e1e7eb}.stars button.selected{color:#f5b301;background:#fff9e8;box-shadow:inset 0 0 0 1px #f3d36e}.stars button:disabled{cursor:default}
      textarea{box-sizing:border-box;width:100%;min-height:74px;resize:vertical;margin-top:9px;border:1px solid #dbe3e8;border-radius:12px;padding:10px 11px;font:inherit;font-size:16px;line-height:1.35;color:#102033;background:#fff;outline:none}textarea:focus{border-color:#8db8f6;box-shadow:0 0 0 3px rgba(27,112,235,.08)}
      .submit,.close{width:100%;border:0;border-radius:13px;padding:13px 14px;font-size:14px;font-weight:900;cursor:pointer;touch-action:manipulation}.submit{margin-top:9px;background:#1b70eb;color:#fff}.submit:disabled{opacity:.45;cursor:not-allowed}.close{margin-top:8px;background:#eef2f5;color:#304357}.success,.error{margin:8px 0 0;font-size:12px;line-height:1.35}.success{color:#0c7659;font-weight:800}.error{color:#a22d2d;font-weight:800}
      @media(max-width:390px){.receiptBackdrop{padding:6px;padding-bottom:calc(6px + env(safe-area-inset-bottom))}.receiptCard{padding:15px;border-radius:22px 22px 18px 18px}.summary{grid-template-columns:1fr}.stars button{height:43px;font-size:27px}h2{font-size:18px}}
      @media(min-width:700px){.receiptBackdrop{align-items:center;padding:18px}.receiptCard{border-radius:30px;padding:22px}}
    `}</style>
  </div>
}
