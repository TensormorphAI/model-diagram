/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import ObjectCodec from '../ObjectCodec.js';
import GraphDataModel from '../../view/GraphDataModel.js';
import Cell from '../../view/cell/Cell.js';
import type Codec from '../Codec.js';

/**
 * Codec for {@link GraphDataModel}s.
 *
 * This class is created and registered dynamically at load time and used implicitly via {@link Codec} and the {@link CodecRegistry}.
 *
 * @category Serialization with Codecs
 */
export class ModelCodec extends ObjectCodec {
  constructor() {
    super(new GraphDataModel());
    this.setName('GraphDataModel');
  }

  /**
   * Encodes the given {@link GraphDataModel} by writing a (flat) XML sequence of cell nodes as produced by the {@link CellCodec}.
   * The sequence is wrapped-up in a node with the name `root`.
   */
  override encodeObject(enc: Codec, obj: Cell, node: Element) {
    const rootNode = enc.document.createElement('root');
    enc.encodeCell(obj.getRoot(), rootNode);
    node.appendChild(rootNode);
  }

  /**
   * Overrides decode child to handle special child nodes.
   */
  override decodeChild(dec: Codec, child: Element, obj: Cell | GraphDataModel) {
    if (child.nodeName === 'root') {
      this.decodeRoot(dec, child, <GraphDataModel>obj);
    } else {
      super.decodeChild(dec, child, obj);
    }
  }

  /**
   * Reads the cells into the graph model. All cells are children of the root element in the node.
   */
  decodeRoot(dec: Codec, root: Element, model: GraphDataModel) {
    let rootCell = null;
    let tmp = root.firstChild as Element;

    while (tmp != null) {
      const cell = dec.decodeCell(tmp);

      if (cell != null && cell.getParent() == null) {
        rootCell = cell;
      }
      tmp = tmp.nextSibling as Element;
    }

    // Sets the root on the model if one has been decoded
    if (rootCell != null) {
      model.setRoot(rootCell);
    }
  }
}
