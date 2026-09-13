'use client'

import { useEffect } from 'react'

export default function DriverLoginPage() {
  useEffect(() => {
    window.location.replace('/')
  }, [])

  return (
    <main style={{minHeight:'100vh',display:'grid',placeItems:'center',fontFamily:'Inter,system-ui,sans-serif',color:'#102033',background:'#f7faf9'}}>
      <p>Redirection vers la page de connexion…</p>
    </main>
  )
}
