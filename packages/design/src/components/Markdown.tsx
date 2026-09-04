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
export default function Markdown({ text }: { text: string }) {
  const html = useMemo(() => {
    if (!text) return ''
    const raw = marked.parse(text, { async: false }) as string
    return DOMPurify.sanitize(raw, {
      // No iframes, no forms, no event handlers -- prose, code and tables only.
      FORBID_TAGS: ['style', 'iframe', 'form', 'input', 'button', 'script'],
      FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
    })
  }, [text])

  if (!text) return null
  return <div className="md" dangerouslySetInnerHTML={{ __html: html }} />
}
