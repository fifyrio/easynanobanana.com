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
}

module.exports = withNextIntl(withMDX(nextConfig));
