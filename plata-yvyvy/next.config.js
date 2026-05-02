/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'tile.openstreetmap.org' },
    ],
  },
  // Required for Leaflet
  transpilePackages: ['leaflet', 'react-leaflet'],
}

module.exports = nextConfig
