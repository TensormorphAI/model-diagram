/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { Logger } from '../types.js';
import MaxLog from './MaxLog.js';

/**
 * A {@link Logger} that uses {@link MaxLog} to log messages.
 *
 * Notice that the log level for this logger are configured in {@link MaxLog}.
 *
 * @experimental subject to change or removal. The logging system may be modified in the future without prior notice.
 * @since 0.11.0
 * @category GUI
 * @category Logging
 */
export class MaxLogAsLogger implements Logger {
  enter(message: string): number | undefined {
    return MaxLog.enter(message);
  }

  leave(message: string, baseTimestamp?: number): void {
    MaxLog.leave(message, baseTimestamp);
  }

  show(): void {
    MaxLog.show();
  }

  info(message: string): void {
    MaxLog.writeln(message);
  }

  debug(message: string): void {
    MaxLog.debug(message);
  }

  error(message: string, ...optionalParams: any[]): void {
    const args = optionalParams?.map((param) => String(param));
    MaxLog.writeln(`[ERROR] ${message}`, ...args);
  }

  trace(message: string): void {
    MaxLog.trace(message);
  }

  warn(message: string): void {
    MaxLog.warn(message);
  }
}
