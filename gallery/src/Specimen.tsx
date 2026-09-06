/**
 * One variant, alone on a page, at a size somebody chose.
 *
 * The gallery is built for a person: a rail, a theme picker, and every variant
 * of one component down a scroll. That is the wrong shape for a camera. A
 * screenshot of a 65-variant scroll tells you a pixel moved and not which
 * pixel, and the first thing anybody does with such a diff is open both images
 * and hunt — which is the work the suite was supposed to do.
 *
 * So the same specimens are reachable one at a time:
 *
 *     /design.html?c=select&v=Default&theme=paper&chrome=0
 *
 * `chrome=0` is the part that matters. With the rail gone the page holds one
 * thing, so the diff names the component and the variant in its filename and a
 * changed image is already localised before anyone looks at it.
 *
 * **This is deliberately not a second renderer.** It calls `variant.render()`,
 * the same function the gallery calls, inside the same `.spec-stage` the
 * gallery puts it in — because a specimen page that composes the component
 * itself would be a gallery with its own copy of a button, and would go on
 * passing after the real one broke.
 */
import { useEffect } from 'react'

import type { Target } from './specimenTarget'
import { COMPONENTS } from './specimens'
import { applyGalleryTheme } from './theme'

export default function Specimen({ target }: { target: Target }) {
  const component = COMPONENTS.find((c) => c.id === target.component)
  const variant = component?.variants.find((v) => v.name === target.variant)

  useEffect(() => {
    applyGalleryTheme(target.theme)
  }, [target.theme])

  /* A missing specimen renders as a message rather than nothing at all. An
     empty page screenshots perfectly happily, and a baseline of a blank
     rectangle passes forever -- so the failure has to be visible in the image
     itself, not only in a console nobody reads during a screenshot run. */
  if (!component || !variant) {
    return (
      <div className="spec-missing" data-missing="true">
        No specimen <code>{target.component}</code> / <code>{target.variant}</code>
      </div>
    )
  }

  return (
    <div className={target.chrome ? 'spec-solo' : 'spec-solo spec-bare'}>
      {target.chrome && (
        <div className="spec-label">
          <strong>{component.name}</strong>
          <div className="set-hint">{variant.name}</div>
        </div>
      )}
      {/* The same surface the gallery uses. Most of these are drawn to sit on a
          panel, and judging one against the page background is judging the
          wrong thing -- which would be baked into every baseline. */}
      <div className="spec-stage" data-specimen="ready">
        {variant.render()}
      </div>
    </div>
  )
}
