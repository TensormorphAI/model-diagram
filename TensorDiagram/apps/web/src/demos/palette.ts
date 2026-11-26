import {
  Cell,
  type CellStyle,
  Geometry,
  getDefaultPlugins,
  gestureUtils,
  Graph,
  RubberBandHandler,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';

interface PaletteItem {
  name: string;
  size: [number, number];
  style: CellStyle;
}

const items: PaletteItem[] = [
  { name: 'Rectangle', size: [100, 50], style: {} },
  { name: 'Rounded', size: [100, 50], style: { rounded: true, fillColor: '#dbeafe' } },
  {
    name: 'Ellipse',
    size: [90, 60],
    style: { shape: 'ellipse', perimeter: 'ellipsePerimeter', fillColor: '#fef3c7' },
  },
  {
    name: 'Rhombus',
    size: [80, 80],
    style: { shape: 'rhombus', perimeter: 'rhombusPerimeter', fillColor: '#fce7f3' },
  },
  {
    name: 'Triangle',
    size: [60, 80],
    style: { shape: 'triangle', perimeter: 'trianglePerimeter', fillColor: '#dcfce7' },
  },
  {
    name: 'Cylinder',
    size: [60, 80],
    style: { shape: 'cylinder', fillColor: '#ede9fe' },
  },
];

export const palette: Demo = {
  id: 'palette',
  title: 'Palette, drag and drop',
  group: 'Interaction',
  description:
    'Shapes of a palette made draggable with gestureUtils.makeDraggable: a preview follows the mouse over the graph and the drop target is highlighted.',
  hints: [
    'Drag a shape from the palette on the right onto the diagram',
    'Drop it into the "Container" swimlane to make it a child of the container',
    'Click a shape of the palette to insert it without dragging',
  ],
  mount(ctx) {
    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    graph.setConnectable(true);
    graph.setDropEnabled(true); // highlights the drop target while dragging

    graph.batchUpdate(() => {
      graph.insertVertex({
        value: 'Container',
        position: [360, 40],
        size: [260, 220],
        style: { shape: 'swimlane', startSize: 24, fillColor: '#f1f5f9' },
      });
    });

    const createCell = (item: PaletteItem) => {
      const cell = new Cell(item.name, new Geometry(0, 0, ...item.size), item.style);
      cell.setVertex(true);
      return cell;
    };

    const insert = (item: PaletteItem) => {
      const count = graph.getDefaultParent().getChildCount();
      const [inserted] = graph.importCells(
        [createCell(item)],
        30 + (count % 5) * 20,
        30 + (count % 5) * 60
      );
      graph.setSelectionCell(inserted);
      ctx.log(`Inserted "${item.name}"`);
    };

    const paletteDiv = document.createElement('div');
    paletteDiv.className = 'palette';
    ctx.side.append(paletteDiv);

    for (const item of items) {
      const element = document.createElement('div');
      element.textContent = item.name;
      element.dataset.shape = item.name.toLowerCase();

      // The preview shown in the graph while dragging, with the size of the inserted cell
      const preview = document.createElement('div');
      Object.assign(preview.style, {
        border: '1px dashed #2563eb',
        width: `${item.size[0]}px`,
        height: `${item.size[1]}px`,
      });

      gestureUtils.makeDraggable(
        element,
        graph,
        (targetGraph, evt, target, x = 0, y = 0) => {
          const cell = createCell(item);
          // getCellAt returns any cell: only keep a container that accepts the new one
          const parent =
            target && targetGraph.isValidDropTarget(target, [cell], evt)
              ? target
              : targetGraph.getDefaultParent();
          const [inserted] = targetGraph.importCells([cell], x, y, parent);
          targetGraph.setSelectionCell(inserted);
          ctx.log(
            `Dropped "${item.name}"${parent === targetGraph.getDefaultParent() ? '' : ` into "${parent.value}"`}`
          );
        },
        preview,
        null,
        null,
        graph.isAutoScroll(),
        true
      );

      // Fallback without dragging: a click inserts the shape at the next free spot
      element.addEventListener('click', () => insert(item));
      paletteDiv.append(element);
    }

    ctx.button('Insert rectangle', () => insert(items[0]), 'insert-shape');
    ctx.button('Delete selection', () => graph.removeCells(), 'delete');
  },
};
