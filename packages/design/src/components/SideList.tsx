'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

/**
 * The left column beside the content: a grouped list of the places an app
 * organises itself around, for the app that has more of them than `Shell`'s
 * one-row `nav` was built for -- Manage's Home, Accounts, Teams, Roles,
 * Activity, Settings, and a "Tools" and "Platform" group under those.
 *
 * `SideList.Group` names a run of `SideList.Item`s, and every group is named
 * -- the same "groups are headings, not tabs" shape `Tabs`' vertical rail
 * already has, one level up: there the group is decoration over a strip that
 * is still one control; here every item is its own link and the group is
 * nothing but the heading. `heading` stays optional in the type for a caller
 * mid-migration, but a headingless top group is what left a later "Tools"
 * heading looking orphaned -- name the first group too.
 *
 * **Every item is a real anchor, not a button that calls a router.** `asChild`
 * puts this component's styling on the caller's own element -- a Next.js
 * `<Link>`, usually -- the same seam `Button` uses for the same reason:
 * middle-click, cmd-click, "copy link address" and a screen reader's list of
 * links all come from the element, and a place you navigate to has to be one.
 * `SideList.Item` never renders its own `<button>` or `<a>` the way `Button`
 * does when `asChild` is left off, because a place with nothing to link to is
 * not a place -- there is no sensible link-less mode to fall back to.
 *
 * **`icon` is a prop, not part of the child's own content, and that is the
 * opposite of what `Button` does.** `Button` leaves an icon to the caller's
 * children because `Slot` clones one element and cannot also inject a sibling
 * into it -- so this component draws the icon itself, absolutely positioned
 * over the row, `pointer-events: none`, with the slotted link's own
 * `padding-left` reserving the same width whether or not an item passes one.
 * A rail whose items only sometimes carry icons is the case this exists for
 * -- Home/Accounts/Teams have none, Activity/Settings do -- and without a
 * reserved column every label starts at a different x, one indent for the
 * icon and none for its absence. The click target stays the whole row:
 * `pointer-events: none` on the icon lets a press on its pixels fall through
 * to the anchor underneath rather than missing it.
 *
 * **The current place is marked, not only coloured.** `current` sets
 * `aria-current="page"` on the slotted anchor, merged the way `Button` merges
 * `aria-disabled` onto a disabled link -- a colour alone tells a mouse where
 * it is and tells a screen reader nothing.
 *
 * **`SideList.Tool` is a disclosure, not a destination.** A tool with more
 * than one place under it -- Storage's Buckets and Backups, say -- opens its
 * own run of `SideList.Item`s in place, indented `--space-3` (12px) beneath
 * it: William's number, chosen so the rail still reads as one instrument from
 * a single tool to fifteen or more. Collapsed by default; open only when the
 * caller passes `defaultOpen`, the same way `SideList.Item`'s `current` is
 * the caller's own computation from its own route rather than this component
 * reading a pathname -- pass it for the one tool that contains the current
 * place. Its trigger is a real `<button>`, never an anchor: unlike
 * `SideList.Item` there is nothing here for `asChild` to put a link's own
 * styling on, since a tool has no page of its own to link to. `aria-expanded`
 * and `aria-controls` (paired by React's own `useId`, one pair per instance)
 * say what it does to a screen reader, and a `<button>` gets Enter/Space
 * activation from the browser for free where a `<div onClick>` would not --
 * the same reasoning `SideList.Item` already applies to its own anchor.
 *
 * **The phone sheet is controlled, and `SideList.Trigger` is the button that
 * opens it.** The trigger has to live in `Shell`'s header -- that is the
 * requirement -- and the header and this column are siblings under `Shell`,
 * not ancestor and descendant, so there is no DOM position inside both and
 * therefore no uncontrolled default the way `Popover` has one: the app holds
 * `open` and hands the same `onOpenChange` to both `SideList` and
 * `SideList.Trigger`. What the trigger owns on its own is the part an app
 * must not have to: it renders the button, names it, and hides itself at
 * `md` and up (`md:hidden`, compiled into this package because the trigger
 * lives here rather than in an app's own source) -- the earlier shape put a
 * plain `<Button className="md:hidden">` in the app's hands instead, which is
 * exactly the utility-class-in-app-code every consumer's own lint rule
 * exists to catch.
 *
 * **The rail and the sheet render the same children twice, not once
 * repositioned.** A `<nav>` docked beside `main` and a `<nav>` inside a
 * portalled `Modal` are different DOM positions a single React subtree cannot
 * occupy at once, so each copy is its own instance -- hidden by CSS rather
 * than unmounted, the ordinary way a responsive nav works. Closing the sheet
 * when a place is chosen only has an effect in the copy that is open; calling
 * it from the docked copy is a harmless no-op.
 *
 * **The breakpoint is Tailwind's own `md` (768px), and that is a decision
 * worth stating because nothing else in this package is responsive yet.**
 * `gallery-e2e`'s visual suite shoots every specimen at a fixed 1000px --
 * above `md` and below Tailwind's `lg` (1024px) -- so the rail is the state
 * the standard baseline photographs, and the collapsed state still needs its
 * own narrow-viewport screenshot the way any portalled surface does.
 */

import { Slot } from '@radix-ui/react-slot'
import { createContext, useContext, useId, useState } from 'react'

import Button from './Button'
import Icon from './Icon'
import Modal from './Modal'
import ScrollArea from './ScrollArea'
import type { IconName } from './iconNames'

interface Ctx {
  /** No-op in the docked rail, where nothing is open to close. Real in the
   *  sheet, where choosing a place should not leave it standing open over
   *  the page it just navigated to. */
  close: () => void
}

const SideListContext = createContext<Ctx | null>(null)

export interface SideListProps {
  /** Above the groups -- Manage's organisation switcher. Optional because a
   *  single-organisation app has nothing to switch. */
  switcher?: React.ReactNode
  /** `SideList.Group`s, or a bare `SideList.Item` for a place that belongs to
   *  none of them. */
  children: React.ReactNode
  /** Names the `<nav>` landmark, and doubles as the phone sheet's title --
   *  the sheet is a dialog and a dialog owes an accessible name, so reusing
   *  this rather than asking for a second string is the one that cannot go
   *  missing. */
  label: string
  /** Whether the phone sheet is open. See the docblock above for why this
   *  has no uncontrolled default. */
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

function SideListNav({
  switcher,
  children,
  label,
  close,
}: {
  switcher?: React.ReactNode
  children: React.ReactNode
  label: string
  close: () => void
}) {
  return (
    <SideListContext.Provider value={{ close }}>
      <nav className="side-list flex flex-col h-full min-h-0" aria-label={label}>
        {switcher && <div className="side-list-switcher flex-none">{switcher}</div>}
        {/* `ScrollArea`, not a bare overflow box: fifteen-plus places is the
            case this exists for, and a rail that runs off the bottom with no
            mark at its edge is the exact "list that ended" misreading
            `ScrollArea`'s own docblock names. */}
        <ScrollArea className="side-list-groups flex-1 min-h-0">
          <div className="side-list-groups-inner">{children}</div>
        </ScrollArea>
      </nav>
    </SideListContext.Provider>
  )
}

function SideList({ switcher, children, label, open, onOpenChange, className }: SideListProps) {
  const close = () => onOpenChange(false)
  return (
    <>
      {/* Docked, on a wide screen. Always mounted -- `hidden md:flex` takes it
          out of layout and out of the accessibility tree below `md`, which is
          what keeps a narrow viewport from exposing two landmarks with the
          same name at once. */}
      <div
        className={`side-list-rail hidden md:flex md:flex-col md:h-full md:min-h-0${
          className ? ` ${className}` : ''
        }`}
      >
        <SideListNav switcher={switcher} label={label} close={close}>
          {children}
        </SideListNav>
      </div>
      {/* The sheet. Mounted only while open, the way every other overlay in
          this package is -- `Modal` renders a live `ModalOverlay` the instant
          it exists, so "closed" has to mean "not there" rather than "there
          and hidden". */}
      {open && (
        <Modal edge="left" title={label} onClose={close} bodyClass="p-0 flex flex-col min-h-0">
          <SideListNav switcher={switcher} label={label} close={close}>
            {children}
          </SideListNav>
        </Modal>
      )}
    </>
  )
}

export interface SideListTriggerProps {
  /** Names the button for a screen reader -- there is no visible label
   *  beside the icon. Defaults to a generic name rather than requiring the
   *  same string `SideList.label` takes twice, since a caller that wants
   *  them to match can just pass `label` through both. */
  label?: string
  /** Opens the sheet. The same setter passed to `SideList`'s `onOpenChange`
   *  -- one piece of state in the app, read by both. */
  onOpenChange: (open: boolean) => void
  className?: string
}

function SideListTrigger({ label = 'Open places', onOpenChange, className }: SideListTriggerProps) {
  return (
    <Button
      iconOnly
      aria-label={label}
      /* `md:hidden`, compiled here rather than asked of the app: this module
         is inside the package, so Tailwind's own scan of *its* source finds
         the class, which is the whole difference from the shape this
         replaced -- the same utility written in an app or a gallery that
         does not run Tailwind over its own source compiles to nothing. */
      className={`side-list-trigger md:hidden${className ? ` ${className}` : ''}`}
      onPress={() => onOpenChange(true)}
    >
      <Icon name="menu" />
    </Button>
  )
}

export interface SideListGroupProps {
  /** The small heading above this group's places. Name every group,
   *  including the one at the top of the list -- Home, Accounts, Teams...
   *  gets a heading exactly like "Tools" or "Platform" after it does. Still
   *  optional in the type, not required: a headingless top group was the
   *  previous intended use, so making this required would break an existing
   *  caller who built one that way. Nothing enforces the recommendation past
   *  this comment. */
  heading?: string
  children: React.ReactNode
  className?: string
}

function SideListGroup({ heading, children, className }: SideListGroupProps) {
  return (
    <div className={`side-list-group${className ? ` ${className}` : ''}`}>
      {heading && <div className="side-list-heading">{heading}</div>}
      {children}
    </div>
  )
}

export interface SideListItemProps {
  /** The place: a single element that is or renders an anchor, usually a
   *  Next.js `<Link>`. Its label is its own content -- the same contract
   *  `Button`'s `asChild` uses, for the same reason: this component merges
   *  attributes onto whatever element it is given and cannot also inject
   *  content into it. The icon is the one exception; see `icon` below. */
  children: React.ReactElement
  /** Drawn over the row at a fixed inset, present or not -- see the
   *  docblock above for why this is a prop instead of the caller's own
   *  markup. */
  icon?: IconName
  /** This is the page the visitor is on. */
  current?: boolean
  className?: string
}

function SideListItem({ children, icon, current, className }: SideListItemProps) {
  const ctx = useContext(SideListContext)
  return (
    <div className="side-list-item">
      {icon && <Icon name={icon} size={16} className="side-list-item-icon" />}
      <Slot
        className={`side-list-link${className ? ` ${className}` : ''}`}
        aria-current={current ? 'page' : undefined}
        onClick={() => ctx?.close()}
      >
        {children}
      </Slot>
    </div>
  )
}

export interface SideListToolProps {
  /** The button's own label -- the tool's name, not a destination. A string
   *  rather than `SideList.Item`'s `children`, because there is no anchor
   *  here for `asChild` to put this row's styling on: the tool has nothing to
   *  link to, only a list to open. */
  label: string
  /** Drawn over the row at a fixed inset exactly like `SideList.Item`'s --
   *  see that prop's docblock for why this is a prop the component draws
   *  rather than markup a caller supplies. */
  icon?: IconName
  /** `SideList.Item`s, rendered beneath the button and indented one step
   *  under it while this tool is open. */
  children: React.ReactNode
  /** Open when this instance first renders. The tool has no route of its own
   *  to read a pathname from, so -- the same way `SideList.Item`'s `current`
   *  is the caller's own computation rather than this component reading one
   *  -- pass `true` for the one tool that contains the current place and
   *  leave every other tool to its default: collapsed. Uncontrolled, and
   *  deliberately so: the rail and the sheet mount this tool as two separate
   *  instances (see `SideList`'s own docblock), and nothing needs their open
   *  state to agree with each other any more than their scroll positions
   *  do. */
  defaultOpen?: boolean
  className?: string
}

function SideListTool({
  label,
  icon,
  children,
  defaultOpen = false,
  className,
}: SideListToolProps) {
  const [open, setOpen] = useState(defaultOpen)
  const sectionsId = useId()
  return (
    <div className="side-list-item">
      {icon && <Icon name={icon} size={16} className="side-list-item-icon" />}
      <button
        type="button"
        className={`side-list-link side-list-tool-trigger${className ? ` ${className}` : ''}`}
        aria-expanded={open}
        aria-controls={sectionsId}
        onClick={() => setOpen((prev) => !prev)}
      >
        {label}
        {/* Inline, not a name from `Icon`/`IconName` -- the same call
            `Select`'s own caret already made: a chevron used in exactly one
            place is not worth adding to a forty-two-glyph shared set, and
            Pepicons' `expand` glyph is a fullscreen arrow, the wrong shape
            for "opens a list beneath it." */}
        <svg
          className="side-list-tool-caret"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          aria-hidden="true"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m6 9 6 6 6-6"
          />
        </svg>
      </button>
      <div id={sectionsId} className="side-list-tool-sections" hidden={!open}>
        {children}
      </div>
    </div>
  )
}

SideList.Group = SideListGroup
SideList.Item = SideListItem
SideList.Tool = SideListTool
SideList.Trigger = SideListTrigger

export default SideList
