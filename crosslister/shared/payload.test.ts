import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPayload } from './payload.ts';
import type { Item } from './types.ts';

const item: Item = {
  id: 'i1',
  sku: 'CL-1',
  title: 'Levi 501 jeans',
  description: 'Straight leg, light wash.',
  brand: 'Levi’s',
  category: 'men/jeans',
  size: '32',
  color: 'Blue',
  condition: 'good',
  price_cents: 3500,
  original_price_cents: 8000,
  cost_cents: 500,
  status: 'draft',
  created_at: '2026-01-01T00:00:00Z',
  sold_at: null,
};

test('poshmark payload keeps title separate', () => {
  const r = buildPayload(item, 'poshmark');
  assert.ok(r.ok);
  assert.equal(r.payload.title, 'Levi 501 jeans');
  assert.equal(r.payload.description, 'Straight leg, light wash.');
  assert.deepEqual(r.payload.category, ['Men', 'Jeans']);
  assert.equal(r.payload.price, '35');
  assert.equal(r.payload.originalPrice, '80');
});

test('depop payload folds title into description', () => {
  const r = buildPayload(item, 'depop');
  assert.ok(r.ok);
  assert.equal(r.payload.title, null);
  assert.equal(r.payload.description, 'Levi 501 jeans\n\nStraight leg, light wash.');
  assert.equal(r.payload.price, '35.00');
});

test('per-platform price overrides item price', () => {
  const r = buildPayload(item, 'depop', 3999);
  assert.ok(r.ok);
  assert.equal(r.payload.price, '39.99');
});

test('reports every problem at once', () => {
  const r = buildPayload(
    { ...item, title: ' ', category: 'nope', condition: null, price_cents: null, original_price_cents: null },
    'poshmark',
  );
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.problems.length, 5);
});

test('original price is not required on depop', () => {
  assert.ok(buildPayload({ ...item, original_price_cents: null }, 'depop').ok);
});

test('rejects a poshmark title over 80 chars', () => {
  const r = buildPayload({ ...item, title: 'x'.repeat(81) }, 'poshmark');
  assert.equal(r.ok, false);
});

test('rejects a depop description over 1000 chars once the title is folded in', () => {
  const r = buildPayload({ ...item, description: 'x'.repeat(990) }, 'depop');
  assert.equal(r.ok, false);
  assert.ok(buildPayload({ ...item, description: 'x'.repeat(990) }, 'poshmark').ok);
});
