import {
  getDefaultPlugins,
  Graph,
  Outline,
  RubberBandHandler,
  type Cell,
  type FitPlugin,
  type PanningHandler,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';

export const navigation: Demo = {
  id: 'navigation',
  title: 'Zoom, pan and outline',
  group: 'Navigation',
  description:
    'A diagram larger than its container: zoom, fit, scrollbars, panning, an outline (minimap) of the whole diagram, and a page view with page breaks.',
  hints: [
    'Drag with the right mouse button to pan, or toggle left-button panning',
    'Drag the blue viewport of the outline to scroll, its handle to zoom',
    'Fit shows the whole diagram, Fit center also centers it',
    'Page view shows the background page and the dashed page breaks',
  ],
  mount(ctx) {
    ctx.container.style.overflow = 'auto'; // scrollbars instead of the clipped container of the other demos
    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    graph.setPanning(true);
    graph.centerZoom = false;
    graph.pageBreakDashed = true;
    const panningHandler = graph.getPlugin<PanningHandler>('PanningHandler')!;
    const fitPlugin = graph.getPlugin<FitPlugin>('fit')!;

    // A 6 x 4 grid of vertices, about 1350 x 750: larger than the container at scale 1
    graph.batchUpdate(() => {
      const grid: Cell[][] = [];
      const colors = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3'];
      for (let row = 0; row < 4; row++) {
        grid.push([]);
        for (let col = 0; col < 6; col++) {
          const vertex = graph.insertVertex({
            value: `${String.fromCharCode(65 + row)}${col + 1}`,
            position: [40 + col * 240, 40 + row * 200],
            size: [100, 50],
            style: { fillColor: colors[row], rounded: true },
          });
          grid[row].push(vertex);
          if (col > 0) graph.insertEdge({ source: grid[row][col - 1], target: vertex });
          if (row > 0) graph.insertEdge({ source: grid[row - 1][col], target: vertex });
        }
      }
    });

    const outlineContainer = document.createElement('div');
    outlineContainer.className = 'outline';
    // attached before the Outline is created: the side panel is hidden while empty, so the outline would get no size
    ctx.side.append(outlineContainer);
    ctx.dispose(new Outline(graph, outlineContainer));

    const logScale = () => ctx.log(`Scale: ${graph.view.scale.toFixed(2)}`);
    ctx.button('Zoom in', () => (graph.zoomIn(), logScale()), 'zoom-in');
    ctx.button('Zoom out', () => (graph.zoomOut(), logScale()), 'zoom-out');
    ctx.button('Actual size', () => (graph.zoomActual(), logScale()), 'zoom-actual');
    ctx.button('Fit', () => (fitPlugin.fit({ margin: 20 }), logScale()), 'fit');
    ctx.button(
      'Fit center',
      () => (fitPlugin.fitCenter({ margin: 20 }), logScale()),
      'fit-center'
    );
    ctx.button(
      'Left-button panning',
      () => {
        panningHandler.useLeftButtonForPanning = !panningHandler.useLeftButtonForPanning;
        ctx.log(
          `Left-button panning ${panningHandler.useLeftButtonForPanning ? 'on' : 'off'}`
        );
      },
      'toggle-left-panning'
    );
    ctx.button(
      'Page view',
      () => {
        graph.pageVisible = !graph.pageVisible;
        graph.pageBreaksVisible = graph.pageVisible;
        graph.view.validateBackground();
        graph.sizeDidChange();
        ctx.log(`Page view ${graph.pageVisible ? 'on' : 'off'}`);
      },
      'toggle-page-view'
    );
  },
};
