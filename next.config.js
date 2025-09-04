/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // 在客户端忽略 canvas 和其他 Node.js 专用模块
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
        os: false,
      }
    }
    
    return config
  },
  // 配置外部包
  serverExternalPackages: ['canvas'],
}

module.exports = nextConfig