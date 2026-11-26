/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { registerModelCodecs } from './register-model-codecs.js';
import { getPrettyXml, getXml, parseXml } from '../util/xmlUtils.js';
import Codec from './Codec.js';
import type GraphDataModel from '../view/GraphDataModel.js';

/**
 * Export options of {@link ModelXmlSerializer}.
 *
 * **WARN**: this is an experimental feature that is subject to change.
 *
 * @experimental
 * @since 0.6.0
 * @category Serialization with Codecs
 */
export interface ModelExportOptions {
  /**
   * If `true`, prettify the exported xml.
   * @default true
   */
  pretty?: boolean;
}

/**
 * Convenient utility class using {@link Codec} to manage TensorDiagram model import and export.
 *
 * **WARN**: this is an experimental feature that is subject to change (class and method names).
 *
 * @experimental
 * @since 0.6.0
 * @category Serialization with Codecs
 */
// Include 'XML' in the class name as there were past discussions about supporting other format like JSON for example
// See https://github.com/TensorDiagram/TensorDiagram/discussions/60 for more details.
export class ModelXmlSerializer {
  constructor(private dataModel: GraphDataModel) {
    this.registerCodecs();
  }

  import(input: string | Element): void {
    const doc = typeof input === 'string' ? parseXml(input) : input.ownerDocument;
    new Codec(doc).decode(doc.documentElement, this.dataModel);
  }

  export(options?: ModelExportOptions): string {
    const encodedNode = new Codec().encode(this.dataModel);
    return (options?.pretty ?? true) ? getPrettyXml(encodedNode) : getXml(encodedNode!);
  }

  /**
   * Hook for replacing codecs registered by default (model codecs).
   */
  protected registerCodecs(): void {
    registerModelCodecs();
  }
}
