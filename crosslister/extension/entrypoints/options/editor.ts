import { CATEGORIES } from '../../../shared/categories';
import { CONDITIONS, type Condition } from '../../../shared/types';
import { deletePhoto, getItem, photoUrls, saveItem, uploadPhotos, type ItemRow } from '../../lib/db';
import { $, dollars, esc, toCents } from '../../lib/html';

let current: ItemRow | null = null;
let onSaved: () => void = () => {};

const form = () => $<HTMLFormElement>('#item-form');
const field = (name: string) => form().elements.namedItem(name) as HTMLInputElement;

function newSku(): string {
  const d = new Date();
  const ymd = `${d.getFullYear() % 100}`.padStart(2, '0') + `${d.getMonth() + 1}`.padStart(2, '0') + `${d.getDate()}`.padStart(2, '0');
  return `CL-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function renderPhotos() {
  const box = $('#photos');
  const photos = current?.photos ?? [];
  const urls = await photoUrls(photos);
  box.innerHTML = photos
    .map((p, i) => `<figure><img src="${esc(urls[i])}" alt=""><button type="button" data-del="${esc(p.id)}">×</button></figure>`)
    .join('');
  box.querySelectorAll<HTMLButtonElement>('[data-del]').forEach(
    (b) =>
      (b.onclick = async () => {
        const photo = current!.photos.find((p) => p.id === b.dataset.del)!;
        await deletePhoto(photo);
        current = await getItem(current!.id);
        await renderPhotos();
      }),
  );
}

export async function openEditor(id: string | null, refresh: () => void) {
  onSaved = refresh;
  form().reset();
  $('#form-error').textContent = '';
  current = id ? await getItem(id) : null;
  $('#editor-title').textContent = current ? `Edit ${current.sku}` : 'New item';
  if (current) {
    field('id').value = current.id;
    field('sku').value = current.sku;
    field('title').value = current.title;
    field('description').value = current.description;
    field('brand').value = current.brand ?? '';
    field('category').value = current.category ?? '';
    field('size').value = current.size ?? '';
    field('color').value = current.color ?? '';
    field('condition').value = current.condition ?? '';
    field('price').value = dollars(current.price_cents);
    field('original_price').value = dollars(current.original_price_cents);
    field('cost').value = dollars(current.cost_cents);
  } else {
    field('id').value = '';
  }
  await renderPhotos();
  $('#editor').hidden = false;
  $('#editor').scrollIntoView({ behavior: 'smooth' });
}

async function save(ev: SubmitEvent) {
  ev.preventDefault();
  const button = (ev.submitter as HTMLButtonElement | null) ?? null;
  if (button) button.disabled = true;
  try {
    const saved = await saveItem({
      id: field('id').value || undefined,
      sku: field('sku').value.trim() || newSku(),
      title: field('title').value.trim(),
      description: field('description').value.trim(),
      brand: field('brand').value.trim() || null,
      category: field('category').value || null,
      size: field('size').value.trim() || null,
      color: field('color').value.trim() || null,
      condition: (field('condition').value || null) as Condition | null,
      price_cents: toCents(field('price').value),
      original_price_cents: toCents(field('original_price').value),
      cost_cents: toCents(field('cost').value),
    });
    const files = [...(field('files').files ?? [])];
    const nextPosition = (current?.photos.at(-1)?.position ?? -1) + 1;
    if (files.length) await uploadPhotos(saved.id, files, nextPosition);
    current = await getItem(saved.id);
    await openEditor(saved.id, onSaved);
    onSaved();
  } catch (e) {
    $('#form-error').textContent = e instanceof Error ? e.message : String(e);
  } finally {
    if (button) button.disabled = false;
  }
}

export function setupEditor() {
  const options = (values: readonly string[]) =>
    `<option value="">—</option>` + values.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  field('category').innerHTML = options(CATEGORIES);
  field('condition').innerHTML = options(CONDITIONS);
  form().addEventListener('submit', save);
  $('#cancel-edit').addEventListener('click', () => ($('#editor').hidden = true));
}
