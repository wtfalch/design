'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

/**
 * A key, or a chord, drawn the way the app draws one.
 *
 * The rule already existed twice. `Menu` had `.menu-key` and `Command` had
 * `.cmd-key`, and the two declaration blocks were identical down to the
 * property order -- the same mono face, the same `--text-2xs`, the same
 * `--muted`, the same tracking. Neither was reachable: `Keyboard` came from
 * React Aria and the class was internal, so a consumer wanting to say "press
 * ⌘K" beside its own search box had nothing to import and drew a third one.
 * The mail client's `.keys` and `.mail-search-key` are that third one.
 *
 * **It is `<kbd>`, which is the whole point.** A styled `<span>` reads as a
 * word; `<kbd>` says "this is something you press", and a screen reader can
 * treat it accordingly. React Aria's `Keyboard` renders the element and
 * carries the slot wiring that lets `Menu` and `Command` place it, so this is
 * that component with the package's class on it rather than a new one.
 *
 * **It draws the reminder; it does not bind anything.** Same contract as
 * `Menu`'s `shortcut` and `Command`'s: what actually listens for the chord is
 * the app's business, and a component that both drew a key and bound it would
 * be two things. Nothing here reads the keyboard.
 */

import { Keyboard } from 'react-aria-components'

export default function Kbd({
  children,
  className,
}: {
  /** The chord as it should read. `⌘K`, `Ctrl+K`, `Esc`. The package does not
   *  translate between platforms: which modifier this machine calls what is a
   *  fact the app knows and this component does not. */
  children: React.ReactNode
  className?: string
}) {
  return <Keyboard className={['kbd', className].filter(Boolean).join(' ')}>{children}</Keyboard>
}
