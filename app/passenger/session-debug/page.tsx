'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function PassengerSessionDebugPage() {
  const [text, setText] = useState('N ap verifye sesyon an...')

  useEffect(() => {
    async function run() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        const keys = Object.keys(window.localStorage).filter((key) => key.startsWith('sb-'))
        const lines = [
          `session: ${session ? 'YES' : 'NO'}`,
          `user: ${session?.user?.email ?? 'none'}`,
          `error: ${error?.message ?? 'none'}`,
          `storage keys: ${keys.length}`,
          ...keys.map((key) => `${key}: ${window.localStorage.getItem(key) ? 'present' : 'empty'}`),
        ]
        setText(lines.join('\n'))
      } catch (error: any) {
        setText(`exception: ${error?.message ?? String(error)}`)
      }
    }
    void run()
  }, [])

  return (
    <main style={{position:'fixed',inset:0,zIndex:2147483647,background:'#fff',padding:'24px',fontFamily:'system-ui,sans-serif',overflow:'auto'}}>
      <h1 style={{fontSize:24}}>Passenger session debug</h1>
      <pre style={{whiteSpace:'pre-wrap',fontSize:16,lineHeight:1.5,background:'#f4f6f8',padding:16,borderRadius:12}}>{text}</pre>
      <button onClick={() => window.location.href = '/passenger/dashboard'} style={{marginTop:16,minHeight:50,padding:'0 16px',fontSize:16,fontWeight:700}}>Ale sou dashboard</button>
    </main>
  )
}
