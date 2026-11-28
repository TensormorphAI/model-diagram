import type { Demo } from '../types.js';
import { basics } from './basics.js';
import { groupA } from './group-a.js';
import { groupB } from './group-b.js';
import { groupC } from './group-c.js';
import { modelViz } from './model-viz.js';

/** In navigation order. The first one is the landing demo. */
export const demos: Demo[] = [basics, ...groupA, ...groupB, ...groupC, modelViz];
