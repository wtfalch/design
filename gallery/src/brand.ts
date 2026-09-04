/**
 * A theme that is not tf's.
 *
 * The built-ins are examples, and an example proves nothing about whether
 * the vocabulary is wide enough for an app that looks nothing like the one
 * it came from. This is that app: a warm page, a violet accent, its own four
 * status colours, and not one value in common with `tokens.css`. It is
 * applied as an object through `applyTheme`, the way a consumer's theme is,
 * without touching the registry -- and the visual suite photographs every
 * specimen in it, which is the claim "any app can look like itself" made
 * checkable.
 *
 * Every pair the package's contrast test measures was measured for this
 * palette before it was written down. It lives in the gallery, not the
 * package: it is a fixture, not an offer.
 */
import { defineTheme } from '@wtfalch/design'

export const brand = defineTheme({
  name: 'Brand',
  note: "Someone else's app -- nothing in common with the base",
  scheme: 'light',
  tokens: {
    '--bg': '#fbf7f0',
    '--panel': '#ffffff',
    '--panel-2': '#f3ede2',
    '--border': '#e6ddcf',
    '--border-strong': '#8a7f6f',
    '--text': '#2a2118',
    '--muted': '#6b5f52',
    '--accent': '#6d28d9',
    '--accent-dim': '#c4b5fd',
    '--on-accent': '#ffffff',
    '--good': '#2f6f2a',
    '--warn': '#8a5a10',
    '--bad': '#b3261e',
    '--info': '#1f5fb8',
    '--shadow-1': '0 4px 14px rgba(42, 33, 24, 0.10)',
    '--shadow-2': '0 8px 24px rgba(42, 33, 24, 0.12)',
    '--shadow-3': '0 12px 32px rgba(42, 33, 24, 0.14)',
    '--scrim': 'rgba(42, 33, 24, 0.36)',
    '--radius': '10px',
    '--radius-md': '14px',
    '--radius-lg': '18px',
    '--font': 'Georgia, "Times New Roman", serif',
    '--dur-md': '260ms',
  },
})
