/*
Copyright 2024-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import type { Logger } from '../types.js';

import { getElapseMillisecondsMessage } from '../internal/time-utils.js';

/**
 * A {@link Logger} that does nothing.
 *
 * @experimental subject to change or removal. The logging system may be modified in the future without prior notice.
 * @since 0.11.0
 * @category Logging
 */
export class NoOpLogger implements Logger {
  debug(_message: string): void {}

  enter(_message: string): number | undefined {
    return undefined;
  }

  error(_message: string, ..._optionalParams: any[]): void {}

  info(_message: string): void {}

  leave(_message: string, _baseTimestamp?: number): void {}

  show(): void {}

  trace(_message: string): void {}

  warn(_message: string): void {}
}

/**
 * A {@link Logger} that directs logs to the browser console.
 *
 * @experimental subject to change or removal. The logging system may be modified in the future without prior notice.
 * @since 0.11.0
 * @category Logging
 */
export class ConsoleLogger implements Logger {
  debugEnabled = false;
  infoEnabled = false;
  traceEnabled = false;

  /* eslint-disable no-console -- we must use "console" to direct logs to the browser console */

  enter(message: string): number | undefined {
    if (this.traceEnabled) {
      console.trace(`Entering ${message}`);
      return new Date().getTime();
    }
    return undefined;
  }

  leave(message: string, baseTimestamp?: number): void {
    if (this.traceEnabled) {
      const dt = getElapseMillisecondsMessage(baseTimestamp);
      console.trace(`Leaving ${message}${dt}`);
    }
  }

  show(): void {}

  trace(message: string): void {
    if (this.traceEnabled) {
      console.trace(message);
    }
  }

  debug(message: string): void {
    if (this.debugEnabled) {
      console.debug(message);
    }
  }

  info(message: string): void {
    if (this.infoEnabled) {
      console.info(message);
    }
  }

  warn(message: string): void {
    console.warn(message);
  }

  error(message?: any, ...optionalParams: any[]): void {
    console.error(message, ...optionalParams);
  }
}
/* eslint-enable no-console */
