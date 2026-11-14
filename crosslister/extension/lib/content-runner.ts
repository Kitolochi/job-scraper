// Shared body of the Poshmark and Depop content scripts.
// Does nothing unless the background worker opened this tab for a fill or a health check.
import { browser } from 'wxt/browser';
import type { SiteConfig } from '../sites/types';
import type { FieldResult, Message, Task } from './messages';
import { checkSelectors, fillForm } from './fill';
import { waitFor } from './dom';

const send = (msg: Message) => browser.runtime.sendMessage(msg);

function showBanner(text: string, isError: boolean) {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = `position:fixed;z-index:2147483647;bottom:16px;right:16px;max-width:360px;padding:12px 14px;
    border-radius:8px;font:14px/1.4 system-ui,sans-serif;white-space:pre-line;color:#fff;
    background:${isError ? '#b42318' : '#1d4ed8'};box-shadow:0 4px 16px rgba(0,0,0,.25);cursor:pointer`;
  el.title = 'Click to dismiss';
  el.onclick = () => el.remove();
  document.body.appendChild(el);
}

function summarize(results: FieldResult[]): { text: string; isError: boolean } {
  const failed = results.filter((r) => !r.ok);
  if (!failed.length) return { text: `Crosslister filled ${results.length} fields.\nReview, then click List yourself.`, isError: false };
  const lines = failed.map((r) => `• ${r.field}: ${r.ok ? '' : r.error}`).join('\n');
  return { text: `Crosslister filled ${results.length - failed.length}/${results.length} fields. Fill these by hand:\n${lines}`, isError: true };
}

export async function runContent(site: SiteConfig) {
  const task = (await send({ type: 'getTask' })) as Task;
  if (!task) return;

  try {
    await waitFor(site.readySelector, 15000);
  } catch {
    // Fall through: the health check reports it as missing, and the fill reports each field.
  }

  if (task.mode === 'healthcheck') {
    await send({ type: 'healthReport', report: checkSelectors(site) });
    showBanner('Crosslister health check sent. See the options page.', false);
    return;
  }

  const results = await fillForm(site, task.payload, task.photos);
  await send({ type: 'fillReport', results });
  const { text, isError } = summarize(results);
  showBanner(text, isError);
}
