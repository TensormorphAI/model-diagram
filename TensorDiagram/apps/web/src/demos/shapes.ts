import {
  type AbstractCanvas2D,
  type CellStyle,
  CylinderShape,
  type DirectionValue,
  getDefaultPlugins,
  Graph,
  RubberBandHandler,
  ShapeRegistry,
  StencilShape,
  StencilShapeRegistry,
  type TooltipHandler,
  xmlUtils,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';

// Same stencils as packages/html/public/stencils.xml, inlined since the app only serves the core images
const stencils = `<shapes>
<shape name="or" aspect="variable">
  <background><path><move x="0" y="0"/><quad x1="100" y1="0" x2="100" y2="50"/><quad x1="100" y1="100" x2="0" y2="100"/><close/></path></background>
  <foreground><fillstroke/></foreground>
</shape>
<shape name="xor" aspect="fixed">
  <background><path><move x="0" y="0"/><quad x1="100" y1="0" x2="100" y2="50"/><quad x1="100" y1="100" x2="0" y2="100"/><quad x1="50" y1="50" x2="0" y2="0"/><close/></path></background>
  <foreground><fillstroke/></foreground>
</shape>
<shape name="and" aspect="fixed" w="50">
  <background><linejoin join="round"/><path><move x="0" y="0"/><line x="50" y="50"/><line x="0" y="100"/><close/></path></background>
  <foreground><fillstroke/></foreground>
</shape>
</shapes>`;

const pictureSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 48"><rect width="64" height="48" rx="6" fill="#bfdbfe"/><circle cx="18" cy="16" r="7" fill="#facc15"/><path d="M4 44 24 22l12 12 8-8 16 18z" fill="#2563eb"/></svg>`;

/** A 3D box drawn with a background path and a foreground stroke, as in Shape.stories.js. */
class BoxShape extends CylinderShape {
  extrude = 10;

  override redrawPath(
    c: AbstractCanvas2D,
    _x: number,
    _y: number,
    w: number,
    h: number,
    isForeground = false
  ): void {
    const d = this.extrude * this.scale;
    if (isForeground) {
      c.moveTo(0, d);
      c.lineTo(w - d, d);
      c.lineTo(w, 0);
      c.moveTo(w - d, d);
      c.lineTo(w - d, h);
    } else {
      c.moveTo(0, d);
      c.lineTo(d, 0);
      c.lineTo(w, 0);
      c.lineTo(w, h - d);
      c.lineTo(w - d, h);
      c.lineTo(0, h);
      c.close();
    }
  }
}

const shapes: [string, CellStyle][] = [
  ['rectangle', { shape: 'rectangle' }],
  ['rounded', { shape: 'rectangle', rounded: true }],
  ['ellipse', { shape: 'ellipse', perimeter: 'ellipsePerimeter' }],
  ['doubleEllipse', { shape: 'doubleEllipse', perimeter: 'ellipsePerimeter' }],
  ['rhombus', { shape: 'rhombus', perimeter: 'rhombusPerimeter' }],
  ['triangle', { shape: 'triangle', perimeter: 'trianglePerimeter' }],
  ['hexagon', { shape: 'hexagon', perimeter: 'hexagonPerimeter' }],
  ['cylinder', { shape: 'cylinder' }],
  ['cloud', { shape: 'cloud' }],
  ['actor', { shape: 'actor' }],
  ['line', { shape: 'line', strokeWidth: 3 }],
  [
    'image',
    { shape: 'image', image: `data:image/svg+xml,${encodeURIComponent(pictureSvg)}` },
  ],
  [
    'label',
    {
      shape: 'label',
      image: './images/warning.png',
      imageWidth: 24,
      imageHeight: 24,
      rounded: true,
    },
  ],
  [
    'swimlane',
    {
      shape: 'swimlane',
      startSize: 20,
      verticalLabelPosition: 'middle',
      verticalAlign: 'top',
    },
  ],
  ['stencil and', { shape: 'and' }],
  ['stencil or', { shape: 'or' }],
  ['stencil xor', { shape: 'xor' }],
  ['custom box', { shape: 'box', spacingTop: 10, spacingRight: 10 }],
];

const directions: DirectionValue[] = ['east', 'south', 'west', 'north'];

export const shapesDemo: Demo = {
  id: 'shapes',
  title: 'Shapes',
  group: 'Styling',
  description:
    'Every built-in vertex shape with its matching perimeter, three stencils parsed from XML and a custom shape class registered in the ShapeRegistry.',
  hints: [
    'Select a shape and click "Flip horizontally" or "Rotate direction": the triangle and the stencils show it best',
    'Hover a cell to see its style as a tooltip',
    'Resize a stencil: "and" and "xor" keep their aspect ratio, "or" does not',
  ],
  mount(ctx) {
    // Registries are emptied by the shell between demos, so register here rather than at module level
    ShapeRegistry.add('box', BoxShape);
    for (const node of Array.from(xmlUtils.parseXml(stencils).documentElement.children)) {
      StencilShapeRegistry.add(node.getAttribute('name')!, new StencilShape(node));
    }

    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    graph.setTooltips(true);
    const tooltipHandler = graph.getPlugin<TooltipHandler>('TooltipHandler');
    if (tooltipHandler)
      tooltipHandler.getTooltipForCell = (cell) => JSON.stringify(cell.style);
    const defaults = graph.getStylesheet().getDefaultVertexStyle();
    defaults.fillColor = '#dbeafe';
    defaults.strokeColor = '#2563eb';
    defaults.verticalLabelPosition = 'bottom';
    defaults.verticalAlign = 'top';

    graph.batchUpdate(() => {
      shapes.forEach(([name, style], index) => {
        graph.insertVertex({
          id: name.replace(' ', '-'),
          value: name,
          position: [30 + (index % 6) * 140, 30 + Math.floor(index / 6) * 130],
          size: [80, 60],
          style,
        });
      });
    });

    ctx.button('Flip horizontally', () => graph.toggleCellStyles('flipH'), 'flip-h');
    ctx.button(
      'Rotate direction',
      () => {
        for (const cell of graph.getSelectionCells()) {
          const current = graph.getCellStyle(cell).direction ?? 'east';
          const next = directions[(directions.indexOf(current) + 1) % directions.length];
          graph.setCellStyles('direction', next, [cell]);
          ctx.log(`${String(cell.value)}: direction ${next}`);
        }
      },
      'rotate-direction'
    );
  },
};
