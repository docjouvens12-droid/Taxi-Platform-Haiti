'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PasswordVisibilityToggle() {
  useEffect(() => {
    const clearCredentialFields = () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      document.querySelectorAll<HTMLInputElement>('input[type="email"], input[type="password"], input[data-password-visible-toggle="true"]').forEach((input) => {
        if (setter) setter.call(input, '')
        else input.value = ''
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      })
    }

    const enhance = () => {
      document.querySelectorAll<HTMLInputElement>('input[type="password"], input[data-password-visible-toggle="true"]').forEach((input) => {
        if (input.dataset.passwordToggleReady === 'true') return
        input.dataset.passwordToggleReady = 'true'
        input.dataset.passwordVisibleToggle = 'true'

        const parent = input.parentElement
        if (!parent) return

        if (window.getComputedStyle(parent).position === 'static') parent.style.position = 'relative'
        input.style.paddingRight = '3.5rem'

        const button = document.createElement('button')
        button.type = 'button'
        button.setAttribute('aria-label', 'Afficher le mot de passe')
        button.setAttribute('title', 'Afficher / masquer le mot de passe')
        button.textContent = '👁️'
        button.style.position = 'absolute'
        button.style.right = '0.7rem'
        button.style.bottom = '0.55rem'
        button.style.width = '2.4rem'
        button.style.height = '2.4rem'
        button.style.border = '0'
        button.style.borderRadius = '0.7rem'
        button.style.background = 'transparent'
        button.style.cursor = 'pointer'
        button.style.fontSize = '1.15rem'
        button.style.lineHeight = '1'
        button.style.padding = '0'
        button.style.zIndex = '10'
        button.style.webkitAppearance = 'none'
        button.style.appearance = 'none'

        button.addEventListener('click', (event) => {
          event.preventDefault()
          event.stopPropagation()
          const visible = input.type === 'text'
          input.setAttribute('type', visible ? 'password' : 'text')
          button.textContent = visible ? '👁️' : '🙈'
          button.setAttribute('aria-label', visible ? 'Afficher le mot de passe' : 'Masquer le mot de passe')
          requestAnimationFrame(() => input.focus())
        })

        parent.appendChild(button)
      })
    }

    enhance()
    const observer = new MutationObserver(enhance)
    observer.observe(document.body, { childList: true, subtree: true })

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_OUT') return
      clearCredentialFields()
      window.setTimeout(clearCredentialFields, 50)
      window.setTimeout(clearCredentialFields, 250)
    })

    return () => {
      observer.disconnect()
      listener.subscription.unsubscribe()
    }
  }, [])

  return null
}
