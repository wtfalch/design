/**
 * Moving through a list that does not fit.
 *
 * **It counts in items, not in pages**, because that is what the server
 * answers and what the reader asks. A JMAP query returns a position, a limit
 * and a total; a mailbox is "51–100 of 1,284", not "page 2 of 26". Page
 * numbers are this component's arithmetic, done once here rather than at every
 * call site -- which is where the off-by-one lives, and where it becomes an
 * empty last page.
 *
 * **The count is the point, and it is said out loud.** "51–100 of 1,284" tells
 * you how far in you are and how much is left; two arrows tell you neither. A
 * pager with no count is a pager you navigate by feel.
 *
 * **A total is optional, because a server may refuse to count.** JMAP's
 * `calculateTotal` is a request, not a promise, and a large mailbox is exactly
 * where it gets declined. Without one this shows the range and keeps Next
 * enabled while a full page came back, which is the only honest thing it can
 * do: a page shorter than the limit is the end.
 *
 * **`nav` with a name**, so a screen reader can jump to it and so two pagers
 * on a page are distinguishable. The current page's button is
 * `aria-current="page"`, which is what tells a reader where they are without
 * relying on the colour that says it visually.
 */

import { pageWindow } from './pageWindow'

export interface Props {
  /** Index of the first item shown, counting from zero -- the same number the
   *  query was given, so caller and component never disagree about the origin. */
  position: number
  /** How many are shown per page. */
  limit: number
  /** How many there are in total, when the server was willing to say. */
  total?: number
  /** How many actually came back. A short page is the end of the list, which
   *  is how Next is decided when there is no total. */
  count?: number
  onChange: (position: number) => void
  /** Names this pager. "Mailbox pages", not "Pagination". */
  label: string
  /** What is being counted, for the summary: "of 1,284 messages". */
  unit?: string
  className?: string
}

/** Group digits so a five-figure count can be read at a glance. */
const group = (n: number) => n.toLocaleString('en-GB')

function Chevron({ back }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d={back ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'}
      />
    </svg>
  )
}

export default function Pagination({
  position,
  limit,
  total,
  count,
  onChange,
  label,
  unit = 'items',
  className,
}: Props) {
  const page = Math.floor(position / limit) + 1
  const pages = total === undefined ? undefined : Math.max(1, Math.ceil(total / limit))
  const shown = count ?? limit
  const first = shown === 0 ? 0 : position + 1
  const last = position + shown

  const canGoBack = position > 0
  /* With a total, the last page is known. Without one, a full page means there
     is probably more and a short one means there is not -- which is wrong
     exactly once, on a list whose length is a multiple of the limit, and costs
     one empty page rather than a hidden remainder. */
  const canGoOn = pages === undefined ? shown >= limit : page < pages

  return (
    <nav className={`pager${className ? ` ${className}` : ''}`} aria-label={label}>
      <p className="pager-count">
        {shown === 0 ? (
          `No ${unit}`
        ) : (
          <>
            <strong>
              {group(first)}–{group(last)}
            </strong>
            {total === undefined ? ` ${unit}` : ` of ${group(total)} ${unit}`}
          </>
        )}
      </p>

      <div className="pager-controls">
        <button
          type="button"
          className="pager-step"
          onClick={() => onChange(Math.max(0, position - limit))}
          disabled={!canGoBack}
          aria-label="Previous page"
        >
          <Chevron back />
        </button>

        {pages !== undefined && (
          <ol className="pager-pages">
            {pageWindow(page, pages).map((slot, index, slots) =>
              slot === 'gap' ? (
                /* Keyed by the page it follows rather than by its index: a
                   window can hold two gaps, and an index key makes React
                   reuse the wrong one when the run they elide changes. */
                <li key={`gap-after-${slots[index - 1]}`} className="pager-gap" aria-hidden="true">
                  …
                </li>
              ) : (
                <li key={slot}>
                  <button
                    type="button"
                    className={`pager-page${slot === page ? ' on' : ''}`}
                    aria-current={slot === page ? 'page' : undefined}
                    aria-label={`Page ${slot}`}
                    onClick={() => onChange((slot - 1) * limit)}
                  >
                    {slot}
                  </button>
                </li>
              ),
            )}
          </ol>
        )}

        <button
          type="button"
          className="pager-step"
          onClick={() => onChange(position + limit)}
          disabled={!canGoOn}
          aria-label="Next page"
        >
          <Chevron />
        </button>
      </div>
    </nav>
  )
}
