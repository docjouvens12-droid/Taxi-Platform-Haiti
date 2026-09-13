'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

type RideRow = { id: string; completed_at: string | null }
type PaymentRow = {
  ride_id: string
  amount_htg: number | string
  platform_fee_htg: number | string | null
  driver_net_htg: number | string | null
  status: string
}

export default function DriverEarningsMenuPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/driver/dashboard') return

    const cleanups: Array<() => void> = []
    let applying = false
    let driverId = ''

    const formatHtg = (value: number | null | undefined) => {
      if (value == null || Number.isNaN(value)) return '—'
      return `${new Intl.NumberFormat('fr-HT', { maximumFractionDigits: 0 }).format(value)} HTG`
    }

    const removeDuplicateSections = (drawer: HTMLElement) => {
      const sections = Array.from(drawer.querySelectorAll<HTMLElement>('[data-driver-earnings="true"]'))
      sections.slice(1).forEach((section) => section.remove())
      return sections[0] ?? null
    }

    const getEarnings = async (userId: string) => {
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

      const { data: ridesData } = await supabase
        .from('rides')
        .select('id,completed_at')
        .eq('driver_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

      const rides = (ridesData ?? []) as RideRow[]
      const rideIds = rides.map((r) => r.id)
      const { data: paymentsData } = rideIds.length
        ? await supabase
          .from('payments')
          .select('ride_id,amount_htg,platform_fee_htg,driver_net_htg,status')
          .in('ride_id', rideIds)
        : { data: [] as PaymentRow[] }

      const payments = (paymentsData ?? []) as PaymentRow[]
      const paymentByRide = new Map(payments.map((p) => [p.ride_id, p]))
      const latestRide = rides[0]
      const latestPayment = latestRide ? paymentByRide.get(latestRide.id) : undefined

      const sumNet = (rows: RideRow[]) => rows.reduce((sum, ride) => {
        const payment = paymentByRide.get(ride.id)
        return sum + Number(payment?.driver_net_htg ?? 0)
      }, 0)

      const todayRides = rides.filter((r) => r.completed_at && new Date(r.completed_at).getTime() >= startOfToday)
      const weeklyRides = rides.filter((r) => r.completed_at && new Date(r.completed_at).getTime() >= sevenDaysAgo)

      return {
        latestGross: latestPayment ? Number(latestPayment.amount_htg ?? 0) : null,
        latestFee: latestPayment ? Number(latestPayment.platform_fee_htg ?? 0) : null,
        latestNet: latestPayment ? Number(latestPayment.driver_net_htg ?? 0) : null,
        latestStatus: latestPayment?.status ?? null,
        rideCount: rides.length,
        todayRideCount: todayRides.length,
        todayNet: sumNet(todayRides),
        weeklyNet: sumNet(weeklyRides),
      }
    }

    const refreshVisibleEarnings = async () => {
      if (!driverId) return
      const drawer = document.querySelector('.drawer') as HTMLElement | null
      if (!drawer) return
      const section = removeDuplicateSections(drawer)
      if (!section) return

      const values = await getEarnings(driverId)
      if (!section.isConnected) return

      const set = (key: string, value: string) => {
        const el = section.querySelector<HTMLElement>(`[data-earning-value="${key}"]`)
        if (el) el.textContent = value
      }
      set('gross', formatHtg(values.latestGross))
      set('fee', formatHtg(values.latestFee))
      set('net', formatHtg(values.latestNet))
      set('status', values.latestStatus ? values.latestStatus.toUpperCase() : '—')
      set('count', String(values.rideCount))
      set('today-count', String(values.todayRideCount))
      set('today-net', formatHtg(values.todayNet))
      set('weekly-net', formatHtg(values.weeklyNet))
    }

    const apply = async () => {
      const drawer = document.querySelector('.drawer') as HTMLElement | null
      if (!drawer) return

      const existing = removeDuplicateSections(drawer)
      if (existing) {
        void refreshVisibleEarnings()
        return
      }
      if (applying) return
      applying = true

      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const user = sessionData.session?.user
        if (!user || !drawer.isConnected) return
        driverId = user.id
        if (removeDuplicateSections(drawer)) return

        const lang = localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr'
        const values = await getEarnings(user.id)
        if (!drawer.isConnected || removeDuplicateSections(drawer)) return

        const section = document.createElement('div')
        section.className = 'menuSection'
        section.dataset.driverEarnings = 'true'

        const title = document.createElement('h3')
        title.textContent = lang === 'ht' ? 'Revni' : 'Revenus'
        Object.assign(title.style, {
          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
          padding: '4px 0', marginBottom: '0', userSelect: 'none'
        })
        title.setAttribute('role', 'button')
        title.setAttribute('tabindex', '0')
        title.setAttribute('aria-expanded', 'false')

        const toggleMark = document.createElement('span')
        toggleMark.textContent = '+'
        toggleMark.setAttribute('aria-hidden', 'true')
        Object.assign(toggleMark.style, { marginLeft: 'auto', fontSize: '24px', fontWeight: '700', lineHeight: '1' })
        title.appendChild(toggleMark)

        const makeRow = (label: string, value: string, key: string) => {
          const row = document.createElement('p')
          const left = document.createElement('span')
          const right = document.createElement('b')
          left.textContent = `${label}: `
          right.textContent = value
          right.dataset.earningValue = key
          row.append(left, right)
          return row
        }

        const rows = [
          makeRow(lang === 'ht' ? 'Brut dènye trajè' : 'Brut du dernier trajet', formatHtg(values.latestGross), 'gross'),
          makeRow(lang === 'ht' ? 'Komisyon platfòm (15%)' : 'Commission plateforme (15 %)', formatHtg(values.latestFee), 'fee'),
          makeRow(lang === 'ht' ? 'Net chofè dènye trajè' : 'Net chauffeur du dernier trajet', formatHtg(values.latestNet), 'net'),
          makeRow(lang === 'ht' ? 'Estati peman' : 'Statut du paiement', values.latestStatus ? values.latestStatus.toUpperCase() : '—', 'status'),
          makeRow(lang === 'ht' ? 'Kantite trajè total' : 'Nombre total de trajets', String(values.rideCount), 'count'),
          makeRow(lang === 'ht' ? 'Trajè jodi a' : 'Trajets aujourd’hui', String(values.todayRideCount), 'today-count'),
          makeRow(lang === 'ht' ? 'Net jodi a' : 'Net aujourd’hui', formatHtg(values.todayNet), 'today-net'),
          makeRow(lang === 'ht' ? 'Net 7 dènye jou yo' : 'Net sur 7 jours', formatHtg(values.weeklyNet), 'weekly-net'),
        ]

        section.append(title, ...rows)
        const languageSection = Array.from(drawer.querySelectorAll('.menuSection')).find((el) => {
          const h = el.querySelector('h3')?.textContent?.toLowerCase() || ''
          return h.includes('lang')
        })
        if (languageSection) drawer.insertBefore(section, languageSection)
        else {
          const logout = drawer.querySelector('.drawerLogout')
          if (logout) drawer.insertBefore(section, logout)
          else drawer.appendChild(section)
        }

        let open = false
        const setOpen = (next: boolean) => {
          open = next
          rows.forEach((row) => { row.style.display = next ? '' : 'none' })
          toggleMark.textContent = '+'
          title.setAttribute('aria-expanded', String(next))
          section.style.paddingBottom = next ? '16px' : '12px'
          if (next) void refreshVisibleEarnings()
        }
        const toggle = () => setOpen(!open)
        const keyToggle = (e: Event) => {
          const ke = e as KeyboardEvent
          if (ke.key === 'Enter' || ke.key === ' ') { e.preventDefault(); toggle() }
        }
        title.addEventListener('click', toggle)
        title.addEventListener('keydown', keyToggle)
        cleanups.push(() => {
          title.removeEventListener('click', toggle)
          title.removeEventListener('keydown', keyToggle)
        })
        setOpen(false)
      } finally {
        applying = false
      }
    }

    const setupRealtime = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) return
      driverId = user.id

      const rideChannel = supabase
        .channel(`driver-earnings-rides-${driverId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `driver_id=eq.${driverId}` }, () => {
          window.setTimeout(() => void refreshVisibleEarnings(), 250)
        })
        .subscribe()

      const paymentChannel = supabase
        .channel(`driver-earnings-payments-${driverId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
          window.setTimeout(() => void refreshVisibleEarnings(), 250)
        })
        .subscribe()

      cleanups.push(() => { void supabase.removeChannel(rideChannel); void supabase.removeChannel(paymentChannel) })
    }

    void setupRealtime()
    void apply()

    const observer = new MutationObserver(() => {
      const drawer = document.querySelector('.drawer') as HTMLElement | null
      if (drawer) removeDuplicateSections(drawer)
      void apply()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    const fallbackRefresh = window.setInterval(() => {
      void apply()
      void refreshVisibleEarnings()
    }, 2000)
    const onVisible = () => { if (document.visibilityState === 'visible') void apply() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      observer.disconnect()
      window.clearInterval(fallbackRefresh)
      document.removeEventListener('visibilitychange', onVisible)
      cleanups.forEach((fn) => fn())
    }
  }, [])

  return null
}
