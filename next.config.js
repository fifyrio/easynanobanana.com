const withMDX = require('@next/mdx')()

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  images: {
    domains: ['localhost', 'commondatastorage.googleapis.com', 'pub-a0da9daa5c8a415793ac89043f791f12.r2.dev', 'images.unsplash.com', 'lh3.googleusercontent.com'],
  },
}

module.exports = withMDX(nextConfig);