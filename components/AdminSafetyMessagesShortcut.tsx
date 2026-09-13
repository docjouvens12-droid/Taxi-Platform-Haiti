'use client'

import { usePathname } from 'next/navigation'

export default function AdminSafetyMessagesShortcut(){
  const pathname=usePathname()
  if(!pathname.startsWith('/admin/safety')||pathname.startsWith('/admin/safety/messages')) return null
  return <a href="/admin/safety/messages" style={{position:'fixed',right:14,bottom:'calc(18px + env(safe-area-inset-bottom))',zIndex:10020,background:'#b42318',color:'#fff',textDecoration:'none',borderRadius:999,padding:'11px 14px',fontSize:12,fontWeight:900,boxShadow:'0 12px 28px rgba(180,35,24,.25)'}}>💬 Mesaj sekirite</a>
}