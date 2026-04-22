// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.TAURI_BUILD ? 'export' : undefined,
  images: { unoptimized: true },
  // Allow Tauri's internal URL scheme
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.TAURI_BUILD ? 'tauri://localhost' : '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
