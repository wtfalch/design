import {
  Popover as AriaPopover,
  Dialog,
  DialogTrigger,
  type Placement,
} from 'react-aria-components'

/**
 * A small surface anchored to the thing that opened it.
 *
 * The middle term between `Tooltip` and `Modal`, and the distinction is what
 * it contains rather than how big it is. A tooltip *says* something and you
 * cannot touch it. A modal takes the application away until it is answered. A
 * popover holds controls -- a filter, a colour, a signature picker -- and the
 * page behind it stays live, because the whole point is to adjust something
 * and watch it change.
 *
 * **It is a dialog, not a div.** Focus moves into it on open, comes back to the
 * trigger on close, Escape closes it and an outside press closes it. Every one
 * of those is what people expect from something that appeared over the page,
 * and every one is missing from the `position: absolute` panel that gets
 * written instead. The panel is worse in a way that is hard to see and easy to
 * hit: tab out of it and you are behind it, operating the page it is covering.
 *
 * **It flips.** `placement` is a preference, not an instruction. React Aria
 * measures the space and moves the surface to the other side when the edge is
 * near, which is the failure the hand-rolled version always ships with -- it
 * works everywhere except at the bottom of the window, where the content
 * appears off screen.
 *
 * Uncontrolled by default: hand it a trigger and children, and it opens and
 * closes itself. `open`/`onOpenChange` are for the case where something else
 * has to close it -- a keyboard shortcut, a route change.
 */

export interface Props {
  /** What opens it. Any focusable element; a `Button` is the usual one. */
  trigger: React.ReactNode
  /** The contents. A render function receives `close` for a surface whose own
   *  controls dismiss it -- picking a colour, applying a filter. */
  children: React.ReactNode | ((close: () => void) => React.ReactNode)
  /** Which side it prefers. It will use another if this one does not fit. */
  placement?: Placement
  /** Names the surface. A dialog owes an accessible name; without one a
   *  screen reader announces "dialog" and nothing else. */
  label: string
  /** Gap between the trigger and the surface. */
  offset?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export default function Popover({
  trigger,
  children,
  placement = 'bottom start',
  label,
  offset = 6,
  open,
  onOpenChange,
  className,
}: Props) {
  return (
    <DialogTrigger isOpen={open} onOpenChange={onOpenChange}>
      {trigger}
      <AriaPopover
        className={`pop${className ? ` ${className}` : ''}`}
        placement={placement}
        offset={offset}
      >
        {/* No arrow. React Aria has `<OverlayArrow>` and it is a second
            element that has to be told which way is up on every flip; the
            surface is already attached by being six pixels from the control
            that opened it. */}
        <Dialog className="pop-body" aria-label={label}>
          {({ close }) => (typeof children === 'function' ? children(close) : children)}
        </Dialog>
      </AriaPopover>
    </DialogTrigger>
  )
}
