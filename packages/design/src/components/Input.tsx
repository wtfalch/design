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
 */
import { forwardRef } from 'react'

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
  className?: string
}

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { size = 'md', mono, block, className, type = 'text', ...rest },
  ref,
) {
  const classes = [
    size === 'md' ? '' : `size-${size}`,
    mono ? 'mono' : '',
    block ? 'block' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return <input ref={ref} type={type} className={classes || undefined} {...rest} />
})

export default Input
