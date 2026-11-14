import { browser } from 'wxt/browser';
import { PLATFORMS } from '../../../shared/types';
import { listItems } from '../../lib/db';
import { supabase } from '../../lib/supabase';
import { esc } from '../../lib/html';

const list = document.getElementById('list')!;
document.getElementById('open')!.onclick = () => browser.runtime.openOptionsPage();

async function render() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    list.innerHTML = '<li class="muted">Not signed in. Open Crosslister to sign in.</li>';
    return;
  }
  const items = (await listItems()).filter((i) => i.status !== 'archived');
  list.innerHTML =
    items
      .map((it) => {
        const links = PLATFORMS.map((p) => {
          const l = it.listings.find((x) => x.platform === p);
          if (l?.status === 'live' && l.url) return `<a href="${esc(l.url)}" target="_blank">${p}</a>`;
          if (l) return `<span class="${l.status === 'error' ? 'bad' : 'muted'}">${p}: ${esc(l.status)}</span> `;
          return `<span class="muted">${p}: —</span> `;
        }).join('');
        return `<li><strong>${esc(it.title || it.sku)}</strong> <span class="muted">${esc(it.status)}</span><br>${links}</li>`;
      })
      .join('') || '<li class="muted">No items yet.</li>';
}

render().catch((e) => (list.innerHTML = `<li class="bad">${esc(e instanceof Error ? e.message : e)}</li>`));
