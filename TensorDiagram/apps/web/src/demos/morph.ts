import {
  InternalEvent,
  Morphing,
  type AbstractGraph,
} from '@tensormorph/tensordiagramcore';
import type { DemoContext } from '../types.js';

/**
 * Returns a function applying a model change and animating the cells to their new geometry, as in the GraphLayout
 * story. A morph still running when a new one starts is finished first, and one running when the user leaves the demo
 * is stopped without firing DONE, since the graph is being destroyed.
 */
export const createMorpher = (ctx: DemoContext, graph: AbstractGraph) => {
  let current: Morphing | null = null;
  ctx.dispose(() => {
    if (current?.thread != null) window.clearInterval(current.thread);
  });

  return (change: () => void, done?: () => void, steps = 10): void => {
    current?.stopAnimation();
    const model = graph.getDataModel();
    model.beginUpdate();
    try {
      change();
    } finally {
      const morph = (current = new Morphing(graph, steps, 1.5, 20));
      morph.addListener(InternalEvent.DONE, () => {
        model.endUpdate();
        done?.();
      });
      morph.startAnimation();
    }
  };
};
