import {
  type FitPlugin,
  getDefaultPlugins,
  Graph,
  RubberBandHandler,
} from '@tensormorph/tensordiagramcore';
import { drawDiagram } from '../modelviz/diagram.js';
import {
  type DiagramSpec,
  readSafetensorsHeader,
  samples,
  toDiagram,
} from '../modelviz/spec.js';
import { exportSvg } from '../svg-export.js';
import type { Demo } from '../types.js';

const billions = (n: number) => `${(n / 1e9).toFixed(2)}B (${n.toLocaleString('en-US')})`;

export const modelViz: Demo = {
  id: 'model-viz',
  title: 'Model architecture editor',
  group: 'Applications',
  description:
    'Turns a Hugging Face config.json, the header of a .safetensors weights file, or a diagram spec into the model architecture diagram of the design template, drawn with editable cells. See apps/web/MASTER_ARCHITECTURE.md.',
  hints: [
    'Pick a sample, or open a config.json or a .safetensors file: only its header is read, never the weights',
    'Edit the JSON on the right, then Render. "Show spec" turns it into the diagram spec, to add or change boxes and panels by hand',
    'Drag a zoom panel or the model frame to move it with its content, double-click a box to relabel it',
  ],
  mount(ctx) {
    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    graph.setHtmlLabels(true);
    graph.setPanning(true);
    const fitPlugin = graph.getPlugin<FitPlugin>('fit');
    if (fitPlugin) fitPlugin.maxFitScale = 1;

    const select = document.createElement('select');
    select.dataset.role = 'sample';
    select.append(
      ...Object.keys(samples).map((name) =>
        Object.assign(document.createElement('option'), {
          value: name,
          textContent: name,
        })
      )
    );
    const file = Object.assign(document.createElement('input'), {
      type: 'file',
      accept: '.json,.safetensors',
    });
    const source = Object.assign(document.createElement('textarea'), {
      spellcheck: false,
    });
    source.dataset.role = 'source';
    const facts = document.createElement('p');
    facts.className = 'facts';
    facts.dataset.role = 'facts';
    const output = document.createElement('div');
    ctx.side.append(select, file, source, facts, output);

    let name = select.value;
    let current: DiagramSpec | undefined;

    const render = () => {
      let result;
      try {
        result = toDiagram(JSON.parse(source.value), name);
      } catch (error) {
        ctx.log(
          `Render failed: ${error instanceof Error ? error.message : String(error)}`
        );
        return; // the previous diagram stays
      }
      const { diagram, arch } = result;
      try {
        graph.batchUpdate(() => {
          graph.removeCells(graph.getDefaultParent().children, true);
          drawDiagram(graph, diagram);
        });
      } catch (error) {
        ctx.log(`Draw failed: ${error instanceof Error ? error.message : String(error)}`);
        // the failed draw already removed the cells: put the previous diagram back
        if (current) {
          const previous = current;
          graph.batchUpdate(() => {
            graph.removeCells(graph.getDefaultParent().children, true);
            drawDiagram(graph, previous);
          });
        }
        return;
      }
      current = diagram;
      fitPlugin?.fit({ margin: 20 });
      facts.textContent = arch
        ? [
            `Total ${billions(arch.totalParams)} params (${arch.exact ? 'exact for this weights file' : 'estimated from the config'})`,
            arch.activeParams != null &&
              arch.moe &&
              `active ${billions(arch.activeParams)}`,
            arch.kvCacheBytesPerToken &&
              `KV cache ${Math.round(arch.kvCacheBytesPerToken / 1024)} KiB per token (fp16)`,
          ]
            .filter(Boolean)
            .join(' · ')
        : 'Drawn from a diagram spec';
      ctx.log(
        `Rendered ${diagram.title}: ${graph.getDefaultParent().getChildCount()} top-level cells`
      );
    };

    const loadSample = () => {
      name = select.value;
      source.value = JSON.stringify(samples[name], null, 2);
      render();
    };
    select.addEventListener('change', loadSample);
    file.addEventListener('change', async () => {
      const picked = file.files?.[0];
      if (!picked) return;
      name = picked.name.replace(/(\.safetensors|\.json)$/, '');
      try {
        source.value = picked.name.endsWith('.safetensors')
          ? JSON.stringify(await readSafetensorsHeader(picked), null, 1)
          : await picked.text();
      } catch (error) {
        ctx.log(
          `Could not read ${picked.name}: ${error instanceof Error ? error.message : String(error)}`
        );
        return;
      }
      render();
    });

    ctx.button('Render', render, 'render');
    ctx.button(
      'Show spec',
      () => {
        if (current) source.value = JSON.stringify(current, null, 2);
      },
      'show-spec'
    );
    ctx.button('Fit', () => fitPlugin?.fit({ margin: 20 }), 'fit');
    ctx.button(
      'Export SVG',
      () => {
        const url = exportSvg(graph);
        if (!url) return;
        const link = Object.assign(document.createElement('a'), {
          href: url,
          download: `${name}.svg`,
          textContent: `Download ${name}.svg`,
        });
        link.dataset.role = 'svg-download';
        output.replaceChildren(link);
      },
      'export-svg'
    );

    loadSample();
  },
};
