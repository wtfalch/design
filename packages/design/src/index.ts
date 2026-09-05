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

export { default as ArtProvider } from './components/ArtProvider'
export { default as Brand } from './components/Brand'
export { BRAND_NAMES } from './components/brandMarks'
export type { BrandName } from './components/brandMarks'
export { default as Button } from './components/Button'
export type { Props as ButtonProps } from './components/Button'
export { default as Callout } from './components/Callout'
export { default as Card } from './components/Card'
export { default as Checkbox } from './components/Checkbox'
/* `DangerAction` is a component -- a row inside the zone -- and was exported as
   a type until the first consumer wrote `<DangerAction>` and TypeScript refused
   it (TS1362). Nothing in this repo renders one, which is how it went unseen. */
export { DangerAction, default as DangerZone } from './components/DangerZone'
export { default as Dialog } from './components/Dialog'
export { default as Empty } from './components/Empty'
export { default as Field } from './components/Field'
export type { FieldWiring } from './components/Field'
export { default as Icon } from './components/Icon'
export { ICON_NAMES } from './components/iconNames'
export type { IconName } from './components/iconNames'
export { default as Illustration } from './components/Illustration'
export { default as Input } from './components/Input'
export type { Props as InputProps } from './components/Input'
export { default as Markdown } from './components/Markdown'
export { default as Modal } from './components/Modal'
export { default as Pill } from './components/Pill'
export { default as Progress } from './components/Progress'
export { Row, Rows } from './components/Rows'
export { default as Select } from './components/Select'
export { default as SizeGrid } from './components/SizeGrid'
export { default as Skeleton } from './components/Skeleton'
export { default as Slider } from './components/Slider'
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
 *  cannot drift from the object. */
export { productCss, themeCss, themeId } from './themes/css'

/** The measurement behind the contrast rule, for a theme that is yours. */
export { luminance, ratio } from './contrast'

/** A product's art as values, and the components typed to it. tf's pack is
 *  `@wtfalch/design/art/tf`, and the default when none is installed. */
export { SYSTEM_ICONS, bindArt, checkArt, defineArt } from './art'
export type { ArtPack, Glyph, Mark, SystemIconName } from './art'
