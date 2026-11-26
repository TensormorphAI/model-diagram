import {
  type CellState,
  type CellStyle,
  constants,
  getDefaultPlugins,
  Graph,
  type MouseListenerSet,
  RubberBandHandler,
  StyleDefaultsConfig,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';

const swatches: [string, string, CellStyle][] = [
  [
    'gradient',
    'Gradient',
    {
      fillColor: '#bfdbfe',
      gradientColor: '#1d4ed8',
      gradientDirection: 'south',
      fontColor: '#fff',
    },
  ],
  ['shadow', 'Shadow', { shadow: true }],
  ['rounded', 'Rounded', { rounded: true, arcSize: 30 }],
  ['dashed', 'Dashed', { dashed: true, dashPattern: '6 3', strokeWidth: 2 }],
  ['opacity', 'Opacity 40%', { opacity: 40 }],
  [
    'font',
    'Serif, bold italic',
    { fontFamily: 'Georgia, serif', fontSize: 15, fontStyle: 3 },
  ],
  [
    'underline',
    'Underlined, top-left',
    { fontStyle: 4, align: 'left', verticalAlign: 'top', spacing: 6 },
  ],
  [
    'no-fill',
    'No fill, thick stroke',
    { fillColor: 'none', strokeWidth: 4, strokeColor: '#16a34a' },
  ],
];

export const stylesDemo: Demo = {
  id: 'styles',
  title: 'Styles',
  group: 'Styling',
  description:
    'Named styles registered in the stylesheet, changed default styles, and per-cell style properties: gradient, shadow, rounded corners, dashes, opacity and fonts. Vertices change their style while hovered.',
  hints: [
    'Hover a vertex: it turns orange with a thick border until the mouse leaves',
    'Select vertices, then toggle their shadow, rounded corners or dashes, or apply the "important" named style',
    '"Change default fill" edits the default vertex style: every vertex without its own fillColor follows',
  ],
  mount(ctx) {
    // Global configuration, reset by the shell when leaving the demo
    StyleDefaultsConfig.shadowColor = '#94a3b8';
    StyleDefaultsConfig.shadowOffsetX = 4;
    StyleDefaultsConfig.shadowOffsetY = 4;

    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    graph.isCellFoldable = () => false;
    const stylesheet = graph.getStylesheet();
    Object.assign(stylesheet.getDefaultVertexStyle(), {
      fillColor: '#f1f5f9',
      strokeColor: '#475569',
      fontColor: '#1e293b',
      fontSize: 12,
    } satisfies CellStyle);
    Object.assign(stylesheet.getDefaultEdgeStyle(), {
      strokeColor: '#64748b',
      edgeStyle: 'elbowEdgeStyle',
      verticalAlign: 'bottom',
      fontSize: 11,
    } satisfies CellStyle);
    stylesheet.putCellStyle('important', {
      strokeColor: '#dc2626',
      strokeWidth: 2,
      fontColor: '#dc2626',
      fontStyle: 1,
    });
    stylesheet.putCellStyle('note', {
      fillColor: '#fef9c3',
      strokeColor: '#ca8a04',
      shape: 'rectangle',
      rounded: true,
    });

    graph.batchUpdate(() => {
      const base = graph.insertVertex({
        id: 'default',
        value: 'Default style',
        position: [20, 40],
        size: [140, 50],
      });
      const important = graph.insertVertex({
        id: 'important',
        value: 'Named style "important"',
        position: [240, 40],
        size: [160, 50],
        style: { baseStyleNames: ['important'] },
      });
      const combined = graph.insertVertex({
        id: 'combined',
        value: '"note" + "important"',
        position: [480, 40],
        size: [160, 50],
        style: { baseStyleNames: ['note', 'important'] },
      });
      graph.insertVertex({
        id: 'ignore-default',
        value: 'ignoreDefaultStyle',
        position: [710, 40],
        size: [130, 50],
        style: {
          ignoreDefaultStyle: true,
          shape: 'rectangle',
          strokeColor: 'black',
          fillColor: 'white',
        },
      });
      graph.insertEdge({ value: 'default edge', source: base, target: important });
      graph.insertEdge({
        value: 'important',
        source: important,
        target: combined,
        style: { baseStyleNames: ['important'] },
      });

      swatches.forEach(([id, value, style], index) => {
        graph.insertVertex({
          id,
          value,
          position: [40 + (index % 4) * 210, 170 + Math.floor(index / 4) * 110],
          size: [160, 60],
          style,
        });
      });

      const parent = graph.insertVertex({
        value: 'Parent',
        position: [40, 400],
        size: [380, 110],
        style: { fillColor: '#ede9fe', strokeColor: '#7c3aed', verticalAlign: 'top' },
      });
      graph.insertVertex({
        id: 'inherit',
        parent,
        value: 'fillColor: inherit',
        position: [20, 40],
        size: [160, 50],
        style: { fillColor: 'inherit' },
      });
      graph.insertVertex({
        parent,
        value: 'strokeColor: none',
        position: [200, 40],
        size: [160, 50],
        style: { strokeColor: 'none' },
      });
    });

    // Hover style: the state style is swapped for a modified copy and restored on leave, the model is not changed
    let hovered: { state: CellState; style: CellState['style'] } | null = null;
    const repaint = (state: CellState) => {
      state.shape?.apply(state);
      state.shape?.redraw();
      state.text?.apply(state);
      state.text?.redraw();
    };
    const leave = () => {
      if (!hovered) return;
      hovered.state.style = hovered.style;
      repaint(hovered.state);
      hovered = null;
    };
    const hoverListener: MouseListenerSet = {
      mouseDown: leave,
      mouseMove(_sender, me) {
        const cell = me.getCell();
        const state = graph.isMouseDown || !cell ? null : graph.view.getState(cell);
        const target = state?.cell.isVertex() ? state : null;
        if (target === hovered?.state) return;
        leave();
        if (!target) return;
        hovered = { state: target, style: target.style };
        target.style = {
          ...target.style,
          fillColor: '#fdba74',
          strokeWidth: 4,
          fontStyle: constants.FONT_STYLE_MASK.BOLD,
        };
        repaint(target);
      },
      mouseUp() {},
    };
    graph.addMouseListener(hoverListener);

    const onSelection = (name: string, apply: () => void) => () => {
      if (graph.isSelectionEmpty()) ctx.log('Select one or more vertices first');
      else {
        apply();
        ctx.log(`${name} on ${graph.getSelectionCount()} cell(s)`);
      }
    };
    ctx.button(
      'Toggle shadow',
      onSelection('Toggle shadow', () => graph.toggleCellStyles('shadow')),
      'toggle-shadow'
    );
    ctx.button(
      'Toggle rounded',
      onSelection('Toggle rounded', () => graph.toggleCellStyles('rounded')),
      'toggle-rounded'
    );
    ctx.button(
      'Toggle dashed',
      onSelection('Toggle dashed', () => graph.toggleCellStyles('dashed')),
      'toggle-dashed'
    );
    ctx.button(
      'Toggle bold',
      onSelection('Toggle bold', () =>
        graph.toggleCellStyleFlags('fontStyle', constants.FONT_STYLE_MASK.BOLD)
      ),
      'toggle-bold'
    );
    ctx.button(
      'Apply "important"',
      onSelection('Apply "important"', () => {
        for (const cell of graph.getSelectionCells()) {
          graph.setCellStyle({ ...cell.style, baseStyleNames: ['important'] }, [cell]);
        }
      }),
      'apply-important'
    );
    const fills = ['#f1f5f9', '#dcfce7', '#e0f2fe'];
    ctx.button(
      'Change default fill',
      () => {
        const style = stylesheet.getDefaultVertexStyle();
        style.fillColor =
          fills[(fills.indexOf(style.fillColor ?? '') + 1) % fills.length];
        graph.refresh();
        ctx.log(`Default fillColor: ${style.fillColor}`);
      },
      'change-default-fill'
    );
  },
};
