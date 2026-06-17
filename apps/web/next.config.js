/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@job-sim/shared'],
  async rewrites() {
    const apiUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};
module.exports = nextConfig;
