'use client'

import { useEffect } from 'react'

const locations: Array<{ keys: string[]; context: string }> = [
  { keys: ['les gonaives', 'gonaives', 'gonayiv'], context: 'Les Gonaïves, Artibonite, Haïti' },
  { keys: ['port au prince', 'potoprens'], context: 'Port-au-Prince, Ouest, Haïti' },
  { keys: ['delmas'], context: 'Delmas, Ouest, Haïti' },
  { keys: ['petion ville', 'petion-ville', 'petyonvil'], context: 'Pétion-Ville, Ouest, Haïti' },
  { keys: ['cap haitien', 'cap-haitien', 'okap'], context: 'Cap-Haïtien, Nord, Haïti' },
  { keys: ['saint marc', 'saint-marc', 'senmak'], context: 'Saint-Marc, Artibonite, Haïti' },
  { keys: ['jacmel', 'jakmel'], context: 'Jacmel, Sud-Est, Haïti' },
  { keys: ['les cayes', 'okay'], context: 'Les Cayes, Sud, Haïti' },
]

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function findContext(value: string) {
  const normalized = normalize(value)
  return locations.find(item => item.keys.some(key => normalized.includes(normalize(key))))?.context ?? ''
}

export default function PassengerTypedAddressPreview() {
  useEffect(() => {
    let host: HTMLButtonElement | null = null
    let cleanupTimer: number | null = null
    let observer: MutationObserver | null = null

    const removeHost = () => {
      host?.remove()
      host = null
    }

    const watchNativeResults = (routeCard: HTMLElement) => {
      observer?.disconnect()
      const parent = routeCard.parentElement
      if (!parent) return
      observer = new MutationObserver(() => {
        const nativeButton = parent.querySelector('.search-results button')
        if (nativeButton) removeHost()
      })
      observer.observe(parent, { childList: true, subtree: true })
    }

    const renderPreview = (input: HTMLInputElement) => {
      const value = input.value.trim()
      const context = findContext(value)
      const routeCard = input.closest('.route-card') as HTMLElement | null
      if (!routeCard || value.length < 3 || !context) {
        removeHost()
        return
      }

      // Never rewrite what the passenger typed. The native geocoder must receive the
      // exact street/place text so it can return a precise destination rather than a
      // generic city result.
      const existingNative = routeCard.parentElement?.querySelector('.search-results button')
      if (existingNative) {
        removeHost()
        return
      }

      watchNativeResults(routeCard)

      if (!host || !host.isConnected) {
        host = document.createElement('button')
        host.type = 'button'
        host.className = 'passenger-typed-address-preview'
        routeCard.insertAdjacentElement('afterend', host)
      }

      host.onclick = () => {
        // This is only a broad-city fallback when Mapbox has no precise result.
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
        setter?.call(input, context)
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
        input.focus()
      }

      host.innerHTML = ''
      const pin = document.createElement('span')
      pin.className = 'passenger-typed-address-pin'
      pin.textContent = '📍'
      const copy = document.createElement('div')
      copy.className = 'passenger-typed-address-copy'
      const top = document.createElement('strong')
      top.textContent = value
      const bottom = document.createElement('small')
      bottom.textContent = context
      copy.append(top, bottom)
      host.append(pin, copy)

      if (cleanupTimer) window.clearTimeout(cleanupTimer)
      cleanupTimer = window.setTimeout(() => {
        const nativeResults = routeCard.parentElement?.querySelector('.search-results')
        if (nativeResults && nativeResults.querySelector('button')) removeHost()
      }, 500)
    }

    const onInput = (event: Event) => {
      const target = event.target
      if (!(target instanceof HTMLInputElement)) return
      if (!target.matches('.route-card input:not([readonly])')) return
      renderPreview(target)
    }

    const onFocus = (event: Event) => {
      const target = event.target
      if (!(target instanceof HTMLInputElement)) return
      if (!target.matches('.route-card input:not([readonly])')) return
      renderPreview(target)
    }

    document.addEventListener('input', onInput, true)
    document.addEventListener('focusin', onFocus, true)

    return () => {
      document.removeEventListener('input', onInput, true)
      document.removeEventListener('focusin', onFocus, true)
      if (cleanupTimer) window.clearTimeout(cleanupTimer)
      observer?.disconnect()
      removeHost()
    }
  }, [])

  return <style>{`
    .passenger-typed-address-preview{
      width:100%;
      margin:10px 0 4px;
      min-height:70px;
      padding:12px 14px;
      border:1px solid #dce8e3;
      border-radius:18px;
      background:#fff;
      display:flex;
      align-items:center;
      gap:12px;
      box-shadow:0 7px 20px rgba(16,32,51,.04);
      font:inherit;
      cursor:pointer;
      -webkit-tap-highlight-color:transparent;
    }
    .passenger-typed-address-preview:active{transform:scale(.995);background:#f8fcfa}
    .passenger-typed-address-pin{font-size:22px;flex:none}
    .passenger-typed-address-copy{min-width:0;display:grid;gap:4px;text-align:left}
    .passenger-typed-address-copy strong{font-size:14px;line-height:1.25;color:#17324b;font-weight:900}
    .passenger-typed-address-copy small{font-size:13px;line-height:1.25;color:#71817a;font-weight:750;white-space:normal;overflow-wrap:anywhere}
  `}</style>
}
