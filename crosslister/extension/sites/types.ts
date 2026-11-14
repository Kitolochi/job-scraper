import type { Platform } from '../../shared/types';

/** How to put one value into one form field. */
export type FieldSpec =
  /** <input> or <textarea>: set the value and fire input/change. */
  | { kind: 'text'; selector: string }
  /** Click `trigger`, then click the element matching `option` whose text equals the value. */
  | { kind: 'pick'; trigger: string; option: string }
  /** Like pick, but the value is a path: click `trigger`, then click one option per level. */
  | { kind: 'pickPath'; trigger: string; option: string }
  /** Type the value into `input`, then click the matching `option` from the suggestions. */
  | { kind: 'combobox'; input: string; option: string }
  /** <input type="file">: attach the photos. */
  | { kind: 'files'; selector: string };

export type FieldName =
  | 'photos'
  | 'title'
  | 'description'
  | 'category'
  | 'brand'
  | 'size'
  | 'condition'
  | 'color'
  | 'price'
  | 'originalPrice';

export interface SiteConfig {
  platform: Platform;
  /** Page that shows an empty new-listing form. */
  createUrl: string;
  /** Element that exists once the form has rendered. */
  readySelector: string;
  /** Matches the page the site redirects to after "List" is clicked. Group 1 = listing ID. */
  listingUrlPattern: RegExp;
  /** Fields in the order they are filled. Fields missing here are left for you to fill by hand. */
  fields: Partial<Record<FieldName, FieldSpec>>;
  /** Date the selectors were last checked against the live site, or null if never. */
  verifiedOn: string | null;
}
