import {
  getDefaultPlugins,
  Graph,
  InternalEvent,
  Point,
  RubberBandHandler,
  type Cell,
  type CellStyle,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';
import { createMorpher } from './morph.js';

// The flow runs on the stroke of the visible path of the edge, the second one: the first is the invisible hit area,
// shown here as a pipe. Set on the group node of the shape, which survives redraws, unlike the paths.
const flowCss = `
.flow-edge > path:nth-of-type(1) { visibility: visible; stroke: #cbd5e1; stroke-width: 9px; }
.flow-edge > path:nth-of-type(2) { stroke-dasharray: 8; animation: flow-dash 0.5s linear infinite; }
@keyframes flow-dash { to { stroke-dashoffset: -16; } }`;

const vertexStyle: CellStyle = {
  shape: 'cylinder',
  strokeWidth: 2,
  fillColor: '#ffffff',
  gradientColor: '#a0a0a0',
  strokeColor: 'black',
  fontColor: 'black',
  fontStyle: 1,
  spacingTop: 14,
};

export const animation: Demo = {
  id: 'animation',
  title: 'Animation and effects',
  group: 'Navigation',
  description:
    'Morphing animates cells between two geometries, a CSS animation on the SVG path makes the edges flow, and a fade effect hides and shows cells.',
  hints: [
    'Click Morph to swap the pumps and the tanks, or Auto play to keep morphing',
    'Select a vertex and click Fade out, then Fade in to bring it back',
    'Drag a vertex: the edges keep flowing while they follow it',
  ],
  mount(ctx) {
    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    const model = graph.getDataModel();
    const style = document.createElement('style');
    style.textContent = flowCss;
    ctx.container.append(style); // removed with the container when leaving the demo

    const flowEdges: Cell[] = [];
    let pumps: Cell[] = [];
    let tanks: Cell[] = [];
    let filter!: Cell;
    graph.batchUpdate(() => {
      const vertex = (value: string, x: number, y: number) =>
        graph.insertVertex({
          value,
          position: [x, y],
          size: [70, 70],
          style: vertexStyle,
        });
      pumps = [vertex('Pump 1', 40, 60), vertex('Pump 2', 40, 300)];
      tanks = [vertex('Tank 1', 520, 60), vertex('Tank 2', 520, 300)];
      filter = vertex('Filter', 280, 180);
      const edgeStyle: CellStyle = {
        strokeWidth: 3,
        endArrow: 'block',
        endSize: 3,
        strokeColor: 'black',
        rounded: true,
      };
      for (const pump of pumps)
        flowEdges.push(
          graph.insertEdge({ source: pump, target: filter, style: edgeStyle })
        );
      for (const tank of tanks)
        flowEdges.push(
          graph.insertEdge({ source: filter, target: tank, style: edgeStyle })
        );
      const back = graph.insertEdge({
        source: tanks[1],
        target: pumps[1],
        style: { ...edgeStyle, dashed: true },
      });
      back.getGeometry()!.points = [new Point(320, 420)];
      graph.orderCells(true, flowEdges); // behind the vertices
    });
    // A state is created again when its cell is shown again, or the change undone: mark its shape after every change
    const markFlowEdges = () => {
      for (const edge of flowEdges)
        graph.view.getState(edge)?.shape?.node.classList.add('flow-edge');
    };
    model.addListener(InternalEvent.CHANGE, markFlowEdges);
    markFlowEdges();

    const morph = createMorpher(ctx, graph);
    const swap = () =>
      morph(
        () => {
          for (let i = 0; i < 2; i++) {
            const pump = pumps[i].getGeometry()!;
            const tank = tanks[i].getGeometry()!;
            model.setGeometry(pumps[i], Object.assign(pump.clone(), { x: tank.x }));
            model.setGeometry(tanks[i], Object.assign(tank.clone(), { x: pump.x }));
          }
        },
        () => ctx.log('Morph done'),
        20
      );
    ctx.button('Morph', swap, 'morph');

    let autoPlay: number | null = null;
    const stopAutoPlay = () => {
      if (autoPlay !== null) window.clearInterval(autoPlay);
      autoPlay = null;
    };
    ctx.dispose(stopAutoPlay);
    ctx.button(
      'Auto play',
      () => {
        if (autoPlay === null) autoPlay = window.setInterval(swap, 1500);
        else stopAutoPlay();
        ctx.log(`Auto play ${autoPlay === null ? 'stopped' : 'started'}`);
      },
      'auto-play'
    );

    // Fade: steps the opacity of the shapes and labels of the cells and of their edges
    let fadeTimer: number | null = null;
    const stopFade = () => {
      if (fadeTimer !== null) window.clearInterval(fadeTimer);
      fadeTimer = null;
    };
    ctx.dispose(stopFade);
    const fade = (cells: Cell[], from: number, to: number, done: () => void) => {
      stopFade();
      const nodes = [...cells, ...cells.flatMap((cell) => cell.getEdges())]
        .map((cell) => graph.view.getState(cell))
        .flatMap((state) => [state?.shape?.node, state?.text?.node])
        .filter((node) => node !== undefined);
      for (const node of nodes) node.style.opacity = String(from);
      let step = 0;
      const steps = 12;
      fadeTimer = window.setInterval(() => {
        step++;
        for (const node of nodes)
          node.style.opacity = String(from + ((to - from) * step) / steps);
        if (step < steps) return;
        stopFade();
        for (const node of nodes) node.style.opacity = '';
        done();
      }, 30);
    };
    let faded: Cell[] = [];
    ctx.button(
      'Fade out',
      () => {
        const cells = graph.isSelectionEmpty()
          ? [filter]
          : graph.getSelectionCells().filter((cell) => cell.isVertex());
        graph.clearSelection();
        fade(cells, 1, 0, () => {
          graph.toggleCells(false, cells, true);
          faded = [...faded, ...cells];
          ctx.log(`Faded out ${cells.length} cell(s)`);
        });
      },
      'fade-out'
    );
    ctx.button(
      'Fade in',
      () => {
        const cells = faded;
        faded = [];
        graph.toggleCells(true, cells, true);
        fade(cells, 0, 1, () => ctx.log(`Faded in ${cells.length} cell(s)`));
      },
      'fade-in'
    );
  },
};
