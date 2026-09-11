'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

/**
 * A box with a reason to exist.
 *
 * `.card` was CSS and nothing else, so every caller assembled its own header:
 * a `<div className="row">`, a `<div className="ctl-grow">`, a title in a
 * `truncate` span and a description in a `muted mono` div, with the spacing
 * retyped each time. Four variants of that shape existed and no two agreed on
 * the gap between the title and the line under it.
 *
 * **`title` and `description` are props, so the parts are named.** The same
 * argument as `Field`: a component that takes a heading and a sentence cannot
 * put them in the wrong order or forget to associate them, and a caller that
 * only has a heading does not have to remember which wrapper it goes in.
 *
 * **The icon is optional and it is decoration.** `aria-hidden`, always — a card
 * with `icon="image"` beside a title that says "A model that draws" is the same
 * word twice to a screen reader. It is there to make a page of cards scannable
 * by shape, which is a thing eyes do and readers do not.
 */

import Icon, { type IconName } from './Icon'

export default function Card({
  icon,
  title,
  description,
  action,
  children,
  tone,
  onClick,
  selected,
  className,
}: {
  icon?: IconName
  title?: React.ReactNode
  /** One or two sentences under the title. What this is for, or what pressing
   *  the thing inside it will do. */
  description?: React.ReactNode
  /** The control the card is about — a switch, usually. Far right, centred
   *  against the whole heading block rather than against the title, so it does
   *  not drift up when the description runs to two lines. */
  action?: React.ReactNode
  children?: React.ReactNode
  /** `bad` for the one that failed — a card in a list, not a whole screen.
   *  `warn` for a card whose contents want reading before touching: the
   *  same colours `Callout` uses for the tone, so the card reads as the
   *  callout it replaces. */
  tone?: 'bad' | 'warn'
  /** Makes the card itself the choice. Rendered as a button, so it has a
   *  keyboard and a focus ring rather than a hover state and nothing else. */
  onClick?: () => void
  selected?: boolean
  className?: string
}) {
  const body = children && <div className="grid gap-3">{children}</div>

  /* `mb-3` when something follows, which is what `.card-head:not(:last-child)`
     was saying. The component knows whether there is a body; a structural
     pseudo-class was working that out from the DOM. */
  const head = (title || description || action) && (
    <div className={`card-head flex items-start gap-3${body ? ' mb-3' : ''}`}>
      {icon && (
        <span className="card-icon" aria-hidden="true">
          <Icon name={icon} size={20} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {title && <strong className="card-title">{title}</strong>}
        {description && <div className="card-desc">{description}</div>}
      </div>
      {/* Centred against the whole heading block, not the title: a switch
          aligned to the first line drifts upward the moment the description
          runs to two. */}
      {action && <div className="flex-none self-center flex items-center">{action}</div>}
    </div>
  )

  /* `card` stays as the hook: the tones, the pick and selected states, and
     `:has(.card-icon)` indenting an inline row past the icon, are all either
     a `color-mix` or a relationship between elements. What is here is the
     card's own box -- and `display: block` with `width: 100%` matter, because
     a pressable card is a `<button>`, which shrink-wraps: a row of cards
     became a row of labels the moment one gained an `onClick`. */
  const cls = [
    'card',
    onClick ? 'card-pick' : '',
    selected ? 'card-on' : '',
    tone ? `card-${tone}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (onClick) {
    return (
      <button type="button" className={cls} aria-pressed={selected} onClick={onClick}>
        {head}
        {body}
      </button>
    )
  }

  return (
    <div className={cls}>
      {head}
      {body}
    </div>
  )
}
