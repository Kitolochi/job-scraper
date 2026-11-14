import type { Platform } from '../../shared/types';
import type { SiteConfig } from './types';
import { poshmarkConfig } from './poshmark.config';
import { depopConfig } from './depop.config';

export const SITES: Record<Platform, SiteConfig> = {
  poshmark: poshmarkConfig,
  depop: depopConfig,
};
