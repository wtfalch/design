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
  return (
    <div className={['shell', className].filter(Boolean).join(' ')}>
      <header className="shell-head">
        <div className={`shell-head-inner${wide ? ' shell-wide' : ''}`}>
          {brand}
          {who && <div className="shell-who">{who}</div>}
        </div>
        {nav && <div className={`shell-nav${wide ? ' shell-wide' : ''}`}>{nav}</div>}
      </header>
      <main className={`shell-main${wide ? ' shell-wide' : ''}`}>{children}</main>
    </div>
  )
}
