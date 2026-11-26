import {
  CellOverlay,
  CompactTreeLayout,
  EdgeStyle,
  getDefaultPlugins,
  Graph,
  ImageBox,
  InternalEvent,
  LayoutManager,
  Point,
  treeTraversalUtils,
  type Cell,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';

const icon = (color: string, path: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7.5" fill="${color}"/><path d="${path}" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>`
  )}`;
const addImage = new ImageBox(icon('#16a34a', 'M8 4v8M4 8h8'), 16, 16);
const deleteImage = new ImageBox(icon('#dc2626', 'M5 5l6 6M11 5l-6 6'), 16, 16);

export const orgChart: Demo = {
  id: 'org-chart',
  title: 'Org chart',
  group: 'Layout',
  description:
    'A tree kept in shape by a LayoutManager: every change to the hierarchy runs a compact tree layout again, and each subtree folds under its manager.',
  hints: [
    'Click the green icon of a box to add a report to it, the red one to delete a subtree',
    'Click the folding icon in the top left corner of a manager to hide or show the subtree',
    'Double-click a box to rename it: the tree makes room for the new size',
  ],
  mount(ctx) {
    const graph = ctx.useGraph(new Graph(ctx.container, undefined, getDefaultPlugins()));
    const model = graph.getDataModel();
    const parent = graph.getDefaultParent();
    graph.setCellsMovable(false); // the layout places the cells
    graph.setAutoSizeCells(true);
    graph.isCellSelectable = (cell) => cell.isVertex();

    Object.assign(graph.getStylesheet().getDefaultVertexStyle(), {
      rounded: true,
      fillColor: '#e0e7ff',
      strokeColor: '#4f46e5',
      fontColor: '#1e1b4b',
      fontStyle: 1,
      spacingLeft: 12,
    });
    Object.assign(graph.getStylesheet().getDefaultEdgeStyle(), {
      edgeStyle: EdgeStyle.TopToBottom,
      rounded: true,
      strokeColor: '#6366f1',
      strokeWidth: 2,
      endArrow: 'none',
      editable: false,
    });

    const layout = new CompactTreeLayout(graph, false);
    layout.useBoundingBox = false;
    layout.edgeRouting = false;
    layout.levelDistance = 40;
    layout.nodeDistance = 16;
    layout.isVertexMovable = () => true; // the cells are not movable by the user, but by the layout
    const layoutManager = ctx.dispose(new LayoutManager(graph));
    layoutManager.getLayout = (cell) => (cell === parent ? layout : null);

    // Folding hides the subtree instead of resizing the cell, as in the Tree story
    graph.isCellFoldable = (cell) => graph.getOutgoingEdges(cell, null).length > 0;
    graph.foldCells = (collapse, _recurse, cells) => {
      const cell = cells?.[0];
      if (!cell) return null;
      const subtree: Cell[] = [];
      treeTraversalUtils.traverse(cell, true, (vertex: Cell) => {
        if (vertex !== cell) subtree.push(vertex);
        return vertex === cell || !vertex.isCollapsed(); // a collapsed subtree stays hidden
      });
      graph.batchUpdate(() => {
        graph.toggleCells(!collapse, subtree, true);
        model.setCollapsed(cell, collapse);
      });
      ctx.log(`${collapse ? 'Collapsed' : 'Expanded'} ${cell.getValue()}`);
      return cells;
    };

    const addOverlays = (cell: Cell, deletable: boolean) => {
      const add = new CellOverlay(addImage, 'Add a report', 'center', 'bottom');
      add.cursor = 'pointer';
      add.addListener(InternalEvent.CLICK, () => addChild(cell));
      graph.addCellOverlay(cell, add);
      if (!deletable) return;
      const remove = new CellOverlay(
        deleteImage,
        'Delete',
        'right',
        'top',
        new Point(-4, 4)
      );
      remove.cursor = 'pointer';
      remove.addListener(InternalEvent.CLICK, () => deleteSubtree(cell));
      graph.addCellOverlay(cell, remove);
    };
    const insert = (value: string, manager?: Cell) => {
      const vertex = graph.insertVertex({ value, size: [110, 40] });
      if (manager) graph.insertEdge({ source: manager, target: vertex });
      addOverlays(vertex, !!manager);
      return vertex;
    };
    const addChild = (manager: Cell) => {
      if (manager.isCollapsed()) graph.foldCells(false, false, [manager]);
      let vertex!: Cell;
      graph.batchUpdate(() => (vertex = insert('New report', manager)));
      graph.setSelectionCell(vertex);
      ctx.log(`Added a report to ${manager.getValue()}`);
    };
    const deleteSubtree = (cell: Cell) => {
      const cells: Cell[] = [];
      treeTraversalUtils.traverse(cell, true, (vertex: Cell) => {
        cells.push(vertex);
        return true;
      });
      graph.removeCells(cells);
      ctx.log(`Deleted ${cells.length} cell(s)`);
    };

    let root!: Cell;
    graph.batchUpdate(() => {
      root = insert('CEO');
      graph.getDataModel().setGeometry(
        root,
        Object.assign(root.getGeometry()!.clone(), {
          x: (ctx.container.offsetWidth - 110) / 2,
          y: 20,
        })
      );
      const cto = insert('CTO', root);
      insert('CFO', root);
      const coo = insert('COO', root);
      const dev = insert('Dev lead', cto);
      insert('QA lead', cto);
      insert('Frontend', dev);
      insert('Backend', dev);
      insert('Sales', coo);
      insert('Support', coo);
    });

    ctx.button(
      'Add to selection',
      () => addChild(graph.getSelectionCell() ?? root),
      'add-child'
    );
    ctx.button(
      'Delete selection',
      () => {
        const cell = graph.getSelectionCell();
        if (cell && cell !== root) deleteSubtree(cell);
      },
      'delete-subtree'
    );
  },
};
