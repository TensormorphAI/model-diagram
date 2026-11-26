// Behaviour scenarios of the demos of src/demos/group-b.ts, merged by e2e/scenarios.mjs
import assert from 'node:assert/strict';
import { click, geometries, withGraph } from './helpers.mjs';

/** Runs `fn(cell, graph, arg)` in the page on the first cell whose value is `value`. `fn` must be self-contained. */
const onCell = (page, value, fn, arg) =>
  withGraph(
    page,
    (graph, [value, source, arg]) => {
      const cell = graph
        .getDataModel()
        .getRoot()
        .filterDescendants((c) => c.value === value)[0];
      return new Function('cell', 'graph', 'arg', `return (${source})(cell, graph, arg)`)(
        cell,
        graph,
        arg
      );
    },
    [value, fn.toString(), arg]
  );

const select = (page, ...values) =>
  withGraph(
    page,
    (graph, values) =>
      graph.setSelectionCells(
        values.map(
          (value) =>
            graph
              .getDataModel()
              .getRoot()
              .filterDescendants((c) => c.value === value)[0]
        )
      ),
    values
  );

const parentValue = (page, value) =>
  onCell(page, value, (cell) => cell.getParent().value ?? null);
const isVisible = (page, value) => onCell(page, value, (cell) => cell.isVisible());

/** Clicks the center of a cell, or of its folding icon, with the mouse. */
const clickCell = async (page, value, part = 'cell') => {
  const point = await onCell(
    page,
    value,
    (cell, graph, part) => {
      const state = graph.view.getState(cell);
      const bounds = part === 'folding' ? state.control.bounds : state;
      const rect = graph.container.getBoundingClientRect();
      return {
        x: rect.left - graph.container.scrollLeft + bounds.x + bounds.width / 2,
        y: rect.top - graph.container.scrollTop + bounds.y + bounds.height / 2,
      };
    },
    part
  );
  await page.mouse.click(point.x, point.y);
};

/** Waits for the running morph, which keeps the model update open until it is done. */
const morphDone = (page) =>
  page.waitForFunction(
    () => window.__showcase.graph.getDataModel().updateLevel === 0,
    null,
    {
      timeout: 5000,
    }
  );

export const scenarios = {
  'groups: group and ungroup the selection': async ({ page, loadDemo }) => {
    assert.equal(await loadDemo('groups'), undefined);
    await select(page, '1', '2');
    await click(page, 'group');
    assert.equal(await parentValue(page, '1'), 'Group');
    assert.equal(await parentValue(page, '2'), 'Group');
    assert.equal(
      await parentValue(page, '3'),
      null,
      '3 was not selected, it stays on the layer'
    );
    await click(page, 'ungroup');
    assert.equal(await parentValue(page, '1'), null);
    assert.equal(await parentValue(page, '2'), null);
    assert.equal(
      await onCell(page, 'Group', (cell) => cell === undefined),
      true,
      'the empty group is removed'
    );
  },

  'groups: fold with the icon and the toolbar, drill down': async ({
    page,
    loadDemo,
  }) => {
    assert.equal(await loadDemo('groups'), undefined);
    await clickCell(page, 'Inner group', 'folding');
    assert.equal(await onCell(page, 'Inner group', (cell) => cell.isCollapsed()), true);
    assert.equal(
      await onCell(page, 'A', (cell, graph) => graph.view.getState(cell) === null),
      true,
      'A is hidden'
    );
    await clickCell(page, 'Inner group', 'folding');
    assert.equal(await onCell(page, 'Inner group', (cell) => cell.isCollapsed()), false);

    await select(page, 'Outer group');
    await click(page, 'collapse');
    assert.equal(await onCell(page, 'Outer group', (cell) => cell.isCollapsed()), true);
    await click(page, 'expand');
    assert.equal(await onCell(page, 'Outer group', (cell) => cell.isCollapsed()), false);

    const currentRoot = () =>
      withGraph(page, (graph) => graph.getCurrentRoot()?.value ?? null);
    await select(page, 'Inner group');
    await click(page, 'enter-group');
    assert.equal(await currentRoot(), 'Inner group');
    assert.equal(
      await onCell(page, '1', (cell, graph) => graph.view.getState(cell) === null),
      true,
      '1 is not shown'
    );
    await click(page, 'exit-group');
    assert.equal(await currentRoot(), 'Outer group');
    await click(page, 'home');
    assert.equal(await currentRoot(), null);
  },

  'groups: clicking a constituent selects its parent': async ({ page, loadDemo }) => {
    assert.equal(await loadDemo('groups'), undefined);
    await clickCell(page, 'Part of the card');
    assert.equal(
      await withGraph(page, (graph) => graph.getSelectionCell()?.value),
      'Card'
    );
  },

  'swimlanes: move a step to the next lane, lanes stay stacked': async ({
    page,
    loadDemo,
  }) => {
    assert.equal(await loadDemo('swimlanes'), undefined);
    const stacked = () =>
      withGraph(page, (graph) => {
        const [pool1, pool2] = graph
          .getDefaultParent()
          .children.map((cell) => cell.getGeometry());
        return pool2.y === pool1.y + pool1.height;
      });
    assert.equal(await stacked(), true, 'pool 2 starts below pool 1');

    const target = 'Request\nInformation';
    const before = await onCell(page, target, (cell) => cell.getGeometry().x);
    await select(page, target);
    await click(page, 'move-to-next-lane');
    assert.equal(await parentValue(page, target), 'Lane A');
    assert.equal(
      await onCell(page, target, (cell) => cell.getParent().getParent().value),
      'Pool 2'
    );
    assert.equal(
      await onCell(page, target, (cell) => cell.getGeometry().x),
      before,
      'same place in the new lane'
    );

    // Growing a lane grows its pool and pushes the next pool down
    const pool1Height = () =>
      withGraph(
        page,
        (graph) => graph.getDefaultParent().children[0].getGeometry().height
      );
    const heightBefore = await pool1Height();
    await onCell(page, 'Lane B', (cell, graph) => {
      const bounds = cell.getGeometry().clone();
      bounds.height += 60;
      graph.resizeCell(cell, bounds);
    });
    assert.equal(await pool1Height(), heightBefore + 60);
    assert.equal(await stacked(), true, 'pool 2 moved down');
  },

  'swimlanes: show and hide the notes layer and the crossovers': async ({
    page,
    loadDemo,
  }) => {
    assert.equal(await loadDemo('swimlanes'), undefined);
    const note = 'Hide it with\nToggle notes layer';
    const layerVisible = () => onCell(page, note, (cell) => cell.getParent().isVisible());
    const noteDrawn = () =>
      onCell(page, note, (cell, graph) => graph.view.getState(cell) !== null);
    assert.equal(await layerVisible(), true);
    assert.equal(await noteDrawn(), true);
    await click(page, 'toggle-layer');
    assert.equal(await layerVisible(), false);
    assert.equal(await noteDrawn(), false);
    await click(page, 'toggle-layer');
    assert.equal(await noteDrawn(), true);

    const crossoversVisible = () =>
      withGraph(page, (graph) =>
        graph
          .getDefaultParent()
          // an edge is moved to the nearest common ancestor of its terminals, a pool here
          .filterDescendants((cell) => cell.style?.baseStyleNames?.includes('crossover'))
          .map((cell) => cell.isVisible())
          .join()
      );
    assert.equal(await crossoversVisible(), 'true,true');
    await click(page, 'toggle-crossovers');
    assert.equal(await crossoversVisible(), 'false,false');
  },

  'layouts: every layout moves the cells, inside the view': async ({
    page,
    loadDemo,
  }) => {
    assert.equal(await loadDemo('layouts'), undefined);
    let previous = await geometries(page);
    for (const action of [
      'organic',
      'circle',
      'compact-tree',
      'radial-tree',
      'stack',
      'hierarchical-west',
      'hierarchical',
    ]) {
      await click(page, action);
      await morphDone(page);
      const current = await geometries(page);
      assert.notEqual(current, previous, `${action} changes the geometries`);
      const minimum = await withGraph(page, (graph) =>
        Math.min(
          ...graph
            .getDefaultParent()
            .children.filter((c) => c.isVertex())
            .flatMap((c) => [c.getGeometry().x, c.getGeometry().y])
        )
      );
      assert.ok(
        minimum >= 0,
        `${action}: no vertex at a negative position, got ${minimum}`
      );
      previous = current;
    }
  },

  'org-chart: adding a child lays the tree out again, folding hides a subtree': async ({
    page,
    loadDemo,
  }) => {
    assert.equal(await loadDemo('org-chart'), undefined);
    const vertexCount = () =>
      withGraph(
        page,
        (graph) => graph.getDefaultParent().children.filter((c) => c.isVertex()).length
      );
    const overlaps = () =>
      withGraph(page, (graph) => {
        const boxes = graph
          .getDefaultParent()
          .children.filter((c) => c.isVertex() && c.isVisible())
          .map((c) => c.getGeometry());
        return boxes.some((a, i) =>
          boxes.some(
            (b, j) =>
              i < j &&
              a.x < b.x + b.width &&
              b.x < a.x + a.width &&
              a.y < b.y + b.height &&
              b.y < a.y + a.height
          )
        );
      });
    for (const value of ['CEO', 'CTO', 'COO']) {
      const hasIcon = await onCell(
        page,
        value,
        (cell, graph) => !!graph.view.getState(cell).control
      );
      assert.equal(hasIcon, true, `${value} shows its folding icon from the start`);
    }
    assert.equal(
      await onCell(page, 'CFO', (cell, graph) => !!graph.view.getState(cell).control),
      false
    );
    const before = await vertexCount();
    await select(page, 'CFO');
    await click(page, 'add-child');
    assert.equal(await vertexCount(), before + 1);
    const [cfoY, childY] = await withGraph(page, (graph) => [
      graph
        .getDefaultParent()
        .children.find((c) => c.value === 'CFO')
        .getGeometry().y,
      graph.getSelectionCell().getGeometry().y,
    ]);
    assert.ok(childY > cfoY, `the new report is placed below CFO: ${childY} > ${cfoY}`);
    assert.equal(await overlaps(), false, 'no two boxes overlap');

    await clickCell(page, 'CTO', 'folding');
    assert.equal(await onCell(page, 'CTO', (cell) => cell.isCollapsed()), true);
    for (const value of ['Dev lead', 'QA lead', 'Frontend', 'Backend']) {
      assert.equal(await isVisible(page, value), false, `${value} is hidden`);
    }
    assert.equal(await isVisible(page, 'Sales'), true);
    await clickCell(page, 'CTO', 'folding');
    assert.equal(await isVisible(page, 'Frontend'), true);
    assert.equal(await overlaps(), false, 'no two boxes overlap after expanding');
  },

  'navigation: zoom, fit, outline, page view and scrollbars': async ({
    page,
    loadDemo,
  }) => {
    assert.equal(await loadDemo('navigation'), undefined);
    const scale = () => withGraph(page, (graph) => graph.view.scale);
    assert.ok(
      await page.locator('#side .outline svg').count(),
      'the outline renders an SVG in the side panel'
    );
    assert.equal(
      await withGraph(
        page,
        (graph) => graph.container.scrollWidth > graph.container.clientWidth
      ),
      true,
      'the diagram overflows the container, which has scrollbars'
    );
    await click(page, 'zoom-in');
    assert.ok((await scale()) > 1);
    await click(page, 'zoom-out');
    await click(page, 'zoom-out');
    assert.ok((await scale()) < 1);
    await click(page, 'zoom-actual');
    assert.equal(await scale(), 1);
    await click(page, 'fit');
    assert.ok((await scale()) < 1, 'the diagram is larger than the container');
    assert.equal(
      await withGraph(page, (graph) => {
        const bounds = graph.getGraphBounds();
        return (
          bounds.x >= 0 &&
          bounds.y >= 0 &&
          bounds.x + bounds.width <= graph.container.clientWidth + 1
        );
      }),
      true,
      'the whole diagram is in view after fit'
    );
    await click(page, 'toggle-page-view');
    assert.equal(
      await withGraph(page, (graph) => graph.view.backgroundPageShape !== null),
      true
    );
    await click(page, 'toggle-page-view');
    assert.equal(await withGraph(page, (graph) => graph.view.backgroundPageShape), null);
  },

  'animation: morph, flowing edges and fade': async ({ page, loadDemo }) => {
    assert.equal(await loadDemo('animation'), undefined);
    const flowAnimation = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('#stage .flow-edge > path:nth-of-type(2)')]
          .map((path) => getComputedStyle(path).animationName)
          .join()
      );
    assert.equal(await flowAnimation(), 'flow-dash,flow-dash,flow-dash,flow-dash');

    const before = await geometries(page);
    await click(page, 'morph');
    assert.notEqual(await geometries(page), before);
    await morphDone(page);
    assert.equal(
      await flowAnimation(),
      'flow-dash,flow-dash,flow-dash,flow-dash',
      'still flowing after the morph'
    );

    await click(page, 'fade-out');
    await page.waitForFunction(() =>
      window.__showcase.graph
        .getDefaultParent()
        .children.some((c) => c.value === 'Filter' && !c.isVisible())
    );
    await click(page, 'fade-in');
    assert.equal(await isVisible(page, 'Filter'), true);
    await page.waitForTimeout(600);
    assert.equal(
      await onCell(
        page,
        'Filter',
        (cell, graph) => graph.view.getState(cell).shape.node.style.opacity
      ),
      '',
      'fully opaque again'
    );
    assert.equal(
      await flowAnimation(),
      'flow-dash,flow-dash,flow-dash,flow-dash',
      'edges shown again still flow'
    );
  },

  'animation: timers stop when leaving the demo': async ({ page, loadDemo }) => {
    await page.addInitScript(() => {
      const live = new Set();
      const { setInterval, clearInterval } = window;
      window.__liveIntervals = live;
      window.setInterval = (...args) => {
        const id = setInterval(...args);
        live.add(id);
        return id;
      };
      window.clearInterval = (id) => {
        live.delete(id);
        clearInterval(id);
      };
    });
    const liveIntervals = () => page.evaluate(() => window.__liveIntervals.size);
    assert.equal(await loadDemo('basics'), undefined);
    const baseline = await liveIntervals();
    assert.equal(await loadDemo('animation'), undefined);
    await click(page, 'auto-play');
    await page.waitForTimeout(1600); // the first swap starts a morph
    await click(page, 'fade-out');
    assert.ok(
      (await liveIntervals()) >= baseline + 2,
      'auto play, morph or fade running'
    );
    assert.equal(await loadDemo('basics'), undefined);
    await page.waitForTimeout(200);
    assert.equal(await liveIntervals(), baseline, 'no interval left running');
  },
};
