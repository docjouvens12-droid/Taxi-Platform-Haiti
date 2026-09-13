import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/movi-pwa-v6',
    name: 'MOVI',
    short_name: 'MOVI',
    description: 'Deplase fasil, rapidman ak an sekirite',
    start_url: '/movi-start.html',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone'],
    background_color: '#eff7f4',
    theme_color: '#10cf72',
    orientation: 'portrait-primary',
    lang: 'fr-HT',
    categories: ['travel', 'navigation'],
    icons: [
      {
        src: '/movi-icon-v6.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/apple-icon-v6',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/movi-icon-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
