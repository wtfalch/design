/**
 * The icon set, held to one optical size.
 *
 * Six hand-drawn icon components at six different optical sizes is where this
 * started. Every glyph is now measured -- its `view` is the drawn extent, not
 * the source file's viewBox -- so a set of them sits together at 14px. Ported
 * from tf's `icons.test.ts`.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { ICON_NAMES } from '../src/components/iconNames'

const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(resolve(here, '../src/art/tf-icons.ts'), 'utf8')
const gallery = readFileSync(resolve(here, '../../../gallery/src/specimens.tsx'), 'utf8')

/* `name: {` and then the nearest `view: '…'` before the entry closes. tf's
   original regex matched a one-line form the file had before biome ever
   formatted it; the table is `name: {` over `view:` now, and one entry
   (`minimize`) carries a comment between the two. The interface's own
   `view: string` has no two-space `name: {` before it, so it is not counted. */
const views = [...src.matchAll(/^ {2}'?([a-z-]+)'?: \{[^}]*?view: '([^']+)'/gm)].map((m) => ({
  name: m[1],
  view: m[2],
}))

describe('the icons', () => {
  it('every name has a glyph, and every glyph has a name', () => {
    expect(ICON_NAMES.length).toBeGreaterThanOrEqual(19)
    expect(views.map((v) => v.name).sort()).toEqual([...ICON_NAMES].sort())
  })

  it('no glyph kept the viewBox it shipped with', () => {
    for (const { name, view } of views) {
      const parts = view.split(' ').map(Number)
      expect(parts, `${name}: view is not "x y w h"`).toHaveLength(4)
      expect(parts.every(Number.isFinite), `${name}: view has a non-number`).toBe(true)
      const [, , w, h] = parts
      expect(w, `${name}: icons are square, so the view must be`).toBe(h)
      /* A view at the origin with the source's size means the glyph was pasted
         rather than measured. `minimize` is a bare line that genuinely fills
         its box. */
      const shipped = parts[0] === 0 && parts[1] === 0 && (w === 20 || w === 26)
      expect(!shipped || name === 'minimize', `${name}: this is the source viewBox`).toBe(true)
    }
  })

  it('no glyph is drawn at a wildly different size from the rest', () => {
    for (const { name, view } of views) {
      const side = Number(view.split(' ')[2])
      expect(side, `${name}: view side ${side} is outside the set's range`).toBeGreaterThanOrEqual(
        13,
      )
      expect(side, `${name}: view side ${side} is outside the set's range`).toBeLessThanOrEqual(31)
    }
  })

  it('the catalogue shows the whole set, not a list somebody typed', () => {
    // A hand-written list already omitted five icons once, and a catalogue that
    // shows less than the set is how somebody concludes an icon does not exist
    // and draws it again.
    expect(gallery).toMatch(/ICON_NAMES\.map/)
  })
})
