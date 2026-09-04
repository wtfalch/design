/**
 * A static server for the built gallery, started by Playwright itself.
 *
 * The first attempt pointed the suite at a Vite dev server on the host and
 * reached it from the container over `host.docker.internal`. Two things were
 * wrong with that and only one of them was the 403 (Vite 6 refuses a Host
 * header it was not told about):
 *
 * - **CI has no dev server.** A suite that only runs against `vite dev` is a
 *   suite that runs on one laptop.
 * - **A dev server is not what ships.** It serves unminified modules through an
 *   HMR client, and the thing whose pixels are being promised is the build.
 *
 * So the target is `dist/`, served the same way on a laptop and in the
 * container, with no host networking involved at all. `GALLERY_DIST` says where
 * it is; Playwright's `webServer` starts and stops it.
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

const root = resolve(process.env.GALLERY_DIST ?? '../gallery/dist')
const port = Number(process.env.GALLERY_PORT ?? 5199)

if (!existsSync(join(root, 'design.html'))) {
  console.error(`No design.html under ${root}. Build the dashboard first.`)
  process.exit(1)
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  // `normalize` then a prefix check: a request for `/../../etc/passwd` should
  // 404 rather than be served, even from a test server that only ever listens
  // on loopback.
  const file = resolve(join(root, normalize(decodeURIComponent(url.pathname))))
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('not found')
    return
  }
  res.writeHead(200, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    // Every run must see the bytes on disk. A cached bundle is a baseline of
    // the previous build, which is the one failure mode this whole suite is
    // meant to make impossible.
    'cache-control': 'no-store',
  })
  createReadStream(file).pipe(res)
}).listen(port, '0.0.0.0', () => {
  console.log(`gallery: http://127.0.0.1:${port}/design.html  (from ${root})`)
})
