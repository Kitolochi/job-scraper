import type { PlatformMapping } from './types.ts';

// Depop: department > category. Depop has no title field; the title becomes the first line of the description.
// UNVERIFIED: every label here. Depop renames its taxonomy often; confirm against the live form.
export const depopMapping: PlatformMapping = {
  category: {
    'women/tops': ['Womenswear', 'Tops'],
    'women/sweaters': ['Womenswear', 'Jumpers'],
    'women/dresses': ['Womenswear', 'Dresses'],
    'women/jeans': ['Womenswear', 'Jeans'],
    'women/pants': ['Womenswear', 'Trousers'],
    'women/skirts': ['Womenswear', 'Skirts'],
    'women/shorts': ['Womenswear', 'Shorts'],
    'women/jackets_coats': ['Womenswear', 'Coats & Jackets'],
    'women/shoes': ['Womenswear', 'Footwear'],
    'women/bags': ['Womenswear', 'Bags'],
    'women/accessories': ['Womenswear', 'Accessories'],
    'men/shirts': ['Menswear', 'Tops'],
    'men/sweaters': ['Menswear', 'Jumpers'],
    'men/jeans': ['Menswear', 'Jeans'],
    'men/pants': ['Menswear', 'Trousers'],
    'men/shorts': ['Menswear', 'Shorts'],
    'men/jackets_coats': ['Menswear', 'Coats & Jackets'],
    'men/shoes': ['Menswear', 'Footwear'],
    'men/accessories': ['Menswear', 'Accessories'],
  },
  condition: {
    new_with_tags: 'Brand new',
    new_without_tags: 'Like new',
    excellent: 'Used - Excellent',
    good: 'Used - Good',
    fair: 'Used - Fair',
  },
  formatPrice: (cents) => (cents / 100).toFixed(2),
  limits: { titleMax: null, descriptionMax: 1000 },
  hasTitleField: false,
};
