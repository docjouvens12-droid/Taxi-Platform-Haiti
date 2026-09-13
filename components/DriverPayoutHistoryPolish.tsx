'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

type PayoutRow = {
  id: string
  amount_htg: number | string
  status: 'pending' | 'processing' | 'paid' | 'failed'
  provider: string | null
  payout_reference: string | null
  created_at: string
  paid_at: string | null
}

export default function DriverPayoutHistoryPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/driver/dashboard') return

    let disposed = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    const money = (value: number | string | null | undefined) => `${Number(value ?? 0).toLocaleString('fr-HT', { maximumFractionDigits: 2 })} HTG`

    const setup = async () => {
      const drawer = document.querySelector<HTMLElement>('.drawer')
      if (!drawer || disposed) return

      const duplicates = Array.from(drawer.querySelectorAll<HTMLElement>('[data-driver-payout-history="true"]'))
      if (duplicates.length) {
        duplicates.slice(1).forEach(el => el.remove())
        return
      }

      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user || disposed) return
      const driverId = auth.user.id
      const lang = localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'

      const section = document.createElement('div')
      section.className = 'menuSection driver-payout-history-section'
      section.dataset.driverPayoutHistory = 'true'
      section.innerHTML = `
        <h3 role="button" tabindex="0" aria-expanded="false" style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:4px 0;margin:0;user-select:none;color:#0f6f59">
          <span>${lang === 'ht' ? 'Payout mwen' : 'Mes versements'}</span>
          <span data-payout-arrow style="margin-left:auto;font-size:22px;line-height:1;transition:transform .18s ease">›</span>
        </h3>
        <div data-payout-content style="display:none;padding-top:10px">
          <div data-payout-summary style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px"></div>
          <div data-payout-list style="display:grid;gap:8px"></div>
          <div data-payout-empty style="display:none;font-size:12px;color:#748190;padding:8px 0">${lang === 'ht' ? 'Pa gen payout pou kounye a.' : 'Aucun versement pour le moment.'}</div>
        </div>
      `

      const content = section.querySelector<HTMLElement>('[data-payout-content]')!
      const arrow = section.querySelector<HTMLElement>('[data-payout-arrow]')!
      const title = section.querySelector<HTMLElement>('h3')!

      const setOpen = (open: boolean) => {
        content.style.display = open ? 'block' : 'none'
        arrow.style.transform = open ? 'rotate(90deg)' : 'rotate(0deg)'
        title.setAttribute('aria-expanded', String(open))
        if (open) void refresh(driverId, section, lang, money)
      }
      const toggle = () => setOpen(content.style.display === 'none')
      title.addEventListener('click', toggle)
      title.addEventListener('keydown', (event) => {
        const e = event as KeyboardEvent
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() }
      })

      const paymentSection = drawer.querySelector('[data-driver-payment-menu="true"]')
      if (paymentSection?.parentElement === drawer) drawer.insertBefore(section, paymentSection.nextSibling)
      else {
        const logout = drawer.querySelector('.drawerLogout')
        if (logout) drawer.insertBefore(section, logout)
        else drawer.appendChild(section)
      }

      await refresh(driverId, section, lang, money)

      channel = supabase.channel(`driver-payout-history-${driverId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_payouts', filter: `driver_id=eq.${driverId}` }, () => {
          if (section.isConnected) void refresh(driverId, section, lang, money)
        })
        .subscribe()
    }

    void setup()
    const observer = new MutationObserver(() => void setup())
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      disposed = true
      observer.disconnect()
      if (channel) void supabase.removeChannel(channel)
    }
  }, [])

  return null
}

async function refresh(driverId: string, section: HTMLElement, lang: 'ht' | 'fr', money: (v: number | string | null | undefined) => string) {
  const { data, error } = await supabase
    .from('driver_payouts')
    .select('id,amount_htg,status,provider,payout_reference,created_at,paid_at')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!section.isConnected) return

  const summary = section.querySelector<HTMLElement>('[data-payout-summary]')
  const list = section.querySelector<HTMLElement>('[data-payout-list]')
  const empty = section.querySelector<HTMLElement>('[data-payout-empty]')
  if (!summary || !list || !empty) return

  if (error) {
    summary.innerHTML = ''
    list.innerHTML = `<div style="font-size:12px;color:#a12e2e">${lang === 'ht' ? 'Nou pa ka chaje payout yo.' : 'Impossible de charger les versements.'}</div>`
    empty.style.display = 'none'
    return
  }

  const rows = (data ?? []) as PayoutRow[]
  const waiting = rows.filter(r => r.status === 'pending' || r.status === 'processing').reduce((sum, r) => sum + Number(r.amount_htg ?? 0), 0)
  const paid = rows.filter(r => r.status === 'paid').reduce((sum, r) => sum + Number(r.amount_htg ?? 0), 0)

  summary.innerHTML = `
    <div style="background:#fff6df;border-radius:12px;padding:9px"><small style="display:block;font-size:9px;font-weight:900;color:#7b6500;text-transform:uppercase">${lang === 'ht' ? 'K ap tann' : 'À recevoir'}</small><strong style="display:block;margin-top:3px;font-size:13px">${money(waiting)}</strong></div>
    <div style="background:#eaf7f2;border-radius:12px;padding:9px"><small style="display:block;font-size:9px;font-weight:900;color:#3c6f60;text-transform:uppercase">${lang === 'ht' ? 'Deja peye' : 'Déjà payé'}</small><strong style="display:block;margin-top:3px;font-size:13px">${money(paid)}</strong></div>
  `

  if (!rows.length) {
    list.innerHTML = ''
    empty.style.display = 'block'
    return
  }

  empty.style.display = 'none'
  list.innerHTML = rows.map(row => {
    const status = row.status === 'pending'
      ? (lang === 'ht' ? 'Pou peye' : 'À payer')
      : row.status === 'processing'
        ? (lang === 'ht' ? 'Ap trete' : 'En traitement')
        : row.status === 'paid'
          ? (lang === 'ht' ? 'Peye' : 'Payé')
          : (lang === 'ht' ? 'Echwe' : 'Échoué')
    const bg = row.status === 'paid' ? '#eaf7f2' : row.status === 'failed' ? '#fff0f0' : row.status === 'processing' ? '#eaf2ff' : '#fff7e8'
    const provider = row.provider ? escapeHtml(row.provider) : '—'
    const reference = row.payout_reference ? escapeHtml(row.payout_reference) : '—'
    const when = new Intl.DateTimeFormat(lang === 'ht' ? 'fr-HT' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(row.paid_at || row.created_at))
    return `<div style="border:1px solid #e0e7ed;border-radius:13px;padding:10px;background:#fff"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong style="font-size:13px">${money(row.amount_htg)}</strong><span style="font-size:10px;font-weight:900;padding:5px 7px;border-radius:999px;background:${bg}">${status}</span></div><div style="margin-top:6px;font-size:10px;color:#6d7b89">${provider} · ${reference}</div><div style="margin-top:3px;font-size:10px;color:#8a96a1">${when}</div></div>`
  }).join('')
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] ?? char))
}
