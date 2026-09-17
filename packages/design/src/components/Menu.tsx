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
 * **Selecting a row is not a gap here.** React Aria's `Menu`/`MenuItem`
 * already support `selectionMode`, `selectedKeys` and the resulting
 * `isSelected` (which lands as `data-selected`, same as every other React
 * Aria state) -- ARIA menus have always had a `✓` row. This wrapper does not
 * forward those props yet, which is a small plumbing gap, not an ARIA one;
 * nothing here stops a caller who needs it from adding `selectionMode` to
 * `Props` next.
 *
 * **`info` is context, not a choice, and it is not a menu item.** A caller
 * that wants a line above the actions -- who is signed in, what plan an
 * account is on -- cannot get there through `items`: a `disabled` entry is
 * still a stop on the arrow-key path, and a screen reader still announces
 * "dimmed" or "unavailable" for something that was never a choice to begin
 * with, only ever a fact. `info` renders as a plain sibling of the menu's own
 * list instead, inside the popover but outside `role="menu"`, so it takes no
 * keyboard focus, gets no roving tabindex, and is read as ordinary text if a
 * screen reader's browse cursor passes over it. Nothing here knows what the
 * content *is* -- an email, a role, a plan -- only that it goes above the
 * verbs and is never one of them. A warning belongs here too, composed
 * rather than built in: `info={<Callout tone="warn">…</Callout>}` reads the
 * same way and gets the same guarantee, one concept (a menu is choices) doing
 * the work two used to.
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

export interface Props {
  /** What opens it. */
  trigger: React.ReactNode
  items: (Item | Section)[]
  placement?: Placement
  /** Names the menu for a screen reader. */
  label: string
  className?: string
  /** Static context above the actions -- who is signed in, what plan an
   *  account is on, anything worth reading before the verbs are offered. Not
   *  a menu item: see the docblock above for why it renders outside the
   *  list rather than as a disabled entry inside it. */
  info?: React.ReactNode
}

function isSection(entry: Item | Section): entry is Section {
  return 'title' in entry && Array.isArray((entry as Section).items)
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
      {/* The surface -- background, border, radius -- lives on `.menu-sheet`
          itself now, in `menu.css`, so it is not restated here as
          utilities: two copies of the same surface is how the top-level
          popover ended up with none at all. What stays inline is this
          popover's own sizing, which the top-level one does not share, plus
          `z-(--z-popover)` from the named layering scale, plus the two-column
          grid a row's `secondaryAction` needs -- a submenu's rows can carry
          one too, so it gets the same tracks the top-level list does. */}
      <AriaPopover className="menu-sheet min-w-[12rem] max-w-[min(20rem,calc(100vw-var(--space-6)))] max-h-[24rem] overflow-auto overscroll-contain z-(--z-popover)">
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

export default function Menu({
  trigger,
  items,
  placement = 'bottom start',
  label,
  className,
  info,
}: Props) {
  return (
    <MenuTrigger>
      {trigger}
      <AriaPopover
        className={`menu-sheet${className ? ` ${className}` : ''}`}
        placement={placement}
        offset={6}
      >
        {/* Outside `AriaMenu` on purpose -- see the docblock's `info`
            paragraph. A sibling here never enters the listbox React Aria
            builds from `AriaMenu`'s children, so it is invisible to arrow
            keys, roving tabindex and the menu's own accessible name. */}
        {info && <div className="menu-info">{info}</div>}
        <AriaMenu
          className="p-1 outline-none grid grid-cols-[1fr_auto] gap-y-[var(--border-width)] gap-x-[var(--space-1)]"
          aria-label={label}
        >
          {items.map((entry) =>
            isSection(entry) ? (
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
