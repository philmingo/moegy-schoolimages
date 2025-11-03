import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xgzjdebqdsvllrbccsrj.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'qetjvxqiygghrhochoke.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  output: 'standalone',
};

export default nextConfig;
