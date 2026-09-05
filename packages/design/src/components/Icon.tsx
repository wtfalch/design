/**
 * The icon set. One component, one library, named glyphs.
 *
 * There were six hand-drawn icon components -- `ChatIcon`, `GearIcon`,
 * `RefreshIcon`, `MinimizeIcon`, `StudioIcon`, `ConnectivityIcon` -- each a file
 * exporting one path, each drawn to its own weight and its own optical size. Six
 * hands, six sizes, and no way to add a seventh except by drawing it. That is
 * how an interface ends up with a 14px gear beside a 16px chevron and nobody
 * able to say which is wrong.
 *
 * These are **Pepicons Pencil**, hand-drawn, to sit with the Open Peeps
 * illustrations rather than against them. Material Symbols was the set before,
 * and the mismatch was not a matter of taste: Material is a *filled* set at ~27%
 * ink coverage, Open Peeps is pure outline. Two drawings that share a screen
 * should share a technique.
 *
 * **Attribution is a licence condition, not a courtesy.** Pepicons is CC BY 4.0
 * (Open Peeps was CC0, which is why nothing like this line existed before).
 * Credit: Pepicons by Christoph Kuehl -- https://pepicons.com. This comment is
 * not enough on its own; the credit has to be somewhere a user can reach.
 *
 * **Inlined rather than installed.** The npm package ships the whole set, and a
 * font or a bundle has to load before anything draws -- in an app that opens
 * offline, on a machine that has just downloaded it, that is a flash of missing
 * chrome on the one screen that has to inspire confidence. Nineteen glyphs cost
 * nothing and cannot fail to arrive.
 *
 * `currentColor` throughout, so an icon takes the colour of the thing it sits
 * in and never needs a variant.
 *
 * Source names, if you need to add a twentieth from https://pepicons.com:
 *   chat      text-bubble
 *   settings  gear
 *   refresh   arrows-spin
 *   minimize  minus
 *   code      code
 *   wifi      wifi
 *   wifi-off  wifi-off
 *   check     checkmark
 *   close     times
 *   info      info-circle
 *   warning   exclamation-circle
 *   error     no-entry
 *   expand    expand
 *   download  cloud-down
 *   image     photo
 *   bolt      electricity
 *   speaker   speaker-high
 *   mic       microphone
 *   back      arrow-left
 *   spinner   arrow-spin
  file      file
 */

import { TF_ICONS } from '../art/tf-icons'
import { useArt } from '../artContext'
import type { IconName } from './iconNames'

export type { IconName }

export default function Icon({
  name,
  size = 18,
  className,
  title,
}: {
  name: IconName
  /** One number, because these are square and always have been. */
  size?: number
  className?: string
  /** Given only when the icon is the whole message. An icon beside a label it
   *  repeats is decoration, and decoration announced twice is noise. */
  title?: string
}) {
  /* The installed pack's glyph, or tf's. The table with its measured views
     is `art/tf-icons.ts`; a product with its own icons hands a pack to
     `ArtProvider` and the same component draws theirs. */
  const g = (useArt()?.icons ?? TF_ICONS)[name]
  if (!g) return null
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={g.view}
      fill="currentColor"
      /* Pepicons paths are self-intersecting outlines; without evenodd the
         counters fill in and a gear becomes a blob. */
      fillRule="evenodd"
      clipRule="evenodd"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {g.d.map((d) => (
        <path key={d} d={d} />
      ))}
      {g.dots?.map(([cx, cy, r]) => (
        <circle key={`${cx},${cy},${r}`} cx={cx} cy={cy} r={r} />
      ))}
    </svg>
  )
}
