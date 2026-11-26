/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import {
  CellEditorHandler,
  CellState,
  ConnectionHandler,
  ConnectionConstraint,
  Geometry,
  Graph,
  type GraphPluginConstructor,
  InternalMouseEvent,
  Point,
  RubberBandHandler,
  SelectionCellsHandler,
  SelectionHandler,
} from '@tensormorph/tensordiagramcore';

import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';
// style required by RubberBand
import '@tensormorph/tensordiagramcore/css/common.css';

export default {
  title: 'Connections/Anchors',
  argTypes: {
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const container = createGraphContainer(args);

  class MyCustomConnectionHandler extends ConnectionHandler {
    // Enables connect preview for the default edge style
    override createEdgeState(_me: InternalMouseEvent) {
      const edge = this.graph.createEdge(null, null!, null, null, null);
      return new CellState(this.graph.view, edge, this.graph.getCellStyle(edge));
    }
  }

  // Use a dedicated set of plugins to use MyCustomConnectionHandler and to not use extra plugins not needed here
  const plugins: GraphPluginConstructor[] = [
    CellEditorHandler,
    SelectionCellsHandler,
    MyCustomConnectionHandler,
    SelectionHandler,
  ];
  // Enables rubberband selection
  if (args.rubberBand) plugins.push(RubberBandHandler);

  class MyCustomGraph extends Graph {
    constructor(container: HTMLElement) {
      super(container, undefined, plugins);
    }

    override getAllConnectionConstraints = (
      terminal: CellState | null,
      _source: boolean
    ) => {
      // Overridden to define per-geometry connection points
      return (terminal?.cell?.geometry as MyCustomGeometryClass)?.constraints ?? null;
    };
  }

  class MyCustomGeometryClass extends Geometry {
    // Defines the default constraints for the vertices
    constraints = [
      new ConnectionConstraint(new Point(0.25, 0), true),
      new ConnectionConstraint(new Point(0.5, 0), true),
      new ConnectionConstraint(new Point(0.75, 0), true),
      new ConnectionConstraint(new Point(0, 0.25), true),
      new ConnectionConstraint(new Point(0, 0.5), true),
      new ConnectionConstraint(new Point(0, 0.75), true),
      new ConnectionConstraint(new Point(1, 0.25), true),
      new ConnectionConstraint(new Point(1, 0.5), true),
      new ConnectionConstraint(new Point(1, 0.75), true),
      new ConnectionConstraint(new Point(0.25, 1), true),
      new ConnectionConstraint(new Point(0.5, 1), true),
      new ConnectionConstraint(new Point(0.75, 1), true),
    ];
  }

  // Edges have no connection points
  // PolylineShape.prototype.constraints = null; // not useful here

  // Creates the graph inside the given container
  const graph: Graph = new MyCustomGraph(container);
  graph.setConnectable(true);

  // Specifies the default edge style
  graph.getStylesheet().getDefaultEdgeStyle().edgeStyle = 'orthogonalEdgeStyle';

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Hello,',
      position: [20, 20],
      size: [80, 30],
      geometryClass: MyCustomGeometryClass,
    });
    const v2 = graph.insertVertex({
      parent,
      value: 'World!',
      position: [200, 150],
      size: [80, 30],
      geometryClass: MyCustomGeometryClass,
    });
    graph.insertEdge({
      parent,
      value: '',
      source: v1,
      target: v2,
    });
  });

  return container;
};

export const Default = Template.bind({});
