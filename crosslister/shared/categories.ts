// Our own category list. Each platform maps these in shared/mappings/<platform>.ts.
// Add a category here and the mapping tests will fail until every platform maps it.

export const CATEGORIES = [
  'women/tops',
  'women/sweaters',
  'women/dresses',
  'women/jeans',
  'women/pants',
  'women/skirts',
  'women/shorts',
  'women/jackets_coats',
  'women/shoes',
  'women/bags',
  'women/accessories',
  'men/shirts',
  'men/sweaters',
  'men/jeans',
  'men/pants',
  'men/shorts',
  'men/jackets_coats',
  'men/shoes',
  'men/accessories',
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: string | null | undefined): value is Category {
  return (CATEGORIES as readonly string[]).includes(value ?? '');
}
