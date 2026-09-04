/**
 * Record the accessibility violations that exist today.
 *
 * `a11y.spec.ts` fails on anything not in `a11y-known.json`, so this writes down
 * where the components actually stand. It is a to-do list with a test attached,
 * not a suppression file: phase 5 empties it one component at a time, and the
 * spec also fails when an entry stops being true, so a fixed component cannot
 * leave its excuse behind for the next real failure to hide under.
 *
 * Run it once to establish the list, and never again to make a red suite green
 * — the whole value is that regenerating it is a visible, reviewable diff.
 *
 *   node scripts/a11y-known.mjs
 */
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import AxeBuilder from '@axe-core/playwright'
import { chromium } from '@playwright/test'

import manifest from '../e2e/manifest.json' with { type: 'json' }

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const THEMES = ['system', 'night', 'paper', 'brand']
const base = process.env.GALLERY_URL ?? 'http://127.0.0.1:5199'
const here = dirname(fileURLToPath(import.meta.url))

const url = (s, theme) =>
  `${base}/design.html?${new URLSearchParams({ c: s.c, v: s.v, theme, chrome: '0' })}`

/* Playwright's `webServer` only runs for `playwright test`, so a bare script
   gets ERR_CONNECTION_REFUSED on the first specimen. Start the same server the
   suite uses rather than asking whoever runs this to remember. */
const server = spawn('node', [join(here, 'serve.mjs')], { stdio: 'inherit' })
process.on('exit', () => server.kill())
for (let i = 0; i < 50; i++) {
  try {
    const r = await fetch(`${base}/design.html`)
    if (r.ok) break
  } catch {
    await new Promise((r) => setTimeout(r, 200))
  }
}

const browser = await chromium.launch()
/* An explicit context, not `browser.newPage()`. axe-core/playwright refuses a
   page created straight off the browser -- it needs the context to inject its
   script into every frame, and says so with "Please use browser.newContext()". */
const context = await browser.newContext({ viewport: { width: 1000, height: 800 } })
const page = await context.newPage()
const out = {}

try {
  for (const s of manifest) {
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
    await page.goto(url(s, 'system'))
    await page.locator('.spec-stage').waitFor()
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'system')
    await page.addStyleTag({
      content:
        '*, *::before, *::after { transition: none !important; animation: none !important; }',
    })
    const structural = await new AxeBuilder({ page })
      .include('.spec-stage')
      .withTags(TAGS)
      .disableRules(['color-contrast'])
      .analyze()
    const ids = [...new Set(structural.violations.map((v) => v.id))].sort()
    if (ids.length) out[`${s.c} · ${s.v}`] = ids

    for (const theme of THEMES) {
      await page.goto(url(s, theme))
      await page.locator('.spec-stage').waitFor()
      await page.waitForFunction((t) => document.documentElement.dataset.theme === t, theme)
      await page.addStyleTag({
        content:
          '*, *::before, *::after { transition: none !important; animation: none !important; }',
      })
      const contrast = await new AxeBuilder({ page })
        .include('.spec-stage')
        .withRules(['color-contrast'])
        .analyze()
      const nodes = contrast.violations.flatMap((v) =>
        v.nodes.map((n) => n.failureSummary?.split('\n')[1]?.trim() ?? n.html.slice(0, 80)),
      )
      if (nodes.length) out[`${s.c} · ${s.v} · ${theme}`] = nodes
    }
  }

  const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(join(here, '../e2e/a11y-known.json'), `${JSON.stringify(sorted, null, 2)}\n`)
  const structural = Object.keys(sorted).filter((k) => k.split(' · ').length === 2).length
  console.log(
    `${Object.keys(sorted).length} entries: ${structural} structural, ` +
      `${Object.keys(sorted).length - structural} contrast`,
  )
} finally {
  await browser.close()
  server.kill()
}
