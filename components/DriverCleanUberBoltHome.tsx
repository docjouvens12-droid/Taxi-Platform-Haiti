'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { loadGoogleMaps } from '../lib/google-maps'

export type DriverMapRide={
  id:string
  status:'requested'|'accepted'|'driver_arriving'|'in_progress'
  pickup_address:string
  pickup_latitude:number
  pickup_longitude:number
  destination_address:string
  destination_latitude:number
  destination_longitude:number
}

type RouteInfo={distanceKm:number;durationMin:number;instruction:string;phase:'pickup'|'destination'}




function metersBetween(a:[number,number],b:[number,number]){
  const R=6371000,rad=(v:number)=>v*Math.PI/180
  const dLat=rad(b[1]-a[1]),dLon=rad(b[0]-a[0])
  const x=Math.sin(dLat/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(dLon/2)**2
  return 2*R*Math.asin(Math.sqrt(x))
}

function formatDistanceKm(value:number){
  if(value<1)return value.toFixed(2)
  return value.toFixed(1)
}
function translateInstructionToHt(text:string){
  return text
    .replace(/Tournez à gauche/gi,'Vire agoch')
    .replace(/Tournez à droite/gi,'Vire adwat')
    .replace(/Continuez tout droit/gi,'Kontinye dwat')
    .replace(/Continuez/gi,'Kontinye')
    .replace(/Prenez la sortie/gi,'Pran sòti a')
    .replace(/Au rond-point/gi,'Nan wonpwen an')
    .replace(/Faites demi-tour/gi,'Fè demi-tou')
    .replace(/Vous êtes arrivé/gi,'Ou rive')
}
export default function DriverCleanUberBoltHome({previewRide=null}:{previewRide?:DriverMapRide|null}){
  const [todayTrips,setTodayTrips]=useState(0)
  const [todayEarnings,setTodayEarnings]=useState(0)
  const [rating,setRating]=useState(0)
  const [mapFailed,setMapFailed]=useState(false)
  const [activeRide,setActiveRide]=useState<DriverMapRide|null>(null)
  const [routeInfo,setRouteInfo]=useState<RouteInfo|null>(null)
  const [gpsStatus,setGpsStatus]=useState<'waiting'|'ok'|'error'>('waiting')
  const mapEl=useRef<HTMLDivElement|null>(null)
 const mapRef=useRef<any>(null) 
  const watchRef=useRef<number|null>(null)
  const driverMarkerRef=useRef<any>(null)
const targetMarkerRef=useRef<any>(null)
const routeRef=useRef<any>(null)
  const routeOutlineRef=useRef<any>(null)
  const stopMarkersRef=useRef<any[]>([])
const trafficLightMarkersRef=useRef<any[]>([])
  const lastRoutePointRef=useRef<[number,number]|null>(null)
   const lastTrafficSignsAtRef=useRef(0)                                                   
  const lastRouteAtRef=useRef(0)
  const lastPositionRef=useRef<[number,number]|null>(null)
  const rideRef=useRef<DriverMapRide|null>(null)
  const lastSpokenInstructionRef=useRef('')
 function clearTrafficMarkers(){
  stopMarkersRef.current.forEach(marker => marker.setMap(null))
  trafficLightMarkersRef.current.forEach(marker => marker.setMap(null))

  stopMarkersRef.current = []
  trafficLightMarkersRef.current = []
} 
async function loadTrafficSigns(path:any[]){
  const map=mapRef.current
  const google=(window as any).google
  if(!map || !google?.maps || path.length===0)return 
const now = Date.now()

if (now - lastTrafficSignsAtRef.current < 30000) return

lastTrafficSignsAtRef.current = now
  
 

  const lats=path.map((p:any)=>typeof p.lat==='function'?p.lat():p.lat)
  const lngs=path.map((p:any)=>typeof p.lng==='function'?p.lng():p.lng)

  const south=Math.min(...lats)
  const north=Math.max(...lats)
  const west=Math.min(...lngs)
  const east=Math.max(...lngs)

  const query=`[out:json][timeout:10];
  (
    node["highway"="stop"](${south},${west},${north},${east});
    node["highway"="traffic_signals"](${south},${west},${north},${east});
  );
  out body;`

  const response=await fetch(
    'https://overpass-api.de/api/interpreter?data='+encodeURIComponent(query)
  )

  if(!response.ok)return

  const data=await response.json()

  clearTrafficMarkers()
  for (const element of data.elements || []) {
  if (typeof element.lat !== 'number' || typeof element.lon !== 'number') continue

  const isStop = element.tags?.highway === 'stop'
  const isTrafficLight = element.tags?.highway === 'traffic_signals'

  if (!isStop && !isTrafficLight) continue

  const marker = new google.maps.Marker({
    map,
    position: { lat: element.lat, lng: element.lon },
    label: {
      text: isStop ? '🛑' : '🚦',
      fontSize: '20px',
    },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 0,
    },
    title: isStop ? 'STOP' : 'Feu de circulation',
  })

  if (isStop) {
    stopMarkersRef.current.push(marker)
  } else {
    trafficLightMarkersRef.current.push(marker)
  }
}
}  
  const effectiveRide=activeRide??previewRide

  useEffect(()=>{rideRef.current=effectiveRide},[effectiveRide])

  useEffect(()=>{
    let cancelled=false
    const load=async()=>{
      const {data:auth}=await supabase.auth.getUser();const user=auth.user
      if(!user||cancelled)return
      const start=new Date();start.setHours(0,0,0,0)
      const [{data:driver},{data:rides},{data:mineRows}]=await Promise.all([
        supabase.from('driver_profiles').select('average_rating').eq('user_id',user.id).maybeSingle(),
        supabase.from('rides').select('id,final_fare_htg').eq('driver_id',user.id).eq('status','completed').gte('completed_at',start.toISOString()),
        supabase.from('rides').select('id,status,pickup_address,pickup_latitude,pickup_longitude,destination_address,destination_latitude,destination_longitude').eq('driver_id',user.id).in('status',['accepted','driver_arriving','in_progress']).order('requested_at',{ascending:false}).limit(1)
      ])
      if(cancelled)return
      setRating(Number(driver?.average_rating||0))
      const rows=rides||[];setTodayTrips(rows.length)
      if(rows.length){
        const {data:payments}=await supabase.from('payments').select('ride_id,driver_net_htg').in('ride_id',rows.map(r=>r.id))
        const netByRide=new Map((payments||[]).map(p=>[p.ride_id,Number(p.driver_net_htg||0)]))
        setTodayEarnings(rows.reduce((sum,r)=>sum+(netByRide.get(r.id)??Number(r.final_fare_htg||0)*.85),0))
      }else setTodayEarnings(0)
      setActiveRide((mineRows?.[0]||null) as DriverMapRide|null)
    }
    void load();const timer=window.setInterval(()=>void load(),5000)
    return()=>{cancelled=true;window.clearInterval(timer)}
  },[])

 function updatePointLayers(
  driverPoint: [number, number],
  target: [number, number],
  phase: 'pickup' | 'destination'
) {
  const map = mapRef.current
  const google = (window as any).google

  if (!map || !google?.maps) return

  const driverPosition = {
    lat: driverPoint[1],
    lng: driverPoint[0],
  }

  const targetPosition = {
    lat: target[1],
    lng: target[0],
  }

  if (!driverMarkerRef.current) {
  driverMarkerRef.current = new google.maps.Marker({
    map,
    position: driverPosition,
    title: 'Chauffeur',
    icon: {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 7,
      fillColor: '#2563EB',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      rotation: 0,
      
    },
  })
} else {
  driverMarkerRef.current.setMap(map)
}

if (!targetMarkerRef.current) {
  targetMarkerRef.current = new google.maps.Marker({
    map,
    position: targetPosition,
    title: phase === 'pickup' ? 'Passager' : 'Destination',
  })
} else {
  targetMarkerRef.current.setMap(map)
}
 }  
 async function drawRoute(driverPoint:[number,number],ride:DriverMapRide,force=false){
  const map=mapRef.current
  if(!map)return

  const now=Date.now()
  const moved=lastRoutePointRef.current
    ? metersBetween(lastRoutePointRef.current,driverPoint)
    : Infinity

  if(!force&&moved<5&&now-lastRouteAtRef.current<2500)return

  lastRoutePointRef.current=driverPoint
  lastRouteAtRef.current=now

  
if(ride.status==='driver_arriving'){
  return
}

const phase:RouteInfo['phase']=ride.status==='in_progress'?'destination':'pickup'
  const end:[number,number]=phase==='pickup'
    ? [Number(ride.pickup_longitude),Number(ride.pickup_latitude)]
    : [Number(ride.destination_longitude),Number(ride.destination_latitude)]

  if(!Number.isFinite(end[0])||!Number.isFinite(end[1]))return

  updatePointLayers(driverPoint,end,phase)

  try{
    const google=await loadGoogleMaps()
   const { Route } = await google.maps.importLibrary('routes') as any

const { routes } = await Route.computeRoutes({
  origin:{lat:driverPoint[1],lng:driverPoint[0]},
  destination:{lat:end[1],lng:end[0]},
  travelMode:'DRIVING',
  fields:['path','distanceMeters','durationMillis','legs'],
})

const route=routes?.[0]
    const nextStep=route?.legs?.[0]?.steps?.[0]
    if(!route)throw new Error('route')


     const path=route.path??[]
    const snappedStart = path[0]
const snappedEnd = path[path.length - 1]

if (snappedStart) {
  driverMarkerRef.current?.setPosition(snappedStart)
  if (path.length > 1 && driverMarkerRef.current) {
  const heading = google.maps.geometry.spherical.computeHeading(path[0], path[1])
  const icon = driverMarkerRef.current.getIcon() as any
  driverMarkerRef.current.setIcon({
    ...icon,
    rotation: heading,
  })
}
}

if (snappedEnd) {
  targetMarkerRef.current?.setPosition(snappedEnd)
}
if(!routeOutlineRef.current){
  routeOutlineRef.current=new google.maps.Polyline({
    map,
    path,
    strokeColor:'#FFFFFF',
    strokeOpacity:1,
    strokeWeight:12,
  })
}else{
  routeOutlineRef.current.setPath(path)
  routeOutlineRef.current.setMap(map)
}
    if(!routeRef.current){
      routeRef.current=new google.maps.Polyline({
        map,
        path,
      strokeColor:'#4285F4',
strokeOpacity:1,
strokeWeight:7,
      })
    }else{
      routeRef.current.setPath(path)
      routeRef.current.setMap(map)
    }
    loadTrafficSigns(path).catch(() => {})
const instruction = nextStep?.instructions || ''

if (
  instruction &&
  instruction !== lastSpokenInstructionRef.current &&
  typeof window !== 'undefined' &&
  'speechSynthesis' in window
) {
  lastSpokenInstructionRef.current = instruction

  const cleanInstruction = instruction.replace(/<[^>]+>/g, '')
const spokenInstruction = ht
  ? translateInstructionToHt(cleanInstruction)
  : cleanInstruction

const utterance = new SpeechSynthesisUtterance(spokenInstruction)

  utterance.lang = ht ? 'ht-HT' : 'fr-FR'
  utterance.rate = 1
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
    setRouteInfo({
    distanceKm:route.distanceMeters!=null?route.distanceMeters/1000:metersBetween(driverPoint,end)/1000,
durationMin:route.durationMillis!=null?Math.max(1,Math.round(route.durationMillis/60000)):1,
  
      instruction,
      phase,
    })

    const bounds=new google.maps.LatLngBounds()
    bounds.extend({lat:driverPoint[1],lng:driverPoint[0]})
    bounds.extend({lat:end[1],lng:end[0]})
    path.forEach((point:any)=>bounds.extend(point))

    map.fitBounds(bounds,80)
  }catch{
   setRouteInfo({
  distanceKm: metersBetween(driverPoint,end) / 1000,
durationMin: 1,
  instruction:``,
  phase,
}) 
  }
}
  async function applyPosition(pos:GeolocationPosition){
  const map=mapRef.current
  const ride=rideRef.current

  if(!map)return

  setGpsStatus('ok')

const point:[number,number]=[
  pos.coords.longitude,
  pos.coords.latitude,
] 

  lastPositionRef.current=point

  const user=(await supabase.auth.getUser()).data.user

  if(user){
    void supabase.from('driver_locations').upsert({
  driver_id: user.id,   
    latitude: point[1],  
longitude: point[0],
    
      heading:Number.isFinite(pos.coords.heading)?pos.coords.heading:null,
      speed_kph:Number.isFinite(pos.coords.speed)
        ? Math.max(0,(pos.coords.speed||0)*3.6)
        : null,
      updated_at:new Date().toISOString(),
    },{
      onConflict:'driver_id'
    })
  }

  if(ride){
    void drawRoute(point,ride,true)
  }else{
    setRouteInfo(null)

    driverMarkerRef.current?.setPosition?.({
      lat:point[1],
      lng:point[0],
    })
    driverMarkerRef.current?.setMap?.(map)

    targetMarkerRef.current?.setMap?.(null)
    routeRef.current?.setMap?.(null)

    map.setCenter({
      lat:point[1],
      lng:point[0],
    })
    map.setZoom(14)
  }
}

  useEffect(()=>{
  if(!mapEl.current||mapRef.current)return

  let cancelled=false

  ;(async()=>{
    try{
      const google=await loadGoogleMaps()
      if(cancelled||!mapEl.current)return

      const map=new google.maps.Map(mapEl.current,{
       center:lastPositionRef.current
  ? {lat:lastPositionRef.current[1],lng:lastPositionRef.current[0]}
  : {lat:18.5392,lng:-72.3364}, 
        zoom:13,
        mapTypeControl:false,
        streetViewControl:false,
        fullscreenControl:false,
        clickableIcons:false,
      })

      mapRef.current=map
      setMapFailed(false)

const point=lastPositionRef.current
const ride=rideRef.current

if(point){
  driverMarkerRef.current=new google.maps.Marker({
    map,
    position:{lat:point[1],lng:point[0]},
    title:'Chauffeur',
    label:{
      text:'🚕',
      fontSize:'24px',
    },
  })

  if(ride)void drawRoute(point,ride,true)
}
 if(navigator.geolocation){
  watchRef.current=navigator.geolocation.watchPosition(
    pos=>void applyPosition(pos),
    ()=>setGpsStatus('error'),
    {
      enableHighAccuracy:true,
      maximumAge:500,
      timeout:15000,
    }
  )
}else{
  setGpsStatus('error')
}   
   }catch{
      if(!cancelled)setMapFailed(true)
    }
  })()
return()=>{
    cancelled=true

    if(watchRef.current!==null&&navigator.geolocation){
      navigator.geolocation.clearWatch(watchRef.current)
    }

    driverMarkerRef.current?.setMap?.(null)
    targetMarkerRef.current?.setMap?.(null)
    routeRef.current?.setMap?.(null)
    routeOutlineRef.current?.setMap?.(null)

    driverMarkerRef.current=null
    targetMarkerRef.current=null
    routeRef.current=null
    routeOutlineRef.current=null
    mapRef.current=null
  }
},[])
  
 useEffect(()=>{
  if(!effectiveRide||!navigator.geolocation)return

  routeRef.current?.setMap?.(null)
  routeOutlineRef.current?.setMap?.(null)
  targetMarkerRef.current?.setMap?.(null)
  routeRef.current=null
  routeOutlineRef.current=null
  targetMarkerRef.current=null
  lastRouteAtRef.current=0
  lastRoutePointRef.current=null
  setRouteInfo(null)

  setGpsStatus('waiting')

  const refresh=()=>navigator.geolocation.getCurrentPosition(
    pos=>void applyPosition(pos),
    ()=>setGpsStatus('error'),
    {enableHighAccuracy:true,maximumAge:0,timeout:12000}
  )

  refresh()
  const timer=window.setInterval(refresh,2500)
  return()=>window.clearInterval(timer)
},[effectiveRide?.id,effectiveRide?.status])
  const ht=typeof window!=='undefined'&&localStorage.getItem('taxi-language')==='ht'
  return <>
    
      <style>{`
  .dcu-home{margin:16px 0 10px}
  .dcu-map-shell{height:310px;border-radius:26px;overflow:hidden;position:relative;background:#eaf1ef;border:1px solid #dce7e3;box-shadow:0 10px 28px rgba(16,32,51,.08)}
  .dcu-map{width:100%;height:100%}
  .dcu-route-card p{display:block;margin:6px 0 0;font-size:13px;font-weight:850;color:#102033}
`}</style>
  
    <section className="dcu-home">
      <div className="dcu-map-shell">
        {!effectiveRide&&<div className={`dcu-map-label ${gpsStatus==='error'?'dcu-gps-error':''}`}>{gpsStatus==='error'?(ht?'GPS pa disponib':'GPS indisponible'):(ht?'Pozisyon ou':'Votre position')}</div>}
        {mapFailed?<div className="dcu-map-fallback">{ht?'Kat GPS la pa disponib pou kounye a.':'La carte GPS est indisponible pour le moment.'}</div>:<div ref={mapEl} className="dcu-map"/>}
        {routeInfo&&<div className="dcu-route-card"><div className="dcu-route-top"><strong>{routeInfo.phase==='pickup'?(ht?'Distans ak pasaje a':'Distance du passager'):(ht?'Rete pou destinasyon':'Reste à destination')}</strong><span>{formatDistanceKm(routeInfo.distanceKm)} km · {routeInfo.durationMin} min</span></div>{routeInfo.instruction&&<p>{routeInfo.instruction}</p>}</div>}
      </div>
      <div className="dcu-stats"><div className="dcu-stat"><small>{ht?'Revni jodi a':'Revenus aujourd’hui'}</small><strong>💰 {Math.round(todayEarnings).toLocaleString('fr-HT')} HTG</strong></div><div className="dcu-stat"><small>{ht?'Trajè jodi a':'Trajets aujourd’hui'}</small><strong>🚕 {todayTrips}</strong></div><div className="dcu-stat"><small>{ht?'Evalyasyon':'Évaluation'}</small><strong>★ {rating.toFixed(1)}</strong></div></div>
    </section>
  </>
}
