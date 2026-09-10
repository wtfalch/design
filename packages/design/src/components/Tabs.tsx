'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

/**
 * One row of choices where only one is showing.
 *
 * **The arrow keys are the point.** A tab list is a single tab stop: you Tab
 * into it once and then move along it with arrows. Rendering tabs as ordinary
 * buttons gives the opposite -- one stop per tab -- so a keyboard user pages
 * through the whole strip to reach whatever is after it. That is invisible
 * unless you put the mouse down, which is why it is worth having a component
 * that cannot get it wrong.
 *
 * **Settings' rail is one of these, and I said it was not.** The earlier note
 * here argued that a vertical list with an explanatory line under each name is
 * "a different control that happens to select one of several panes". That was
 * about how it looks. It is a tablist by every behavioural test -- one of ten
 * is current, choosing one swaps the pane beside it, `aria-current` was already
 * on it -- and being written as ten plain buttons cost exactly what this
 * component exists to prevent: ten tab stops between the top of the window and
 * the pane. `orientation="vertical"` is the smaller change.
 *
 * `ViewTabs` is still not one: it carries inline rename, drag-to-reorder and a
 * cog per tab, and swapping it for this would delete features to gain a
 * keyboard it can be given directly. The studio's "Source / Preview" is one
 * button that changes its own label, which is a toggle.
 *
 * **Groups are headings, not tabs.** A vertical rail can put its tabs under
 * group labels -- Settings has fifteen leaves and a flat list of fifteen is a
 * list you read twice. The label is a heading with a hint under it and is not
 * interactive: a button inside a tablist that is not a tab is a thing the
 * arrow keys do not know about, and a collapsed group would hide tabs from a
 * keyboard that expects to reach every one. So the rail shows everything and
 * the group says what the tabs under it have in common; a tab inside a group
 * shows no hint of its own, because the group's is the context and fifteen
 * one-liners is the height the grouping was meant to save. Horizontal strips
 * ignore groups -- there is no room above a tab for a heading.
 */

import React, { useRef } from 'react'

export interface Tab {
  id: string
  label: string
  /** Shown after the label, for a count or a state. */
  badge?: string
  /**
   * What the badge means, on hover and to a screen reader.
   *
   * A badge is one or two characters by design, and a mark that terse either
   * explains itself or does not. valet had two on its admin strip that did
   * not, and moved them out of the badge into a visible line rather than ship
   * a glyph nobody could resolve -- which is a page working around a
   * component, not a page making a choice.
   *
   * On `title` plus `aria-label`, not `title` alone: `title` never appears on
   * a touch screen and is inconsistently announced, so the accessible name is
   * set explicitly. The badge becomes a labelled `<abbr>`-shaped thing rather
   * than decoration, which is what it always was.
   *
   * Additive, deliberately. Without this the badge's own text stays part of
   * the tab's accessible name, which is right for the count case the prop
   * above was written for -- "Keys 3" is a useful thing to hear. Hiding an
   * untitled badge would have been the tidier rule and would have taken that
   * count away from everyone already relying on it.
   */
  badgeTitle?: string
  /** A line under the label, for a rail with room for one. Ignored in a
   *  horizontal strip, where there is none, and under a group, where the
   *  group's hint is the context. */
  hint?: string
  disabled?: boolean
  /** The group this tab sits under in a vertical rail -- a `TabGroup.id`.
   *  Tabs of one group must be adjacent in `tabs`; the label is drawn above
   *  the first of them. */
  group?: string
}

export interface TabGroup {
  id: string
  label: string
  /** What the tabs under this label have in common, in one line. */
  hint?: string
}

export default function Tabs({
  tabs,
  value,
  onChange,
  label,
  orientation = 'horizontal',
  groups = [],
  className,
}: {
  tabs: Tab[]
  value: string
  onChange: (id: string) => void
  /** What this set of tabs is choosing between. */
  label: string
  /** `vertical` for a rail down the side of a pane — Settings' sections,
   *  which are tabs in every way that matters and were separate tab stops
   *  because they were written as buttons. */
  orientation?: 'horizontal' | 'vertical'
  /** The headings a vertical rail draws above runs of tabs that name them in
   *  `Tab.group`. A group no tab names is not drawn. */
  groups?: TabGroup[]
  className?: string
}) {
  const strip = useRef<HTMLDivElement>(null)
  const grouped = orientation === 'vertical' && groups.length > 0

  const move = (from: number, by: number) => {
    const n = tabs.length
    for (let i = 1; i <= n; i++) {
      const at = (from + by * i + n * n) % n
      if (!tabs[at].disabled) {
        onChange(tabs[at].id)
        // Focus follows selection, which is the pattern for tabs whose panels
        // are cheap to show. The alternative -- move focus, select on Enter --
        // is for tab panels that cost something to render, and none here do.
        strip.current?.querySelectorAll<HTMLElement>('[role="tab"]')[at]?.focus()
        return
      }
    }
  }

  return (
    <div
      className={`tabs tabs-${orientation}${className ? ` ${className}` : ''}`}
      role="tablist"
      aria-label={label}
      aria-orientation={orientation}
      ref={strip}
    >
      {tabs.map((t, i) => (
        <React.Fragment key={t.id}>
          {/* The heading above the first tab of a run. Not a tab and not
            focusable -- see the note at the top. */}
          {grouped &&
            t.group &&
            tabs[i - 1]?.group !== t.group &&
            (() => {
              const g = groups.find((x) => x.id === t.group)
              return g ? (
                <div className="tab-group" role="presentation">
                  <span className="tab-group-label">{g.label}</span>
                  {g.hint && <span className="tab-hint">{g.hint}</span>}
                </div>
              ) : null
            })()}
          <button
            role="tab"
            type="button"
            className={`tab${t.id === value ? ' on' : ''}${grouped && t.group ? ' in-group' : ''}`}
            aria-selected={t.id === value}
            disabled={t.disabled}
            /* One tab stop for the whole strip: everything but the current tab is
             taken out of the tab order, and the arrows move between them. */
            tabIndex={t.id === value ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault()
                move(i, 1)
              }
              if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault()
                move(i, -1)
              }
              if (e.key === 'Home') {
                e.preventDefault()
                move(-1, 1)
              }
              if (e.key === 'End') {
                e.preventDefault()
                move(tabs.length, -1)
              }
            }}
          >
            <span className="tab-label">{t.label}</span>
            {t.badge && (
              <span className="tab-badge" title={t.badgeTitle} aria-label={t.badgeTitle}>
                {t.badge}
              </span>
            )}
            {t.hint && orientation === 'vertical' && !(grouped && t.group) && (
              <span className="tab-hint">{t.hint}</span>
            )}
          </button>
        </React.Fragment>
      ))}
      {/* The line under the strip, drawn once rather than as a border on every
          tab -- eleven borders that have to add up to one line is eleven
          chances for a gap. */}
      <span className="tabs-rule" aria-hidden="true" />
    </div>
  )
}
