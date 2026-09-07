/**
 * Which page buttons a pager draws.
 *
 * The arithmetic worth testing on its own, because every mistake in it is an
 * off-by-one that ships looking plausible: a pager missing its last page, or
 * one whose width changes as you move through it so the button under the
 * cursor is not the one you pressed.
 */
import { describe, expect, it } from 'vitest'

import { isGap, pageWindow } from '../src/components/pageWindow'

describe('pageWindow', () => {
  it('lists every page when they fit', () => {
    expect(pageWindow(1, 1)).toEqual([1])
    expect(pageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('always keeps the first and the last', () => {
    for (const current of [1, 5, 13, 26]) {
      const window = pageWindow(current, 26)
      expect(window[0]).toBe(1)
      expect(window[window.length - 1]).toBe(26)
    }
  })

  it('elides with a gap rather than dropping pages silently', () => {
    expect(pageWindow(13, 26)).toEqual([1, { jumpTo: 6 }, 12, 13, 14, { jumpTo: 20 }, 26])
  })

  it('sends each gap to the middle of the run it hides', () => {
    // The only page an ellipsis standing for a range can honestly claim to be
    // about, and what makes page 17 of 26 two presses away instead of eleven.
    const [, left, , , , right] = pageWindow(13, 26)
    expect(left).toEqual({ jumpTo: 6 }) // hides 2–11
    expect(right).toEqual({ jumpTo: 20 }) // hides 15–25
  })

  it('never sends a gap to a page that is already drawn', () => {
    for (const pages of [8, 12, 26, 400]) {
      for (const current of [1, 2, 5, Math.floor(pages / 2), pages - 1, pages]) {
        const window = pageWindow(current, pages)
        const drawn = new Set(window.filter((slot): slot is number => !isGap(slot)))
        for (const slot of window) {
          if (!isGap(slot)) continue
          expect(drawn.has(slot.jumpTo)).toBe(false)
          expect(slot.jumpTo).toBeGreaterThanOrEqual(1)
          expect(slot.jumpTo).toBeLessThanOrEqual(pages)
        }
      }
    }
  })

  it('keeps the row the same width wherever you are', () => {
    // A row that grows and shrinks moves the button under the cursor between
    // clicks, which is how somebody lands two pages from where they meant.
    const widths = new Set([1, 2, 3, 8, 13, 20, 24, 25, 26].map((p) => pageWindow(p, 26).length))
    expect([...widths]).toEqual([7])
  })

  it('shows a run at the start and at the end rather than one page and a gap', () => {
    // Four rather than three, because an end has one gap instead of two and
    // the run has to be one longer to hold the row at seven.
    expect(pageWindow(1, 26)).toEqual([1, 2, 3, 4, 5, { jumpTo: 15 }, 26])
    expect(pageWindow(26, 26)).toEqual([1, { jumpTo: 11 }, 22, 23, 24, 25, 26])
  })

  it('never names a page that does not exist', () => {
    for (const pages of [8, 9, 12, 26, 400]) {
      for (const current of [1, 2, Math.floor(pages / 2), pages - 1, pages]) {
        for (const slot of pageWindow(current, pages)) {
          if (isGap(slot)) continue
          expect(slot).toBeGreaterThanOrEqual(1)
          expect(slot).toBeLessThanOrEqual(pages)
        }
      }
    }
  })

  it('is strictly increasing, with no repeats', () => {
    const pages = pageWindow(13, 26).filter((slot): slot is number => !isGap(slot))
    expect(pages).toEqual([...pages].sort((a, b) => a - b))
    expect(new Set(pages).size).toBe(pages.length)
  })

  it('includes the current page', () => {
    for (const current of [1, 2, 7, 13, 25, 26]) {
      expect(pageWindow(current, 26)).toContain(current)
    }
  })
})
