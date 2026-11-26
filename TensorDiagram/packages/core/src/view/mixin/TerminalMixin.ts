/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import type Cell from '../cell/Cell.js';
import type { AbstractGraph } from '../AbstractGraph.js';

type PartialGraph = Pick<AbstractGraph, 'getView'>;
type PartialTerminal = Pick<AbstractGraph, 'isTerminalPointMovable' | 'getOpposites'>;
type PartialType = PartialGraph & PartialTerminal;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const TerminalMixin: PartialType = {
  isTerminalPointMovable(cell, source) {
    return true;
  },

  getOpposites(
    edges,
    terminal = null,
    includeSources = true,
    includeTargets = true
  ): Cell[] {
    const terminals: Cell[] = [];

    // Fast lookup to avoid duplicates in terminals array
    const coveredEntries = new Map<Cell, boolean>();

    for (const edge of edges) {
      const state = this.getView().getState(edge);

      const source = state
        ? state.getVisibleTerminal(true)
        : this.getView().getVisibleTerminal(edge, true);
      const target = state
        ? state.getVisibleTerminal(false)
        : this.getView().getVisibleTerminal(edge, false);

      // Checks if the terminal is the source of the edge and if the target should be stored in the result
      if (source === terminal && target && target !== terminal && includeTargets) {
        if (!coveredEntries.has(target)) {
          coveredEntries.set(target, true);
          terminals.push(target);
        }
      }

      // Checks if the terminal is the target of the edge and if the source should be stored in the result
      else if (target === terminal && source && source !== terminal && includeSources) {
        if (!coveredEntries.has(source)) {
          coveredEntries.set(source, true);
          terminals.push(source);
        }
      }
    }
    return terminals;
  },
};
