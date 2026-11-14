// Background worker. Phase 1: opens new-listing tabs, hands the content script the item,
// and saves the listing URL once the site redirects after you click List.
// Phase 2 adds the delist job runner here.
import { browser } from 'wxt/browser';
import { buildPayload } from '../../shared/payload';
import type { Platform } from '../../shared/types';
import { SITES } from '../sites';
import { downloadPhoto, getItem, markItemActive, preparePendingListing, updateListing } from '../lib/db';
import type { FieldResult, HealthReport, Message, PhotoData, StartResult, Task } from '../lib/messages';
import { clearTabTask, getTabTask, setTabTask } from '../lib/tasks';

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function startListing(itemId: string, platform: Platform): Promise<StartResult> {
  try {
    const item = await getItem(itemId);
    if (!item.photos.length) return { ok: false, error: 'add at least one photo first' };
    const built = buildPayload(item, platform);
    if (!built.ok) return { ok: false, error: built.problems.join('; ') };
    const listing = await preparePendingListing(item, platform);
    const tab = await browser.tabs.create({ url: SITES[platform].createUrl, active: true });
    await setTabTask(tab.id!, { mode: 'fill', platform, itemId, listingId: listing.id });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}

async function startHealthCheck(platform: Platform): Promise<StartResult> {
  const tab = await browser.tabs.create({ url: SITES[platform].createUrl, active: true });
  await setTabTask(tab.id!, { mode: 'healthcheck', platform });
  return { ok: true };
}

async function taskForTab(tabId: number): Promise<Task> {
  const t = await getTabTask(tabId);
  if (!t) return null;
  if (t.mode === 'healthcheck') return { mode: 'healthcheck', platform: t.platform };

  const item = await getItem(t.itemId);
  const listingPrice = item.listings.find((l) => l.platform === t.platform)?.price_cents;
  const built = buildPayload(item, t.platform, listingPrice);
  if (!built.ok) {
    await updateListing(t.listingId, { status: 'error', last_error: built.problems.join('; ') });
    return null;
  }
  const photos: PhotoData[] = [];
  for (const p of item.photos) {
    const blob = await downloadPhoto(p);
    photos.push({ name: p.storage_path.split('/').pop()!, type: blob.type || 'image/jpeg', base64: await blobToBase64(blob) });
  }
  return { mode: 'fill', platform: t.platform, payload: built.payload, photos };
}

async function saveFillReport(tabId: number, results: FieldResult[]) {
  const t = await getTabTask(tabId);
  if (t?.mode !== 'fill') return;
  const failed = results.filter((r) => !r.ok).map((r) => `${r.field}: ${r.ok ? '' : r.error}`);
  await updateListing(t.listingId, { last_error: failed.length ? `fill: ${failed.join('; ')}` : null });
}

async function saveHealthReport(report: HealthReport) {
  await browser.storage.local.set({ [`health:${report.platform}`]: report });
}

/** After you click List, the site redirects to the new listing. Capture its URL and ID. */
async function onTabUrl(tabId: number, url: string) {
  const t = await getTabTask(tabId);
  if (t?.mode !== 'fill') return;
  const match = SITES[t.platform].listingUrlPattern.exec(url);
  if (!match) return;
  try {
    await updateListing(t.listingId, { status: 'live', url: url.split(/[?#]/)[0], external_id: match[1] });
    await markItemActive(t.itemId);
    await browser.storage.local.set({ 'listing-change': Date.now() }); // tells open pages to refresh
  } catch (e) {
    console.error('could not save listing URL', e);
    return; // keep the task so a later navigation can retry
  }
  await clearTabTask(tabId);
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((raw, sender) => {
    const msg = raw as Message;
    const tabId = sender.tab?.id;
    switch (msg.type) {
      case 'startListing':
        return startListing(msg.itemId, msg.platform);
      case 'startHealthCheck':
        return startHealthCheck(msg.platform);
      case 'getTask':
        return tabId == null ? Promise.resolve(null) : taskForTab(tabId);
      case 'fillReport':
        return tabId == null ? undefined : saveFillReport(tabId, msg.results);
      case 'healthReport':
        if (tabId != null) void clearTabTask(tabId);
        return saveHealthReport(msg.report);
    }
  });

  browser.tabs.onUpdated.addListener((tabId, change) => {
    if (change.url) void onTabUrl(tabId, change.url);
  });
  browser.tabs.onRemoved.addListener((tabId) => void clearTabTask(tabId));
});
