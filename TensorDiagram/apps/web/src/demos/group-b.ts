import type { Demo } from '../types.js';
import { animation } from './animation.js';
import { groups } from './groups.js';
import { layouts } from './layouts.js';
import { navigation } from './navigation.js';
import { orgChart } from './org-chart.js';
import { swimlanes } from './swimlanes.js';

export const groupB: Demo[] = [
  groups,
  swimlanes,
  layouts,
  orgChart,
  navigation,
  animation,
];
