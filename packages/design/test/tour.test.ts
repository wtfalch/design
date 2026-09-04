/**
 * The tour's memory, held to the three things that went wrong with it.
 *
 * Ported from tf's `tour.test.ts`. The case that reads tf's `App.tsx` -- that
 * onboarding calls `forgetTour()` -- stays in tf, because the call site is
 * tf's; the marker's own contract is here.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const tour = readFileSync(resolve(here, '../src/components/tourMarker.ts'), 'utf8')

describe('the tour marker', () => {
  it('forgetTour removes the key the gate reads', () => {
    const key = tour.match(/const SEEN = '([^']+)'/)?.[1]
    expect(key, 'the marker key must be a named constant').toBeTruthy()
    expect(tour).toMatch(/export function forgetTour\(\)[\s\S]*?localStorage\.removeItem\(SEEN\)/)
    const literals = [...tour.matchAll(/'tf-tour-seen'/g)].length
    expect(literals, 'the key is written once, not as a second copy that can drift').toBe(1)
  })

  it('storage refusing is never an error anybody has to handle', () => {
    // Private mode throws on localStorage; every access is wrapped.
    for (const fn of ['tourSeen', 'markTourSeen', 'forgetTour']) {
      const body = tour.match(
        new RegExp(`export function ${fn}\\([^)]*\\)[^{]*\\{([\\s\\S]*?)\\n\\}`),
      )?.[1]
      expect(body, `${fn} not found`).toBeTruthy()
      expect(body, `${fn} touches localStorage without a try`).toMatch(/try \{/)
    }
  })
})
