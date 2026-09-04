/**
 * A word attached to a thing.
 *
 * Three jobs, three weights, and the weight is the whole design: a
 * *measurement* is quiet, because there is nothing to act on and it should
 * read as text that happens to sit in a row; a *capability* is a plain chip,
 * because it is one of a set scanned across and none may be louder than the
 * others; a *state* is the only one that takes colour, because it is the only
 * one that can change.
 *
 * The four state tones are the ones `Callout` and `Toast` use, so one
 * vocabulary covers the app: `warn` is a caution — the thing works, mind how —
 * and `bad` is something that is actually not working.
 *
 * **Colour is never the only signal.** A state pill has a tint, a border and a
 * word. The tint alone was 1.67:1 on Paper for weeks and looked fine on every
 * dark theme anybody tested, which is why `pillTones.test.ts` measures every
 * tone against every theme rather than trusting anyone's eye.
 *
 * **Tint into `--panel`, not `--panel-2`.** Mixing a mid tone into the darker
 * surface moves the background towards the text; on a light theme that drops a
 * label from 4.7:1 to 3.9:1. The tones mix at 10% into the panel for that
 * reason and not for taste.
 *
 * This was the second-most-copied markup in the app — `<span className="pill
 * pill-info">` at every call site, and a gallery page teaching it. A page that
 * documents hand-written markup is a page that will be copied.
 */

export default function Pill({
  tone,
  quiet,
  inRow,
  className,
  children,
  ...rest
}: {
  /** A state, and the only kind that takes colour. Absent, it is a capability. */
  tone?: 'info' | 'good' | 'warn' | 'bad'
  /** A measurement. No box at all — nothing to act on, so nothing to draw. */
  quiet?: boolean
  /** Beside a name in a row. Adds the gap that keeps it off the text and sets
   *  it on the baseline rather than the middle, which is where a chip next to
   *  a word wants to be. */
  inRow?: boolean
  className?: string
  children: React.ReactNode
} & Omit<React.HTMLAttributes<HTMLSpanElement>, 'className' | 'children'>) {
  const classes = [
    'pill',
    quiet ? 'pill-quiet' : '',
    tone ? `pill-${tone}` : '',
    inRow ? 'row-pill' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  )
}
