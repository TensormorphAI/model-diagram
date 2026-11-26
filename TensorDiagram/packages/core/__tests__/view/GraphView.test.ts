/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import {
  CellState,
  EdgeStyle,
  EdgeStyleRegistry,
  GraphView,
  Perimeter,
  PerimeterRegistry,
  Rectangle,
  unregisterAllEdgeStyles,
  unregisterAllPerimeters,
} from '../../src';
import { createBaseGraph, createGraph, createContainer } from '../utils';

describe('getEdgeStyle ', () => {
  describe('isLoopStyleEnabled returns true', () => {
    // use manual double instead of jest mock as this is a very simple use case, and we don't want to do any asserts on the fake method
    class GraphViewLoopStyleEnabled extends GraphView {
      override isLoopStyleEnabled(): boolean {
        return true;
      }
    }

    const createGraph = () =>
      createBaseGraph({ view: (graph) => new GraphViewLoopStyleEnabled(graph) });

    test('no loopStyle in CellStateStyle', () => {
      const graph = createGraph();
      const cellState = new CellState(graph.view, null, {});
      expect(graph.view.getEdgeStyle(cellState)).toBe(EdgeStyle.Loop); // default defined in AbstractGraph
    });

    test('loopStyle in CellStateStyle', () => {
      const graph = createGraph();
      const cellState = new CellState(graph.view, null, {
        loopStyle: EdgeStyle.ElbowConnector,
      });
      expect(graph.view.getEdgeStyle(cellState)).toBe(EdgeStyle.ElbowConnector);
    });
  });

  describe('isLoopStyleEnabled returns false', () => {
    // Prevents side effects between tests
    beforeEach(() => {
      unregisterAllEdgeStyles();
    });
    afterAll(() => {
      unregisterAllEdgeStyles();
    });

    // use manual double instead of jest mock as this is a very simple use case, and we don't want to do any asserts on the fake method
    class GraphViewLoopStyleDisabled extends GraphView {
      override isLoopStyleEnabled(): boolean {
        return false;
      }
    }

    const createGraph = () =>
      createBaseGraph({ view: (graph) => new GraphViewLoopStyleDisabled(graph) });

    test('no edgeStyle in CellStateStyle, no element matching in the registry', () => {
      const graph = createGraph();
      const cellState = new CellState(graph.view, null, {});
      expect(graph.view.getEdgeStyle(cellState)).toBeNull();
    });

    test('edgeStyle in CellStateStyle is a string, no element matching in the registry', () => {
      const graph = createGraph();
      const cellState = new CellState(graph.view, null, { edgeStyle: 'customEdgeStyle' });
      expect(graph.view.getEdgeStyle(cellState)).toBeNull();
    });

    test('edgeStyle in CellStateStyle is a string, element matching in the registry', () => {
      const connector = EdgeStyle.OrthConnector;
      EdgeStyleRegistry.add('customEdgeStyle', connector);

      const graph = createGraph();
      const cellState = new CellState(graph.view, null, { edgeStyle: 'customEdgeStyle' });
      expect(graph.view.getEdgeStyle(cellState)).toBe(connector);
    });

    test('edgeStyle in CellStateStyle is a string, element matching in the registry BUT CellStateStyle.noEdgeStyle is true', () => {
      const connector = EdgeStyle.OrthConnector;
      EdgeStyleRegistry.add('customEdgeStyle', connector);

      const graph = createGraph();
      const cellState = new CellState(graph.view, null, {
        edgeStyle: 'customEdgeStyle',
        noEdgeStyle: true,
      });
      expect(graph.view.getEdgeStyle(cellState)).toBeNull();
    });

    test('edgeStyle in CellStateStyle is a function', () => {
      const connector = EdgeStyle.OrthConnector;

      const graph = createGraph();
      const cellState = new CellState(graph.view, null, { edgeStyle: connector });
      expect(graph.view.getEdgeStyle(cellState)).toBe(connector);
    });
  });
});

describe('destroy', () => {
  test('clears eventListeners', () => {
    const graph = createBaseGraph();
    const view = graph.getView();
    view.addListener('testEvent', () => {});
    expect(view.eventListeners.length).toBeGreaterThan(0);

    view.destroy();

    expect(view.eventListeners).toHaveLength(0);
  });
});

describe('getPerimeterFunction', () => {
  // Prevents side effects between tests
  beforeEach(() => {
    unregisterAllPerimeters();
  });
  afterAll(() => {
    unregisterAllPerimeters();
  });

  test('no perimeter in CellStateStyle, no element matching in the registry', () => {
    const graph = createBaseGraph();
    const cellState = new CellState(graph.view, null, {});
    expect(graph.view.getPerimeterFunction(cellState)).toBeNull();
  });

  test('perimeter in CellStateStyle is a string, no element matching in the registry', () => {
    const graph = createBaseGraph();
    const cellState = new CellState(graph.view, null, { perimeter: 'customPerimeter' });
    expect(graph.view.getPerimeterFunction(cellState)).toBeNull();
  });

  test('perimeter in CellStateStyle is a string, element matching in the registry', () => {
    const perimeter = Perimeter.HexagonPerimeter;
    PerimeterRegistry.add('customPerimeter', perimeter);

    const graph = createBaseGraph();
    const cellState = new CellState(graph.view, null, { perimeter: 'customPerimeter' });
    expect(graph.view.getPerimeterFunction(cellState)).toBe(perimeter);
  });

  test('perimeter in CellStateStyle is a function', () => {
    const perimeter = Perimeter.HexagonPerimeter;

    const graph = createBaseGraph();
    const cellState = new CellState(graph.view, null, { perimeter });
    expect(graph.view.getPerimeterFunction(cellState)).toBe(perimeter);
  });
});

describe('getBounds', () => {
  test('return the union of the states of every given cell', () => {
    const graph = createBaseGraph();
    const cells = [
      graph.insertVertex({ position: [10, 20], size: [30, 40] }),
      graph.insertVertex({ position: [100, 200], size: [30, 40] }),
    ];

    expect(graph.view.getBounds(cells)).toEqual(new Rectangle(10, 20, 120, 220));
  });
});

// An edge connected to a port is stored on the parent of the port, which it references by id in its sourcePort style.
// Moving the port alone must reroute the edge, although the port itself has no edge.
describe('invalidate a port', () => {
  test('reroutes the edges connected to the port', () => {
    const graph = createGraph(createContainer({ clientWidth: 400, clientHeight: 400 }));
    graph.isPort = (cell) => cell?.getGeometry()?.relative ?? false;
    const parent = graph.insertVertex({
      value: 'parent',
      position: [0, 0],
      size: [100, 100],
    });
    const port = graph.insertVertex({
      parent,
      value: 'port',
      position: [1, 0],
      size: [10, 10],
      relative: true,
    });
    const target = graph.insertVertex({
      value: 'target',
      position: [300, 0],
      size: [50, 50],
    });
    const edge = graph.insertEdge({ source: port, target });
    expect(edge.getTerminal(true)).toBe(parent);
    expect(edge.getStyle().sourcePort).toBe(port.getId());
    const startPoint = () => graph.getView().getState(edge)?.absolutePoints[0]?.clone();
    const before = startPoint();

    const geometry = port.getGeometry()!.clone();
    geometry.y = 1;
    graph.getDataModel().setGeometry(port, geometry);

    expect(startPoint()).not.toEqual(before);
  });
});
