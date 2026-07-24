import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { renderMermaid } from '../src/render.mjs';
import { validateRenderRequest } from '../src/validate.mjs';

// Render needs a real browser. Launch full puppeteer if it's installed;
// otherwise skip (e.g. CI without Chromium) rather than fail.
let browser = null;
let skipReason = null;

before(async () => {
  try {
    const { default: puppeteer } = await import('puppeteer');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
  } catch (e) {
    skipReason = `browser unavailable: ${e.message}`;
  }
});

after(async () => {
  if (browser) await browser.close();
});

test('renders a flowchart to a non-trivial PNG buffer', async (t) => {
  if (!browser) return t.skip(skipReason);
  const v = validateRenderRequest({ code: 'flowchart TD\n A[Start]-->B[End]', theme: 'dark', format: 'png', scale: 2 });
  assert.equal(v.ok, true);
  const r = await renderMermaid(v.value, { browser });
  assert.equal(r.contentType, 'image/png');
  assert.ok(Buffer.isBuffer(r.data));
  assert.ok(r.data.length > 1000, 'PNG has real bytes');
  assert.ok(r.width > 0 && r.height > 0, 'has positive dimensions');
});

test('renders valid SVG with real (non-collapsed) layout', async (t) => {
  if (!browser) return t.skip(skipReason);
  const v = validateRenderRequest({ code: 'flowchart LR\n A-->B-->C', format: 'svg' });
  const r = await renderMermaid(v.value, { browser });
  assert.equal(r.contentType, 'image/svg+xml');
  assert.match(r.data, /<svg[\s>]/);
  assert.ok(r.width > 50, `width ${r.width} looks laid-out, not collapsed`);
});

test('throws MERMAID_SYNTAX_ERROR on invalid source', async (t) => {
  if (!browser) return t.skip(skipReason);
  const v = validateRenderRequest({ code: '@@@ definitely not mermaid @@@', format: 'png' });
  await assert.rejects(
    () => renderMermaid(v.value, { browser }),
    (err) => err.code === 'MERMAID_SYNTAX_ERROR',
  );
});
