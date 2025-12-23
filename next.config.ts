import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack is now the default in Next.js 16
  // No experimental flags needed

  // Server external packages for yahoo-finance2
  serverExternalPackages: ['yahoo-finance2'],

  // Image optimization
  images: {
    remotePatterns: [],
  },

  // TypeScript and ESLint are handled by Biome
  typescript: {
    // Type checking is done separately via `npm run typecheck`
    ignoreBuildErrors: false,
  },
}

export default nextConfig
