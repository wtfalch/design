'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

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
 *
 * **`name` is what makes it a form control again, and the omission had a
 * cost.** Keeping the old API kept `value` and `onChange` but not the one
 * attribute a plain `<form action={…}>` needs: with nothing to submit under,
 * a caller wanting one choice in a Server Action had to mirror the value into
 * a hidden input beside the control and keep the two in step by hand. valet
 * did exactly that for every `Select` on the page. This is the other half of
 * 0.6.0, which gave `Checkbox` the same thing and stopped here.
 *
 * React Aria renders the hidden select itself, so the value posts, validation
 * reaches it and a reset restores it -- none of which a mirrored input got
 * right. Uncontrolled is now a real option: `name` with `defaultValue` and no
 * `onChange` is a control the form reads at submit, which is what preserves a
 * half-filled form through a failed action.
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

import { useFieldWiring } from './fieldWiring'

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
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  /** What the form submits this under. Without it there is nothing to post,
   *  which is what sent callers back to a mirrored hidden input. */
  name?: string
  /** The form to submit with, when the control sits outside it. */
  form?: string
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
  name,
  form,
  id,
  title,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  aside,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: Props) {
  const options = readOptions(children)

  /* A `Select` is a `<button>`, and a button takes its accessible name from
     its contents -- so `Field`'s `htmlFor` does not name it and the caller
     used to repeat the label in an `aria-label`. Reading the wiring here is
     what removes the second literal. Explicit props win throughout. */
  const field = useFieldWiring()
  const wiredId = id ?? field?.id
  const wiredLabelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : field?.labelId)

  /* `title` and `aria-invalid`, set on the element: React Aria's `Button`
     takes `id` and the *labelling* aria props -- label, labelledby,
     describedby, details -- and filters the rest, the same `filterDOMProps`
     that dropped `aria-busy` on `Button` and `aria-modal` on `Modal`.
     `aria-invalid` is not on that list, so passing it as a prop typechecks,
     reads correctly and does nothing at all. That is the third time this
     has caught someone, which is why it is written down here too. */
  const control = useRef<HTMLButtonElement>(null)
  const invalid = ariaInvalid ?? field?.['aria-invalid']
  useEffect(() => {
    const el = control.current
    if (!el) return
    if (title) el.title = title
    else el.removeAttribute('title')
  }, [title])
  useEffect(() => {
    const el = control.current
    if (!el) return
    if (invalid) el.setAttribute('aria-invalid', 'true')
    else el.removeAttribute('aria-invalid')
  }, [invalid])

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
      className={`sel${block ? ' ctl-block' : ''}${className ? ` ${className}` : ''}`}
      selectedKey={value !== undefined ? String(value) : undefined}
      defaultSelectedKey={
        defaultValue !== undefined ? String(defaultValue) : (options[0]?.value ?? undefined)
      }
      onSelectionChange={(key) => {
        if (key !== null) onChange?.({ target: { value: String(key) } })
      }}
      isDisabled={disabled}
      name={name}
      form={form}
      aria-label={ariaLabel}
      aria-labelledby={wiredLabelledBy}
    >
      <Button
        ref={control}
        id={wiredId}
        aria-describedby={ariaDescribedBy ?? field?.['aria-describedby']}
        className={`sel-control${size ? ` size-${size}` : ''}`}
      >
        <SelectValue className="sel-value flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
          {({ selectedText, defaultChildren }) => selectedText ?? defaultChildren}
        </SelectValue>
        {/* Inline rather than a component: one path, used here and nowhere
            else. `Caret` was a module and an export for exactly this. */}
        <svg
          className="sel-caret flex-none opacity-60"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          aria-hidden="true"
        >
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
      <Popover
        className="sel-list z-[60] max-h-[280px] overflow-y-auto m-0 p-1 list-none border border-border-strong rounded-md surface-panel"
        placement="bottom start"
        offset={4}
        maxHeight={280}
      >
        <ListBox>
          {options.map((o) => (
            <ListBoxItem
              key={o.value}
              id={o.value}
              textValue={o.text}
              isDisabled={o.disabled}
              className="sel-item flex items-center gap-2 p-2 rounded-sm cursor-pointer whitespace-nowrap"
            >
              <span className="flex-1 min-w-0 overflow-hidden text-ellipsis">{o.label}</span>
              <svg
                className="sel-tick flex-none"
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
