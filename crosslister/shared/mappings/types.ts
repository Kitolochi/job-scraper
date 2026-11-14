import type { Category } from '../categories.ts';
import type { Condition } from '../types.ts';

export interface PlatformMapping {
  /** Labels clicked in order in the site's category picker. */
  category: Record<Category, string[]>;
  /** Label shown in the site's condition picker. */
  condition: Record<Condition, string>;
  /** Formats cents the way the site's price box expects. */
  formatPrice(cents: number): string;
  limits: { titleMax: number | null; descriptionMax: number };
  /** False when the site has no separate title field (title is folded into the description). */
  hasTitleField: boolean;
}
