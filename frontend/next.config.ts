import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Không để Webpack bundle mongoose/bcryptjs — dùng Node.js require trực tiếp
  // Nếu thiếu dòng này, mongoose.models cache bị reset mỗi request → 404
  serverExternalPackages: ['mongoose', 'bcryptjs'],

  experimental: {
    // Cho phép upload file lớn qua Server Actions và API routes
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
