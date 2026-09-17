import type { Mark } from './brandMarks'

/**
 * A product's mark, at header size.
 *
 * One component for every wtfalch product: `mark` is the path, which the
 * product declares beside its themes. Until 0.17.0 `name` picked the mark out
 * of a table in this package, which made every new product's logo a release
 * here.
 *
 * `currentColor`, so the stylesheet decides the colour and a theme can move
 * it; the mark itself knows nothing about green. No `width` or `height`
 * attributes either: the viewBox is the ink box, measured, and `.brand` sets
 * a height off the type scale so the width follows the aspect.
 *
 * Still, on purpose. Until 0.2.0 this component also morphed otf's mark into a
 * cog under the pointer, which made a shared package carry one product's
 * animation. That morph is otf's own `Brand` now, layered over this path; a
 * product that wants its mark to move does the same in its own code, and the
 * package stays the source of the still shape every product's icon is drawn
 * from.
 *
 * Stroked or filled, whichever the mark is. otf's is one line at a weight;
 * valet's is a filled badge with the shirt cut out of it and the bow inside
 * the cut, one path under `evenodd` so the surface shows through the shirt.
 * Both are `currentColor`, so `.brand` still decides the colour and a theme
 * can still move it -- a second colour would be the one thing a theme could
 * not reach.
 *
 * `bindProduct` returns this with the product's mark and name as the
 * defaults, so a header there writes `<Brand />` and gets its own mark.
 */
export default function Brand({
  mark,
  title,
  className,
}: {
  /** The product's mark. */
  mark: Mark
  /** The product's name, which is what a screen reader should say the header
   *  starts with. There is no text beside this to repeat it. */
  title: string
  className?: string
}) {
  return (
    <svg
      className={`brand${className ? ` ${className}` : ''}`}
      viewBox={mark.view}
      fill="none"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
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
