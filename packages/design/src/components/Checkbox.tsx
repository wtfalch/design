'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

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
 *
 * **It can post itself.** `checked`/`onChange` were required and there was no
 * `name`, which made this component unusable in a plain `<form action=…>`:
 * with nothing to submit under, a caller wanting one boolean in a Server
 * Action had to render `<input type="checkbox" name="x">` by hand and wrap it
 * in its own `<label>`. That is exactly the native tick box this component
 * exists to replace, and it reappeared the moment the form was uncontrolled —
 * manage's break-glass form carried one, with a comment explaining why it had
 * to. So `name` and `value` are passed through, and `checked` is optional:
 * give it `checked` and `onChange` for a controlled box, `defaultChecked` (or
 * neither) for one the form reads at submit.
 */

import { Checkbox as AriaCheckbox } from 'react-aria-components'

export default function Checkbox({
  label,
  hint,
  meta,
  checked,
  defaultChecked,
  onChange,
  name,
  value,
  disabled,
  tile,
  className,
}: {
  label: React.ReactNode
  /** What choosing it means, or what it costs. Under the name. `hint`, the
   *  word `Toggle`, `Slider` and `Field` use for the same line; it was `why`. */
  hint?: React.ReactNode
  /** A quieter third line — a path, a size, an id. */
  meta?: React.ReactNode
  /** Controlled. Omit it, with `name`, for a box a form reads at submit. */
  checked?: boolean
  /** The uncontrolled starting state. Ignored when `checked` is given. */
  defaultChecked?: boolean
  onChange?: (on: boolean) => void
  /** What the form submits this under. Without it there is nothing to post,
   *  which is what sent callers back to a native tick box. */
  name?: string
  /** What the form submits when it is ticked. The browser's default is `on`,
   *  which is rarely the word a Server Action wants to read. */
  value?: string
  disabled?: boolean
  /** In a grid of tiles rather than a run of full-width rows.
   *
   *  The tick is positioned at the top right, and in a full-width row the
   *  label never reaches it. In a tile it runs underneath, so the body needs
   *  the room reserved. This was a `.choice-tiles .choice-body` rule, which
   *  meant the package styling its own component through a class the caller
   *  had to know to write on the container -- and there is no such container
   *  component, so the class was only ever a private name in a consumer's
   *  markup. A prop says the same thing and belongs to the component. */
  tile?: boolean
  className?: string
}) {
  /* React Aria's `Checkbox` is the `<label>`. It keeps the real input in the
     markup and visually hidden -- exactly the arrangement this component
     already had by hand -- and stamps `data-selected`, `data-focus-visible`
     and `data-disabled` on the row. The ring and the tick are still drawn by
     the row's `::after` and `::before`; `checkbox.css` now reads the state off
     those attributes instead of `:has(input:checked)`. */
  return (
    <AriaCheckbox
      className={`choice${tile ? ' choice-tile' : ''}${className ? ` ${className}` : ''}`}
      /* `undefined` is what makes React Aria leave the box uncontrolled, so
         the controlled and uncontrolled cases are the same call: pass both and
         let whichever was given decide. Passing `isSelected={false}` here
         instead would silently pin every uncontrolled box to off. */
      isSelected={checked}
      defaultSelected={defaultChecked}
      onChange={onChange}
      name={name}
      value={value}
      isDisabled={disabled}
    >
      <span className="choice-body">
        <span className="choice-name">{label}</span>
        {hint && <span className="choice-why">{hint}</span>}
        {meta && <span className="text-muted text-xs font-mono">{meta}</span>}
      </span>
    </AriaCheckbox>
  )
}
