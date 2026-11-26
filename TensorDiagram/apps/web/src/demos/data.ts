import {
  type Cell,
  domUtils,
  getDefaultPlugins,
  Graph,
  ModelXmlSerializer,
  PrintPreview,
  RubberBandHandler,
  type TooltipHandler,
  xmlUtils,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';

export const data: Demo = {
  id: 'data',
  title: 'XML, user objects, SVG',
  group: 'Data',
  description:
    'Cells whose values are XML elements with attributes, one of them holding JSON, exported to and imported from XML with the ModelXmlSerializer, and the diagram exported as SVG.',
  hints: [
    'Double-click a person to edit "first last", the label is stored back into the attributes',
    'Export the XML, edit it in the text area, then import it',
    'Hover a person for the JSON data of its "data" attribute',
    'Export the SVG and download it from the link below the text area',
  ],
  mount(ctx) {
    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    graph.setTooltips(true);
    graph.setConnectable(true);

    const isPerson = (cell: Cell) => domUtils.isNode(cell.value, 'Person');

    // Labels, editing and tooltips read the attributes of the user object, on the instance only
    graph.isCellEditable = (cell) => isPerson(cell);
    graph.convertValueToString = (cell) => {
      if (isPerson(cell))
        return `${cell.getAttribute('firstName', '')} ${cell.getAttribute('lastName', '')}`.trim();
      if (domUtils.isNode(cell.value, 'Knows'))
        return `knows since ${cell.getAttribute('since', '?')}`;
      return String(cell.value ?? '');
    };
    graph.getEditingValue = (cell) => graph.convertValueToString(cell);
    const cellLabelChanged = graph.cellLabelChanged.bind(graph);
    graph.cellLabelChanged = (cell, newValue, autoSize) => {
      if (isPerson(cell) && typeof newValue === 'string') {
        const [firstName, ...lastName] = newValue.trim().split(/\s+/);
        // a clone, so that undo restores the previous element
        const element = (cell.value as Element).cloneNode(true) as Element;
        element.setAttribute('firstName', firstName ?? '');
        element.setAttribute('lastName', lastName.join(' '));
        newValue = element;
      }
      cellLabelChanged(cell, newValue, autoSize);
    };
    const tooltipHandler = graph.getPlugin<TooltipHandler>('TooltipHandler');
    if (tooltipHandler) {
      tooltipHandler.getTooltipForCell = (cell) => {
        if (!isPerson(cell)) return graph.convertValueToString(cell);
        try {
          const json = JSON.parse(cell.getAttribute('data', '{}')) as Record<
            string,
            unknown
          >;
          return Object.entries(json)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join('<br>');
        } catch {
          return 'invalid JSON in the data attribute';
        }
      };
    }

    const doc = xmlUtils.createXmlDocument();
    const person = (firstName: string, lastName: string, json: object) => {
      const element = doc.createElement('Person');
      element.setAttribute('firstName', firstName);
      element.setAttribute('lastName', lastName);
      element.setAttribute('data', JSON.stringify(json));
      return element;
    };
    const knows = (since: string) => {
      const element = doc.createElement('Knows');
      element.setAttribute('since', since);
      return element;
    };
    const personStyle = { rounded: true, fillColor: '#e0f2fe', strokeColor: '#0284c7' };
    graph.batchUpdate(() => {
      const alice = graph.insertVertex({
        value: person('Alice', 'Martin', { role: 'engineer', since: 2019 }),
        position: [40, 60],
        size: [120, 40],
        style: personStyle,
      });
      const bob = graph.insertVertex({
        value: person('Bob', 'Chen', { role: 'designer', since: 2021 }),
        position: [320, 60],
        size: [120, 40],
        style: personStyle,
      });
      const carol = graph.insertVertex({
        value: person('Carol', 'Diaz', { role: 'manager', since: 2015 }),
        position: [180, 240],
        size: [120, 40],
        style: personStyle,
      });
      graph.insertEdge({ value: knows('2021'), source: alice, target: bob });
      graph.insertEdge({ value: knows('2015'), source: bob, target: carol });
    });

    // Side panel: the XML, and the SVG export below it
    const textarea = document.createElement('textarea');
    textarea.spellcheck = false;
    textarea.dataset.role = 'xml';
    const svgOutput = document.createElement('div');
    ctx.side.append(textarea, svgOutput);

    const exportXml = () => new ModelXmlSerializer(graph.getDataModel()).export();
    const importXml = (xml: string) => {
      const parsed = xmlUtils.parseXml(xml);
      // parseXml does not throw, it returns a document holding a parsererror element
      if (parsed.getElementsByTagName('parsererror').length > 0)
        throw new Error('the text is not well-formed XML');
      new ModelXmlSerializer(graph.getDataModel()).import(parsed.documentElement);
    };

    ctx.button(
      'Export XML',
      () => {
        textarea.value = exportXml();
        ctx.log(`Exported ${textarea.value.length} characters of XML`);
      },
      'export-xml'
    );
    ctx.button(
      'Import XML',
      () => {
        try {
          importXml(textarea.value);
          ctx.log(
            `Imported, ${graph.getDefaultParent().getChildCount()} cell(s) at the top level`
          );
        } catch (error) {
          ctx.log(
            `Import failed: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      },
      'import-xml'
    );
    ctx.button(
      'Round trip',
      () => {
        const before = exportXml();
        importXml(before);
        const after = exportXml();
        textarea.value = after;
        ctx.log(
          before === after ? 'Round trip: identical XML' : 'Round trip: the XML differs'
        );
      },
      'round-trip'
    );
    ctx.button(
      'Export SVG',
      () => {
        graph.clearSelection(); // the selection handles are drawn in the same SVG
        const svg = graph.container.querySelector('svg')?.cloneNode(true) as
          SVGSVGElement | undefined;
        if (!svg) return;
        const bounds = graph.getGraphBounds();
        const border = 10;
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute(
          'viewBox',
          `${bounds.x - border} ${bounds.y - border} ${bounds.width + 2 * border} ${bounds.height + 2 * border}`
        );
        svg.setAttribute('width', String(Math.ceil(bounds.width + 2 * border)));
        svg.setAttribute('height', String(Math.ceil(bounds.height + 2 * border)));
        svg.removeAttribute('style');
        const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
        const preview = document.createElement('img');
        Object.assign(preview, { src: url, alt: 'SVG export' });
        preview.style.maxWidth = '100%';
        const link = document.createElement('a');
        Object.assign(link, {
          href: url,
          download: 'diagram.svg',
          textContent: 'Download diagram.svg',
        });
        link.dataset.role = 'svg-download';
        svgOutput.replaceChildren(preview, link);
        ctx.log(`Exported ${url.length} characters of SVG`);
      },
      'export-svg'
    );
    // Opens a new window: a button for people, never clicked by the tests
    ctx.button('Print preview', () => new PrintPreview(graph, 1).open(), 'print-preview');

    textarea.value = exportXml();
  },
};
