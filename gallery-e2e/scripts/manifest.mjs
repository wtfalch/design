/**
 * Write down what there is to photograph.
 *
 * The gallery knows its own specimens and puts them on `window.__SPECIMENS__`.
 * This reads that from a real render and commits the answer to
 * `e2e/manifest.json`.
 *
 * **Committed rather than fetched at collection time, so that coverage changes
 * are visible in a diff.** A suite that discovers its own work list can lose
 * half of it to a rename and stay green — every remaining test passes, the run
 * is shorter, and nothing anywhere is red. Writing the list down means deleting
 * a variant shows up as a deleted line in a pull request, which is the only
 * place anybody would notice.
 *
 * `manifest.spec.ts` then holds the file to the live page, so the committed
 * copy going stale is a failure rather than a slow drift.
 *
 *   node scripts/manifest.mjs [http://127.0.0.1:5199]
 *
 * It reads a served gallery and starts none: `pnpm manifest` runs it in the
 * Playwright container behind `serve.mjs`, the way the suite's own `webServer`
 * would. Run bare against nothing it dies on a refused connection, which it did
 * the first time a variant was added after the split.
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'

const base = process.argv[2] ?? process.env.GALLERY_URL ?? 'http://127.0.0.1:5199'
const here = dirname(fileURLToPath(import.meta.url))

const browser = await chromium.launch()
const page = await browser.newPage()
try {
  await page.goto(`${base}/design.html`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => '__SPECIMENS__' in window, null, { timeout: 10_000 })
  const list = await page.evaluate(() => window.__SPECIMENS__)
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('the gallery exposed no specimens')
  }
  // Sorted, so the file is a set rather than a record of render order — a
  // reordered `COMPONENTS` array should not read as a coverage change.
  list.sort((a, b) => (a.c === b.c ? a.v.localeCompare(b.v) : a.c.localeCompare(b.c)))
  const out = join(here, '../e2e/manifest.json')
  writeFileSync(out, `${JSON.stringify(list, null, 2)}\n`)
  console.log(`${list.length} specimens across ${new Set(list.map((s) => s.c)).size} components`)
} finally {
  await browser.close()
}
