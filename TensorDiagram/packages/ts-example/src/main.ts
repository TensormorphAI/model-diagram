/*
Copyright 2022-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import '@tensormorph/tensordiagramcore/css/common.css'; // required by RubberBandHandler
import './style.css';
import {
  constants,
  type FitPlugin,
  getDefaultPlugins,
  Graph,
  InternalEvent,
  Perimeter,
  RubberBandHandler,
} from '@tensormorph/tensordiagramcore';
import { registerCustomShapes } from './custom-shapes';

const initializeGraph = (container: HTMLElement) => {
  // Disables the built-in context menu
  InternalEvent.disableContextMenu(container);

  const graph = new Graph(container, undefined, [
    ...getDefaultPlugins(),
    RubberBandHandler, // Enables rubber band selection
  ]);
  graph.setPanning(true); // Use mouse right button for panning

  // shapes and styles
  registerCustomShapes();
  // create a dedicated style for "ellipse" to share properties
  graph.getStylesheet().putCellStyle('myEllipse', {
    perimeter: Perimeter.EllipsePerimeter,
    shape: 'ellipse',
    verticalAlign: 'top',
    verticalLabelPosition: 'bottom',
  });

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const vertex01 = graph.insertVertex({
      value: 'a regular rectangle',
      position: [10, 10],
      size: [100, 100],
    });
    const vertex02 = graph.insertVertex({
      value: 'a regular ellipse',
      position: [350, 90],
      size: [50, 50],
      style: {
        baseStyleNames: ['myEllipse'],
        fillColor: 'orange',
      },
    });
    graph.insertEdge({
      value: 'an orthogonal style edge',
      source: vertex01,
      target: vertex02,
      style: {
        edgeStyle: 'orthogonalEdgeStyle',
        rounded: true,
      },
    });

    const vertex11 = graph.insertVertex({
      value: 'a custom rectangle',
      position: [20, 200],
      size: [100, 100],
      style: { shape: 'customRectangle' },
    });
    const vertex12 = graph.insertVertex({
      value: 'a custom ellipse',
      x: 150,
      y: 350,
      width: 70,
      height: 70,
      style: {
        baseStyleNames: ['myEllipse'],
        shape: 'customEllipse',
      },
    });
    graph.insertEdge({
      value: 'another edge',
      source: vertex11,
      target: vertex12,
      style: { endArrow: 'block' },
    });
  });

  return graph;
};

// display the TensorDiagram version in the footer
const footer = document.querySelector('footer')!;
footer.innerText = `Built with TensorDiagram ${constants.VERSION}`;

// Creates the graph inside the given container
const graph = initializeGraph(document.querySelector('#graph-container')!);

// Control buttons
document.getElementById('reset-zoom')!.addEventListener('click', () => {
  graph.zoomActual();
});
document.getElementById('fit-center')!.addEventListener('click', () => {
  graph.getPlugin<FitPlugin>('fit')?.fitCenter({ margin: 20 });
});
