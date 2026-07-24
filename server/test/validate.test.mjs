import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRenderRequest, MAX_CODE_LENGTH, DEFAULTS } from '../src/validate.mjs';

test('rejects empty / missing code', () => {
  for (const body of [{}, { code: '' }, { code: '   ' }, null, undefined]) {
    const r = validateRenderRequest(body);
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => e.includes('code')));
  }
});

test('rejects code over the length cap', () => {
  const r = validateRenderRequest({ code: 'x'.repeat(MAX_CODE_LENGTH + 1) });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('maximum length')));
});

test('applies defaults for optional fields', () => {
  const r = validateRenderRequest({ code: 'graph TD\n A-->B' });
  assert.equal(r.ok, true);
  assert.equal(r.value.theme, DEFAULTS.theme);
  assert.equal(r.value.format, DEFAULTS.format);
  assert.equal(r.value.scale, DEFAULTS.scale);
  assert.equal(r.value.background, DEFAULTS.background);
  assert.ok(r.value.themeConfig, 'themeConfig resolved');
});

test('rejects unknown theme / format / scale', () => {
  assert.equal(validateRenderRequest({ code: 'graph TD\n A-->B', theme: 'nope' }).ok, false);
  assert.equal(validateRenderRequest({ code: 'graph TD\n A-->B', format: 'tiff' }).ok, false);
  assert.equal(validateRenderRequest({ code: 'graph TD\n A-->B', scale: 3 }).ok, false);
});

test('accepts every advertised theme/format/scale combo shape', () => {
  const r = validateRenderRequest({ code: 'graph TD\n A-->B', theme: 'cyberpunk', format: 'webp', scale: 4 });
  assert.equal(r.ok, true);
  assert.equal(r.value.themeConfig.baseTheme, 'dark'); // cyberpunk maps to dark base
});
