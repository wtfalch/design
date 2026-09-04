/**
 * The gallery's entry point.
 *
 * A second Vite entry rather than a route inside the app: the gallery must
 * open when the app cannot -- no control plane, no engine, no conversation --
 * and a route would inherit App's fetching and its first-run gate. It is
 * `/design.html` in the built dashboard, served by the control plane like any
 * other file, so it works in the packaged app too.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// The real stylesheet and the real tokens, in that order, exactly as `main.tsx`
// loads them. A gallery with its own styles is a gallery that lies.
import '@wtfalch/design/tokens.css'
import '@wtfalch/design/styles.css'
import './gallery.css'

import Gallery from './Gallery'
import Specimen from './Specimen'
import { manifest, readTarget } from './specimenTarget'

/* `?c=&v=` renders one variant alone; anything else is the gallery. The check
   is here rather than inside `Gallery` so the bare page does not mount the rail
   and then hide it -- a hidden control is still a control that ran, and the
   theme picker mounting would apply a theme over the one the URL asked for. */
const target = readTarget()

/* Every (component, variant) pair, on the window.
   The screenshot suite reads this from a real render rather than keeping its
   own list, so adding a variant adds a baseline and nobody has to remember. A
   list maintained beside the specimens is a list that goes stale in the
   direction that hides work: the missing entry is the one nobody screenshots. */
;(window as unknown as { __SPECIMENS__: unknown }).__SPECIMENS__ = manifest()

createRoot(document.getElementById('root')!).render(
  <StrictMode>{target ? <Specimen target={target} /> : <Gallery />}</StrictMode>,
)
