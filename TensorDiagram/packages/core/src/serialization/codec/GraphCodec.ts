/*
Copyright (c) Tensormorph. All rights reserved.
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import ObjectCodec from '../ObjectCodec.js';
import { Graph } from '../../view/Graph.js';
import type { AbstractGraph } from '../../view/AbstractGraph.js';

export const excludedFields: Array<keyof AbstractGraph> = [
  'eventListeners',
  'view',
  'container',
  'cellRenderer',
  'selectionModel',
  // @ts-ignore private property
  'plugins',
];

/**
 * Codec for {@link Graph}s.
 * This class is created and registered dynamically at load time and used implicitly via {@link Codec} and the {@link CodecRegistry}.
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
export class GraphCodec extends ObjectCodec {
  constructor() {
    // Do not  load default plugins, plugins are not serialized
    super(new Graph(undefined, undefined, []), excludedFields);
    this.setName('Graph');
  }
}
