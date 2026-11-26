import {
  getDefaultPlugins,
  Graph,
  InternalEvent,
  KeyHandler,
  RubberBandHandler,
  type SelectionHandler,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';

export const basics: Demo = {
  id: 'basics',
  title: 'Basics',
  group: 'Getting started',
  description:
    'Vertices and edges, selection with a rubber band, moving with alignment guides, resizing, in-place label editing and keyboard shortcuts.',
  hints: [
    'Drag on the background to select with the rubber band, drag a vertex to move it along the guides',
    'Drag the handles to resize, double-click a cell to edit its label',
    'Hover a vertex and drag from its center to connect it to another one',
    'Click into the diagram, then use the arrow keys to nudge the selection and Delete to remove it',
  ],
  mount(ctx) {
    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    graph.setConnectable(true);
    graph.setPanning(true);
    const selectionHandler = graph.getPlugin<SelectionHandler>('SelectionHandler');
    if (selectionHandler) selectionHandler.guidesEnabled = true;

    graph.batchUpdate(() => {
      const hello = graph.insertVertex({
        value: 'Hello,',
        position: [40, 60],
        size: [100, 50],
      });
      const world = graph.insertVertex({
        value: 'World!',
        position: [280, 180],
        size: [100, 50],
        style: { fillColor: '#dbeafe', strokeColor: '#2563eb', rounded: true },
      });
      const ellipse = graph.insertVertex({
        value: 'Ellipse',
        position: [80, 260],
        size: [100, 60],
        style: { shape: 'ellipse', perimeter: 'ellipsePerimeter', fillColor: '#fef3c7' },
      });
      graph.insertEdge({ value: 'edge', source: hello, target: world });
      graph.insertEdge({ source: ellipse, target: world, style: { dashed: true } });
    });

    const nudge = (dx: number, dy: number) => () => {
      if (!graph.isSelectionEmpty()) graph.moveCells(graph.getSelectionCells(), dx, dy);
    };
    // The KeyHandler listens on the document: released by ctx.dispose when leaving the demo
    const keyHandler = ctx.dispose(new KeyHandler(graph));
    keyHandler.bindKey(37, nudge(-10, 0));
    keyHandler.bindKey(38, nudge(0, -10));
    keyHandler.bindKey(39, nudge(10, 0));
    keyHandler.bindKey(40, nudge(0, 10));
    keyHandler.bindKey(46, () => graph.removeCells()); // Delete
    keyHandler.bindKey(8, () => graph.removeCells()); // Backspace, the Delete key of macOS laptops
    keyHandler.bindControlKey(65, () => graph.selectAll()); // Ctrl+A

    ctx.button(
      'Add vertex',
      () => {
        const count = graph.getDefaultParent().getChildCount();
        graph.setSelectionCell(
          graph.insertVertex({
            value: `Vertex ${count + 1}`,
            position: [20 + (count % 8) * 30, 20 + (count % 8) * 20],
            size: [100, 40],
          })
        );
      },
      'add-vertex'
    );
    ctx.button('Select all', () => graph.selectAll(), 'select-all');
    ctx.button('Delete selection', () => graph.removeCells(), 'delete');

    graph
      .getSelectionModel()
      .addListener(InternalEvent.CHANGE, () =>
        ctx.log(`Selection: ${graph.getSelectionCount()} cell(s)`)
      );
    graph.addListener(InternalEvent.CELLS_MOVED, () => ctx.log('Cells moved'));
    graph.addListener(InternalEvent.CELLS_RESIZED, () => ctx.log('Cells resized'));
    graph.addListener(InternalEvent.LABEL_CHANGED, () => ctx.log('Label changed'));
    graph.addListener(InternalEvent.CELL_CONNECTED, () => ctx.log('Edge connected'));
  },
};
