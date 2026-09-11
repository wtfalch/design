'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

import { useState } from 'react'

/**
 * Pick a tile size by sweeping a grid, the way a spreadsheet asks for table
 * dimensions.
 *
 * Six preset buttons and a `2×1` dropdown both said the same thing in a
 * notation you have to decode. A tile is a rectangle on a grid, so the control
 * is that rectangle: hover to see the shape you would get, click to take it.
 * The label underneath keeps the numbers for anyone who wants them.
 *
 * It grows as you reach its edge, the way a spreadsheet's does: showing every
 * cell up to the ceiling would be a wall of squares you have to aim in, and
 * showing a fixed few would put the larger sizes behind a number box. Reaching
 * the last column offers one more, and only then.
 *
 * `max` is the ceiling, and it means something: for an applet it is the
 * dashboard grid you configured, so the control cannot offer a tile the layout
 * has no room for.
 */
export default function SizeGrid({
  value,
  max = { cols: 3, rows: 3 },
  disabled = false,
  onChange,
}: {
  value: { cols: number; rows: number }
  /** The furthest this can go. The grid never offers past it. */
  max?: { cols: number; rows: number }
  disabled?: boolean
  onChange: (size: { cols: number; rows: number }) => void
}) {
  // What the pointer is over, which is what gets shown. Falls back to the real
  // value on leave, so the control never lies about what is selected.
  const [hover, setHover] = useState<{ cols: number; rows: number } | null>(null)
  const shown = hover ?? value

  // One spare row and column beyond whatever is reached, so there is always
  // somewhere further to go until the ceiling says otherwise.
  const extent = {
    cols: Math.min(max.cols, Math.max(value.cols, shown.cols) + 1),
    rows: Math.min(max.rows, Math.max(value.rows, shown.rows) + 1),
  }

  const cells = []
  for (let row = 1; row <= extent.rows; row++) {
    for (let col = 1; col <= extent.cols; col++) {
      const on = col <= shown.cols && row <= shown.rows
      const chosen = col <= value.cols && row <= value.rows
      cells.push(
        <button
          key={`${col}x${row}`}
          type="button"
          /* `size-cell` stays as the hook for the two states: `on` is a fill
             from `color-mix`, which is not a utility. The rest -- a painted
             cell with no contents, so it says it is a block rather than
             taking a control's arrangement -- is here. */
          className={[
            /* Geometry here; colour in `sizegrid.css`. The cell's resting border and
             surface are the thing `on` and `chosen` override, and a utility
             beats a component rule once the sheets are layered -- so stated
             here they would win permanently and no cell would ever light up. */
            'size-cell block w-[18px] h-[14px] p-0 rounded-sm cursor-pointer',
            'disabled:cursor-default disabled:opacity-50',
            on ? 'on' : '',
            chosen && !hover ? 'chosen' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={disabled}
          aria-label={`${col} by ${row}`}
          onMouseEnter={() => !disabled && setHover({ cols: col, rows: row })}
          onFocus={() => !disabled && setHover({ cols: col, rows: row })}
          onClick={() => onChange({ cols: col, rows: row })}
        />,
      )
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${extent.cols}, 1fr)` }}
        onMouseLeave={() => setHover(null)}
      >
        {cells}
      </div>
      <span className="set-hint mono">
        {shown.cols} × {shown.rows}
        {(extent.cols === max.cols || extent.rows === max.rows) && (
          <span className="opacity-[0.55]">
            {' '}
            · max {max.cols}×{max.rows}
          </span>
        )}
      </span>
    </div>
  )
}
