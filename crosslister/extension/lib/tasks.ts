// Remembers which tab the extension opened, and why. Kept in storage.session because
// the MV3 service worker can be stopped at any time and loses its variables.
import { browser } from 'wxt/browser';
import type { Platform } from '../../shared/types';

export type TabTask =
  | { mode: 'fill'; platform: Platform; itemId: string; listingId: string }
  | { mode: 'healthcheck'; platform: Platform };

const key = (tabId: number) => `task:${tabId}`;

export async function setTabTask(tabId: number, task: TabTask) {
  await browser.storage.session.set({ [key(tabId)]: task });
}

export async function getTabTask(tabId: number): Promise<TabTask | null> {
  return ((await browser.storage.session.get(key(tabId)))[key(tabId)] as TabTask | undefined) ?? null;
}

export async function clearTabTask(tabId: number) {
  await browser.storage.session.remove(key(tabId));
}
