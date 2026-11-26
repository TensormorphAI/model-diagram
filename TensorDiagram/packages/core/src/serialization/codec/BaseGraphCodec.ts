/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { BaseGraph } from '../../view/BaseGraph.js';
import ObjectCodec from '../ObjectCodec.js';
import { excludedFields } from './GraphCodec.js';

/**
 * Codec for {@link BaseGraph}s.
 *
 * Transient Fields:
 *
 * - eventListeners
 * - view
 * - container
 * - cellRenderer
 * - selectionModel
 * - plugins
 *
 * @category Serialization with Codecs
 */
export class BaseGraphCodec extends ObjectCodec {
  constructor() {
    super(new BaseGraph(), excludedFields);
    this.setName('BaseGraph');
  }
}
