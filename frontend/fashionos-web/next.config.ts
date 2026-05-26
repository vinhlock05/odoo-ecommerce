import type { NextConfig } from 'next'

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
