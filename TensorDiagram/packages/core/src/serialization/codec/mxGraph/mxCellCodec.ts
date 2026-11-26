/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { convertStyleFromString } from './utils.js';
import { CellCodec } from '../CellCodec.js';
import type Codec from '../../Codec.js';

/**
 * Add support for the legacy `mxGraph` format of {@link Cell}.
 *
 * @category Serialization with Codecs
 */
export class mxCellCodec extends CellCodec {
  override getName(): string {
    return 'mxCell';
  }

  override decodeAttribute(dec: Codec, attr: any, obj?: any) {
    const attributeNodeName = attr.nodeName;
    if (obj && attributeNodeName == 'style') {
      obj['style'] = convertStyleFromString(attr.value);
    } else {
      super.decodeAttribute(dec, attr, obj);
    }
  }
}
