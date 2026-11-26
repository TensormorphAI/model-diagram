/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, test } from '@jest/globals';
import { getPrettyXml, parseXml } from '../../src/util/xmlUtils';

describe('getPrettyXml', () => {
  test('write all the attributes in order, with their values escaped', () => {
    const node = parseXml(
      '<node first="1" second="a &amp; b" third="&lt;tag&gt;"/>'
    ).documentElement;

    expect(getPrettyXml(node)).toBe(
      '<node first="1" second="a &amp; b" third="&lt;tag&gt;" />\n'
    );
  });
});
