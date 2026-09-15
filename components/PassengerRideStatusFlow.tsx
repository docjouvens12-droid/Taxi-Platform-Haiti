'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import PassengerArrivalNotice from './PassengerArrivalNotice'
import { supabase } from '../lib/supabase'

import { type PassengerRide } from './PassengerRideProvider'

export default function PassengerRideStatusFlow({ ride, ht, onDismiss }: { ride: PassengerRide; ht: boolean; onDismiss: () => void }) {
  const [rating, setRating] = useState(0)
  const [ratingBusy, setRatingBusy] = useState(false)
  const [ratingDone, setRatingDone] = useState(false)
  const [ratingError, setRatingError] = useState('')
  useEffect(() => {
    if (ride.status !== 'completed') return
    let alive = true
    void supabase.from('ride_ratings').select('rating').eq('ride_id', ride.id).maybeSingle().then(({ data }) => {
      if (alive && data?.rating) { setRating(Number(data.rating)); setRatingDone(true) }
    })
    return () => { alive = false }
  }, [ride.id, ride.status])

  const status = ride.status
  const stage = status === 'accepted' ? 1 : status === 'driver_arriving' ? 2 : status === 'in_progress' ? 3 : 4
  const isTerminal = status === 'completed' || status === 'cancelled'
  const driverArrived = status === 'driver_arriving'

  const title = status === 'accepted'
    ? (ht ? 'Chofè a aksepte kous la' : 'Le chauffeur a accepté la course')
    : driverArrived
      ? (ht ? 'Chofè a rive' : 'Votre chauffeur est arrivé')
      : status === 'in_progress'
        ? (ht ? 'Trajè a kòmanse' : 'La course a commencé')
        : status === 'completed'
          ? (ht ? 'Trajè a fini' : 'Course terminée')
          : (ht ? 'Trajè a anile' : 'Course annulée')

  const subtitle = status === 'accepted'
    ? (ht ? 'Gade kat la pou pozisyon chofè a parapò ak ou.' : 'Suivez la carte pour voir le chauffeur par rapport à vous.')
    : driverArrived
      ? (ht ? 'Chofè a rive nan kote pou pran ou. Tanpri pare pou monte.' : 'Le chauffeur est arrivé à votre point de prise en charge. Veuillez vous préparer à monter.')
      : status === 'in_progress'
        ? (ht ? 'Kounye a w ap suiv chofè a sou wout pou destinasyon an.' : 'Vous suivez maintenant le chauffeur vers votre destination.')
        : status === 'completed'
          ? (ht ? 'Ou rive. Tanpri evalye chofè a anvan ou fè yon nouvo kous.' : 'Vous êtes arrivé. Veuillez évaluer votre chauffeur avant une nouvelle course.')
          : (ht ? 'Kous sa a pa aktif ankò.' : 'Cette course n’est plus active.')

  const submitRating = async () => {
    if (status !== 'completed' || rating < 1 || rating > 5 || ratingBusy) return
    setRatingBusy(true)
    setRatingError('')
    const { error } = await supabase.rpc('rate_completed_ride', {
      p_ride_id: ride.id,
      p_rating: rating,
      p_comment: null,
    })
    setRatingBusy(false)
    if (error) {
      setRatingError(ht ? 'Nou pa rive voye evalyasyon an. Tanpri eseye ankò.' : 'Impossible d’envoyer votre évaluation. Veuillez réessayer.')
      return
    }
    setRatingDone(true)
  }

  return (
    <div className={`movi-passenger-flow-card ${isTerminal ? 'terminal' : ''} ${driverArrived ? 'arrived' : ''}`} aria-live="polite">
      <PassengerArrivalNotice rideId={ride.id} status={status} ht={ht} />
      <style>{`
        .movi-passenger-ride-active .searching-card{display:none!important}
        .movi-passenger-flow-card{margin:12px 0 4px;padding:14px;border-radius:20px;background:#f7fbf9;border:1px solid #dbeae4;box-shadow:0 10px 28px rgba(15,112,90,.08);font-family:Inter,system-ui,sans-serif}
        .movi-passenger-flow-card.arrived{background:#effaf5;border-color:#bfe4d4;box-shadow:0 12px 30px rgba(15,128,101,.13)}
        .movi-passenger-flow-card.terminal{background:#fff}
        .movi-passenger-flow-head{display:flex;align-items:flex-start;gap:11px}
        .movi-passenger-flow-icon{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:#e6f5ef;font-size:21px;flex:0 0 auto}.movi-passenger-flow-card.arrived .movi-passenger-flow-icon{background:#0f8065;color:#fff}
        .movi-passenger-flow-copy{min-width:0;flex:1}.movi-passenger-flow-copy strong{display:block;color:#10243a;font-size:15px;line-height:1.25;font-weight:900}.movi-passenger-flow-card.arrived .movi-passenger-flow-copy strong{font-size:17px;color:#0f6d58}.movi-passenger-flow-copy small{display:block;color:#6d7e77;font-size:11px;line-height:1.45;margin-top:4px}.movi-passenger-flow-card.arrived .movi-passenger-flow-copy small{color:#4f6f64;font-size:12px}
        .movi-passenger-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:13px 0 10px}.movi-passenger-step{height:5px;border-radius:999px;background:#dfe8e4}.movi-passenger-step.done{background:#0f8065}.movi-passenger-step.cancelled{background:#ef6a5b}
        .movi-passenger-step-labels{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:12px}.movi-passenger-step-labels span{text-align:center;font-size:9px;line-height:1.25;color:#75837d;font-weight:750}.movi-passenger-step-labels .current{color:#0f705a;font-weight:950}.movi-passenger-fare{display:flex;justify-content:space-between;gap:10px;margin-top:10px;padding:11px;border-radius:14px;background:#eaf7f2;color:#0f6d58;font-size:12px;font-weight:850}.movi-passenger-fare strong{color:#10243a}
        .movi-passenger-route{padding:10px 11px;border-radius:14px;background:#fff;border:1px solid #e4ece8;display:grid;gap:5px}.movi-passenger-route span{font-size:10px;color:#64756e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.movi-passenger-route b{color:#0f8065;margin-right:5px}
        .movi-passenger-rating{margin-top:12px;padding:13px;border-radius:16px;background:#f7fbf9;border:1px solid #dbeae4;text-align:center}.movi-passenger-rating strong{display:block;color:#10243a;font-size:14px;font-weight:900}.movi-passenger-rating small{display:block;margin-top:3px;color:#6d7e77;font-size:10px}.movi-passenger-stars{display:flex;justify-content:center;gap:7px;margin:10px 0}.movi-passenger-star{border:0;background:transparent;padding:2px;font-size:31px;line-height:1;color:#cbd6d1}.movi-passenger-star.selected{color:#f5b301;transform:scale(1.05)}.movi-passenger-rating-submit{width:100%;border:0;border-radius:13px;background:#0f8065;color:#fff;padding:11px 12px;font-size:12px;font-weight:900}.movi-passenger-rating-submit:disabled{opacity:.45}.movi-passenger-rating-error{display:block;margin-top:7px;color:#b84a43;font-size:10px;font-weight:700}.movi-passenger-rating-thanks{padding:12px;border-radius:14px;background:#eaf7f2;color:#0f6d58;font-size:12px;font-weight:900;text-align:center}
        .movi-passenger-terminal-button{width:100%;margin-top:11px;border:0;border-radius:14px;background:#0f8065;color:#fff;padding:12px 14px;font-size:13px;font-weight:900}
      `}</style>
      <div className="movi-passenger-flow-head">
        <span className="movi-passenger-flow-icon">{status === 'completed' ? '✅' : status === 'cancelled' ? '✕' : driverArrived ? '📍' : '🚕'}</span>
        <div className="movi-passenger-flow-copy"><strong>{title}</strong><small>{subtitle}</small></div>
      </div>
      <div className="movi-passenger-steps" aria-hidden="true">
        {[1,2,3,4].map(step => <span key={step} className={`movi-passenger-step ${status === 'cancelled' ? 'cancelled' : step <= stage ? 'done' : ''}`} />)}
      </div>
      <div className="movi-passenger-step-labels" aria-label={ht ? 'Etap trajè a' : 'Étapes du trajet'}>
        {(ht ? ['Aksepte', 'Rive', 'Sou wout', 'Fini'] : ['Accepté', 'Arrivé', 'En route', 'Terminé']).map((label, index) => <span key={label} className={stage === index + 1 && !isTerminal ? 'current' : ''}>{label}</span>)}
      </div>
      <div className="movi-passenger-route">
        <span><b>●</b>{ride.pickup_address}</span>
        <span><b>◆</b>{ride.destination_address}</span>
      </div>
      {status === 'completed' && <div className="movi-passenger-fare"><span>{ht ? 'Pri final trajè a' : 'Prix final du trajet'}</span><strong>{ride.final_fare_htg == null ? '—' : `${Number(ride.final_fare_htg).toLocaleString('fr-HT')} HTG`}</strong></div>}

      {status === 'completed' && <p><strong>{Number(ride.final_fare_htg ?? ride.estimated_fare_htg ?? 0).toLocaleString('fr-FR')} HTG</strong></p>}
      {status === 'completed' && !ratingDone && <div className="movi-passenger-rating">
        <strong>{ht ? 'Kijan chofè a te ye?' : 'Comment était votre chauffeur ?'}</strong>
        <small>{ht ? 'Chwazi ant 1 ak 5 zetwal.' : 'Choisissez une note de 1 à 5 étoiles.'}</small>
        <div className="movi-passenger-stars" role="radiogroup" aria-label={ht ? 'Evalyasyon chofè' : 'Évaluation du chauffeur'}>
          {[1,2,3,4,5].map(star => <button key={star} type="button" className={`movi-passenger-star ${star <= rating ? 'selected' : ''}`} onClick={() => setRating(star)} aria-label={`${star} ${ht ? 'zetwal' : 'étoiles'}`}>★</button>)}
        </div>
        <button type="button" className="movi-passenger-rating-submit" disabled={rating < 1 || ratingBusy} onClick={submitRating}>{ratingBusy ? (ht ? 'N ap voye…' : 'Envoi…') : (ht ? 'Voye evalyasyon an' : 'Envoyer l’évaluation')}</button>
        {ratingError && <span className="movi-passenger-rating-error">{ratingError}</span>}
      </div>}

      {status === 'completed' && ratingDone && <div className="movi-passenger-rating-thanks">{ht ? `Mèsi! Ou bay chofè a ${rating}/5 ⭐` : `Merci ! Vous avez donné ${rating}/5 ⭐ au chauffeur.`}</div>}

      {(status === 'cancelled' || (status === 'completed' && ratingDone)) && <button type="button" className="movi-passenger-terminal-button" onClick={onDismiss}>{ht ? 'Mande yon nouvo kous' : 'Commander une nouvelle course'}</button>}
    </div>
  )
}
