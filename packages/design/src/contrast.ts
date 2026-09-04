/**
 * The contrast measurement, as a function rather than a rule.
 *
 * "4.5:1 for text, 3:1 for a boundary" has been the house rule for as long as
 * there have been themes, and it was held by nobody: the Night theme shipped
 * its primary button at 2.72:1 because the rule was written down and the
 * measurement was not. `test/contrast.test.ts` measures every built-in theme
 * with these two functions. They are exported so an app can measure its own --
 * the package ships themes as examples, and a theme somebody writes for their
 * app is the one nobody here will ever look at.
 *
 * WCAG 2 relative luminance and contrast ratio, on six-digit hex. Nothing
 * here parses `color-mix()` or `var()`: the derived tokens are computed from
 * these, so measuring the inputs is measuring them.
 */

export function luminance(hex: string): number {
  const channel = (i: number) => {
    const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

/** The ratio between two colours, 1:1 up to 21:1, whichever is on top. */
export function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
