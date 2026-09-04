/**
 * Every icon name, in one place.
 *
 * **Its own module so `Icon.tsx` stays a Fast Refresh boundary.** React Fast
 * Refresh can only swap a module in place when everything it exports is a
 * component; one exported array is enough to disqualify the file, and Vite then
 * pushes the update up to whoever imports it -- which for `Icon` is very nearly
 * the whole app, so editing one glyph re-ran App. The names have no reason to
 * sit beside the component anyway.
 *
 * The gallery used to hold its own list of fourteen and quietly omitted five --
 * a catalogue page that documents less than the set it documents is how
 * somebody concludes an icon does not exist and draws it again. `IconName` is
 * derived from this, so the type, the glyph table and the gallery cannot
 * disagree.
 */
export const ICON_NAMES = [
  'chat',
  'settings',
  'refresh',
  'minimize',
  'code',
  'wifi',
  'wifi-off',
  'check',
  'close',
  'info',
  'warning',
  'error',
  'expand',
  'download',
  'image',
  'bolt',
  'speaker',
  'mic',
  'back',
  'spinner',
  // Added for the Updates tab and the file-access card: `image` was standing
  // in for npm packages and `code` for a folder of files, which are the wrong
  // words with the right shape. Measured the same way as the rest -- see the
  // `Glyph` docstring in `Icon.tsx`.
  'folder',
  'book',
  // What a model can do, for the capability tags on a model row. Each one
  // has to carry *direction*: `_tags` in `routes_models.py` records why
  // `sees` and `draws` were rejected as names -- nobody could tell which
  // way the picture went. An eye takes one in, a palette puts one out.
  'eye',
  // The same eye, struck through: the other half of a show/hide toggle.
  // Not for a capability tag -- a model that cannot see has no tag.
  'eye-off',
  'palette',
  'stars',
  'wrench',
  'cloud',
  // The chat's attach button. A folder was the nearest thing in the set and
  // is the wrong noun: you are handing over one file, not opening a place
  // that holds several.
  'file',
] as const

export type IconName = (typeof ICON_NAMES)[number]
