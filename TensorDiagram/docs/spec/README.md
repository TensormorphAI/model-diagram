# Specifications of the core package

This directory specifies the behaviour of `@tensormorph/tensordiagramcore` (`packages/core`) subsystem by subsystem, as
the source implements it today. It is written for contributors preparing the next phase of development: what a
subsystem promises, what it relies on, and where it can be extended without breaking anything.

- **Basis**: commit `a2e1bd3`, version `0.25.2` of the package. Every reference points to that state of the source.
- **Scope**: the source of `packages/core/src` only. The user documentation lives in `packages/website/docs`, the
  decisions in [`../adr`](../adr/README.md), the evaluations in [`../analyses`](../analyses/README.md).
- **Overview**: read [`ARCHITECTURE.md`](../../ARCHITECTURE.md) first for the big picture and the main workflows, and
  use [`COMPONENTS.md`](../../COMPONENTS.md) to locate a file.

## What a spec holds

Each file follows the same outline, so that a reader can jump to the part they need:

1. **Purpose and scope**: what the subsystem is responsible for, and the files it covers.
2. **Concepts**: the vocabulary, the main types and how they relate.
3. **Contract**: the public API, grouped by concern.
4. **Invariants**: what always holds, and what callers may rely on.
5. **Workflows**: the main flows, step by step, with the symbol and the file of each step.
6. **Events**: the `InternalEvent` names fired, by whom, with which properties.
7. **Extension points**: hooks meant to be overridden, registries, options, plugins.
8. **Traps**: behaviour that surprises, inherited from `mxGraph` or introduced since.
9. **Open items**: `TODO`, `FIXME`, deprecations and known gaps found in the source, as input for the next phase.

## Conventions

- A reference names a symbol and its file, relative to `packages/core`: `GraphView.validate` in
  `src/view/GraphView.ts`. Line numbers are avoided, since they drift with every change.
- A spec describes what the code does, not what it should do. A gap between the two is recorded under **Open items**,
  not fixed in the prose.
- When the source changes a contract described here, update the spec in the same pull request, and move the basis
  commit of this README forward once all the specs have been checked against it.
- Line width 120, consistent with the rest of the repository.

## Index

| Spec | Subsystem | Main files |
|---|---|---|
| [graph-lifecycle.md](graph-lifecycle.md) | Graph class hierarchy, construction, mixins, plugins, destruction | `src/view/AbstractGraph.ts`, `Graph.ts`, `BaseGraph.ts`, `src/view/mixin/` |
| [model-and-transactions.md](model-and-transactions.md) | Cells, geometry, data model, transactions, undoable changes, undo, selection model | `src/view/GraphDataModel.ts`, `src/view/cell/Cell.ts`, `src/view/undoable-change/` |
| [view-and-rendering.md](view-and-rendering.md) | View, cell states, validation, rendering, shapes, canvases, export | `src/view/GraphView.ts`, `src/view/cell/CellRenderer.ts`, `src/view/shape/`, `src/view/canvas/` |
| [style-and-registries.md](style-and-registries.md) | Stylesheet, style resolution, registries of shapes, edge styles, perimeters and markers | `src/view/style/`, `src/view/shape/ShapeRegistry.ts`, `src/view/shape/stencil/` |
| [events-and-interaction.md](events-and-interaction.md) | Event system, mouse dispatch, handlers, plugins, drag and drop | `src/view/event/`, `src/view/plugin/`, `src/view/handler/`, `src/view/other/` |
| [cell-handlers.md](cell-handlers.md) | Per-cell handlers (vertex, edge, segment, elbow), handles, constraints, keyboard, connection validation | `src/view/handler/`, `src/view/mixin/ConnectionsMixin.ts`, `src/view/mixin/ValidationMixin.ts` |
| [serialization.md](serialization.md) | XML codecs, codec registry, model serialization, mxGraph compatibility | `src/serialization/` |
| [layout.md](layout.md) | Layout algorithms, layout and swimlane managers | `src/view/layout/` |
| [editor-gui-and-utilities.md](editor-gui-and-utilities.md) | Editor, GUI widgets, i18n, global configuration, utilities | `src/editor/`, `src/gui/`, `src/i18n/`, `src/util/`, `src/Client.ts` |
