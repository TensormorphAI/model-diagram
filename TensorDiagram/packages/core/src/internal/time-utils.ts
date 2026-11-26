/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

/**
 * If `baseTimestamp` is provided and not zero, returns a message describing the elapsed milliseconds since this value.
 * Otherwise, returns an empty string.
 * @param baseTimestamp the base timestamp to compute the elapsed milliseconds from
 *
 * @private not part of the public API, can be removed or changed without prior notice
 */
export const getElapseMillisecondsMessage = (baseTimestamp?: number): string =>
  baseTimestamp ? ` (${new Date().getTime() - baseTimestamp} ms)` : '';
