/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

/**
 * @private
 */
export interface UserObject {
  nodeType?: number;
  getAttribute?: (name: string) => string | null;
  hasAttribute?: (name: string) => boolean;
  setAttribute?: (name: string, value: string) => void;
  clone?: () => UserObject;
  cloneNode?: (deep: boolean) => UserObject;
}
