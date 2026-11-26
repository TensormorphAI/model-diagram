# AGENTS.md

## TensorDiagram AI Agent Guide

This document provides essential knowledge for AI coding agents to be productive in the TensorDiagram codebase. It summarizes architecture, workflows, and project-specific conventions. For deeper details, see `CLAUDE.md`, `README.md`, and referenced files.

---

### 1. Architecture Overview
- **Core Library**: TypeScript, modular, tree-shakable. Main logic in `packages/core/src/`.
- **Graph Hierarchy**: Three main classes:
  - `AbstractGraph`: Abstract base, mixin-based, no built-ins.
  - `BaseGraph`: Minimal, production-optimized, explicit config (recommended for production).
  - `Graph`: Full-featured, all defaults/plugins registered (for prototyping).
- **Key Patterns**:
  - **Mixins**: `packages/core/src/view/mixin/` (`.ts` + `.type.ts` per mixin)
  - **Plugins**: `packages/core/src/view/plugin/`, loaded by `Graph` via `getDefaultPlugins()`. New plugins follow the `*Plugin.ts` naming; some legacy files still use `*Handler.ts` and will be renamed later.
  - **Registries**: Edge styles, markers, perimeters in `packages/core/src/view/style/`; shape registry in `packages/core/src/view/shape/`
  - **Serialization**: XML (mxGraph-compatible) in `packages/core/src/serialization/`
  - **Batch Updates**: Always wrap multiple model changes in `batchUpdate()`

### 2. Developer Workflows
- **Node.js**: Always use version in `.nvmrc` (`nvm use`)
- **Install**: `bun install` (bun workspaces, hoisted linker)
- **Build Core**: `bun run --cwd packages/core build` (ESM + CJS)
- **Watch Core**: `bun run --cwd packages/core dev`
- **Run Storybook**: `bun run --cwd packages/html dev`
- **Test**: `bun run --cwd packages/core test` (coverage: add `--coverage`)
- **Lint**: `bun run lint` (auto-fix: `bun run lint:fix`)
- **CI Validation**: Run all before PR:
  - `bun run --cwd packages/core build`
  - `bun run --cwd packages/core test-check`
  - `bun run --cwd packages/core test --coverage`
  - `bun run --cwd packages/ts-support test`
  - `./scripts/build-all-examples.bash`
  - `bun run --cwd packages/html build`
  - `bun run --cwd apps/web build`
  - `bun run --cwd apps/web test:e2e` (needs Google Chrome)
  - `bun run --cwd packages/core check:circular-dependencies`
  - `bun run lint`
  - `bun run --cwd packages/core check:npm-package`

### 3. Project-Specific Conventions
- **TypeScript**: Strict types, no implicit any. Use object references, not strings, for API calls.
- **Mixins/Plugins**: Add new features via mixins or plugins, not by modifying core classes directly.
- **Registries**: Register only required shapes/styles for tree-shaking (see `ts-example-selected-features`).
- **Testing**: Use Jest. Test patterns in `.claude/rules/testing/conventions.md`.
- **Commits/PRs**: Follow `.claude/rules/git/commit-conventions.md` for commit messages, `.claude/rules/git/pull-requests.md` when updating a PR description, and `.claude/rules/git/milestones.md` before setting a milestone (issues only, never PRs), and `.claude/rules/git/issue-labels.md` before creating an issue (with write access: Issue Type only, no label). PRs should run full CI.
- **Documentation**: Update `README.md` and `CLAUDE.md` for major changes. Use concise, accurate docs.

### 4. Examples & Integration
- **Examples**: See `packages/ts-example*` and `packages/js-example*` for integration patterns:
  - With/without defaults, feature selection, headless Node.js, XML import/export.
- **Storybook**: `packages/html/stories/` for feature demos (JS/TS, migrating to TS).
- **Website**: Built with Docusaurus (`packages/website`). External resources must be copied to `generated/` before build.

### 5. References
- **CellStyle interface**: `packages/core/src/types.ts`
- **Graph vs BaseGraph**: `packages/ts-example-selected-features/`
- **Build output**: `packages/core/lib/esm/`, `packages/core/lib/cjs/`
- **Release process**: See `packages/website/docs/development/release.md`

---

**For more, see:**
- `CLAUDE.md` (architecture, CI, conventions)
- Project root `README.md` (features, commands, migration)
- `packages/core/README.md` (core usage)
- Example READMEs for integration patterns

