/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',
  trailingSlash: true,
  basePath: '/jareb',
  assetPrefix: '/jareb/',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
