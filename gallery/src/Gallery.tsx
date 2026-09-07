/**
 * The viewer: a rail of components, one component to a page.
 *
 * It was a single scroll of everything, which is the wrong shape for the job.
 * You cannot judge whether four button states are distinguishable while three
 * are off screen, and a page that shows everything shows nothing in particular.
 * So the rail selects, and the pane shows that one component and every variant
 * it has.
 *
 * **The theme switch is the point, not decoration.** TF ships three themes and
 * each is a set of token values, so a component is only as good as its worst
 * theme -- and the only way to know is to flip between them with one component
 * held still in front of you.
 *
 * Nothing here fetches. The gallery must open with no control plane, no model
 * and no conversation, or it is another thing that only works when the app
 * already works.
 */

import { useEffect, useState } from 'react'

import { Brand, Select, TOKEN_KEYS } from '@wtfalch/design'
import { COMPONENTS } from './specimens'
import { applyGalleryTheme, galleryThemes } from './theme'

/** The one page that is not a component. Tokens earn a page because every
 *  component is made of them; a list of panels we chose not to draw did not --
 *  it was a note to ourselves in a catalogue of things you can use. */
const TOKENS_PAGE = '__tokens'

function useTokens(theme: string) {
  const [values, setValues] = useState<[string, string][]>([])
  // biome-ignore lint/correctness/useExhaustiveDependencies: `theme` is the trigger -- the values are re-read after each theme is applied, not derived from the name.
  useEffect(() => {
    // After the theme has been applied, not before: these are computed values,
    // and reading them in the same tick returns the previous theme's.
    const id = requestAnimationFrame(() => {
      const style = getComputedStyle(document.documentElement)
      setValues(TOKEN_KEYS.map((k) => [k, style.getPropertyValue(k).trim()]))
    })
    return () => cancelAnimationFrame(id)
  }, [theme])
  return values
}

/* The token groups, in the order `tokens.css` declares them.
   A flat grid of forty-six was a list, not a reference: `--dur-fast` sat
   between `--scrim` and `--tracking` with nothing to say they answer different
   questions. The file already groups them under headings; this reads the same
   groups back. */
const TOKEN_GROUPS: { title: string; match: (k: string) => boolean }[] = [
  {
    title: 'Colour',
    match: (k) =>
      /^--(bg|panel|panel-2|border|border-strong|text|muted|accent|accent-dim|good|warn|bad|info|on-accent)$/.test(
        k,
      ),
  },
  {
    title: 'Surface & elevation',
    /* `--control` and `--illo-paper` joined the vocabulary in the extraction --
       the surface every input sits on, and the paper behind an illustration --
       and sat under "Ungrouped" until 2026-09-05, which is the page saying a
       token exists and nothing about what kind of thing it is. */
    match: (k) =>
      /^--(app-bg|app-overlay|app-overlay-opacity|shadow-|scrim|control|illo-paper)/.test(k),
  },
  { title: 'Typography', match: (k) => /^--(font|text-|line-height|tracking|weight)/.test(k) },
  { title: 'Shape', match: (k) => /^--(radius|border-width)/.test(k) },
  /* `--space-*` are derived from `--density` and deliberately not themeable,
     so this group is one knob rather than a scale. It used to match `pad-` too,
     which named five tokens `tokens.css` stopped defining when the spacing
     scale was renamed -- the group drew rows for values that resolved to
     nothing. */
  { title: 'Density', match: (k) => /^--density$/.test(k) },
  { title: 'Motion', match: (k) => /^--(dur-|ease)/.test(k) },
  { title: 'Interaction', match: (k) => /^--(hover-|press-|focus-)/.test(k) },
]

/**
 * One token, showing what it does.
 *
 * A colour got a chip and everything else got its literal value printed beside
 * its name -- which tells you `--radius-lg` is `12px` and nothing about what
 * 12px looks like on a corner, and tells you `--ease` is a cubic-bezier and
 * nothing at all. A reference page for a design system whose only legible
 * entries are the colours is a list of variables.
 *
 * So each kind demonstrates itself: a radius bends a corner, a space is a bar
 * that wide, a duration moves something, a shadow falls under a card, a weight
 * and a size are set in the type they describe.
 */
function Demo({ name, value }: { name: string; value: string }) {
  if (
    /^--(bg|panel|border|text|muted|accent|good|warn|bad|info|on-accent|app-bg|scrim|control|illo-paper)/.test(
      name,
    )
  ) {
    return <span className="spec-chip" style={{ background: value }} aria-hidden="true" />
  }
  if (name.startsWith('--radius')) {
    return <span className="spec-demo-radius" style={{ borderRadius: value }} aria-hidden="true" />
  }
  if (/^--(space|gap|pad)/.test(name)) {
    // A bar exactly that wide, so two steps can be compared by eye rather than
    // by reading two numbers.
    return <span className="spec-demo-bar" style={{ width: value }} aria-hidden="true" />
  }
  if (name.startsWith('--shadow')) {
    return <span className="spec-demo-shadow" style={{ boxShadow: value }} aria-hidden="true" />
  }
  if (name.startsWith('--dur') || name.startsWith('--ease')) {
    // Moves on hover. A duration you can only read is a number; a duration you
    // can watch is a decision.
    const isEase = name.startsWith('--ease')
    return (
      <span className="spec-demo-motion" aria-hidden="true">
        <i
          style={
            isEase
              ? { transitionTimingFunction: value, transitionDuration: '600ms' }
              : { transitionDuration: value }
          }
        />
      </span>
    )
  }
  if (name === '--font' || name === '--font-mono') {
    return (
      <span className="spec-demo-type" style={{ fontFamily: value }}>
        Aa 123
      </span>
    )
  }
  if (name.startsWith('--weight')) {
    return (
      <span className="spec-demo-type" style={{ fontWeight: value }}>
        Aa 123
      </span>
    )
  }
  if (name === '--font-size' || name.startsWith('--text')) {
    return (
      <span className="spec-demo-type" style={{ fontSize: value }}>
        Aa Bb
      </span>
    )
  }
  if (name === '--tracking') {
    return (
      <span className="spec-demo-type" style={{ letterSpacing: value }}>
        Aa 123
      </span>
    )
  }
  if (name === '--line-height') {
    // Two lines, because one line cannot show the space between two lines.
    return (
      <span className="spec-demo-lines" style={{ lineHeight: value }}>
        Aa Bb
        <br />
        Cc Dd
      </span>
    )
  }
  if (name === '--focus-ring') {
    return <span className="spec-demo-radius" style={{ boxShadow: value }} aria-hidden="true" />
  }
  // Whatever is left is a number or a keyword, and its value is the whole of
  // what it has to say.
  return <span className="spec-demo-plain mono">{value || '—'}</span>
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="spec-token">
      <span className="spec-demo">
        <Demo name={name} value={value} />
      </span>
      <span className="spec-token-body">
        <span className="spec-token-name mono">{name}</span>
        <span className="spec-token-value mono">{value}</span>
      </span>
    </div>
  )
}

export default function Gallery() {
  const [theme, setTheme] = useState('system')
  const [wide, setWide] = useState(false)
  // The hash, so a component has a URL you can send someone.
  const [current, setCurrent] = useState(() => window.location.hash.slice(1) || COMPONENTS[0].id)
  const tokens = useTokens(theme)

  useEffect(() => {
    applyGalleryTheme(theme)
  }, [theme])

  useEffect(() => {
    const onHash = () => setCurrent(window.location.hash.slice(1) || COMPONENTS[0].id)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  /* One list, sorted by name. It was grouped into Controls / Feedback /
     Structure / Content / System, which sounds like organisation and worked
     like a quiz: knowing which drawer holds Callout means knowing what we
     decided Callout is, and the answer to "where is Tabs" should be "under T".
     Tokens sits at the end because it is the one entry that is not a
     component. */
  const sorted = [...COMPONENTS]
    .filter((c) => !c.section)
    .sort((a, b) => a.name.localeCompare(b.name))
  /* Sections keep the order they are declared in, not the alphabet: a batch
     under review is read in the order somebody decided to present it. */
  const sections: { title: string; items: typeof COMPONENTS }[] = []
  for (const component of COMPONENTS) {
    if (!component.section) continue
    const existing = sections.find((s) => s.title === component.section)
    if (existing) existing.items.push(component)
    else sections.push({ title: component.section, items: [component] })
  }
  const shown = COMPONENTS.find((c) => c.id === current)

  const go = (id: string) => {
    window.location.hash = id
    setCurrent(id)
  }

  return (
    <div className={`spec-app${wide ? ' spec-wide' : ''}`}>
      <aside className="spec-rail">
        <div className="spec-brand">
          <Brand className="brand" />
          <span className="set-hint">components</span>
        </div>

        <div className="spec-controls">
          <label className="set-hint" htmlFor="spec-theme">
            Theme
          </label>
          {/* The app's own control, not a bare `<select>`. A gallery that
              reaches for the native element to save a line is a gallery
              demonstrating something the app does not ship. */}
          <Select
            aria-label="Theme"
            block
            id="spec-theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            {galleryThemes().map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </Select>
          <label className="spec-check">
            <input type="checkbox" checked={wide} onChange={(e) => setWide(e.target.checked)} />
            <span className="set-hint">Wide</span>
          </label>
        </div>

        <nav className="spec-nav">
          {sorted.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`spec-link${c.id === current ? ' on' : ''}`}
              onClick={() => go(c.id)}
            >
              {c.name}
              <span className="set-hint">{c.variants.length}</span>
            </button>
          ))}
          {sections.map((section) => (
            <div key={section.title} className="spec-group">
              <div className="spec-group-title set-hint">{section.title}</div>
              {section.items.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={`spec-link${c.id === current ? ' on' : ''}`}
                  onClick={() => go(c.id)}
                >
                  {c.name}
                  <span className="set-hint">{c.variants.length}</span>
                </button>
              ))}
            </div>
          ))}
          <button
            type="button"
            className={`spec-link${current === TOKENS_PAGE ? ' on' : ''}`}
            onClick={() => go(TOKENS_PAGE)}
          >
            Tokens<span className="set-hint">{tokens.length}</span>
          </button>
        </nav>
      </aside>

      <main className="spec-main">
        {shown && (
          <>
            <h2>{shown.name}</h2>
            {shown.blurb && <p className="spec-blurb">{shown.blurb}</p>}
            {shown.variants.map((v) => (
              <div key={v.name} className="spec-item">
                <div className="spec-label">
                  <strong>{v.name}</strong>
                  {v.note && <div className="set-hint">{v.note}</div>}
                </div>
                {/* On the app's own surface, not the page's: most of these are
                    drawn to sit on a panel, and judging them against the wrong
                    background is judging the wrong thing. */}
                <div className="spec-stage">{v.render()}</div>
              </div>
            ))}
          </>
        )}

        {current === TOKENS_PAGE && (
          <>
            <h2>Tokens</h2>
            <p className="spec-blurb">
              The whole themeable vocabulary, live. `styles.css` may only consume these and a theme
              may only supply them, so anything not on this list cannot be themed — by design.
            </p>
            {TOKEN_GROUPS.map((g) => {
              const mine = tokens.filter(([k]) => g.match(k))
              if (!mine.length) return null
              return (
                <div key={g.title} className="spec-token-group">
                  <h3>{g.title}</h3>
                  <div className="spec-tokens">
                    {mine.map(([name, value]) => (
                      <Swatch key={name} name={name} value={value} />
                    ))}
                  </div>
                </div>
              )
            })}
            {/* Anything a group did not claim, so adding a token to `tokens.css`
                and forgetting to file it here shows up rather than vanishing. */}
            {(() => {
              const rest = tokens.filter(([k]) => !TOKEN_GROUPS.some((g) => g.match(k)))
              return rest.length ? (
                <div className="spec-token-group">
                  <h3>Ungrouped</h3>
                  <div className="spec-tokens">
                    {rest.map(([name, value]) => (
                      <Swatch key={name} name={name} value={value} />
                    ))}
                  </div>
                </div>
              ) : null
            })()}
          </>
        )}
      </main>
    </div>
  )
}
