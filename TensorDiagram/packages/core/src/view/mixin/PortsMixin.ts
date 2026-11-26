/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import type { AbstractGraph } from '../AbstractGraph.js';

type PartialPorts = Pick<
  AbstractGraph,
  'portsEnabled' | 'isPort' | 'getTerminalForPort' | 'isPortsEnabled' | 'setPortsEnabled'
>;
type PartialType = PartialPorts;

export const PortsMixin: PartialType = {
  portsEnabled: true,

  isPort(cell) {
    return false;
  },

  getTerminalForPort(cell, _source = false) {
    return cell.getParent();
  },

  isPortsEnabled() {
    return this.portsEnabled;
  },

  setPortsEnabled(value) {
    this.portsEnabled = value;
  },
};
