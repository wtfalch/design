/**
 * What there is to photograph, read out of a real render.
 *
 * The gallery puts every (component, variant) pair on `window.__SPECIMENS__`,
 * and this fetches that once per run. The alternative — a list kept in the test
 * directory — goes stale in the direction that hides work: the entry nobody
 * added is the variant nobody screenshots, and the suite stays green while the
 * coverage quietly shrinks.
 */
import type { Page } from '@playwright/test'

export interface Specimen {
  c: string
  v: string
}

/** The themes to shoot each specimen in.
 *
 *  Every one of them, rather than a representative sample, because a component
 *  is only as good as its worst theme and the failures are theme-specific by
 *  nature: a `running` pill sat at 1.67:1 on Paper for weeks while looking
 *  correct on every dark theme anybody tested. */
export const THEMES = ['system', 'night', 'paper', 'brand'] as const

let cached: Specimen[] | null = null

export async function specimens(page: Page): Promise<Specimen[]> {
  if (cached) return cached
  await page.goto('/design.html', { waitUntil: 'domcontentloaded' })
  const list = await page.evaluate(
    () => (window as unknown as { __SPECIMENS__?: Specimen[] }).__SPECIMENS__ ?? [],
  )
  if (list.length === 0) {
    throw new Error(
      'The gallery exposed no specimens. Either the server is not the gallery, ' +
        'or `main.tsx` stopped setting window.__SPECIMENS__ — both of which would ' +
        'otherwise show up as a suite that passes with zero tests.',
    )
  }
  cached = list
  return list
}

/** A filename-safe id for one shot. Variant names are prose — "When the name is
 *  too long" — so they cannot go into a path unescaped. */
export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Wait until the theme is actually on the element.
 *
 * `applyTheme` runs in an effect and stamps `data-theme`, so a scan that starts
 * when `.spec-stage` becomes visible can run against the *previous* palette. It
 * cost an afternoon: the recorder saw a contrast failure on `system` and missed
 * the identical one on `paper`, so the recorded list and the suite disagreed
 * about a component neither had changed.
 */
export async function themeApplied(page: Page, theme: string): Promise<void> {
  await page.waitForFunction((t) => document.documentElement.dataset.theme === t, theme, {
    timeout: 5_000,
  })
}

/**
 * Stop everything moving, for a scan rather than a screenshot.
 *
 * Playwright's `animations: 'disabled'` is a *screenshot* option -- it freezes
 * the page for the capture and leaves it live the rest of the time. axe reads
 * computed styles from a running page, so a card with a transition on its
 * background can be sampled part-way through one and its contrast measured
 * against a colour that exists for 120ms.
 *
 * That is exactly what `card / Selectable` did: it failed contrast on roughly
 * one run in four, against `#616468` -- a background the card never rests at.
 */
export async function stillPage(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `*, *::before, *::after {
      transition: none !important;
      animation: none !important;
    }`,
  })
}

export function specimenUrl(s: Specimen, theme: string): string {
  const q = new URLSearchParams({ c: s.c, v: s.v, theme, chrome: '0' })
  return `/design.html?${q}`
}
