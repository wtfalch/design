import { useCallback, useEffect, useRef } from 'react'

/**
 * A box that scrolls, and says so.
 *
 * **A list that overflows with no mark at its edge reads as a list that ended.**
 * That is the bug this exists to stop. A thread list showing eleven of four
 * hundred conversations looks exactly like a mailbox with eleven conversations
 * in it: the content runs to the bottom edge of its box and stops, and on a
 * trackpad there is no scrollbar to contradict it. People do not scroll things
 * they have no reason to believe continue.
 *
 * So the edges are drawn. A soft fade appears at whichever end has more behind
 * it and goes when that end is reached, which means the affordance is *absent*
 * exactly when the list really has ended -- the one case where a permanent
 * gradient would lie.
 *
 * **The scrollbar is the theme's, not the platform's.** Same argument as
 * `Select`: an overlay scrollbar drawn by macOS in the platform's grey, over a
 * Night panel, is the one part of the surface the design does not reach. It is
 * also 15px of white on Windows, which is the widest single element in a mail
 * sidebar. `scrollbar-color` covers Firefox and `::-webkit-scrollbar` the rest;
 * both are in `scrollarea.css`.
 *
 * **`overscroll-behavior: contain`**, because a scroll that reaches the end of
 * a pane and carries on into the page behind it is how a thread list scrolls
 * the whole application away. In a split view that is disorienting rather than
 * merely untidy.
 *
 * Not a virtualiser. Ten thousand rows still cost ten thousand nodes; this
 * decides how the box behaves, not how much is in it.
 */

export interface Props {
  /** Which way it scrolls. `y` is the common case and the default; `both` is
   *  for a table too wide as well as too tall. */
  axis?: 'x' | 'y' | 'both'
  /**
   * Draw the fade at a vertical edge with more behind it. On by default.
   *
   * Vertical only: the misreading is "the list ended", which is a claim about
   * the bottom edge. A word sliced in half at the right edge is already its
   * own affordance, so `axis="x"` draws no fade whatever this says.
   *
   * Turn it off where the content ends in something solid -- a sticky footer,
   * cards on a coloured ground -- because the gradient is mixed towards
   * `--panel` and over anything else it reads as a smudge.
   */
  fade?: boolean
  /** Removes the visible scrollbar and keeps every other behaviour, for a
   *  strip that is scrolled by a control beside it rather than by dragging. */
  hideBar?: boolean
  className?: string
  children: React.ReactNode
  /** The scrolling element, for a caller that has to drive it -- scrolling a
   *  newly selected row into view, or restoring a position. */
  ref?: React.Ref<HTMLDivElement>
  /** Names the region when it is one a screen reader should be able to reach
   *  directly. A scroll box that is keyboard-focusable owes an accessible
   *  name; one that is not owes nothing, so this is optional on purpose. */
  label?: string
}

export default function ScrollArea({
  axis = 'y',
  fade = true,
  hideBar = false,
  className,
  children,
  ref,
  label,
}: Props) {
  const own = useRef<HTMLDivElement>(null)

  /* The edge state lives in data attributes rather than React state.
     
     This runs on every scroll frame. Setting state there re-renders the
     subtree -- which, for the thing this is usually wrapped around, is the
     whole list -- sixty times a second while a finger is on the trackpad.
     Writing two attributes touches one element and never re-renders, and CSS
     reads them. */
  const measure = useCallback(() => {
    const el = own.current
    if (!el) return
    const room = 1
    el.dataset.top = String(el.scrollTop > room)
    el.dataset.bottom = String(el.scrollTop + el.clientHeight < el.scrollHeight - room)
    el.dataset.left = String(el.scrollLeft > room)
    el.dataset.right = String(el.scrollLeft + el.clientWidth < el.scrollWidth - room)
  }, [])

  useEffect(() => {
    const el = own.current
    if (!el) return
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    /* Content arriving is the case a scroll listener alone misses: a mailbox
       that loads its second page grows the box without anyone scrolling, and
       the bottom fade has to appear for content nobody has touched. */
    const resize = new ResizeObserver(measure)
    resize.observe(el)
    for (const child of Array.from(el.children)) resize.observe(child)
    return () => {
      el.removeEventListener('scroll', measure)
      resize.disconnect()
    }
  }, [measure])

  return (
    <div
      ref={(node) => {
        own.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) (ref as React.RefObject<HTMLDivElement | null>).current = node
      }}
      className={`scroller axis-${axis}${fade ? ' faded' : ''}${hideBar ? ' barless' : ''}${
        className ? ` ${className}` : ''
      }`}
      /* `tabIndex` only when it is named. An unnamed focusable region is a
         stop in the tab order that announces nothing, which is worse for a
         screen reader than not being reachable at all; a named one is a
         landmark somebody can jump to and scroll with the arrow keys, which
         is the only way to read an overflowing box without a mouse. */
      {...(label ? { tabIndex: 0, role: 'region', 'aria-label': label } : {})}
    >
      {children}
    </div>
  )
}
