// ALL Depop selectors live in this file. When Depop changes its page, fix it here.
// Run the health check from the options page to see which selectors no longer match.
//
// UNVERIFIED: written without access to a logged-in page. Every selector below is a guess
// until the health check passes. Depop has no title field (see shared/mappings/depop.ts).
// Shipping is not filled; pick it by hand.
import type { SiteConfig } from './types';

export const depopConfig: SiteConfig = {
  platform: 'depop',
  createUrl: 'https://www.depop.com/products/create/',
  readySelector: 'textarea[name="description"]',
  // e.g. https://www.depop.com/products/myshop-levis-501-jeans-blue/
  listingUrlPattern: /^https:\/\/www\.depop\.com\/products\/(?!create\b)([a-z0-9-]+)\/?(?:[?#]|$)/,
  fields: {
    photos: { kind: 'files', selector: 'input[type="file"]' },
    description: { kind: 'text', selector: 'textarea[name="description"]' },
    category: { kind: 'pickPath', trigger: '#group-select, [data-testid="category__select"]', option: '[role="option"]' },
    brand: { kind: 'combobox', input: '#brand-input, input[name="brand"]', option: '[role="option"]' },
    condition: { kind: 'pick', trigger: '#condition-select, [data-testid="condition__select"]', option: '[role="option"]' },
    size: { kind: 'pick', trigger: '#size-select, [data-testid="size__select"]', option: '[role="option"]' },
    color: { kind: 'pick', trigger: '#colour-select, [data-testid="colour__select"]', option: '[role="option"]' },
    price: { kind: 'text', selector: 'input[name="price"], #price__input' },
  },
  verifiedOn: null,
};
