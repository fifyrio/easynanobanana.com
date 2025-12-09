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
    domains: [
      'localhost',
      'commondatastorage.googleapis.com',
      'pub-a0da9daa5c8a415793ac89043f791f12.r2.dev',
      'pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev',
      'pub-75de598aba1c45faa2b7c57c5f262f78.r2.dev',
      'cdn.gooo.ai',
      'images.unsplash.com',
      'lh3.googleusercontent.com'
    ],
    // Support modern image formats for better performance
    formats: ['image/avif', 'image/webp'],
    // Cache optimized images for 24 hours
    minimumCacheTTL: 86400,
  },

  // Optimize package imports to reduce bundle size
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'react-hot-toast', 'react-markdown'],
  },
}

module.exports = withNextIntl(withMDX(nextConfig));