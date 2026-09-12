/**
 * The rich-text schema: `@wtfalch/design/rich-text`.
 *
 * What a consumer validates with on the way into its database, so that a
 * crafted request can no more store a table than the toolbar can produce
 * one. Separate from the front door because it is the only part of the
 * package that needs zod, and separate from `./editor` because validating a
 * value is a thing a server does and downloading an editor is not.
 */
export {
  type BlockNode,
  type RichTextMark,
  type RichTextValue,
  blockNodeSchema,
  richTextMarkSchema,
  richTextSchema,
} from './rich-text/schema'
export { emptyRichText, isEmptyRichText, richTextToPlain } from './rich-text/value'
