'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

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

import { useEffect, useRef, useState } from 'react'
import { Switch } from 'react-aria-components'

/** The knob's diameter per size, as `toggle.css` draws it. The drag needs it
 *  to turn pixels into a position: the knob travels the track's inner width
 *  less itself and its 2px of margin at each end. */
const KNOB = { sm: 10, md: 12, lg: 16 } as const
/** Under this many pixels of horizontal travel a press is a tap. It was 3,
 *  and a plain click carries that much hand jitter -- so a click on the knob
 *  became a drag, the knob twitched toward the pointer and settled by which
 *  side it was on, and the switch felt as if it wanted to be dragged rather
 *  than pressed. Six is over the jitter and still a third of the way across
 *  the shortest track. */
const SLOP = 6

export default function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
  said,
  labelHidden,
  size = 'md',
  inRow,
  className,
}: {
  label: React.ReactNode
  /** What it does, or what turning it off costs. Under the label, in the same
   *  column, so a long explanation does not push the switch off its row. */
  hint?: React.ReactNode
  checked: boolean
  /** Returning a promise moves the knob at once and marks the row busy until it
   *  settles: a rejection puts the knob back, a resolution holds it until
   *  `checked` catches up. A plain return leaves everything to the caller. */
  onChange: (on: boolean) => void | Promise<void>
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
  /** Sitting in a row of controls rather than in a column of settings.
   *
   *  This was a rule keyed on the container -- `.row > .switch-row` -- which
   *  meant the package reaching through a class the caller had to know to
   *  write, and `.row` is not a class this package hands out. A prop says the
   *  same thing and travels with the component. */
  inRow?: boolean
  className?: string
}) {
  /* React Aria's `Switch` is the `<label>`: it owns a visually-hidden
     `<input type="checkbox" role="switch">` and stamps `data-selected`,
     `data-disabled`, `data-focus-visible` and `data-pressed` on the label. So
     the track is no longer the input drawn with `appearance: none` -- it is a
     plain span, and `toggle.css` reads the state off the row instead of off
     `:checked`. The row is the label either way, which keeps the words as the
     hit area. */
  /* Dragging the knob.

     React Aria's `Switch` is a press: down and up on the label toggles, and a
     pointer that wanders in between is still a press. A switch drawn as a
     track and a knob invites the other gesture -- drag the knob across -- and
     nothing answered it. So the track handles its own pointer: on down it
     stops the event before the label's press begins and captures the pointer.
     Under `SLOP` pixels of movement it is a tap and toggles on release; past
     it, the knob follows the pointer through `--knob-x` and the side it is on
     at release is the answer. Either way the click the browser fires afterwards
     is swallowed, so the label does not toggle it a second time -- and it has
     to be handled here rather than left to the label, because once the press
     is stopped at the track a tap on the knob no longer reaches the input by
     itself (measured, in `keyboard.spec.ts`).

     **The knob goes where the pointer is, not where the pointer has been.**
     This measured the drag as a delta from the knob's resting side, which made
     a click that drifted a few pixels answer the opposite of the click: press
     the far side of an off switch, wander seven pixels, and the delta is about
     zero, so it resolves to off -- it refuses the very thing you pressed. And
     it refuses *silently*, because the knob is back where it started and
     nothing on screen says a gesture was even seen. Reading the pointer's
     position on the track instead means a press and a press-with-a-wobble give
     the same answer, which is the one the pointer is over.

     `onChange` is called once per gesture, or not at all if the knob was put
     back where it started -- a consumer that saves on change must not see a
     drag as two saves. The keyboard is untouched: the input is still the
     switch. */
  /* The optimistic half, copied from chef-monorepo's `Toggle` on 2026-09-05.

     A switch applies as it moves, and what it applies is usually a request.
     Waiting for the reply before moving the knob makes every switch feel
     broken for the length of a round trip; moving it and forgetting makes a
     failed request look like a success. So: if `onChange` returns a promise,
     the knob moves now and the row is busy -- `aria-busy` on the input, chef's
     sweep around the rim of the track (`.toggle-sweep`), no second press --
     until it settles. A rejection
     puts the knob back. A resolution HOLDS the optimistic value until `checked`
     changes, because a resolved save does not mean the caller's state has
     caught up (a refetch is a second round trip), and clearing on resolve
     would snap the knob back and forward again. An optimistic value can outlive
     a successful save and never a failed one. `onChange` returning nothing is
     the old contract, untouched. */
  const [optimistic, setOptimistic] = useState<boolean | null>(null)
  const [pending, setPending] = useState(false)
  const [seen, setSeen] = useState(checked)
  if (checked !== seen) {
    setSeen(checked)
    if (optimistic !== null) setOptimistic(null)
  }
  const shown = optimistic ?? checked
  const commit = (on: boolean) => {
    const result = onChange(on)
    if (!(result instanceof Promise)) return
    setOptimistic(on)
    setPending(true)
    result.then(
      () => setPending(false),
      () => {
        setPending(false)
        setOptimistic(null)
      },
    )
  }

  /* `aria-busy` on the input and `data-pending` on the row, set on the elements
     because React Aria's `filterDOMProps` drops both in silence -- the trap
     `Button` documents for `aria-busy`. */
  const rowRef = useRef<HTMLLabelElement>(null)
  useEffect(() => {
    const row = rowRef.current
    const input = row?.querySelector('input')
    if (!row || !input) return
    if (pending) {
      row.setAttribute('data-pending', 'true')
      input.setAttribute('aria-busy', 'true')
    } else {
      row.removeAttribute('data-pending')
      input.removeAttribute('aria-busy')
    }
  }, [pending])

  const [knob, setKnob] = useState<number | null>(null)
  const [held, setHeld] = useState(false)
  const gesture = useRef<{
    id: number
    startX: number
    startY: number
    moved: boolean
  } | null>(null)
  const swallowClick = useRef(false)

  /** Where the knob would sit, 0 to 1, if its centre were under `x`. The
   *  2px and the knob's width are the inset `toggle.css` draws it at:
   *  `left: calc(2px + var(--knob-x) * var(--knob-travel))`. */
  const position = (track: HTMLSpanElement, x: number) => {
    const box = track.getBoundingClientRect()
    const knobWidth = KNOB[size]
    const travel = box.width - knobWidth - 4
    if (travel <= 0) return 0
    return Math.min(1, Math.max(0, (x - box.left - 2 - knobWidth / 2) / travel))
  }

  return (
    <Switch
      ref={rowRef}
      className={`switch-row switch-${size}${inRow ? ' switch-in-row' : ''}${className ? ` ${className}` : ''}`}
      isSelected={shown}
      onChange={commit}
      isDisabled={disabled}
      /* Read-only, not disabled, while a request is out: focus stays where it
         is and the row does not dim, it just refuses a second answer until
         the first has been taken. */
      isReadOnly={pending}
    >
      <span className={labelHidden ? 'sr-only' : 'switch-body'}>
        <span className="text-text">{label}</span>
        {hint && <span className="switch-hint">{hint}</span>}
      </span>
      {said && <span className="flex-none text-xs text-muted mono">{said}</span>}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: the track is aria-hidden and takes no focus -- the keyboard operates the input; onClick here only swallows the click a gesture leaves behind */}
      <span
        className="toggle"
        aria-hidden="true"
        data-held={held || undefined}
        data-dragging={knob === null ? undefined : true}
        style={knob === null ? undefined : ({ '--knob-x': knob } as React.CSSProperties)}
        onPointerDown={(e) => {
          if (disabled || pending || e.button !== 0) return
          e.stopPropagation()
          e.currentTarget.setPointerCapture(e.pointerId)
          gesture.current = {
            id: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            moved: false,
          }
          setHeld(true)
        }}
        onPointerMove={(e) => {
          const g = gesture.current
          if (!g || e.pointerId !== g.id) return
          if (!g.moved) {
            const dx = e.clientX - g.startX
            const dy = e.clientY - g.startY
            /* Mostly sideways and past the slop, or it is still a press. The
               slop is what keeps a click a click: under it nothing is drawn
               and nothing moves, so a hand that is not quite still does not
               turn a press into a drag. */
            if (Math.abs(dx) < SLOP || Math.abs(dx) <= Math.abs(dy)) return
            g.moved = true
          }
          setKnob(position(e.currentTarget, e.clientX))
        }}
        onPointerUp={(e) => {
          const g = gesture.current
          if (!g || e.pointerId !== g.id) return
          gesture.current = null
          setHeld(false)
          setKnob(null)
          swallowClick.current = true
          const on = g.moved ? position(e.currentTarget, e.clientX) > 0.5 : !shown
          if (on !== shown) commit(on)
        }}
        onPointerCancel={() => {
          gesture.current = null
          setHeld(false)
          setKnob(null)
        }}
        onClick={(e) => {
          if (!swallowClick.current) return
          swallowClick.current = false
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {pending && <span className="toggle-sweep" />}
      </span>
    </Switch>
  )
}
