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

## Why the components are not linted yet

`biome.json` exempts `packages/design/src/components/**` and `gallery/src/**`.
That is deliberate and temporary, and it is not "these files are fine".

They are copied verbatim from tf, which does not use biome, so they carry
eighteen findings: style preferences (`useTemplate`, `noNonNullAssertion`),
two deliberate uses of `dangerouslySetInnerHTML` (DOMPurify-sanitised markdown,
and SVG inlined at build time), and three structural ones that the React Aria
migration resolves by construction — `useSemanticElements` on `Modal` and
`Rows`, `useFocusableInteractive` on `Progress`.

Fixing them now means a large diff for no behaviour change, in exactly the files
about to be rewritten — and then every migration diff is a mix of "this is now
React Aria" and "biome moved a quote". **The exemption comes off one component
at a time, as each is migrated**, which is also when the structural findings
stop existing.

`illustrations.ts` is generated and stays exempt.

Everything else — the token contract, the tools, the tests, the scripts — is
fully linted.
