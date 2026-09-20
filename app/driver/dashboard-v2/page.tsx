'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DriverCleanUberBoltHome from '../../../components/DriverCleanUberBoltHome'

type RideStatus = 'requested' | 'accepted' | 'driver_arriving' | 'in_progress' | 'completed' | 'cancelled'
type Ride = { id:string; status:RideStatus; pickup_address:string; pickup_latitude:number; pickup_longitude:number; destination_address:string; destination_latitude:number; destination_longitude:number; estimated_distance_km:number|null; estimated_duration_min:number|null; estimated_fare_htg:number|null; service_type:string|null; driver_id:string|null; passenger_id:string }
type Vehicle = { id:string; make:string; model:string; plate_number:string; color:string|null }
type DashboardRow = { full_name:string|null; status:string|null; is_online:boolean|null; average_rating:number|string|null; total_rides:number|null; vehicle_id:string|null; vehicle_make:string|null; vehicle_model:string|null; vehicle_plate_number:string|null; vehicle_color:string|null }
type StoredSession = { access_token:string; user?:{ id?:string } }

function parseSession(raw:string|null):StoredSession|null { if (!raw) return null; try { const parsed=JSON.parse(raw); const session=parsed?.currentSession??parsed?.session??parsed; return session?.access_token?session:null } catch { return null } }
function readSession():StoredSession|null { if(typeof window==='undefined')return null; const direct=parseSession(localStorage.getItem('movi-session'))||parseSession(localStorage.getItem('taxi-auth-default')); if(direct)return direct; for(let i=0;i<localStorage.length;i+=1){const key=localStorage.key(i);if(!key)continue;const found=parseSession(localStorage.getItem(key));if(found?.access_token)return found} return null }
function destinationParts(value:string) { const raw=value.trim().replace(/\s+/g,' '); if(!raw)return{city:'',street:''}; const match=raw.match(/^les\s+gona[iï]ves\s*,\s*artibonite\s*,\s*ha[iï]ti\b\s*(.*)$/i); if(!match)return{city:raw,street:''}; let street=(match[1]||'').replace(/\s+gona[iï]ves\s*$/i,'').trim(); street=street.replace(/^(\d+)\s*,?\s*(.+)$/, '$1, $2').trim(); street=street.replace(/^(\d+,\s*)?rue\s+(.+)$/i, (_m, number='', name='') => `${number}rue ${name.charAt(0).toUpperCase()}${name.slice(1)}`); if(/^(\d+,\s*)?rue\s+paul\s+eug[eèé]ne\s+magloire$/i.test(street)){const number=street.match(/^(\d+,\s*)/)?.[1]??'';street=`${number}rue Paul Eugène Magloire`} return{city:'Les Gonaïves, Artibonite, Haïti',street} }
async function rpc<T=unknown>(name:string,body:Record<string,unknown>={}){const{data,error}=await supabase.rpc(name,body);if(error)throw error;return data as T}

export default function DriverDashboardV2Page(){
  const [authorized,setAuthorized]=useState(true),[busy,setBusy]=useState(false),[online,setOnline]=useState(false),[message,setMessage]=useState(''),[rating,setRating]=useState(0),[totalRides,setTotalRides]=useState(0)
  const [vehicle,setVehicle]=useState<Vehicle|null>(null),[activeRide,setActiveRide]=useState<Ride|null>(null),[available,setAvailable]=useState<Ride[]>([]),[offerRideId,setOfferRideId]=useState<string|null>(null),[offerSeconds,setOfferSeconds]=useState(20)
  const [lang,setLang]=useState<'fr'|'ht'>('fr')
  const userIdRef=useRef<string|null>(null),tokenRef=useRef<string|null>(null),timeoutLockRef=useRef<string|null>(null)

  useEffect(()=>{const session=readSession();if(!session?.access_token){setMessage('Session chauffeur introuvable. Déconnectez-vous puis reconnectez-vous.');return}tokenRef.current=session.access_token;userIdRef.current=session.user?.id??null;void refreshDashboard(false)},[])
  useEffect(()=>{const sync=()=>setLang(localStorage.getItem('taxi-language')==='ht'?'ht':'fr');sync();const timer=window.setInterval(sync,1000);return()=>window.clearInterval(timer)},[])
  useEffect(()=>{if(!online||!userIdRef.current)return;void loadRides(userIdRef.current,true);const timer=window.setInterval(()=>void loadRides(userIdRef.current,true),1000);return()=>window.clearInterval(timer)},[online])
seEffect(() => {
  if (!online || !navigator.geolocation) return

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, heading, speed } = position.coords

      void supabase.rpc('update_driver_live_location', {
        p_latitude: latitude,
        p_longitude: longitude,
        p_heading: heading ?? null,
        p_speed_kph: speed == null ? null : speed * 3.6,
      })
    },
    () => {},
    {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 15000,
    }
  )

  return () => navigator.geolocation.clearWatch(watchId)
}, [online])
  useEffect(()=>{if(!online||activeRide||available.length===0){setOfferRideId(null);setOfferSeconds(20);return}const first=available[0];if(offerRideId!==first.id){timeoutLockRef.current=null;setOfferRideId(first.id);setOfferSeconds(20)}},[online,activeRide,available,offerRideId])
  useEffect(()=>{if(!offerRideId||activeRide||!online)return;if(offerSeconds<=0){const ride=available.find(item=>item.id===offerRideId);if(!ride||timeoutLockRef.current===ride.id)return;timeoutLockRef.current=ride.id;void rideAction('timeout',ride);return}const timer=window.setTimeout(()=>setOfferSeconds(current=>Math.max(0,current-1)),1000);return()=>window.clearTimeout(timer)},[offerRideId,offerSeconds,activeRide,online,available])

  function token(){if(tokenRef.current)return tokenRef.current;const session=readSession();tokenRef.current=session?.access_token??null;if(session?.user?.id)userIdRef.current=session.user.id;return tokenRef.current}
  async function loadRides(userId=userIdRef.current,isOnline=online){if(!userId)return;try{const{data:mineRows}=await supabase.from('rides').select('*').eq('driver_id',userId).in('status',['accepted','driver_arriving','in_progress']).order('requested_at',{ascending:false}).limit(1);const mine=(mineRows?.[0] as Ride|undefined)??null;setActiveRide(mine);if(!isOnline||mine){setAvailable([]);return}const[{data:requests},{data:rejectedRows}]=await Promise.all([supabase.from('rides').select('*').eq('status','requested').is('driver_id',null).neq('passenger_id',userId).order('requested_at',{ascending:true}).limit(20),supabase.from('driver_ride_rejections').select('ride_id').eq('driver_id',userId)]);const rejected=new Set((rejectedRows??[]).map(row=>row.ride_id));setAvailable(((requests??[]) as Ride[]).filter(ride=>!rejected.has(ride.id)))}catch{}}
  async function refreshDashboard(showBusy=true){if(showBusy)setBusy(true);setMessage('');try{const access=token();if(!access)throw new Error('Session chauffeur introuvable.');const response=await fetch('/api/driver/dashboard',{headers:{Authorization:`Bearer ${access}`},cache:'no-store'});const payload=await response.json();if(!response.ok)throw new Error(payload?.error||`Erreur ${response.status}`);const raw=payload?.driver??payload?.data;const row:DashboardRow|undefined=Array.isArray(raw)?raw[0]:raw;if(!row||row.status!=='approved'){setAuthorized(false);throw new Error('Ce compte n’est pas un chauffeur approuvé.')}setAuthorized(true);setOnline(Boolean(row.is_online));setRating(Number(row.average_rating??0));setTotalRides(Number(row.total_rides??0));if(row.vehicle_id&&row.vehicle_make&&row.vehicle_model&&row.vehicle_plate_number)setVehicle({id:row.vehicle_id,make:row.vehicle_make,model:row.vehicle_model,plate_number:row.vehicle_plate_number,color:row.vehicle_color});else setVehicle(null);await loadRides(userIdRef.current,Boolean(row.is_online))}catch(e){setMessage(e instanceof Error?e.message:'Impossible de charger votre espace chauffeur.')}finally{if(showBusy)setBusy(false)}}
  async function toggleOnline(){if(busy)return;setBusy(true);setMessage('');const next=!online;try{await rpc('set_driver_online',{p_online:next});setOnline(next);setMessage(next?'Vous êtes maintenant en ligne.':'Vous êtes maintenant hors ligne.');await loadRides(userIdRef.current,next)}catch(e){setMessage(e instanceof Error?e.message:'Impossible de modifier votre disponibilité.')}finally{setBusy(false)}}
  async function rideAction(action:'accept'|'reject'|'timeout'|'arriving'|'start'|'complete',ride:Ride){if(busy&&action!=='timeout')return;if(action==='accept'&&!vehicle){setMessage('Aucun véhicule actif n’est associé à ce compte.');return}if(action!=='timeout')setBusy(true);setMessage('');try{if(action==='accept')await rpc('accept_ride',{p_ride_id:ride.id,p_vehicle_id:vehicle!.id});if(action==='reject')await rpc('reject_ride_request',{p_ride_id:ride.id,p_reason:'rejected'});if(action==='timeout')await rpc('reject_ride_request',{p_ride_id:ride.id,p_reason:'timeout'});if(action==='arriving')await rpc('mark_driver_arriving',{p_ride_id:ride.id});if(action==='start')await rpc('start_ride',{p_ride_id:ride.id});if(action==='complete')await rpc('complete_ride',{p_ride_id:ride.id,p_final_fare_htg:ride.estimated_fare_htg??0,p_payment_method:'cash'});if(action==='timeout')setMessage('Temps écoulé. La demande est proposée à un autre chauffeur.');await refreshDashboard(false)}catch(e){setMessage(e instanceof Error?e.message:'Impossible de mettre à jour le trajet.')}finally{if(action!=='timeout')setBusy(false)}}

  const nextAction=activeRide?.status==='accepted'?{key:'arriving' as const,label:lang==='ht'?'Mwen rive':'Je suis arrivé'}:activeRide?.status==='driver_arriving'?{key:'start' as const,label:lang==='ht'?'Kòmanse trajè a':'Commencer le trajet'}:activeRide?.status==='in_progress'?{key:'complete' as const,label:lang==='ht'?'Fini trajè a':'Terminer le trajet'}:null
  if(!authorized)return <main className="drv2-page"><div className="drv2-shell"><div className="drv2-access"><div className="drv2-logo">M</div><h1>Accès chauffeur</h1><p>{message||'Ce compte n’est pas un chauffeur approuvé.'}</p></div></div></main>

  const incomingRide=!activeRide&&online?(available[0]??null):null

  if(incomingRide){
    const destination=destinationParts(incomingRide.destination_address)
    return <main className="drv2-page drv2-ride-mode drv2-offer-mode">
      <header className="drv2-offer-top"><div className="drv2-offer-brand"><div className="drv2-logo">M</div><strong>MOVI</strong></div><button type="button" onClick={()=>rideAction('reject',incomingRide)} disabled={busy}>✕ Refuser</button></header>
      <DriverCleanUberBoltHome previewRide={incomingRide as any}/>
      <section className="drv2-offer-sheet">
        <div className="drv2-sheet-handle"/>
        <div className="drv2-offer-head"><span className="drv2-service-chip">{incomingRide.service_type??'Standard'}</span><span className={offerSeconds<=5?'drv2-countdown danger':'drv2-countdown'}>{offerSeconds}s</span></div>
        <div className="drv2-offer-main"><strong>{incomingRide.estimated_duration_min??'—'} min <span>({incomingRide.estimated_distance_km??'—'} km)</span></strong><em>{incomingRide.estimated_fare_htg??'—'} HTG</em></div>
        <div className="drv2-offer-route"><div><b>●</b><span><small>DÉPART</small><strong>{incomingRide.pickup_address}</strong></span></div><div><b>■</b><span><small>DESTINATION</small><strong>{destination.city}</strong>{destination.street&&<em>{destination.street}</em>}</span></div></div>
        {message&&<div className="drv2-message" role="status">{message}</div>}
        <div className="drv2-offer-actions"><button type="button" className="reject" onClick={()=>rideAction('reject',incomingRide)} disabled={busy}>Refuser</button><button type="button" className="accept" onClick={()=>rideAction('accept',incomingRide)} disabled={busy||!vehicle}>Accepter</button></div>
      </section>
    </main>
  }

  if(activeRide){
    const destination=destinationParts(activeRide.destination_address)
    const phase=activeRide.status==='accepted'?1:activeRide.status==='driver_arriving'?2:3
    const heading=phase===1?(lang==='ht'?'Ale pran pasaje a':'Allez chercher le passager'):phase===2?(lang==='ht'?'Ou rive nan pwen pickup la':'Vous êtes au point de prise en charge'):(lang==='ht'?'Ale nan destinasyon an':'En route vers la destination')
    const target=phase===3?activeRide.destination_address:activeRide.pickup_address
    const stages=lang==='ht'?['Aksepte','Rive','Sou wout','Fini']:['Accepté','Arrivé','En route','Terminé']
    return <main className="drv2-page drv2-ride-mode drv2-active-mode">
      <header className="drv2-offer-top"><div className="drv2-offer-brand"><div className="drv2-logo">M</div><strong>MOVI</strong></div><div className="drv2-rating"><strong>★ {rating.toFixed(2)}</strong><span>{totalRides} trajets</span></div></header>
      <DriverCleanUberBoltHome previewRide={activeRide as any}/>
      <section className="drv2-offer-sheet drv2-active-sheet">
        <div className="drv2-sheet-handle"/>
        <span className="drv2-section-label">{lang==='ht'?'TRAJÈ AKTIF':'TRAJET ACTIF'}</span>
        <h2>{heading}</h2>
        <p className="drv2-active-target"><span>{phase===3?'🏁':'📍'}</span>{phase===3?<><strong>{destination.city}</strong>{destination.street&&<small>{destination.street}</small>}</>:<strong>{target}</strong>}</p>
        <div className="drv2-active-stages" aria-label={lang==='ht'?'Etap trajè a':'Étapes du trajet'}>{stages.map((stage,index)=><span key={stage} className={index<phase?'done':''}>{index<phase?'✓':index+1}<small>{stage}</small></span>)}</div>
        <div className="drv2-active-meta"><span>{activeRide.estimated_distance_km??'—'} km</span><span>{activeRide.estimated_duration_min??'—'} min</span><span>{activeRide.estimated_fare_htg??'—'} HTG</span></div>
        {message&&<div className="drv2-message" role="status">{message}</div>}
        {nextAction&&<button className="drv2-active-next" disabled={busy} onClick={()=>rideAction(nextAction.key,activeRide)}>{nextAction.label}</button>}
      </section>
    </main>
  }

  return <main className="drv2-page"><div className="drv2-shell">
    <header className="drv2-topbar"><button className="menu drv2-menu" aria-label="Menu" onTouchStart={(event)=>{event.currentTarget.click()}}>☰</button><div className="drv2-brand"><div className="drv2-logo">M</div><div><strong>MOVI</strong><span>Espace chauffeur</span></div></div><div className="drv2-rating"><strong>★ {rating.toFixed(2)}</strong><span>{totalRides} trajets</span></div></header>
    <section className="drv2-status-card"><div className="drv2-status-copy"><strong>{online?'Prêt à conduire':'Vous êtes hors ligne'}</strong><span>{online?'Les nouvelles demandes peuvent apparaître maintenant.':'Activez-vous pour recevoir des courses.'}</span></div><button className={online?'drv2-switch on':'drv2-switch'} onClick={toggleOnline} disabled={busy} aria-label={online?'Passer hors ligne':'Passer en ligne'}><span/></button></section>
    {vehicle&&<section className="drv2-vehicle-strip"><span>🚙</span><div><small>VÉHICULE ACTIF</small><strong>{vehicle.make} {vehicle.model}</strong><em>{vehicle.plate_number}</em></div></section>}
    {message&&<div className="drv2-message">{message}</div>}
    <section className="drv2-requests"><div className="drv2-section-head"><div><span className="drv2-kicker">COURSES</span><h2>Demandes disponibles</h2></div><button className="drv2-refresh" onClick={()=>refreshDashboard(true)} disabled={busy}>{busy?'...':'Actualiser'}</button></div>
      {!online?<div className="drv2-empty"><span>🚘</span><strong>Passez en ligne</strong><p>Activez votre disponibilité pour recevoir les demandes proches de vous.</p></div>:<div className="drv2-empty"><span>🧭</span><strong>Aucune demande pour le moment</strong><p>Les nouvelles courses apparaîtront ici automatiquement.</p></div>}
    </section>
  </div></main>
}
