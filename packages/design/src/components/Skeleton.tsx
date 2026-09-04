/**
 * The shape of what has not arrived yet.
 *
 * Ported from chef-monorepo's `Skeleton`, keeping its API — `variant`,
 * `surface`, `animation`, and the convention that a bare number is a spacing
 * step, so `height={5}` is 20px. That convention lands exactly on this app's
 * four-pixel grid, which is why it survived the port unchanged. What did not
 * survive is `cva` and `clsx`: this project keeps four runtime dependencies on
 * purpose, and two of them would have been for string concatenation.
 *
 * **The colour is `currentColor`, not a named surface.** chef's version picks
 * `bg-surface-muted` or `bg-surface-elevated`, and the first place this landed
 * was a card inside a modal — where the card is already that exact token, so
 * six skeletons rendered invisible on an identical background. Any scheme that
 * names the colour has that in it: the caller has to know what it is being
 * drawn on, and is wrong the first time a surface moves. Ink at low alpha is
 * right on every surface in every theme without anybody deciding.
 *
 * **A skeleton is a promise about layout, not a loading noise.** Its whole job
 * is to occupy the space the real thing will occupy, so nothing jumps when the
 * content lands. A grey box of the wrong size is worse than no box at all: it
 * says "something this shape is coming", and then something a different shape
 * arrives and pushes the page around. If you cannot say what shape is coming,
 * the honest control is `Progress`, which claims nothing about layout.
 *
 * **Invisible to a screen reader.** These are pictures of absent text; read
 * aloud they are nothing at all. Mark the region `aria-busy` and let the
 * announcement come from the content when it arrives — a reader should be told
 * "loading" once, not handed six shapes.
 */

const STEP = 4

/** A bare number is a spacing step; a string is a length, used as given. */
const length = (value: number | string | undefined, fallback: number | string) => {
  const v = value ?? fallback
  return typeof v === 'number' ? `${v * STEP}px` : v
}

export default function Skeleton({
  variant = 'rectangular',
  surface = 'muted',
  animation = 'pulse',
  width = '100%',
  height = 2,
  lines,
  className,
}: {
  variant?: 'rectangular' | 'rounded' | 'circular'
  /** How strongly it reads. Named for the surface in the original because it
   *  chose a colour there; here the colour comes from `currentColor`, so this
   *  is only a strength — `elevated` for the flatter surfaces where a faint
   *  bar disappears. */
  surface?: 'muted' | 'elevated'
  animation?: 'pulse' | 'none'
  width?: number | string
  height?: number | string
  /** A paragraph rather than a bar. The last line is short, because real
   *  paragraphs end mid-line and a block of equal bars reads as a table. */
  lines?: number
  className?: string
}) {
  const cls = `skel skel-${variant} skel-on-${surface}${animation === 'none' ? '' : ' skel-pulse'}${className ? ` ${className}` : ''}`

  if (lines && lines > 1) {
    return (
      <span className="skel-lines" aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            className={cls}
            style={{
              height: length(height, 2),
              width: i === lines - 1 ? '62%' : length(width, '100%'),
            }}
          />
        ))}
      </span>
    )
  }

  return (
    <span
      className={cls}
      aria-hidden="true"
      style={{ height: length(height, 2), width: length(width, '100%') }}
    />
  )
}
