import { useCallback, useEffect, useId, useRef, useState } from 'react'

/**
 * Two panes and a handle between them.
 *
 * A mail client is a list beside a message, a forum is threads beside a
 * thread, and in both the right width depends on the reader rather than on us:
 * a wide list to scan senders, a narrow one to give the message room. So it is
 * theirs to set, and it has to survive a reload or setting it was a waste of
 * their time.
 *
 * **The handle is a control, not a decoration, and that is the part everybody
 * skips.** Nearly every split view on the web is a `<div>` with a mousedown
 * listener: no role, no tab stop, no way to move it without a pointer. The
 * ARIA pattern for this is `separator` with a value, which makes it a real
 * widget -- focusable, announced as "splitter, 30 percent", and moved with the
 * arrow keys. Home and End take it to its limits, and Enter collapses the
 * first pane and restores it, which is the thing a mouse does by dragging to
 * the edge.
 *
 * **The size is a percentage of the container**, not pixels, because the
 * window is resized more often than the split is. A pixel width chosen on a
 * wide monitor is most of a laptop screen.
 *
 * **The panes are `min-width: 0`.** Without it a flex child refuses to shrink
 * below the intrinsic width of its content, so one long unbroken subject line
 * silently pins the list open and the handle stops halfway with no explanation.
 * That is in `splitpane.css` and it is the reason the file exists.
 */

export interface Props {
  /** Exactly two: the first pane and the second. */
  children: [React.ReactNode, React.ReactNode]
  /** `row` puts them side by side with a vertical handle. `column` stacks
   *  them. */
  direction?: 'row' | 'column'
  /** The first pane's share, as a percentage, before anyone moves it. */
  defaultSize?: number
  /** How small and how large the first pane may get, as percentages. The
   *  limits are the design's: a list narrower than its own row content is not
   *  a smaller list, it is a broken one. */
  min?: number
  max?: number
  /**
   * Remember the size under this key, per browser.
   *
   * Without it the handle resets on every reload, which makes moving it feel
   * like it did not work. Storage can throw -- a private window, a browser set
   * to block site data -- so a failure to remember is silent and the default
   * stands.
   */
  storageKey?: string
  /** Names the handle. "Sidebar width", not "splitter": the name is announced
   *  and should say what moving it does. */
  label: string
  /** Called as the handle moves, with the first pane's percentage. */
  onResize?: (size: number) => void
  className?: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function remembered(key: string | undefined, fallback: number) {
  if (!key) return fallback
  try {
    const stored = window.localStorage.getItem(`design.split.${key}`)
    const parsed = stored === null ? Number.NaN : Number.parseFloat(stored)
    return Number.isFinite(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

export default function SplitPane({
  children,
  direction = 'row',
  defaultSize = 30,
  min = 15,
  max = 70,
  storageKey,
  label,
  onResize,
  className,
}: Props) {
  const [first, second] = children
  const frame = useRef<HTMLDivElement>(null)
  const firstPaneId = useId()
  const [size, setSize] = useState(() => clamp(remembered(storageKey, defaultSize), min, max))
  /* Where the pane was before Enter collapsed it, so Enter puts it back where
     it was rather than at the default. Collapsing and restoring should be the
     same gesture undone, not a reset. */
  const restore = useRef(size)

  const move = useCallback(
    (next: number) => {
      const bounded = clamp(next, min, max)
      setSize(bounded)
      onResize?.(bounded)
      if (!storageKey) return
      try {
        window.localStorage.setItem(`design.split.${storageKey}`, String(bounded))
      } catch {
        // A browser that will not remember is not a reason to refuse to resize.
      }
    },
    [min, max, onResize, storageKey],
  )

  /* Pointer events rather than mouse events, so a pen and a touch drag work
     with the same code; and pointer capture, so a drag that leaves the window
     -- which is what dragging to the edge *is* -- keeps sending moves instead
     of freezing the handle where the cursor left. */
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const box = frame.current?.getBoundingClientRect()
    if (!box) return
    const handle = event.currentTarget
    handle.setPointerCapture(event.pointerId)

    const onMove = (e: PointerEvent) => {
      const along = direction === 'row' ? e.clientX - box.left : e.clientY - box.top
      const total = direction === 'row' ? box.width : box.height
      if (total > 0) move((along / total) * 100)
    }
    const onUp = (e: PointerEvent) => {
      handle.releasePointerCapture(e.pointerId)
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', onUp)
      handle.removeEventListener('pointercancel', onUp)
      document.body.classList.remove('splitting')
    }
    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onUp)
    handle.addEventListener('pointercancel', onUp)
    /* The cursor is set on the body for the duration, because a drag that
       passes over a text pane otherwise flickers to an I-beam the whole way
       across. */
    document.body.classList.add('splitting')
  }

  useEffect(() => () => document.body.classList.remove('splitting'), [])

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const back = direction === 'row' ? 'ArrowLeft' : 'ArrowUp'
    const forward = direction === 'row' ? 'ArrowRight' : 'ArrowDown'
    const step = event.shiftKey ? 10 : 2
    if (event.key === back) move(size - step)
    else if (event.key === forward) move(size + step)
    else if (event.key === 'Home') move(min)
    else if (event.key === 'End') move(max)
    else if (event.key === 'Enter') {
      if (size <= min) move(restore.current)
      else {
        restore.current = size
        move(min)
      }
    } else return
    event.preventDefault()
  }

  return (
    <div
      ref={frame}
      className={`split dir-${direction}${className ? ` ${className}` : ''}`}
      style={{ '--split': `${size}%` } as React.CSSProperties}
    >
      <div className="split-pane split-first" id={firstPaneId}>
        {first}
      </div>
      {/* biome-ignore lint/a11y/useSemanticElements: the semantic element for
          `separator` is `<hr>`, which cannot hold a grip, take a pointer drag
          or carry `aria-valuenow`. A focusable `separator` with a value is the
          ARIA splitter pattern and has no HTML element. */}
      <div
        role="separator"
        tabIndex={0}
        aria-label={label}
        aria-orientation={direction === 'row' ? 'vertical' : 'horizontal'}
        aria-controls={firstPaneId}
        aria-valuenow={Math.round(size)}
        aria-valuemin={min}
        aria-valuemax={max}
        className="split-handle"
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        /* Back to where it started. A drag has no undo, and the size is
           remembered, so without this a mis-drag is permanent until you get it
           right by hand. */
        onDoubleClick={() => move(defaultSize)}
      >
        <span className="split-grip" aria-hidden="true" />
      </div>
      <div className="split-pane split-second">{second}</div>
    </div>
  )
}
