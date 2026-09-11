/**
 * How far along something is.
 *
 * There was a `.bar` -- six pixels of `--panel-2` with an accent `<i>` inside --
 * and every caller did the arithmetic, the formatting and the conditional
 * itself. That was survivable while one screen had a download in it. It is not
 * now: the engine install, the model pull, the image runtime and the weights
 * fetch all report progress, and three of them have a phase where the total is
 * not known yet.
 *
 * **The indeterminate case is the reason this exists.** `.bar` could only draw a
 * fraction, so a fetch that had not yet read `content-length` drew nothing --
 * an empty track, indistinguishable from stalled, for however long the server
 * took to answer. A thing that is working and a thing that is stuck must not
 * look alike.
 *
 * **It announces itself.** A bar is a picture of a number, and a picture of a
 * number is nothing at all to somebody who cannot see it. `role="progressbar"`
 * with a `valuetext`, because "62%" is what the bar shows and "412 MB of 660 MB"
 * is what it means.
 */

export default function Progress({
  value,
  max,
  label,
  detail,
  tone,
  className,
}: {
  /** How far. Omit for indeterminate — the work has started, the size has not
   *  arrived. */
  value?: number
  max?: number
  /** What is progressing. Required: an unlabelled bar is a rectangle. */
  label: string
  /** The human sentence, shown beside the bar and announced instead of the
   *  percentage. */
  detail?: string
  /** A subset of the tone words; the default fill is the accent and is not a tone. */
  tone?: 'good' | 'bad'
  className?: string
}) {
  const indeterminate = value === undefined || !max
  const pct = indeterminate ? 0 : Math.max(0, Math.min(100, (value / max) * 100))

  return (
    /* `progress` stays as a hook: `card.css` spaces a bar that follows a
       card's contents, which is a relationship between two elements. The rest
       is this component's own shape and reads better here. */
    <div className={['progress grid gap-1', className].filter(Boolean).join(' ')}>
      {(label || detail) && (
        /* Baseline, not centre: the label and the detail are one line of text
           with two weights, and centring them puts the smaller one adrift. */
        <div className="flex items-baseline gap-2 text-sm">
          <span>{label}</span>
          <span className="ctl-grow" />
          {detail && <span className="text-muted text-xs font-mono">{detail}</span>}
        </div>
      )}
      {/* biome-ignore lint/a11y/useFocusableInteractive: a progressbar is not interactive; there is nothing to focus and nothing to press. */}
      <div
        className={`bar${tone ? ` bar-${tone}` : ''}${indeterminate ? ' bar-indeterminate' : ''}`}
        role="progressbar"
        aria-label={label}
        // Absent on an indeterminate bar, which is what tells a screen reader
        // it is indeterminate -- a `valuenow` of 0 would say "nought per cent"
        // and mean "unknown", which is a different and much worse statement.
        aria-valuenow={indeterminate ? undefined : Math.round(pct)}
        aria-valuemin={indeterminate ? undefined : 0}
        aria-valuemax={indeterminate ? undefined : 100}
        aria-valuetext={detail}
      >
        <i style={indeterminate ? undefined : { width: `${pct}%` }} />
      </div>
    </div>
  )
}
