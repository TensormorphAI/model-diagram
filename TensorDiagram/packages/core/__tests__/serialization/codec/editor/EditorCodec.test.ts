/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, jest, test } from '@jest/globals';
import { Codec, type Editor } from '../../../../src';
import { EditorCodec } from '../../../../src/serialization/codec/editor/EditorCodec';
import { parseXml } from '../../../../src/util/xmlUtils';

describe('decodeTemplates', () => {
  test('decode the first element of each child as the template named by its "as" attribute', () => {
    const doc = parseXml(
      '<templates><add as="first"><Cell id="1"/></add><add as="second">\n  <Cell id="2"/></add></templates>'
    );
    const dec = new Codec(doc);
    jest
      .spyOn(dec, 'decodeCell')
      .mockImplementation((node) => `decoded ${node.getAttribute('id')}` as never);
    const editor = { templates: null } as unknown as Editor;

    new EditorCodec().decodeTemplates(dec, doc.documentElement, editor);

    expect({ ...editor.templates }).toEqual({ first: 'decoded 1', second: 'decoded 2' });
  });
});
