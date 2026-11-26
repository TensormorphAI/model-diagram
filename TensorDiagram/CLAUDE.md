# CLAUDE.md

TensorDiagram is a TypeScript library for displaying and interacting with vector diagrams. Successor to mxGraph, with TypeScript support, modern modular architecture, and tree-shaking.

## Build & Development

**Node.js:** ALWAYS use the version in `.nvmrc`. Run `nvm use` if using nvm. **Package manager:** bun (version in `packageManager` of `package.json`); node still runs the tools.

```bash
bun install                              # Install (bun workspaces, hoisted linker)
bun run --cwd packages/core dev             # Watch core
bun run --cwd packages/html dev             # Watch Storybook (run in parallel with core)
bun run --cwd packages/core build           # Build core (ESM + CJS)
bun run --cwd packages/core test                # Run tests
bun run --cwd packages/core test --coverage  # Tests with coverage
bun run lint                             # Lint all
bun run lint:fix                         # Lint with auto-fix
```

## CI Validation

Run before submitting PRs (mirrors `.github/workflows/build.yml`):

```bash
bun run --cwd packages/core build
bun run --cwd packages/core test-check
bun run --cwd packages/core test --coverage
bun run --cwd packages/ts-support test
./scripts/build-all-examples.bash
bun run --cwd packages/html build
bun run --cwd packages/core check:circular-dependencies
bun run lint
bun run --cwd packages/core check:npm-package
```

CI runs on ubuntu-24.04, macos-15, windows-2022.

## Architecture

Three-tier Graph class hierarchy:
- **AbstractGraph**: base abstract class with mixins, no default built-ins
- **BaseGraph**: minimal, production-optimized, requires explicit config (recommended for production)
- **Graph**: full-featured with all defaults registered (good for prototyping, not production)

Key patterns:
- **Mixins** in `packages/core/src/view/mixin/`, each has `.ts` + `.type.ts` files
- **Plugins** in `packages/core/src/view/plugin/`, loaded by `Graph` via `getDefaultPlugins()`. New plugins follow the `*Plugin.ts` naming; some legacy files still use `*Handler.ts` and will be renamed later
- **Registries** for edge styles, markers, perimeters in `packages/core/src/view/style/`; shape registry in `packages/core/src/view/shape/`
- **XML serialization** in `packages/core/src/serialization/` (mxGraph-compatible)
- Always wrap multiple model changes in `batchUpdate()`

## Key Conventions

- See `.claude/rules/architecture/coding-practices.md` for core package rules (imports, nullish checks, logging, i18n)
- See `.claude/rules/architecture/graph-api-usage.md` for calling the TensorDiagram API (applies to sources, tests, stories and examples)
- See `.claude/rules/testing/conventions.md` for test patterns
- See `.claude/rules/tooling/bundle-size-budgets.md` for the size budgets of the example packages (webpack and Vite)
- See `.claude/rules/tooling/upstream-clones.md` before reading a local draw.io or mxGraph clone (fetch, read at `origin/HEAD`, refresh an old analysis)
- See `.claude/rules/documentation/website.md` for any change under packages/website/docs (build check, redirects, page naming, Storybook links)
- See `.claude/rules/documentation/guides-structure.md` for the structure of the website guides (prerequisites, titles)
- See `.claude/rules/git/commit-conventions.md` for commit message style
- See `.claude/rules/git/pull-requests.md` for updating a pull request description (keep the blocks added by bots, comment instead on a PR opened by a bot)
- See `.claude/rules/git/milestones.md` before setting a milestone (issues only, never pull requests)
- See `.claude/rules/git/issue-labels.md` before creating an issue (body always from the matching template; write access: Issue Type only, no label; otherwise the template labels)

## References

- CellStyle interface: `packages/core/src/types.ts`
- Graph vs BaseGraph examples: `packages/ts-example-selected-features/`
- Build output: `packages/core/lib/esm/` (ESM) and `packages/core/lib/cjs/` (CJS)
- Browser support: modern browsers (Chrome, Edge, Firefox, Safari), ES2020, no IE
