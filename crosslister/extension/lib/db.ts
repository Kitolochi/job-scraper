// Database and photo-storage calls. Every function throws on a Supabase error.
import type { Item, Listing, Photo, Platform } from '../../shared/types';
import { PHOTO_BUCKET, supabase } from './supabase';

export type ItemRow = Item & { photos: Photo[]; listings: Listing[] };
export type ItemInput = Omit<Item, 'id' | 'created_at' | 'sold_at' | 'status'> & { id?: string };

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export async function listItems(): Promise<ItemRow[]> {
  const rows = check(
    await supabase.from('items').select('*, photos(*), listings(*)').order('created_at', { ascending: false }),
  ) as ItemRow[];
  for (const r of rows) r.photos.sort((a, b) => a.position - b.position);
  return rows;
}

export async function getItem(id: string): Promise<ItemRow> {
  const row = check(await supabase.from('items').select('*, photos(*), listings(*)').eq('id', id).single()) as ItemRow;
  row.photos.sort((a, b) => a.position - b.position);
  return row;
}

export async function saveItem(input: ItemInput): Promise<Item> {
  const { id, ...fields } = input;
  const res = id
    ? await supabase.from('items').update(fields).eq('id', id).select().single()
    : await supabase.from('items').insert(fields).select().single();
  return check(res) as Item;
}

export async function uploadPhotos(itemId: string, files: File[], startPosition: number): Promise<void> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('not signed in');
  for (const [i, file] of files.entries()) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${data.user.id}/${itemId}/${crypto.randomUUID()}.${ext}`;
    check(await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type }));
    check(await supabase.from('photos').insert({ item_id: itemId, storage_path: path, position: startPosition + i }));
  }
}

export async function deletePhoto(photo: Photo): Promise<void> {
  check(await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]));
  check(await supabase.from('photos').delete().eq('id', photo.id));
}

export async function photoUrls(photos: Photo[]): Promise<string[]> {
  if (!photos.length) return [];
  const data = check(
    await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(photos.map((p) => p.storage_path), 3600),
  );
  return (data ?? []).map((d) => d.signedUrl ?? '');
}

export async function downloadPhoto(photo: Photo): Promise<Blob> {
  return check(await supabase.storage.from(PHOTO_BUCKET).download(photo.storage_path)) as Blob;
}

/** Creates or resets the listing row for this item on this platform. Refuses if it is already live. */
export async function preparePendingListing(item: Item, platform: Platform): Promise<Listing> {
  const existing = check(
    await supabase.from('listings').select('*').eq('item_id', item.id).eq('platform', platform).maybeSingle(),
  ) as Listing | null;
  if (existing?.status === 'live') throw new Error(`already live on ${platform}: ${existing.url ?? ''}`);
  const row = { item_id: item.id, platform, status: 'pending', last_error: null, price_cents: existing?.price_cents ?? item.price_cents };
  return check(await supabase.from('listings').upsert(row, { onConflict: 'item_id,platform' }).select().single()) as Listing;
}

export async function updateListing(id: string, fields: Partial<Listing>): Promise<void> {
  check(await supabase.from('listings').update(fields).eq('id', id));
}

export async function markItemActive(itemId: string): Promise<void> {
  check(await supabase.from('items').update({ status: 'active' }).eq('id', itemId).eq('status', 'draft'));
}
