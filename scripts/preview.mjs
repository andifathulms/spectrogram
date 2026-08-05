/**
 * Serves ./out under the production basePath so the export is verified the way
 * GitHub Pages will serve it. Static files only — there is no backend.
 */
import { createServer } from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/urai'
const root = new URL('../out/', import.meta.url).pathname
const port = Number(process.env.PORT ?? 4173)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

function resolve(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0])
  if (basePath && p.startsWith(basePath)) p = p.slice(basePath.length)
  if (p === '' || p.endsWith('/')) p += 'index.html'
  const abs = join(root, normalize(p))
  if (!abs.startsWith(root)) return null
  try {
    if (statSync(abs).isFile()) return abs
  } catch {
    /* fall through */
  }
  try {
    const html = `${abs}.html`
    if (statSync(html).isFile()) return html
  } catch {
    /* fall through */
  }
  return null
}

createServer((req, res) => {
  if (basePath && req.url === '/') {
    res.writeHead(302, { location: `${basePath}/` })
    res.end()
    return
  }
  const file = resolve(req.url ?? '/')
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('404')
    return
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
}).listen(port, () => {
  console.log(`preview: http://localhost:${port}${basePath}/`)
})
