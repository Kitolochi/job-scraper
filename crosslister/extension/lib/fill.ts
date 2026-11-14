// Fills a site's new-listing form from a SiteConfig and a FillPayload.
// Never clicks the final List/Submit button.
import type { FillPayload } from '../../shared/payload';
import type { FieldName, FieldSpec, SiteConfig } from '../sites/types';
import type { FieldResult, HealthReport, PhotoData } from './messages';
import { base64ToFile, setFiles, setValue, shortPause, waitFor, waitForText } from './dom';

type Value = string | string[] | File[];

function valueFor(field: FieldName, payload: FillPayload, files: File[]): Value | null {
  switch (field) {
    case 'photos':
      return files.length ? files : null;
    case 'category':
      return payload.category;
    default:
      return payload[field];
  }
}

async function fillField(spec: FieldSpec, value: Value): Promise<void> {
  switch (spec.kind) {
    case 'text':
      setValue(await waitFor<HTMLInputElement>(spec.selector), String(value));
      return;
    case 'files':
      setFiles(await waitFor<HTMLInputElement>(spec.selector), value as File[]);
      return;
    case 'pick':
      (await waitFor<HTMLElement>(spec.trigger)).click();
      await shortPause();
      (await waitForText(spec.option, String(value))).click();
      return;
    case 'pickPath':
      (await waitFor<HTMLElement>(spec.trigger)).click();
      for (const label of value as string[]) {
        await shortPause();
        (await waitForText(spec.option, label)).click();
      }
      return;
    case 'combobox': {
      const input = await waitFor<HTMLInputElement>(spec.input);
      setValue(input, String(value));
      input.focus();
      await shortPause();
      (await waitForText(spec.option, String(value))).click();
      return;
    }
  }
}

export async function fillForm(site: SiteConfig, payload: FillPayload, photos: PhotoData[]): Promise<FieldResult[]> {
  const files = photos.map((p) => base64ToFile(p.base64, p.name, p.type));
  const results: FieldResult[] = [];
  for (const [field, spec] of Object.entries(site.fields) as [FieldName, FieldSpec][]) {
    const value = valueFor(field, payload, files);
    if (value == null || (Array.isArray(value) && value.length === 0)) continue;
    try {
      await fillField(spec, value);
      results.push({ field, ok: true });
    } catch (e) {
      results.push({ field, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    await shortPause();
  }
  return results;
}

/** Checks the top-level selectors only. Option lists appear after a click, so they can't be checked here. */
export function checkSelectors(site: SiteConfig): HealthReport {
  const results: HealthReport['results'] = [{ name: 'readySelector', selector: site.readySelector, found: false }];
  for (const [field, spec] of Object.entries(site.fields) as [FieldName, FieldSpec][]) {
    const selector = spec.kind === 'pick' || spec.kind === 'pickPath' ? spec.trigger : spec.kind === 'combobox' ? spec.input : spec.selector;
    results.push({ name: field, selector, found: false });
  }
  for (const r of results) r.found = document.querySelector(r.selector) != null;
  return { platform: site.platform, checkedAt: new Date().toISOString(), url: location.href, results };
}
