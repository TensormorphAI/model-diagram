/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import ObjectCodec from '../ObjectCodec.js';
import RootChange from '../../view/undoable-change/RootChange.js';
import type Codec from '../Codec.js';
import { isElement } from '../../internal/utils.js';

/**
 * Codec for {@link RootChange}s.
 *
 * This class is created and registered dynamically at load time and used implicitly via {@link Codec} and the {@link CodecRegistry}.
 *
 * Transient Fields:
 *
 * - model
 * - previous
 * - root
 *
 * @category Serialization with Codecs
 */
export class RootChangeCodec extends ObjectCodec {
  constructor() {
    const __dummy: any = undefined;
    super(new RootChange(__dummy, __dummy), ['model', 'previous', 'root'] as Array<
      keyof RootChange
    >);
  }

  /**
   * Encodes the child recursively.
   */
  override afterEncode(enc: Codec, obj: any, node: Element) {
    enc.encodeCell(obj.root, node);
    return node;
  }

  /**
   * Decodes the optional children as cells using the respective decoder.
   */
  override beforeDecode(dec: Codec, node: Element, obj: any): any {
    if (isElement(node.firstChild)) {
      // Makes sure the original node isn't modified
      node = <Element>node.cloneNode(true);

      let tmp = <Element>node.firstChild;
      obj.root = dec.decodeCell(tmp, false);

      let tmp2 = <Element>tmp.nextSibling;
      tmp.parentNode?.removeChild(tmp);
      tmp = tmp2;

      while (tmp != null) {
        tmp2 = <Element>tmp.nextSibling;
        dec.decodeCell(tmp);
        tmp.parentNode?.removeChild(tmp);
        tmp = tmp2;
      }
    }
    return node;
  }

  /**
   * Restores the state by assigning the previous value.
   */
  override afterDecode(_dec: Codec, _node: Element, obj: any): any {
    obj.previous = obj.root;

    return obj;
  }
}
