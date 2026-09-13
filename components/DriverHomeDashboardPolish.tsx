'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl'

type Lang = 'fr' | 'ht'

export default function DriverHomeDashboardPolish(){
  const [target,setTarget]=useState<HTMLElement|null>(null)
  const [lang,setLang]=useState<Lang>('fr')
  const [todayTrips,setTodayTrips]=useState(0)
  const [todayEarnings,setTodayEarnings]=useState(0)
  const [rating,setRating]=useState(0)
  const [mapFailed,setMapFailed]=useState(false)
  const mapEl=useRef<HTMLDivElement|null>(null)
  const mapRef=useRef<MapboxMap|null>(null)
  const markerRef=useRef<MapboxMarker|null>(null)
  const watchRef=useRef<number|null>(null)

  useEffect(()=>{
    if(window.location.pathname!=='/driver/dashboard') return
    setLang(localStorage.getItem('taxi-language')==='ht'?'ht':'fr')

    const install=()=>{
      const card=document.querySelector<HTMLElement>('.card')
      const topbar=card?.querySelector<HTMLElement>('.topbar')
      if(!card||!topbar){setTarget(null);return}
      let mount=card.querySelector<HTMLElement>('.driver-home-polish-root')
      if(!mount){
        mount=document.createElement('div')
        mount.className='driver-home-polish-root'
        topbar.insertAdjacentElement('afterend',mount)
      }
      setTarget(mount)
    }
    install()
    const observer=new MutationObserver(install)
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])

  useEffect(()=>{if(target) void loadStats()},[target])

  async function loadStats(){
    const {data:auth}=await supabase.auth.getUser()
    const user=auth.user
    if(!user)return
    const {data:driver}=await supabase.from('driver_profiles').select('average_rating').eq('user_id',user.id).maybeSingle()
    setRating(Number(driver?.average_rating||0))

    const start=new Date(); start.setHours(0,0,0,0)
    const {data:rides}=await supabase.from('rides').select('id,final_fare_htg').eq('driver_id',user.id).eq('status','completed').gte('completed_at',start.toISOString())
    const rows=rides||[]
    setTodayTrips(rows.length)
    if(!rows.length){setTodayEarnings(0);return}
    const {data:payments}=await supabase.from('payments').select('ride_id,driver_net_htg').in('ride_id',rows.map(r=>r.id))
    const netByRide=new Map((payments||[]).map(p=>[p.ride_id,Number(p.driver_net_htg||0)]))
    setTodayEarnings(rows.reduce((sum,r)=>sum+(netByRide.get(r.id)??Number(r.final_fare_htg||0)*0.85),0))
  }

  useEffect(()=>{
    if(!target||!mapEl.current||mapRef.current)return
    const token=process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if(!token){setMapFailed(true);return}
    let cancelled=false
    ;(async()=>{
      try{
        const mod=await import('mapbox-gl')
        if(cancelled||!mapEl.current)return
        mod.default.accessToken=token
        const map=new mod.default.Map({container:mapEl.current,style:'mapbox://styles/mapbox/streets-v12',center:[-72.3364,18.5392],zoom:12,attributionControl:false})
        map.addControl(new mod.default.NavigationControl({showCompass:false}),'bottom-right')
        mapRef.current=map
        if(navigator.geolocation){
          watchRef.current=navigator.geolocation.watchPosition(pos=>{
            const point:[number,number]=[pos.coords.longitude,pos.coords.latitude]
            if(!markerRef.current){
              const el=document.createElement('div');el.className='driver-home-marker';el.textContent='🚕'
              markerRef.current=new mod.default.Marker({element:el}).setLngLat(point).addTo(map)
            }else markerRef.current.setLngLat(point)
            map.easeTo({center:point,zoom:14,duration:700})
          },()=>{}, {enableHighAccuracy:true,maximumAge:10000,timeout:15000})
        }
      }catch{if(!cancelled)setMapFailed(true)}
    })()
    return()=>{
      cancelled=true
      if(watchRef.current!==null&&navigator.geolocation)navigator.geolocation.clearWatch(watchRef.current)
      markerRef.current?.remove();mapRef.current?.remove();mapRef.current=null
    }
  },[target])

  if(!target)return null
  const ht=lang==='ht'
  return createPortal(<>
    <style>{`
      :root{--tph-green:#0F705A;--tph-green-soft:#58AD98;--tph-navy:#102033;--tph-bg:#F6F8FA;--tph-amber:#F4B000;--tph-red:#C94B4B}
      body:has(.driver-home-polish-root){background:var(--tph-bg)!important;color:var(--tph-navy)!important}
      body:has(.driver-home-polish-root) .page{background:var(--tph-bg)!important;color:var(--tph-navy)!important}
      body:has(.driver-home-polish-root) .brand>span{background:var(--tph-green)!important}
      body:has(.driver-home-polish-root) .menuButton{color:var(--tph-navy)!important;background:#fff!important}
      body:has(.driver-home-polish-root) .online-card{background:#fff!important;border:1px solid #E2E9E6!important}
      body:has(.driver-home-polish-root) .dot.on{background:var(--tph-green-soft)!important}
      body:has(.driver-home-polish-root) .switch.on{background:var(--tph-green-soft)!important}
      body:has(.driver-home-polish-root) .primary{background:var(--tph-green)!important;color:#fff!important}
      body:has(.driver-home-polish-root) .primary:active{background:#0B5B49!important}
      body:has(.driver-home-polish-root) .ride-head span{color:var(--tph-green)!important}
      body:has(.driver-home-polish-root) .ride-card.active{border-color:var(--tph-green)!important}
      body:has(.driver-home-polish-root) .message{background:#EAF5F1!important;color:var(--tph-green)!important}
      body:has(.driver-home-polish-root) .message.error{background:#FFF0F0!important;color:var(--tph-red)!important}
      body:has(.driver-home-polish-root) .logout{color:var(--tph-red)!important;background:#FFF2F2!important}
      body:has(.driver-home-polish-root) .section-title button{width:46px!important;height:46px!important;padding:0!important;border-radius:15px!important;background:#fff!important;color:var(--tph-green)!important;border:1px solid #DDE7E3!important;box-shadow:0 6px 18px rgba(16,32,51,.08)!important;font-size:0!important;display:grid!important;place-items:center!important}
      body:has(.driver-home-polish-root) .section-title button::before{content:'🔍';font-size:19px}
      .driver-home-polish{margin:14px 0 16px}.driver-home-map-shell{height:310px;border-radius:24px;overflow:hidden;position:relative;background:#EAF1EF;border:1px solid #DCE7E3;box-shadow:0 10px 28px rgba(16,32,51,.08)}.driver-home-map{width:100%;height:100%}.driver-home-map-label{position:absolute;left:14px;top:14px;z-index:3;background:rgba(255,255,255,.95);backdrop-filter:blur(8px);border-radius:999px;padding:9px 13px;font-size:12px;font-weight:900;color:var(--tph-navy);box-shadow:0 4px 14px rgba(0,0,0,.08);border:1px solid rgba(15,112,90,.12)}.driver-home-map-fallback{height:100%;display:grid;place-items:center;text-align:center;padding:20px;color:#617281;font-weight:800}.driver-home-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.driver-home-stat{background:#fff;border:1px solid #E0E8E5;border-radius:18px;padding:13px 10px;min-width:0;box-shadow:0 5px 16px rgba(16,32,51,.04)}.driver-home-stat small,.driver-home-stat strong{display:block}.driver-home-stat small{font-size:10px;color:#7D8B98;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.driver-home-stat strong{margin-top:6px;font-size:16px;color:var(--tph-navy)}.driver-home-stat span{font-size:15px;margin-right:4px}.driver-home-stat:last-child strong span{color:var(--tph-amber)}.driver-home-marker{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:#fff;border:3px solid var(--tph-green);box-shadow:0 5px 14px rgba(0,0,0,.2);font-size:21px}.driver-rating-card{display:none!important}.online-card{border:0!important;box-shadow:0 8px 24px rgba(16,32,51,.08)!important;border-radius:22px!important;padding:17px 18px!important}.section-title{margin-top:20px!important}.ride-card{box-shadow:0 7px 22px rgba(16,32,51,.055)!important;border-radius:20px!important;background:#fff!important}.primary{min-height:48px!important;border-radius:15px!important}@media(max-width:560px){.driver-home-map-shell{height:285px}.driver-home-stats{gap:8px}.driver-home-stat{padding:12px 8px}.driver-home-stat strong{font-size:14px}}
    `}</style>
    <div className="driver-home-polish">
      <div className="driver-home-map-shell">
        <div className="driver-home-map-label">{ht?'📍 Pozisyon ou':'📍 Votre position'}</div>
        {mapFailed?<div className="driver-home-map-fallback">{ht?'Kat GPS la pa disponib pou kounye a.':'La carte GPS est indisponible pour le moment.'}</div>:<div ref={mapEl} className="driver-home-map"/>}
      </div>
      <div className="driver-home-stats">
        <div className="driver-home-stat"><small>{ht?'Revni jodi a':'Revenus aujourd’hui'}</small><strong><span>💰</span>{Math.round(todayEarnings).toLocaleString('fr-HT')} HTG</strong></div>
        <div className="driver-home-stat"><small>{ht?'Trajè jodi a':'Trajets aujourd’hui'}</small><strong><span>🚕</span>{todayTrips}</strong></div>
        <div className="driver-home-stat"><small>{ht?'Evalyasyon':'Évaluation'}</small><strong><span>★</span>{rating.toFixed(1)}</strong></div>
      </div>
    </div>
  </>,target)
}
