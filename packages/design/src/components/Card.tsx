/**
 * A box with a reason to exist.
 *
 * `.card` was CSS and nothing else, so every caller assembled its own header:
 * a `<div className="row">`, a `<div className="grow">`, a title in a
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
  const head = (title || description || action) && (
    <div className="card-head">
      {icon && (
        <span className="card-icon" aria-hidden="true">
          <Icon name={icon} size={20} />
        </span>
      )}
      <div className="card-headings">
        {title && <strong className="card-title">{title}</strong>}
        {description && <div className="card-desc">{description}</div>}
      </div>
      {action && <div className="card-action">{action}</div>}
    </div>
  )

  const cls = `card${onClick ? ' card-pick' : ''}${selected ? ' card-on' : ''}${tone ? ` card-${tone}` : ''}${className ? ` ${className}` : ''}`

  const body = children && <div className="card-body">{children}</div>

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
