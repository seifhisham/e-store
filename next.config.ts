import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oyrfzypkbrotgotrqttf.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'content-management-files.canva.com',
        port: '',
        pathname: '/**',
      },
      // Allow optimized remote images broadly (http/https)
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    // Cache optimized images from the Next Image endpoint in browsers and CDNs for 30 days
    return [
      {
        source: '/_next/image(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, s-maxage=2592000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
