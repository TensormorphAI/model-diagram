import {
  getDefaultPlugins,
  Graph,
  RubberBandHandler,
  type Cell,
  type CellStyle,
  type SelectionHandler,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';

const groupStyle: CellStyle = {
  fillColor: '#f8fafc',
  strokeColor: '#64748b',
  dashed: true,
  rounded: true,
  arcSize: 6,
  verticalAlign: 'top',
  align: 'left',
  spacingLeft: 18,
  fontColor: '#334155',
};

export const groups: Demo = {
  id: 'groups',
  title: 'Groups and folding',
  group: 'Structure',
  description:
    'Cells nested in groups: grouping and ungrouping the selection, collapsing a container with its folding icon, drilling down into a group, and a constituent part that selects its whole.',
  hints: [
    'Select 1 and 2 with the rubber band, then click Group; select the new group and click Ungroup',
    'Click the folding icon in the top left corner of a group to collapse or expand it',
    'Select Inner group and click Enter group to show only its content, then Exit group or Home',
    'Click the part inside the card: the card is selected and dragged instead of the part',
  ],
  mount(ctx) {
    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    // The groups keep the size given here, even when a child is moved out of them
    graph.extendParents = false;
    graph.extendParentsOnAdd = false;

    // A constituent is part of its parent: selecting or dragging it acts on the parent, as in the Constituent story
    const parts = new WeakSet<Cell>();
    const toWhole = (cell: Cell | null): Cell | null =>
      cell && parts.has(cell) ? cell.getParent() : cell;
    const selectionHandler = graph.getPlugin<SelectionHandler>('SelectionHandler')!;
    const getInitialCellForEvent =
      selectionHandler.getInitialCellForEvent.bind(selectionHandler);
    selectionHandler.getInitialCellForEvent = (me) => toWhole(getInitialCellForEvent(me));
    const selectCellForEvent = graph.selectCellForEvent.bind(graph);
    graph.selectCellForEvent = (cell, evt) =>
      selectCellForEvent(toWhole(cell) ?? cell, evt);

    graph.batchUpdate(() => {
      const outer = graph.insertVertex({
        value: 'Outer group',
        position: [20, 20],
        size: [360, 270],
        style: groupStyle,
      });
      const inner = graph.insertVertex({
        parent: outer,
        value: 'Inner group',
        position: [20, 40],
        size: [200, 110],
        style: { ...groupStyle, fillColor: '#eef2ff', strokeColor: '#6366f1' },
      });
      const a = graph.insertVertex({
        parent: inner,
        value: 'A',
        position: [20, 45],
        size: [70, 40],
      });
      const b = graph.insertVertex({
        parent: inner,
        value: 'B',
        position: [110, 45],
        size: [70, 40],
      });
      const c = graph.insertVertex({
        parent: outer,
        value: 'C',
        position: [255, 75],
        size: [80, 40],
      });
      const d = graph.insertVertex({
        parent: outer,
        value: 'D',
        position: [130, 200],
        size: [80, 40],
      });
      graph.insertEdge({ source: a, target: b });
      graph.insertEdge({ source: b, target: c });
      graph.insertEdge({ source: c, target: d });

      const one = graph.insertVertex({ value: '1', position: [460, 40], size: [80, 40] });
      const two = graph.insertVertex({ value: '2', position: [600, 40], size: [80, 40] });
      const three = graph.insertVertex({
        value: '3',
        position: [530, 150],
        size: [80, 40],
      });
      graph.insertEdge({ source: one, target: three });
      graph.insertEdge({ source: two, target: three });

      const card = graph.insertVertex({
        value: 'Card',
        position: [460, 260],
        size: [180, 100],
        style: {
          verticalAlign: 'top',
          foldable: false,
          fillColor: '#fef3c7',
          strokeColor: '#d97706',
        },
      });
      parts.add(
        graph.insertVertex({
          parent: card,
          value: 'Part of the card',
          position: [20, 45],
          size: [140, 36],
          style: { fillColor: '#ffffff', strokeColor: '#d97706' },
        })
      );
    });

    ctx.button(
      'Group',
      () => {
        // Only the cells sharing the parent of the first selected one are grouped
        const cells = graph.getCellsForGroup(graph.getSelectionCells());
        if (cells.length < 2)
          return ctx.log('Select at least 2 cells with the same parent');
        graph.batchUpdate(() => {
          const group = graph.groupCells(null, 20);
          graph.getDataModel().setValue(group, 'Group');
          graph.getDataModel().setStyle(group, groupStyle);
          graph.setSelectionCell(group);
        });
        ctx.log(`Grouped ${cells.length} cells`);
      },
      'group'
    );
    ctx.button(
      'Ungroup',
      () => {
        const children = graph.ungroupCells();
        graph.setSelectionCells(children);
        ctx.log(`Ungrouped ${children.length} cells`);
      },
      'ungroup'
    );

    const fold = (collapse: boolean) => () => {
      const cells = graph.isSelectionEmpty()
        ? graph
            .getDefaultParent()
            .children.filter((cell) => graph.isCellFoldable(cell, collapse))
        : graph.getSelectionCells();
      const folded = graph.foldCells(collapse, false, cells, true) ?? [];
      ctx.log(`${collapse ? 'Collapsed' : 'Expanded'} ${folded.length} cell(s)`);
    };
    ctx.button('Collapse', fold(true), 'collapse');
    ctx.button('Expand', fold(false), 'expand');

    const logRoot = () =>
      ctx.log(`Showing: ${graph.getCurrentRoot()?.getValue() ?? 'the whole diagram'}`);
    ctx.button(
      'Enter group',
      () => {
        const cell = graph.getSelectionCell();
        if (!cell || cell.getChildCount() === 0) return ctx.log('Select a group first');
        graph.enterGroup(cell);
        logRoot();
      },
      'enter-group'
    );
    ctx.button(
      'Exit group',
      () => {
        graph.exitGroup();
        logRoot();
      },
      'exit-group'
    );
    ctx.button(
      'Home',
      () => {
        graph.home();
        logRoot();
      },
      'home'
    );
  },
};
