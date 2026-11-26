import type { Demo } from '../types.js';
import { edgesDemo } from './edges.js';
import { labelsDemo } from './labels.js';
import { portsDemo } from './ports.js';
import { shapesDemo } from './shapes.js';
import { stylesDemo } from './styles.js';

export const groupA: Demo[] = [shapesDemo, stylesDemo, edgesDemo, portsDemo, labelsDemo];
