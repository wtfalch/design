'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

import { useEffect, useId, useRef, useState } from 'react'

/**
 * A number chosen from a range, by dragging.
 *
 * For a setting whose answer is "about this much" rather than one of a list:
 * how much memory tf may take, say. A `Select` with eight sizes on it makes
 * the person pick the nearest wrong one; a box you type a number into asks
 * them to know the ceiling. A slider shows the ceiling, the floor, and where
 * between them they are.
 *
 * **Bounded, always.** `min` and `max` are required rather than defaulted,
 * because a slider with an invented ceiling lies about what the machine can
 * do. **Stepped, optionally.** `step` given, the knob snaps to that interval
 * -- half a gigabyte, five minutes -- and the value is always one of the
 * marks. Without it the range is continuous (`step="any"`) and the value is
 * wherever the knob stopped, which is right for a quantity nobody counts in
 * units.
 *
 * **Applies on release, shows while dragging.** A setting that saved on
 * every pixel would put a hundred writes behind one gesture, so `onChange`
 * fires when the knob is let go and the value beside the knob follows the
 * drag live. That is the *native* `change` event, listened for directly:
 * React's `onChange` on an input is its `input` event under another name
 * and fires per pixel, which is exactly what the first version did -- every
 * pixel saved, every save handed the value back, and the knob snapped to
 * wherever the last reply said while the pointer was still down. Nobody
 * could drag it. The keyboard is the one place even the native event is too
 * eager: an arrow key fires `change` per press, and the same replies landed
 * between presses (measured: twenty-two presses from the floor landed at
 * 2.5 rather than 12). So key presses settle for a third of a second before
 * they are said, and while a drag or a settle is under way the prop is not
 * allowed to overwrite what is on screen.
 *
 * A native `<input type="range">`, for the same reason `Toggle` is a native
 * checkbox: the keyboard, the focus ring and the announcement come free, and
 * `aria-valuetext` says the value in the caller's words ("12.0 GB") rather
 * than as a bare number.
 */
export default function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  format = (v) => String(v),
  disabled,
  labelHidden,
  size = 'md',
  danger,
  className,
}: {
  label: React.ReactNode
  /** What it decides, or what the ends of it mean. */
  hint?: React.ReactNode
  value: number
  min: number
  max: number
  /** The interval the knob snaps to. Absent, the range is continuous. */
  step?: number
  /** The value settled on: knob released, or a key pressed. */
  onChange: (value: number) => void
  /** The value in words, beside the knob and to a screen reader. */
  format?: (value: number) => string
  disabled?: boolean
  labelHidden?: boolean
  /** The same three names every other control takes, and the same three
   *  boxes: `sm`, `md` and `lg` are `.size-sm`, `.size-md` and `.size-lg`'s
   *  padding and type, so a slider beside a button or a select of the same
   *  size is the same height. Widths 120, 150 and 180. */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Where the range starts to be a risk. The fill is the accent up to
   * `from` and drifts, step by step, to the danger colour at `to` (the
   * maximum when omitted) -- so a value past the safe mark reads as such
   * without a word beside it, and the further past, the more so. For a
   * ceiling somebody may raise past what was measured.
   */
  danger?: { from: number; to?: number }
  className?: string
}) {
  const id = useId()
  // What the knob is at while it is being dragged. The prop is what was
  // last settled; between the two the drag is shown and nothing is saved.
  const [live, setLive] = useState(value)
  const input = useRef<HTMLInputElement>(null)
  const keyboard = useRef(false)
  const dragging = useRef(false)
  const settling = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Read at commit time rather than closed over, so the native listener
  // below is registered once and still calls the caller's latest handler.
  const commit = useRef(onChange)
  commit.current = onChange
  useEffect(() => {
    if (!dragging.current && settling.current === null) setLive(value)
  }, [value])
  useEffect(() => {
    const el = input.current
    if (!el) return
    const settle = () => {
      const v = Number(el.value)
      if (settling.current !== null) clearTimeout(settling.current)
      if (!keyboard.current) return commit.current(v)
      settling.current = setTimeout(() => {
        settling.current = null
        commit.current(v)
      }, 350)
    }
    el.addEventListener('change', settle)
    return () => {
      el.removeEventListener('change', settle)
      if (settling.current !== null) clearTimeout(settling.current)
    }
  }, [])
  const fill = max > min ? ((Math.min(max, Math.max(min, live)) - min) / (max - min)) * 100 : 0
  // How far into the risk the value is, 0..1: none up to `from`, all at `to`.
  const risk = danger
    ? Math.max(0, Math.min(1, (live - danger.from) / ((danger.to ?? max) - danger.from || 1)))
    : 0

  return (
    <div
      className={`slider-row slider-${size}${disabled ? ' is-disabled' : ''}${className ? ` ${className}` : ''}`}
    >
      <label htmlFor={id} className={labelHidden ? 'sr-only' : 'slider-body'}>
        <span className="text-text">{label}</span>
        {hint && <span className="slider-hint">{hint}</span>}
      </label>
      <div className="slider-control">
        {/* The box is the drawing -- a select's box with the track filled to
            the value -- and the input is laid invisibly over the track:
            `--slider-f` on the track, the knob from the input. */}
        <span className="slider-box">
          <span
            className="slider-track"
            style={
              {
                '--slider-f': String(fill / 100),
                '--slider-risk': `${Math.round(risk * 100)}%`,
              } as React.CSSProperties
            }
          >
            <input
              id={id}
              type="range"
              className="slider"
              min={min}
              max={max}
              step={step ?? 'any'}
              value={live}
              disabled={disabled}
              aria-valuetext={format(live)}
              ref={input}
              onKeyDown={() => {
                keyboard.current = true
              }}
              onPointerDown={() => {
                keyboard.current = false
                dragging.current = true
              }}
              onPointerUp={() => {
                dragging.current = false
              }}
              onPointerCancel={() => {
                dragging.current = false
              }}
              // React's `onChange` is the per-pixel event; it only draws. The
              // commit is the native `change`, wired above.
              onChange={(e) => setLive(Number(e.target.value))}
            />
          </span>
          <output htmlFor={id} className="slider-value mono">
            {format(live)}
          </output>
        </span>
        {/* The two ends of the range, under the box's corners. */}
        <span className="slider-end mono" aria-hidden="true">
          {format(min)}
        </span>
        <span className="slider-end mono" aria-hidden="true">
          {format(max)}
        </span>
      </div>
    </div>
  )
}
