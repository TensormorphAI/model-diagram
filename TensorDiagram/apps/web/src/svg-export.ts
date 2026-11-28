import type { AbstractGraph } from '@tensormorph/tensordiagramcore';

/** The diagram as a standalone SVG data URL, cropped to the graph bounds, or undefined when nothing is drawn. */
export const exportSvg = (graph: AbstractGraph, border = 10): string | undefined => {
  graph.clearSelection(); // the selection handles are drawn in the same SVG
  const svg = graph.container.querySelector('svg')?.cloneNode(true) as
    SVGSVGElement | undefined;
  if (!svg) return undefined;
  const bounds = graph.getGraphBounds();
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute(
    'viewBox',
    `${bounds.x - border} ${bounds.y - border} ${bounds.width + 2 * border} ${bounds.height + 2 * border}`
  );
  svg.setAttribute('width', String(Math.ceil(bounds.width + 2 * border)));
  svg.setAttribute('height', String(Math.ceil(bounds.height + 2 * border)));
  svg.removeAttribute('style');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
};
