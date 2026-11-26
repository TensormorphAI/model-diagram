import {
  type Cell,
  getDefaultPlugins,
  Graph,
  InternalEvent,
  KeyHandler,
  Multiplicity,
  RubberBandHandler,
  xmlUtils,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';

export const validation: Demo = {
  id: 'validation',
  title: 'Validation',
  group: 'Editing',
  description:
    'Multiplicity rules restrict which vertex types connect to which, and how many edges they take. The graph is validated after each change and invalid cells get a warning overlay.',
  hints: [
    'Connect a Source to the Subtarget: the connection is refused and the reason is logged',
    'Click "Add invalid edge" to bypass the check, then hover the warning icon',
    'Delete the edge of the lower Source (select it, Delete) to break its "1 or 2 targets" rule',
    'Toggle read-only to disable every edit',
  ],
  mount(ctx) {
    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    graph.setConnectable(true);
    graph.setTooltips(true);
    graph.setAllowDanglingEdges(false);
    graph.setMultigraph(false);
    // The default implementation calls window.alert
    graph.validationAlert = (message) => ctx.log(`Connection refused: ${message.trim()}`);

    graph.multiplicities.push(
      new Multiplicity(
        true,
        'Source',
        null,
        null,
        1,
        2,
        ['Target'],
        'Source must have 1 or 2 targets',
        'Source must connect to a Target'
      ),
      new Multiplicity(
        false,
        'Source',
        null,
        null,
        0,
        0,
        null,
        'Source must have no incoming edge',
        null
      ),
      new Multiplicity(
        false,
        'Target',
        null,
        null,
        1,
        1,
        ['Source'],
        'Target must have 1 source',
        'Target must connect from a Source'
      )
    );

    // Values are XML elements: the rules match their node name
    const doc = xmlUtils.createXmlDocument();
    const node = (name: string) => doc.createElement(name);
    let source!: Cell;
    let subtarget!: Cell;
    graph.batchUpdate(() => {
      source = graph.insertVertex({
        value: node('Source'),
        position: [40, 40],
        size: [100, 40],
        style: { fillColor: '#dbeafe' },
      });
      const t1 = graph.insertVertex({
        value: node('Target'),
        position: [300, 40],
        size: [100, 40],
      });
      const t2 = graph.insertVertex({
        value: node('Target'),
        position: [300, 120],
        size: [100, 40],
      });
      const t3 = graph.insertVertex({
        value: node('Target'),
        position: [300, 200],
        size: [100, 40],
      });
      subtarget = graph.insertVertex({
        value: node('Subtarget'),
        position: [300, 300],
        size: [100, 40],
        style: { fillColor: '#fef3c7' },
      });
      const source2 = graph.insertVertex({
        value: node('Source'),
        position: [40, 200],
        size: [100, 40],
        style: { fillColor: '#dbeafe' },
      });
      graph.insertEdge({ source, target: t1 });
      graph.insertEdge({ source, target: t2 });
      graph.insertEdge({ source: source2, target: t3 });
    });

    const errors = () =>
      graph
        .getDefaultParent()
        .getChildren()
        .flatMap((cell) =>
          graph.getCellOverlays(cell).map(
            (overlay) =>
              `${cell.isEdge() ? 'edge' : graph.convertValueToString(cell)}: ${String(
                overlay.tooltip
              )
                .replace(/<[^>]+>/g, ' ')
                .trim()}`
          )
        );

    // validateGraph adds a warning overlay to each invalid cell without removing the previous one: clear them first
    const validate = () => {
      graph.clearCellOverlays(null);
      graph.validateGraph();
    };
    // Validates after each change
    graph.getDataModel().addListener(InternalEvent.CHANGE, validate);
    validate();

    const keyHandler = ctx.dispose(new KeyHandler(graph));
    keyHandler.bindKey(46, () => graph.removeCells());
    keyHandler.bindKey(8, () => graph.removeCells());

    ctx.button(
      'Validate',
      () => {
        validate();
        const found = errors();
        ctx.log(found.length === 0 ? 'Valid graph' : `${found.length} error(s)`);
        for (const error of found) ctx.log(`  ${error}`);
      },
      'validate'
    );
    ctx.button(
      'Add invalid edge',
      () => {
        // insertEdge does not check the rules, only the handlers do
        graph.setSelectionCell(graph.insertEdge({ source, target: subtarget }));
        ctx.log('Edge Source -> Subtarget added');
      },
      'add-invalid-edge'
    );
    ctx.button(
      'Toggle read-only',
      () => {
        graph.setEnabled(!graph.isEnabled());
        ctx.log(graph.isEnabled() ? 'Editable' : 'Read-only');
      },
      'toggle-read-only'
    );
  },
};
