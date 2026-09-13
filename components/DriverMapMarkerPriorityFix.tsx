'use client'

import { useEffect } from 'react'

export default function DriverMapMarkerPriorityFix(){
  useEffect(()=>{
    let frame=0
    const fix=()=>{
      cancelAnimationFrame(frame)
      frame=requestAnimationFrame(()=>{
        document.querySelectorAll<HTMLElement>('.mapboxgl-marker.dcu-stop.pickup,.mapboxgl-marker.dcu-stop.destination,.mapboxgl-marker.dcu-marker').forEach(el=>{
          const transform=el.style.transform
          if(transform&&el.style.getPropertyPriority('transform')!=='important'){
            el.style.setProperty('transform',transform,'important')
          }
          el.style.setProperty('visibility','visible','important')
          el.style.setProperty('opacity','1','important')
          if(el.classList.contains('dcu-marker')) el.style.setProperty('z-index','52','important')
          else if(el.classList.contains('pickup')) el.style.setProperty('z-index','51','important')
          else el.style.setProperty('z-index','50','important')
        })
      })
    }
    fix()
    const observer=new MutationObserver(fix)
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class']})
    const timer=window.setInterval(fix,500)
    return()=>{observer.disconnect();window.clearInterval(timer);cancelAnimationFrame(frame)}
  },[])
  return null
}
