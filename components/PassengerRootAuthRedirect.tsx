'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PassengerRootAuthRedirect() {
  useEffect(() => {
    if (window.location.pathname === '/passenger/dashboard') {
      let stopped = false
      const closeDrawer = () => {
        if (stopped) return
        const drawer = document.querySelector<HTMLElement>('.nav-drawer')
        if (!drawer) return
        const closeButton = drawer.querySelector<HTMLButtonElement>('.drawer-head > button')
        closeButton?.click()
      }

      const timers = [0, 120, 350, 700, 1200].map((delay) => window.setTimeout(closeDrawer, delay))
      const observer = new MutationObserver(closeDrawer)
      observer.observe(document.body, { childList: true, subtree: true })
      const stopTimer = window.setTimeout(() => {
        stopped = true
        observer.disconnect()
      }, 1500)

      return () => {
        stopped = true
        observer.disconnect()
        timers.forEach((timer) => window.clearTimeout(timer))
        window.clearTimeout(stopTimer)
      }
    }

    if (window.location.pathname !== '/') return
    let active = true

    const redirectIfSignedIn = async () => {
      const { data } = await supabase.auth.getSession()
      if (!active) return false
      if (data.session?.user) {
        window.location.replace('/passenger/dashboard')
        return true
      }
      return false
    }

    void redirectIfSignedIn()

    const handleSubmit = async (event: Event) => {
      const form = event.target as HTMLFormElement | null
      if (!form?.classList.contains('auth-form')) return

      const emailInput = form.querySelector<HTMLInputElement>('input[type="email"]')
      const passwordInput = form.querySelector<HTMLInputElement>('input[type="password"]')
      if (!emailInput || !passwordInput) return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"], button:not([type])')
      if (submitButton) submitButton.disabled = true

      const oldError = form.querySelector('.passenger-direct-auth-error')
      oldError?.remove()

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailInput.value.trim(),
          password: passwordInput.value,
        })

        if (error || !data.session?.user) {
          const errorBox = document.createElement('div')
          errorBox.className = 'auth-message passenger-direct-auth-error'
          errorBox.textContent = error?.message || 'Connexion impossible. Veuillez réessayer.'
          submitButton?.insertAdjacentElement('beforebegin', errorBox)
          return
        }

        // Safari/iOS can navigate before the auth session is durably persisted.
        // Explicitly set and then re-read the session before leaving the login page.
        const persisted = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })

        if (persisted.error || !persisted.data.session?.user) {
          const errorBox = document.createElement('div')
          errorBox.className = 'auth-message passenger-direct-auth-error'
          errorBox.textContent = persisted.error?.message || 'Session non enregistrée. Veuillez réessayer.'
          submitButton?.insertAdjacentElement('beforebegin', errorBox)
          return
        }

        await new Promise((resolve) => window.setTimeout(resolve, 250))
        const { data: verified } = await supabase.auth.getSession()
        if (!verified.session?.user) {
          const errorBox = document.createElement('div')
          errorBox.className = 'auth-message passenger-direct-auth-error'
          errorBox.textContent = 'Session non enregistrée. Veuillez réessayer.'
          submitButton?.insertAdjacentElement('beforebegin', errorBox)
          return
        }

        window.location.replace('/passenger/dashboard')
      } finally {
        if (submitButton) submitButton.disabled = false
      }
    }

    document.addEventListener('submit', handleSubmit, true)

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      if (session?.user && window.location.pathname === '/') {
        // Let signInWithPassword finish persisting before navigating.
        window.setTimeout(() => {
          if (window.location.pathname === '/') void redirectIfSignedIn()
        }, 300)
      }
    })

    return () => {
      active = false
      document.removeEventListener('submit', handleSubmit, true)
      listener.subscription.unsubscribe()
    }
  }, [])

  return null
}
