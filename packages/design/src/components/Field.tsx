'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

/**
 * A labelled input, its explanation, and what went wrong with it.
 *
 * **Almost every input in this app is labelled by its placeholder.**
 * `placeholder="name"`, `placeholder="command"`,
 * `placeholder="https://mcp.example.com/sse"` -- and a placeholder is not a
 * label. It disappears the moment somebody types, so the one time you most want
 * to know what a field was for is the one time it is gone: reviewing what you
 * filled in. Half-finished forms are full of fields nobody can identify without
 * clearing them first. Assistive technology treats it as a last-resort fallback
 * for the same reason.
 *
 * **And thirty errors are red text sitting near a field, associated with
 * nothing.** `<div className="set-hint" style={{ color: 'var(--bad)' }}>` says
 * something is wrong to anyone looking directly at it, and says nothing at all
 * to a screen reader on the input itself: no `aria-invalid`, no
 * `aria-describedby`, so you can tab into a field the form has rejected and be
 * told only its name. Colour alone carrying the meaning is the same failure in
 * the other direction.
 *
 * So: the label is an element, the description and the error are wired to the
 * input with `aria-describedby`, and a field in error says so with
 * `aria-invalid` as well as with red.
 *
 * **The description sits above the input and the error below it**, in the order
 * they are wanted. The description is what you read before typing -- under the
 * field it is behind the cursor, arriving after the decision it was meant to
 * inform. The error is the reply to what you typed, and a reply belongs after
 * the thing it answers. Both can show at once: the rule still holds while you
 * are breaking it.
 */

import { useId } from 'react'

import { type FieldWiring, FieldWiringContext } from './fieldWiring'

/* Re-exported here as well as from `fieldWiring.ts`, because this is where a
   caller looks for it and #12's test imports it from this module. A `export
   type` re-export is not a value export, so `Field.tsx` keeps the Fast
   Refresh boundary `fastRefresh.test.ts` holds it to -- which is what forced
   the hook and the context out of this file in the first place. */
export type { FieldWiring } from './fieldWiring'

export default function Field({
  label,
  hint,
  error,
  required,
  children,
  labelHidden,
  layout = 'stack',
  className,
}: {
  /** What the field is. Always given -- there is no unlabelled case, only
   *  fields whose label is hidden. */
  label: string
  /** What to put in it, or what it will do. Read before typing, so it is drawn
   *  above the input. */
  hint?: React.ReactNode
  /** What is wrong. Truthy switches the field into its invalid state. */
  error?: React.ReactNode
  required?: boolean
  /** For a field whose surroundings already name it -- a search box under a
   *  heading that says Search. Still announced, just not drawn. */
  labelHidden?: boolean
  /** `row` puts the label beside the control instead of above it, which is the
   *  shape a settings pane wants: a column of names down the left and their
   *  controls down the right, scannable as a list of what is set rather than a
   *  form to fill in. Same element, same wiring, same guarantees -- the only
   *  thing that changes is where the label sits. */
  layout?: 'stack' | 'row'
  /**
   * The control.
   *
   * **Elements, or a function.** Elements are the shape to reach for: a
   * function cannot cross the server boundary, so a render prop made every
   * page with a form a client component whether or not it needed to be, and
   * all three apps' `design.ts` say so in the same sentence. Plain children
   * read the wiring from context instead, and the package's own controls
   * apply it when the caller has not named an `id`:
   *
   *     <Field label="Region" hint="Cannot be changed later">
   *       <Select name="region" defaultValue="sg">…</Select>
   *     </Field>
   *
   * The function form stays, unchanged and not deprecated. It is still the
   * answer for a control the package does not own, or for a caller that
   * needs the ids for something else -- a `<datalist>` to point at, a label
   * rendered somewhere the provider does not reach.
   */
  children: React.ReactNode | ((field: FieldWiring) => React.ReactNode)
  className?: string
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const labelId = `${id}-label`

  const wiring: FieldWiring = {
    id,
    labelId,
    /* Both, in reading order, when both are there. A field that has a rule
       and has broken it needs to say the rule too -- "must be a URL" on its
       own does not tell you what shape of URL. */
    'aria-describedby': [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined,
    'aria-invalid': error ? true : undefined,
  }

  return (
    <div
      className={`field field-${layout}-layout${error ? ' field-bad' : ''}${className ? ` ${className}` : ''}`}
    >
      <label id={labelId} className={labelHidden ? 'sr-only' : 'field-label'} htmlFor={id}>
        {label}
        {/* An asterisk on its own is a convention, not a word. The text is for
            anyone the convention was never explained to, which is most
            people. */}
        {required && (
          <span className="field-required" aria-label="required">
            {' '}
            *
          </span>
        )}
      </label>

      {hint && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}

      {typeof children === 'function' ? (
        children(wiring)
      ) : (
        <FieldWiringContext.Provider value={wiring}>{children}</FieldWiringContext.Provider>
      )}

      {/* `alert`, because this appears in response to something the reader just
          did and they are usually looking at the button, not the field. A
          `status` would wait its turn behind whatever else is being read. */}
      {error && (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
