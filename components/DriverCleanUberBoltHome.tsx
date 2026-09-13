'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Map as MapboxMap } from 'mapbox-gl'

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
  const mapRef=useRef<MapboxMap|null>(null)
  const watchRef=useRef<number|null>(null)
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

  function updatePointLayers(driverPoint:[number,number],target:[number,number],phase:'pickup'|'destination'){
    const map=mapRef.current
    if(!map||!map.isStyleLoaded())return
    const data={
      type:'FeatureCollection' as const,
      features:[
        {type:'Feature' as const,properties:{role:'driver'},geometry:{type:'Point' as const,coordinates:driverPoint}},
        {type:'Feature' as const,properties:{role:'target',phase},geometry:{type:'Point' as const,coordinates:target}},
      ]
    }
    const source=map.getSource('driver-live-points') as GeoSource|undefined
    if(source?.setData)source.setData(data)
    else{
      map.addSource('driver-live-points',{type:'geojson',data})
      map.addLayer({id:'driver-live-target-halo',type:'circle',source:'driver-live-points',filter:['==',['get','role'],'target'],paint:{'circle-radius':16,'circle-color':'#ffffff','circle-opacity':.96}})
      map.addLayer({id:'driver-live-target',type:'circle',source:'driver-live-points',filter:['==',['get','role'],'target'],paint:{'circle-radius':10,'circle-color':['case',['==',['get','phase'],'destination'],'#ef4444','#16a34a'],'circle-stroke-width':3,'circle-stroke-color':'#ffffff'}})
      map.addLayer({id:'driver-live-driver-halo',type:'circle',source:'driver-live-points',filter:['==',['get','role'],'driver'],paint:{'circle-radius':20,'circle-color':'#ffffff','circle-opacity':.98,'circle-stroke-width':3,'circle-stroke-color':'#111827'}})
      map.addLayer({id:'driver-live-driver',type:'circle',source:'driver-live-points',filter:['==',['get','role'],'driver'],paint:{'circle-radius':11,'circle-color':'#2563eb','circle-stroke-width':2,'circle-stroke-color':'#ffffff'}})
    }
  }

  async function drawRoute(driverPoint:[number,number],ride:DriverMapRide,force=false){
    const map=mapRef.current,token=process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if(!map||!token)return
    if(!map.isStyleLoaded()){
      map.once('load',()=>void drawRoute(driverPoint,ride,true))
      return
    }
    const now=Date.now(),moved=lastRoutePointRef.current?metersBetween(lastRoutePointRef.current,driverPoint):Infinity
    if(!force&&moved<5&&now-lastRouteAtRef.current<2500)return
    lastRoutePointRef.current=driverPoint;lastRouteAtRef.current=now
    const phase:RouteInfo['phase']=ride.status==='in_progress'?'destination':'pickup'
    const end:[number,number]=phase==='pickup'?[Number(ride.pickup_longitude),Number(ride.pickup_latitude)]:[Number(ride.destination_longitude),Number(ride.destination_latitude)]
    if(!Number.isFinite(end[0])||!Number.isFinite(end[1]))return
    updatePointLayers(driverPoint,end,phase)
    try{
      const url=`https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${driverPoint[0]},${driverPoint[1]};${end[0]},${end[1]}?alternatives=false&geometries=geojson&overview=full&steps=true&language=fr&access_token=${encodeURIComponent(token)}`
      const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error('route')
      const route=(await response.json() as RouteResponse).routes?.[0];if(!route)return
      const geojson={type:'Feature' as const,properties:{},geometry:route.geometry}
      const source=map.getSource('driver-live-route') as GeoSource|undefined
      if(source?.setData)source.setData(geojson)
      else{
        map.addSource('driver-live-route',{type:'geojson',data:geojson})
        map.addLayer({id:'driver-live-route-line',type:'line',source:'driver-live-route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#111827','line-width':8,'line-opacity':.96}})
        ;['driver-live-target-halo','driver-live-target','driver-live-driver-halo','driver-live-driver'].forEach(id=>{if(map.getLayer(id))map.moveLayer(id)})
      }
      const instruction=route.legs?.[0]?.steps?.find(step=>step.maneuver?.instruction)?.maneuver?.instruction||''
      setRouteInfo({distanceKm:route.distance/1000,durationMin:Math.max(1,Math.round(route.duration/60)),instruction,phase})
      const directDistance=metersBetween(driverPoint,end)
      if(directDistance<80){
        const center:[number,number]=[(driverPoint[0]+end[0])/2,(driverPoint[1]+end[1])/2]
        map.easeTo({center,zoom:17,padding:{top:115,bottom:390,left:70,right:70},duration:450})
      }else{
        const coords=route.geometry.coordinates
        if(coords.length>1){
          const mod=await import('mapbox-gl')
          const bounds=coords.reduce((b,c)=>b.extend(c),new mod.default.LngLatBounds(coords[0],coords[0]))
          map.fitBounds(bounds,{padding:{top:120,bottom:400,left:58,right:58},duration:500,maxZoom:16.5})
        }
      }
      window.setTimeout(()=>{
        updatePointLayers(driverPoint,end,phase)
        ;['driver-live-target-halo','driver-live-target','driver-live-driver-halo','driver-live-driver'].forEach(id=>{if(map.getLayer(id))map.moveLayer(id)})
      },80)
    }catch{
      setRouteInfo({distanceKm:metersBetween(driverPoint,end)/1000,durationMin:1,instruction:'',phase})
      updatePointLayers(driverPoint,end,phase)
    }
  }

  async function applyPosition(pos:GeolocationPosition){
    const map=mapRef.current,ride=rideRef.current
    if(!map)return
    setGpsStatus('ok')
    const point:[number,number]=[pos.coords.longitude,pos.coords.latitude]
    lastPositionRef.current=point
    const user=(await supabase.auth.getUser()).data.user
    if(user)void supabase.from('driver_locations').upsert({driver_id:user.id,latitude:pos.coords.latitude,longitude:pos.coords.longitude,heading:Number.isFinite(pos.coords.heading)?pos.coords.heading:null,speed_kph:Number.isFinite(pos.coords.speed)?Math.max(0,(pos.coords.speed||0)*3.6):null,updated_at:new Date().toISOString()},{onConflict:'driver_id'})
    if(ride)void drawRoute(point,ride,true)
    else{
      setRouteInfo(null)
      if(map.getLayer('driver-live-driver'))map.removeLayer('driver-live-driver')
      if(map.getLayer('driver-live-driver-halo'))map.removeLayer('driver-live-driver-halo')
      if(map.getLayer('driver-live-target'))map.removeLayer('driver-live-target')
      if(map.getLayer('driver-live-target-halo'))map.removeLayer('driver-live-target-halo')
      if(map.getSource('driver-live-points'))map.removeSource('driver-live-points')
      if(map.getLayer('driver-live-route-line'))map.removeLayer('driver-live-route-line')
      if(map.getSource('driver-live-route'))map.removeSource('driver-live-route')
      map.easeTo({center:point,zoom:14,duration:500})
    }
  }

  useEffect(()=>{
    if(!mapEl.current||mapRef.current)return
    const token=process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if(!token){setMapFailed(true);return}
    let cancelled=false
    ;(async()=>{
      try{
        const mod=await import('mapbox-gl');if(cancelled||!mapEl.current)return
        mod.default.accessToken=token
        const map=new mod.default.Map({container:mapEl.current,style:'mapbox://styles/mapbox/streets-v12',center:[-72.6843,19.4475],zoom:13,attributionControl:false})
        map.addControl(new mod.default.NavigationControl({showCompass:false}),'bottom-right');mapRef.current=map
        map.on('load',()=>{
          map.resize()
          const point=lastPositionRef.current,ride=rideRef.current
          if(point&&ride)void drawRoute(point,ride,true)
        })
        if(navigator.geolocation){
          watchRef.current=navigator.geolocation.watchPosition(pos=>void applyPosition(pos),()=>setGpsStatus('error'),{enableHighAccuracy:true,maximumAge:500,timeout:15000})
        }else setGpsStatus('error')
      }catch{if(!cancelled)setMapFailed(true)}
    })()
    return()=>{cancelled=true;if(watchRef.current!==null&&navigator.geolocation)navigator.geolocation.clearWatch(watchRef.current);mapRef.current?.remove();mapRef.current=null}
  },[])

  useEffect(()=>{
    if(!effectiveRide||!navigator.geolocation)return
    setGpsStatus('waiting')
    const refresh=()=>navigator.geolocation.getCurrentPosition(pos=>void applyPosition(pos),()=>setGpsStatus('error'),{enableHighAccuracy:true,maximumAge:0,timeout:12000})
    const map=mapRef.current
    if(map)window.setTimeout(()=>map.resize(),60)
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