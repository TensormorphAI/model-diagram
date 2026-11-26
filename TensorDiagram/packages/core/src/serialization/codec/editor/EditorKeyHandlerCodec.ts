/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import ObjectCodec from '../../ObjectCodec.js';
import type Codec from '../../Codec.js';
import EditorKeyHandler from '../../../editor/EditorKeyHandler.js';

/**
 * Custom codec for configuring {@link EditorKeyHandler}s.
 *
 * This class is created and registered dynamically at load time and used implicitly via {@link Codec} and the {@link CodecRegistry}.
 *
 * This codec only reads configuration data for existing key handlers, it does not encode or create key handlers.
 *
 * @category Serialization with Codecs
 */
export class EditorKeyHandlerCodec extends ObjectCodec {
  constructor() {
    super(new EditorKeyHandler());
  }

  /**
   * Returns `null`.
   */
  override encode(_enc: Codec, _obj: EditorKeyHandler) {
    return null;
  }

  /**
   * Reads a sequence of the following child nodes and attributes:
   *
   * Child Nodes:
   *
   * add - Binds a keystroke to an action name.
   *
   * Attributes:
   *
   * as - Keycode.
   * action - Action name to execute in editor.
   * control - Optional boolean indicating if
   *     the control key must be pressed.
   *
   * Example:
   *
   * ```javascript
   * <EditorKeyHandler as="keyHandler">
   *   <add as="88" control="true" action="cut"/>
   *   <add as="67" control="true" action="copy"/>
   *   <add as="86" control="true" action="paste"/>
   * </EditorKeyHandler>
   * ```
   *
   * The keycodes are for the x, c and v keys.
   *
   * See also: <EditorKeyHandler.bindAction>, http://www.js-examples.com/page/tutorials__key_codes.html
   */
  override decode(dec: Codec, _node: Element, into: any) {
    if (into != null) {
      const { editor } = into;
      let node: Element | null = <Element | null>_node.firstChild;

      while (node != null) {
        if (!this.processInclude(dec, node, into) && node.nodeName === 'add') {
          const as = node.getAttribute('as');
          const action = node.getAttribute('action');
          const control = node.getAttribute('control');

          into.bindAction(as, action, control);
        }
        node = <Element | null>node.nextSibling;
      }
    }
    return into;
  }
}
