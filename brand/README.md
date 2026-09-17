# The mark

`mark.svg` is the library's own mark: the sheet, its datum, and one module
snapped into the cell the datum makes. The rules are the system; the one filled
square is what a product draws on it.

It is drawn in the world the library ships — a 64-unit square, every rule four
units wide, which is one device pixel at 16px. No radius, no shadow, no curve.
It reads down to 16px, which is the size a repository avatar and a favicon
actually get seen at.

## Colour

The mark takes two colours and names neither. Its rules are `currentColor`, so
it inherits the ink of whatever it sits in, and the module is `var(--accent)`
with the light palette's green as the fallback for a context that sets no
tokens at all. Drop it into a themed page and it wears that theme.

The exported tiles are the two palettes Manage ships, and they are what a
context outside the library should use:

| File | Page | Ink | Module |
| --- | --- | --- | --- |
| `mark-vellum-512.png`, `mark-vellum-1024.png` | `#eef1ec` | `#14181c` | `#006e4f` |
| `mark-signal-512.png`, `mark-signal-1024.png` | `#181614` | `#f2ece2` | `#00b57c` |

Each tile keeps a sixth of its width clear on every side, the margin a sheet
holds outside its own frame. Re-export rather than rescale a PNG: the rules are
one pixel by construction and resampling is what turns them into two grey ones.

## Two drawings that were wrong first

Worth recording, because both failures are easy to repeat.

The first drew the datum as an origin corner with graduations climbing away
from it. Rendered, it read as a bar chart — ticks rising off a baseline is that
picture, whatever it was drawn to mean.

The second put the rules through the sheet, which is what a datum actually is,
but hung the module four units clear of the frame and grew four tabs where the
registration marks met it. A gap that size reads as a mistake rather than a
decision, and the tabs made the silhouette lumpy at 16px.

The third is this one: the datum rules run the full height and width and
overshoot the frame, the way a datum is drawn, and the module sits flush to the
frame on two sides and to the rules on the other two. Nothing floats.
