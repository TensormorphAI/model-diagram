/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { afterEach, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { createBaseGraph, createGraphWithoutContainer } from '../../utils';
import {
  type AbstractGraph,
  getDefaultPlugins,
  ImageBox,
  Multiplicity,
  Rectangle,
  registerCoreCodecs,
  unregisterAllCodecs,
} from '../../../src';
import { exportObject, importToObject } from './shared';

// Prevents side effects between tests
beforeAll(() => {
  unregisterAllCodecs();
});
beforeEach(() => {
  registerCoreCodecs();
});
afterEach(() => {
  unregisterAllCodecs();
});

function buildXml(name: string): string {
  const xmlTemplate = `<@NAME@>
  <Object as="alternateEdgeStyle" />
  <Array as="cells" />
  <Array as="mouseListeners">
    <Object />
    <Object />
  </Array>
  <Array as="multiplicities">
    <Multiplicity type="rectangle" source="1" max="2" countError="Only 2 targets allowed" typeError="Only circle targets allowed">
      <Array as="validNeighbors">
        <add value="circle" />
      </Array>
    </Multiplicity>
  </Array>
  <Object foldingEnabled="1" collapseToPreferredSize="1" as="options">
    <ImageBox src="./collapsed-new.gif" width="10" height="10" as="collapsedImage" />
    <ImageBox src="./expanded.gif" width="9" height="9" as="expandedImage" />
  </Object>
  <Rectangle _x="123" _y="453" _width="60" _height="60" as="pageFormat" />
  <ImageBox src="./warning.gif" width="16" height="16" as="warningImage" />
  <GraphDataModel as="model">
    <root>
      <Cell id="0">
        <Object as="style" />
      </Cell>
      <Cell id="1" parent="0">
        <Object as="style" />
      </Cell>
    </root>
  </GraphDataModel>
  <Stylesheet as="stylesheet">
    <add as="defaultVertex">
      <add value="rectangle" as="shape" />
      <add value="rectanglePerimeter" as="perimeter" />
      <add value="middle" as="verticalAlign" />
      <add value="center" as="align" />
      <add value="#C3D9FF" as="fillColor" />
      <add value="#6482B9" as="strokeColor" />
      <add value="#774400" as="fontColor" />
    </add>
    <add as="defaultEdge">
      <add value="connector" as="shape" />
      <add value="classic" as="endArrow" />
      <add value="middle" as="verticalAlign" />
      <add value="center" as="align" />
      <add value="#6482B9" as="strokeColor" />
      <add value="#446299" as="fontColor" />
    </add>
  </Stylesheet>
</@NAME@>
`;

  return xmlTemplate.replace(/@NAME@/g, name);
}

describe.each([
  [
    'Graph',
    () => createGraphWithoutContainer(), // This graph uses default plugins
  ],
  ['BaseGraph', () => createBaseGraph({ plugins: getDefaultPlugins() })],
])('%s', (name, graphFactory: () => AbstractGraph) => {
  test('Export', () => {
    const graph = graphFactory();

    graph.multiplicities.push(
      new Multiplicity(
        true,
        'rectangle',
        null,
        null,
        0,
        2,
        ['circle'],
        'Only 2 targets allowed',
        'Only circle targets allowed'
      )
    );

    // override defaults to ensure it is taken into account
    graph.pageFormat = new Rectangle(123, 453, 60, 60);
    graph.options.collapsedImage = new ImageBox('./collapsed-new.gif', 10, 10);

    expect(exportObject(graph)).toBe(buildXml(name));
  });

  test('Import', () => {
    const graph = graphFactory();
    // check default values that will be overridden by the import
    expect(graph.pageFormat).toEqual(new Rectangle(0, 0, 827, 1169));
    expect(graph.options.collapsedImage).toEqual(new ImageBox('./collapsed.gif', 9, 9));

    importToObject(graph, buildXml(name));

    // new values due to import
    expect(graph.pageFormat).toEqual(new Rectangle(123, 453, 60, 60));
    expect(graph.options.collapsedImage).toEqual(
      new ImageBox('./collapsed-new.gif', 10, 10)
    );
  });
});
