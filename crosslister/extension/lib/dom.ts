// DOM helpers for filling forms built with React/Vue. Used only by content scripts.

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Short random pause between actions, so filling looks like typing rather than a burst. */
export const shortPause = () => sleep(150 + Math.random() * 350);

const norm = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

export async function waitFor<T extends Element = Element>(selector: string, timeoutMs = 5000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const el = document.querySelector<T>(selector);
    if (el) return el;
    await sleep(100);
  }
  throw new Error(`not found: ${selector}`);
}

/** Waits for an element matching `selector` whose visible text equals `text` (case-insensitive). */
export async function waitForText(selector: string, text: string, timeoutMs = 5000): Promise<HTMLElement> {
  const want = norm(text);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      if (norm(el.textContent) === want) return el;
    }
    await sleep(100);
  }
  throw new Error(`no option "${text}" in ${selector}`);
}

/**
 * Sets an input's value so frameworks notice. Content scripts run in an isolated world,
 * so the page's React value tracker still holds the old value and sees the change.
 */
export function setValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  el.focus();
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.blur();
}

export function setFiles(input: HTMLInputElement, files: File[]) {
  const dt = new DataTransfer();
  for (const f of files) dt.items.add(f);
  input.files = dt.files;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

export function base64ToFile(base64: string, name: string, type: string): File {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type });
}
