'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

/**
 * A window over the app, and the behaviour every one of them was missing.
 *
 * There are eight of these -- Settings, FirstRun, ViewSettings, DownloadModal,
 * ModelSettings, AppletSettings, AppletReview, the studio -- and all eight were
 * built by hand from `.backdrop` and `.modal`. Not one of them trapped focus.
 *
 * **That is not a detail.** Everything behind a modal is still in the tab
 * order: still focusable, still clickable by a keyboard, and completely
 * invisible under the scrim. Tab past the last button in Settings and you are
 * somewhere on the dashboard you cannot see, operating controls you cannot
 * read. Shift-Tab from the first does the same going the other way. The mouse
 * never finds this, which is why it survived eight implementations.
 *
 * So: focus moves in, is kept in, and goes back where it came from when the
 * window closes -- to the button that opened it, not to the top of the page.
 * `role="dialog"` and `aria-modal` say the same thing to a screen reader, which
 * otherwise reads the page underneath as though it were still there.
 *
 * **This is the workspace shape.** A title, a body, optionally a footer, sized
 * to its content. `Dialog` is the narrow two-answer version and is built on
 * this -- same trap, same restore, stricter about the scrim, because for "may
 * this applet write to your files" a stray click on the background is a way of
 * answering by accident.
 *
 * **A sheet is this with `edge` set, not a second component.** A drawer from
 * the side of the window differs from a window in the middle of it by where it
 * is anchored and which way it slides -- and in nothing else. Same focus trap,
 * same restore, same scrim, same header, body and footer. Writing a `Sheet`
 * that duplicates all of that to change two CSS properties is how a design
 * system ends up with two windows that drift: one of them gets the fix and
 * nobody notices which.
 */

import { useEffect, useId, useRef } from 'react'
import { Modal as AriaModal, Dialog, Heading, ModalOverlay } from 'react-aria-components'

import Button from './Button'
import Icon from './Icon'

/* The trap is the same obligation wherever it applies, and the studio needs it
   without being shaped like this, so it lives in a hook rather than here. */

export default function Modal({
  title,
  description,
  subtitle,
  head,
  children,
  footer,
  footerClass,
  onClose,
  closeDisabled = false,
  width,
  edge,
  bodyClass,
  className,
  dismissOnScrim = true,
  closeButton = true,
  labelledBy,
}: {
  /** The window's name. Rendered as the heading and announced on open. */
  title?: React.ReactNode
  /** A line under the title, saying what the window is for. The same slot
   *  `Card` has, for the same reason: a heading names a thing and a sentence
   *  says why you are looking at it, and every window that wanted one was
   *  putting it in the body where it read as the first item of content. */
  description?: React.ReactNode
  /** Beside the title -- what this window is about, usually an id or a path. */
  subtitle?: React.ReactNode
  /** Extra controls in the header, before the close button. */
  head?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  footerClass?: string
  /** Escape, the close button, and the scrim all call this. Omit it and the
   *  window cannot be dismissed -- which is right for onboarding and wrong for
   *  everything else. */
  onClose?: () => void
  /** While something is saving, closing would abandon it mid-flight. */
  closeDisabled?: boolean
  width?: string
  /**
   * Anchor it to an edge of the window and slide it in from there, rather
   * than centring it. This is the sheet.
   *
   * `right` and `left` run the full height at `width`; `bottom` runs the full
   * width and is as tall as its content, which is the shape a phone expects.
   * Use one where the window is a *side panel* on the thing behind it --
   * message details, a filter pane -- and leave it off where the window
   * replaces what is behind it.
   */
  edge?: 'left' | 'right' | 'bottom'
  /** For a body that is not a single column -- Settings' rail and pane. */
  bodyClass?: string
  className?: string
  /** The scrim is the easiest thing on screen to hit by accident. True keeps
   *  today's behaviour for the workspaces; `Dialog` turns it off. */
  dismissOnScrim?: boolean
  /** A question answers itself with its own buttons; a ✕ beside them is a third
   *  answer that means nothing. `Dialog` turns it off. */
  closeButton?: boolean
  /** The id of whatever names this window, when it is not `title`. */
  labelledBy?: string
}) {
  const headingId = useId()
  const canClose = Boolean(onClose) && !closeDisabled

  /* React Aria owns the three things every hand-built modal here got wrong.

     `ModalOverlay` is the scrim: portalled, `position: fixed` from `.backdrop`,
     and it closes on a press outside the box only when `isDismissable` -- so
     `dismissOnScrim={false}` is a prop rather than a `mousedown` handler
     checking `e.target === e.currentTarget`. `Modal` is the box. `Dialog` is
     what makes it one to a screen reader -- `role="dialog"`, `aria-modal`,
     and everything behind it made inert -- and it moves focus in on open,
     keeps it in, and puts it back on the control that opened it when it
     closes. `useTrapFocus` did all of that by hand and only for windows that
     used it, which is how eight of them shipped without a trap; it stays
     exported for a window that genuinely is not this shape.

     `onClose` absent means the window cannot be dismissed at all: no scrim,
     no Escape. `closeDisabled` means the same while something is saving. */
  /* `aria-modal`, set on the element rather than passed as a prop. React Aria
     hides the rest of the page with `aria-hidden` and does not set it -- and
     its `filterDOMProps` drops the prop in silence, the same way it dropped
     `aria-busy` on `Button`. Stated because the old component stated it, and
     because axe reads it. */
  const dialogRef = useRef<HTMLElement>(null)
  useEffect(() => {
    dialogRef.current?.setAttribute('aria-modal', 'true')
  })

  return (
    <ModalOverlay
      className={`backdrop${edge ? ` sheeted from-${edge}` : ''}`}
      isOpen
      isDismissable={canClose && dismissOnScrim}
      isKeyboardDismissDisabled={!canClose}
      onOpenChange={(open) => {
        if (!open && canClose) onClose?.()
      }}
    >
      <AriaModal
        className={`modal${edge ? ` sheet from-${edge}` : ''}${className ? ` ${className}` : ''}`}
        style={width ? { width } : undefined}
      >
        {/* `Dialog` renders a `<section>` of its own inside the box and moves
            focus onto it, so it is a layer the stylesheet has to know about:
            `.modal > .set-actions` stopped matching and the footer grew a
            border, and Chrome drew its focus ring around the whole window.
            Named, so those rules can find it. */}
        <Dialog
          ref={dialogRef}
          className="modal-dialog flex flex-col min-h-0 flex-1"
          aria-labelledby={labelledBy ?? (title ? headingId : undefined)}
        >
          {(title || head || (onClose && closeButton)) && (
            <header className="modal-head">
              {title && (
                /* `Heading` is what React Aria labels the dialog by, and it
                   renders an `<h2>` -- which the browser gives its own margins
                   and its own size (17px above and below, 21px type). The old
                   header was a bare `<strong>` and had neither. `.modal-title`
                   takes them back off so the `<strong>` inside draws exactly as
                   it did; without it every window opened with its title
                   floating in a band twice the height of the head. */
                <Heading
                  slot="title"
                  id={headingId}
                  level={2}
                  className="modal-title m-0 [font:inherit]"
                >
                  <strong>{title}</strong>
                </Heading>
              )}
              {subtitle}
              {head}
              {onClose && closeButton && (
                <Button
                  iconOnly
                  className="x"
                  aria-label="Close"
                  isDisabled={closeDisabled}
                  onPress={() => onClose()}
                >
                  <Icon name="close" size={16} />
                </Button>
              )}
            </header>
          )}
          {description && <p className="m-0 px-4 pb-3 text-muted text-sm">{description}</p>}
          <div className={`modal-body${bodyClass ? ` ${bodyClass}` : ''}`}>{children}</div>
          {footer && (
            <footer className={`set-actions${footerClass ? ` ${footerClass}` : ''}`}>
              {footer}
            </footer>
          )}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  )
}
