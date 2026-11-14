// Messages passed between the options page, background worker, and content scripts.
import type { Platform } from '../../shared/types';
import type { FillPayload } from '../../shared/payload';
import type { FieldName } from '../sites/types';

export interface PhotoData {
  name: string;
  type: string;
  base64: string;
}

export type FieldResult = { field: FieldName; ok: true } | { field: FieldName; ok: false; error: string };

export interface HealthReport {
  platform: Platform;
  checkedAt: string;
  url: string;
  results: { name: string; selector: string; found: boolean }[];
}

/** What the content script should do on the tab it was loaded into. */
export type Task =
  | { mode: 'fill'; platform: Platform; payload: FillPayload; photos: PhotoData[] }
  | { mode: 'healthcheck'; platform: Platform }
  | null;

export type Message =
  | { type: 'startListing'; itemId: string; platform: Platform }
  | { type: 'startHealthCheck'; platform: Platform }
  | { type: 'getTask' }
  | { type: 'fillReport'; results: FieldResult[] }
  | { type: 'healthReport'; report: HealthReport };

export type StartResult = { ok: true } | { ok: false; error: string };
