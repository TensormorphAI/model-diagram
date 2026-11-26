# Components of the core package

The code map of `@tensormorph/tensordiagramcore`: one line per source file of `packages/core/src`, saying what it holds,
whether it is public, and what it works with. Use it to locate code. For how the pieces fit together, read
[`ARCHITECTURE.md`](ARCHITECTURE.md). For the behaviour of each subsystem, read the specs in
[`docs/spec/`](docs/spec/README.md).

- **Basis**: commit `a2e1bd3`, version `0.25.2`. It covers 268 files: 247 listed below, plus the 21 mixin `.type.ts`
  files described by a single rule.
- **Public** means exported by `src/index.ts`:
  - `yes`: exported under its own name.
  - `yes (name)`: exported inside the `name` namespace.
  - `via X`: reachable through the `X` namespace or barrel only.
  - `no`: internal.
  - The mixins are internal, but their members are public as members of `AbstractGraph`.
- **Keep it current**: add a row when you add a file, and move the basis forward when you check the whole map again.

## Directory overview

| Directory | Files | Lines | Holds | Spec |
|---|---|---|---|---|
| `src/` (root) | 3 | 2 232 | `index.ts` barrel, `types.ts`, `Client.ts` | [graph-lifecycle](docs/spec/graph-lifecycle.md) |
| `src/view/` (root) | 7 | 5 265 | Graph tiers, data model, selection model, view, `registerDefaultStyleElements` | [graph-lifecycle](docs/spec/graph-lifecycle.md), [model-and-transactions](docs/spec/model-and-transactions.md), [view-and-rendering](docs/spec/view-and-rendering.md) |
| `src/view/mixin/` | 44 | 10 755 | The 21 mixins of `AbstractGraph`, each a `.ts` and `.type.ts` pair, and their wiring | [graph-lifecycle](docs/spec/graph-lifecycle.md) |
| `src/view/plugin/` | 11 | 7 064 | The 10 built-in plugins and `getDefaultPlugins` | [events-and-interaction](docs/spec/events-and-interaction.md) |
| `src/view/handler/` | 7 | 6 160 | Per-cell handlers, constraint and key handlers, handler config | [cell-handlers](docs/spec/cell-handlers.md) |
| `src/view/event/` | 4 | 1 462 | Event bus, DOM event helpers and event names, mouse event wrapper | [events-and-interaction](docs/spec/events-and-interaction.md) |
| `src/view/cell/` | 11 | 4 505 | `Cell`, `CellState`, `CellRenderer`, overlays, highlights, markers | [model-and-transactions](docs/spec/model-and-transactions.md), [view-and-rendering](docs/spec/view-and-rendering.md) |
| `src/view/geometry/` | 3 | 600 | `Geometry`, `Point`, `Rectangle` | [model-and-transactions](docs/spec/model-and-transactions.md) |
| `src/view/undoable-change/` | 13 | 957 | The change classes, `UndoableEdit`, `UndoManager` | [model-and-transactions](docs/spec/model-and-transactions.md) |
| `src/view/shape/` | 25 | 5 547 | `Shape`, the builtin vertex and edge shapes, stencils, shape registry | [view-and-rendering](docs/spec/view-and-rendering.md), [style-and-registries](docs/spec/style-and-registries.md) |
| `src/view/canvas/` | 3 | 3 351 | Canvas abstraction, SVG and XML canvases | [view-and-rendering](docs/spec/view-and-rendering.md) |
| `src/view/style/` | 24 | 3 864 | Stylesheet, edge styles, perimeters, markers, their registries | [style-and-registries](docs/spec/style-and-registries.md) |
| `src/view/image/` | 3 | 302 | Image value object, image bundles, image export | [view-and-rendering](docs/spec/view-and-rendering.md) |
| `src/view/animate/` | 3 | 474 | Animation, effects, morphing | [view-and-rendering](docs/spec/view-and-rendering.md) |
| `src/view/layout/` | 28 | 9 984 | Layout algorithms, hierarchical pipeline, layout and swimlane managers | [layout](docs/spec/layout.md) |
| `src/view/other/` | 8 | 3 476 | Drag source, guides, outline, print preview, panning manager, auto-save, connection constraint, multiplicity | several, see the rows |
| `src/serialization/` | 28 | 3 659 | `Codec`, `ObjectCodec`, `CodecRegistry`, the codecs, `ModelXmlSerializer` | [serialization](docs/spec/serialization.md) |
| `src/editor/` | 4 | 3 474 | `Editor` and its key handler, popup menu and toolbar | [editor-gui-and-utilities](docs/spec/editor-gui-and-utilities.md) |
| `src/gui/` | 7 | 2 675 | Window, toolbar, popup menu, form, log widgets | [editor-gui-and-utilities](docs/spec/editor-gui-and-utilities.md) |
| `src/i18n/` | 3 | 560 | Translations, i18n provider and config | [editor-gui-and-utilities](docs/spec/editor-gui-and-utilities.md) |
| `src/util/` | 22 | 5 033 | Utility namespaces, global config, logger, constants, XML and requests, clipboard | [editor-gui-and-utilities](docs/spec/editor-gui-and-utilities.md) |
| `src/internal/` | 6 | 208 | Private helpers: `mixInto`, `isNullish`, `log`, `translate`, `BaseRegistry` | [graph-lifecycle](docs/spec/graph-lifecycle.md) |

Line counts include comments and blank lines.

## Mixin type files

Each `src/view/mixin/XxxMixin.ts` has a `XxxMixin.type.ts` sibling. It declares the members of the mixin, with their
TSDoc, on the `AbstractGraph` interface through `declare module '../AbstractGraph'`, and it is imported by
`_graph-mixins-types.ts`. Read the `.type.ts` file for the contract, and the `.ts` file for the behaviour.

## Files

### `src/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `Client.ts` | yes | `Client` | Browser flags, `basePath`, `imageBasePath` | used package-wide |
| `index.ts` | entry | everything | The public barrel: every export of the package goes through it | all modules |
| `types.ts` | yes | `CellStyle`, `CellStateStyle`, `GraphPlugin`, `PluginId`, `GraphOptions`, registry and handler types, ... | Shared types of the package: style model, plugin contract, options, events, registries | used package-wide |

### `src/view/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `AbstractGraph.ts` | yes | `AbstractGraph` | Constructor and destroy sequence, plugin map, model change to view dispatch, members not yet moved to mixins; applies the mixins at module scope | `GraphView`, `GraphDataModel`, `Stylesheet`, `CellRenderer`, `applyGraphMixins`, plugins |
| `BaseGraph.ts` | yes | `BaseGraph` | Production tier: collaborators from `GraphCollaboratorsOptions` or new defaults, no plugin, no style element | the five collaborators |
| `Graph.ts` | yes | `Graph` | Full-featured tier: positional constructor, `createXxx()` factories, `getDefaultPlugins()`, `registerDefaultStyleElements()` | `getDefaultPlugins`, `registerDefaultStyleElements` |
| `GraphDataModel.ts` | yes | `GraphDataModel` | Cell tree and id map, transactions (`beginUpdate` / `endUpdate` / `execute`), model events | `Cell`, the change classes, `UndoableEdit`, `CellPath` |
| `GraphSelectionModel.ts` | yes | `GraphSelectionModel` | Selected cells and the single-selection flag, applies `SelectionChange`, fires `CHANGE` and `UNDO` | `SelectionChange`, `UndoableEdit` |
| `GraphView.ts` | yes | `GraphView` | Caches one `CellState` per visible cell, validates and routes them, owns scale, translate, current root and the SVG panes | `CellState`, `CellRenderer`, `EdgeStyleRegistry`, `PerimeterRegistry`, `CurrentRootChange` |
| `register-style-elements.ts` | yes | `registerDefaultStyleElements` | Registers every builtin at once, what `Graph` does | `register.ts`, `register-shapes.ts` |

### `src/view/mixin/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `CellsMixin.ts` | no | `CellsMixin` | Cell styles, add/remove/clone/resize/move/constrain, hit-testing, per-cell permissions | Edge, Connections, Selection, Swimlane, Snap mixins, `ImageBundlePlugin` |
| `ConnectionsMixin.ts` | no | `ConnectionsMixin` | Connection constraints and points, `connectCell` / `cellConnected`, `disconnectGraph`, connectability | Ports, Edge, Cells mixins, `ConnectionHandler` |
| `DragDropMixin.ts` | no | `DragDropMixin` | Drop, split, auto-scroll and auto-extend flags, `isSplitTarget` | Validation mixin |
| `EdgeMixin.ts` | no | `EdgeMixin` | `insertEdge` / `createEdge` / `addEdge`, edge queries, flip, split, reset | Cells, Connections mixins, `alternateEdgeStyle` |
| `EditingMixin.ts` | no | `EditingMixin` | In-place editing API, `labelChanged` | `CellEditorHandler`, Cells mixin |
| `EventsMixin.ts` | no | `EventsMixin` | Mouse dispatch loop, click / double-tap / tap-and-hold, event predicates, `sizeDidChange` | `mouseListeners`, Tooltip, Panning, Connection, CellEditor plugins |
| `FoldingMixin.ts` | no | `FoldingMixin` | Collapse / expand, alternate bounds | `AbstractGraph.options`, Cells mixin |
| `GroupingMixin.ts` | no | `GroupingMixin` | Group / ungroup, group bounds, `enterGroup` / `exitGroup` | Cells, Swimlane, Selection mixins |
| `LabelMixin.ts` | no | `LabelMixin` | `getLabel`, HTML / wrap / clip / movable label flags | `convertValueToString`, Cells mixin |
| `OrderMixin.ts` | no | `OrderMixin` | `orderCells` / `cellsOrdered` (z-order) | Selection mixin |
| `OverlaysMixin.ts` | no | `OverlaysMixin` | Cell overlays, `setCellWarning` | `CellRenderer`, `warningImage` |
| `PageBreaksMixin.ts` | no | `PageBreaksMixin` | Draws the page-break polylines | page getters of `AbstractGraph` |
| `PanningMixin.ts` | no | `PanningMixin` | `panGraph` preview, `scrollCellToVisible` / `scrollRectToVisible`, `setPanning` | `PanningHandler`, `SelectionCellsHandler` |
| `PortsMixin.ts` | no | `PortsMixin` | Port hooks (`isPort`, `getTerminalForPort`) | none |
| `SelectionMixin.ts` | no | `SelectionMixin` | Selection API over `GraphSelectionModel`, `updateSelection` | `GraphSelectionModel`, Cells mixin |
| `SnapMixin.ts` | no | `SnapMixin` | Grid, `snap`, `snapDelta` | `GraphView` |
| `SwimlaneMixin.ts` | no | `SwimlaneMixin` | Swimlane geometry, `getDropTarget` | Cells, DragDrop, Panning mixins |
| `TerminalMixin.ts` | no | `TerminalMixin` | `getOpposites`, `isTerminalPointMovable` | `GraphView` |
| `ValidationMixin.ts` | no | `ValidationMixin` | Edge and graph validation against multiplicities | `multiplicities`, Overlays, Edge mixins |
| `VertexMixin.ts` | no | `VertexMixin` | `insertVertex` / `createVertex`, vertex flags | Cells mixin (`addCell`) |
| `ZoomMixin.ts` | no | `ZoomMixin` | Zoom in / out / to / rect | Panning, Selection mixins |
| `_README.md` | n/a | n/a | Why mixins exist, never exported | n/a |
| `_graph-mixins-apply.ts` | no | `applyGraphMixins` | Copies the 21 mixins onto `AbstractGraph.prototype` with `mixInto` | `mixInto`, every mixin |
| `_graph-mixins-types.ts` | types | (side-effect imports) | Pulls in the 21 `.type.ts` augmentations, imported by `index.ts` | the `.type.ts` files |

### `src/view/plugin/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `CellEditorHandler.ts` | yes | `CellEditorHandler` | In-place `contentEditable` label editor | `EditingMixin`, `TooltipHandler` |
| `ConnectionHandler.ts` | yes | `ConnectionHandler`, `ConnectionHandlerCellMarker` | Creates edges by dragging from a source to a target | `CellMarker`, `ConstraintHandler`, `ConnectionsMixin` |
| `FitPlugin.ts` | yes | `FitPlugin`, `FitOptions`, `FitCenterOptions` | Fits or centers the graph in its container | `GraphView` |
| `ImageBundlePlugin.ts` | yes | `ImageBundlePlugin` | Stores image bundles and resolves `style.image` keys | `ImageBundle`, `CellsMixin.postProcessCellStyle` |
| `PanningHandler.ts` | yes | `PanningHandler` | Pan gestures (trigger, force, pinch zoom), fires `PAN_START`, `PAN`, `PAN_END` | `PanningManager`, `PanningMixin`, `ZoomMixin` |
| `PopupMenuHandler.ts` | yes | `PopupMenuHandler` | Context menu on the popup trigger, selects on popup | `MaxPopupMenu`, `TooltipHandler` |
| `RubberBandHandler.ts` | yes | `RubberBandHandler` | Rubber-band region selection, not a default plugin | `graph.selectRegion` |
| `SelectionCellsHandler.ts` | yes | `SelectionCellsHandler` | One cell handler per selected cell, handler factories per edge-style kind, forwards mouse events | `VertexHandler`, `EdgeHandler`, `EdgeStyleRegistry` |
| `SelectionHandler.ts` | yes | `SelectionHandler` | Select, move, clone, drop into a parent, split an edge, connect on drop | `Guide`, `CellHighlight`, `SelectionCellsHandler` |
| `TooltipHandler.ts` | yes | `TooltipHandler` | Delayed tooltips | `SelectionCellsHandler`, `PopupMenuHandler` |
| `index.ts` | yes | the 10 plugin classes, `getDefaultPlugins` | Plugin barrel, the 9 default plugins | `GraphPluginConstructor` |

### `src/view/handler/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `ConstraintHandler.ts` | yes | `ConstraintHandler` | Shows the fixed connection points of the hovered terminal and picks the current constraint | `getAllConnectionConstraints`, `getConnectionPoint`, `EdgeHandler`, `ConnectionHandler` |
| `EdgeHandler.ts` | yes | `EdgeHandler` | Bends, terminal and label handles, virtual bends, reconnect, clone and outline connect of a selected edge | `ConstraintHandler`, `CellMarker`, `graph.connectCell`, `getEdgeValidationError`, `EdgeStyleRegistry` |
| `EdgeSegmentHandler.ts` | yes | `EdgeSegmentHandler` | One handle per segment of orthogonal routes, merges collinear points | `ElbowEdgeHandler`, `GraphView.updatePoints` |
| `ElbowEdgeHandler.ts` | yes | `ElbowEdgeHandler` | Source, one middle bend, target; double-click on the bend calls `flipEdge` | `EdgeHandler`, `graph.flipEdge` |
| `KeyHandler.ts` | yes | `KeyHandler` | Standalone keydown dispatcher with four binding maps; escape calls `graph.escape` | `EditorKeyHandler`, `CellEditorHandler` |
| `VertexHandler.ts` | yes | `VertexHandler` | Selection border, resize, rotate, label and custom handles of a selected vertex; preview, then commit on mouse up | `SelectionCellsHandler`, `SelectionHandler.maxCells`, `graph.resizeCell`, `VertexHandle` |
| `config.ts` | yes | `HandleConfig`, `VertexHandlerConfig`, `EdgeHandlerConfig`, `reset*Config` | Global look and behaviour settings of every handler, and their reset functions | `util/Constants.ts`, the handlers, `VertexHandle` |

### `src/view/event/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `EventObject.ts` | yes | `EventObject` | Event name, properties and `consumed` flag | `EventSource` |
| `EventSource.ts` | yes | `EventSource` | Synchronous named-event bus: add, remove and fire listeners, `eventsEnabled`, sender override | `EventObject`; base of `AbstractGraph`, `GraphView`, `GraphDataModel` |
| `InternalEvent.ts` | yes | `InternalEvent` | Static DOM helpers (listeners, gesture listeners, `redirectMouseEvents`, `consume`, `release`, wheel and pinch) and every event name constant | `Client`, `eventUtils` |
| `InternalMouseEvent.ts` | yes | `InternalMouseEvent` | Wraps one native event with its state, `graphX` / `graphY` and the dispatch `consumed` flag | `eventUtils`, `CellState` |

### `src/view/cell/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `Cell.ts` | yes | `Cell` | Tree node: id, value, geometry, style, flags, parent and children, terminals and edges | `Geometry`, `CellPath`, `cloneUtils.clone` |
| `CellHighlight.ts` | yes | `CellHighlight` | Outline copy of the shape of a state in `overlayPane`, repainted on view and model changes | `CellRenderer.createShape`, `GraphView` events |
| `CellMarker.ts` | yes | `CellMarker` | Finds, validates and highlights the cell under the pointer, fires `MARK` | `CellHighlight` |
| `CellOverlay.ts` | yes | `CellOverlay` | Icon and tooltip on a cell, fires `CLICK` | `CellRenderer`, `OverlaysMixin`, `ImageBox` |
| `CellPath.ts` | yes | `CellPath` | Positional paths of child indices: `create`, `getParentPath`, `resolve`, `compare` | `Cell`, `GraphDataModel.mergeChildren` |
| `CellRenderer.ts` | yes | `CellRenderer` | Creates, configures, redraws, orders and destroys the shape, label, overlays and folding control of a state | `ShapeRegistry`, `StencilShapeRegistry`, `TextShape`, `CellOverlay` |
| `CellState.ts` | yes | `CellState` | View state of one cell: view bounds, origin, label offset, absolute points, resolved style, shapes | `GraphView`, `CellRenderer`, `Shape`, `TextShape` |
| `CellStatePreview.ts` | yes | `CellStatePreview` | Moves states without touching the model and redraws them (live preview) | `GraphView.updateCellState`, `Morphing` |
| `CellTracker.ts` | yes | `CellTracker` | `CellMarker` registered as a mouse listener, highlights on hover | `CellMarker` |
| `TemporaryCellStates.ts` | yes | `TemporaryCellStates` | Temporarily swaps the states and scale of the view to validate a subset of cells for export or print | `GraphView`, `xmlViewUtils`, `PrintPreview` |
| `VertexHandle.ts` | yes | `VertexHandle` | Base class of custom handles driving a style value | `HandleConfig`, `CellRenderer` |

### `src/view/geometry/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `Geometry.ts` | yes | `Geometry` | Bounds, `relative`, `offset`, `points`, terminal points, `alternateBounds` / `swap`, translate, scale, rotate | `Rectangle`, `Point` |
| `Point.ts` | yes | `Point` | 2D point whose setters reject NaN | none |
| `Rectangle.ts` | yes | `Rectangle` | Rectangle extending `Point`: union, intersect, grow, `rotate90` | `Point` |

### `src/view/undoable-change/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `CellAttributeChange.ts` | yes | `CellAttributeChange` | Swaps one attribute of an XML user object | `Cell` |
| `ChildChange.ts` | yes | `ChildChange` | Moves or removes a child (`parentForCellChanged`), detaches and reattaches its terminals | `GraphDataModel` |
| `CollapseChange.ts` | yes | `CollapseChange` | Swaps the collapsed flag | `GraphDataModel` |
| `CurrentRootChange.ts` | yes | `CurrentRootChange` | Swaps `view.currentRoot` (drill down / up), fires `UP` or `DOWN` | `GraphView` |
| `GeometryChange.ts` | yes | `GeometryChange` | Swaps the geometry (`geometryForCellChanged`) | `GraphDataModel` |
| `RootChange.ts` | yes | `RootChange` | Swaps the model root (`rootChanged`) | `GraphDataModel` |
| `SelectionChange.ts` | yes | `SelectionChange` | Adds and removes selected cells, fires `CHANGE` on the selection model | `GraphSelectionModel` |
| `StyleChange.ts` | yes | `StyleChange` | Swaps the style (`styleForCellChanged`) | `GraphDataModel` |
| `TerminalChange.ts` | yes | `TerminalChange` | Swaps an edge terminal (`terminalForCellChanged`) | `GraphDataModel` |
| `UndoManager.ts` | yes | `UndoManager` | Bounded history with a cursor, skips insignificant edits | `UndoableEdit`, `Editor.installUndoHandler` |
| `UndoableEdit.ts` | yes | `UndoableEdit` | Changes of one transaction, `undo` / `redo` replay them then `notify()` | `EventSource` |
| `ValueChange.ts` | yes | `ValueChange` | Swaps the user object (`valueForCellChanged`) | `GraphDataModel` |
| `VisibleChange.ts` | yes | `VisibleChange` | Swaps the visible flag | `GraphDataModel` |

### `src/view/shape/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `Shape.ts` | yes | `Shape` | Base painted element: SVG `g` node, style fields, paint pipeline, bounding box | `SvgCanvas2D`, `AbstractCanvas2D`, `StencilShape` |
| `ShapeRegistry.ts` | yes | `ShapeRegistry` | Name to `ShapeConstructor` | `BaseRegistry`, `CellRenderer` |
| `register-shapes.ts` | yes | `registerDefaultShapes`, `unregisterAllShapes` | Registers the 16 builtin shapes once | `ShapeRegistry` |

### `src/view/shape/node/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `AbstractPathShape.ts` | yes | `AbstractPathShape` | Single filled path vertex, subclasses implement `redrawPath` | `Shape` |
| `ActorShape.ts` | yes | `ActorShape` | `actor` | `AbstractPathShape` |
| `CloudShape.ts` | yes | `CloudShape` | `cloud` | `AbstractPathShape` |
| `CylinderShape.ts` | yes | `CylinderShape` | `cylinder`, with a foreground path | `Shape` |
| `DoubleEllipseShape.ts` | yes | `DoubleEllipseShape` | `doubleEllipse`, inset label bounds | `Shape` |
| `EllipseShape.ts` | yes | `EllipseShape` | `ellipse` | `Shape` |
| `HexagonShape.ts` | yes | `HexagonShape` | `hexagon` | `AbstractPathShape` |
| `ImageShape.ts` | yes | `ImageShape` | `image`; also the background image, overlays and folding control | `RectangleShape`, `SvgCanvas2D.image` |
| `LabelShape.ts` | yes | `LabelShape` | `label`: rectangle with image and indicator | `RectangleShape` |
| `RectangleShape.ts` | yes | `RectangleShape` | `rectangle`, the default vertex shape, rounded and glass variants | `Shape` |
| `RhombusShape.ts` | yes | `RhombusShape` | `rhombus` | `Shape` |
| `SwimlaneShape.ts` | yes | `SwimlaneShape` | `swimlane`: title plus content lane | `Shape`, `StyleDefaultsConfig` |
| `TextShape.ts` | yes | `TextShape` | Label shape: SVG text or `foreignObject` HTML, label measuring | `CellRenderer.createLabel`, `SvgCanvas2D.text` |
| `TriangleShape.ts` | yes | `TriangleShape` | `triangle` | `AbstractPathShape` |

### `src/view/shape/edge/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `ArrowConnectorShape.ts` | yes | `ArrowConnectorShape` | `arrowConnector`: filled band with bends and arrow heads | `Shape` |
| `ArrowShape.ts` | yes | `ArrowShape` | `arrow`: block arrow | `Shape` |
| `ConnectorShape.ts` | yes | `ConnectorShape` | `connector`, the default edge shape, with markers | `PolylineShape`, `EdgeMarkerRegistry` |
| `LineShape.ts` | yes | `LineShape` | `line` | `Shape` |
| `PolylineShape.ts` | yes | `PolylineShape` | Straight, rounded or curved line, not registered | `Shape` |

### `src/view/shape/stencil/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `StencilShape.ts` | yes | `StencilShape`, `StencilShapeConfig`, `resetStencilShapeConfig` | Paints a shape from its XML description | `StencilShapeRegistry`, `AbstractCanvas2D` |
| `StencilShapeRegistry.ts` | yes | `StencilShapeRegistry` | Name to `StencilShape` instance | `BaseRegistry`, `CellRenderer.createShape` |
| `register.ts` | yes | `unregisterAllStencilShapes` | Clears the stencil registry | `StencilShapeRegistry` |

### `src/view/canvas/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `AbstractCanvas2D.ts` | yes | `AbstractCanvas2D` | Drawing API: state stack, transform, path operations, abstract primitives | `UrlConverter` |
| `SvgCanvas2D.ts` | yes | `SvgCanvas2D` | SVG output: paths, gradients, shadows, hit tolerance, text and `foreignObject` HTML | `Shape.createSvgCanvas`, `TextShape` |
| `XmlCanvas2D.ts` | yes | `XmlCanvas2D` | Records the drawing calls as XML, optional compression | `ImageExport` |

### `src/view/style/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `Stylesheet.ts` | yes | `Stylesheet` | Named styles (`defaultVertex`, `defaultEdge`, ...), merge of defaults, `baseStyleNames` and the cell style | `CellsMixin.getCellStyle`, `StylesheetCodec`, `Editor` |
| `builtin-style-elements.ts` | yes | namespaces `EdgeStyle`, `Perimeter`, `EdgeMarker` | Re-exports the builtin functions as namespaces | `edge/index`, `perimeter/index`, `marker/edge-markers` |
| `config.ts` | yes | `EntityRelationConnectorConfig`, `OrthogonalConnectorConfig`, `ManhattanConnectorConfig`, `reset*ConnectorConfig` | Global, experimental tuning of the connectors | `EntityRelation`, `Orthogonal`, `Manhattan` |
| `register.ts` | yes | `register*EdgeStyle`, `registerDefaultEdgeStyles`, `registerDefaultPerimeters`, `registerDefaultEdgeMarkers`, `unregisterAll*` | Registers the builtins with their metadata, guarded by module-level flags | the three style registries |

### `src/view/style/edge/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `EdgeStyleRegistry.ts` | yes | `EdgeStyleRegistry` | Name to `EdgeStyleFunction`, plus metadata per function (`isOrthogonal`, `handlerKind`, `allowIntermediateHandles`) | `BaseRegistry`, `GraphView.getEdgeStyle`, `AbstractGraph.isOrthogonal`, `SelectionCellsHandler` |
| `Elbow.ts` | via `EdgeStyle` | `ElbowConnector` | Chooses `SideToSide` or `TopToBottom` | `SideToSide`, `TopToBottom` |
| `EntityRelation.ts` | via `EdgeStyle` | `EntityRelation` | Entity-relation routing with horizontal segments | `EntityRelationConnectorConfig` |
| `Loop.ts` | via `EdgeStyle` | `Loop` | Self-reference routing, default of `AbstractGraph.defaultLoopStyle` | `GraphView.transformControlPoint` |
| `Manhattan.ts` | via `EdgeStyle` | `ManhattanConnector` | A* router avoiding vertices | `ManhattanConnectorConfig`, `SegmentConnector`, `OrthogonalConnector` |
| `Orthogonal.ts` | via `EdgeStyle` (`OrthConnector`) | `OrthogonalConnector` | Pattern-based orthogonal router with jetties | `OrthogonalConnectorConfig`, `SegmentConnector` |
| `Segment.ts` | via `EdgeStyle` | `SegmentConnector` | Orthogonal route through the control points | `shared`, `GraphView` |
| `SideToSide.ts` | via `EdgeStyle` | `SideToSide` | Horizontal elbow | `GraphView` |
| `TopToBottom.ts` | via `EdgeStyle` | `TopToBottom` | Vertical elbow | `GraphView` |
| `index.ts` | via `EdgeStyle` | the 8 connectors | Barrel of the connectors | the edge files |
| `shared.ts` | no | `scalePointArray`, `scaleCellState` | Unscales points and states for the routers | `Orthogonal`, `Segment` |

### `src/view/style/marker/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `EdgeMarkerRegistry.ts` | yes | `EdgeMarkerRegistry` | Name to marker factory, `createMarker` | `BaseRegistry`, `ConnectorShape` |
| `edge-markers.ts` | via `EdgeMarker` | `createArrow`, `createOpenArrow`, `oval`, `diamond` | Builtin marker factories | `AbstractCanvas2D` |

### `src/view/style/perimeter/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `EllipsePerimeter.ts` | via `Perimeter` | `EllipsePerimeter` | Ellipse projection | `Point` |
| `HexagonPerimeter.ts` | via `Perimeter` | `HexagonPerimeter` | Hexagon projection, honours `direction` | `mathUtils.intersection` |
| `PerimeterRegistry.ts` | yes | `PerimeterRegistry` | Name to `PerimeterFunction` | `BaseRegistry`, `GraphView.getPerimeterFunction` |
| `RectanglePerimeter.ts` | via `Perimeter` | `RectanglePerimeter` | Rectangle projection, perimeter of the default vertex style | `Point` |
| `RhombusPerimeter.ts` | via `Perimeter` | `RhombusPerimeter` | Rhombus projection | `mathUtils.intersection` |
| `TrianglePerimeter.ts` | via `Perimeter` | `TrianglePerimeter` | Triangle projection, honours `direction` | `mathUtils.intersection` |
| `index.ts` | via `Perimeter` | the 5 perimeters | Barrel | the perimeter files |

### `src/view/image/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `ImageBox.ts` | yes | `ImageBox` | Value object: `src`, `width`, `height` | `GraphView`, `CellOverlay` |
| `ImageBundle.ts` | yes | `ImageBundle` | Maps keys to data URIs | `ImageBundlePlugin` |
| `ImageExport.ts` | yes | `ImageExport` | Paints states onto any canvas, for export | `Shape.paint`, `AbstractCanvas2D` |

### `src/view/animate/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `Animation.ts` | yes | `Animation` | `setInterval` animation base, fires `EXECUTE` and `DONE` | `EventSource` |
| `Effects.ts` | yes | `Effects` | Static fade and move effects for changed cells | `CellRenderer.redraw` |
| `Morphing.ts` | yes | `Morphing` | Animates vertex states toward their model position | `Animation`, `CellStatePreview` |

### `src/view/layout/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `CircleLayout.ts` | yes | `CircleLayout` | Places the children on a circle | `GraphLayout` |
| `CompactTreeLayout.ts` | yes | `CompactTreeLayout` | Moen compact tree with orthogonal edge routing | `findTreeRoots`, `WeightedCellSorter` |
| `CompositeLayout.ts` | yes | `CompositeLayout` | Runs several layouts in one batch, `moveCell` goes to the master | `GraphLayout` |
| `EdgeLabelLayout.ts` | yes | `EdgeLabelLayout` | Moves edge labels off overlapping vertices | `CellState` |
| `FastOrganicLayout.ts` | yes | `FastOrganicLayout` | Force-directed layout with temperature cooling | `graph.getConnections`, `graph.moveCells` |
| `GraphLayout.ts` | yes | `GraphLayout` | Base contract: `execute`, `moveCell`, `resizeCell`, filters, edge-style toggles, parent offsets, geometry writers | `AbstractGraph`, `GraphDataModel.setGeometry` |
| `HierarchicalLayout.ts` | yes | `HierarchicalLayout` | Sugiyama driver, runs the four stages for each hierarchy | `GraphHierarchyModel` and the stages |
| `LayoutManager.ts` | yes | `LayoutManager` | Re-runs layouts on `BEFORE_UNDO` in two passes, forwards `MOVE_CELLS` / `RESIZE_CELLS` to the layout of the parent | `GraphDataModel`, the change classes |
| `ParallelEdgeLayout.ts` | yes | `ParallelEdgeLayout` | Spreads parallel edges and loops with one control point each | `GraphView.getVisibleTerminal` |
| `PartitionLayout.ts` | yes | `PartitionLayout` | Fills the parent with equal child slots | `graph.getStartSize` |
| `RadialTreeLayout.ts` | yes | `RadialTreeLayout` | Compact tree turned into concentric circles | `CompactTreeLayout` |
| `StackLayout.ts` | yes | `StackLayout` | Stacks or wraps the children, drag reorders | `GraphDataModel.add` |
| `SwimlaneLayout.ts` | yes | `SwimlaneLayout` | Hierarchical layout across an ordered list of lanes | `SwimlaneModel`, `SwimlaneOrdering` |
| `SwimlaneManager.ts` | yes | `SwimlaneManager` | Sizes a new swimlane like its siblings, spreads a resize to the other swimlanes | `SwimlaneMixin`, `ADD_CELLS`, `CELLS_RESIZED` |
| `types.ts` | no | traversal argument types | Argument types of the `traverse` overrides | the layouts |

### `src/view/layout/datatypes/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `GraphAbstractHierarchyCell.ts` | yes | `GraphAbstractHierarchyCell` | Abstract node or edge of the internal hierarchy model, extends `Cell` | `Cell` |
| `GraphHierarchyEdge.ts` | yes | `GraphHierarchyEdge` | Groups parallel edges, virtual nodes on intermediate ranks | `ObjectIdentity` |
| `GraphHierarchyNode.ts` | yes | `GraphHierarchyNode` | Wraps one vertex of the hierarchy model | `ObjectIdentity` |
| `HierarchicalEdgeStyle.ts` | yes | `HierarchicalEdgeStyle` | Edge style constants of the hierarchical layouts | `CoordinateAssignment` |

### `src/view/layout/hierarchical/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `CoordinateAssignment.ts` | yes | `CoordinateAssignment` | Horizontal placement, jetties, writes vertex and edge geometry | `WeightedCellSorter` |
| `GraphHierarchyModel.ts` | yes | `GraphHierarchyModel` | Builds the internal DAG, longest-path ranking | `HierarchicalLayout` |
| `HierarchicalLayoutStage.ts` | yes | `HierarchicalLayoutStage` | Abstract stage, `execute(parent)` | the stages |
| `MedianHybridCrossingReduction.ts` | yes | `MedianHybridCrossingReduction` | Weighted median plus transpose crossing reduction | `MedianCellSorter` |
| `MinimumCycleRemover.ts` | yes | `MinimumCycleRemover` | Reverses the edges that point to an ancestor | `GraphHierarchyModel.visit` |
| `SwimlaneModel.ts` | yes | `SwimlaneModel` | Same model with a rank band per lane | `SwimlaneLayout` |
| `SwimlaneOrdering.ts` | yes | `SwimlaneOrdering` | Cycle stage that also reverses edges going to a lower lane | `SwimlaneModel.visit` |

### `src/view/layout/util/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `MedianCellSorter.ts` | no | `MedianCellSorter` | Sort wrapper by median value | crossing reduction |
| `WeightedCellSorter.ts` | no | `WeightedCellSorter` | Sort wrapper by weight | `CoordinateAssignment`, `CompactTreeLayout` |

### `src/view/other/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `AutoSaveManager.ts` | yes | `AutoSaveManager` | Throttles a `save()` hook on model `CHANGE` | `GraphDataModel` events |
| `ConnectionConstraint.ts` | yes | `ConnectionConstraint` | Value object of a connection point: `point`, `perimeter`, `name`, `dx`, `dy` | `ConnectionsMixin`, `ConstraintHandler` |
| `DragSource.ts` | yes | `DragSource` | Drag and drop from outside DOM elements into a graph | `Guide`, `CellHighlight` |
| `Guide.ts` | yes | `Guide` | Snaps a move to the bounds and centers of other cells, draws guide lines | `graph.snapDelta`, `PolylineShape` |
| `Multiplicity.ts` | yes | `Multiplicity` | Rule limiting how many connections, and to which type, a terminal accepts | `ValidationMixin` |
| `Outline.ts` | yes | `Outline` | Minimap with a draggable viewport and a zoom sizer | a `BaseGraph` sharing the model, `getDefaultPlugins` |
| `PanningManager.ts` | yes | `PanningManager` | Timer-driven auto-scroll near the container edge | `PanningHandler`, `AbstractGraph.scrollPointToVisible` |
| `PrintPreview.ts` | yes | `PrintPreview` | Renders the graph across pages in a new window | `TemporaryCellStates`, `CellRenderer`, `GraphView` |

### `src/serialization/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `Codec.ts` | yes | `Codec` | Runs one encode or decode and holds its state: document, `objects`, `elements`, id resolution, cell hierarchy helpers | `CodecRegistry`, `ObjectCodec`, `CellPath` |
| `CodecRegistry.ts` | yes | `CodecRegistry` | Static map of codecs by name, with aliases; creates a generic codec for an unknown class on encode | `ObjectCodec` |
| `ModelXmlSerializer.ts` | yes | `ModelXmlSerializer`, `ModelExportOptions` | Facade for model import and export, registers the model codecs itself | `registerModelCodecs`, `Codec`, `xmlUtils` |
| `ObjectCodec.ts` | yes | `ObjectCodec` | Reflective default codec: template, exclude, idrefs, mapping, hooks, `allowEval`, `<include>` | `Codec`, `requestUtils.load`, `doEval` |
| `register-model-codecs.ts` | yes | `registerModelCodecs` | Registers the Cell, model, Geometry, Point, mxCell and mxGeometry codecs and the mx aliases | `CodecRegistry`, `register-shared` |
| `register-other-codecs.ts` | yes | `registerCoreCodecs`, `registerEditorCodecs`, `registerAllCodecs`, `unregisterAllCodecs` | Registers the graph, view, stylesheet, change and editor codecs, resets the registry | `_other-codecs`, `registerModelCodecs` |
| `register-shared.ts` | no | `CodecRegistrationStates`, `registerBaseCodecs`, `createObjectCodec` | Registration flags, Object and Array codecs | `CodecRegistry`, `ObjectCodec` |

### `src/serialization/codec/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `BaseGraphCodec.ts` | yes | `BaseGraphCodec` | Codec of `BaseGraph`, excludes the transient fields | `BaseGraph`, `excludedFields` |
| `CellCodec.ts` | yes | `CellCodec` | Cell codec: exclusions, parent / source / target idrefs, forward references, XML user objects | `Cell`, `Codec` |
| `ChildChangeCodec.ts` | yes | `ChildChangeCodec` | `ChildChange`, as a reference or with its whole hierarchy | `ChildChange`, `Codec.encodeCell` |
| `GenericChangeCodec.ts` | yes | `GenericChangeCodec` | Shared codec of the value, style, geometry, collapse, visible and attribute changes | the six change classes |
| `GraphCodec.ts` | yes (`GraphCodec`) | `GraphCodec`, `excludedFields` | Codec of `Graph`, template built without plugins | `Graph` |
| `GraphViewCodec.ts` | yes | `GraphViewCodec` | Encode-only export of the rendered view: absolute bounds, points, resolved styles | `GraphView`, `CellState` |
| `ModelCodec.ts` | yes | `ModelCodec` | Writes the model as a flat `root` sequence, decodes `root` and calls `setRoot` | `GraphDataModel`, `Codec` |
| `RootChangeCodec.ts` | yes | `RootChangeCodec` | `RootChange` with its cell hierarchy | `RootChange` |
| `StylesheetCodec.ts` | yes | `StylesheetCodec` | Add / extend / remove format of `Stylesheet`, its own `allowEval` | `Stylesheet`, `codec/utils` |
| `TerminalChangeCodec.ts` | yes | `TerminalChangeCodec` | `TerminalChange` with cell and terminal idrefs | `TerminalChange` |
| `_model-codecs.ts` | yes (barrel) | the model codecs | Barrel of the model codecs | `index.ts` |
| `_other-codecs.ts` | yes (barrel) | the other codecs | Barrel of the graph, view, stylesheet, change and editor codecs | `index.ts` |
| `utils.ts` | no | `getNameFromRegistries` | Writes style functions back as their registry names | `EdgeStyleRegistry`, `PerimeterRegistry` |

### `src/serialization/codec/editor/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `EditorCodec.ts` | yes | `EditorCodec` | Decodes the editor configuration: templates, UI containers and windows, default edge and group | `Editor`, `MaxWindow` |
| `EditorKeyHandlerCodec.ts` | yes | `EditorKeyHandlerCodec` | Decode-only key bindings | `EditorKeyHandler` |
| `EditorPopupMenuCodec.ts` | yes | `EditorPopupMenuCodec` | Decode-only, stores the XML node as the menu configuration | `EditorPopupMenu` |
| `EditorToolbarCodec.ts` | yes | `EditorToolbarCodec` | Decode-only toolbar builder: items, modes, prototypes, combos | `EditorToolbar`, `doEval` |
| `index.ts` | yes (barrel) | the four editor codecs | Barrel | `_other-codecs` |

### `src/serialization/codec/mxGraph/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `mxCellCodec.ts` | yes | `mxCellCodec` | Import-only `mxCell` codec, converts string styles | `CellCodec`, `convertStyleFromString` |
| `mxGeometryCodec.ts` | yes | `mxGeometryCodec` | Import-only `mxGeometry` codec | `Geometry`, `Point` |
| `utils.ts` | no | `convertStyleFromString` | Converts an mxGraph or draw.io style string to a `CellStyle` | none |

### `src/editor/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `Editor.ts` | yes | `Editor` | mxEditor-style application controller: actions, templates, undo, auto-layout, file IO, dialogs | `Graph`, `UndoManager`, `Codec` / `EditorCodec`, `ModelXmlSerializer`, `LayoutManager`, `SwimlaneManager`, `MaxWindow` |
| `EditorKeyHandler.ts` | yes | `EditorKeyHandler` | Binds key codes to editor actions; escape also hides the properties and fires `ESCAPE` | `KeyHandler`, `Editor`, `EditorKeyHandlerCodec` |
| `EditorPopupMenu.ts` | yes | `EditorPopupMenu` | Replays an XML menu description into a `MaxPopupMenu` on every open, evaluating its conditions and functions | `MaxPopupMenu`, `doEval`, `EditorPopupMenuCodec` |
| `EditorToolbar.ts` | yes | `EditorToolbar` | Binds `MaxToolbar` items to actions, modes and prototype insertion | `MaxToolbar`, `Editor.addVertex`, `gestureUtils.makeDraggable`, `EditorToolbarCodec` |

### `src/gui/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `MaxForm.ts` | yes | `MaxForm` | Two-column HTML table form builder | `domUtils.write` |
| `MaxLog.ts` | yes | `MaxLog` | Static console window with a buffered textarea | `MaxWindow` |
| `MaxLogAsLogger.ts` | yes | `MaxLogAsLogger` | `Logger` delegating to `MaxLog` | `MaxLog`, `GlobalConfig.logger` |
| `MaxPopupMenu.ts` | yes | `MaxPopupMenu` | DOM popup menu with submenus, fires `SHOW` / `HIDE` | `EventSource`; base class of `PopupMenuHandler` |
| `MaxToolbar.ts` | yes | `MaxToolbar` | Toolbar of items, combos, switch modes and modes, fires `SELECT` | `MaxPopupMenu`, `InternalEvent` |
| `MaxWindow.ts` | yes | `MaxWindow` | Movable, resizable, closable floating window | `EventSource`, `styleUtils`, `Client.imageBasePath` |
| `guiUtils.ts` | yes (`guiUtils`) | `popup`, `error`, `GuiConfig` | Text popup and error dialog, GUI resource config | `MaxWindow`, `Client` |

### `src/i18n/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `Translations.ts` | yes | `Translations`, `TranslationsAsI18n` | Loads and parses `key=value` bundles, placeholder substitution | `requestUtils`, `TranslationsConfig`, `Client.basePath` |
| `config.ts` | yes | `TranslationsConfig`, `resetTranslationsConfig` | Language, supported languages, default language | `Translations` |
| `provider.ts` | yes | `NoOpI18n` | Default `I18nProvider`, does nothing | `GlobalConfig.i18n` |

### `src/util/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `Clipboard.ts` | yes | `Clipboard` | Static clipboard shared by the page: copy, cut, paste | `AbstractGraph` |
| `Constants.ts` | yes (`constants`) | `VERSION`, colors, sizes, page formats, masks, `NODE_TYPE`, `NONE` | Constants and the defaults behind the config objects | config objects, shapes, handlers |
| `EventUtils.ts` | yes (`eventUtils`) | `getClientX`, `isConsumed`, `isPopupTrigger`, modifier and pointer predicates | Normalises native events | everything above |
| `MaxXmlRequest.ts` | yes | `MaxXmlRequest` | `XMLHttpRequest` wrapper: sync or async, headers, binary, form simulation | `parseXml` |
| `ObjectIdentity.ts` | yes | `ObjectIdentity` | Lazy `Ctor#n` identity stored in `mxObjectId` | `cloneUtils` |
| `StringUtils.ts` | yes (`stringUtils`) | `trim`, `htmlEntities`, `toString`, `getFunctionName`, ... | String helpers | `domUtils` |
| `UrlConverter.ts` | yes | `UrlConverter` | Makes relative URLs absolute | `AbstractCanvas2D` |
| `arrayUtils.ts` | no | `remove`, `equalPoints`, `equalEntries`, `removeDuplicates` | Internal array helpers | `Point` |
| `cellArrayUtils.ts` | yes (`cellArrayUtils`) | `getOpposites`, `getTopmostCells`, `getParents`, `cloneCells` | Cell array helpers, model deep-clone keeping inner connections | `ObjectIdentity` |
| `cloneUtils.ts` | yes (`cloneUtils`) | `clone` | Generic deep or shallow clone skipping transient fields | `ObjectIdentity` |
| `config.ts` | yes | `GlobalConfig`, `StyleDefaultsConfig`, `reset*` | Global logger, i18n provider and style defaults | `log()`, `translate()`, shapes |
| `domHelpers.ts` | yes (`DomHelpers`) | `link`, `linkAction`, `linkInvoke`, `button` | Clickable spans and buttons bound to editor actions | `Editor` |
| `domUtils.ts` | yes (`domUtils`) | `write`, `br`, `isNode`, `getChildNodes`, `getTextContent`, ... | DOM building and query helpers | used package-wide |
| `gestureUtils.ts` | yes (`gestureUtils`) | `makeDraggable` | Builds a configured `DragSource` | `DragSource` |
| `logger.ts` | yes | `NoOpLogger`, `ConsoleLogger` | Logger implementations | `time-utils` |
| `mathUtils.ts` | yes (`mathUtils`) | `intersects`, `contains`, `getBoundingBox`, `getPortConstraints`, `ptSegDistSq`, `intersection`, ... | Geometry math | `Rectangle`, `Point`, `CellState` |
| `printUtils.ts` | yes (`printUtils`) | `getScaleForPageCount`, `show`, `printScreen` | Shows or prints a DOM snapshot of a graph | `styleUtils`, `Client` |
| `requestUtils.ts` | yes (`requestUtils`) | `load`, `get`, `getAll`, `post`, `submit` | Request helpers, `load` is synchronous | `MaxXmlRequest` |
| `styleUtils.ts` | yes (`styleUtils`) | `setCellStyles`, `setCellStyleFlags`, `setStyleFlag`, CSS helpers | Writes cell styles in a `batchUpdate`, plus DOM/CSS helpers | `GraphDataModel.setStyle` |
| `treeTraversal.ts` | yes (`treeTraversalUtils`) | `findTreeRoots`, `traverse` | Tree root detection and depth-first walk, used by layouts | `AbstractGraph` |
| `xmlUtils.ts` | yes (`xmlUtils`) | `createXmlDocument`, `parseXml`, `getXml`, `getPrettyXml`, `findNode` | XML parse, serialize, pretty-print, search | `DOMParser`, `XMLSerializer` |
| `xmlViewUtils.ts` | yes (`xmlViewUtils`) | `getViewXml` | Builds temporary view states and encodes the `GraphView` | `Codec`, `GraphViewCodec`, `TemporaryCellStates` |

### `src/internal/`

| File | Public | Main exports | Responsibility | Works with |
|---|---|---|---|---|
| `BaseRegistry.ts` | no | `BaseRegistry<V>` | Generic store behind every registry (`add`, `get`, `getName`, `clear`) | `Registry<V>` in `types.ts` |
| `clone-utils.ts` | no | `shallowCopy` | Shallow copy that also copies arrays | n/a |
| `i18n-utils.ts` | no | `isI18nEnabled`, `translate` | Wrappers around `GlobalConfig.i18n` | `GlobalConfig` |
| `time-utils.ts` | no | `getElapseMillisecondsMessage` | Formats elapsed milliseconds | n/a |
| `types.ts` | no | `UserObject` | Shape of a user object that may be an XML node | n/a |
| `utils.ts` | no | `mixInto`, `isNullish`, `log`, `doEval`, `isElement`, `matchBinaryMask` | Internal helpers, including the mixin installer | `GlobalConfig` |
