import { browser } from 'wxt/browser';
import { supabase } from '../../lib/supabase';
import { $ } from '../../lib/html';
import { renderItems } from './items-table';
import { setupEditor, openEditor } from './editor';
import { setupHealth } from './health';

async function refresh() {
  try {
    await renderItems($('#items'), (id) => openEditor(id, refresh));
    $('#list-error').textContent = '';
  } catch (e) {
    $('#list-error').textContent = e instanceof Error ? e.message : String(e);
  }
}

async function showForSession() {
  const { data } = await supabase.auth.getSession();
  const signedIn = !!data.session;
  $('#signin').hidden = signedIn;
  $('#app').hidden = !signedIn;
  $('#who').textContent = data.session?.user.email ?? '';
  if (signedIn) await refresh();
}

$('#signin-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const f = new FormData(ev.target as HTMLFormElement);
  const { error } = await supabase.auth.signInWithPassword({
    email: String(f.get('email')),
    password: String(f.get('password')),
  });
  $('#signin-error').textContent = error?.message ?? '';
  if (!error) await showForSession();
});

$('#new-item').addEventListener('click', () => openEditor(null, refresh));

// Refresh when a listing goes live in another tab.
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && Object.keys(changes).some((k) => k.startsWith('listing-change'))) void refresh();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !$('#app').hidden) void refresh();
});

setupEditor();
setupHealth();
void showForSession();
