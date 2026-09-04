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
  return (
    <span
      className={`explain explain-${align}${className ? ` ${className}` : ''}`}
      tabIndex={0}
      role="note"
      aria-label={mark ? label : `About ${label}`}
    >
      {mark ?? (
        <span className="explain-mark" aria-hidden="true">
          ?
        </span>
      )}
      <span className="explain-tip">{children}</span>
    </span>
  )
}
