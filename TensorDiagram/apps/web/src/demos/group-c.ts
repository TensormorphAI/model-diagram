import type { Demo } from '../types.js';
import { data } from './data.js';
import { editing } from './editing.js';
import { events } from './events.js';
import { interaction } from './interaction.js';
import { palette } from './palette.js';
import { validation } from './validation.js';

export const groupC: Demo[] = [editing, interaction, palette, validation, data, events];
