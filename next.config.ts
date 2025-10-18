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
    ],
  },
};

export default nextConfig;
