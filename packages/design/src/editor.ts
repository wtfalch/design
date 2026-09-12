/**
 * The editor entry: `@wtfalch/design/editor`.
 *
 * Its own entry because it is the one component in the package that loads an
 * editor — TipTap, which is ProseMirror — and a site that only *renders*
 * prose should not download one to do it. `RichText` and the value helpers
 * ship from the package's front door for exactly that reason; the schema
 * ships from `@wtfalch/design/rich-text`, because it needs zod.
 *
 * TipTap and zod are optional peer dependencies. Import this and you install
 * them; import anything else in the package and you do not.
 */
export { default as RichTextEditor } from './components/RichTextEditor'

/** Re-exported, so writing prose needs one import rather than three. */
export {
  type BlockNode,
  type RichTextMark,
  type RichTextValue,
  blockNodeSchema,
  richTextMarkSchema,
  richTextSchema,
} from './rich-text/schema'
export { emptyRichText, isEmptyRichText, richTextToPlain } from './rich-text/value'
