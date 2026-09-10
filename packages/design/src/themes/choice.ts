/**
 * A person's theme, remembered, and applied before the page is drawn.
 *
 * **Three apps wrote this and two of them wrote it identically.**
 * `src/theme/first-paint.ts` is byte-for-byte the same file in
 * wtfalch-manage and app-template; valet's is the same script with the
 * comment rewritten. Each also keeps a `themes.ts` listing ids and labels the
 * package already knows -- a `Theme` carries the `name` a picker shows, and a
 * `Product` carries its themes and which one it wears by default -- so the
 * app-side list was a second copy of a fact, kept in step by hand.
 *
 * **The script is a string, and it has to be.** It runs before the bundle, in
 * a blocking `<script>` in `<head>`, because a theme applied after hydration
 * means a person who chose Paper sees Night for a frame. That is the whole
 * reason this is not simply a `useEffect`.
 *
 * **It sets `data-theme` and nothing else.** The palettes ship as CSS from
 * `productCss`, generated from the same objects the contrast test measures,
 * so the attribute is the entire mechanism. `applyTheme` writes custom
 * properties instead and is for the case with no stylesheet to lean on --
 * theming a subtree, or a product whose CSS is not the one loaded.
 *
 * A copy of this shipped with a bug worth keeping: a stored id the app no
 * longer offers has to fall back, or a browser that remembers `sepia` from a
 * palette you dropped renders unthemed. The list is inlined into the script
 * for that check.
 */

import type { BrandName } from '../components/brandMarks'
import { PRODUCTS, type Product } from '../products'

/** Where the choice lives. One key across the estate, so a person who picked
 *  Night on one app is not asked again on the next one under the same
 *  origin. The README has used this name since 0.1.0. */
export const THEME_STORAGE_KEY = 'theme'

export interface ThemeChoice {
  id: string
  /** What the picker calls it -- the theme's own `name`. */
  label: string
  /** The line under it, where a picker has room. */
  note: string
}

function resolve(product: BrandName | Product): Product {
  return typeof product === 'string' ? PRODUCTS[product] : product
}

/**
 * What this product offers, in the order it declared them.
 *
 * `only` narrows to a subset, for an app that ships a product's palette
 * without all of its themes. An id the product does not have is dropped
 * rather than thrown on: the list is presentation, and a picker missing a row
 * is better than a page that will not render.
 */
export function themeChoices(
  product: BrandName | Product,
  only?: readonly string[],
): ThemeChoice[] {
  const p = resolve(product)
  const ids = only ? only.filter((id) => id in p.themes) : Object.keys(p.themes)
  return ids.map((id) => ({ id, label: p.themes[id].name, note: p.themes[id].note }))
}

/**
 * The blocking script, as a string to put in a `<script>` in `<head>`.
 *
 * `dangerouslySetInnerHTML={{ __html: themeChoiceScript('tf') }}` in a Next
 * root layout, above everything. It reads the stored id, checks it against
 * what this app offers, and writes `data-theme` on `<html>`.
 *
 * Wrapped in try/catch because `localStorage` throws outright in a browser
 * set to block site data, and an exception here happens before anything is
 * drawn -- so the page that fails to read a preference would otherwise fail
 * to render at all.
 */
export function themeChoiceScript(
  product: BrandName | Product,
  options: { only?: readonly string[]; storageKey?: string } = {},
): string {
  const p = resolve(product)
  const ids = themeChoices(product, options.only).map((c) => c.id)
  const key = JSON.stringify(options.storageKey ?? THEME_STORAGE_KEY)
  const fallback = JSON.stringify(
    ids.includes(p.defaultTheme) ? p.defaultTheme : (ids[0] ?? p.defaultTheme),
  )
  return `(function(){try{var t=localStorage.getItem(${key});document.documentElement.dataset.theme=${JSON.stringify(ids)}.indexOf(t)>=0?t:${fallback}}catch(e){}})()`
}

/** What the script would have written, for code that needs the same answer
 *  after hydration. Reads the same key and applies the same fallback. */
export function storedTheme(
  product: BrandName | Product,
  options: { only?: readonly string[]; storageKey?: string } = {},
): string {
  const p = resolve(product)
  const ids = themeChoices(product, options.only).map((c) => c.id)
  const fallback = ids.includes(p.defaultTheme) ? p.defaultTheme : (ids[0] ?? p.defaultTheme)
  try {
    const stored = localStorage.getItem(options.storageKey ?? THEME_STORAGE_KEY)
    return stored && ids.includes(stored) ? stored : fallback
  } catch {
    return fallback
  }
}
