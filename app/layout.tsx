import type { Metadata, Viewport } from 'next'
import 'mapbox-gl/dist/mapbox-gl.css'
import './globals.css'
import './menu.css'
import './completion.css'
import './admin-mobile-header-fix.css'
import './passenger-secondary.css'
import './passenger-dashboard-mobile.css'
import './passenger-menu-final.css'
import './passenger-avatar.css'
import './passenger-profile-details.css'
import './passenger-trips-page.css'
import './passenger-payment-inline.css'
import './passenger-language-switch.css'
import './passenger-secondary-centered.css'
import './passenger-support-redesign.css'
import './public-home-premium.css'
import './movi-brand.css'
import './passenger-stable-redesign.css'
import './passenger-movi-direct.css'
import './passenger-menu-compact.css'
import './passenger-payment-request.css'
import './passenger-address-results.css'
import UnifiedPublicEntry from '../components/UnifiedPublicEntry'
import IphoneLoginInputFix from '../components/IphoneLoginInputFix'
import AuthRoleRedirector from '../components/AuthRoleRedirector'
import AdminPermissionGuard from '../components/AdminPermissionGuard'
import PasswordVisibilityToggle from '../components/PasswordVisibilityToggle'
import PwaRegister from '../components/PwaRegister'
import HaitiTestGeolocation from '../components/HaitiTestGeolocation'
import RouteScopedEnhancers from '../components/RouteScopedEnhancers'

export const metadata: Metadata = {
  title: 'MOVI',
  description: 'Deplase fasil, rapidman ak an sekirite',
  applicationName: 'MOVI',
  manifest: '/manifest.webmanifest?v=6',
  icons: {
    icon: '/movi-icon-v6.svg',
    apple: '/apple-icon-v6',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MOVI',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f705a',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <HaitiTestGeolocation />
        <PwaRegister />
        <UnifiedPublicEntry />
        <IphoneLoginInputFix />
        <AuthRoleRedirector />
        <AdminPermissionGuard />
        <PasswordVisibilityToggle />
        <RouteScopedEnhancers />
        {children}
      </body>
    </html>
  )
}
