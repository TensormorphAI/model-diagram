import {
  type CellStyle,
  getDefaultPlugins,
  Graph,
  InternalEvent,
  Point,
  RubberBandHandler,
  VertexHandlerConfig,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';

const positions: [string, CellStyle][] = [
  ['Bottom', { verticalLabelPosition: 'bottom', verticalAlign: 'top' }],
  ['Top', { verticalLabelPosition: 'top', verticalAlign: 'bottom' }],
  ['Left', { labelPosition: 'left', align: 'right' }],
  ['Right', { labelPosition: 'right', align: 'left' }],
  ['Inside top left', { align: 'left', verticalAlign: 'top' }],
  ['Inside bottom right', { align: 'right', verticalAlign: 'bottom' }],
];

const lorem = 'Cum Caesar vidisset, portum plenum esse, iuxta navigavit.';

export const labelsDemo: Demo = {
  id: 'labels',
  title: 'Labels',
  group: 'Styling',
  description:
    'Label positions inside and outside the shape, HTML labels, word wrapping and overflow, vertical text, rotated vertices, movable labels and secondary labels as child cells.',
  hints: [
    'Select vertices, then "Cycle label position" to move their label around the shape',
    'Select a vertex and drag the round handle above it to rotate it, or click "Rotate 15°"',
    '"Toggle HTML labels" renders the markup as text: the wrapping and the overflow need HTML labels',
    'Drag a label on its own to move it away from its vertex or edge',
  ],
  mount(ctx) {
    VertexHandlerConfig.rotationEnabled = true; // reset by the shell when leaving the demo

    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    graph.setHtmlLabels(true);
    graph.setVertexLabelsMovable(true);
    graph.isCellFoldable = () => false;
    Object.assign(graph.getStylesheet().getDefaultVertexStyle(), {
      fillColor: '#dbeafe',
      strokeColor: '#2563eb',
      fontColor: '#1e293b',
    } satisfies CellStyle);

    graph.batchUpdate(() => {
      positions.forEach(([value, style], index) => {
        graph.insertVertex({
          id: `position-${index}`,
          value,
          position: [90 + index * 130, 40],
          size: [60, 60],
          style,
        });
      });

      graph.insertVertex({
        id: 'html',
        value:
          '<b>HTML</b> label<br><i>italic</i>, <u>underlined</u>,<br><span style="color:#dc2626">colored</span>',
        position: [40, 170],
        size: [140, 70],
      });
      graph.insertVertex({
        id: 'wrap',
        value: `Wrapped: ${lorem}`,
        position: [230, 170],
        size: [120, 70],
        style: { whiteSpace: 'wrap' },
      });
      graph.insertVertex({
        id: 'hidden',
        value: `overflow hidden: ${lorem}`,
        position: [400, 170],
        size: [120, 40],
        style: { whiteSpace: 'wrap', overflow: 'hidden' },
      });
      graph.insertVertex({
        value: `overflow visible: ${lorem}`,
        position: [570, 170],
        size: [120, 40],
        style: { whiteSpace: 'wrap' },
      });
      graph.insertVertex({
        value: 'Vertical text',
        position: [760, 150],
        size: [40, 120],
        style: { horizontal: false },
      });

      graph.insertVertex({
        id: 'rotated',
        value: 'Rotated 30°',
        position: [60, 340],
        size: [120, 60],
        style: { rotation: 30 },
      });
      const source = graph.insertVertex({
        id: 'with-labels',
        value: 'Main label',
        position: [260, 330],
        size: [120, 60],
      });
      // Secondary labels: child cells of size 0 with a relative geometry, drawn at the top and bottom of their parent
      [
        ['Top label', 0],
        ['Bottom label', 1],
      ].forEach(([value, y]) => {
        const label = graph.insertVertex({
          parent: source,
          value,
          position: [0.5, y as number],
          size: [0, 0],
          relative: true,
          style: {
            fillColor: 'none',
            strokeColor: 'none',
            fontSize: 10,
            fontColor: '#7c3aed',
          },
        });
        label.getGeometry()!.offset = new Point(0, y === 0 ? -10 : 10);
      });
      const target = graph.insertVertex({
        value: 'Target',
        position: [640, 360],
        size: [100, 40],
      });
      graph.insertEdge({
        id: 'edge',
        value: 'Edge label, <b>bold</b>',
        source,
        target,
        style: {
          labelBackgroundColor: '#ffffff',
          fontColor: '#334155',
          rounded: true,
          edgeStyle: 'orthogonalEdgeStyle',
        },
      });
      graph.insertEdge({
        value: 'Rotated text',
        source: target,
        target: graph.insertVertex({
          value: 'End',
          position: [640, 500],
          size: [100, 40],
        }),
        style: { horizontal: false, labelBackgroundColor: '#ffffff' },
      });
    });

    ctx.button(
      'Cycle label position',
      () => {
        for (const cell of graph
          .getSelectionCells()
          .filter((candidate) => candidate.isVertex())) {
          const current = positions.findIndex(([, style]) =>
            Object.entries(style).every(
              ([key, value]) => cell.style[key as keyof CellStyle] === value
            )
          );
          const [name, style] = positions[(current + 1) % positions.length];
          graph.setCellStyle(
            {
              ...cell.style,
              labelPosition: 'center',
              verticalLabelPosition: 'middle',
              align: 'center',
              verticalAlign: 'middle',
              ...style,
            },
            [cell]
          );
          ctx.log(`Label of ${String(cell.value).replace(/<[^>]+>/g, '')}: ${name}`);
        }
      },
      'label-position'
    );
    ctx.button(
      'Rotate 15°',
      () => {
        for (const cell of graph.getSelectionCells()) {
          graph.setCellStyles(
            'rotation',
            ((graph.getCellStyle(cell).rotation ?? 0) + 15) % 360,
            [cell]
          );
        }
      },
      'rotate'
    );
    ctx.button(
      'Toggle HTML labels',
      () => {
        graph.setHtmlLabels(!graph.isHtmlLabels());
        graph.refresh();
        ctx.log(`HTML labels ${graph.isHtmlLabels() ? 'on' : 'off'}`);
      },
      'toggle-html'
    );

    graph.addListener(InternalEvent.CELLS_MOVED, () => ctx.log('Moved'));
  },
};
