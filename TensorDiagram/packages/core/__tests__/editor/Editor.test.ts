/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, test } from '@jest/globals';
import { Editor, Geometry, EventObject, InternalEvent } from '../../src';
import { ModelChecker } from '../serialization/utils';
import { parseXml } from '../../src/util/xmlUtils';
import Cell from '../../src/view/cell/Cell';

describe('writeGraphModel', () => {
  test('empty model', () => {
    const editor = new Editor(null!);

    const xml = editor.writeGraphModel();
    expect(xml).toBe(
      '<GraphDataModel><root><Cell id="0"><Object as="style"/></Cell><Cell id="1" parent="0"><Object as="style"/></Cell></root></GraphDataModel>'
    );
  });

  test('non empty model, write with default linefeed', () => {
    const editor = new Editor(null!);
    editor.graph.insertVertex({
      id: 'v1',
      value: 'vertex 1\nwith linefeed',
      position: [10, 20],
      size: [30, 30],
    });

    const xml = editor.writeGraphModel();
    expect(xml).toBe(
      '<GraphDataModel><root><Cell id="0"><Object as="style"/></Cell><Cell id="1" parent="0"><Object as="style"/></Cell><Cell id="v1" value="vertex 1&#xA;with linefeed" vertex="1" parent="1"><Geometry _x="10" _y="20" _width="30" _height="30" as="geometry"/><Object as="style"/></Cell></root></GraphDataModel>'
    );
  });

  test('non empty model, write with custom linefeed', () => {
    const editor = new Editor(null!);
    editor.graph.insertVertex({
      id: 'v1',
      value: 'vertex 1\nwith linefeed\nand others\nagain',
      position: [0, 0],
      size: [20, 30],
    });

    // The linefeed parameter should be removed from the method signature
    // In TensorDiagram, the getXml function ignores the linefeed as it always uses XmlSerializer
    // In mxGraph, it was only taken into account in Internet Explorer which used a custom serialization code
    // The test here has been written prior switching the writeGraphModel implementation from direct Codec usage to ModelXmlSerializer
    const xml = editor.writeGraphModel('LF');
    expect(xml).toBe(
      '<GraphDataModel><root><Cell id="0"><Object as="style"/></Cell><Cell id="1" parent="0"><Object as="style"/></Cell><Cell id="v1" value="vertex 1&#xA;with linefeed&#xA;and others&#xA;again" vertex="1" parent="1"><Geometry _width="20" _height="30" as="geometry"/><Object as="style"/></Cell></root></GraphDataModel>'
    );
  });
});

test('readGraphModel', () => {
  const editor = new Editor(null!);

  const xmlDocument = parseXml(
    `<GraphDataModel>
  <root>
    <Cell id="0">
      <Object as="style" />
    </Cell>
    <Cell id="1" parent="0">
      <Object as="style" />
    </Cell>
    <Cell id="v1" value="vertex 1" vertex="1" parent="1">
      <Geometry _x="100" _y="100" _width="100" _height="80" as="geometry" />
      <Object fillColor="green" strokeWidth="4" as="style" />
    </Cell>
  </root>
</GraphDataModel>`
  );

  editor.readGraphModel(xmlDocument.documentElement);
  const model = editor.graph.model;

  const modelChecker = new ModelChecker(model);
  modelChecker.checkRootCells();

  modelChecker.expectIsVertex(model.getCell('v1'), 'vertex 1', {
    geometry: new Geometry(100, 100, 100, 80),
    style: {
      fillColor: 'green',
      strokeWidth: 4,
    },
  });
});

describe('cycleAttribute', () => {
  test('nullish cycleAttributeName, so untouched style', () => {
    const editor = new Editor(null!);
    editor.cycleAttributeName = null!; // force nullish value

    const cell = new Cell();
    const originalStyle = { ...cell.getStyle() };
    editor.cycleAttribute(cell);
    expect(cell.getStyle()).toEqual(originalStyle);
  });

  test('default cycleAttributeName, consumeCycleAttribute returns a value', () => {
    const editor = new Editor(null!);
    editor.consumeCycleAttribute = () => {
      return 'orange'; // simulate for test
    };

    const cell = new Cell();
    cell.getStyle().strokeColor = 'yellow';
    const originalStyle = { ...cell.getStyle() };
    expect(cell.getStyle().fillColor).toBeUndefined();
    editor.cycleAttribute(cell);
    expect(cell.getStyle()).toEqual({ ...originalStyle, fillColor: 'orange' });
  });

  test('default cycleAttributeName, consumeCycleAttribute returns no value', () => {
    const editor = new Editor(null!);
    editor.consumeCycleAttribute = () => {
      return undefined; // simulate for test
    };

    const cell = new Cell();
    cell.getStyle().fillColor = 'yellow';
    const originalStyle = { ...cell.getStyle() };
    editor.cycleAttribute(cell);
    expect(cell.getStyle()).toEqual(originalStyle);
  });
});

describe('installDblClickHandler', () => {
  test('double-click handler has correct editor context', () => {
    const editor = new Editor(null!);
    const mockExecute = jest.fn();
    editor.execute = mockExecute;
    editor.dblClickAction = 'testAction';

    // Create a container element for the graph
    const container = document.createElement('div');
    document.body.appendChild(container);
    editor.setGraphContainer(container);

    // Create a test cell
    const cell = editor.graph.insertVertex({
      value: 'test',
      position: [10, 10],
      size: [100, 100],
    });

    // Fire the DOUBLE_CLICK event with proper EventObject
    const eventObj = new EventObject(InternalEvent.DOUBLE_CLICK, { cell, event: {} });
    editor.graph.fireEvent(eventObj);

    // Verify that execute was called on the editor instance with the correct action and cell
    expect(mockExecute).toHaveBeenCalledWith('testAction', cell);

    // Clean up
    container.remove();
  });
});

describe('destroy', () => {
  test('clears eventListeners', () => {
    const editor = new Editor(null!);
    editor.addListener('testEvent', () => {});
    expect(editor.eventListeners.length).toBeGreaterThan(0);

    editor.destroy();

    expect(editor.eventListeners).toHaveLength(0);
  });
});
