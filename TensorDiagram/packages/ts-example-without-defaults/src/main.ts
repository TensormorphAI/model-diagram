/*
Copyright 2024-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import './style.css';
import { BaseGraph, constants, InternalEvent } from '@tensormorph/tensordiagramcore';

const initializeGraph = (container: HTMLElement) => {
  // Disables the built-in context menu
  InternalEvent.disableContextMenu(container);

  const graph = new BaseGraph({ container });

  // create a dedicated style for "ellipse" to share properties
  graph.getStylesheet().putCellStyle('myEllipse', {
    perimeter: 'ellipsePerimeter',
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
      value: 'another rectangle',
      position: [20, 200],
      size: [100, 100],
      style: {
        fillColor: 'red',
        fillOpacity: 20,
      },
    });
    const vertex12 = graph.insertVertex({
      value: 'another ellipse',
      x: 150,
      y: 350,
      width: 70,
      height: 70,
      style: {
        baseStyleNames: ['myEllipse'],
        fillColor: 'orange',
      },
    });
    graph.insertEdge({
      value: 'another edge',
      source: vertex11,
      target: vertex12,
      style: { endArrow: 'block' },
    });
  });
};

// display the TensorDiagram version in the footer
const footer = document.querySelector('footer')!;
footer.innerText = `Built with TensorDiagram ${constants.VERSION}`;

// Creates the graph inside the given container
initializeGraph(document.querySelector('#graph-container')!);
