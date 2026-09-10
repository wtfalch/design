'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

/**
 * A person, said in one line.
 *
 * A name, an address and a coloured disc with their initials. It is a mail
 * client's most repeated object -- every row of a thread list, every header of
 * a message, every chip in a composer's To field -- and until there is one of
 * these it is written by hand at each of those, slightly differently, and the
 * initials are wrong in a different way at every site.
 *
 * **The colour is derived from the address, not chosen.** The same person is
 * the same colour in the list, in the header and in the composer, across
 * reloads and across machines, with nothing stored. That consistency is the
 * only thing the colour is for: it is a second, weaker cue that two rows are
 * from the same sender, which is worth something when scanning and worth
 * nothing if it changes.
 *
 * **The disc is `aria-hidden` and the initials are never read out.** "A L" is
 * not a name, and a screen reader that announces it before the name has made
 * every row of the list longer to listen to for no information at all.
 *
 * **Initials come from the name when there is one, and from the address when
 * there is not.** A contact with no display name is common -- most machine
 * senders have none -- and falling through to the first letter of the local
 * part beats an empty disc or a `?`.
 */

import { hueOf, initialsOf } from './initials'

export interface Props {
  /** The display name, when the message carried one. */
  name?: string | null
  address: string
  /** How much to show. `chip` is the composer's pill, `line` is a list row,
   *  `full` puts the address under the name for a message header. */
  kind?: 'chip' | 'line' | 'full'
  size?: 'sm' | 'md'
  /** Something after the name -- a time, a count, a `Pill`. */
  aside?: React.ReactNode
  /** For the composer: shows a remove button and calls this. */
  onRemove?: () => void
  className?: string
}

export default function Identity({
  name,
  address,
  kind = 'line',
  size = 'md',
  aside,
  onRemove,
  className,
}: Props) {
  const initials = initialsOf(name, address)
  const shown = name?.trim() || address

  return (
    <span
      className={`ident kind-${kind} size-${size}${className ? ` ${className}` : ''}`}
      /* The hue is a variable and the stylesheet decides what to do with it:
         a `background` written here would be a colour the theme cannot reach,
         and the discs would stay saturated on Paper. */
      style={{ '--ident-hue': hueOf(address) } as React.CSSProperties}
    >
      {/* Hidden from the accessible tree. The initials are a drawing of the
          name that follows, and reading them first makes every row longer to
          listen to for nothing. */}
      <span className="ident-disc" aria-hidden="true">
        {initials}
      </span>

      <span className="ident-text">
        <span className="ident-name">{shown}</span>
        {/* Only when the name is not already the address, or the row says the
            same thing twice. */}
        {kind === 'full' && shown !== address && <span className="ident-address">{address}</span>}
      </span>

      {aside && <span className="ident-aside">{aside}</span>}

      {onRemove && (
        <button
          type="button"
          className="ident-remove"
          onClick={onRemove}
          /* The address, not "Remove": a composer with six recipients has six
             of these, and six buttons all called "Remove" is a list a screen
             reader cannot choose from. */
          aria-label={`Remove ${shown}`}
        >
          <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              d="M6 6l12 12M18 6L6 18"
            />
          </svg>
        </button>
      )}
    </span>
  )
}
