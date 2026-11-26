/*
Copyright (c) Tensormorph. All rights reserved.
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import { NS_SVG } from './Constants.js';
import Point from '../view/geometry/Point.js';
import type Cell from '../view/cell/Cell.js';
import type { AbstractGraph } from '../view/AbstractGraph.js';
import TemporaryCellStates from '../view/cell/TemporaryCellStates.js';
import Codec from '../serialization/Codec.js';

export const getViewXml = (
  graph: AbstractGraph,
  scale = 1,
  cells: Cell[] | null = null,
  x0 = 0,
  y0 = 0
): Element | null => {
  if (cells == null) {
    const model = graph.getDataModel();
    cells = [model.getRoot()!];
  }

  const view = graph.getView();
  let result;

  // Disables events on the view
  const eventsEnabled = view.isEventsEnabled();
  view.setEventsEnabled(false);

  // Workaround for label bounds not taken into account for image export.
  // Creates a temporary draw pane which is used for rendering the text.
  // Text rendering is required for finding the bounds of the labels.
  const { drawPane } = view;
  const { overlayPane } = view;

  if (graph.dialect === 'svg') {
    view.drawPane = document.createElementNS(NS_SVG, 'g');
    view.canvas.appendChild(view.drawPane);

    // Redirects cell overlays into a temporary container
    view.overlayPane = document.createElementNS(NS_SVG, 'g');
    view.canvas.appendChild(view.overlayPane);
  } else {
    view.drawPane = <SVGElement>view.drawPane.cloneNode(false);
    view.canvas.appendChild(view.drawPane);

    // Redirects cell overlays into a temporary container
    view.overlayPane = <SVGElement>view.overlayPane.cloneNode(false);
    view.canvas.appendChild(view.overlayPane);
  }

  // Resets the translation
  const translate = view.getTranslate();
  view.translate = new Point(x0, y0);

  // Creates the temporary cell states in the view
  const temp = new TemporaryCellStates(graph.getView(), scale, cells);

  try {
    const enc = new Codec();
    result = enc.encode(graph.getView());
  } finally {
    temp.destroy();
    view.translate = translate;
    view.canvas.removeChild(view.drawPane);
    view.canvas.removeChild(view.overlayPane);
    view.drawPane = drawPane;
    view.overlayPane = overlayPane;
    view.setEventsEnabled(eventsEnabled);
  }
  return result;
};
