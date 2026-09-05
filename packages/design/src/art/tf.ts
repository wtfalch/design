import { defineArt } from '../art'
import { TF_ICONS } from './tf-icons'
import { TF_ILLUSTRATIONS } from './tf-illustrations'
import { TF_MARKS } from './tf-marks'

/**
 * tf's art, whole: the pack every product starts from.
 *
 * A product with its own icons and tf's figures spreads it:
 *
 *   defineArt({ ...tfArt, icons: { ...tfArt.icons, ...mine } })
 */
export const tfArt = defineArt({
  icons: TF_ICONS,
  illustrations: TF_ILLUSTRATIONS,
  marks: TF_MARKS,
})
