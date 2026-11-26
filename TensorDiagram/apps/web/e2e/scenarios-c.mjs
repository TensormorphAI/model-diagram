// Behaviour scenarios of the demos of src/demos/group-c.ts, merged by e2e/scenarios.mjs
import assert from 'node:assert/strict';
import { cellCount, click, withGraph } from './helpers.mjs';

/** Page coordinates of the center of the top-level cell whose label is `label`. */
const cellCenter = (page, label) =>
  withGraph(
    page,
    (graph, text) => {
      const cell = graph
        .getDefaultParent()
        .children.find((c) => graph.convertValueToString(c) === text);
      const state = graph.view.getState(cell);
      const rect = graph.container.getBoundingClientRect();
      return { x: rect.left + state.getCenterX(), y: rect.top + state.getCenterY() };
    },
    label
  );

/** Page coordinates of a point of the container, `x` and `y` in graph units at scale 1. */
const containerPoint = async (page, x, y) => {
  const box = await page.locator('#stage .graph-container').boundingBox();
  return { x: box.x + x, y: box.y + y };
};

const logText = (page) => page.locator('#log').innerText();

export const scenarios = {
  'editing: undo restores a delete, redo removes again': async ({ page, loadDemo }) => {
    assert.equal(await loadDemo('editing'), undefined);
    const before = await cellCount(page);
    await click(page, 'select-all');
    await click(page, 'delete');
    assert.equal(await cellCount(page), 0);
    await click(page, 'undo');
    assert.equal(await cellCount(page), before, 'undo');
    await click(page, 'redo');
    assert.equal(await cellCount(page), 0, 'redo');
    await click(page, 'undo');
    assert.equal(await cellCount(page), before, 'undo again');
    await click(page, 'undo');
    assert.equal(await cellCount(page), before, 'the initial cells are not undoable');
  },

  'editing: copy/paste with buttons and keys, undo with Ctrl+Z': async ({
    page,
    loadDemo,
  }) => {
    assert.equal(await loadDemo('editing'), undefined);
    const before = await cellCount(page);
    await click(page, 'select-all');
    await click(page, 'copy');
    await click(page, 'paste');
    assert.equal(await cellCount(page), 2 * before, 'paste with the button');
    await click(page, 'paste');
    assert.equal(await cellCount(page), 3 * before, 'second paste');

    await page.locator('#stage .graph-container').focus();
    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+z');
    assert.equal(await cellCount(page), before, 'Ctrl+Z twice');
    await withGraph(page, (graph) =>
      graph.setSelectionCell(graph.getDefaultParent().getChildAt(0))
    );
    await page.keyboard.press('Control+x');
    assert.equal(
      await cellCount(page),
      before - 2,
      'Ctrl+X removes the vertex and its edge'
    );
    await page.keyboard.press('Control+v');
    assert.equal(await cellCount(page), before - 1, 'Ctrl+V pastes the vertex only');
    await click(page, 'duplicate');
    assert.equal(await cellCount(page), before, 'duplicate');
  },

  'interaction: context menu opens on right click and closes after an item': async ({
    page,
    loadDemo,
  }) => {
    assert.equal(await loadDemo('interaction'), undefined);
    const before = await cellCount(page);
    const background = await containerPoint(page, 600, 60);
    await page.mouse.click(background.x, background.y, { button: 'right' });
    const menu = page.locator('div.mxPopupMenu');
    await menu.waitFor({ timeout: 2000 });
    await menu.locator('tr.mxPopupMenuItem', { hasText: 'Add vertex here' }).click();
    assert.equal(await menu.count(), 0, 'menu closed');
    assert.equal(await cellCount(page), before + 1, 'vertex added by the menu item');

    // on a vertex, the menu offers the cell items
    const db = await cellCenter(page, 'Database');
    await page.mouse.click(db.x, db.y, { button: 'right' });
    await menu.waitFor({ timeout: 2000 });
    await menu.locator('tr.mxPopupMenuItem', { hasText: 'Toggle warning' }).click();
    assert.equal(await menu.count(), 0, 'menu closed');
    const overlays = await withGraph(page, (graph) =>
      graph
        .getDefaultParent()
        .children.map((c) => graph.getCellOverlays(c).length)
        .reduce((a, b) => a + b, 0)
    );
    assert.equal(overlays, 0, 'the warning of Database was toggled off');
  },

  'interaction: overlays toggled from the toolbar, hover icons shown': async ({
    page,
    loadDemo,
  }) => {
    assert.equal(await loadDemo('interaction'), undefined);
    await withGraph(page, (graph) =>
      graph.setSelectionCells(
        graph.getDefaultParent().children.filter((c) => c.isVertex())
      )
    );
    await click(page, 'toggle-warning');
    const overlays = await withGraph(page, (graph) =>
      graph.getDefaultParent().children.map((c) => graph.getCellOverlays(c).length)
    );
    assert.equal(
      overlays.reduce((a, b) => a + b, 0),
      2,
      'Web and API get a warning, Database loses its own'
    );

    const web = await cellCenter(page, 'Web');
    await page.mouse.move(web.x, web.y, { steps: 4 });
    await page.locator('img.hover-icon[data-icon="delete"]').click();
    assert.equal(
      await page.locator('img.hover-icon').count(),
      0,
      'icons hidden after use'
    );
    assert.ok(
      !(await withGraph(page, (graph) =>
        graph
          .getDefaultParent()
          .children.some((c) => graph.convertValueToString(c) === 'Web')
      )),
      'Web deleted'
    );
  },

  'palette: drag a shape onto the graph and into the container': async ({
    page,
    loadDemo,
  }) => {
    assert.equal(await loadDemo('palette'), undefined);
    const drag = async (shape, target) => {
      const box = await page.locator(`.palette [data-shape="${shape}"]`).boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(target.x, target.y, { steps: 8 });
      await page.mouse.up();
    };
    const before = await cellCount(page);
    await drag('ellipse', await containerPoint(page, 150, 400));
    assert.equal(await cellCount(page), before + 1, 'dropped on the background');
    assert.equal(
      await page.locator('div[style*="dashed"]').count(),
      0,
      'no preview left'
    );

    await drag('rhombus', await containerPoint(page, 470, 150));
    assert.equal(await cellCount(page), before + 1, 'not added at the top level');
    const children = await withGraph(page, (graph) =>
      graph
        .getDefaultParent()
        .children.find((c) => c.value === 'Container')
        .children.map((c) => c.getGeometry())
        .map((g) => ({ x: g.x, y: g.y, right: g.x + g.width, bottom: g.y + g.height }))
    );
    assert.equal(children.length, 1, 'dropped into the container');
    const [g] = children;
    // relative to the container, which is 260 x 220
    assert.ok(
      g.x >= 0 && g.y >= 0 && g.right <= 260 && g.bottom <= 220,
      JSON.stringify(g)
    );

    await page.locator('.palette [data-shape="triangle"]').click();
    assert.equal(await cellCount(page), before + 2, 'click to insert');
    await click(page, 'insert-shape');
    assert.equal(await cellCount(page), before + 3, 'toolbar button');
  },

  'validation: an invalid edge is reported': async ({ page, loadDemo }) => {
    assert.equal(await loadDemo('validation'), undefined);
    const warnings = () =>
      withGraph(page, (graph) =>
        graph
          .getDefaultParent()
          .children.flatMap((c) => graph.getCellOverlays(c).map((o) => o.tooltip))
      );
    assert.deepEqual(await warnings(), [], 'the initial graph is valid');
    await click(page, 'add-invalid-edge');
    await click(page, 'validate');
    await click(page, 'validate');
    const edgeWarnings = await withGraph(page, (graph) => {
      const edge = graph
        .getDefaultParent()
        .children.find(
          (c) => c.isEdge() && c.getTerminal(false).value.nodeName === 'Subtarget'
        );
      return graph.getCellOverlays(edge).map((o) => o.tooltip);
    });
    assert.equal(
      edgeWarnings.length,
      1,
      'a single warning overlay after several validations'
    );
    assert.match(edgeWarnings[0], /Source must connect to a Target/);
    assert.match(await logText(page), /error\(s\)/);

    // The connection handlers ask the same question before connecting
    const refused = await withGraph(page, (graph) => {
      const vertices = graph.getDefaultParent().children.filter((c) => c.isVertex());
      const source = vertices.find((c) => c.value.nodeName === 'Source');
      const subtarget = vertices.find((c) => c.value.nodeName === 'Subtarget');
      return graph.getEdgeValidationError(null, source, subtarget);
    });
    assert.match(refused ?? '', /Source must connect to a Target/);
  },

  'data: XML export, import, export is identical and keeps the user objects': async ({
    page,
    loadDemo,
  }) => {
    assert.equal(await loadDemo('data'), undefined);
    const textarea = page.locator('textarea[data-role="xml"]');
    const before = await cellCount(page);
    await click(page, 'export-xml');
    const first = await textarea.inputValue();
    assert.match(first, /<Person [^>]*firstName="Alice"/);
    await click(page, 'import-xml');
    assert.equal(await cellCount(page), before, 'import replaces the model');
    await click(page, 'export-xml');
    assert.equal(await textarea.inputValue(), first, 'identical XML');

    const values = await withGraph(page, (graph) =>
      graph
        .getDefaultParent()
        .children.map((c) =>
          c.value && c.value.nodeType === 1
            ? `${c.value.nodeName}:${graph.convertValueToString(c)}:${c.getAttribute('data', '')}`
            : typeof c.value
        )
    );
    assert.deepEqual(values.slice(0, 3), [
      'Person:Alice Martin:{"role":"engineer","since":2019}',
      'Person:Bob Chen:{"role":"designer","since":2021}',
      'Person:Carol Diaz:{"role":"manager","since":2015}',
    ]);
    assert.ok(
      values.slice(3).every((v) => v.startsWith('Knows:')),
      values.join()
    );

    await click(page, 'round-trip');
    assert.match(await logText(page), /Round trip: identical XML/);

    // a label edit stays an XML element
    const label = await withGraph(page, (graph) => {
      const cell = graph.getDefaultParent().getChildAt(0);
      graph.cellLabelChanged(cell, 'Dana Lee', false);
      return `${cell.value.nodeName}:${cell.getAttribute('firstName')}`;
    });
    assert.equal(label, 'Person:Dana');

    await textarea.fill('<not xml');
    await click(page, 'import-xml');
    assert.match(await logText(page), /Import failed/);
    assert.equal(await cellCount(page), before, 'bad XML leaves the model alone');

    await click(page, 'export-svg');
    const href = await page.locator('[data-role="svg-download"]').getAttribute('href');
    assert.ok(href.startsWith('data:image/svg+xml'), href.slice(0, 40));
    assert.match(decodeURIComponent(href), /Bob Chen/);
  },

  'events: clicks, zoom, fold and mouse moves are counted': async ({
    page,
    loadDemo,
  }) => {
    assert.equal(await loadDemo('events'), undefined);
    const counter = async (type) =>
      Number(
        (await page
          .locator(`[data-event="${type}"]`)
          .textContent({ timeout: 1000 })
          .catch(() => '0')) || 0
      );
    const target = await cellCenter(page, 'Click me');
    await page.mouse.click(target.x, target.y);
    assert.equal(await counter('click'), 1);
    assert.equal(await counter('selectionChange'), 1);
    await click(page, 'zoom-in');
    assert.ok(
      (await counter('scale')) + (await counter('scaleAndTranslate')) >= 1,
      'zoom'
    );
    await click(page, 'zoom-actual');
    await withGraph(page, (graph) =>
      graph.foldCells(true, false, [
        graph.getDefaultParent().children.find((c) => c.value === 'Group'),
      ])
    );
    assert.equal(await counter('cellsFolded'), 1);
    await click(page, 'add-vertex');
    assert.equal(await counter('cellsAdded'), 1);

    const start = await containerPoint(page, 500, 400);
    await page.mouse.move(start.x, start.y);
    await page.mouse.move(start.x + 100, start.y + 50, { steps: 30 });
    const moves = await counter('mouseMove');
    // Chrome coalesces some of the 30 moves
    assert.ok(moves >= 10, `mouseMove counted ${moves}`);
    const logged = (await logText(page)).match(/mouseMove \(throttled\)/g)?.length ?? 0;
    assert.ok(logged < moves / 3, `mouseMove logged ${logged} times for ${moves} moves`);
  },
};
