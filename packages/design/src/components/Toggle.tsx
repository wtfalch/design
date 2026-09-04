/**
 * A setting that takes effect as it moves.
 *
 * **A checkbox and a switch are not the same control, and the difference is not
 * visual.** A checkbox collects an answer: you tick it, and it applies when you
 * press Save. A switch *is* the action — flipping it changes the thing, now,
 * and there is nothing to confirm afterwards. That is why a switch reads as on
 * or off rather than ticked or blank: the two states are both settled, and
 * neither is a draft.
 *
 * Six settings in this app saved the moment they changed and were all drawn as
 * tick boxes: whether an applet is enabled, whether it reaches the internet,
 * whether a tool is granted, whether a server is trusted. Every one of them
 * promised a Save button that does not
 * exist. The header's status panel (gone since 2026-09-03) was the only one
 * that had it right, in a comment nobody else read.
 *
 * **`role="switch"`, so it is announced as one.** A screen reader says "on" and
 * "off" instead of "checked" and "not checked" — which is the same distinction
 * in words, and the only signal a non-visual reader gets that pressing it does
 * something immediately.
 *
 * **The label is the hit area.** A 30×18 target fails the minimum on its own,
 * and reaching for the words is what people do anyway.
 *
 * **One switch, or several checkboxes.** A lone binary setting is a switch. A
 * set you pick from is a list of checkboxes — fifteen switches in a column read
 * as fifteen unrelated settings rather than one choice with fifteen parts. See
 * `Checkbox`.
 */

import { Switch } from 'react-aria-components'

export default function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
  said,
  labelHidden,
  size = 'md',
}: {
  label: React.ReactNode
  /** What it does, or what turning it off costs. Under the label, in the same
   *  column, so a long explanation does not push the switch off its row. */
  hint?: React.ReactNode
  checked: boolean
  onChange: (on: boolean) => void
  disabled?: boolean
  /** The state in words, beside the switch.
   *
   *  Only where nothing else already says it. A switch that is a `Card`'s
   *  action has a title above it naming what it governs and a description
   *  saying what happens either way — a third word beside the switch is the
   *  same fact a third time, in the one place it does not fit. The header's
   *  status panel kept it because there the row was the whole component; it
   *  is gone, and the gallery's specimen is the one caller left. */
  said?: React.ReactNode
  labelHidden?: boolean
  /** The same three the rest of the controls take. `sm` for a switch in a
   *  toolbar or a dense row; `lg` where it is the only thing on the screen. */
  size?: 'sm' | 'md' | 'lg'
}) {
  /* React Aria's `Switch` is the `<label>`: it owns a visually-hidden
     `<input type="checkbox" role="switch">` and stamps `data-selected`,
     `data-disabled`, `data-focus-visible` and `data-pressed` on the label. So
     the track is no longer the input drawn with `appearance: none` -- it is a
     plain span, and `toggle.css` reads the state off the row instead of off
     `:checked`. The row is the label either way, which keeps the words as the
     hit area. */
  return (
    <Switch
      className={`switch-row switch-${size}`}
      isSelected={checked}
      onChange={onChange}
      isDisabled={disabled}
    >
      <span className={labelHidden ? 'sr-only' : 'switch-body'}>
        <span className="switch-label">{label}</span>
        {hint && <span className="switch-hint">{hint}</span>}
      </span>
      {said && <span className="switch-said mono">{said}</span>}
      <span className="toggle" aria-hidden="true" />
    </Switch>
  )
}
