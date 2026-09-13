'use client'

import { useEffect } from 'react'

export default function LoginCopyNeutralizer() {
  useEffect(() => {
    const update = () => {
      if (window.location.pathname !== '/') return
      document.querySelectorAll<HTMLElement>('h1,h2,h3,p,div').forEach((el) => {
        const text = el.textContent?.trim()
        if (text === 'Connectez-vous pour commander un taxi') {
          el.textContent = 'Connectez-vous à votre espace'
        } else if (text === 'Konekte pou mande taksi') {
          el.textContent = 'Konekte nan espas ou'
        }
      })
    }

    update()
    const observer = new MutationObserver(update)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  return null
}
