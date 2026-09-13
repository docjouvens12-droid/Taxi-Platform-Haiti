const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    const noCache = [
      { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
      { key: 'Pragma', value: 'no-cache' },
      { key: 'Expires', value: '0' },
    ]

    return [
      { source: '/', headers: noCache },
      { source: '/login', headers: noCache },
      { source: '/spaces', headers: noCache },
      { source: '/passenger/:path*', headers: noCache },
      { source: '/driver/login', headers: noCache },
      { source: '/admin/login', headers: noCache },
    ]
  },
}

module.exports = nextConfig
