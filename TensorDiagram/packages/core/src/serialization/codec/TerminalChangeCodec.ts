/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import ObjectCodec from '../ObjectCodec.js';
import TerminalChange from '../../view/undoable-change/TerminalChange.js';
import type Codec from '../Codec.js';

/**
 * Codec for {@link TerminalChange}s.
 *
 * This class is created and registered dynamically at load time and used implicitly via {@link Codec} and the {@link CodecRegistry}.
 *
 * Transient Fields:
 *
 * - model
 * - previous
 *
 * Reference Fields:
 *
 * - cell
 * - terminal
 *
 * @category Serialization with Codecs
 */
export class TerminalChangeCodec extends ObjectCodec {
  constructor() {
    const __dummy: any = undefined;
    super(
      new TerminalChange(__dummy, __dummy, __dummy, __dummy),
      ['model', 'previous'] as Array<keyof TerminalChange>,
      ['cell', 'terminal'] as Array<keyof TerminalChange>
    );
  }

  /**
   * Restores the state by assigning the previous value.
   */
  override afterDecode(_dec: Codec, _node: Element, obj: any): any {
    obj.previous = obj.terminal;
    return obj;
  }
}
