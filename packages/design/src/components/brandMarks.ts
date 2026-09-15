/**
 * The marks, one per wtfalch product.
 *
 * `@wtfalch/design` serves more than one product, so `Brand` cannot be one
 * product's logo -- it is the place every product's mark lives, and adding a
 * brand to the system is adding a row here. A mark is a path in its own ink
 * box, drawn with `currentColor` at the stroke weight it was designed at, so
 * the stylesheet decides the colour and a theme can move it. Or filled: a
 * mark that is a figure rather than a line carries a fill rule instead of a
 * weight, and `Brand` draws whichever it is handed.
 *
 * A product that animates its mark does that in its own code: otf's
 * lowercase otf becomes a cog under the pointer, and that morph is
 * `tf/dashboard/src/components/Brand.tsx`, not this package's business. What
 * ships here is the still mark, which is also what the product's app icon is
 * rendered from -- otf's `brandMark.test.ts` holds the icon, this row and its
 * own animated copy to one path.
 *
 * A sibling module rather than part of `Brand.tsx`, so that file keeps its
 * Fast Refresh boundary (`fastRefresh.test.ts`).
 */
/**
 * A mark: one path in its own ink box, stroked or filled.
 *
 * otf's is a stroke, one line at the weight it was drawn at. valet's is a
 * figure: a filled badge with the shirt cut out of it and the bow drawn back
 * inside the cut, which is one path under `evenodd` -- the jacket, the shirt
 * and the bow are subpaths, and the rule makes the shirt a hole the surface
 * shows through. Two shapes of the same thing, so `Brand` draws either in
 * `currentColor` and a product supplies the one its mark is.
 */
export type Mark = StrokeMark | FillMark

/** One line, at the weight it was drawn at. */
export interface StrokeMark {
  view: string
  d: string
  stroke: number
}

/** One filled path; `fill` is the rule that decides which subpaths are holes. */
export interface FillMark {
  view: string
  d: string
  fill: 'evenodd' | 'nonzero'
}

export const BRAND_MARKS = {
  /** A lowercase tf merged into an O, in one unbroken stroke. Both ends of
   *  the tf start on the O -- the crossbar runs left and folds down onto it,
   *  the stem runs up and turns right onto it -- and the 95 degrees of ring
   *  between those two points is left out, so the O reads as open across the
   *  top left rather than closed. One stroke, no loose ends. The view is the
   *  stroke's outer bounds, not the canvas: the stroke is 96 wide, so 48 of
   *  cap and arc on every side is already in these. */
  otf: {
    view: '69.3 -12.2 958.4 958.4',
    d: 'M470.2 43.0A120 120 0 0 0 372 161.0V620A100 100 0 0 0 572 620V330A92 92 0 0 1 756 330A100 100 0 0 1 656 430H248.6A120 120 0 0 0 132.9 582.0A431.2 431.2 0 1 0 470.2 43.0',
    stroke: 96,
  },
  /** valet's badge. The rounded square is the jacket, the shirt is cut out of
   *  it in an open collar that runs to the top edge, and the bow tie floats in
   *  the shirt just below the collar. One path under `evenodd` with five
   *  subpaths -- the jacket, the shirt, two wings and the knot -- so the shirt
   *  is a hole the surface shows through and the bow is drawn back inside it.
   *  Drawn 24-first, which is the header size: the 60 units of jacket over the
   *  bow are the pixel that keeps it a bow rather than a notch in the edge, and
   *  the collar rolls outward at the top so the shirt reads as lapels rather
   *  than a V. The view is the canvas, because the jacket fills it. */
  valet: {
    view: '0 0 1024 1024',
    d: 'M236 0 H788 A236 236 0 0 1 1024 236 V788 A236 236 0 0 1 788 1024 H236 A236 236 0 0 1 0 788 V236 A236 236 0 0 1 236 0 Z M234.2 0 L789.8 0 A16 16 0 0 1 805 21.1 C843.3 285.6 625.5 464.7 578.4 700.8 A70 70 0 0 1 445.6 700.8 C398.5 464.7 180.7 285.6 219 21.1 A16 16 0 0 1 234.2 0 Z M444 164.5 C376 162.7 327.4 127.5 322 127.5 A40 40 0 0 0 282 167.5 L282 272.5 A40 40 0 0 0 322 312.5 C327.4 312.5 376 277.4 444 275.5 Z M580 164.5 C648 162.7 696.6 127.5 702 127.5 A40 40 0 0 1 742 167.5 L742 272.5 A40 40 0 0 1 702 312.5 C696.6 312.5 648 277.4 580 275.5 Z M512 60 A68 68 0 0 1 580 128 V232 A68 68 0 0 1 512 300 A68 68 0 0 1 444 232 V128 A68 68 0 0 1 512 60 Z',
    fill: 'evenodd',
  },
} as const satisfies Record<string, Mark>

export type BrandName = keyof typeof BRAND_MARKS

export const BRAND_NAMES = Object.keys(BRAND_MARKS) as BrandName[]
