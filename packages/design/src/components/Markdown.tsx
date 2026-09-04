import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useMemo } from 'react'

marked.setOptions({ gfm: true, breaks: true })

/**
 * Render model output as markdown.
 *
 * Sanitised without exception: this is text produced by a model, which may be
 * echoing content it read from a file, so it is never trusted HTML.
 */
export default function Markdown({
  text,
  sanitize,
}: {
  text: string
  /**
   * What to allow through, on top of the defaults.
   *
   * The defaults forbid iframes, forms, controls, scripts and inline styles:
   * prose, code and tables only. An app that renders trusted embeds can widen
   * that here; one that wants less can forbid more. It is a prop rather than
   * a constant because the sanitiser ships to other people's apps now, and
   * what is "trusted" is a fact about the app, not the component.
   */
  sanitize?: Parameters<typeof DOMPurify.sanitize>[1]
}) {
  const html = useMemo(() => {
    if (!text) return ''
    const raw = marked.parse(text, { async: false }) as string
    return DOMPurify.sanitize(raw, {
      // No iframes, no forms, no event handlers -- prose, code and tables only.
      FORBID_TAGS: ['style', 'iframe', 'form', 'input', 'button', 'script'],
      FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
      ...sanitize,
    })
  }, [text, sanitize])

  if (!text) return null
  // biome-ignore lint/security/noDangerouslySetInnerHtml: the string is DOMPurify output, with the config above.
  return <div className="md" dangerouslySetInnerHTML={{ __html: html }} />
}
