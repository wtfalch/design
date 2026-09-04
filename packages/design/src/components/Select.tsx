import {
  Children,
  type ReactNode,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

/**
 * The app's select. A button and a list, not a `<select>`.
 *
 * It was a native select with `appearance: none` and our own chevron, which
 * styles the closed control and nothing else: **the open list belongs to the
 * operating system.** No CSS reaches it. So the one part you actually read --
 * thirty model ids, each with its capability tags -- was rendered in the
 * platform's font, at the platform's size, in the platform's colours, on a
 * white sheet in the middle of a dark app.
 *
 * **It keeps the old API on purpose.** Callers still pass `value`, `onChange`
 * and `<option>` children, and `onChange` still receives something with
 * `target.value`. There are thirty-odd call sites and this is a change of
 * appearance, not of contract -- a new API would have made it a migration.
 *
 * **The keyboard is the hard part, and it is why this is not a div with a click
 * handler.** A native select gives you arrows, Home, End, Escape, typeahead and
 * an announced role for free; a custom one owes every one of them. The ARIA
 * pattern is combobox-with-listbox, which is what a screen reader expects to
 * find when it lands on something that behaves like this.
 */

interface Choice {
  value: string
  label: ReactNode
  /** For typeahead and for the closed control, which cannot render a node. */
  text: string
  disabled?: boolean
}

/** Read `<option>` children into a list this can render itself. */
function readOptions(children: ReactNode): Choice[] {
  const out: Choice[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    const props = child.props as {
      value?: string | number
      children?: ReactNode
      disabled?: boolean
    }
    const label = props.children
    out.push({
      value: String(props.value ?? ''),
      label,
      text: typeof label === 'string' ? label : String(props.value ?? ''),
      disabled: props.disabled,
    })
  })
  return out
}

/* Named rather than inherited from `SelectHTMLAttributes`.
   The old signature spread every select attribute onto the element, which was
   free when that element was a `<select>` and is wrong now that it is a
   `<button>` -- `onCopy` alone is typed against a different element. Call sites
   pass five things between them, so five is what this takes. */
interface Props {
  block?: boolean
  /** The same scale buttons and inputs use, so a row of mixed controls lines
   *  up without anyone measuring. Absent means the default, `md`. */
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: ReactNode
  id?: string
  title?: string
  /** What this selects. Required in practice, though not by the type: a native
   *  `<select>` inherited a name from the `<label>` around it and a button does
   *  not, so every one of these announced itself as "combobox" and its current
   *  value with no indication of what it was for. */
  'aria-label'?: string
  /** ...or the id of something on screen that already says it, which is better:
   *  a visible label and an announced one that agree cannot drift. */
  'aria-labelledby'?: string
  disabled?: boolean
  value?: string | number
  defaultValue?: string | number
  onChange?: (event: { target: { value: string } }) => void
  /** Something drawn on each row of the open list, after the label, and
   *  nowhere else: the closed control shows the label alone. For a thing to do
   *  with an option that is not choosing it -- hearing a speaker -- and the
   *  reason it takes the value is so the caller can do it. The list picks on
   *  `pointerdown`; anything here that should not pick stops that event. Not
   *  reachable from the keyboard, which never focuses inside the list, so it
   *  must be a convenience beside a control that is. */
  aside?: (value: string) => ReactNode
}

export default function Select({
  block = false,
  size,
  className,
  children,
  value,
  defaultValue,
  onChange,
  disabled,
  id,
  title,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  aside,
}: Props) {
  const options = useMemo(() => readOptions(children), [children])
  /* Uncontrolled callers exist (`defaultValue`), so the chosen value lives here
     and `value` overrides it when given -- the same bargain the native element
     makes. */
  const [own, setOwn] = useState(() => String(defaultValue ?? options[0]?.value ?? ''))
  const chosen = value !== undefined ? String(value) : own

  const [open, setOpen] = useState(false)
  /* Where to draw the list, in viewport coordinates.
     It is rendered into `document.body` rather than beside the button, because
     an ancestor that scrolls or hides its overflow clips it -- and in this app
     that is not hypothetical: every settings pane scrolls, and the first place
     this was tried the list showed one row of three. Escaping the ancestors
     means positioning by hand, which is the trade. */
  const [box, setBox] = useState({ top: 0, left: 0, width: 0 })
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const typed = useRef({ text: '', at: 0 })

  const current = options.find((o) => o.value === chosen)

  const control = useRef<HTMLButtonElement>(null)

  /* Closing returns focus to the control, whichever way it closed.
     Choosing with the pointer left focus wherever the press landed -- on
     `document.body` in practice -- so the next Tab started from the top of the
     page rather than from the thing just used. Keyboard users lose their place
     silently, which is the kind of bug that is invisible to anyone testing with
     a mouse. */
  const close = useCallback(() => {
    setOpen(false)
    control.current?.focus()
  }, [])

  const pick = useCallback(
    (v: string) => {
      if (value === undefined) setOwn(v)
      onChange?.({ target: { value: v } })
      close()
    },
    [close, onChange, value],
  )

  // Opening lands on the chosen row rather than the first, which is where the
  // eye already is and where a native select would have put it.
  //
  // Keyed on what the options *are*, not on the array: `options` is read off
  // `children` on every render, so a parent re-rendering under an open list
  // -- a store publishing, a poll -- made a fresh array, re-ran this, and
  // snapped the highlight back to the chosen row while the pointer was three
  // rows down. The memo rules in CLAUDE.md keep parents quiet; this keeps
  // the list steady when one is not.
  const shape = options.map((o) => o.value).join('\n')
  useEffect(() => {
    if (!open) return
    const at = options.findIndex((o) => o.value === chosen)
    setActive(at >= 0 ? at : 0)
  }, [open, chosen, shape]) // `shape` stands for `options`; see above

  // Measured when it opens, and again if the window moves under it. Not on
  // scroll of every ancestor -- the list closes on an outside press anyway, and
  // a scroll listener per ancestor is a lot of bookkeeping for a menu that is
  // open for two seconds.
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const r = root.current?.getBoundingClientRect()
      if (!r) return
      setBox({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open])

  // Keep the active row in view without scrolling the page behind it.
  useLayoutEffect(() => {
    if (!open) return
    list.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  // Anywhere else closes it. `pointerdown` rather than `click`, so it closes on
  // the press instead of waiting for a release that may land somewhere else.
  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  const step = (from: number, by: number) => {
    const n = options.length
    for (let i = 1; i <= n; i++) {
      const at = (from + by * i + n * n) % n
      if (!options[at]?.disabled) return at
    }
    return from
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (disabled) return
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault()
        const by = e.key === 'ArrowDown' ? 1 : -1
        if (!open) {
          setOpen(true)
          return
        }
        setActive((a) => step(a, by))
        return
      }
      case 'Home':
      case 'End':
        if (!open) return
        e.preventDefault()
        setActive(step(e.key === 'Home' ? -1 : options.length, e.key === 'Home' ? 1 : -1))
        return
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!open) setOpen(true)
        else if (options[active] && !options[active].disabled) pick(options[active].value)
        return
      case 'Escape':
        if (open) {
          e.preventDefault()
          close()
        }
        return
      case 'Tab':
        setOpen(false)
        return
      default:
        break
    }
    /* Typeahead. A native select has it and people use it without knowing they
       do -- typing `qw` to reach `qwen3:4b` in a list of thirty. The buffer
       clears after a second, so `qq` means the second q-word rather than a word
       beginning `qq`. */
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const now = Date.now()
      typed.current.text =
        now - typed.current.at > 1000
          ? e.key.toLowerCase()
          : typed.current.text + e.key.toLowerCase()
      typed.current.at = now
      const at = options.findIndex(
        (o) => !o.disabled && o.text.toLowerCase().startsWith(typed.current.text),
      )
      if (at >= 0) {
        if (open) setActive(at)
        else pick(options[at].value)
      }
    }
  }

  const listId = `${id ?? 'sel'}-list`

  return (
    <div
      ref={root}
      className={`sel${block ? ' block' : ''}${open ? ' open' : ''}${className ? ` ${className}` : ''}`}
    >
      <button
        ref={control}
        type="button"
        title={title}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        id={id}
        className={`sel-control${size ? ` size-${size}` : ''}`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKey}
      >
        <span className="sel-value">{current?.label ?? current?.text ?? ''}</span>
        {/* Inline rather than a component: one path, used here and nowhere
            else. `Caret` was a module and an export for exactly this. */}
        <svg className="sel-caret" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m6 9 6 6 6-6"
          />
        </svg>
      </button>

      {open &&
        createPortal(
          <ul
            className="sel-list"
            id={listId}
            role="listbox"
            ref={list}
            tabIndex={-1}
            style={{ top: box.top, left: box.left, minWidth: box.width }}
          >
            {options.map((o, i) => (
              <li
                key={o.value + i}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={o.value === chosen}
                aria-disabled={o.disabled || undefined}
                data-active={i === active}
                className={`sel-item${o.value === chosen ? ' on' : ''}${o.disabled ? ' off' : ''}`}
                /* `pointerdown`, not `click`: the button keeps focus, so the
                 outside-press handler does not close the list underneath the
                 press that was choosing from it. */
                onPointerDown={(e) => {
                  e.preventDefault()
                  if (!o.disabled) pick(o.value)
                }}
                onPointerEnter={() => !o.disabled && setActive(i)}
              >
                <span className="sel-item-label">{o.label}</span>
                <svg
                  className="sel-tick"
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  aria-hidden="true"
                >
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m5 13 4 4 10-10"
                  />
                </svg>
                {/* After the tick, so it is flush with the row's edge rather
                  than floating a tick's width in from it. The tick holds its
                  place whether or not it is drawn, so nothing shifts when the
                  choice moves. */}
                {aside?.(o.value)}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  )
}
