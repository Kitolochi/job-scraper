import { browser } from 'wxt/browser';
import { PLATFORMS, type Listing, type Platform } from '../../../shared/types';
import { listItems, type ItemRow } from '../../lib/db';
import { dollars, esc } from '../../lib/html';
import type { Message, StartResult } from '../../lib/messages';

function platformCell(item: ItemRow, platform: Platform): string {
  const l: Listing | undefined = item.listings.find((x) => x.platform === platform);
  const button = `<button data-list="${platform}" data-id="${esc(item.id)}">List on ${platform}</button>`;
  if (!l) return button;
  const err = l.last_error ? `<div class="bad status">${esc(l.last_error)}</div>` : '';
  if (l.status === 'live' && l.url) return `<a href="${esc(l.url)}" target="_blank">live ↗</a>${err}`;
  const retry = l.status === 'pending' || l.status === 'error' ? `<br>${button}` : '';
  return `<span class="status">${esc(l.status)}</span>${err}${retry}`;
}

export async function renderItems(table: HTMLElement, onEdit: (id: string) => void) {
  const items = await listItems();
  table.innerHTML = `
    <tr><th>SKU</th><th>Title</th><th>Price</th><th>Status</th>
      ${PLATFORMS.map((p) => `<th>${p}</th>`).join('')}<th></th></tr>
    ${items
      .map(
        (it) => `<tr>
          <td>${esc(it.sku)}</td>
          <td>${esc(it.title)}<div class="muted status">${it.photos.length} photo(s)</div></td>
          <td>$${dollars(it.price_cents)}</td>
          <td>${esc(it.status)}</td>
          ${PLATFORMS.map((p) => `<td>${platformCell(it, p)}</td>`).join('')}
          <td><button data-edit="${esc(it.id)}">Edit</button></td>
        </tr>`,
      )
      .join('')}
    ${items.length ? '' : '<tr><td colspan="7" class="muted">No items yet.</td></tr>'}`;

  table.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach((b) => (b.onclick = () => onEdit(b.dataset.edit!)));
  table.querySelectorAll<HTMLButtonElement>('[data-list]').forEach(
    (b) =>
      (b.onclick = async () => {
        b.disabled = true;
        const msg: Message = { type: 'startListing', itemId: b.dataset.id!, platform: b.dataset.list as Platform };
        const res = (await browser.runtime.sendMessage(msg)) as StartResult;
        if (!res.ok) alert(res.error);
        b.disabled = false;
      }),
  );
}
