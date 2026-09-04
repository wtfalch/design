/**
 * What the URL is asking for, and what there is to ask for.
 *
 * A sibling module rather than exports beside the component, because a module
 * that exports both a component and a value loses its Fast Refresh boundary --
 * editing it re-runs every importer instead of swapping the component in place.
 * `fastRefresh.test.ts` enforces that, and caught this file the day it was
 * written. `iconNames.ts` and `tourMarker.ts` are here for the same reason.
 */
import { COMPONENTS } from './specimens'

export interface Target {
  component: string
  variant: string
  theme: string
  /** False when `chrome=0` — the rail, the picker and the headings all go. */
  chrome: boolean
}

/**
 * What the URL is asking for, or `null` for the ordinary gallery.
 *
 * Read from the query string rather than the hash, because the hash already
 * means "which component" for a human browsing and overloading it would make
 * one of the two behaviours a special case of the other. A query string also
 * survives being handed to Playwright's `page.goto` without escaping.
 */
export function readTarget(search = window.location.search): Target | null {
  const q = new URLSearchParams(search)
  const component = q.get('c')
  const variant = q.get('v')
  if (!component || !variant) return null
  return {
    component,
    variant,
    theme: q.get('theme') || 'system',
    chrome: q.get('chrome') !== '0',
  }
}

/** Every (component, variant) pair, for a test that wants to enumerate them
 *  without importing React. The suite reads this rather than a list somebody
 *  maintains by hand, so adding a variant adds a screenshot. */
export function manifest(): { c: string; v: string }[] {
  return COMPONENTS.flatMap((c) => c.variants.map((v) => ({ c: c.id, v: v.name })))
}
