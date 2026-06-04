import type { NextConfig } from 'next'

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
      };
      Object.defineProperty(globalThis, 'localStorage', {
        value: mockStorage,
        writable: true,
        configurable: true,
      });
    }
  } catch (e) {
    // Avoid crashing if property is not configurable
  }
}

const ODOO_URL = process.env.ODOO_INTERNAL_URL ?? process.env.NEXT_PUBLIC_ODOO_URL ?? 'http://localhost:8069'

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8069',
        pathname: '/web/image/**',
      },
      {
        protocol: 'http',
        hostname: 'odoo',
        port: '8069',
        pathname: '/web/image/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        // Proxy all /api/odoo/** → Odoo backend (server-side, no CORS)
        source: '/api/odoo/:path*',
        destination: `${ODOO_URL}/fashionos/api/v1/:path*`,
      },
    ]
  },
}

export default nextConfig

