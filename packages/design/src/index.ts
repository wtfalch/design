/**
 * The package's front door.
 *
 * Alphabetical, because the order is not a hierarchy and pretending otherwise
 * invites an argument about where a new one goes.
 *
 * The theme API is re-exported here rather than kept behind
 * `@wtfalch/design/themes` alone, because the first thing a consumer does is
 * apply a theme and making that a second import path is a papercut on the one
 * call everybody makes. The subpath stays for the case that wants the
 * vocabulary and none of the components — theming an iframe, or a canvas that
 * cannot read a CSS variable.
 *
 * Every component keeps the docblock it was written with. Those docblocks are
 * the documentation: they say what a control is *for* and which mistake it
 * exists to prevent, and several of them are the only written record of a bug
 * that shipped. They are worth more than the code around them.
 */

export { default as Brand } from './components/Brand'
/** Every product's mark by name, and the path itself for an icon cut from
 *  the same drawing. */
export { BRAND_MARKS, BRAND_NAMES } from './components/brandMarks'
export type { BrandName, FillMark, Mark, StrokeMark } from './components/brandMarks'
export { default as Button } from './components/Button'
/** The union: the button's props, or the DOM's when `asChild` hands the
 *  element to the caller. `ButtonOwnProps` is the button-only half, for a
 *  wrapper that never slots. */
export type { ButtonProps, Props as ButtonOwnProps } from './components/Button'
export { default as Callout } from './components/Callout'
export { default as Card } from './components/Card'
export { default as Checkbox } from './components/Checkbox'
/** Type what you want to do: the keyboard's front door over the application. */
export { default as Command } from './components/Command'
export type { Command as CommandItem, Group as CommandGroup } from './components/Command'
/* `DangerAction` is a component -- a row inside the zone -- and was exported as
   a type until the first consumer wrote `<DangerAction>` and TypeScript refused
   it (TS1362). Nothing in this repo renders one, which is how it went unseen. */
export { DangerAction, default as DangerZone } from './components/DangerZone'
export { default as Dialog } from './components/Dialog'
export { default as Empty } from './components/Empty'
export { default as Field } from './components/Field'
export type { FieldWiring } from './components/Field'
export { default as Icon } from './components/Icon'
/** A person in one line -- initials, name, address -- and the two pure
 *  functions behind the disc, exported so a caller colouring something else
 *  by sender agrees with it. */
export { default as Identity } from './components/Identity'
export { hueOf, initialsOf } from './components/initials'
export { ICON_NAMES } from './components/iconNames'
export type { IconName } from './components/iconNames'
export { default as Illustration } from './components/Illustration'
export { default as Input } from './components/Input'
export type { Props as InputProps } from './components/Input'
export { default as Markdown } from './components/Markdown'
export { default as Menu } from './components/Menu'
export type { Item as MenuItem, Section as MenuSection } from './components/Menu'
export { default as Modal } from './components/Modal'
/** Moving through a list that does not fit, counted in items rather than
 *  pages. `pageWindow` is the elision, exported because it is the arithmetic
 *  worth testing on its own. */
export { default as Pagination } from './components/Pagination'
export { pageWindow } from './components/pageWindow'
export { default as Pill } from './components/Pill'
/** A small surface anchored to what opened it: the middle term between
 *  `Tooltip`, which only says something, and `Modal`, which takes the
 *  application away. */
export { default as Popover } from './components/Popover'
export { default as Progress } from './components/Progress'
export { Row, Rows } from './components/Rows'
/** A box that scrolls and says so. */
export { default as ScrollArea } from './components/ScrollArea'
export type { Props as ScrollAreaProps } from './components/ScrollArea'
export { default as Select } from './components/Select'
export { default as SizeGrid } from './components/SizeGrid'
export { default as Skeleton } from './components/Skeleton'
export { default as Slider } from './components/Slider'
/** Two panes and a handle between them, the handle being a real `separator`
 *  widget rather than a div with a mousedown listener. */
export { default as SplitPane } from './components/SplitPane'
export type { Props as SplitPaneProps } from './components/SplitPane'
export { default as Table } from './components/Table'
export type { Column } from './components/Table'
export { default as Tabs } from './components/Tabs'
export type { Tab, TabGroup } from './components/Tabs'
export { default as Textarea } from './components/Textarea'
export type { Props as TextareaProps } from './components/Textarea'
export { Toast, ToastHost, useToast } from './components/Toast'
export { default as Toggle } from './components/Toggle'
export { default as Tooltip } from './components/Tooltip'
export { default as Tour } from './components/Tour'
export type { TourStop } from './components/Tour'
/** The tour's memory. `forgetTour` is what onboarding calls so a config reset
 *  replays the tour rather than leaving it suppressed by a browser that has
 *  seen it. */
export { DEFAULT_TOUR_KEY, forgetTour, markTourSeen, tourSeen } from './components/tourMarker'

/** The art. Its own module because it is ~200 KB of inlined SVG — referenced
 *  only by `Illustration`, so a bundler that drops the component drops the art
 *  with it. */
export { ILLUSTRATIONS } from './illustrations'
export type { IllustrationName } from './illustrations'

/** The focus trap, for a window that genuinely is not `Modal`'s shape. Use
 *  `Modal` first: every one of the app's eight hand-built modals shipped
 *  without a trap, which is what this exists to stop happening again. */
export { useTrapFocus } from './hooks/useTrapFocus'

export {
  DEFAULT_THEME,
  DERIVED_TOKENS,
  FIXED_TOKENS,
  THEMES,
  TOKEN_KEYS,
  applyTheme,
  defineTheme,
  isTheme,
  resolvedTokens,
} from './themes'
export type { Theme, ThemeTokens } from './themes'
/** A theme as the rule a consumer ships for first paint, generated so it
 *  cannot drift from the object; and a product's whole stylesheet the same way. */
export { productCss, productStylesheet, themeCss, themeId } from './themes/css'

/** The measurement behind the contrast rule, for a theme that is yours. */
export { luminance, ratio } from './contrast'

/** The products: the layer between the system and a theme. Each also ships
 *  as its own entry, `@wtfalch/design/<name>` and `<name>.css`, where `Brand`,
 *  `THEMES` and `applyTheme` are that product's. */
export { PRODUCTS, bindProduct, defineProduct, productTheme } from './products'
export type { Product } from './products'
