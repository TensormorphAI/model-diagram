import {
  ConnectionConstraint,
  type EventObject,
  getDefaultPlugins,
  Graph,
  InternalEvent,
  Point,
  RubberBandHandler,
  StencilShape,
  StencilShapeRegistry,
  xmlUtils,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';

/** Eight fixed points around every plain vertex: the corners and the middle of each side. */
const fixedPoints = [
  [0, 0],
  [0.5, 0],
  [1, 0],
  [0, 0.5],
  [1, 0.5],
  [0, 1],
  [0.5, 1],
  [1, 1],
].map(([x, y]) => new ConnectionConstraint(new Point(x, y), true));

// A stencil declares its own connection points, which getAllConnectionConstraints returns by default
const gateStencil = `<shape name="gate" aspect="variable" w="100" h="100">
  <connections>
    <constraint x="0" y="0.25" perimeter="0" name="in1"/>
    <constraint x="0" y="0.75" perimeter="0" name="in2"/>
    <constraint x="1" y="0.5" perimeter="0" name="out"/>
  </connections>
  <background><path><move x="0" y="0"/><quad x1="100" y1="0" x2="100" y2="50"/><quad x1="100" y1="100" x2="0" y2="100"/><close/></path></background>
  <foreground><fillstroke/></foreground>
</shape>`;

export const portsDemo: Demo = {
  id: 'ports',
  title: 'Ports and connection points',
  group: 'Edges & connections',
  description:
    'Fixed connection points returned by getAllConnectionConstraints, connection points declared by a stencil, and ports as child cells referenced by the edges through their sourcePort and targetPort styles.',
  hints: [
    'Hover a vertex on the left: its fixed points appear, drag from one of them to a point of another vertex to connect',
    'The gate stencil only offers its two inputs and its output',
    'On the right, the edges start from the small ports of "Hello": click "Move ports", the edges follow them',
  ],
  mount(ctx) {
    const stencil = xmlUtils.parseXml(gateStencil).documentElement;
    StencilShapeRegistry.add('gate', new StencilShape(stencil));

    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    graph.setConnectable(true);
    graph.setAllowDanglingEdges(false);
    graph.getStylesheet().getDefaultEdgeStyle().edgeStyle = 'orthogonalEdgeStyle';
    Object.assign(graph.getStylesheet().getDefaultVertexStyle(), {
      fillColor: '#dbeafe',
      strokeColor: '#2563eb',
    });

    // A port is a child cell with a relative geometry, as in HelloPort.stories.ts
    graph.isPort = (cell) => cell?.getGeometry()?.relative ?? false;
    graph.isCellFoldable = () => false;
    const stencilConstraints = graph.getAllConnectionConstraints;
    graph.getAllConnectionConstraints = (terminal, source) => {
      const cell = terminal?.cell;
      if (
        cell?.isVertex() &&
        !terminal?.shape?.stencil &&
        !graph.isPort(cell) &&
        cell.getChildCount() === 0
      ) {
        return fixedPoints;
      }
      return stencilConstraints.call(graph, terminal, source);
    };

    graph.batchUpdate(() => {
      const a = graph.insertVertex({
        id: 'a',
        value: 'A',
        position: [40, 40],
        size: [120, 60],
      });
      const b = graph.insertVertex({
        id: 'b',
        value: 'B',
        position: [280, 40],
        size: [100, 80],
        style: { shape: 'ellipse', perimeter: 'ellipsePerimeter' },
      });
      graph.insertVertex({ id: 'c', value: 'C', position: [40, 220], size: [120, 60] });
      graph.insertVertex({
        id: 'd',
        value: 'D',
        position: [280, 200],
        size: [100, 80],
        style: { shape: 'triangle', perimeter: 'trianglePerimeter' },
      });
      graph.insertEdge({
        source: a,
        target: b,
        style: { exitX: 1, exitY: 0.5, entryX: 0, entryY: 0 },
      });

      const in1 = graph.insertVertex({
        value: 'in 1',
        position: [40, 360],
        size: [80, 30],
      });
      const in2 = graph.insertVertex({
        value: 'in 2',
        position: [40, 460],
        size: [80, 30],
      });
      const gate = graph.insertVertex({
        id: 'gate',
        value: 'gate',
        position: [240, 380],
        size: [80, 80],
        style: { shape: 'gate', fillColor: '#fef3c7', strokeColor: '#b45309' },
      });
      graph.insertEdge({
        source: in1,
        target: gate,
        style: { entryX: 0, entryY: 0.25, entryPerimeter: false },
      });
      graph.insertEdge({
        source: in2,
        target: gate,
        style: { entryX: 0, entryY: 0.75, entryPerimeter: false },
      });

      const hello = graph.insertVertex({
        id: 'hello',
        value: 'Hello',
        position: [520, 200],
        size: [100, 60],
      });
      hello.setConnectable(false);
      const ports = [0.2, 0.8].map((y, index) =>
        graph.insertVertex({
          id: `port-${index + 1}`,
          parent: hello,
          position: [1, y],
          size: [10, 10],
          relative: true,
          style: {
            shape: 'ellipse',
            perimeter: 'ellipsePerimeter',
            fillColor: '#2563eb',
          },
        })
      );
      for (const port of ports) port.getGeometry()!.offset = new Point(-5, -5);
      const world = graph.insertVertex({
        id: 'world',
        value: 'World',
        position: [740, 100],
        size: [100, 40],
      });
      const world2 = graph.insertVertex({
        id: 'world2',
        value: 'World 2',
        position: [740, 320],
        size: [100, 40],
      });
      // Inserted from the port, stored as an edge from "Hello" carrying sourcePort: <id of the port>
      graph.insertEdge({ id: 'port-edge-1', source: ports[0], target: world });
      graph.insertEdge({ id: 'port-edge-2', source: ports[1], target: world2 });
    });

    let flipped = false;
    ctx.button(
      'Move ports',
      () => {
        flipped = !flipped;
        graph.batchUpdate(() => {
          ['port-1', 'port-2'].forEach((id, index) => {
            const port = graph.getDataModel().getCell(id)!;
            const geometry = port.getGeometry()!.clone();
            geometry.x = flipped ? 0.5 : 1;
            geometry.y = flipped ? index : [0.2, 0.8][index];
            graph.getDataModel().setGeometry(port, geometry);
          });
        });
        ctx.log(
          flipped
            ? 'Ports moved to the top and bottom'
            : 'Ports moved back to the right side'
        );
      },
      'move-ports'
    );

    graph.addListener(
      InternalEvent.CELL_CONNECTED,
      (_sender: unknown, evt: EventObject) => {
        const edge = evt.getProperty('edge');
        const source = evt.getProperty('source') as boolean;
        const style = edge.style;
        const at = source ? [style.exitX, style.exitY] : [style.entryX, style.entryY];
        ctx.log(
          `Edge ${source ? 'source' : 'target'} connected at ${at[0] ?? '-'},${at[1] ?? '-'}`
        );
      }
    );
  },
};
