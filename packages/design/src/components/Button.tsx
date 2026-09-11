'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

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
 *
 * **`asChild` puts the styling on somebody else's element, and that is how a
 * link becomes a button.** A control that takes you somewhere has to be an
 * anchor: middle-click, cmd-click, "copy link address" and a screen reader's
 * list of links all come from the element, not from what it looks like. Every
 * consumer had drawn its own instead — valet's `.v-link-button`, manage's and
 * app-template's `.app-link` — three hand-styled anchors chasing one button's
 * appearance, which is the drift this package exists to stop.
 *
 * The alternative was an `href` prop rendering React Aria's `Link`, and
 * `asChild` beats it on the case that actually occurs: in a Next app the
 * anchor has to be `next/link`, or the whole page reloads. `href` would have
 * meant every app wrapping its tree in a `RouterProvider` and remembering to;
 * `asChild` lets the caller hand over the element they already wanted:
 *
 *     <Button asChild kind="primary"><Link href="/manage">Manage</Link></Button>
 *
 * It is the same shape chef-monorepo's `Button` uses, for the same reason.
 *
 * Two things do not survive the swap, both because the slotted element is not
 * a `<button>`. `busy` is ignored: its countdown bar is drawn on the element
 * this component would have rendered, and the child owns its own contents.
 * And `disabled` cannot use the native attribute, which an anchor ignores, so
 * it becomes `aria-disabled` plus a capture-phase block — `Slot` runs the
 * child's own `onClick` before ours, so the capture phase is the only place
 * left to stop it, and stopping propagation there is what a native disabled
 * button does anyway: it emits no click at all.
 */

import { Slot } from '@radix-ui/react-slot'
import { useEffect, useRef } from 'react'
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components'

/** What this component adds, on either element. Kept separate from React
 *  Aria's set so the `asChild` half of `ButtonProps` can have these without
 *  the button-only ones -- `className` lives here, and React Aria's own
 *  `className` is a function-or-string this package does not want. */
export interface OwnProps {
  children?: React.ReactNode
  /** The same word every other control in the package uses. React Aria spells
   *  it `isDisabled`, and that still works; this one exists so a consumer does
   *  not have to remember which of the two a given component wants. */
  disabled?: boolean
  /**
   * What kind of thing pressing it does. `kind`, not `tone`: across the
   * package `tone` is a semantic colour -- info, good, warn, bad -- and a
   * button's primary/ghost/danger is a role, not a colour.
   *
   * `primary` is the one action the panel is for, and there is at most one.
   * `ghost` is a secondary action that should not compete. `danger` is red
   * before you hover it, because hover is the one moment it is too late to be
   * told.
   */
  kind?: 'default' | 'primary' | 'ghost' | 'danger'
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

export interface Props
  extends OwnProps,
    Omit<AriaButtonProps, 'className' | 'style' | 'children'> {}

/** The button's own props, plus the slot switch. When `asChild` is set the
 *  element is the caller's, so what may be passed alongside is the DOM's
 *  attribute set rather than React Aria's — `onPress` and `type` have nothing
 *  to attach to on an `<a>`. */
export type ButtonProps =
  | (Props & { asChild?: false })
  | (OwnProps &
      Omit<React.HTMLAttributes<HTMLElement>, 'className' | 'style' | 'children'> & {
        asChild: true
        children: React.ReactNode
      })

/* An anchor ignores `disabled`, and `Slot` runs the child's `onClick` before
   ours, so the capture phase is the only place left to block it. */
const blockActivation = (event: React.MouseEvent<HTMLElement>) => {
  event.preventDefault()
  event.stopPropagation()
}

export default function Button(props: ButtonProps) {
  const { kind = 'default', disabled, size = 'md', busy, block, iconOnly, className } = props

  const classes = [
    /* Always, on both elements. Every rule that used to hang off the `button`
       element now hangs off this class, so the styling belongs to this
       component rather than to whatever happens to be a `<button>` -- which
       is what let a tab, a row and a card inherit control styling and then
       spend five declarations undoing it. */
    'btn',
    iconOnly ? 'icon-btn' : '',
    kind === 'default' ? '' : kind,
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
   *
   * Declared before the `asChild` branch below, because a hook cannot sit
   * after a conditional return. It does nothing on that path: the ref is
   * never attached, so there is no element to stamp.
   */
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (busy) el.setAttribute('aria-busy', 'true')
    else el.removeAttribute('aria-busy')
  }, [busy])

  if (props.asChild) {
    const slotClasses = classes

    /* Narrowed by `props.asChild`, so what is left after the component's own
       props is the DOM attribute set -- which is why an unknown `data-*`
       reaches the child untouched. */
    const {
      asChild: _asChild,
      kind: _kind,
      disabled: _disabled,
      size: _size,
      busy: _busy,
      block: _block,
      iconOnly: _iconOnly,
      className: _className,
      children,
      ...slotted
    } = props

    return (
      <Slot
        {...slotted}
        aria-disabled={disabled || slotted['aria-disabled']}
        onClickCapture={disabled ? blockActivation : slotted.onClickCapture}
        className={slotClasses}
      >
        {children}
      </Slot>
    )
  }

  const {
    asChild: _asChild,
    kind: _kind,
    disabled: _disabled,
    size: _size,
    busy: _busy,
    block: _block,
    iconOnly: _iconOnly,
    className: _className,
    children,
    ...rest
  } = props

  return (
    <AriaButton
      ref={ref}
      /* The default, and the point of the component. React Aria sets this too;
         stating it here means the prop is visible in the signature rather than
         inherited from a library the caller has not read. */
      type="button"
      {...rest}
      isDisabled={rest.isDisabled ?? disabled}
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
