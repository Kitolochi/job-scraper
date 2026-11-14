import { browser } from 'wxt/browser';
import { PLATFORMS, type Platform } from '../../../shared/types';
import { $, esc } from '../../lib/html';
import type { HealthReport, Message } from '../../lib/messages';

async function render() {
  const keys = PLATFORMS.map((p) => `health:${p}`);
  const stored = await browser.storage.local.get(keys);
  $('#health').innerHTML = PLATFORMS.map((p) => {
    const r = stored[`health:${p}`] as HealthReport | undefined;
    if (!r) return `<h3>${p}</h3><p class="muted">Not checked yet.</p>`;
    const missing = r.results.filter((x) => !x.found).length;
    return `<h3>${p} <span class="${missing ? 'bad' : 'ok'}">${missing ? `${missing} missing` : 'all found'}</span></h3>
      <p class="muted">${esc(new Date(r.checkedAt).toLocaleString())} — ${esc(r.url)}</p>
      <table>${r.results
        .map((x) => `<tr><td class="${x.found ? 'ok' : 'bad'}">${x.found ? '✓' : '✗'}</td><td>${esc(x.name)}</td><td><code>${esc(x.selector)}</code></td></tr>`)
        .join('')}</table>`;
  }).join('');
}

export function setupHealth() {
  document.querySelectorAll<HTMLButtonElement>('[data-health]').forEach(
    (b) =>
      (b.onclick = () => {
        const msg: Message = { type: 'startHealthCheck', platform: b.dataset.health as Platform };
        void browser.runtime.sendMessage(msg);
      }),
  );
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && Object.keys(changes).some((k) => k.startsWith('health:'))) void render();
  });
  void render();
}
