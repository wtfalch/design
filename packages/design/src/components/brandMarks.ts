/**
 * The shape of a mark. The marks themselves belong to the products.
 *
 * Until 0.17.0 this module was the table of every wtfalch product's mark, and
 * adding a product was adding a row here. The surfaces multiplied, each with
 * its own mark and its own themes, and every one of them became a release of
 * this package. A product now declares its mark beside its themes, in its own
 * repo, with `defineProduct`; `Brand` draws whichever mark it is handed.
 *
 * A mark is a path in its own ink box, drawn with `currentColor` at the stroke
 * weight it was designed at, so the stylesheet decides the colour and a theme
 * can move it. Or filled: a mark that is a figure rather than a line carries a
 * fill rule instead of a weight.
 *
 * A product that animates its mark does that in its own code: otf's
 * lowercase otf becomes a cog under the pointer, and that morph is
 * `otf/dashboard/src/components/Brand.tsx`, not this package's business.
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
