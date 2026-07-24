import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, FORMATS, SCALES, getThemeConfig } from '../src/themes.mjs';

test('exposes the 8 web-app themes', () => {
  assert.deepEqual(THEMES, [
    'default', 'neutral', 'dark', 'forest', 'cyberpunk', 'ocean', 'sunset', 'minimal',
  ]);
});

test('advertises the expected formats and scales', () => {
  assert.deepEqual(FORMATS, ['svg', 'png', 'jpeg', 'webp']);
  assert.deepEqual(SCALES, [1, 2, 4]);
});

test('default maps to the dark base theme (matches web preview)', () => {
  assert.deepEqual(getThemeConfig('default'), { baseTheme: 'dark' });
});

test('custom themes carry themeVariables', () => {
  for (const t of ['cyberpunk', 'ocean', 'sunset', 'minimal']) {
    const cfg = getThemeConfig(t);
    assert.ok(cfg.baseTheme, `${t} has a base theme`);
    assert.ok(cfg.variables && Object.keys(cfg.variables).length > 0, `${t} has variables`);
  }
});

test('built-in themes pass through as their own base', () => {
  assert.deepEqual(getThemeConfig('forest'), { baseTheme: 'forest' });
  assert.deepEqual(getThemeConfig('neutral'), { baseTheme: 'neutral' });
});
