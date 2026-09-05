/**
 * The marks, one per wtfalch product.
 *
 * `@wtfalch/design` serves more than one product, so `Brand` cannot be one
 * product's logo -- it is the place every product's mark lives, and adding a
 * brand to the system is adding a row here. A mark is a path in its own ink
 * box, drawn with `currentColor` at the stroke weight it was designed at, so
 * the stylesheet decides the colour and a theme can move it.
 *
 * A product that animates its mark does that in its own code: tf's lowercase
 * tf becomes a cog under the pointer, and that morph is
 * `tf/dashboard/src/components/Brand.tsx`, not this package's business. What
 * ships here is the still mark, which is also what the product's app icon is
 * rendered from -- tf's `brandMark.test.ts` holds the icon, this row and its
 * own animated copy to one path.
 *
 * A sibling module rather than part of `Brand.tsx`, so that file keeps its
 * Fast Refresh boundary (`fastRefresh.test.ts`).
 */
export const BRAND_MARKS = {
  /** A lowercase tf in one unbroken stroke -- down the t, round the foot, up
   *  the f, over its head, and back along the crossbar through both stems.
   *  The view is the stroke's outer bounds, not the canvas: the stroke is 96
   *  wide, so 48 of cap and arc on every side is already in these. */
  tf: {
    view: '248 190 556 578',
    d: 'M372 262V620A100 100 0 0 0 572 620V330A92 92 0 0 1 756 330A100 100 0 0 1 656 430H296',
    stroke: 96,
  },
} as const

export type BrandName = keyof typeof BRAND_MARKS

export const BRAND_NAMES = Object.keys(BRAND_MARKS) as BrandName[]
