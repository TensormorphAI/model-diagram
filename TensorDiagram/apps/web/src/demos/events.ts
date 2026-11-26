import {
  type Cell,
  type EventObject,
  type EventSource,
  getDefaultPlugins,
  Graph,
  InternalEvent,
  type InternalMouseEvent,
  RubberBandHandler,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';

export const events: Demo = {
  id: 'events',
  title: 'Events',
  group: 'Data',
  description:
    'The main events of the graph, its view, its model and its selection, logged with their properties and counted per type. Mouse moves are counted on each event but logged at most twice a second.',
  hints: [
    'Click, double-click, move, resize, connect and edit cells, and watch the log and the counters',
    'Collapse the group with its folding icon, zoom with the toolbar',
  ],
  mount(ctx) {
    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    graph.setConnectable(true);

    // Created before the listeners, so that the log starts empty
    graph.batchUpdate(() => {
      const a = graph.insertVertex({
        value: 'Click me',
        position: [40, 40],
        size: [110, 40],
      });
      const b = graph.insertVertex({
        value: 'Double-click me',
        position: [300, 40],
        size: [130, 40],
      });
      graph.insertEdge({ value: 'edge', source: a, target: b });
      const group = graph.insertVertex({
        value: 'Group',
        position: [40, 180],
        size: [280, 160],
        style: { verticalAlign: 'top', fillColor: '#f1f5f9' },
      });
      const child1 = graph.insertVertex({
        parent: group,
        value: 'Child 1',
        position: [20, 40],
        size: [90, 40],
      });
      const child2 = graph.insertVertex({
        parent: group,
        value: 'Child 2',
        position: [170, 100],
        size: [90, 40],
      });
      graph.insertEdge({ parent: group, source: child1, target: child2 });
    });

    const name = (cell: Cell | null | undefined) =>
      cell ? `"${graph.convertValueToString(cell) || cell.getId()}"` : 'none';
    const names = (cells: Cell[] | null | undefined) =>
      `[${(cells ?? []).map(name).join(', ')}]`;

    // Counters in the side panel, one row per event type, created on first use
    const table = document.createElement('table');
    table.className = 'event-counters';
    table.style.borderCollapse = 'collapse';
    ctx.side.append(table);
    const counts = new Map<string, HTMLElement>();
    const count = (type: string) => {
      let cell = counts.get(type);
      if (!cell) {
        const row = table.insertRow();
        row.insertCell().textContent = type;
        cell = row.insertCell();
        cell.dataset.event = type;
        cell.style.textAlign = 'right';
        cell.style.paddingLeft = '12px';
        counts.set(type, cell);
      }
      cell.textContent = String(Number(cell.textContent) + 1);
    };
    const on = (
      source: EventSource,
      type: string,
      format: (evt: EventObject) => string,
      label = type
    ) =>
      source.addListener(type, (_sender: unknown, evt: EventObject) => {
        count(label);
        ctx.log(`${label}: ${format(evt)}`);
      });
    const prop = (evt: EventObject, key: string) => evt.getProperty(key);

    on(graph, InternalEvent.CLICK, (evt) => `cell=${name(prop(evt, 'cell'))}`);
    on(graph, InternalEvent.DOUBLE_CLICK, (evt) => `cell=${name(prop(evt, 'cell'))}`);
    on(
      graph,
      InternalEvent.CELLS_ADDED,
      (evt) => `cells=${names(prop(evt, 'cells'))} parent=${name(prop(evt, 'parent'))}`
    );
    on(graph, InternalEvent.CELLS_REMOVED, (evt) => `cells=${names(prop(evt, 'cells'))}`);
    on(
      graph,
      InternalEvent.CELLS_MOVED,
      (evt) =>
        `cells=${names(prop(evt, 'cells'))} dx=${prop(evt, 'dx')} dy=${prop(evt, 'dy')}`
    );
    on(
      graph,
      InternalEvent.CELLS_RESIZED,
      (evt) =>
        `cells=${names(prop(evt, 'cells'))} bounds=${(prop(evt, 'bounds') ?? []).map((b: { width: number; height: number }) => `${b.width}x${b.height}`).join(', ')}`
    );
    on(
      graph,
      InternalEvent.LABEL_CHANGED,
      (evt) =>
        `cell=${name(prop(evt, 'cell'))} old="${prop(evt, 'old')}" value="${prop(evt, 'value')}"`
    );
    on(
      graph,
      InternalEvent.CELL_CONNECTED,
      (evt) =>
        `edge=${name(prop(evt, 'edge'))} ${prop(evt, 'source') ? 'source' : 'target'}=${name(prop(evt, 'terminal'))}`
    );
    on(
      graph,
      InternalEvent.CELLS_FOLDED,
      (evt) => `cells=${names(prop(evt, 'cells'))} collapse=${prop(evt, 'collapse')}`
    );
    on(
      graph.getView(),
      InternalEvent.SCALE,
      (evt) => `scale=${prop(evt, 'scale')} previous=${prop(evt, 'previousScale')}`
    );
    on(
      graph.getView(),
      InternalEvent.SCALE_AND_TRANSLATE,
      (evt) => `scale=${prop(evt, 'scale')} previous=${prop(evt, 'previousScale')}`
    );
    // SelectionChange swaps its arrays before firing: 'removed' holds the newly selected cells, 'added' the deselected ones
    on(
      graph.getSelectionModel(),
      InternalEvent.CHANGE,
      (evt) =>
        `selected=${names(prop(evt, 'removed'))} deselected=${names(prop(evt, 'added'))} total=${graph.getSelectionCount()}`,
      'selectionChange'
    );
    on(
      graph.getDataModel(),
      InternalEvent.CHANGE,
      (evt) => `${(prop(evt, 'changes') ?? []).length} change(s)`,
      'modelChange'
    );

    // Mouse listener: every event is counted, mouse moves are logged at most every 500 ms
    let lastMoveLog = 0;
    const position = (me: InternalMouseEvent) =>
      `x=${Math.round(me.getGraphX())} y=${Math.round(me.getGraphY())} cell=${name(me.getCell())}`;
    graph.addMouseListener({
      mouseDown: (_sender: unknown, me: InternalMouseEvent) => {
        count('mouseDown');
        ctx.log(`mouseDown: ${position(me)}`);
      },
      mouseMove: (_sender: unknown, me: InternalMouseEvent) => {
        count('mouseMove');
        const now = performance.now();
        if (now - lastMoveLog < 500) return;
        lastMoveLog = now;
        ctx.log(`mouseMove (throttled): ${position(me)}`);
      },
      mouseUp: (_sender: unknown, me: InternalMouseEvent) => {
        count('mouseUp');
        ctx.log(`mouseUp: ${position(me)}`);
      },
    });

    ctx.button('Zoom in', () => graph.zoomIn(), 'zoom-in');
    ctx.button('Zoom out', () => graph.zoomOut(), 'zoom-out');
    ctx.button('Actual size', () => graph.zoomActual(), 'zoom-actual');
    ctx.button(
      'Add vertex',
      () => {
        const n = graph.getDefaultParent().getChildCount();
        graph.insertVertex({
          value: `Vertex ${n + 1}`,
          position: [480, 40 + (n % 6) * 60],
          size: [100, 40],
        });
      },
      'add-vertex'
    );
    ctx.button(
      'Reset counters',
      () => {
        counts.clear();
        table.replaceChildren();
      },
      'reset-counters'
    );
  },
};
