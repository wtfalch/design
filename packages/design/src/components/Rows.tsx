/**
 * A list of things, each with a name, some qualifiers and something to do.
 *
 * There are thirty-eight of these in the app and every one is assembled by
 * hand:
 *
 *     <div className="set-row">
 *       <span className="grow" style={{ minWidth: 0 }}>
 *         <span className="named">
 *           <span className="truncate">{name}</span>
 *           …pills…
 *         </span>
 *         <div className="set-hint">{meta}</div>
 *       </span>
 *       …buttons…
 *     </div>
 *
 * Six nested elements, two of which exist only to stop the name eating the
 * pills, and `minWidth: 0` inline on one of them because a flex item will not
 * shrink below its content without it. Miss that and the row looks fine until
 * somebody installs a model with a sixty-character name, at which point the
 * tags saying what it can do get ellipsised away and the name -- the one part
 * you could have guessed -- takes the whole row. That has been fixed twice.
 *
 * **The parts are named, so the layout is not the caller's problem.** `name`
 * truncates, `pills` never do, `hint` is the line underneath, `trail` is the
 * right-aligned column that lines up down the list, `actions` are the buttons.
 * Every row in the app is some subset of those five.
 *
 * **`Rows` owns the dividers.** A rule between rows and none after the last one
 * -- which sounds trivial and was not: `:last-of-type` matches by element type,
 * so an actions bar rendered after the list meant the final row kept its border
 * and every settings pane ended in two parallel lines. The container knows what
 * a row is and the CSS asks it, rather than guessing from the DOM.
 */

export function Rows({
  children,
  empty,
  label,
  look = 'list',
  className,
}: {
  /** Absent is the empty case too: a caller mapping over nothing renders
   *  nothing, and that has to reach `empty` rather than an empty bordered box. */
  children?: React.ReactNode
  /** Shown instead of the list when there is nothing. Every caller writes one
   *  of these by hand today and half of them forget. */
  empty?: React.ReactNode
  /** What the list is, for a screen reader. A list of rows with no name is a
   *  stack of unrelated sentences. */
  label?: string
  /**
   * How the list is drawn.
   *
   * - `list` — rows separated by a hairline. Right for things you are reading:
   *   downloads, activity, applets.
   * - `pick` — each row its own bordered box, spaced. Right for things you are
   *   *choosing between*: the rule-of-thumb elsewhere in this app is that
   *   several options are choice rows, and a ruled list reads as a table of
   *   records rather than as a set of alternatives one of which is yours.
   *
   * A variant rather than a second component: the slots, the truncation rule
   * and the `min-width: 0` that makes the pills survive are the same either
   * way, and only the surface differs.
   */
  look?: 'list' | 'pick'
  className?: string
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children
  const none = Array.isArray(items) ? items.length === 0 : !items

  if (none) {
    return empty ? <div className="set-hint rows-empty">{empty}</div> : null
  }
  return (
    <div
      className={`rows${look === 'pick' ? ' rows-pick' : ''}${className ? ` ${className}` : ''}`}
      // biome-ignore lint/a11y/useSemanticElements: valid ARIA on a div; a <ul> brings the browser's list reset and the stylesheet and 204 baselines key on `div.rows`.
      role="list"
      aria-label={label}
    >
      {items}
    </div>
  )
}

export function Row({
  name,
  pills,
  hint,
  trail,
  actions,
  below,
  onClick,
  tone,
  picked,
  loading,
  waiting,
  align = 'center',
  className,
}: {
  /** The subject. Truncates -- it is the only part that may. */
  name: React.ReactNode
  /** Qualifiers, on the name's line. Never truncated: a badge that is
   *  ellipsised is a badge that has stopped saying anything. */
  pills?: React.ReactNode
  /** The line underneath: sizes, counts, whatever is true but secondary. */
  hint?: React.ReactNode
  /** A right-aligned column before the actions -- a timestamp, a size. Lines up
   *  down the list, which is the whole reason it is a slot and not another
   *  pill. */
  trail?: React.ReactNode
  actions?: React.ReactNode
  /** Something that opens underneath this row -- a confirmation, a report, the
   *  detail of the thing named above. A sibling rather than a child, because it
   *  is the full width of the list and not part of the row's own layout.
   *
   *  This exists so callers do not wrap the row in a div of their own: doing
   *  that puts a plain element between `role="list"` and `role="listitem"`,
   *  which breaks the relationship, and it hides the row from the container's
   *  "no rule after the last one" rule. */
  below?: React.ReactNode
  /** Makes the whole row activate. Rendered as a button, so it has a keyboard
   *  and a focus ring, which a `<div onClick>` has neither of. */
  onClick?: () => void
  tone?: 'bad'
  /** The one that is chosen, in a `pick` list. A second signal beside whatever
   *  the row already says in words -- colour is never the only one. */
  picked?: boolean
  /** This row is the thing currently working. */
  loading?: boolean
  /** Something else is working, so this one cannot be chosen yet. */
  waiting?: boolean
  /** `start` when the row has enough text that vertically centred buttons drift
   *  away from the name they belong to. */
  align?: 'center' | 'start'
  className?: string
}) {
  const body = (
    <>
      {/* `min-width: 0` lives in the stylesheet, not inline on every caller.
          Without it this refuses to shrink and the pills go over the edge. */}
      <span className="row-subject">
        <span className="named">
          <span className="truncate">{name}</span>
          {pills}
        </span>
        {hint && <div className="set-hint">{hint}</div>}
      </span>
      {trail && <span className="row-trail set-hint mono">{trail}</span>}
    </>
  )

  const rowClass =
    `set-row rows-row${tone ? ` rows-${tone}` : ''}` +
    `${align === 'start' ? ' rows-top' : ''}${picked ? ' is-picked' : ''}` +
    `${loading ? ' is-loading' : ''}${waiting ? ' is-waiting' : ''}` +
    `${className ? ` ${className}` : ''}`

  return (
    <>
      {/* biome-ignore lint/a11y/useSemanticElements: see `Rows` -- same reason, one level down. */}
      <div className={rowClass} role="listitem">
        {onClick ? (
          <button type="button" className="row-hit" disabled={waiting} onClick={onClick}>
            {body}
          </button>
        ) : (
          body
        )}
        {actions}
      </div>
      {below}
    </>
  )
}

export default Rows
