'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

/**
 * A question that stops what you were doing until it is answered.
 *
 * `Modal` with three things changed, and each of them is a decision rather than
 * a size:
 *
 * **Narrow, and centred.** `Modal` is sized for Settings -- wide, and starting
 * near the top of the screen, because eleven panes of preferences need the room
 * and want to begin where the eye already is. A two-button question inheriting
 * that becomes a grey band across the top: the shape says "here is somewhere to
 * work" while the content says "answer this and go".
 *
 * **The scrim decides nothing.** It is the easiest thing on screen to hit by
 * accident, and for "may this applet write to your files" the accident would be
 * an answer. Closing a workspace by mistake costs a click; closing a question
 * by mistake means it was answered without being read.
 *
 * **Escape is optional.** Omit `onCancel` when there is no safe default -- a
 * decision that must be made has no Escape key, because dismissing it would be
 * choosing on the reader's behalf.
 */

import Modal from './Modal'

export default function Dialog({
  title,
  children,
  onCancel,
  actions,
  tone,
}: {
  title: string
  children: React.ReactNode
  onCancel?: () => void
  actions: React.ReactNode
  tone?: 'bad'
}) {
  return (
    <Modal
      title={title}
      className={`dialog${tone ? ` dialog-${tone}` : ''}`}
      onClose={onCancel}
      dismissOnScrim={false}
      /* The answers are the buttons. A ✕ beside them is a third answer that
         means nothing. */
      closeButton={false}
      footer={actions}
    >
      {children}
    </Modal>
  )
}
