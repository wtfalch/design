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
  /** Items under this one, opened by hovering or by the right arrow. */
  items?: Item[]
}

export interface Section {
  /** The group's name. A section with no title is a `separated` item's job. */
  title: string
  items: Item[]
}

export interface Props {
  /** What opens it. */
  trigger: React.ReactNode
  items: (Item | Section)[]
  placement?: Placement
  /** Names the menu for a screen reader. */
  label: string
  className?: string
}

function isSection(entry: Item | Section): entry is Section {
  return 'title' in entry && Array.isArray((entry as Section).items)
}

function renderItem(item: Item): React.ReactNode {
  const row = (
    <MenuItem
      key={item.id}
      id={item.id}
      className={`menu-item${item.danger ? ' danger' : ''}`}
      isDisabled={item.disabled}
      onAction={item.onAction}
      /* Typeahead needs a string, and `label` may be a node. Without this,
         typing the first letter of an item whose label is markup matches
         nothing and the menu looks broken. */
      textValue={typeof item.label === 'string' ? item.label : item.id}
    >
      {item.icon && <Icon name={item.icon} className="menu-icon" />}
      <span className="menu-text">
        {/* `slot="label"` and `slot="description"` are React Aria's: they wire
            the description to the row with `aria-describedby`, so it is read
            after the name rather than as a second unrelated item. */}
        <Text slot="label" className="menu-label">
          {item.label}
        </Text>
        {item.description && (
          <Text slot="description" className="menu-desc">
            {item.description}
          </Text>
        )}
      </span>
      {item.shortcut && <Kbd className="menu-key">{item.shortcut}</Kbd>}
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
      <AriaPopover className="menu-sheet">
        <AriaMenu className="menu-list">{item.items.map(renderItem)}</AriaMenu>
      </AriaPopover>
    </SubmenuTrigger>
  ) : (
    row
  )

  if (!item.separated) return body
  return [<Separator key={`${item.id}-rule`} className="menu-rule" />, body]
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
        <AriaMenu className="menu-list" aria-label={label}>
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
