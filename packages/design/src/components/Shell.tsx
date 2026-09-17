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
 *
 * **`side` is the same kind of slot, additive.** A `SideList` beside `main`
 * is what an app with more places than `nav`'s one row can hold wants
 * instead -- Manage's redesign is the case this was built for. `Shell`
 * itself stays a layout, not a state holder: it does not know the rail
 * collapses to a menu button on a phone, only that when `side` is present
 * there is a column to make room for at `md` and up. `SideList.Trigger` is
 * what the app puts in `who` to open the phone sheet -- it renders and
 * hides itself, so an app never writes the breakpoint by hand; `SideList`'s
 * own docblock explains why the button has to live in `who` rather than in
 * `side` itself.
 *
 * **`context` is a third slot in the header's own row, fixed between `brand`
 * and `who`.** It exists so an app can answer "where am I" up there --
 * Manage's version of it is which organisation the signed-in person is
 * currently in, a plain name or a switcher depending on how many there are --
 * but `Shell` takes only a node here and never learns what an organisation
 * is; that word belongs to the app, not the package. Optional and additive
 * like `side`: leave it out and the row renders exactly as it did before this
 * existed, `brand` and `who` do not move when it appears, and it takes
 * whichever space they leave rather than any of its own, so a long value
 * ellipses instead of wrapping the band or pushing `who` off the edge.
 *
 * **The header knows about the rail too, at the same breakpoint.** Below
 * `md` it is the one band it always was. At `md` and up, with `side`
 * present, it splits into a brand zone the rail's own width and padding --
 * so `brand` sits directly above the docked column instead of inside
 * `band`'s independently-centred measure -- and a second band, sharing
 * `main`'s, for `context`, `who` and `nav`. Two static copies switched by
 * breakpoint, the way `SideList` itself is a rail and a sheet rather than one
 * thing that moves. `context` sits in both copies the same way `who` does --
 * next to `brand` below `md`, in the second band beside `who` at `md` and up.
 */

export default function Shell({
  brand,
  context,
  who,
  nav,
  side,
  wide = false,
  children,
  className,
}: {
  /** Top left: the product's name or mark, usually a link home. */
  brand?: React.ReactNode
  /** Between `brand` and `who`: whatever answers "where am I" for this app --
   *  Manage's is which organisation the signed-in person is in, a name or a
   *  switcher depending on how many there are. `Shell` only renders the node
   *  it is given here and never learns the word "organisation" itself.
   *  Omit it and the header renders exactly as it did before this existed;
   *  supply it and `brand`/`who` hold their positions while it takes the
   *  space between them, truncating rather than wrapping the band. */
  context?: React.ReactNode
  /** Top right: who is signed in, the theme, whatever else is chrome. */
  who?: React.ReactNode
  /** A row under the header, for an app whose pages hang off a context --
   *  manage's organisation nav is this. */
  nav?: React.ReactNode
  /** A column beside `main`, docked from `md` up -- a `SideList`, usually.
   *  Omit it and `Shell` renders exactly as it did before this existed. */
  side?: React.ReactNode
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
        {side ? (
          <>
            {/* Below `md` there is no docked rail -- `SideList.Trigger` in
                `who` is the only way to the places, and the header is the
                same band-centred markup a `Shell` with no `side` renders. */}
            <div className="shell-head-phone">
              <div className={`${band} flex items-center justify-between gap-4 py-3 min-w-0`}>
                {brand}
                {context && <div className="shell-head-context">{context}</div>}
                {who && <div className="flex items-center gap-3 min-w-0">{who}</div>}
              </div>
              {nav && <div className={`${band} pb-2`}>{nav}</div>}
            </div>
            {/* `md` and up: the rail is docked, so the header splits to sit
                above it -- a brand zone exactly `--shell-side-width` wide,
                padded the way `.side-list-switcher` and
                `.side-list-groups-inner` pad their own content (`px-3`,
                `var(--space-3)`), so the brand lines up with the rail rather
                than with `band`'s independently-centred measure. The rest of
                the header -- `who`, and `nav` if present -- shares `band`
                with `main`, so the header's right edge lines up with
                `main`'s the same way the rail's left edge lines up with the
                brand's. Two copies of the same content, hidden by breakpoint
                rather than switched by script, the way `SideList` itself
                renders its rail and its sheet -- `Shell` stays server-
                renderable, with no hook deciding which one drew.

                **`shell-head-phone`/`shell-head-wide`, not `md:hidden` and
                `hidden md:block`.** Those two utilities have to be generated
                by the consuming app's own Tailwind build, and the app never
                writes them -- they live only in this file, which its content
                scan does not read. `manage` already carries a hand-written
                `@media` block restoring `.shell-side` and `.side-list-rail`
                for exactly this reason. These two get the display rule from
                `shell.css`, which ships with the package, so there is nothing
                for a consumer to restore. */}
            <div className="shell-head-wide">
              <div className="flex items-center min-w-0">
                <div className="flex-none w-[var(--shell-side-width)] px-3 py-3 flex items-center min-w-0">
                  {brand}
                </div>
                <div className={`${band} flex items-center justify-end gap-4 py-3 min-w-0`}>
                  {context && <div className="shell-head-context">{context}</div>}
                  {who && <div className="flex items-center gap-3 min-w-0">{who}</div>}
                </div>
              </div>
              {nav && (
                <div className="flex min-w-0">
                  <div className="flex-none w-[var(--shell-side-width)]" />
                  <div className={`${band} pb-2`}>{nav}</div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={`${band} flex items-center justify-between gap-4 py-3 min-w-0`}>
            {brand}
            {context && <div className="shell-head-context">{context}</div>}
            {who && <div className="flex items-center gap-3 min-w-0">{who}</div>}
          </div>
        )}
        {!side && nav && <div className={`${band} pb-2`}>{nav}</div>}
      </header>
      {/* `min-w-0` because a flex child will not shrink below its content, and
          one wide table inside then pushes the whole page sideways. */}
      {side ? (
        /* A row wrapping the rail and `main`, rather than a rail sitting
           beside `band`'s own centred measure -- so `main` still centres
           itself in whatever width is left, the way it always has, and a
           `Shell` with no `side` renders the identical markup it did before
           this branch existed. */
        <div className="flex-1 min-h-0 flex min-w-0">
          {/* `md:block`, not `md:flex`: this wrapper has exactly one child and
              does not need a flex formatting context of its own -- giving it
              one made it a *row* (the default direction), whose cross axis is
              height, not width, so the rail inside stopped stretching to fill
              it and sat at its own content width instead. The divider under
              `SideList`'s switcher and the current-item highlight both read
              as narrower than the column for this one reason: a block box
              fills its container's width by default and needed nothing else. */}
          <div className="shell-side hidden md:block md:flex-none w-[var(--shell-side-width)] border-r border-border surface-panel overflow-hidden">
            {side}
          </div>
          <main className={`${band} flex-1 py-6 min-w-0`}>{children}</main>
        </div>
      ) : (
        <main className={`${band} flex-1 py-6 min-w-0`}>{children}</main>
      )}
    </div>
  )
}
