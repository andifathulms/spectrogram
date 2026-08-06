/**
 * Static export for GitHub Pages. `basePath` must match the repository name;
 * override with NEXT_PUBLIC_BASE_PATH when the repository is renamed.
 *
 * The origin is here for one reason: a social card image has to be an absolute
 * URL or no crawler can resolve it, and an absolute URL written into app/ or
 * components/ would fail tests/privacy/no-network.test.ts. Nothing the page
 * itself loads uses it — it only appears in og:image and twitter:image, which
 * the browser never fetches.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/spectrogram'
const siteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? 'https://andifathulms.github.io'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_SITE_ORIGIN: siteOrigin },
}

module.exports = nextConfig
