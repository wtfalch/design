/**
 * Keep focus inside a window, and put it back when the window goes away.
 *
 * `Modal` uses this, and so does anything that is modal without being shaped
 * like a modal -- the applet studio is a full-screen workspace with its own
 * header and its own idea of what closing means, and wrapping it in `Modal` to
 * borrow the behaviour would mean pretending it is a dialog with a title and a
 * footer. It is not. It just has the same obligation.
 *
 * **The obligation.** Everything behind a modal stays in the tab order:
 * focusable, operable by keyboard, and invisible under the scrim. Tab past the
 * last control and you are somewhere on the page you cannot see, pressing
 * buttons you cannot read. No mouse ever finds this, which is why every one of
 * the app's eight modals shipped without it.
 */

import { type RefObject, useCallback, useEffect } from 'react'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]),' +
  ' select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useTrapFocus(
  box: RefObject<HTMLElement | null>,
  {
    active = true,
    onEscape,
  }: {
    /** False while the window is mounted but not showing -- the studio stays in
     *  the tree when minimised, and trapping focus inside something invisible
     *  is the same bug pointing the other way. */
    active?: boolean
    onEscape?: () => void
  } = {},
) {
  const focusables = useCallback(
    () =>
      [...(box.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])]
        // A control inside a collapsed section is in the DOM and not on screen.
        .filter((el) => el.offsetParent !== null || el === document.activeElement),
    [box],
  )

  useEffect(() => {
    if (!active) return
    const cameFrom = document.activeElement
    // Only if nothing inside has claimed it already: several of these windows
    // put `autoFocus` on the field you came here to edit, which is a better
    // landing place than the box.
    if (!box.current?.contains(document.activeElement)) box.current?.focus()
    return () => {
      // Back to the control that opened it. Without this, focus falls to the
      // top of the document and a keyboard user starts the page again.
      const back = cameFrom as HTMLElement | null
      if (back?.isConnected) back.focus?.()
    }
  }, [active, box])

  return useCallback(
    (e: React.KeyboardEvent) => {
      if (!active) return
      if (e.key === 'Escape' && onEscape) {
        // Stopped here so a window inside a window closes one layer, not both.
        e.stopPropagation()
        onEscape()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      const here = document.activeElement
      if (e.shiftKey && (here === first || here === box.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && here === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [active, box, focusables, onEscape],
  )
}

export default useTrapFocus
