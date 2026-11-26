/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { constants } from '@tensormorph/tensordiagramcore';

export const isElement = (node: ChildNode): node is Element =>
  node.nodeType === constants.NODE_TYPE.ELEMENT;
