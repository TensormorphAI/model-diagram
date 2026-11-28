// Behaviour scenarios of the showcase, run by e2e/smoke.mjs. Each one gets a fresh page and throws to fail.
// They drive the real UI (the toolbar buttons carry a data-action attribute) and read the graph exposed by the app
// as window.__showcase.graph.
import assert from 'node:assert/strict';
import { scenarios as scenariosA } from './scenarios-a.mjs';
import { scenarios as scenariosB } from './scenarios-b.mjs';
import { scenarios as scenariosC } from './scenarios-c.mjs';
import { cellCount, click, withGraph } from './helpers.mjs';

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

  'model-viz: configs and a weights header become diagrams, the spec round-trips':
    async ({ page, loadDemo }) => {
      assert.equal(await loadDemo('model-viz'), undefined);
      const facts = () => page.locator('[data-role="facts"]').innerText();
      const labels = () =>
        withGraph(page, (graph) =>
          graph
            .getDefaultParent()
            .getDescendants()
            .map((cell) => String(cell.value ?? ''))
            .join('\n')
        );
      // the llmviz ground truths: Llama-3-8B 8.03B, DeepSeek-V3 671B total / 37.5B active
      assert.match(await facts(), /^Total 8\.03B .*estimated/);
      await page.selectOption('[data-role="sample"]', 'DeepSeek-V3');
      assert.match(await facts(), /Total 671\.03B .* active 37\.55B/);
      assert.match(await labels(), /Multi-head latent attention/);
      await page.selectOption('[data-role="sample"]', 'Qwen3-235B-A22B');
      assert.match(await labels(), /Router/);

      // a safetensors header: the total is the exact sum of the shapes
      const header = { __metadata__: { format: 'pt' } };
      const tensor = (name, ...shape) =>
        (header[name] = { dtype: 'BF16', shape, data_offsets: [0, 0] });
      tensor('model.embed_tokens.weight', 1000, 64);
      tensor('lm_head.weight', 1000, 64);
      tensor('model.norm.weight', 64);
      for (const i of [0, 1]) {
        const l = `model.layers.${i}.`;
        tensor(`${l}self_attn.q_proj.weight`, 64, 64);
        tensor(`${l}self_attn.k_proj.weight`, 32, 64);
        tensor(`${l}self_attn.v_proj.weight`, 32, 64);
        tensor(`${l}self_attn.o_proj.weight`, 64, 64);
        tensor(`${l}self_attn.q_norm.weight`, 16);
        tensor(`${l}mlp.gate_proj.weight`, 128, 64);
        tensor(`${l}mlp.up_proj.weight`, 128, 64);
        tensor(`${l}mlp.down_proj.weight`, 64, 128);
        tensor(`${l}input_layernorm.weight`, 64);
        tensor(`${l}post_attention_layernorm.weight`, 64);
      }
      const total = Object.values(header)
        .filter((t) => t.shape)
        .reduce((sum, t) => sum + t.shape.reduce((p, d) => p * d, 1), 0);
      await page.locator('[data-role="source"]').fill(JSON.stringify(header));
      await click(page, 'render');
      assert.match(
        await facts(),
        new RegExp(`\\(${total.toLocaleString('en-US')}\\) params \\(exact`)
      );
      assert.match(
        await labels(),
        /Masked grouped-query attention/,
        '4 query heads, 2 KV heads of 16'
      );

      // the same header in a real .safetensors file: 8 bytes of little-endian length, the JSON, then the data
      const json = JSON.stringify(header);
      const buffer = Buffer.alloc(8 + Buffer.byteLength(json) + 16);
      buffer.writeBigUInt64LE(BigInt(Buffer.byteLength(json)));
      buffer.write(json, 8);
      await page.locator('input[type="file"]').setInputFiles({
        name: 'tiny.safetensors',
        mimeType: 'application/octet-stream',
        buffer,
      });
      await page.waitForFunction(() =>
        /Rendered tiny:/.test(document.querySelector('#log').textContent)
      );
      assert.match(
        await facts(),
        new RegExp(`\\(${total.toLocaleString('en-US')}\\) params \\(exact`)
      );

      // dragging the frame moves the residuals inside it, dragging a panel moves its output stub
      const [residualShift, stubShift, expected] = await withGraph(page, (graph) => {
        const root = graph.getDefaultParent();
        const cells = root.getDescendants();
        const residual = cells.find(
          (c) => c.isEdge() && c.parent !== root && c.getGeometry().points?.length === 2
        );
        const stub = cells.find((c) => c.isEdge() && c.source && !c.target);
        const points = (edge) => graph.view.getState(edge).absolutePoints;
        const residualX = () => points(residual)[1].x;
        const stubX = () => points(stub).at(-1).x;
        const before = [residualX(), stubX()];
        graph.moveCells([residual.parent.parent], 40, 0); // block -> frame
        graph.moveCells([stub.parent], 40, 0); // the panel
        return [residualX() - before[0], stubX() - before[1], 40 * graph.view.scale];
      });
      assert.ok(
        Math.abs(residualShift - expected) < 0.01,
        `residual moved by ${residualShift}`
      );
      assert.ok(
        Math.abs(stubShift - expected) < 0.01,
        `panel stub moved by ${stubShift}`
      );

      // the diagram spec renders back to the same diagram, and a broken JSON keeps the diagram
      const before = await cellCount(page);
      await click(page, 'show-spec');
      assert.match(await page.locator('[data-role="source"]').inputValue(), /"blocks"/);
      await click(page, 'render');
      assert.equal(await cellCount(page), before, 'spec round trip');
      await page.locator('[data-role="source"]').fill('{ not json');
      await click(page, 'render');
      assert.equal(await cellCount(page), before, 'a parse error keeps the diagram');
      assert.match(await page.locator('#log').innerText(), /Render failed/);
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
