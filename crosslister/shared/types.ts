// Types shared by the extension and Supabase functions. Mirrors supabase/migrations.

export const PLATFORMS = ['poshmark', 'depop'] as const;
export type Platform = (typeof PLATFORMS)[number];

export const CONDITIONS = ['new_with_tags', 'new_without_tags', 'excellent', 'good', 'fair'] as const;
export type Condition = (typeof CONDITIONS)[number];

export type ItemStatus = 'draft' | 'active' | 'sold' | 'archived';
export type ListingStatus = 'pending' | 'live' | 'sold' | 'delisted' | 'error';
export type JobAction = 'create' | 'delist' | 'update_price';
export type JobStatus = 'queued' | 'running' | 'done' | 'failed';

export interface Item {
  id: string;
  sku: string;
  title: string;
  description: string;
  brand: string | null;
  category: string | null;
  size: string | null;
  color: string | null;
  condition: Condition | null;
  price_cents: number | null;
  original_price_cents: number | null;
  cost_cents: number | null;
  status: ItemStatus;
  created_at: string;
  sold_at: string | null;
}

export interface Photo {
  id: string;
  item_id: string;
  storage_path: string;
  position: number;
}

export interface Listing {
  id: string;
  item_id: string;
  platform: Platform;
  external_id: string | null;
  url: string | null;
  status: ListingStatus;
  price_cents: number | null;
  last_error: string | null;
  updated_at: string;
}

export interface Job {
  id: string;
  listing_id: string;
  action: JobAction;
  status: JobStatus;
  attempts: number;
  run_after: string;
  created_at: string;
}
