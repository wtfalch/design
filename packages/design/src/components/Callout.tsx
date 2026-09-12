'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

/**
 * Something the page needs to say, in the place it applies to.
 *
 * The third component the gallery documented and nobody could import — 31 call
 * sites assembling `className="callout callout-bad"` by hand, and a `-mark`
 * that was a letter somebody typed (`i`, `!`, `✓`) rather than the icon set the
 * rest of the app draws from.
 *
 * **A Callout is not a Toast.** A toast floats over the page and takes no
 * space; this sits in the flow, next to the thing it is about, and pushes what
 * follows down. That is the point of it: "this server is not answering" belongs
 * beside the server, not in the corner.
 *
 * **`timed` makes it a toast that stayed home.** A countdown bar, five seconds,
 * then gone. The rule that comes with it: **anything that disappears on a timer
 * must be safe to have missed.** "Saved" qualifies. "This download failed" does
 * not, and neither does anything carrying a button — if the reader has to act,
 * the message waits for them. The countdown pauses on hover for the same
 * reason, because a message that expires while you are reading it was never
 * really shown.
 */

import { useEffect, useRef, useState } from 'react'

import Icon, { type IconName } from './Icon'

/** Long enough to read twice, which is how long it takes to notice something
 *  appeared and then read it.
 *
 *  Not exported: nothing outside this file used it, and a non-component export
 *  costs the whole module its Fast Refresh boundary -- editing the callout then
 *  re-runs App instead of swapping this component in place. */
const CALLOUT_TIMEOUT = 5000

const MARK: Record<string, IconName> = {
  info: 'info',
  good: 'check',
  warn: 'warning',
  bad: 'error',
}

export default function Callout({
  tone,
  children,
  icon,
  timed,
  onDismiss,
  className,
}: {
  tone?: 'info' | 'good' | 'warn' | 'bad'
  children: React.ReactNode
  /** Off by default: most callouts are a sentence, and an icon beside every
   *  sentence is noise. `true` uses the one that matches the tone. */
  icon?: boolean | IconName
  /** `true` for five seconds, a number for that many milliseconds. */
  timed?: boolean | number
  /** Told when the countdown runs out, for a caller that keeps its own state.
   *  Optional: `timed` on its own is enough, and the callout removes itself.
   *  Requiring a callback to make a timer work is a bar that counts down to
   *  nothing when somebody forgets one. */
  onDismiss?: () => void
  className?: string
}) {
  const total = typeof timed === 'number' ? timed : CALLOUT_TIMEOUT
  const [gone, setGone] = useState(false)
  const running = Boolean(timed) && !gone
  const [paused, setPaused] = useState(false)
  const left = useRef(total)
  const since = useRef(0)

  useEffect(() => {
    if (!running || paused) return
    since.current = Date.now()
    const timer = setTimeout(() => {
      setGone(true)
      onDismiss?.()
    }, left.current)
    return () => {
      clearTimeout(timer)
      // What is left when a hover interrupts, so resuming does not restart the
      // five seconds from the top every time the pointer crosses it.
      left.current = Math.max(0, left.current - (Date.now() - since.current))
    }
  }, [running, paused, onDismiss])

  const mark = icon === true ? MARK[tone ?? 'info'] : typeof icon === 'string' ? icon : null

  if (gone) return null

  return (
    <div
      className={`callout${tone ? ` callout-${tone}` : ''}${running ? ' callout-timed' : ''}${className ? ` ${className}` : ''}`}
      /* An alert interrupts whatever is being read, which is right for bad news
         and rude for "saved". */
      role={tone === 'bad' ? 'alert' : 'status'}
      onMouseEnter={() => running && setPaused(true)}
      onMouseLeave={() => running && setPaused(false)}
      onFocusCapture={() => running && setPaused(true)}
      onBlurCapture={() => running && setPaused(false)}
    >
      {mark && (
        <span className="flex-none grid place-items-center mt-px opacity-90" aria-hidden="true">
          <Icon name={mark} size={16} />
        </span>
      )}
      <div className="ctl-grow">{children}</div>
      {running && (
        /* Decoration: the time remaining is not information anybody can act on,
           and a screen reader counting down a bar is noise on top of a message
           it has already read out. */
        <span
          className={`callout-clock${paused ? ' is-held' : ''}`}
          style={{ animationDuration: `${total}ms` }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
