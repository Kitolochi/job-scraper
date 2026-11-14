// One Supabase client for the background worker and extension pages.
// The session is kept in chrome.storage.local (service workers have no localStorage),
// so it never touches Poshmark's or Depop's own storage.
import { createClient } from '@supabase/supabase-js';
import { browser } from 'wxt/browser';

const chromeStorage = {
  getItem: async (key: string) => ((await browser.storage.local.get(key))[key] as string | undefined) ?? null,
  setItem: async (key: string, value: string) => browser.storage.local.set({ [key]: value }),
  removeItem: async (key: string) => browser.storage.local.remove(key),
};

export const supabase = createClient(import.meta.env.WXT_SUPABASE_URL, import.meta.env.WXT_SUPABASE_ANON_KEY, {
  auth: { storage: chromeStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

export const PHOTO_BUCKET = 'photos';
