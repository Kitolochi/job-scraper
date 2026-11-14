import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES } from '../categories.ts';
import { CONDITIONS, PLATFORMS } from '../types.ts';
import { MAPPINGS } from './index.ts';

for (const platform of PLATFORMS) {
  const m = MAPPINGS[platform];

  test(`${platform}: every category maps to a non-empty click path`, () => {
    for (const c of CATEGORIES) {
      const path = m.category[c];
      assert.ok(Array.isArray(path) && path.length >= 2, `${c} → ${JSON.stringify(path)}`);
      assert.ok(path.every((s) => s.trim().length > 0), `${c} has a blank label`);
    }
  });

  test(`${platform}: no extra categories outside CATEGORIES`, () => {
    assert.deepEqual(Object.keys(m.category).sort(), [...CATEGORIES].sort());
  });

  test(`${platform}: every condition maps to a label`, () => {
    for (const c of CONDITIONS) assert.ok(m.condition[c]?.trim(), c);
  });
}

test('poshmark prices are whole dollars', () => {
  assert.equal(MAPPINGS.poshmark.formatPrice(2499), '25');
  assert.equal(MAPPINGS.poshmark.formatPrice(2000), '20');
});

test('depop prices keep cents', () => {
  assert.equal(MAPPINGS.depop.formatPrice(2499), '24.99');
  assert.equal(MAPPINGS.depop.formatPrice(2000), '20.00');
});
