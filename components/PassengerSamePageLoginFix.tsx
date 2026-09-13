'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PassengerSamePageLoginFix() {
  useEffect(() => {
    if (window.location.pathname !== '/') return

    const handleSubmit = async (event: Event) => {
      const form = event.target as HTMLFormElement | null
      if (!form?.classList.contains('auth-form')) return

      const emailInput = form.querySelector<HTMLInputElement>('input[type="email"]')
      const passwordInput = form.querySelector<HTMLInputElement>('input[type="password"]')
      if (!emailInput || !passwordInput) return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      const button = form.querySelector<HTMLButtonElement>('button[type="submit"], button:not([type])')
      const previousText = button?.textContent || ''
      if (button) {
        button.disabled = true
        button.textContent = 'Connexion…'
      }

      form.querySelector('.passenger-same-page-auth-error')?.remove()

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailInput.value.trim(),
          password: passwordInput.value,
        })

        if (error || !data.user || !data.session) {
          const box = document.createElement('div')
          box.className = 'auth-message passenger-same-page-auth-error'
          box.textContent = error?.message || 'Connexion impossible. Vérifiez vos informations.'
          button?.insertAdjacentElement('beforebegin', box)
          return
        }

        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })

        const { data: verified } = await supabase.auth.getSession()
        if (!verified.session?.user) {
          const box = document.createElement('div')
          box.className = 'auth-message passenger-same-page-auth-error'
          box.textContent = 'Session non enregistrée. Veuillez réessayer.'
          button?.insertAdjacentElement('beforebegin', box)
          return
        }

        window.location.reload()
      } finally {
        if (button) {
          button.disabled = false
          button.textContent = previousText
        }
      }
    }

    document.addEventListener('submit', handleSubmit, true)
    return () => document.removeEventListener('submit', handleSubmit, true)
  }, [])

  return null
}
