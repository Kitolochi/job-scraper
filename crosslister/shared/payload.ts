// Turns an item into the values the content script types into a site's form.
import { isCategory } from './categories.ts';
import { MAPPINGS } from './mappings/index.ts';
import type { Item, Platform } from './types.ts';

export interface FillPayload {
  title: string | null;
  description: string;
  category: string[];
  brand: string | null;
  size: string | null;
  color: string | null;
  condition: string;
  price: string;
  originalPrice: string | null;
}

export type BuildResult = { ok: true; payload: FillPayload } | { ok: false; problems: string[] };

export function buildPayload(item: Item, platform: Platform, priceCents?: number | null): BuildResult {
  const m = MAPPINGS[platform];
  const problems: string[] = [];
  const price = priceCents ?? item.price_cents;

  if (!item.title.trim()) problems.push('title is empty');
  if (!isCategory(item.category)) problems.push(`unknown category "${item.category ?? ''}"`);
  if (!item.condition) problems.push('condition is missing');
  if (price == null || price <= 0) problems.push('price is missing');
  if (platform === 'poshmark' && item.original_price_cents == null) {
    problems.push('original price is required on Poshmark');
  }

  const description = m.hasTitleField
    ? item.description.trim()
    : `${item.title.trim()}\n\n${item.description.trim()}`.trim();

  if (m.limits.titleMax != null && item.title.length > m.limits.titleMax) {
    problems.push(`title is ${item.title.length} chars; ${platform} max is ${m.limits.titleMax}`);
  }
  if (description.length > m.limits.descriptionMax) {
    problems.push(`description is ${description.length} chars; ${platform} max is ${m.limits.descriptionMax}`);
  }
  if (problems.length) return { ok: false, problems };

  return {
    ok: true,
    payload: {
      title: m.hasTitleField ? item.title.trim() : null,
      description,
      category: m.category[item.category as keyof typeof m.category],
      brand: item.brand?.trim() || null,
      size: item.size?.trim() || null,
      color: item.color?.trim() || null,
      condition: m.condition[item.condition!],
      price: m.formatPrice(price!),
      originalPrice: item.original_price_cents != null ? m.formatPrice(item.original_price_cents) : null,
    },
  };
}
