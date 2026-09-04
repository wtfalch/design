/**
 * Something happened, and it does not need answering.
 *
 * There is no transient feedback in this app at all. Every outcome is either a
 * `.callout` that stays until the page changes, or nothing -- so "saved",
 * "copied", "model removed" and "conversation deleted" are all silent, and the
 * only way to know a button worked is that something else moved.
 *
 * **A toast is for the outcome you would not have chased.** If the reader has to
 * act on it, it is a callout and belongs on the page. If they have to decide, it
 * is a dialog. This is the third case: it worked, you may carry on, and in four
 * seconds there will be no trace.
 *
 * **`role="status"`, not `alert`.** An alert interrupts whatever a screen reader
 * is saying, which is right for "the download failed" and rude for "copied".
 * The failing case passes `tone="bad"`, which is the one that promotes itself.
 */

import { createContext, useContext, useMemo, useState } from 'react'

import Icon, { type IconName } from './Icon'

import {
  UNSTABLE_Toast as AriaToast,
  Button,
  Text,
  UNSTABLE_ToastContent as ToastContent,
  UNSTABLE_ToastQueue as ToastQueue,
  UNSTABLE_ToastRegion as ToastRegion,
} from 'react-aria-components'

export interface Toast {
  text: string
  tone: 'info' | 'good' | 'bad'
}

const MARK: Record<Toast['tone'], IconName> = {
  info: 'info',
  good: 'check',
  bad: 'error',
}

/** How long one stays. Long enough to read twice, short enough that a run of
 *  them does not pile up -- and paused while the pointer or focus is on it,
 *  because a message that expires while you are reading it was never shown. */
const LINGER = 4000

const Ctx = createContext<(text: string, tone?: Toast['tone']) => void>(() => {})

export function useToast() {
  return useContext(Ctx)
}

/**
 * The queue and the region, once, at the root.
 *
 * React Aria's `ToastQueue` owns what a `useState` list and two `setTimeout`s
 * did by hand, and three things they did not: the timeout pauses while the
 * pointer or focus is on the toast; the region is a landmark, so a screen
 * reader can reach it with F6 rather than only hearing it; and dismissing one
 * puts focus back where it was, instead of dropping it on the body.
 *
 * The role changes, and on purpose. Each toast was `role="status"` -- or
 * `alert` for the failing tone -- which is right for text that only has to be
 * heard. These carry a Dismiss button, and a live region's contents are not
 * reachable; React Aria makes each toast an `alertdialog` inside a live
 * `region` for that reason, so the announcement still happens and the button
 * can still be reached.
 */
export function ToastHost({ children }: { children: React.ReactNode }) {
  const queue = useMemo(() => new ToastQueue<Toast>({ maxVisibleToasts: 4 }), [])

  /* What gets read aloud, and it is not the toast.

     The old region was `aria-live="polite"` around the toasts themselves, so a
     screen reader heard "Settings saved" the moment it appeared. React Aria's
     region is a landmark instead -- reachable, labelled "1 notification." --
     and after a push there is no live region anywhere in the document: that
     was measured, not assumed, and it would have shipped "saved", "copied" and
     "the download failed" in silence to anyone not looking.

     So the text is mirrored into two visually-hidden live regions of our own:
     polite for the ordinary case and assertive for a failure, the same
     distinction `role="status"` and `role="alert"` used to draw. An alert
     interrupts whatever is being read, right for bad news and rude for
     "copied". */
  const [polite, setPolite] = useState('')
  const [assertive, setAssertive] = useState('')
  const push = useMemo(
    () =>
      (text: string, tone: Toast['tone'] = 'info') => {
        queue.add({ text, tone }, { timeout: LINGER })
        const say = tone === 'bad' ? setAssertive : setPolite
        // Cleared and re-set, so the same message twice is announced twice.
        say('')
        requestAnimationFrame(() => say(text))
      },
    [queue],
  )

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {polite}
      </div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {assertive}
      </div>
      <ToastRegion queue={queue} className="toasts">
        {({ toast }) => (
          <AriaToast toast={toast} className={`toast toast-${toast.content.tone}`}>
            <Icon name={MARK[toast.content.tone]} size={16} />
            <ToastContent className="grow">
              <Text slot="title">{toast.content.text}</Text>
            </ToastContent>
            {/* React Aria's own `Button`, because `slot="close"` is how the
                region knows which control dismisses -- and how it knows to
                put focus back afterwards. The classes are the ones our
                `Button` would have chosen. */}
            <Button slot="close" className="ghost size-sm" aria-label="Dismiss">
              <Icon name="close" size={14} />
            </Button>
          </AriaToast>
        )}
      </ToastRegion>
    </Ctx.Provider>
  )
}
