import type { Platform } from '../types.ts';
import type { PlatformMapping } from './types.ts';
import { poshmarkMapping } from './poshmark.ts';
import { depopMapping } from './depop.ts';

export const MAPPINGS: Record<Platform, PlatformMapping> = {
  poshmark: poshmarkMapping,
  depop: depopMapping,
};
