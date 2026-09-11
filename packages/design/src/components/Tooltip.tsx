'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

/**
 * A tooltip. It was called `Explain`, which named the intention rather than the
 * thing -- so it sat in a catalogue beside Button and Callout as though it were
 * a category of its own, and nobody looking for a tooltip would have found it.
 *
 * A `?` beside a setting, and the box it shows on hover.
 *
 * Same idea as the status dot's tooltip and built the same way: a positioned
 * element revealed on hover, rather than a `title` attribute. The native one
 * needs about a second and a half of waiting, renders newlines inconsistently
 * and cannot be styled.
 *
 * **It stays open while the pointer is inside it**, because a box that vanishes
 * the moment you move toward it cannot be read. `focus-within` opens it too, so
 * it is reachable from the keyboard.
 *
 * The mark is a `<span>` rather than a `<button>`: the rows these sit in are
 * usually a `<label>` wrapping a checkbox, and anything focusable or clickable
 * in there ends up toggling the setting behind it.
 *
 * `align` is which way the box grows, and it has to be said rather than
 * guessed: a mark at the right edge of a row must grow left, and one beside a
 * section heading must grow right. Getting it wrong does not just look off --
 * the box runs under the settings rail and its first few words are cut away.
 */
import { Tooltip as AriaTooltip, Focusable, TooltipTrigger } from 'react-aria-components'

export default function Tooltip({
  label,
  align = 'right',
  mark,
  className,
  children,
}: {
  label: string
  /** Which side the box extends towards. `right` for a mark on the left. */
  align?: 'left' | 'right'
  /**
   * What you hover, when the `?` is not it.
   *
   * A capability mark on a model row is not a request for help about something
   * else -- it *is* the thing, drawn small. So it becomes its own trigger, and
   * the accessible name is the capability rather than "About …", which would
   * announce a glyph as a footnote to itself.
   *
   * This exists because the native `title` attribute was not enough. The mark
   * is an `<svg>` inside a `<span title>` inside a row that is a `<button>`;
   * the pointer lands on a `<path>`, two tooltip sources compete, and what came
   * up was nothing anybody could rely on. A tooltip the app draws itself shows
   * on hover *and* on keyboard focus, which the native one never did.
   */
  mark?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  /* What was wrong, and what this fixes.

     The old markup was `<span role="note" tabIndex={0} aria-label="About …">`
     with the tip as a child span revealed by `:hover` and `:focus-within`. It
     looked like a tooltip and was not one to anything that reads a page aloud:
     `note` is not an interactive role, so a focusable note is a contradiction
     the screen reader resolves by announcing the label and nothing else -- the
     tip's text, the one thing worth reading, was never associated with the
     trigger at all.

     React Aria's `TooltipTrigger` wires `aria-describedby` from the trigger to
     a `<div role="tooltip">`, opens it on hover with intent and on keyboard
     focus, and closes it on Escape and on pointer-out with a grace period so
     a box that vanishes as you move towards it cannot happen.

     The mark stays a `<span>`, and `Focusable` is what makes that work. The
     rows these sit in are `<label>`s wrapping a control, so anything that is a
     `<button>` in there toggles the setting behind it -- the docblock's reason,
     and still true. `Focusable` gives the span a tab stop and the focus and
     hover handling a trigger needs without making it a button.

     The tip is portalled to `document.body` and positioned by React Aria, which
     is also why `overflow: hidden` on any ancestor no longer clips it -- the
     Permissions pane's horizontal scrollbar, found by hiding one class at a
     time, was this box sitting in the scrollable overflow. */
  return (
    <TooltipTrigger delay={0} closeDelay={150}>
      <Focusable>
        <span
          /* `explain` stays as the hook: the mark brightens on hover and on
             focus of this element, which is a parent state reaching a child.
             The rest is this element's own. `text-transform` and
             `letter-spacing` are reset because one of these sits inside a
             heading, and headings here are uppercase and tracked out. */
          className={[
            'explain',
            `explain-${align}`,
            'relative flex-none inline-flex items-center ml-2 cursor-help',
            'normal-case tracking-normal font-normal',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          /* A role, because a name on a role-less span is prohibited -- axe's
             `aria-prohibited-attr`, found the first time this was scanned. `img`
             rather than `button`: the mark is a glyph that reveals help, not a
             control that does something, and `button` would promise an action
             and -- inside the `<label>` rows these sit in -- invite a click that
             the label forwards to the setting behind it. */
          role="img"
          aria-label={mark ? label : `About ${label}`}
        >
          {mark ?? (
            <span
              className="explain-mark w-[18px] h-[18px] rounded-full border border-border text-muted text-xs leading-[16px] text-center"
              aria-hidden="true"
            >
              ?
            </span>
          )}
        </span>
      </Focusable>
      <AriaTooltip
        className="explain-tip"
        placement={align === 'left' ? 'bottom end' : 'bottom start'}
        offset={8}
        crossOffset={align === 'left' ? 6 : -6}
      >
        {children}
      </AriaTooltip>
    </TooltipTrigger>
  )
}
