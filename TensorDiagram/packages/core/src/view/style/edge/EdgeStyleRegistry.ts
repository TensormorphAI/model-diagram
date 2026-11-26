/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import type {
  EdgeStyleFunction,
  EdgeStyleHandlerKind,
  EdgeStyleMetaData,
  EdgeStyleRegistryInterface,
} from '../../../types.js';
import { isNullish } from '../../../internal/utils.js';
import { BaseRegistry } from '../../../internal/BaseRegistry.js';

/**
 * @private
 */
class EdgeStyleRegistryImpl
  extends BaseRegistry<EdgeStyleFunction>
  implements EdgeStyleRegistryInterface
{
  private readonly handlerMapping = new Map<EdgeStyleFunction, EdgeStyleHandlerKind>();
  private readonly orthogonalStates = new Map<EdgeStyleFunction, boolean>();
  private readonly intermediateHandlesStates = new Map<EdgeStyleFunction, boolean>();

  override add(
    name: string,
    edgeStyle: EdgeStyleFunction,
    metaData?: EdgeStyleMetaData
  ): void {
    super.add(name, edgeStyle);
    metaData?.handlerKind && this.handlerMapping.set(edgeStyle, metaData.handlerKind);
    !isNullish(metaData?.isOrthogonal) &&
      this.orthogonalStates.set(edgeStyle, metaData.isOrthogonal);
    !isNullish(metaData?.allowIntermediateHandles) &&
      this.intermediateHandlesStates.set(edgeStyle, metaData.allowIntermediateHandles);
  }

  isOrthogonal(edgeStyle?: EdgeStyleFunction | null): boolean {
    return this.orthogonalStates.get(edgeStyle!) ?? false;
  }

  getHandlerKind(edgeStyle?: EdgeStyleFunction | null): EdgeStyleHandlerKind {
    return this.handlerMapping.get(edgeStyle!) ?? 'default';
  }

  allowsIntermediateHandles(edgeStyle?: EdgeStyleFunction | null): boolean {
    return this.intermediateHandlesStates.get(edgeStyle!) ?? true;
  }

  override clear(): void {
    super.clear();
    this.handlerMapping.clear();
    this.orthogonalStates.clear();
    this.intermediateHandlesStates.clear();
  }
}

/**
 * A registry that stores the {@link EdgeStyle}s and their configuration.
 *
 * @since 0.20.0
 * @category Style
 * @category Configuration
 */
export const EdgeStyleRegistry: EdgeStyleRegistryInterface = new EdgeStyleRegistryImpl();
