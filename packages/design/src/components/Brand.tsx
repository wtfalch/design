import { BRAND_MARKS, BRAND_NAMES, type BrandName } from './brandMarks'

/**
 * A product's mark, at header size.
 *
 * One component for every wtfalch product: `name` picks the mark out of
 * `brandMarks.ts`, and adding a product is adding a row there. The default is
 * `tf` because it is the first, not because it is special.
 *
 * `currentColor`, so the stylesheet decides the colour and a theme can move
 * it; the mark itself knows nothing about green. No `width` or `height`
 * attributes either: the viewBox is the ink box, measured, and `.brand` sets
 * a height off the type scale so the width follows the aspect.
 *
 * Still, on purpose. Until 0.2.0 this component also morphed tf's mark into a
 * cog under the pointer, which made a shared package carry one product's
 * animation. That morph is tf's own `Brand` now, layered over this path; a
 * product that wants its mark to move does the same in its own code, and the
 * package stays the source of the still shape every product's icon is drawn
 * from.
 *
 * Stroked or filled, whichever the mark is. tf's is one line at a weight;
 * valet's is a filled badge with the shirt cut out of it and the bow inside
 * the cut, one path under `evenodd` so the surface shows through the shirt.
 * Both are `currentColor`, so `.brand` still decides the colour and a theme
 * can still move it -- a second colour would be the one thing a theme could
 * not reach.
 *
 * A product's entry, `@wtfalch/design/<product>`, exports this with the
 * product's name as the default, so a header there writes `<Brand />` and
 * gets its own mark. Here the default is the first row.
 */
export default function Brand({
  name = BRAND_NAMES[0],
  title,
  className,
}: {
  /** Which product's mark. */
  name?: BrandName
  /** The product's name, which is what a screen reader should say the header
   *  starts with. There is no text beside this to repeat it. */
  title?: string
  className?: string
}) {
  const mark = BRAND_MARKS[name]
  const said = title ?? name
  return (
    <svg
      className={`brand${className ? ` ${className}` : ''}`}
      viewBox={mark.view}
      fill="none"
      role="img"
      aria-label={said}
    >
      <title>{said}</title>
      {'fill' in mark ? (
        <path d={mark.d} fill="currentColor" fillRule={mark.fill} />
      ) : (
        <path
          d={mark.d}
          stroke="currentColor"
          strokeWidth={mark.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}
