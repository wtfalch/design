/**
 * Content for assistive technology alone -- present in the accessibility
 * tree, invisible on screen.
 *
 * The package already draws this seven times over, each one reaching for the
 * private `sr-only` rule because "hide it but keep the name" kept needing
 * writing again: `Field`'s own label when `labelHidden` is set, the switch's
 * label in `Toggle`, the slider's label in `Slider`, both live
 * regions `ToastHost` announces through in `Toast`, and a table's `<caption>`
 * plus a quiet column header in `Table`. A consumer wanting the same thing --
 * an icon-only button whose name is a line of real text rather than a bare
 * `aria-label` string, so it can be inspected, translated and read like any
 * other copy -- had no way to ask for it: `test/privateClasses.test.ts` fails
 * on anything outside the package that names a class, and this package hands
 * out components, not classes.
 *
 * `display: none` and `visibility: hidden` both remove a node from the
 * accessibility tree along with the screen, which is the opposite of the
 * point. This clips it to a single pixel and pushes it off in every direction
 * instead, so a screen reader still finds it.
 */
export default function VisuallyHidden({
  as: Tag = 'span',
  children,
  className,
}: {
  /** `div` for a place a block element is wanted; the wrapper is inline by
   *  default because that is what sits beside an icon without breaking its
   *  line. */
  as?: 'span' | 'div'
  children: React.ReactNode
  className?: string
}) {
  return <Tag className={`sr-only${className ? ` ${className}` : ''}`}>{children}</Tag>
}
