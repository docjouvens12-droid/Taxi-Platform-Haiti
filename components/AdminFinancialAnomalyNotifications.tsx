'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Anomaly = {
  anomaly_key: string
  severity: string
  payment_id: string | null
  payout_id: string | null
  details: string
}

export default function AdminFinancialAnomalyNotifications() {
  const [isAdminRoute, setIsAdminRoute] = useState(false)
  const [anomaly, setAnomaly] = useState<Anomaly | null>(null)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const onAdminRoute = window.location.pathname.startsWith('/admin')
    setIsAdminRoute(onAdminRoute)
    if (!onAdminRoute) return

    let active = true
    let paymentChannel: ReturnType<typeof supabase.channel> | null = null
    let caseChannel: ReturnType<typeof supabase.channel> | null = null

    const refresh = async (showPopup = false) => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user || !active) return
      const { data: me } = await supabase.from('profiles').select('role').eq('id', auth.user.id).maybeSingle()
      if (me?.role !== 'admin' || !active) return

      const [{ data: rows }, { count: openCount }] = await Promise.all([
        supabase.rpc('get_admin_financial_reconciliation'),
        supabase.from('financial_anomaly_cases').select('id', { count: 'exact', head: true }).neq('status', 'resolved'),
      ])
      if (!active) return
      setCount(openCount ?? 0)

      if (showPopup) {
        const urgent = ((rows ?? []) as Anomaly[]).find(r => r.severity === 'critical' || r.severity === 'high')
        if (urgent) {
          const fingerprint = `${urgent.anomaly_key}:${urgent.payment_id ?? ''}:${urgent.payout_id ?? ''}`
          const last = sessionStorage.getItem('taxi-financial-alert-seen')
          if (last !== fingerprint) {
            sessionStorage.setItem('taxi-financial-alert-seen', fingerprint)
            setAnomaly(urgent)
          }
        }
      }
    }

    void refresh(false)

    paymentChannel = supabase.channel('admin-financial-alerts-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => void refresh(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_payouts' }, () => void refresh(true))
      .subscribe()

    caseChannel = supabase.channel('admin-financial-alerts-cases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_anomaly_cases' }, () => void refresh(false))
      .subscribe()

    return () => {
      active = false
      if (paymentChannel) void supabase.removeChannel(paymentChannel)
      if (caseChannel) void supabase.removeChannel(caseChannel)
    }
  }, [])

  if (!isAdminRoute) return null

  return <>
    {count > 0 && <button
      type="button"
      onClick={() => { window.location.href = '/admin/reconciliation' }}
      style={{ position:'fixed', right:14, bottom:14, zIndex:2147483000, border:0, borderRadius:999, background:'#a32626', color:'#fff', padding:'10px 13px', fontWeight:900, boxShadow:'0 10px 30px rgba(0,0,0,.2)' }}
      aria-label="Anomali finansye"
    >⚠ {count}</button>}

    {anomaly && <div style={{ position:'fixed', inset:'auto 12px 74px 12px', zIndex:2147483001, maxWidth:460, marginLeft:'auto', background: anomaly.severity === 'critical' ? '#8f1f1f' : '#a65300', color:'#fff', borderRadius:18, padding:14, boxShadow:'0 18px 45px rgba(0,0,0,.28)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', gap:10 }}>
        <div><small style={{ fontWeight:950 }}>{anomaly.severity.toUpperCase()}</small><strong style={{ display:'block', marginTop:3 }}>Anomali finansye</strong></div>
        <button onClick={() => setAnomaly(null)} style={{ border:0, background:'transparent', color:'#fff', fontSize:20 }}>×</button>
      </div>
      <p style={{ margin:'8px 0 12px', fontSize:12, lineHeight:1.4 }}>{anomaly.details}</p>
      <button onClick={() => { window.location.href = '/admin/reconciliation' }} style={{ border:0, borderRadius:11, background:'#fff', color:'#722', padding:'9px 11px', fontWeight:950 }}>Ouvri dosye</button>
    </div>}
  </>
}
