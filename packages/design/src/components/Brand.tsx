import { useEffect, useRef, useState } from 'react'

/**
 * The wordmark: the app icon's mark, without the tile.
 *
 * A lowercase tf in one unbroken stroke -- down the t, round the foot, up the
 * f, over its head, and back along the crossbar through both stems. The path
 * is the one `desktop/build/icon.html` draws, and `test/brandMark.test.ts`
 * fails the moment the two differ. The header used to typeset "TF" to match
 * an icon that did the same, and the pair only stayed in step because a
 * comment in the icon asked the header to follow it.
 *
 * `currentColor`, so the stylesheet decides the colour and a theme can move
 * it; the mark itself knows nothing about green. No `width` or `height`
 * attributes either: the viewBox is the ink box, measured, and `.brand` sets
 * a height off the type scale so the width follows the aspect.
 *
 * **Under the pointer it becomes a cog and turns.** The mark is one stroke
 * and a cog's outline is one stroke, so the two are sampled at the same
 * number of points along their length and the points are slid from one
 * shape to the other, frame by frame -- CSS cannot morph them, because a
 * path animation needs the same commands in the same order and a `V A V A A
 * H` has nothing in common with a hundred `L`s round a gear. Honoured by
 * `prefers-reduced-motion`: the mark stays the mark.
 */

const D = 'M372 262V620A100 100 0 0 0 572 620V330A92 92 0 0 1 756 330A100 100 0 0 1 656 430H296'

/* The stroke's outer bounds, not the canvas: x 248..804, y 190..768. The
   stroke is 96 wide, so 48 of cap and arc on every side is already in these. */
const VIEW = '248 190 556 578'

/* The cog, in the mark's own coordinates: centred on the ink box, teeth to
   the box's edge. Six teeth, each a flat tip on two flanks over a root, as
   one closed outline of `N` points -- the same `N` the mark is sampled at,
   which is the whole trick. The stroke ends where it starts, and a round cap
   on each end makes the seam invisible.

   Eight teeth at two-thirds of the mark's weight -- the first version, and
   the one kept. Six at full weight (#172) and seven at nearly full were
   tried on William's "fatter, fewer teeth"; both lost the wheel: a thick
   stroke fills the ring and the teeth become petals. "Can you not make it
   look like the wheel we had?" This is that wheel.

   Solid, since 2026-09-03. A stroked outline of a cog is a drawing of a
   cog, and at header size it read as one -- "the uncanny valley where it
   looks like a settings icon but isn't one". The morph is still stroke to
   stroke, because that is the only way the points can slide; what changed
   is the end of it: over the last quarter a fill comes up inside the
   outline, with a round hole growing at the centre, and the stroke thins
   to an edge. The result is the plain cog everyone recognises -- body,
   hole, square teeth -- and the flanks are steeper than before so the
   teeth are teeth and not petals once they are filled. Eight teeth again since
   2026-09-03 -- nine and ten were tried once the cog was solid and both taken
   back; 144 samples divide by eight. */
const N = 144
const TEETH = 8
/* Every radius and stroke below is 0.9 of what it was on 2026-09-03: the
   cog at the mark's full height read large beside the mark, 0.8 read
   small, so a tenth off, proportions kept. */
const CENTRE = { x: 526, y: 479 }
const R_ROOT = 158
const R_TIP = 236
/* The hole, as a share of the tip radius: the reference cog's is about 0.42. */
const R_HOLE = 104
/* The outline stroke rounds every corner of the filled polygon by half its
   width -- a round join at each vertex. 40 left the teeth square; 64 was the
   reference's rounding and a touch heavy. 48 now, sized with the teeth so
   that a tooth is as wide as the mark's stroke: the tip arc at the outline's
   outer edge is 0.22 of 2*pi*(262+24)/8 = 49, plus the outline's 48, is 97
   against the mark's 96. The ring, root to hole, is 176+24-116 = 84. */
const COG_STROKE = 43
/* A thin ring inside the hole, concentric, with clear ground between it and
   the body -- the hub a cog wheel has and a plain disc with a hole does not.
   Radius to the ring's centreline, and its stroke. */
const R_HUB = 56
const HUB_STROKE = 20
const MARK_STROKE = 96
/* Where along the morph the fill starts coming up. Earlier and the fill
   shows under a shape that is still mostly the mark, which is a blot. */
const FILL_FROM = 0.72

function cogPoints(): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i < N; i++) {
    const u = i / N
    const a = u * Math.PI * 2 - Math.PI / 2
    // Where in its tooth this point is: root, up the flank, along the tip,
    // down the flank. The flanks are ramps rather than steps so the sampled
    // outline has no corners the interpolation would cut.
    const t = (u * TEETH) % 1
    let r: number
    // A tooth as wide as the mark's stroke -- see COG_STROKE.
    // The base of a tooth spans 0.40 of its period and the tip 0.22, so each
    // tooth narrows towards its tip -- the flanks lean in.
    if (t < 0.3) r = R_ROOT
    else if (t < 0.39) r = R_ROOT + ((t - 0.3) / 0.09) * (R_TIP - R_ROOT)
    else if (t < 0.61) r = R_TIP
    else if (t < 0.7) r = R_TIP - ((t - 0.61) / 0.09) * (R_TIP - R_ROOT)
    else r = R_ROOT
    out.push([CENTRE.x + r * Math.cos(a), CENTRE.y + r * Math.sin(a)])
  }
  return out
}

const COG = cogPoints()

/* The cog's outline, started at the tooth and run in the direction that
   keeps the points' journeys shortest. Point `i` of the mark slides to point
   `i` of the cog, so where the cog's `i = 0` falls -- and which way round it
   goes -- decides whether the mark unwinds into the ring or crumples through
   it on the way. Every start and both directions are tried once, against
   the mark as measured, and the one with the least total travel wins. */
function aligned(mark: [number, number][]): [number, number][] {
  let best = COG
  let least = Number.POSITIVE_INFINITY
  for (const dir of [1, -1]) {
    for (let start = 0; start < N; start++) {
      let travel = 0
      for (let i = 0; i < N; i++) {
        const c = COG[(((start + dir * i) % N) + N) % N]
        const dx = c[0] - mark[i][0]
        const dy = c[1] - mark[i][1]
        travel += dx * dx + dy * dy
      }
      if (travel < least) {
        least = travel
        best = mark.map((_, i) => COG[(((start + dir * i) % N) + N) % N])
      }
    }
  }
  return best
}

function toPath(points: [number, number][], close: boolean): string {
  const body = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')
  return close ? body + 'Z' : body
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/* 180 ms, from 520: William asked for much faster. It is the time the eye
   needs to see it happen, not a beat to admire. */
const MORPH_MS = 180

export default function Brand({
  className,
  title = 'tf',
  cog,
}: {
  className?: string
  /** The product's name, which is what a screen reader should say the header
   *  starts with. There is no text beside this to repeat it. */
  title?: string
  /** Show the cog. Given, the caller decides -- the settings button wraps
   *  the mark and hovers as a whole; left out, the mark watches its own
   *  pointer. */
  cog?: boolean
}) {
  const still = useRef<SVGPathElement>(null)
  /* The mark sampled along its own length, once, off the real path -- the
     browser does the arc arithmetic -- and the cog aligned to it. Null
     until it has. */
  const mark = useRef<[number, number][] | null>(null)
  const ring = useRef<[number, number][]>(COG)
  /* 0 is the mark, 1 is the cog; what is drawn is the point between. */
  const [t, setT] = useState(0)
  const [hovered, setHovered] = useState(false)
  const hover = cog ?? hovered
  const frame = useRef<number>(0)

  useEffect(() => {
    const el = still.current
    if (!el || mark.current) return
    const len = el.getTotalLength()
    const pts: [number, number][] = []
    for (let i = 0; i < N; i++) {
      const p = el.getPointAtLength((len * i) / (N - 1))
      pts.push([p.x, p.y])
    }
    mark.current = pts
    ring.current = aligned(pts)
  }, [])

  useEffect(() => {
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
      return
    const from = t
    const to = hover ? 1 : 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (from === to) return
    const started = performance.now()
    const step = (now: number) => {
      const k = Math.min(1, (now - started) / (MORPH_MS * Math.abs(to - from)))
      setT(from + (to - from) * ease(k))
      if (k < 1) frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame.current)
    // `t` is the starting point of a run, read once when `hover` flips.
  }, [hover])

  const morphing = t > 0 && mark.current
  const d = morphing
    ? toPath(
        mark.current!.map(([x, y], i) => [
          x + (ring.current[i][0] - x) * t,
          y + (ring.current[i][1] - y) * t,
        ]),
        t >= 1,
      )
    : D
  const width = MARK_STROKE + (COG_STROKE - MARK_STROKE) * t
  /* The body: 0 until FILL_FROM, 1 at the cog. The hole grows with it, so
     the fill arrives as a disc that opens rather than a ring that appears. */
  const body = Math.max(0, Math.min(1, (t - FILL_FROM) / (1 - FILL_FROM)))
  const hole = R_HOLE * body
  const holePath =
    body > 0
      ? ` M${CENTRE.x + hole} ${CENTRE.y} A${hole} ${hole} 0 1 0 ${CENTRE.x - hole} ${CENTRE.y}` +
        ` A${hole} ${hole} 0 1 0 ${CENTRE.x + hole} ${CENTRE.y} Z`
      : ''

  return (
    <svg
      /* `brand-turning` -- the slow spin once the cog is complete -- is not
         applied since 2026-09-03: William asked to try it without. The rule
         is still in the stylesheet; putting the class back is the whole
         change. */
      className={className}
      viewBox={VIEW}
      fill="none"
      role="img"
      aria-label={title}
      onPointerEnter={cog === undefined ? () => setHovered(true) : undefined}
      onPointerLeave={cog === undefined ? () => setHovered(false) : undefined}
    >
      <title>{title}</title>
      {/* The mark, always in the document so its length can be measured and
          so the static case is exactly the path the icon draws. Hidden while
          the morph draws on top of it. */}
      <path
        ref={still}
        d={D}
        stroke="currentColor"
        strokeWidth="96"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={morphing ? { opacity: 0 } : undefined}
      />
      {morphing && body > 0 && (
        <path d={d + holePath} fill="currentColor" fillRule="evenodd" fillOpacity={body} />
      )}
      {morphing && body > 0 && (
        <circle
          cx={CENTRE.x}
          cy={CENTRE.y}
          r={R_HUB * body}
          stroke="currentColor"
          strokeWidth={HUB_STROKE}
          strokeOpacity={body}
        />
      )}
      {morphing && (
        <path
          d={d}
          stroke="currentColor"
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}
