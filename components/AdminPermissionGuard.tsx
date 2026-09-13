'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

type PermissionRow = {
  is_admin: boolean
  is_super_admin: boolean
  can_manage_admins: boolean
  can_manage_drivers: boolean
  can_view_payments: boolean
  can_manage_payouts: boolean
  can_reconcile: boolean
  can_manage_safety: boolean
  can_view_system: boolean
}

function allowed(pathname: string, p: PermissionRow) {
  if (pathname === '/admin/set-password') return true
  if (p.is_super_admin) return true
  if (pathname === '/admin' || pathname === '/admin/login') return true
  if (pathname.startsWith('/admin/admins')) return p.can_manage_admins
  if (pathname.startsWith('/admin/drivers')) return p.can_manage_drivers
  if (pathname.startsWith('/admin/payments')) return p.can_view_payments
  if (pathname.startsWith('/admin/payouts')) return p.can_manage_payouts
  if (pathname.startsWith('/admin/reconciliation')) return p.can_reconcile
  if (pathname.startsWith('/admin/safety')) return p.can_manage_safety
  if (pathname.startsWith('/admin/system-check')) return p.can_view_system
  return false
}

function ensurePlatformPaymentLink() {
  if (window.location.pathname !== '/admin' || document.querySelector('[data-platform-payment-accounts="true"]')) return
  const grid = document.querySelector<HTMLElement>('.navGrid')
  if (!grid) return
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'navCard'
  button.dataset.platformPaymentAccounts = 'true'
  button.innerHTML = '<span class="icon">📲</span><div><strong>Kont MonCash / NatCash</strong><small>Kont platfòm pou resevwa peman kliyan yo</small></div><span class="arrow">›</span>'
  button.addEventListener('click', () => window.location.assign('/admin/payment-accounts'))
  grid.appendChild(button)
}

export default function AdminPermissionGuard() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname.startsWith('/admin') || pathname === '/admin/login') return
    let cancelled = false
    let observer: MutationObserver | null = null

    async function check() {
      const { data: auth } = await supabase.auth.getUser()
      if (cancelled || !auth.user) return

      const { data: mustChange, error: passwordCheckError } = await supabase.rpc('admin_requires_password_change')
      if (cancelled || passwordCheckError) return
      if (mustChange && pathname !== '/admin/set-password') {
        window.location.replace('/admin/set-password')
        return
      }
      if (!mustChange && pathname === '/admin/set-password') {
        window.location.replace('/admin')
        return
      }

      const { data, error } = await supabase.rpc('get_my_admin_permissions')
      if (cancelled || error) return
      const row = (Array.isArray(data) ? data[0] : data) as PermissionRow | undefined
      if (!row?.is_admin) return
      if (!allowed(pathname, row)) {
        window.location.replace('/admin?restricted=1')
        return
      }

      if (pathname === '/admin' && row.is_super_admin) {
        ensurePlatformPaymentLink()
        observer = new MutationObserver(ensurePlatformPaymentLink)
        observer.observe(document.body, { childList: true, subtree: true })
      }
    }

    void check()
    return () => {
      cancelled = true
      observer?.disconnect()
      document.querySelector('[data-platform-payment-accounts="true"]')?.remove()
    }
  }, [pathname])

  return null
}
