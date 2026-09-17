# design

wtfalch's design system, published as `@wtfalch/design`: it came out of
[otf](https://github.com/wtfalch/otf) and serves every product, none of which
have to look alike.

| | |
|---|---|
| `packages/design` | the package — components, tokens, themes |
| `gallery` | the catalogue, and the target the visual suite screenshots |

```bash
pnpm install
pnpm build && pnpm lint && pnpm typecheck && pnpm test
```

Behaviour — roles, keyboard, focus management, touch, dismissal — comes from
[React Aria Components](https://react-spectrum.adobe.com/react-aria/). Every
pixel is ours, styled off the token vocabulary through `data-*` attributes.
A component draws itself with Tailwind utilities, bound to that vocabulary and
compiled into the shipped stylesheet at build, so a consumer installs no
Tailwind and inherits no defaults. A theme is still a set of values, not a set
of classes, and a class in this package is private.

Read `packages/design/README.md` for the vocabulary and how to write a theme.

## Everything is linted

The components spent the migration exempt from biome, because they were copied
verbatim from otf and reformatting them would have made every React Aria diff a
mix of "this is now React Aria" and "biome moved a quote". That exemption is
gone. The seventeen findings it hid are resolved rather than waved through:
three style autofixes, two lists re-keyed by their data instead of their index,
and reasoned `biome-ignore` lines on the rest -- `div role="list"` is valid
ARIA and a `<ul>` reset is pixel churn for no gain; a `progressbar` is not
interactive; Markdown's HTML is DOMPurify output and Illustration's is read
from disk at build time; Brand's animation effect reads `t` once on purpose.

The one exception is `noArrayIndexKey` on `Skeleton.tsx`, turned off for that
file in `biome.json`: a placeholder line has no identity but its position, and
the rule reports the `.map` callback and the `key` attribute as one finding
that no single suppression comment attaches to.
