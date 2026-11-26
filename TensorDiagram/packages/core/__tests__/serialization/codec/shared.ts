/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { getPrettyXml, parseXml } from '../../../src/util/xmlUtils';
import Codec from '../../../src/serialization/Codec';

export const importToObject = (obj: object, xml: string): void => {
  const doc = parseXml(xml);
  new Codec(doc).decode(doc.documentElement, obj);
};

export const exportObject = (obj: object): string => {
  const encodedNode = new Codec().encode(obj);
  return getPrettyXml(encodedNode);
};
