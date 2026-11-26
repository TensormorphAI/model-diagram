/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, test } from '@jest/globals';
import { Codec, type EditorToolbar } from '../../../../src';
import { EditorToolbarCodec } from '../../../../src/serialization/codec/editor/EditorToolbarCodec';
import { parseXml } from '../../../../src/util/xmlUtils';

const createToolbar = () => {
  const addedOptions: (string | null)[][] = [];
  const toolbar = {
    editor: { templates: {} },
    toolbar: {},
    addActionCombo: () => 'action combo',
    addCombo: () => document.createElement('select'),
    addPrototype: () => document.createElement('img'),
    addOption: (combo: unknown, label: string, value?: string | null) => {
      addedOptions.push([
        combo instanceof HTMLSelectElement ? 'combo' : String(combo),
        label,
        value ?? null,
      ]);
      return document.createElement('option');
    },
    addActionOption: (combo: unknown, label: string, action: string) => {
      addedOptions.push([String(combo), label, action]);
    },
  } as unknown as EditorToolbar;
  return { toolbar, addedOptions };
};

const decode = (xml: string) => {
  const { toolbar, addedOptions } = createToolbar();
  const doc = parseXml(xml);
  new EditorToolbarCodec().decode(new Codec(doc), doc.documentElement, toolbar);
  return addedOptions;
};

describe('decode', () => {
  test.each([
    [
      'an action combo',
      '<EditorToolbar><add as="actions"><add as="Save" action="save"/><separator/><add as="Open" action="open"/></add></EditorToolbar>',
      [
        ['action combo', 'Save', 'save'],
        ['action combo', '---', null],
        ['action combo', 'Open', 'open'],
      ],
    ],
    [
      'a template combo',
      '<EditorToolbar><add as="shapes" icon="shapes.gif"><add as="Box" template="box"/><separator/><add as="Ellipse" template="ellipse"/></add></EditorToolbar>',
      [
        ['combo', 'Box', 'box'],
        ['combo', '---', null],
        ['combo', 'Ellipse', 'ellipse'],
      ],
    ],
  ])('add every entry of %s', (_description, xml, expectedOptions) => {
    expect(decode(xml)).toEqual(expectedOptions);
  });
});
