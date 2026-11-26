import {
  type ArrowValue,
  type CellStyle,
  getDefaultPlugins,
  Graph,
  InternalEvent,
  Point,
  RubberBandHandler,
  type SelectionHandler,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';

/** One tile per routing: a source, a target placed below on the right, and the edge between them. */
const routings: [string, CellStyle, [number, number][]?][] = [
  ['straight', {}],
  ['orthogonal', { edgeStyle: 'orthogonalEdgeStyle' }],
  ['elbow vertical', { edgeStyle: 'elbowEdgeStyle', elbow: 'vertical' }],
  ['elbow horizontal', { edgeStyle: 'elbowEdgeStyle', elbow: 'horizontal' }],
  ['entity relation', { edgeStyle: 'entityRelationEdgeStyle' }],
  ['segment', { edgeStyle: 'segmentEdgeStyle' }, [[60, 95]]],
  ['manhattan', { edgeStyle: 'manhattanEdgeStyle' }],
  ['side to side', { edgeStyle: 'sideToSideEdgeStyle' }],
  ['top to bottom', { edgeStyle: 'topToBottomEdgeStyle' }],
  [
    'curved',
    { curved: true },
    [
      [30, 100],
      [140, 20],
    ],
  ],
  ['rounded', { edgeStyle: 'orthogonalEdgeStyle', rounded: true, arcSize: 40 }],
];

const markers: ArrowValue[] = [
  'classic',
  'classicThin',
  'block',
  'blockThin',
  'open',
  'openThin',
  'oval',
  'diamond',
  'diamondThin',
  'none',
];

const tileWidth = 180;
const tileHeight = 140;

export const edgesDemo: Demo = {
  id: 'edges',
  title: 'Edge styles and markers',
  group: 'Edges & connections',
  description:
    'The built-in edge routings (straight, orthogonal, elbow, entity relation, segment, manhattan, loop...), curved and rounded edges, and every marker at both ends.',
  hints: [
    'Move a vertex: each edge routes again with its own edge style',
    'Select an edge: the handles depend on the edge style, drag them to add bends (elbow, segment) or waypoints',
    '"Toggle rounded corners" rounds or squares the bends of every edge',
  ],
  mount(ctx) {
    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    graph.setCellsDisconnectable(false);
    const selectionHandler = graph.getPlugin<SelectionHandler>('SelectionHandler');
    if (selectionHandler) selectionHandler.guidesEnabled = true;
    Object.assign(graph.getStylesheet().getDefaultVertexStyle(), {
      fillColor: '#dbeafe',
      strokeColor: '#2563eb',
      fontSize: 10,
    } satisfies CellStyle);
    Object.assign(graph.getStylesheet().getDefaultEdgeStyle(), {
      strokeColor: '#334155',
      strokeWidth: 1.5,
      fontSize: 10,
      labelBackgroundColor: '#ffffff',
    } satisfies CellStyle);

    graph.batchUpdate(() => {
      const tiles = [...routings.map(([name]) => name), 'loop'];
      tiles.forEach((name, index) => {
        const x = 10 + (index % 3) * tileWidth;
        const y = 10 + Math.floor(index / 3) * tileHeight;
        const id = name.replace(/ /g, '-');
        const source = graph.insertVertex({
          value: 'source',
          position: [x, y],
          size: [60, 30],
        });
        if (name === 'loop') {
          graph.insertEdge({
            id,
            value: name,
            source,
            target: source,
            style: { edgeStyle: 'loopEdgeStyle' },
          });
          return;
        }
        const target = graph.insertVertex({
          value: 'target',
          position: [x + 100, y + 80],
          size: [60, 30],
        });
        const [, style, waypoints] = routings[index];
        const edge = graph.insertEdge({ id, value: name, source, target, style });
        if (waypoints)
          edge.getGeometry()!.points = waypoints.map(
            ([px, py]) => new Point(x + px, y + py)
          );
      });

      // Dangling edges, one per marker: start and end markers, filled on top, outlined below
      markers.forEach((marker, index) => {
        [true, false].forEach((filled, row) => {
          const y = 30 + index * 52 + row * 18;
          const edge = graph.insertEdge({
            id: `marker-${marker}${filled ? '' : '-open'}`,
            value: row === 0 ? marker : '',
            style: {
              startArrow: marker,
              endArrow: marker,
              startFill: filled,
              endFill: filled,
              startSize: 8,
              endSize: 8,
              verticalAlign: 'bottom',
              labelBackgroundColor: 'none',
            },
          });
          const geometry = edge.getGeometry()!;
          geometry.setTerminalPoint(new Point(590, y), true);
          geometry.setTerminalPoint(new Point(820, y), false);
        });
      });
    });

    ctx.button(
      'Toggle rounded corners',
      () => {
        const edges = graph.getDefaultParent().children.filter((cell) => cell.isEdge());
        const rounded = graph.toggleCellStyles('rounded', false, edges);
        ctx.log(`Edges ${rounded ? 'rounded' : 'squared'}`);
      },
      'toggle-rounded'
    );
    ctx.button('Zoom in', () => graph.zoomIn(), 'zoom-in');
    ctx.button('Zoom out', () => graph.zoomOut(), 'zoom-out');

    graph.addListener(InternalEvent.CELLS_MOVED, () =>
      ctx.log('Cells moved, edges routed again')
    );
  },
};
