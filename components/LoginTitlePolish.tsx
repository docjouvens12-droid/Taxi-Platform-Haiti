'use client'

import { useEffect } from 'react'

export default function LoginTitlePolish() {
  useEffect(() => {
    const apply = () => {
      if (window.location.pathname !== '/') return
      const lang = window.localStorage.getItem('taxi-language')
      const title = Array.from(document.querySelectorAll('h1, h2')).find((el) => {
        const text = (el.textContent || '').trim()
        return text === 'Connectez-vous pour commander un taxi' ||
          text === 'Connectez-vous à votre espace' ||
          text === 'Konekte pou mande taksi' ||
          text === 'Konekte nan espas ou'
      })
      if (title) title.textContent = lang === 'ht' ? 'Konekte' : 'Connectez-vous'
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    window.addEventListener('storage', apply)

    return () => {
      observer.disconnect()
      window.removeEventListener('storage', apply)
    }
  }, [])

  return null
}
