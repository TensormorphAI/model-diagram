import {
  Cell,
  getDefaultPlugins,
  Graph,
  InternalEvent,
  LayoutManager,
  RubberBandHandler,
  StackLayout,
  SwimlaneManager,
  type CellStyle,
  type EventObject,
  type SelectionHandler,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';

export const swimlanes: Demo = {
  id: 'swimlanes',
  title: 'Pools, lanes and layers',
  group: 'Structure',
  description:
    'A process in pools and lanes: a SwimlaneManager and a stack layout keep the lanes sized, steps move between lanes, and the notes live in a layer of their own that can be hidden.',
  hints: [
    'Drag a step into another lane, or select it and click Move to next lane',
    'Resize a lane: its siblings and its pool follow',
    'Collapse a pool or a lane with its folding icon',
    'Toggle the notes layer, or hide the dashed crossover edges',
  ],
  mount(ctx) {
    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    const model = graph.getDataModel();
    graph.view.setTranslate(10, 10);
    graph.setConnectable(true);
    graph.setAllowDanglingEdges(false);
    graph.setDropEnabled(true);
    graph.setSplitEnabled(false);
    graph
      .getPlugin<SelectionHandler>('SelectionHandler')!
      .setRemoveCellsFromParent(false);

    const stylesheet = graph.getStylesheet();
    Object.assign(stylesheet.getDefaultVertexStyle(), {
      shape: 'swimlane',
      verticalAlign: 'middle',
      labelBackgroundColor: 'white',
      fontSize: 11,
      startSize: 22,
      horizontal: false,
      fontColor: 'black',
      strokeColor: 'black',
      fillColor: 'none',
    } satisfies CellStyle);
    const process: CellStyle = {
      shape: 'rectangle',
      rounded: true,
      horizontal: true,
      fontSize: 10,
      labelBackgroundColor: 'none',
      fillColor: '#ffffff',
    };
    stylesheet.putCellStyle('process', process);
    stylesheet.putCellStyle('state', {
      ...process,
      rounded: false,
      shape: 'ellipse',
      perimeter: 'ellipsePerimeter',
    });
    stylesheet.putCellStyle('condition', {
      ...process,
      rounded: false,
      shape: 'rhombus',
      perimeter: 'rhombusPerimeter',
    });
    stylesheet.putCellStyle('end', {
      ...process,
      rounded: false,
      shape: 'doubleEllipse',
      perimeter: 'ellipsePerimeter',
      fontStyle: 1,
    });
    stylesheet.putCellStyle('note', {
      ...process,
      rounded: false,
      fillColor: '#fef9c3',
      strokeColor: '#ca8a04',
      align: 'left',
      spacingLeft: 8,
    });
    Object.assign(stylesheet.getDefaultEdgeStyle(), {
      edgeStyle: 'elbowEdgeStyle',
      endArrow: 'block',
      rounded: true,
      strokeColor: 'black',
      fontColor: 'black',
    } satisfies CellStyle);
    stylesheet.putCellStyle('crossover', {
      dashed: true,
      endArrow: 'open',
      startArrow: 'oval',
    });

    // Pools are the children of the first layer, lanes the children of a pool
    const isPool = (cell: Cell | null) =>
      !!cell && cell.getParent() === graph.getDefaultParent();
    graph.isValidDropTarget = (target, cells = []) => {
      const lane = cells.some((cell) => isPool(cell.getParent()));
      const pool = cells.some((cell) => isPool(cell));
      const step = cells.some((cell) => !isPool(cell) && !isPool(cell.getParent()));
      // lanes go into pools, steps go into lanes
      return (
        !pool &&
        step !== lane &&
        ((lane && isPool(target)) || (step && isPool(target.getParent())))
      );
    };

    // A collapsed pool or lane keeps its width and shows its title horizontally
    graph.addListener(
      InternalEvent.FOLD_CELLS,
      (_sender: EventTarget, evt: EventObject) => {
        for (const cell of evt.getProperty('cells') as Cell[]) {
          const geo = cell.getGeometry();
          if (geo?.alternateBounds) geo.width = geo.alternateBounds.width;
        }
      }
    );
    const getStyle = function (this: Cell): CellStyle {
      return this.isCollapsed()
        ? { ...this.style, horizontal: true, align: 'left', spacingLeft: 14 }
        : this.style;
    };

    ctx.dispose(new SwimlaneManager(graph));
    const layout = new StackLayout(graph, false);
    layout.resizeParent = true;
    layout.isVertexIgnored = (vertex) => !graph.isSwimlane(vertex);
    const layoutManager = ctx.dispose(new LayoutManager(graph));
    layoutManager.getLayout = (cell) => {
      if (!cell || cell.isEdge() || cell.getChildCount() === 0) return null;
      if (cell !== graph.getDefaultParent() && !isPool(cell)) return null;
      layout.fill = isPool(cell); // lanes take the width of their pool
      return layout;
    };

    const lanes: Cell[] = [];
    const crossovers: Cell[] = [];
    const container = (parent: Cell, value: string, height: number) => {
      const cell = graph.insertVertex({
        parent,
        value,
        position: [0, 0],
        size: [620, height],
      });
      cell.setConnectable(false);
      cell.getStyle = getStyle;
      return cell;
    };
    const step = (
      lane: Cell,
      value: string,
      x: number,
      y: number,
      kind = 'process',
      size = 50
    ) =>
      graph.insertVertex({
        parent: lane,
        value,
        position: [x, y],
        size: [kind === 'process' ? 80 : size, size],
        style: { baseStyleNames: [kind] },
      });
    const edge = (source: Cell, target: Cell, crossover = false, value = '') => {
      const e = graph.insertEdge({
        value,
        source,
        target,
        style: crossover ? { baseStyleNames: ['crossover'] } : {},
      });
      if (crossover) crossovers.push(e);
    };

    const notes = model.add(model.getRoot(), new Cell())!;
    graph.batchUpdate(() => {
      const pool1 = container(graph.getDefaultParent(), 'Pool 1', 0);
      const lane1a = container(pool1, 'Lane A', 110);
      const lane1b = container(pool1, 'Lane B', 110);
      const pool2 = container(graph.getDefaultParent(), 'Pool 2', 0);
      const lane2a = container(pool2, 'Lane A', 140);
      const lane2b = container(pool2, 'Lane B', 110);
      lanes.push(lane1a, lane1b, lane2a, lane2b);

      const start1 = step(lane1a, '', 40, 40, 'state', 30);
      const contact = step(lane1a, 'Contact\nProvider', 90, 30);
      const complete = step(lane1a, 'Complete\nRequest', 190, 30);
      const acknowledge = step(lane1a, 'Receive and\nAcknowledge', 385, 30);
      const end1 = step(lane1a, 'A', 540, 40, 'end', 30);
      const request = step(lane1b, 'Request\nInformation', 190, 30);
      const receive = step(lane1b, 'Receive\nInformation', 290, 30);
      const check = step(lane2a, 'Check\nRequest', 190, 45);
      const constraints = step(lane2a, 'OK?', 330, 40, 'condition', 60);
      const end2 = step(lane2a, 'B', 540, 55, 'end', 30);
      const start2 = step(lane2b, '', 40, 40, 'state', 30);
      const refer = step(lane2b, 'Refer to\nCoordinator', 90, 30);

      edge(start1, contact);
      edge(contact, complete);
      edge(complete, acknowledge);
      edge(acknowledge, end1);
      edge(request, receive);
      edge(start2, refer);
      edge(refer, request);
      edge(receive, check);
      edge(check, constraints);
      edge(constraints, end2, false, 'No');
      edge(constraints, acknowledge, false, 'Yes');
      edge(contact, refer, true);
      edge(request, complete, true);

      graph.insertVertex({
        parent: notes,
        value: 'Notes layer:\nthe cells of a\nsecond layer',
        position: [640, 10],
        size: [150, 70],
        style: { baseStyleNames: ['note'] },
      });
      graph.insertVertex({
        parent: notes,
        value: 'Hide it with\nToggle notes layer',
        position: [640, 250],
        size: [150, 60],
        style: { baseStyleNames: ['note'] },
      });
    });

    ctx.button(
      'Move to next lane',
      () => {
        const cells = graph
          .getSelectionCells()
          .filter((cell) => lanes.includes(cell.getParent()!));
        if (cells.length === 0) return ctx.log('Select a step inside a lane first');
        graph.batchUpdate(() => {
          for (const cell of cells) {
            const next = lanes[(lanes.indexOf(cell.getParent()!) + 1) % lanes.length];
            const geometry = cell.getGeometry()!.clone();
            graph.moveCells([cell], 0, 0, false, next);
            model.setGeometry(cell, geometry); // same place, relative to the new lane
            ctx.log(
              `Moved "${String(cell.getValue()).replace('\n', ' ')}" to ${next.getParent()!.getValue()}, ${next.getValue()}`
            );
          }
        });
      },
      'move-to-next-lane'
    );
    ctx.button(
      'Toggle notes layer',
      () => {
        model.setVisible(notes, !notes.isVisible());
        ctx.log(`Notes layer ${notes.isVisible() ? 'shown' : 'hidden'}`);
      },
      'toggle-layer'
    );
    ctx.button(
      'Toggle crossovers',
      () => {
        graph.toggleCells(!crossovers[0].isVisible(), crossovers, true);
        ctx.log(`Crossover edges ${crossovers[0].isVisible() ? 'shown' : 'hidden'}`);
      },
      'toggle-crossovers'
    );
  },
};
