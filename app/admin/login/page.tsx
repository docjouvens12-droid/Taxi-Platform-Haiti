'use client'

import { useEffect } from 'react'

export default function AdminLoginPage() {
  useEffect(() => {
    window.location.replace('/')
  }, [])

  return <main style={{minHeight:'100dvh',display:'grid',placeItems:'center',fontFamily:'Inter,system-ui,sans-serif',color:'#0f705a',background:'#eef3f1',fontWeight:800}}>
    Redirection vers Taxi Platform Haiti…
  </main>
}
