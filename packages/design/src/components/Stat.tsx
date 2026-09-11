/**
 * One figure, with what it counts over it and what it means under it.
 *
 * **Drawn three times before it was a component.** valet's portal overview
 * and its organisation page under `/admin` each had their own, and the same
 * account's numbers rendered in two shapes on the two surfaces read as two
 * products rather than as two views of one thing. Folding them into one local
 * `Stat` fixed that inside valet and left the next app to rediscover it;
 * valet's own docblock says so ("a candidate for the package, once a second
 * product wants one"). The mail client's counts are the second product.
 *
 * **`tabular-nums`, and that is the reason this is not a `Card`.** Figures
 * are read down a row, and proportional digits put the same magnitude in
 * different places on every tile, so a column of numbers stops being
 * comparable at a glance. A tile is not a card with a big number in it: it is
 * a number with furniture, and the furniture exists to make the number
 * legible next to the one beside it.
 *
 * **The label goes over the value.** A figure read before you know what it
 * counts is a figure you read twice. This is the one place in the package
 * where the caption leads.
 *
 * **`look="bare"` is the compact form**, for a figure inside a row that
 * already has a border around it -- valet's `.v-figure`, in the admin table.
 * A bordered tile inside a bordered row is two boxes saying one thing.
 */

export default function Stat({
  label,
  value,
  note,
  tone,
  look = 'tile',
  className,
}: {
  /** What is being counted. Over the value, not under it. */
  label: React.ReactNode
  /** The figure. A string, because the formatting -- locale, unit, precision
   *  -- is the caller's: this component cannot know whether 1024 should read
   *  as `1,024`, `1.0k` or `1 KiB`. */
  value: React.ReactNode
  /** The sentence under the figure. What it excludes, when it was measured,
   *  what it is a fraction of. */
  note?: React.ReactNode
  /** Semantic colour on the value, the same four words as `Callout` and
   *  `Pill`. Left off, a figure is just a figure -- which is right for most
   *  of them, and a row where every tile is coloured says nothing. */
  tone?: 'info' | 'good' | 'warn' | 'bad'
  /** `tile` has a border and a panel behind it. `bare` is the figure alone,
   *  for a cell in something already bordered. */
  look?: 'tile' | 'bare'
  className?: string
}) {
  /* Utilities, so the tile's shape reads where it is drawn. `bare` states
     the compact shape rather than adding a class that undoes the tile's --
     which is the mistake the old element reset made across this package.
     `stat` and `stat-value` stay as hooks: the tone is an attribute on the
     tile colouring a child, which is a relationship, and a utility is a
     property on one element. */
  const tile =
    look === 'bare'
      ? 'grid gap-0 leading-[1.25]'
      : 'grid gap-1 p-4 border border-border rounded-md surface-panel'

  const classes = ['stat', tile, '[&>p]:m-0', className].filter(Boolean).join(' ')

  return (
    <div className={classes} data-tone={tone}>
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`stat-value font-strong tabular-nums ${look === 'bare' ? 'text-sm' : 'text-lg'}`}
      >
        {value}
      </p>
      {note && <p className="text-xs text-muted">{note}</p>}
    </div>
  )
}
