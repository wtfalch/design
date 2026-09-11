/**
 * The frame a signed-in surface stands in: a header, and the page under it.
 *
 * Three apps have one, all called `shell.tsx`, all the same six elements. The
 * differences were a wider variant in manage and where each put the theme
 * control, which is a prop and a slot, not three components.
 *
 * **It gates nothing, and that is worth stating because a frame looks like
 * the place to.** A layout cannot reliably stop the page beneath it
 * rendering, so every page decides for itself who may see it. Putting a check
 * here would read as protection and provide none. All three app docblocks say
 * this; it moves with the component.
 *
 * **A `<header>` and a `<main>`, so the landmarks exist.** Hand-built
 * versions reached for `<div>` often enough that this is the second reason to
 * have one: "skip to content" and a screen reader's landmark list both come
 * from the elements, and neither is visible to the person who wrote the div.
 *
 * Server-renderable: no hooks, no handlers. `who` and `brand` are slots, so
 * the client parts an app needs -- a user menu, the theme switch -- are the
 * app's to pass and stay its own client boundaries.
 */

export default function Shell({
  brand,
  who,
  nav,
  wide = false,
  children,
  className,
}: {
  /** Top left: the product's name or mark, usually a link home. */
  brand?: React.ReactNode
  /** Top right: who is signed in, the theme, whatever else is chrome. */
  who?: React.ReactNode
  /** A row under the header, for an app whose pages hang off a context --
   *  manage's organisation nav is this. */
  nav?: React.ReactNode
  /** A wider measure, for a page that is a table rather than a form. */
  wide?: boolean
  children: React.ReactNode
  className?: string
}) {
  /* Utilities: this component is layout and nothing else, which is where they
     earn their place. The measure is the one thing that is not a utility --
     it is a number two elements have to agree on, so it is a custom property
     on the frame rather than a literal repeated in three class lists, which
     is how manage ended up with `head-inner-wide` and `main-wide` as separate
     classes and had to remember both. */
  const measure = wide ? 'max-w-[var(--shell-measure-wide)]' : 'max-w-[var(--shell-measure)]'
  const band = `w-full mx-auto px-4 ${measure}`

  return (
    <div
      className={['shell flex flex-col min-h-screen surface-bg text-text', className]
        .filter(Boolean)
        .join(' ')}
    >
      {/* `flex-none`, so a long page does not squeeze the header. */}
      <header className="flex-none border-b border-border surface-panel">
        <div className={`${band} flex items-center justify-between gap-4 py-3 min-w-0`}>
          {brand}
          {who && <div className="flex items-center gap-3 min-w-0">{who}</div>}
        </div>
        {nav && <div className={`${band} pb-2`}>{nav}</div>}
      </header>
      {/* `min-w-0` because a flex child will not shrink below its content, and
          one wide table inside then pushes the whole page sideways. */}
      <main className={`${band} flex-1 py-6 min-w-0`}>{children}</main>
    </div>
  )
}
