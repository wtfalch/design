# design

The design system behind [tf](https://github.com/wtfalch/tf), published as
`@wtfalch/design` so more than one app can use it and none of them have to look
alike.

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
There is no Tailwind here and no utility layer; a theme is a set of values, not
a set of classes.

Read `packages/design/README.md` for the vocabulary and how to write a theme.

## Everything is linted

The components spent the migration exempt from biome, because they were copied
verbatim from tf and reformatting them would have made every React Aria diff a
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
