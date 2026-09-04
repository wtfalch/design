/**
 * A button. The most-copied markup in the app, finally a component.
 *
 * Four kinds that look like four things, three sizes, and a busy state that is
 * not a disabled one. None of that is new — all of it was in the stylesheet
 * already, and every call site assembled it by hand from
 * `<button className="primary size-sm">`. A page in the gallery documented that
 * markup, which is how a catalogue teaches people to copy rather than import.
 *
 * **`type="button"` is the default, and that is the whole reason this exists
 * rather than a class.** A `<button>` with no type is `type="submit"`: drop one
 * inside a `<form>` and pressing it submits the form and reloads the page. That
 * is not a thing anybody writes on purpose, it is a thing everybody forgets —
 * fifty-eight of them here, found by a linter rather than by a person. A
 * default cannot be forgotten. `type="submit"` is still available, and now it
 * has to be asked for, which is the right way round.
 *
 * **Behaviour comes from React Aria.** Press handling that works with a mouse,
 * a touch, a pen and a keyboard is more than `onClick`: it is pointer capture,
 * the difference between a press that ends on the button and one that drags
 * off it, and not firing twice on a touch screen. `data-pressed`,
 * `data-hovered` and `data-focus-visible` land on the element, so the
 * stylesheet keeps describing states rather than tracking them.
 */

import { useEffect, useRef } from 'react'
import { Button as AriaButton, type ButtonProps } from 'react-aria-components'

export interface Props extends Omit<ButtonProps, 'className' | 'style' | 'children'> {
  children?: React.ReactNode
  /**
   * What kind of thing pressing it does.
   *
   * `primary` is the one action the panel is for, and there is at most one.
   * `ghost` is a secondary action that should not compete. `danger` is red
   * before you hover it, because hover is the one moment it is too late to be
   * told.
   */
  tone?: 'default' | 'primary' | 'ghost' | 'danger'
  /** Asked for, never inherited. Size used to come from a descendant selector,
   *  which made a button's size a fact about where somebody had put it. */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Working, not disabled.
   *
   * On `aria-busy`, so the styling and the screen reader read the same
   * attribute. A busy button keeps its label — "Installing…" — because
   * replacing the words with a spinner removes the only thing that says what is
   * taking so long.
   */
  busy?: boolean
  /** Full width of whatever holds it. For a button that is the whole row. */
  block?: boolean
  /** An icon and nothing else. The `aria-label` is then not optional, and
   *  TypeScript cannot make it required here without a second component, so
   *  `a11y.spec.ts` is what actually holds it. */
  iconOnly?: boolean
  className?: string
}

export default function Button({
  tone = 'default',
  size = 'md',
  busy,
  block,
  iconOnly,
  className,
  children,
  ...rest
}: Props) {
  const classes = [
    iconOnly ? 'icon-btn' : '',
    tone === 'default' ? '' : tone,
    size === 'md' ? '' : `size-${size}`,
    block ? 'block' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  /**
   * `aria-busy`, set on the element rather than passed as a prop.
   *
   * React Aria runs everything through `filterDOMProps`, which forwards only
   * the labelling aria attributes -- `aria-label`, `aria-labelledby`,
   * `aria-describedby`, `aria-details`. `aria-busy` is dropped in silence, so
   * the prop looked right, typechecked, and the countdown bar under a busy
   * button simply stopped rendering.
   *
   * The obvious alternative is React Aria's own `isPending`, and it is the
   * wrong one here: it marks the button `aria-disabled` and stops it being
   * pressed. This component's whole documented distinction is that busy is
   * *not* disabled -- "Working, not disabled", and the label stays because it
   * is the only thing saying what is taking so long. Swapping the semantics to
   * get a tidier call site would be changing behaviour nobody asked to change.
   */
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (busy) el.setAttribute('aria-busy', 'true')
    else el.removeAttribute('aria-busy')
  }, [busy])

  return (
    <AriaButton
      ref={ref}
      /* The default, and the point of the component. React Aria sets this too;
         stating it here means the prop is visible in the signature rather than
         inherited from a library the caller has not read. */
      type="button"
      {...rest}
      /* Always a string, never undefined. React Aria stamps its own
         `react-aria-Button` class when `className` is absent, so an untoned
         button arrived carrying a class from a library the stylesheet has never
         heard of. */
      className={classes}
    >
      {children}
    </AriaButton>
  )
}
