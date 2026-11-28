# TensorDiagram showcase

A Vite application, written in TypeScript without a UI framework, that demonstrates the features of
`@tensormorph/tensordiagramcore`, one demo per feature area. It is also the end-to-end test bed of the library: every
demo is loaded in a headless Chrome against the production build, and behaviour scenarios drive the real UI.

It imports the package exactly like an application would, through its `exports`, as a workspace dependency
(`"@tensormorph/tensordiagramcore": "workspace:*"`).

## Run it

From the repository root, once `bun install` has been run:

```bash
bun run --cwd packages/core build   # the app uses the built library, lib/
bun run --cwd apps/web dev          # http://localhost:5173
```

Run `bun run --cwd packages/core dev` alongside to rebuild the library on change.

## Build and test

```bash
bun run --cwd apps/web build        # type check, then production build in dist/
bun run --cwd apps/web preview      # serve dist/ on http://localhost:4173
bun run --cwd apps/web test:e2e     # serve dist/ and run the end-to-end tests
```

`test:e2e` needs Google Chrome installed. Set `E2E_BROWSER_PATH` to use another Chromium based browser, `E2E_PORT`
(default `4173`) and `E2E_OUT_DIR` (default `dist`) to serve another build. It fails on a demo rendering no SVG, an
uncaught error, a console error, an HTTP error or a failed request, and runs the scenarios of `e2e/scenarios*.mjs`.
One of them cycles through all the demos and checks that no listener is left on `window` or `document`.

## Structure

- `src/main.ts`: the shell, navigation by URL hash (`#/<demo id>`), the demo lifecycle and the event log.
- `src/reset.ts`: resets the global configuration and registries of the library between demos.
- `src/demos/`: one file per demo, registered in `src/demos/index.ts`.
- `src/modelviz/`: the model architecture editor (`model-viz` demo), see [`MASTER_ARCHITECTURE.md`](./MASTER_ARCHITECTURE.md).
- `src/svg-export.ts`: the SVG export shared by the demos.
- `scripts/copy-core-assets.mjs`: copies the `images` and `i18n` folders of the library to `public/`, the library loads
  them by URL at runtime.
- `e2e/`: the end-to-end tests.

## Add a demo

Write `src/demos/<id>.ts` exporting a `Demo` (see `src/types.ts`) and add it to `src/demos/index.ts`. In `mount`:

- create the graph with `ctx.useGraph(new Graph(ctx.container, ...))`, the shell destroys it when leaving the demo and
  exposes it to the tests as `window.__showcase.graph`;
- pass anything listening outside the container, such as a `KeyHandler`, an `Outline` or a timer, to `ctx.dispose`;
- add toolbar buttons with `ctx.button(label, onClick, action)`, `action` being the `data-action` the tests click;
- do not patch a prototype of the library, it would leak into the other demos.

Then add a scenario to the matching `e2e/scenarios*.mjs` file.
