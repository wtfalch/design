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
      className={[
        'nothing-surface-or-slot grid justify-items-center text-center rounded-md',
        /* Dashed rather than solid: a solid border reads as a thing, and the
           point of this box is that there is no thing -- it marks out where
           the list will be. */
        illustration
          ? /* A whole surface rather than a slot in a card. The outline goes,
               because a window-sized dashed rectangle reads as a layout that
               failed rather than a view with nothing on it, and the box
               centres itself in whatever it was dropped into. */
            'gap-3 py-10 px-4 m-auto'
          : 'gap-2 py-5 px-4 border border-dashed border-border-strong',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {illustration ? (
        /* `currentColor` reaches the figure through the two rules the
           illustrations ship with, so the colour is set here and the drawing
           follows it -- the same grey as the sentence under it, in every
           theme.

           This wanted a rule of its own for a while. `.illo` sets
           `color: inherit`, and while the package's sheets were unlayered an
           unlayered declaration beat a layered utility whatever the
           specificity, so `text-muted` lost silently and the figure came out
           full text black beside a muted sentence. Wrapping the sheets in
           `@layer components` put them *below* `@layer utilities` in the
           declared order, and the utility has won ever since. */
        <Illustration name={illustration} size={160} className="text-muted" />
      ) : (
        icon && (
          <span className="text-muted leading-[0]" aria-hidden="true">
            <Icon name={icon} size={20} />
          </span>
        )
      )}
      {/* `--text-sm`, not the `--text-xs` this used to be: a sentence
          somebody is meant to read, not a caption qualifying something. */}
      <p className="m-0 text-muted text-sm leading-[1.5] max-w-[46ch]">{children}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
