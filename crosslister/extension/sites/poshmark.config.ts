// ALL Poshmark selectors live in this file. When Poshmark changes its page, fix it here.
// Run the health check from the options page to see which selectors no longer match.
//
// UNVERIFIED: written without access to a logged-in page. Every selector below is a guess
// until the health check passes. Poshmark's form has used vee-validate `data-vv-name` attributes.
import type { SiteConfig } from './types';

export const poshmarkConfig: SiteConfig = {
  platform: 'poshmark',
  createUrl: 'https://poshmark.com/create-listing',
  readySelector: 'input[data-vv-name="title"]',
  // e.g. https://poshmark.com/listing/Levis-501-Jeans-65f1c2a9b3e4d5f6a7b8c9d0
  listingUrlPattern: /^https:\/\/poshmark\.com\/listing\/[^/?#]*-([0-9a-f]{24})(?:[/?#]|$)/,
  fields: {
    photos: { kind: 'files', selector: 'input[type="file"]' },
    title: { kind: 'text', selector: 'input[data-vv-name="title"]' },
    description: { kind: 'text', selector: 'textarea[data-vv-name="description"]' },
    category: {
      kind: 'pickPath',
      trigger: '[data-et-name="category"]',
      option: '.dropdown__menu__item, .dropdown__link',
    },
    size: { kind: 'pick', trigger: '[data-et-name="size"]', option: '.dropdown__menu__item, .dropdown__link' },
    condition: { kind: 'pick', trigger: '[data-et-name="condition"]', option: '.dropdown__menu__item, .dropdown__link' },
    brand: { kind: 'combobox', input: 'input[placeholder*="Brand"]', option: '.dropdown__menu__item, .dropdown__link' },
    color: { kind: 'pick', trigger: '[data-et-name="color"]', option: '.dropdown__menu__item, .dropdown__link' },
    originalPrice: { kind: 'text', selector: 'input[data-vv-name="originalPrice"]' },
    price: { kind: 'text', selector: 'input[data-vv-name="listingPrice"]' },
  },
  verifiedOn: null,
};
