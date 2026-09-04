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
