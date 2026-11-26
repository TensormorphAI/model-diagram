import {
  Clipboard,
  type EventObject,
  getDefaultPlugins,
  Graph,
  InternalEvent,
  KeyHandler,
  RubberBandHandler,
  UndoManager,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';

export const editing: Demo = {
  id: 'editing',
  title: 'Undo, clipboard',
  group: 'Editing',
  description:
    'An UndoManager records every change of the model and the view, the Clipboard copies, cuts and pastes cells inside the graph.',
  hints: [
    'Select cells, then use the toolbar or click into the diagram and press Ctrl+C, Ctrl+X, Ctrl+V (Cmd on macOS)',
    'Each paste shifts the cells a bit more, so that the copies do not overlap',
    'Delete or move something, then undo it with Ctrl+Z and redo it with Ctrl+Y or Ctrl+Shift+Z',
  ],
  mount(ctx) {
    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    graph.setConnectable(true);

    graph.batchUpdate(() => {
      const start = graph.insertVertex({
        value: 'Start',
        position: [40, 40],
        size: [100, 40],
        style: { rounded: true, fillColor: '#dcfce7', strokeColor: '#16a34a' },
      });
      const task = graph.insertVertex({
        value: 'Task',
        position: [240, 40],
        size: [100, 40],
      });
      const end = graph.insertVertex({
        value: 'End',
        position: [240, 180],
        size: [100, 40],
        style: { rounded: true, fillColor: '#fee2e2', strokeColor: '#dc2626' },
      });
      graph.insertEdge({ source: start, target: task });
      graph.insertEdge({ value: 'done', source: task, target: end });
    });

    // Wired after the initial cells, so that undo never erases the starting diagram
    const undoManager = new UndoManager();
    const onUndoableEdit = (_sender: unknown, evt: EventObject) =>
      undoManager.undoableEditHappened(evt.getProperty('edit'));
    const model = graph.getDataModel();
    const view = graph.getView();
    model.addListener(InternalEvent.UNDO, onUndoableEdit);
    view.addListener(InternalEvent.UNDO, onUndoableEdit);
    ctx.dispose(() => {
      model.removeListener(onUndoableEdit);
      view.removeListener(onUndoableEdit);
    });

    const undo = () => {
      if (!undoManager.canUndo()) return ctx.log('Nothing to undo');
      undoManager.undo();
      ctx.log('Undo');
    };
    const redo = () => {
      if (!undoManager.canRedo()) return ctx.log('Nothing to redo');
      undoManager.redo();
      ctx.log('Redo');
    };
    const copy = () => {
      const count = Clipboard.copy(graph).length;
      ctx.log(`Copied ${count} cell(s)`);
    };
    const cut = () => {
      const count = Clipboard.cut(graph, graph.getSelectionCells()).length;
      ctx.log(`Cut ${count} cell(s)`);
    };
    const paste = () => {
      const cells = Clipboard.paste(graph);
      ctx.log(cells ? `Pasted ${cells.length} cell(s)` : 'The clipboard is empty');
    };
    const duplicate = () => {
      const size = graph.getGridSize();
      const cells = graph.moveCells(graph.getSelectionCells(), size, size, true);
      graph.setSelectionCells(cells);
      ctx.log(`Duplicated ${cells.length} cell(s)`);
    };
    const remove = () => ctx.log(`Deleted ${graph.removeCells().length} cell(s)`);

    // The Clipboard is a static singleton: forget the cells of this graph when leaving the demo
    ctx.dispose(() => Clipboard.setCells([]));

    const keyHandler = ctx.dispose(new KeyHandler(graph));
    // Cmd acts as Ctrl on macOS
    keyHandler.isControlDown = (evt) => evt.ctrlKey || evt.metaKey;
    keyHandler.bindControlKey(90, undo); // Ctrl+Z
    keyHandler.bindControlShiftKey(90, redo); // Ctrl+Shift+Z
    keyHandler.bindControlKey(89, redo); // Ctrl+Y
    keyHandler.bindControlKey(67, copy); // Ctrl+C
    keyHandler.bindControlKey(88, cut); // Ctrl+X
    keyHandler.bindControlKey(86, paste); // Ctrl+V
    keyHandler.bindControlKey(65, () => graph.selectAll()); // Ctrl+A
    keyHandler.bindKey(46, remove); // Delete
    keyHandler.bindKey(8, remove); // Backspace

    ctx.button('Undo', undo, 'undo');
    ctx.button('Redo', redo, 'redo');
    ctx.button('Copy', copy, 'copy');
    ctx.button('Cut', cut, 'cut');
    ctx.button('Paste', paste, 'paste');
    ctx.button('Duplicate', duplicate, 'duplicate');
    ctx.button('Delete', remove, 'delete');
    ctx.button('Select all', () => graph.selectAll(), 'select-all');
  },
};
