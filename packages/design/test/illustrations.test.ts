/**
 * The art, held to what makes it themeable.
 *
 * Twenty-one Open Peeps figures can be in a themed app at all because they are
 * two colours -- ink and paper -- and take them from the page. A drawing that
 * carries a hex of its own is right in exactly one theme; one with a
 * hard-coded width does not scale. Ported from tf's `illustrations.test.ts`
 * when the package took ownership of the SVGs.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { ILLUSTRATIONS, ILLUSTRATION_SVG } from '../src/illustrations'

const DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../illustrations')
const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.svg'))
  .map((f) => f.slice(0, -4))
  .sort()

describe('the illustrations', () => {
  it('the generated module lists exactly what is in the folder', () => {
    expect([...ILLUSTRATIONS].sort()).toEqual(files)
    expect(Object.keys(ILLUSTRATION_SVG).sort()).toEqual(files)
  })

  it('no drawing carries a colour of its own', () => {
    for (const name of files) {
      const svg = readFileSync(join(DIR, `${name}.svg`), 'utf8')
      expect(svg, `${name}.svg has a baked hex colour`).not.toMatch(/#[0-9a-f]{3,6}\b/i)
      expect(svg, `${name}.svg has no ink`).toContain('class="ink"')
    }
  })

  it('every drawing scales', () => {
    for (const name of files) {
      const svg = readFileSync(join(DIR, `${name}.svg`), 'utf8')
      expect(svg, `${name}.svg has no viewBox`).toMatch(/viewBox="/)
      expect(svg, `${name}.svg has a hard-coded width`).not.toMatch(/<svg[^>]*\swidth="/)
    }
  })
})
