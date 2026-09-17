'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

import {
  Menu as AriaMenu,
  Popover as AriaPopover,
  Header,
  MenuItem,
  MenuSection,
  MenuTrigger,
  type Placement,
  Separator,
  SubmenuTrigger,
  Text,
} from 'react-aria-components'

import Kbd from './Kbd'

import Icon from './Icon'
import type { IconName } from './iconNames'

/**
 * A list of things you can do to something.
 *
 * Not `Select`. That is a *value* -- one of a set, one of them currently true,
 * and the control shows which. A menu is a set of *verbs*, none of them a
 * state, and nothing is selected when it closes. Building one out of the other
 * gets you a listbox that announces "selected" after somebody archives a
 * message, which is a small lie told by a screen reader at the exact moment
 * accuracy matters.
 *
 * **Destructive items are marked and last.** `danger` tints the row, and the
 * caller puts it below a separator. Delete beside Reply, in the same weight,
 * one row apart, is a design that is going to lose somebody's mail. Same
 * vocabulary as `DangerZone`, one surface smaller.
 *
 * **Shortcuts are shown, not hidden.** An item that also has a key binding
 * says so on its right; that is the only place most people will ever learn the
 * binding exists, and a menu is where they are already looking.
 *
 * The keyboard, typeahead, submenu timing, outside press and focus restore are
 * React Aria's. The submenu delay in particular is worth not rewriting: a
 * submenu that closes the instant the pointer leaves its parent row is
 * unusable with a mouse, because the diagonal path to it passes over the row
 * below.
 *
 * **A row's own settings gear is a second `menuitem`, never a nested
 * `<button>`.** `menuitem` children are presentational -- a focusable element
 * inside one is either unreachable by Tab (roving tabindex only ever visits
 * `menuitem`s) or, if it somehow gets focus, breaks the arrow-key contract
 * every other row relies on. otf's model picker hand-rolled exactly this row
 * (a name, a `✓`, a gear) with a real `<button>` nested in another; it worked
 * because the outer element was a plain `<div>`, not an ARIA menu. `Item.
 * secondaryAction` renders as a second, independent `MenuItem` placed beside
 * the first with CSS Grid rather than inside it -- one more press of the down
 * arrow reaches it, Enter or Space activates it, and it never sees the row's
 * own `onAction`. `<AriaMenu>` and `<MenuSection>` grid two columns
 * (`1fr auto`) for exactly this; every other row, section and rule spans
 * both (`grid-column: 1 / -1`), which is a no-op unless a menu actually pairs
 * a row, so no baseline taken before this line existed can move. The action
 * is always visible rather than hover-revealed -- a touch screen has no
 * hover, and a control only a mouse can find is a control half the audience
 * cannot use. A row cannot have both `items` (a submenu) and a
 * `secondaryAction`; `items` wins if both are given, since a submenu already
 * owns the row's expand affordance.
 *
 * **A `Notice` is a `Section` with no items.** WAI-ARIA's `menu` role allows
 * `group` among its owned elements, and React Aria already renders
 * `MenuSection` as `role="group"`, labelled by its `Header` -- so a `Notice`
 * reuses that machinery instead of a hand-rolled `<div>`. It has to: a plain
 * element mixed into `<AriaMenu>`'s children is not a recognised collection
 * node, and React Aria's collection walker drops it (and, in testing, every
 * item after it) rather than rendering it inert. `group` carries no
 * `menuitem` descendants, so arrow-key roving tabindex skips it exactly the
 * way it skips a section with nothing in it -- the constraint the task asked
 * for, met by the same primitive a real section already uses. "Local models
 * unavailable" plus a command to fix it is content a menu could not carry
 * before this; it still cannot carry a *button* in one, for the same nested-
 * focusable reason as the gear above.
 *
 * **Selecting a row is not a gap here.** React Aria's `Menu`/`MenuItem`
 * already support `selectionMode`, `selectedKeys` and the resulting
 * `isSelected` (which lands as `data-selected`, same as every other React
 * Aria state) -- ARIA menus have always had a `✓` row. This wrapper does not
 * forward those props yet, which is a small plumbing gap, not an ARIA one;
 * nothing here stops a caller who needs it from adding `selectionMode` to
 * `Props` next.
 */

export interface Item {
  id: string
  label: React.ReactNode
  /** A second line, for an action whose consequence is not obvious from its
   *  name. Most items should not have one. */
  description?: string
  icon?: IconName
  /** The key binding, written the way the platform writes it. Shown, never
   *  bound -- this draws the reminder, the app owns the shortcut. */
  shortcut?: string
  disabled?: boolean
  /** Tints the row and gives it the destructive colour. For the one item that
   *  cannot be undone. */
  danger?: boolean
  /** A rule above this item. Groups a menu without giving each group a name. */
  separated?: boolean
  onAction?: () => void
  /** Items under this one, opened by hovering or by the right arrow. Wins
   *  over `secondaryAction` if a row somehow has both. */
  items?: Item[]
  /** A second action on this row -- a gear that opens the thing's settings,
   *  separate from choosing the row itself. Renders as its own `MenuItem`,
   *  reachable by one more press of the down arrow, never as a `<button>`
   *  nested in this row's: see the docblock above for why that is invalid. */
  secondaryAction?: {
    icon: IconName
    /** Read by a screen reader in place of the icon; shown nowhere. */
    label: string
    onAction: () => void
    /** Defaults to this row's own `disabled` -- a row that cannot be chosen
     *  usually cannot be configured either, but the two are independent when
     *  that is not true. */
    disabled?: boolean
  }
}

export interface Section {
  /** The group's name. A section with no title is a `separated` item's job. */
  title: string
  /** No `secondaryAction` here: a `Section` renders its items in the plain
   *  block flow `MenuSection` always has, not the two-column grid a paired
   *  row needs, so the gear would silently drop to its own line instead of
   *  sitting beside the row. Excluded at the type rather than left to draw
   *  wrong -- the same choice this package makes everywhere a mistake is
   *  cheap to prevent and expensive to notice in a screenshot. */
  items: Omit<Item, 'secondaryAction'>[]
}

/**
 * A block of words inside an open menu that is not a choice -- a warning, a
 * status, an explanation for why the list above it is short. Renders as a
 * `Section` with no items, so it inherits `group`'s place in the ARIA menu
 * role and is skipped by arrow-key navigation the same way an empty group
 * would be.
 */
export interface Notice {
  tone: 'info' | 'good' | 'warn' | 'bad'
  title: string
  /** The line under the title. Can hold a `<code>` for a command to run. */
  description?: React.ReactNode
}

export interface Props {
  /** What opens it. */
  trigger: React.ReactNode
  items: (Item | Section | Notice)[]
  placement?: Placement
  /** Names the menu for a screen reader. */
  label: string
  className?: string
}

function isSection(entry: Item | Section | Notice): entry is Section {
  return 'title' in entry && Array.isArray((entry as Section).items)
}

function isNotice(entry: Item | Section | Notice): entry is Notice {
  return 'tone' in entry
}

function renderItem(item: Item): React.ReactNode {
  const row = (
    <MenuItem
      key={item.id}
      id={item.id}
      className={`menu-item${item.danger ? ' danger' : ''}${item.secondaryAction ? ' menu-item--with-action' : ''}`}
      isDisabled={item.disabled}
      onAction={item.onAction}
      /* Typeahead needs a string, and `label` may be a node. Without this,
         typing the first letter of an item whose label is markup matches
         nothing and the menu looks broken. */
      textValue={typeof item.label === 'string' ? item.label : item.id}
    >
      {item.icon && <Icon name={item.icon} className="menu-icon" />}
      <span className="flex-[1_1_auto] min-w-0 grid">
        {/* `slot="label"` and `slot="description"` are React Aria's: they wire
            the description to the row with `aria-describedby`, so it is read
            after the name rather than as a second unrelated item. */}
        <Text slot="label" className="overflow-hidden text-ellipsis whitespace-nowrap">
          {item.label}
        </Text>
        {item.description && (
          <Text slot="description" className="menu-desc">
            {item.description}
          </Text>
        )}
      </span>
      {item.shortcut && <Kbd>{item.shortcut}</Kbd>}
      {/* Inline rather than an `Icon`, following `Select`'s caret: one path,
          used here and nowhere else, and the icon set has no chevron. */}
      {item.items && (
        <svg className="menu-more" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m9 6 6 6-6 6"
          />
        </svg>
      )}
    </MenuItem>
  )

  const body = item.items ? (
    <SubmenuTrigger key={item.id}>
      {row}
      <AriaPopover className="menu-sheet surface-panel border border-border rounded-md min-w-[12rem] max-w-[min(20rem,calc(100vw-var(--space-6)))] max-h-[24rem] overflow-auto overscroll-contain z-(--z-popover)">
        <AriaMenu className="p-1 outline-none grid grid-cols-[1fr_auto] gap-y-[var(--border-width)] gap-x-[var(--space-1)]">
          {item.items.map(renderItem)}
        </AriaMenu>
      </AriaPopover>
    </SubmenuTrigger>
  ) : item.secondaryAction ? (
    [
      row,
      <MenuItem
        key={`${item.id}::secondary`}
        id={`${item.id}::secondary`}
        className="menu-action"
        isDisabled={item.secondaryAction.disabled ?? item.disabled}
        onAction={item.secondaryAction.onAction}
        aria-label={item.secondaryAction.label}
        textValue={item.secondaryAction.label}
      >
        <Icon name={item.secondaryAction.icon} size={16} />
      </MenuItem>,
    ]
  ) : (
    row
  )

  if (!item.separated) return body
  const rule = <Separator key={`${item.id}-rule`} className="menu-rule" />
  return Array.isArray(body) ? [rule, ...body] : [rule, body]
}

function renderNotice(entry: Notice): React.ReactNode {
  return (
    <MenuSection key={entry.title} className="menu-section">
      <Header className={`menu-notice menu-notice-${entry.tone}`}>
        <div className="menu-notice-title">{entry.title}</div>
        {entry.description && <div className="menu-notice-desc">{entry.description}</div>}
      </Header>
    </MenuSection>
  )
}

export default function Menu({
  trigger,
  items,
  placement = 'bottom start',
  label,
  className,
}: Props) {
  return (
    <MenuTrigger>
      {trigger}
      <AriaPopover
        className={`menu-sheet${className ? ` ${className}` : ''}`}
        placement={placement}
        offset={6}
      >
        <AriaMenu
          className="p-1 outline-none grid grid-cols-[1fr_auto] gap-y-[var(--border-width)] gap-x-[var(--space-1)]"
          aria-label={label}
        >
          {items.map((entry) =>
            isNotice(entry) ? (
              renderNotice(entry)
            ) : isSection(entry) ? (
              <MenuSection key={entry.title} className="menu-section">
                <Header className="menu-section-title">{entry.title}</Header>
                {entry.items.map(renderItem)}
              </MenuSection>
            ) : (
              renderItem(entry)
            ),
          )}
        </AriaMenu>
      </AriaPopover>
    </MenuTrigger>
  )
}
