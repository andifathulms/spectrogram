/**
 * Static export for GitHub Pages. `basePath` must match the repository name;
 * override with NEXT_PUBLIC_BASE_PATH when the repository is renamed.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/urai'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
}

module.exports = nextConfig
