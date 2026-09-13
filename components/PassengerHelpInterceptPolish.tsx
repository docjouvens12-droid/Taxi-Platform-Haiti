'use client'

import { useEffect } from 'react'

export default function PassengerHelpInterceptPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/passenger/dashboard') return

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest<HTMLButtonElement>('.nav-drawer .drawer-nav > button')
      if (!button) return
      const text = (button.textContent || '').trim()
      if (!/(^|\s)(aide|èd)(\s|$)/i.test(text)) return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      const details = document.querySelector<HTMLElement>('.passenger-help-details')
      if (!details) return

      const open = details.classList.toggle('open')
      const arrow = button.querySelector<HTMLElement>('b:last-child')
      if (arrow) arrow.style.transform = open ? 'rotate(90deg)' : 'rotate(0deg)'
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
