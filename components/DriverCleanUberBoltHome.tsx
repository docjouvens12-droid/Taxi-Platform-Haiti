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
type RouteResponse={routes?:Array<{distance:number;duration:number;geometry:{coordinates:[number,number][];type:'LineString'};legs?:Array<{steps?:Array<{maneuver?:{instruction?:string}}>}>}>}

type GeoSource={setData?:(data:unknown)=>void}

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
  const lastRoutePointRef=useRef<[number,number]|null>(null)
  const lastRouteAtRef=useRef(0)
  const lastPositionRef=useRef<[number,number]|null>(null)
  const rideRef=useRef<DriverMapRide|null>(null)
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
      label: {
        text: '🚕',
        fontSize: '24px',
      },
    })
  } else {
    driverMarkerRef.current.setPosition(driverPosition)
    driverMarkerRef.current.setMap(map)
  }

  if (!targetMarkerRef.current) {
    targetMarkerRef.current = new google.maps.Marker({
      map,
      position: targetPosition,
      title: phase === 'pickup' ? 'Passager' : 'Destination',
    })
  } else {
    targetMarkerRef.current.setPosition(targetPosition)
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
  fields:['path','distanceMeters','durationMillis'],
})

const route=routes?.[0]
    if(!route)throw new Error('route')


     const path=route.path??[]
if(!routeOutlineRef.current){
  routeOutlineRef.current=new google.maps.Polyline({
    map,
    path,
    strokeColor:'#FFFFFF',
    strokeOpacity:1,
    strokeWeight:11,
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
strokeWeight:6,
      })
    }else{
      routeRef.current.setPath(path)
      routeRef.current.setMap(map)
    }

    setRouteInfo({
    distanceKm:route.distanceMeters!=null?route.distanceMeters/1000:metersBetween(driverPoint,end)/1000,
durationMin:route.durationMillis!=null?Math.max(1,Math.round(route.durationMillis/60000)):1,
  
      instruction:'',
      phase,
    })

    const bounds=new google.maps.LatLngBounds()
    bounds.extend({lat:driverPoint[1],lng:driverPoint[0]})
    bounds.extend({lat:end[1],lng:end[0]})
    path.forEach((point:any)=>bounds.extend(point))

    map.fitBounds(bounds,80)
  }catch{
    setRouteInfo({
      distanceKm:metersBetween(driverPoint,end)/1000,
      durationMin:1,
      instruction:'',
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
  -72.3200,
  18.5500,
] 

  lastPositionRef.current=point

  const user=(await supabase.auth.getUser()).data.user

  if(user){
    void supabase.from('driver_locations').upsert({
      driver_id:user.id,
      latitude:pos.coords.latitude,
      longitude:pos.coords.longitude,
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
        center:{lat:18.5392,lng:-72.3364},
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

    mapRef.current=null
  }
},[])   
  useEffect(()=>{
    if(!effectiveRide||!navigator.geolocation)return
    setGpsStatus('waiting')
    const refresh=()=>navigator.geolocation.getCurrentPosition(pos=>void applyPosition(pos),()=>setGpsStatus('error'),{enableHighAccuracy:true,maximumAge:0,timeout:12000})
  
    
    refresh()
    const timer=window.setInterval(refresh,2500)
    return()=>window.clearInterval(timer)
  },[effectiveRide?.id,effectiveRide?.status])

  const ht=typeof window!=='undefined'&&localStorage.getItem('taxi-language')==='ht'
  return <>
    <style>{`
      .dcu-home{margin:16px 0 10px}.dcu-map-shell{height:310px;border-radius:26px;overflow:hidden;position:relative;background:#eaf1ef;border:1px solid #dce7e3;box-shadow:0 10px 28px rgba(16,32,51,.08)}.dcu-map{width:100%;height:100%}.dcu-map-label{position:absolute;left:14px;top:14px;z-index:5;background:rgba(255,255,255,.96);border-radius:999px;padding:9px 13px;font-size:12px;font-weight:900;color:#102033;box-shadow:0 4px 14px rgba(0,0,0,.08)}.dcu-map-fallback{height:100%;display:grid;place-items:center;text-align:center;padding:20px;color:#617281;font-weight:800}.dcu-route-card{position:absolute;left:12px;right:12px;bottom:12px;z-index:45;background:rgba(255,255,255,.97);border:1px solid #dfe9e5;border-radius:18px;padding:10px 13px;box-shadow:0 8px 22px rgba(16,32,51,.14)}.dcu-route-top{display:flex;justify-content:space-between;align-items:center;gap:8px}.dcu-route-top strong{font-size:12px;color:#102033}.dcu-route-top span{font-size:12px;font-weight:950;color:#0f705a}.dcu-route-card p{display:none}.dcu-gps-error{color:#b54747!important}.dcu-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:11px}.dcu-stat{background:#fff;border:1px solid #e0e8e5;border-radius:18px;padding:13px 9px;min-width:0;box-shadow:0 5px 16px rgba(16,32,51,.04)}.dcu-stat small,.dcu-stat strong{display:block}.dcu-stat small{font-size:9px;color:#7d8b98;font-weight:800}.dcu-stat strong{margin-top:6px;font-size:14px;color:#102033}@media(max-width:560px){.dcu-map-shell{height:315px}.dcu-stat{padding:12px 8px}.dcu-stat strong{font-size:13px}}
    `}</style>
    <section className="dcu-home">
      <div className="dcu-map-shell">
        {!effectiveRide&&<div className={`dcu-map-label ${gpsStatus==='error'?'dcu-gps-error':''}`}>{gpsStatus==='error'?(ht?'GPS pa disponib':'GPS indisponible'):(ht?'Pozisyon ou':'Votre position')}</div>}
        {mapFailed?<div className="dcu-map-fallback">{ht?'Kat GPS la pa disponib pou kounye a.':'La carte GPS est indisponible pour le moment.'}</div>:<div ref={mapEl} className="dcu-map"/>}
        {routeInfo&&<div className="dcu-route-card"><div className="dcu-route-top"><strong>{routeInfo.phase==='pickup'?(ht?'Distans ak pasaje a':'Distance du passager'):(ht?'Rete pou destinasyon':'Reste à destination')}</strong><span>{formatDistanceKm(routeInfo.distanceKm)} km · {routeInfo.durationMin} min</span></div></div>}
      </div>
      <div className="dcu-stats"><div className="dcu-stat"><small>{ht?'Revni jodi a':'Revenus aujourd’hui'}</small><strong>💰 {Math.round(todayEarnings).toLocaleString('fr-HT')} HTG</strong></div><div className="dcu-stat"><small>{ht?'Trajè jodi a':'Trajets aujourd’hui'}</small><strong>🚕 {todayTrips}</strong></div><div className="dcu-stat"><small>{ht?'Evalyasyon':'Évaluation'}</small><strong>★ {rating.toFixed(1)}</strong></div></div>
    </section>
  </>
}
