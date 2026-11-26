/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { GlobalConfig } from '../util/config.js';

/**
 * @private
 */
export function isI18nEnabled(): boolean {
  return GlobalConfig.i18n.isEnabled();
}

/**
 * @private
 */
export function translate(
  key?: string | null,
  params?: any[] | null,
  defaultValue?: string
): string | null {
  return GlobalConfig.i18n.get(key, params, defaultValue);
}
