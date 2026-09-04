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

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

import { createPortal } from 'react-dom'

import Button from './Button'

import Icon, { type IconName } from './Icon'

export interface Toast {
  id: number
  text: string
  tone: 'info' | 'good' | 'bad'
}

const MARK: Record<Toast['tone'], IconName> = {
  info: 'info',
  good: 'check',
  bad: 'error',
}

/** How long one stays. Long enough to read twice, which is the length of time
 *  it takes to callout something appeared and then read it. */
const LINGER = 4000

const Ctx = createContext<(text: string, tone?: Toast['tone']) => void>(() => {})

/** `useToast()('Saved')`, from anywhere under the provider. */
export function useToast() {
  return useContext(Ctx)
}

export function ToastHost({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const next = useRef(1)

  const push = useCallback((text: string, tone: Toast['tone'] = 'info') => {
    const id = next.current++
    setToasts((t) => [...t, { id, text, tone }])
  }, [])

  return (
    <Ctx.Provider value={push}>
      {children}
      {createPortal(
        <div className="toasts" aria-live="polite" aria-atomic="false">
          {toasts.map((t) => (
            <Toasted
              key={t.id}
              toast={t}
              onGone={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
            />
          ))}
        </div>,
        document.body,
      )}
    </Ctx.Provider>
  )
}

function Toasted({ toast, onGone }: { toast: Toast; onGone: () => void }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const go = setTimeout(() => setLeaving(true), LINGER)
    // Removed after the exit rather than on it, or it vanishes mid-animation.
    const gone = setTimeout(onGone, LINGER + 200)
    return () => {
      clearTimeout(go)
      clearTimeout(gone)
    }
  }, [onGone])

  return (
    <div
      className={`toast toast-${toast.tone}${leaving ? ' leaving' : ''}`}
      // `status` for the ordinary ones and `alert` only for a failure: an alert
      // interrupts whatever is being read, which is right for bad news and rude
      // for "copied".
      role={toast.tone === 'bad' ? 'alert' : 'status'}
    >
      <Icon name={MARK[toast.tone]} size={16} />
      <span className="grow">{toast.text}</span>
      <Button tone="ghost" size="sm" aria-label="Dismiss" onPress={onGone}>
        <Icon name="close" size={14} />
      </Button>
    </div>
  )
}
