const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();
const withMDX = require('@next/mdx')()

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
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
  },
}

module.exports = withNextIntl(withMDX(nextConfig));