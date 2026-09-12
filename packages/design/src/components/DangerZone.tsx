'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

import { type ReactNode, useState } from 'react'
import Button from './Button'
import Field from './Field'
import Input from './Input'

/**
 * The bottom of a settings panel, where the things that cannot be undone live.
 *
 * One bordered section with its actions divided inside it, rather than a box
 * per action. Three tiles of red furniture stacked down a pane read as three
 * warnings; one section with three things in it reads as a place — which is
 * the point, because a place is somewhere you have to go.
 *
 * The same shape as the one in valet, and deliberately: these are the same
 * decision in two products, and a person who has learned to be careful in one
 * should not have to learn it again in the other.
 *
 * What differs is what a confirmation costs. Typing a name is the right price
 * for something with no undo and the wrong one for something with an obvious
 * undo — so the section says up front which of its actions are which, and each
 * asks for what it is worth.
 */
export default function DangerZone({
  /** Which of these can be taken back, said before anything is pressed. */
  note,
  children,
  className,
}: {
  note: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`danger-zone${className ? ` ${className}` : ''}`}>
      <div className="danger-zone-head">
        <h3>Danger zone</h3>
        <p className="set-hint">{note}</p>
      </div>
      {children}
    </section>
  )
}

/**
 * One thing that can be done here, and what it costs.
 *
 * `confirm` is the whole of the difference between them:
 *
 * - `click` — a second press, for something with a way back. The button says
 *   what it will do rather than "Are you sure?", because a person reading
 *   "Remove" twice has read what it removes.
 * - `type` — the name, for something with no way back. A second click in the
 *   same place as the first is a reflex; writing the thing out is the only
 *   confirmation that requires having read what it is.
 */
export function DangerAction({
  title,
  description,
  /** Not destructive at all — rename, edit. No confirmation, no red. */
  kind = 'destructive',
  confirm = 'click',
  /** What must be typed, when `confirm` is `type`. */
  match,
  label,
  busyLabel,
  busy = false,
  disabled = false,
  onConfirm,
  /** Rendered instead of the controls, saying why this cannot be done. */
  unavailable,
}: {
  /** `title` and `description`, the words `Card`, `Modal` and `Dialog` use;
   *  they were `heading` and `body`. */
  title: string
  description: ReactNode
  /** `kind`, like `Button`: a role, not a colour. */
  kind?: 'destructive' | 'plain'
  confirm?: 'click' | 'type' | 'none'
  match?: string
  label: string
  busyLabel?: string
  busy?: boolean
  disabled?: boolean
  onConfirm: () => void
  unavailable?: ReactNode
}) {
  const [asking, setAsking] = useState(false)
  const [typed, setTyped] = useState('')

  return (
    <div className={`danger-act${kind === 'plain' ? ' plain' : ''}`}>
      <h4>{title}</h4>
      <div className="set-hint">{description}</div>

      {unavailable ? (
        <div className="set-hint mt-2">{unavailable}</div>
      ) : confirm === 'type' ? (
        <>
          <div className="row danger-row field-row">
            <Field
              label="Confirm"
              hint={
                <>
                  Type <code className="mono danger-name">{match}</code> to confirm.
                </>
              }
            >
              {(f) => (
                <Input
                  {...f}
                  mono
                  value={typed}
                  disabled={disabled || busy}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => setTyped(e.target.value)}
                />
              )}
            </Field>
            <Button
              kind="danger"
              isDisabled={disabled || busy || typed.trim() !== match}
              onPress={onConfirm}
            >
              {busy ? (busyLabel ?? '…') : label}
            </Button>
          </div>
        </>
      ) : confirm === 'none' ? (
        <div className="row danger-row">
          <Button
            kind={kind === 'plain' ? 'primary' : 'danger'}
            isDisabled={disabled || busy}
            onPress={onConfirm}
          >
            {busy ? (busyLabel ?? '…') : label}
          </Button>
        </div>
      ) : asking ? (
        <div className="row danger-row">
          <Button kind="danger" isDisabled={disabled || busy} onPress={onConfirm}>
            {busy ? (busyLabel ?? '…') : label}
          </Button>
          <Button isDisabled={disabled || busy} onPress={() => setAsking(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="row danger-row">
          <Button kind="danger" isDisabled={disabled || busy} onPress={() => setAsking(true)}>
            {label}
          </Button>
        </div>
      )}
    </div>
  )
}
