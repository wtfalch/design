import { Children, type ReactNode, isValidElement, useEffect, useRef } from 'react'

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

import {
  Select as AriaSelect,
  Button,
  ListBox,
  ListBoxItem,
  Popover,
  SelectValue,
} from 'react-aria-components'

interface Props {
  block?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** `<option>`s, exactly as a native select takes them. The children are the
   *  API and React Aria's items are the implementation; `readOptions` is the
   *  seam between them. */
  children?: ReactNode
  id?: string
  title?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  disabled?: boolean
  value?: string | number
  defaultValue?: string | number
  /** Native-select-shaped on purpose -- `e.target.value` -- because that is
   *  what every call site was written against when this *was* a `<select>`. */
  onChange?: (event: { target: { value: string } }) => void
  /** Something to the right of an option -- a play button beside a voice. */
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
  const options = readOptions(children)

  /* `title`, set on the element: React Aria's `Button` takes `id` and the
     `aria-*` labelling props and filters the rest, the same `filterDOMProps`
     that dropped `aria-busy` on `Button` and `aria-modal` on `Modal`. */
  const control = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const el = control.current
    if (!el) return
    if (title) el.title = title
    else el.removeAttribute('title')
  }, [title])

  /* React Aria owns what was 13 KB of hand-rolled behaviour: the popover is
     positioned against the button and flips when the edge is near, which the
     measured-rectangle `top`/`left` could not; typeahead, Home and End, the
     arrows, Escape, outside-press and focus restore are all its. What stays
     is the seam -- `<option>` children in, `{target: {value}}` out -- because
     the call sites were written against a native select and there is no
     reason to make them care that it is not one any more.

     `sel-value` and the caret are the same markup as before, so the closed
     control is pixel-identical; the list is the same markup with React Aria's
     state attributes where the classes were. */
  return (
    <AriaSelect
      className={`sel${block ? ' block' : ''}${className ? ` ${className}` : ''}`}
      selectedKey={value !== undefined ? String(value) : undefined}
      defaultSelectedKey={
        defaultValue !== undefined ? String(defaultValue) : (options[0]?.value ?? undefined)
      }
      onSelectionChange={(key) => {
        if (key !== null) onChange?.({ target: { value: String(key) } })
      }}
      isDisabled={disabled}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      <Button ref={control} id={id} className={`sel-control${size ? ` size-${size}` : ''}`}>
        <SelectValue className="sel-value">
          {({ selectedText, defaultChildren }) => selectedText ?? defaultChildren}
        </SelectValue>
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
      </Button>
      {/* `maxHeight` as a prop, because React Aria writes it inline -- to the
          space left in the viewport, 733px on a laptop -- and an inline style
          beats the sheet's `max-height: 280px` cap. The cap is the sheet's
          decision: a list taller than that is a list you scroll, not one that
          runs to the bottom of the screen. */}
      <Popover className="sel-list" placement="bottom start" offset={4} maxHeight={280}>
        <ListBox className="sel-listbox">
          {options.map((o) => (
            <ListBoxItem
              key={o.value}
              id={o.value}
              textValue={o.text}
              isDisabled={o.disabled}
              className="sel-item"
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
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  )
}
