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

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8069',
        pathname: '/web/image/**',
      },
    ],
  },
}

export default nextConfig

