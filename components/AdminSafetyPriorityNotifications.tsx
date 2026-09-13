'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

type Alert = {
  id: string
  ride_id: string
  event_type: string
  severity: string
  created_at: string
}

export default function AdminSafetyPriorityNotifications() {
  const pathname = usePathname()
  const [enabled, setEnabled] = useState(false)
  const [alert, setAlert] = useState<Alert | null>(null)
  const [lang, setLang] = useState<'fr' | 'ht'>('fr')

  useEffect(() => {
    if (!pathname.startsWith('/admin')) return
    const saved = localStorage.getItem('taxi-language')
    if (saved === 'ht') setLang('ht')

    let active = true
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active || !data.user) return
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
      if (active && profile?.role === 'admin') setEnabled(true)
    })
    return () => { active = false }
  }, [pathname])

  useEffect(() => {
    if (!enabled) return
    const channel = supabase
      .channel('admin-priority-safety-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ride_safety_events' }, (payload) => {
        const row = payload.new as Alert
        if (row.severity === 'critical' || row.severity === 'high') {
          setAlert(row)
        }
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [enabled])

  if (!enabled || !alert) return null

  const typeLabel = alert.event_type === 'stalled'
    ? (lang === 'ht' ? 'Machin kanpe lontan' : 'Arrêt prolongé')
    : alert.event_type === 'route_deviation'
      ? (lang === 'ht' ? 'Devyasyon wout' : 'Écart d’itinéraire')
      : (lang === 'ht' ? 'Alèt sekirite' : 'Alerte de sécurité')

  return (
    <div style={{ position: 'fixed', left: 12, right: 12, top: 'calc(12px + env(safe-area-inset-top))', zIndex: 12000, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div role="alert" style={{ width: 'min(520px, 100%)', background: '#fff5f5', border: '2px solid #dc2626', borderRadius: 18, boxShadow: '0 18px 50px rgba(127,29,29,.24)', padding: 14, pointerEvents: 'auto' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 12, background: '#dc2626', color: 'white', display: 'grid', placeItems: 'center', fontSize: 20 }}>!</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ display: 'block', color: '#991b1b', fontSize: 15 }}>{lang === 'ht' ? 'Alèt sekirite priyoritè' : 'Alerte de sécurité prioritaire'}</strong>
            <div style={{ marginTop: 3, color: '#7f1d1d', fontWeight: 800 }}>{typeLabel} · {alert.severity.toUpperCase()}</div>
            <div style={{ marginTop: 4, color: '#5f1d1d', fontSize: 12 }}>{lang === 'ht' ? 'Yon nouvo alèt grav antre. Verifye trajè a san pèdi tan.' : 'Une nouvelle alerte grave vient d’être reçue. Vérifiez le trajet rapidement.'}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => { location.href = '/admin/safety' }} style={{ border: 0, borderRadius: 10, background: '#dc2626', color: 'white', padding: '9px 12px', fontWeight: 850, cursor: 'pointer' }}>{lang === 'ht' ? 'Ouvri alèt yo' : 'Ouvrir les alertes'}</button>
              <button type="button" onClick={() => setAlert(null)} style={{ border: '1px solid #fecaca', borderRadius: 10, background: 'white', color: '#991b1b', padding: '9px 12px', fontWeight: 800, cursor: 'pointer' }}>{lang === 'ht' ? 'Fèmen' : 'Fermer'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
