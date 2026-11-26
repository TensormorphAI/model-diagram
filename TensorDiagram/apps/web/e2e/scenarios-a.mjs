// Behaviour scenarios of the demos of src/demos/group-a.ts, merged by e2e/scenarios.mjs
import assert from 'node:assert/strict';
import { cellCount, click, withGraph } from './helpers.mjs';

/** Page coordinates of a point of a cell, given relative to its bounds: [0.5, 0.5] is the center. */
const pointOf = (page, id, [rx, ry]) =>
  withGraph(
    page,
    (graph, { id, rx, ry }) => {
      const state = graph.view.getState(graph.getDataModel().getCell(id));
      const rect = graph.container.getBoundingClientRect();
      return {
        x: rect.left - graph.container.scrollLeft + state.x + state.width * rx,
        y: rect.top - graph.container.scrollTop + state.y + state.height * ry,
      };
    },
    { id, rx, ry }
  );

const select = (page, id) =>
  withGraph(
    page,
    (graph, id) => graph.setSelectionCell(graph.getDataModel().getCell(id)),
    id
  );

const style = (page, id) =>
  withGraph(page, (graph, id) => graph.getDataModel().getCell(id).style, id);
const computedStyle = (page, id) =>
  withGraph(
    page,
    (graph, id) => graph.getCellStyle(graph.getDataModel().getCell(id)),
    id
  );
const absolutePoints = (page, id) =>
  withGraph(
    page,
    (graph, id) =>
      graph.view
        .getState(graph.getDataModel().getCell(id))
        .absolutePoints.map((p) => [p.x, p.y]),
    id
  );

const assertOrthogonal = (points, label) => {
  assert.ok(points.length > 2, `${label}: bends expected, got ${JSON.stringify(points)}`);
  for (let i = 1; i < points.length; i++) {
    const [[x0, y0], [x1, y1]] = [points[i - 1], points[i]];
    assert.ok(
      Math.abs(x0 - x1) < 0.5 || Math.abs(y0 - y1) < 0.5,
      `${label}: diagonal segment ${i} in ${JSON.stringify(points)}`
    );
  }
};

export const scenarios = {
  'shapes: built-in shapes, stencils and custom shape are drawn, direction and flip apply':
    async ({ page, loadDemo }) => {
      assert.equal(await loadDemo('shapes'), undefined);
      assert.equal(await cellCount(page), 18);
      const drawn = await withGraph(page, (graph) =>
        graph
          .getDefaultParent()
          .children.filter(
            (cell) => !graph.view.getState(cell)?.shape?.node?.childNodes.length
          )
          .map((cell) => cell.value)
      );
      assert.deepEqual(drawn, [], 'shapes without any SVG element');
      const stencils = await withGraph(page, (graph) =>
        ['stencil-and', 'stencil-or', 'stencil-xor'].map(
          (id) =>
            graph.view.getState(graph.getDataModel().getCell(id)).shape.stencil != null
        )
      );
      assert.deepEqual(
        stencils,
        [true, true, true],
        'stencil shapes come from the StencilShapeRegistry'
      );
      assert.equal(
        await withGraph(
          page,
          (graph) =>
            graph.view.getState(graph.getDataModel().getCell('custom-box')).shape.extrude
        ),
        10,
        'custom box shape registered in the ShapeRegistry'
      );

      await select(page, 'triangle');
      await click(page, 'rotate-direction');
      assert.equal((await style(page, 'triangle')).direction, 'south');
      await click(page, 'flip-h');
      assert.equal((await style(page, 'triangle')).flipH, true);
    },

  'styles: named styles, selection toggles, default style and hover': async ({
    page,
    loadDemo,
  }) => {
    assert.equal(await loadDemo('styles'), undefined);
    assert.equal((await computedStyle(page, 'important')).strokeColor, '#dc2626');
    const combined = await computedStyle(page, 'combined');
    assert.equal(combined.fillColor, '#fef9c3', 'fill from "note"');
    assert.equal(
      combined.strokeColor,
      '#dc2626',
      'stroke from "important", applied last'
    );
    assert.equal(
      (await computedStyle(page, 'ignore-default')).fontColor,
      undefined,
      'default style ignored'
    );

    await select(page, 'default');
    await click(page, 'toggle-shadow');
    await click(page, 'toggle-rounded');
    await click(page, 'toggle-dashed');
    const toggled = await style(page, 'default');
    assert.deepEqual(
      [toggled.shadow, toggled.rounded, toggled.dashed],
      [true, true, true]
    );
    await click(page, 'toggle-shadow');
    assert.equal((await style(page, 'default')).shadow, false);
    await click(page, 'apply-important');
    assert.equal((await computedStyle(page, 'default')).strokeColor, '#dc2626');

    await click(page, 'change-default-fill');
    assert.equal(
      (await computedStyle(page, 'shadow')).fillColor,
      '#dcfce7',
      'default fill followed'
    );
    assert.equal(
      (await computedStyle(page, 'gradient')).fillColor,
      '#bfdbfe',
      'own fill kept'
    );

    const hoveredStrokeWidth = () =>
      withGraph(
        page,
        (graph) =>
          graph.view.getState(graph.getDataModel().getCell('rounded')).style.strokeWidth
      );
    const center = await pointOf(page, 'rounded', [0.5, 0.5]);
    await page.mouse.move(center.x - 300, center.y + 300);
    await page.mouse.move(center.x, center.y, { steps: 5 });
    assert.equal(await hoveredStrokeWidth(), 4, 'hover style applied');
    await page.mouse.move(center.x, center.y + 200, { steps: 5 });
    assert.notEqual(await hoveredStrokeWidth(), 4, 'hover style removed');
    assert.equal(
      (await style(page, 'rounded')).strokeWidth,
      undefined,
      'model untouched by the hover'
    );
  },

  'edges: routings, markers, rounded toggle and rerouting on move': async ({
    page,
    loadDemo,
  }) => {
    assert.equal(await loadDemo('edges'), undefined);
    assert.equal((await absolutePoints(page, 'straight')).length, 2);
    for (const id of [
      'orthogonal',
      'elbow-vertical',
      'elbow-horizontal',
      'segment',
      'manhattan',
      'rounded',
    ]) {
      assertOrthogonal(await absolutePoints(page, id), id);
    }
    assert.ok(
      (await absolutePoints(page, 'loop')).length > 2,
      'loop routed around its terminal'
    );

    const markers = await withGraph(page, (graph) =>
      graph
        .getDefaultParent()
        .children.filter(
          (cell) => cell.id.startsWith('marker-') && graph.view.getState(cell)?.shape
        )
        .map((cell) => cell.style.endArrow)
    );
    assert.equal(markers.length, 20, 'every marker edge drawn');

    // Moving the source routes the orthogonal edge again, still without diagonal segment
    const before = await absolutePoints(page, 'orthogonal');
    await withGraph(page, (graph) =>
      graph.moveCells([graph.getDataModel().getCell('orthogonal').source], 0, 30)
    );
    const after = await absolutePoints(page, 'orthogonal');
    assert.notDeepEqual(after, before);
    assertOrthogonal(after, 'orthogonal after move');

    const roundedEdges = () =>
      withGraph(
        page,
        (graph) =>
          graph.getDefaultParent().children.filter((c) => c.isEdge() && c.style.rounded)
            .length
      );
    await click(page, 'toggle-rounded');
    assert.equal(await roundedEdges(), 32, 'all edges rounded');
    await click(page, 'toggle-rounded');
    assert.equal(await roundedEdges(), 0, 'all edges squared');
  },

  'ports: fixed points, stencil points, child ports and interactive connection': async ({
    page,
    loadDemo,
  }) => {
    assert.equal(await loadDemo('ports'), undefined);
    const constraintCounts = await withGraph(page, (graph) =>
      ['a', 'gate', 'port-1'].map(
        (id) =>
          graph.getAllConnectionConstraints(
            graph.view.getState(graph.getDataModel().getCell(id)),
            true
          )?.length ?? 0
      )
    );
    assert.deepEqual(
      constraintCounts,
      [8, 3, 0],
      'fixed points, stencil points, none on a port'
    );

    const portEdge = await withGraph(page, (graph) => {
      const edge = graph.getDataModel().getCell('port-edge-1');
      return { source: edge.source.id, sourcePort: edge.style.sourcePort };
    });
    assert.deepEqual(
      portEdge,
      { source: 'hello', sourcePort: 'port-1' },
      'edge references the port by its id'
    );
    const before = await absolutePoints(page, 'port-edge-1');
    await click(page, 'move-ports');
    const after = await absolutePoints(page, 'port-edge-1');
    const port = await pointOf(page, 'port-1', [0.5, 0.5]);
    const hello = await pointOf(page, 'hello', [0.5, 0]);
    assert.ok(
      Math.abs(port.x - hello.x) < 1 && Math.abs(port.y - hello.y) < 1,
      'port moved to the top center'
    );
    assert.notDeepEqual(after, before, 'the edge follows the port');

    // Drag from the east fixed point of C to the west fixed point of D
    const edgesBefore = await cellCount(page);
    const from = await pointOf(page, 'c', [1, 0.5]);
    const to = await pointOf(page, 'd', [0, 0.5]);
    await page.mouse.move(from.x - 30, from.y, { steps: 3 });
    await page.mouse.move(from.x - 1, from.y, { steps: 3 });
    await page.mouse.down();
    await page.mouse.move(to.x + 10, to.y, { steps: 10 });
    await page.mouse.move(to.x + 1, to.y, { steps: 3 });
    await page.mouse.up();
    assert.equal(await cellCount(page), edgesBefore + 1, 'an edge was created');
    const created = await withGraph(page, (graph) => {
      const edge = graph.getDefaultParent().children.at(-1);
      const s = edge.style;
      return [edge.source?.id, edge.target?.id, s.exitX, s.exitY, s.entryX, s.entryY];
    });
    assert.deepEqual(
      created,
      ['c', 'd', 1, 0.5, 0, 0.5],
      'connected at the fixed points'
    );
  },

  'labels: HTML, wrapping, positions, rotation, secondary labels': async ({
    page,
    loadDemo,
  }) => {
    assert.equal(await loadDemo('labels'), undefined);
    const boldCount = () =>
      withGraph(
        page,
        (graph) =>
          graph.view
            .getState(graph.getDataModel().getCell('html'))
            .text.node.querySelectorAll('b').length
      );
    assert.equal(await boldCount(), 1, 'HTML markup rendered');
    const wrap = await withGraph(page, (graph) => {
      const state = graph.view.getState(graph.getDataModel().getCell('wrap'));
      return { width: state.width, text: state.text.boundingBox.width };
    });
    assert.ok(
      wrap.text <= wrap.width + 2,
      `wrapped label fits the vertex width: ${JSON.stringify(wrap)}`
    );

    await click(page, 'toggle-html');
    assert.equal(await boldCount(), 0, 'markup shown as text once HTML labels are off');
    await click(page, 'toggle-html');
    assert.equal(await boldCount(), 1);

    await select(page, 'position-0');
    await click(page, 'label-position');
    const moved = await style(page, 'position-0');
    assert.deepEqual(
      [moved.verticalLabelPosition, moved.verticalAlign],
      ['top', 'bottom'],
      'Bottom -> Top'
    );

    await select(page, 'rotated');
    await click(page, 'rotate');
    assert.equal((await style(page, 'rotated')).rotation, 45);

    const secondary = await withGraph(
      page,
      (graph) =>
        graph
          .getDataModel()
          .getCell('with-labels')
          .children.filter(
            (c) => c.getGeometry().relative && graph.view.getState(c)?.text
          ).length
    );
    assert.equal(secondary, 2, 'two secondary labels drawn');
  },
};
