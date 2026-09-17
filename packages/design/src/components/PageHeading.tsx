// A plain string, so Tailwind's scanner reads every utility. The last one in a
// template literal ran into `${` and was never emitted.
const LOOK = 'm-0 text-xl font-strong tracking-[-0.01em] wrap-anywhere'

/**
 * The page's `<h1>`, styled once.
 *
 * wtfalch-manage's signed-in pages each retyped the same margin, size, weight
 * and tracking classes on their own `<h1>` -- eighteen call sites, none of
 * them importing from another. A value that changes tomorrow meant editing
 * eighteen files and trusting a `grep` and eighteen human eyes to catch every
 * one; missing even one would leave a heading that looks right until it sits
 * beside its neighbours. This makes it a single component instead.
 *
 * `children` is `ReactNode`, not `string`: an org page puts a status `Pill`
 * beside the tenant's name inside its own heading, and that is the shape that
 * needs more than text.
 *
 * `as="p"` draws the same look without being a heading -- an organisation's
 * name at the top of a page that already has its own `<h1>`.
 */
export default function PageHeading({
  children,
  as: Tag = 'h1',
  className,
}: {
  children: React.ReactNode
  as?: 'h1' | 'p'
  className?: string
}) {
  return <Tag className={className ? `${LOOK} ${className}` : LOOK}>{children}</Tag>
}
