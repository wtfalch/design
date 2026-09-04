/**
 * A list with nothing in it, said properly.
 *
 * There were two conventions and neither was a component. `.empty` — centred,
 * generously padded — was used by five files; the settings panes used a bare
 * `.set-hint`, which is the same 12px muted line that explains a heading. So
 * "None configured." rendered as a fragment of caption floating under a card
 * title, indistinguishable from a description of the thing above it, and a
 * pane with nothing in it looked like a pane that had failed to finish drawing.
 *
 * **An empty state has three jobs and the old one did none of them.** Say the
 * list is empty rather than leaving it ambiguous with loading. Say why, if
 * there is a why. Offer the thing you would do next, if there is one.
 *
 * **The icon is decoration and is marked as such.** It is there so a pane of
 * cards is scannable by shape — the same argument as `Card`'s. A screen reader
 * gets the sentence, which is the part that carries the meaning.
 *
 * Deliberately quieter than a full-screen empty state: these sit inside a card
 * that already has a heading, so a second large heading here would compete with
 * the one above it. One line, optionally one button.
 *
 * **`illustration` is the same box given a whole surface.** A view with no
 * applets on it is not a slot in a card -- it is the window, and the dashed
 * outline that marks out where a list will be reads as a broken layout at that
 * size. So the figure replaces the icon, the outline goes, and the box centres
 * itself in whatever it was put in. Same component, because it is the same
 * three jobs: say it is empty, say why, offer the next thing.
 */

import Icon, { type IconName } from './Icon'
import Illustration, { type IllustrationName } from './Illustration'

export default function Empty({
  icon,
  illustration,
  children,
  action,
  className,
}: {
  /** Decoration. Omit it where the surrounding card already carries one. */
  icon?: IconName
  /** For an empty *surface* rather than an empty list: a figure instead of the
   *  small mark, and the box loses its outline and centres itself. Wins over
   *  `icon` where both are given -- two drawings saying the same thing is the
   *  noise this is meant to avoid. */
  illustration?: IllustrationName
  /** What is empty, and why if that helps. A sentence, not a label. */
  children: React.ReactNode
  /** The obvious next thing, where there is one. */
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`nothing${illustration ? ' nothing-surface' : ''}${
        className ? ` ${className}` : ''
      }`}
    >
      {illustration ? (
        <Illustration name={illustration} size={160} className="nothing-figure" />
      ) : (
        icon && (
          <span className="nothing-mark" aria-hidden="true">
            <Icon name={icon} size={20} />
          </span>
        )
      )}
      <p className="nothing-said">{children}</p>
      {action && <div className="nothing-act">{action}</div>}
    </div>
  )
}
