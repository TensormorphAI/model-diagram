import {
  CircleLayout,
  CompactTreeLayout,
  FastOrganicLayout,
  type FitPlugin,
  getDefaultPlugins,
  Graph,
  HierarchicalLayout,
  RadialTreeLayout,
  RubberBandHandler,
  StackLayout,
  type Cell,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';
import { createMorpher } from './morph.js';

export const layouts: Demo = {
  id: 'layouts',
  title: 'Automatic layouts',
  group: 'Layout',
  description:
    'One tree laid out by each algorithm of the library, with the cells morphing from their previous position to the new one.',
  hints: [
    'Click a layout button and watch the cells move to their new place',
    'Drag a few vertices around, then run the same layout again',
    'Fast organic is a force-directed layout: run it twice to see it settle differently',
  ],
  mount(ctx) {
    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    const parent = graph.getDefaultParent();
    Object.assign(graph.getStylesheet().getDefaultVertexStyle(), {
      rounded: true,
      fillColor: '#dbeafe',
      strokeColor: '#2563eb',
      fontColor: '#1e3a8a',
    });
    graph.getStylesheet().getDefaultEdgeStyle().rounded = true;

    let root!: Cell;
    graph.batchUpdate(() => {
      root = graph.insertVertex({ value: 'Root', position: [20, 20], size: [70, 30] });
      for (let i = 1; i <= 3; i++) {
        const child = graph.insertVertex({
          value: `${i}`,
          position: [20 + i * 90, 80],
          size: [70, 30],
        });
        graph.insertEdge({ source: root, target: child });
        for (let j = 1; j <= 3; j++) {
          const leaf = graph.insertVertex({
            value: `${i}.${j}`,
            position: [j * 80, 100 + i * 60],
            size: [70, 30],
          });
          graph.insertEdge({ source: child, target: leaf });
        }
      }
    });

    const north = new HierarchicalLayout(graph, 'north');
    const west = new HierarchicalLayout(graph, 'west');
    const organic = new FastOrganicLayout(graph);
    organic.forceConstant = 90;
    const circle = new CircleLayout(graph, 160);
    const compactTree = new CompactTreeLayout(graph, false);
    compactTree.levelDistance = 40;
    const radialTree = new RadialTreeLayout(graph);
    radialTree.levelDistance = 90;
    radialTree.autoRadius = true;
    const stack = new StackLayout(graph, true, 40);
    stack.wrap = 600;
    // PartitionLayout is left out: it splits the area of a container between its children, it does not lay out a graph
    const buttons: [string, string, (cells: Cell[]) => void][] = [
      ['Hierarchical', 'hierarchical', () => north.execute(parent)],
      ['Hierarchical (west)', 'hierarchical-west', () => west.execute(parent)],
      ['Fast organic', 'organic', () => organic.execute(parent)],
      ['Circle', 'circle', () => circle.execute(parent)],
      ['Compact tree', 'compact-tree', () => compactTree.execute(parent, root)],
      ['Radial tree', 'radial-tree', () => radialTree.execute(parent, root)],
      // stack ignores the edges: reset their points so that they do not keep the route of the previous layout
      ['Stack', 'stack', (cells) => (graph.resetEdges(cells), stack.execute(parent))],
    ];
    // Shrinks a layout wider or taller than the view, without enlarging a small one
    const fitPlugin = graph.getPlugin<FitPlugin>('fit');
    if (fitPlugin) fitPlugin.maxFitScale = 1;
    const fitInView = () => fitPlugin?.fit({ margin: 20 });

    graph.batchUpdate(() => north.execute(parent));
    fitInView();

    const morph = createMorpher(ctx, graph);
    for (const [label, action, execute] of buttons) {
      ctx.button(
        label,
        () =>
          morph(
            () => {
              const cells = parent.children;
              execute(cells);
              // Layouts start at the origin, or around the root for the radial one: move the result into the view
              const bounds = graph.getBoundingBoxFromGeometry(cells, true);
              if (bounds) graph.moveCells(cells, 20 - bounds.x, 20 - bounds.y);
            },
            () => {
              fitInView();
              ctx.log(`${label} layout done`);
            }
          ),
        action
      );
    }
  },
};
