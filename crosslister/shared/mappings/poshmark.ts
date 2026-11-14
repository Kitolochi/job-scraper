import type { PlatformMapping } from './types.ts';

// Labels are Poshmark's department > category names.
// UNVERIFIED: condition labels and title/description limits. Confirm against the live form.
export const poshmarkMapping: PlatformMapping = {
  category: {
    'women/tops': ['Women', 'Tops'],
    'women/sweaters': ['Women', 'Sweaters'],
    'women/dresses': ['Women', 'Dresses'],
    'women/jeans': ['Women', 'Jeans'],
    'women/pants': ['Women', 'Pants & Jumpsuits'],
    'women/skirts': ['Women', 'Skirts'],
    'women/shorts': ['Women', 'Shorts'],
    'women/jackets_coats': ['Women', 'Jackets & Coats'],
    'women/shoes': ['Women', 'Shoes'],
    'women/bags': ['Women', 'Bags'],
    'women/accessories': ['Women', 'Accessories'],
    'men/shirts': ['Men', 'Shirts'],
    'men/sweaters': ['Men', 'Sweaters'],
    'men/jeans': ['Men', 'Jeans'],
    'men/pants': ['Men', 'Pants'],
    'men/shorts': ['Men', 'Shorts'],
    'men/jackets_coats': ['Men', 'Jackets & Coats'],
    'men/shoes': ['Men', 'Shoes'],
    'men/accessories': ['Men', 'Accessories'],
  },
  condition: {
    new_with_tags: 'New With Tags',
    new_without_tags: 'Like New',
    excellent: 'Like New',
    good: 'Good',
    fair: 'Fair',
  },
  // Poshmark prices are whole dollars.
  formatPrice: (cents) => String(Math.round(cents / 100)),
  limits: { titleMax: 80, descriptionMax: 1500 },
  hasTitleField: true,
};
