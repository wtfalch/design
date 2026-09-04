/**
 * A short walk round the chrome, once, after onboarding.
 *
 * Onboarding answers "what does this need to run". It says nothing about the
 * four controls somebody is then left alone with: two floating buttons in one
 * corner, a cog in another, and a `+` beside the board name. Every one of them
 * is an icon with a `title`, which is a tooltip you have to already suspect is
 * there to go looking for.
 *
 * **It points at the real thing.** Each step finds its target by selector and
 * cuts a hole in the scrim over it, so the control being described is the
 * control you can see — not a screenshot of one, which goes stale the first
 * time the button moves.
 *
 * **A step whose target is missing is skipped, not shown empty.** The chat
 * launcher is not on the page while the dock is open, and the studio button
 * changes what it does when a session is minimised. A tour that insists on
 * pointing at something that is not there would be describing a different app.
 *
 * **Escape ends it and it never comes back on its own.** This is the least
 * important thing on the screen and it is in the way of everything else; the
 * one unforgivable version is the one you cannot get out of.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import Button from './Button'
import { markTourSeen } from './tourMarker'

export interface TourStop {
  /** Where it points. Missing from the page means the stop is skipped. */
  target: string
  title: string
  body: React.ReactNode
}

export default function Tour({ stops, onDone }: { stops: TourStop[]; onDone: () => void }) {
  const [at, setAt] = useState(0)
  const [box, setBox] = useState<DOMRect | null>(null)
  const card = useRef<HTMLDivElement>(null)

  /* Only the stops whose target is actually on the page.
     
     Keyed on `stops` rather than computed every render, because re-filtering
     as the chrome moves would renumber "2 of 4" under somebody mid-walk -- the
     chat launcher leaves the page when the dock opens, and the count must not
     notice. `TOUR` is a module constant, so in a built app this runs once.

     It was a `useRef` for that reason, and a ref is a snapshot: editing a stop's
     copy hot-updated the module and the open tour went on rendering the text it
     was mounted with, which made the copy look like it had not saved. A `useMemo`
     keeps the guarantee and lets a new `stops` array through, which is exactly
     what Fast Refresh hands us. */
  const live = useMemo(() => stops.filter((s) => document.querySelector(s.target)), [stops])
  /* A shorter list must not strand the index past the end -- that would read as
     "no stop", which ends the tour. Only reachable in development. */
  const stop = live[Math.min(at, Math.max(0, live.length - 1))]

  const finish = useCallback(() => {
    markTourSeen()
    onDone()
  }, [onDone])

  useLayoutEffect(() => {
    if (!stop) return finish()
    const el = document.querySelector(stop.target)
    if (!el) return
    /* Half this chrome is invisible until you touch it. `.view-add` sits at
       `opacity: 0` until the top bar is hovered, so the spotlight cut a hole
       round nothing and the card described a button that was not there -- the
       one stop most in need of explaining was the one you could not see.

       A class rather than an inline style: what "visible" means belongs to the
       control, in the stylesheet with the rule that hid it. See `.tour-target`. */
    el.classList.add('tour-target')
    const measure = () => setBox(el.getBoundingClientRect())
    measure()
    // The chrome moves: the board scrolls, the window resizes, a FAB slides in.
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      // Before the next stop adds its own, and on the way out however we leave
      // -- Escape and Skip included, or the button stays stuck on.
      el.classList.remove('tour-target')
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [stop, finish])

  // biome-ignore lint/correctness/useExhaustiveDependencies: `at` is the trigger, not a value the body reads -- the card takes focus again on every step.
  useEffect(() => {
    card.current?.focus()
  }, [at])

  if (!stop || !box) return null

  const next = () => (at + 1 < live.length ? setAt(at + 1) : finish())

  /* Above the target if there is room, below if not. The two FABs sit at the
     bottom of the window, where a card underneath them would be off screen. */
  const below = box.top < window.innerHeight / 2
  const style: React.CSSProperties = {
    top: below ? box.bottom + 14 : undefined,
    bottom: below ? undefined : window.innerHeight - box.top + 14,
    left: Math.max(16, Math.min(box.left + box.width / 2 - 170, window.innerWidth - 356)),
  }

  return createPortal(
    <div
      className="tour"
      onKeyDown={(e) => {
        if (e.key === 'Escape') finish()
        if (e.key === 'Enter' || e.key === 'ArrowRight') next()
      }}
    >
      {/* The hole. An enormous spread shadow rather than a clip path: it needs
          no maths, it dims everything outside the ring, and the ring itself is
          the highlight. */}
      <div
        className="tour-hole"
        style={{
          top: box.top - 6,
          left: box.left - 6,
          width: box.width + 12,
          height: box.height + 12,
        }}
      />
      <div
        ref={card}
        className="tour-card"
        style={style}
        // biome-ignore lint/a11y/useSemanticElements: a <dialog> brings the top layer, ::backdrop and showModal() focus semantics; this is an anchored coach-mark card that positions itself and manages its own focus, so the role is the faithful choice.
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        tabIndex={-1}
      >
        <strong id="tour-title" className="tour-title">
          {stop.title}
        </strong>
        <p className="tour-body">{stop.body}</p>
        <div className="tour-actions">
          <span className="tour-count mono">
            {at + 1} of {live.length}
          </span>
          <span className="grow" />
          <Button tone="ghost" size="sm" onPress={finish}>
            Skip
          </Button>
          <Button tone="primary" size="sm" onPress={next}>
            {at + 1 < live.length ? 'Next' : 'Done'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
