import { BRAND_MARKS, type BrandName } from './brandMarks'

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
 */
export default function Brand({
  name = 'tf',
  title = name,
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
  return (
    <svg
      className={`brand${className ? ` ${className}` : ''}`}
      viewBox={mark.view}
      fill="none"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path
        d={mark.d}
        stroke="currentColor"
        strokeWidth={mark.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
