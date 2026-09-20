import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dishSchema, restaurantSchema, priceLabel, isAssetUrl } from '../../src/lib/validation.ts';
import { menuUrl } from '../../src/lib/site-url.ts';
import { seed } from '../../src/lib/seed.ts';

test('prices preserve two decimals without adding decimals to whole amounts', () => {
  assert.match(priceLabel(12.5, 'ARS'), /12,50/);
  assert.match(priceLabel(12.5, 'USD'), /12,50/);
  assert.match(priceLabel(14500, 'ARS'), /14\.500$/);
  assert.equal(dishSchema.safeParse({ ...seed.dishes[0], price: 12.555 }).success, false);
});
test('invalid asset URLs cannot break the image or model component', () => {
  for (const value of ['https://', 'javascript:alert(1)', '//evil.test/a', '/media/../../secret', 'https://user:pass@example.com/a']) assert.equal(isAssetUrl(value), false, value);
  assert.equal(isAssetUrl('https://example.com/photo.jpg'), true);
  assert.equal(isAssetUrl('/media/photo.jpg'), true);
  assert.equal(isAssetUrl('/models/burger.glb', 'model'), true);
  assert.equal(isAssetUrl('/models/burger.glb', 'image'), false);
});
test('categories cannot duplicate with different case or surrounding spaces', () => {
  assert.equal(restaurantSchema.safeParse({ ...seed.restaurants[0], categories: ['Postres', ' postres '] }).success, false);
});
test('all seeded dishes and restaurants satisfy the schemas', () => {
  seed.restaurants.forEach(r => restaurantSchema.parse(r));
  seed.dishes.forEach(d => dishSchema.parse(d));
});
test('QR uses the permanent origin and rejects credentials or embedded paths', () => {
  assert.equal(menuUrl('brasa', 'http://localhost:3000', 'https://mesa.example/'), 'https://mesa.example/r/brasa');
  assert.equal(menuUrl('brasa', 'http://127.0.0.1:3192'), 'http://127.0.0.1:3192/r/brasa');
  for (const origin of ['https://mesa.example/r/brasa', 'https://mesa.example/?a=1', 'https://me:secret@mesa.example', 'http://mesa.example']) assert.throws(() => menuUrl('brasa', 'http://localhost:3000', origin));
});
