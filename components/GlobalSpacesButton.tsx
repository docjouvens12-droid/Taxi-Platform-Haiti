'use client'

import { usePathname } from 'next/navigation'

export default function GlobalSpacesButton() {
  const pathname = usePathname()
  if (
    pathname === '/spaces' ||
    pathname === '/' ||
    pathname.startsWith('/passenger') ||
    pathname.startsWith('/driver')
  ) return null

  return (
    <a
      href="/spaces"
      aria-label="Choisir un espace"
      style={{
        position: 'fixed',
        right: 12,
        bottom: 'calc(14px + env(safe-area-inset-bottom))',
        zIndex: 9999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '9px 11px',
        borderRadius: 999,
        background: '#102033',
        color: '#fff',
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: 850,
        lineHeight: 1,
        boxShadow: '0 8px 22px rgba(16,32,51,.22)',
        border: '1px solid rgba(255,255,255,.18)',
      }}
    >
      <span aria-hidden="true">⇄</span>
      <span>Espaces</span>
    </a>
  )
}
