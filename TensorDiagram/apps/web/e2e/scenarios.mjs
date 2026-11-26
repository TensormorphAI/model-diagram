// Behaviour scenarios of the showcase, run by e2e/smoke.mjs. Each one gets a fresh page and throws to fail.
// They drive the real UI (the toolbar buttons carry a data-action attribute) and read the graph exposed by the app
// as window.__showcase.graph.
import assert from 'node:assert/strict';
import { scenarios as scenariosA } from './scenarios-a.mjs';
import { scenarios as scenariosB } from './scenarios-b.mjs';
import { scenarios as scenariosC } from './scenarios-c.mjs';
import { cellCount, click } from './helpers.mjs';

export const scenarios = {
  ...scenariosA,
  ...scenariosB,
  ...scenariosC,

  'basics: add, delete with the toolbar': async ({ page, loadDemo }) => {
    assert.equal(await loadDemo('basics'), undefined);
    const before = await cellCount(page);
    await click(page, 'add-vertex');
    assert.equal(await cellCount(page), before + 1);
    await click(page, 'delete');
    assert.equal(await cellCount(page), before);
  },

  // Switching demos must release everything. A KeyHandler, an Outline or a graph not destroyed keeps its listeners on
  // the document or the window: they are counted with the DevTools protocol, the only way to see them from outside.
  'switching demos releases the previous one': async ({ page, loadDemo, demoIds }) => {
    const cdp = await page.context().newCDPSession(page);
    const listenerCount = async () => {
      let total = 0;
      for (const expression of [
        'window',
        'document',
        'document.documentElement',
        'document.body',
      ]) {
        const { result } = await cdp.send('Runtime.evaluate', { expression });
        const { listeners } = await cdp.send('DOMDebugger.getEventListeners', {
          objectId: result.objectId,
        });
        total += listeners.length;
      }
      return total;
    };

    assert.equal(await loadDemo('basics'), undefined);
    const baseline = await listenerCount();
    for (let round = 0; round < 3; round++) {
      for (const id of demoIds) assert.equal(await loadDemo(id), undefined, `demo ${id}`);
    }
    assert.equal(await loadDemo('basics'), undefined);
    assert.equal(
      await listenerCount(),
      baseline,
      'listeners on window, document, html and body after 3 rounds of all demos'
    );
    assert.equal(await page.locator('#stage .graph-container').count(), 1);
    assert.equal(await page.locator('#stage svg').count(), 1, 'a single graph SVG');
    await click(page, 'add-vertex');
    const x = () =>
      page.evaluate(() => window.__showcase.graph.getSelectionCell().getGeometry().x);
    const before = await x();
    await page.locator('#stage .graph-container').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await x(), before + 10, 'one arrow key press moves the selection once');
    assert.equal(
      await page.locator('.mxPopupMenu, .mxTooltip, .mxWindow').count(),
      0,
      'no popup menu, tooltip or window left over'
    );
  },
};
