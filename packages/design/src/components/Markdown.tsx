import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useEffect, useMemo, useState } from 'react'

marked.setOptions({ gfm: true, breaks: true })

/**
 * Render model output as markdown.
 *
 * Sanitised without exception: this is text produced by a model, which may be
 * echoing content it read from a file, so it is never trusted HTML.
 *
 * **On the server, the text itself.** DOMPurify sanitises through a DOM, and a
 * server rendering React has none: `sanitize` is not even a function there,
 * and the first app to server-render a comment found out. Rather than a second
 * sanitiser for the server, which would be two behaviours for one string, the
 * server (and the first client paint, so hydration agrees) renders the text
 * escaped by React, and the sanitised HTML takes its place once mounted. What
 * reaches a browser is never HTML that DOMPurify has not seen.
 */
export default function Markdown({
  text,
  sanitize,
  className,
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
  className?: string
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const html = useMemo(() => {
    if (!text || !mounted) return null
    const raw = marked.parse(text, { async: false }) as string
    return DOMPurify.sanitize(raw, {
      // No iframes, no forms, no event handlers -- prose, code and tables only.
      FORBID_TAGS: ['style', 'iframe', 'form', 'input', 'button', 'script'],
      FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
      ...sanitize,
    })
  }, [text, mounted, sanitize])

  if (!text) return null
  const classes = `md${className ? ` ${className}` : ''}`
  if (html === null) {
    // The server, and the client until its first effect: the words, escaped.
    return (
      <div className={classes} data-md="plain">
        <p>{text}</p>
      </div>
    )
  }
  return (
    <div
      className={classes}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: the string is DOMPurify output, with the config above.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
