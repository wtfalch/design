/**
 * Data that genuinely has columns.
 *
 * **This is not `Rows`, and the difference is not cosmetic.** A `Row` is one
 * thing with a name and some facts about it; you read down the names and stop
 * at the one you want. A table is a grid you read *across* as well as down --
 * comparing the same field between two things is the only reason to line them
 * up in tracks. If nobody will ever compare column three between row two and
 * row nine, it is a list, and a list is `Rows`.
 *
 * **A real `<table>`, because the semantics are the accessibility.** A grid of
 * divs looks identical and announces as a wall of unrelated text: a screen
 * reader reading a `<td>` says which column it is in, and `<th scope>` is what
 * makes that possible. There is no ARIA that gets you back what a `<table>`
 * gives for free, only ARIA that approximates it badly.
 *
 * **Numbers go right.** Not decoration -- digits are compared by their columns,
 * and left-aligned numbers of different lengths cannot be. `align: 'end'` also
 * switches the cell to tabular figures so the digits keep their tracks.
 */

export interface Column<T> {
  /** The heading. Every column has one; an unlabelled column is a column
   *  nobody can ask about. */
  header: string
  /** What to draw in the cell. */
  cell: (item: T) => React.ReactNode
  /** `end` for numbers and sizes, which compare by column. */
  align?: 'start' | 'end'
  /** Hides the heading visually and leaves it for a screen reader -- for the
   *  column of buttons at the end, where a visible "Actions" is noise. */
  quiet?: boolean
  width?: string
}

export default function Table<T>({
  caption,
  columns,
  rows,
  keyOf,
  empty,
  className,
}: {
  /** What the table is. Rendered as a real `<caption>`, which is the one place
   *  a table's name belongs. */
  caption: string
  columns: Column<T>[]
  rows: T[]
  keyOf: (item: T) => string
  empty?: React.ReactNode
  className?: string
}) {
  if (!rows.length) {
    return empty ? <div className="set-hint py-3">{empty}</div> : null
  }
  return (
    /* The one thing about a table that is a property of one element. Its
       cells, headings and last-row rule are structural -- `th:first-child`,
       `tbody tr:last-child td` -- and a structural pseudo-class is the right
       tool for them: expressing the same thing with utilities means this
       component doing index arithmetic to work out what CSS already knows. */
    <div className={['overflow-x-auto', className].filter(Boolean).join(' ')}>
      <table className="data-table">
        {/* Visually hidden rather than absent: the table still needs a name,
            and a heading above it in the markup is not attached to it. */}
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.header}
                scope="col"
                style={{ width: c.width, textAlign: c.align === 'end' ? 'right' : undefined }}
              >
                <span className={c.quiet ? 'sr-only' : undefined}>{c.header}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={keyOf(item)}>
              {columns.map((c, i) => {
                /* The first cell is the row's name, so it is a `<th scope="row">`
                   -- that is what lets a reader ask "which row am I in" and get
                   an answer instead of a cell index. */
                const Cell = i === 0 ? 'th' : 'td'
                return (
                  <Cell
                    key={c.header}
                    scope={i === 0 ? 'row' : undefined}
                    className={c.align === 'end' ? 'num' : undefined}
                  >
                    {c.cell(item)}
                  </Cell>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
