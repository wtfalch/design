'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

/**
 * The bare control `Field` wraps.
 *
 * Almost every input in the app was labelled by its placeholder, which
 * disappears the moment you type — so the one time you want to know what a
 * field was for is the one time it is gone. `Field` is the fix: it draws the
 * label, wires the description and the error with `aria-describedby`, and
 * hands this component the `id` and `aria-invalid` to carry. On its own,
 * `Input` is for the rare box whose surroundings already name it, and it needs
 * an `aria-label` then, because an input with no accessible name is the first
 * thing an audit finds and the last thing a sighted person notices.
 *
 * **A plain `<input>`, deliberately.** The stylesheet styles inputs by element
 * — hover, focus, disabled, the invalid ring inside `.field-bad` — and every
 * one of those rules keeps working because nothing is wrapped. React Aria's
 * `Input` exists to take state from a `TextField` context; this component takes
 * its state from `Field`'s render prop instead, which works for a `Select` and
 * a `SizeGrid` too, and that is the contract the app already has.
 *
 * `type="text"` is the default, the way `type="button"` is `Button`'s: stated
 * so it is in the signature rather than inherited from the browser.
 *
 * **`type="password"` grows an eye.** A password field that cannot be read back
 * is a field you retype until it takes; the toggle is the one control every
 * sign-in form has grown and every hand-written one here lacked. The box is
 * still the same `<input>` -- `Field`'s wiring, the element rules, the ref all
 * land on it -- wrapped in a grid so the button can sit inside its right edge
 * without absolute positioning against a height that changes with `size`.
 *
 * The eye is a React Aria `ToggleButton`, not `Button`: a show/hide is a
 * pressed state, and `aria-pressed` is what a toggle announces. It is not
 * passed as a prop because `filterDOMProps` would drop it in silence -- the
 * same trap `aria-busy` fell into on `Button` -- and `ToggleButton` writes it
 * itself. The label stays "Show password" in both states, as a toggle's should:
 * a label that flips to "Hide password" *and* reads as pressed says the same
 * thing twice, once of them backwards. Revealed text is also told to stop
 * autocorrecting and capitalising, because a phone keyboard treats a visible
 * field as prose and rewrites the password it was asked to show.
 */
import { forwardRef, useState } from 'react'
import { ToggleButton } from 'react-aria-components'

import Icon, { type IconName } from './Icon'
import { useFieldWiring } from './fieldWiring'

export interface Props
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'className'> {
  /** The same three every control takes, so a row of mixed controls lines up
   *  without anyone measuring. */
  size?: 'sm' | 'md' | 'lg'
  /** Monospace, for a path, a token, an id — anything where the exact
   *  characters are the point. */
  mono?: boolean
  /** Full width of whatever holds it. Inputs already are, by default; this is
   *  for the `size`d ones, which are not. */
  block?: boolean
  /** A glyph inside the left edge. Decorative: it is `aria-hidden`, because
   *  a magnifier beside a field called "Search" is the label said twice. */
  icon?: IconName
  /** Empty it. Given, a clear button appears inside the right edge whenever
   *  the field has a value; the caller owns the value and does the clearing. */
  onClear?: () => void
  /** Inside the right edge, before the clear button. A `Kbd` saying what
   *  opens this, which is what the mail client's `.mail-search-key` was. */
  trailing?: React.ReactNode
  className?: string
  /** Accepted and not rendered. `Field`'s render prop hands a caller every
   *  piece of its wiring at once, and the documented way to use it is
   *  `<Field>{(f) => <Input {...f} />}</Field>` -- so `labelId` arrives here
   *  whether or not this control wants it. `Select` does want it, because a
   *  button takes its name from its contents; an `<input>` does not, because
   *  `Field`'s `<label for>` already names it. Taking it out of the props is
   *  what keeps it off the DOM node: React passes through anything it does
   *  not recognise, and the browser got `labelid="…"` with a console warning
   *  on every field in valet and tf. */
  labelId?: string
}

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  {
    size = 'md',
    mono,
    block,
    className,
    type = 'text',
    icon,
    onClear,
    trailing,
    labelId: _labelId,
    ...rest
  },
  ref,
) {
  /* What the `Field` above wired, when the caller did not thread it by hand.
     Explicit props win: a caller that named an `id` meant that id, and a
     render-prop `Field` spreading its wiring is passing the same values in
     anyway. This is the fallback, not an override. */
  const field = useFieldWiring()
  const wired = {
    id: rest.id ?? field?.id,
    'aria-describedby': rest['aria-describedby'] ?? field?.['aria-describedby'],
    'aria-invalid': rest['aria-invalid'] ?? field?.['aria-invalid'],
  }
  const classes = [
    size === 'md' ? '' : `size-${size}`,
    mono ? 'mono' : '',
    block ? 'ctl-block' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  /* State lives here even for a text input, so switching a field's `type` at
     run time does not remount it -- a hook count that changes with a prop is a
     React error, and a remount would drop the caret. */
  const [shown, setShown] = useState(false)

  const glyph = { sm: 14, md: 16, lg: 18 }[size]

  if (type !== 'password') {
    const box = (
      <input ref={ref} type={type} className={classes || undefined} {...rest} {...wired} />
    )
    if (!icon && !onClear && !trailing) return box

    /* Something to clear, rather than something that could be cleared: a
       clear button over an empty field is a control that does nothing. Both
       shapes of value are checked because either may be the caller's. */
    const filled =
      rest.value !== undefined
        ? String(rest.value).length > 0
        : String(rest.defaultValue ?? '').length > 0

    return (
      <span
        className={`adorned adorned-${size}${block ? ' ctl-block' : ''}${icon ? ' adorned-icon' : ''}`}
      >
        {icon && <Icon name={icon} size={glyph} className="adorned-mark" aria-hidden />}
        {box}
        {(trailing || (onClear && filled)) && (
          <span className="adorned-end">
            {trailing}
            {onClear && filled && (
              <button
                type="button"
                className="icon-btn adorned-clear"
                aria-label="Clear"
                onClick={onClear}
                disabled={rest.disabled}
              >
                <Icon name="close" size={glyph} />
              </button>
            )}
          </span>
        )}
      </span>
    )
  }

  return (
    <span className={`secret secret-${size}${block ? ' ctl-block' : ''}`}>
      <input
        ref={ref}
        type={shown ? 'text' : 'password'}
        className={classes || undefined}
        /* Only while revealed: as a password these are moot, and setting them
           on a password field makes some browsers stop offering to fill it. */
        autoCapitalize={shown ? 'off' : undefined}
        autoCorrect={shown ? 'off' : undefined}
        spellCheck={shown ? false : undefined}
        {...rest}
        /* After `rest`, always. `wired` already prefers what the caller
           passed, and spreading `rest` last would put its `undefined` id
           back over the one the field wired -- a key present with an
           undefined value still overwrites. */
        {...wired}
      />
      <ToggleButton
        className={`icon-btn secret-eye${size === 'md' ? '' : ` size-${size}`}`}
        aria-label="Show password"
        isSelected={shown}
        onChange={setShown}
        isDisabled={rest.disabled}
      >
        <Icon name={shown ? 'eye-off' : 'eye'} size={glyph} />
      </ToggleButton>
    </span>
  )
})

export default Input
