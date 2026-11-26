/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { show } from '../../src/util/printUtils';
import { createBaseGraph } from '../utils';

describe('show', () => {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  test('write the base, link and style elements of the document into the head of the target document', () => {
    document.head.innerHTML = [
      '<base href="https://example.com/"/>',
      '<link rel="stylesheet" href="first.css"/>',
      '<link rel="stylesheet" href="second.css"/>',
      '<style>.first {}</style>',
      '<style>.second {}</style>',
    ].join('');
    const graph = createBaseGraph();
    const targetDocument = document.implementation.createHTMLDocument();
    const writeln = jest.spyOn(targetDocument, 'writeln');

    show(graph, targetDocument);

    const writtenLines = writeln.mock.calls.map(([line]) => line);
    expect(writtenLines).toEqual([
      '<html><head>',
      '<base xmlns="http://www.w3.org/1999/xhtml" href="https://example.com/" />',
      '<link xmlns="http://www.w3.org/1999/xhtml" rel="stylesheet" href="first.css" />',
      '<link xmlns="http://www.w3.org/1999/xhtml" rel="stylesheet" href="second.css" />',
      '<style xmlns="http://www.w3.org/1999/xhtml">.first {}</style>',
      '<style xmlns="http://www.w3.org/1999/xhtml">.second {}</style>',
      '</head><body style="margin:0px;"></body></html>',
    ]);
  });
});
