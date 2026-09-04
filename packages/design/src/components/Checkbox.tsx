/**
 * Choose some of these, then press the button that applies them.
 *
 * The fourth component the gallery documented that nobody could import — and
 * this one is worse than the others, because the markup it documents was
 * *designed* to replace the native tick box and then never used anywhere. Four
 * places went on rendering `<input type="checkbox">` in a `.set-row` while
 * `.choice` sat in the stylesheet with a page of its own.
 *
 * **The native box is hidden, not styled.** A checkbox styles down to a square
 * and no further; the tick inside it is the operating system's, in its shape,
 * at its size. So the input is present and off-screen — it is what a keyboard
 * reaches and what a screen reader reads — and the ring and tick are drawn by
 * the row. Clicking anywhere in the row toggles it, because the row is the
 * `<label>`.
 *
 * **This is not a `Toggle`.** A switch is the action and applies as it moves; a
 * checkbox is an answer that applies when something else is pressed. If there
 * is no Save at the end of it, this is the wrong control — see `Toggle`.
 */

import { Checkbox as AriaCheckbox } from 'react-aria-components'

export default function Checkbox({
  label,
  why,
  meta,
  checked,
  onChange,
  disabled,
}: {
  label: React.ReactNode
  /** What choosing it means, or what it costs. Under the name. */
  why?: React.ReactNode
  /** A quieter third line — a path, a size, an id. */
  meta?: React.ReactNode
  checked: boolean
  onChange: (on: boolean) => void
  disabled?: boolean
}) {
  /* React Aria's `Checkbox` is the `<label>`. It keeps the real input in the
     markup and visually hidden -- exactly the arrangement this component
     already had by hand -- and stamps `data-selected`, `data-focus-visible`
     and `data-disabled` on the row. The ring and the tick are still drawn by
     the row's `::after` and `::before`; `checkbox.css` now reads the state off
     those attributes instead of `:has(input:checked)`. */
  return (
    <AriaCheckbox className="choice" isSelected={checked} onChange={onChange} isDisabled={disabled}>
      <span className="choice-body">
        <span className="choice-name">{label}</span>
        {why && <span className="choice-why">{why}</span>}
        {meta && <span className="choice-meta">{meta}</span>}
      </span>
    </AriaCheckbox>
  )
}
