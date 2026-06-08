import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

// Mock global localStorage on server-side (Node.js 25+) to prevent SSR TypeError
if (typeof globalThis !== 'undefined') {
  try {
    if (!globalThis.localStorage || typeof globalThis.localStorage.getItem !== 'function') {
      const mockStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      }
      Object.defineProperty(globalThis, 'localStorage', {
        value: mockStorage,
        writable: true,
        configurable: true,
      })
    }
  } catch {
    // Avoid crashing if property is not configurable
  }
}

const ODOO_URL = process.env.ODOO_INTERNAL_URL ?? process.env.NEXT_PUBLIC_ODOO_URL ?? 'http://localhost:8069'

function odooRemotePattern(urlStr: string) {
  try {
    const u = new URL(urlStr)
    return {
      protocol: u.protocol.replace(':', '') as 'http' | 'https',
      hostname: u.hostname,
      port: u.port || undefined,
      pathname: '/web/image/**',
    }
  } catch {
    return { protocol: 'http' as const, hostname: 'localhost', port: '8069', pathname: '/web/image/**' }
  }
}

const nextConfig: NextConfig = {
  turbopack: {},
  output: process.env.BUILD_STANDALONE === '1' ? 'standalone' : undefined,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      odooRemotePattern(ODOO_URL),
      // Docker internal service name
      { protocol: 'http', hostname: 'odoo', port: '8069', pathname: '/web/image/**' },
      // Localhost dev (NEXT_PUBLIC_ODOO_URL may be localhost when browser fetches images)
      { protocol: 'http', hostname: 'localhost', port: '8069', pathname: '/web/image/**' },
      // Placeholder images used as fallback
      { protocol: 'https', hostname: 'placehold.co' },
      // Unsplash CDN for product & category photos
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/odoo/:path*',
        destination: `${ODOO_URL}/fashionos/api/v1/:path*`,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  // Sentry org + project (set in env or CI secrets)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Upload source maps only in CI (SENTRY_AUTH_TOKEN must be set)
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Disable source map upload when no auth token — won't break local builds
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  telemetry: false,
})

