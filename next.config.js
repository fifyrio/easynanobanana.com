const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();
const withMDX = require('@next/mdx')()

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],

  // Enable SWC minification for faster builds and smaller bundles
  swcMinify: true,

  // Enable gzip compression
  compress: true,

  // Optimize for production deployment
  output: 'standalone',

  images: {
    unoptimized: true,
  },

  // Optimize package imports to reduce bundle size
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'react-hot-toast', 'react-markdown'],
  },

  async redirects() {
    return [
      {
        source: '/game-sound-generator',
        destination: '/audio/game-sound-generator',
        statusCode: 301,
      },
      {
        source: '/en/game-sound-generator',
        destination: '/audio/game-sound-generator',
        statusCode: 301,
      },
      {
        source: '/:locale(zh|zh-TW|de|fr|ja|pt|es|it|ru|ko|th|id|vi)/game-sound-generator',
        destination: '/:locale/audio/game-sound-generator',
        statusCode: 301,
      },
    ];
  },
}

module.exports = withNextIntl(withMDX(nextConfig));
