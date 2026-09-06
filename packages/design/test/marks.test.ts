import { describe, expect, it } from 'vitest'
import { BRAND_MARKS, BRAND_NAMES } from '../src/components/brandMarks'

/**
 * The table of marks. tf's own `brandMark.test.ts` reads tf's row out of the
 * compiled copy of it, so the table is where every product's path lives.
 */
describe('the marks', () => {
  it('holds every product, tf first', () => {
    expect(BRAND_NAMES).toEqual(['tf', 'valet'])
  })

  it('each is one path in a measured box, stroked or filled', () => {
    for (const [name, m] of Object.entries(BRAND_MARKS)) {
      const parts = m.view.split(' ').map(Number)
      expect(parts, `${name}: view is x y w h`).toHaveLength(4)
      expect(parts.every(Number.isFinite), `${name}: view is numbers`).toBe(true)
      expect(m.d.startsWith('M'), `${name}: has a path`).toBe(true)
      if ('fill' in m) expect(['evenodd', 'nonzero']).toContain(m.fill)
      else expect(m.stroke).toBeGreaterThan(0)
    }
  })

  it("valet's badge is one even-odd path of five closed subpaths filling its canvas", () => {
    const m = BRAND_MARKS.valet
    expect(m.view).toBe('0 0 1024 1024')
    expect(m.fill).toBe('evenodd')
    // the jacket, the shirt, two wings and the knot
    expect(m.d.match(/M/g)).toHaveLength(5)
    expect(m.d.match(/Z/g)).toHaveLength(5)
    expect(m.d.startsWith('M236 0 H788')).toBe(true)
  })
})
