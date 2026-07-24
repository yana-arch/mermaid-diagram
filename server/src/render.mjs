/**
 * Server-side Mermaid render engine (Puppeteer / headless Chromium).
 *
 * Why a real browser: Mermaid v11 measures text with getBBox() /
 * getComputedTextLength() to lay out diagrams. jsdom has no layout engine, so
 * SVG rendered there collapses (verified experimentally). Chromium provides the
 * real layout, matching the browser preview exactly.
 *
 * A single browser instance is reused across requests; each request runs in its
 * own page and the page is always closed in a finally block.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);

/** Resolve the installed mermaid UMD bundle so we can inline it into the page. */
function loadMermaidSource() {
  // mermaid ships a UMD build usable directly in a <script> tag.
  const path = require.resolve('mermaid/dist/mermaid.min.js');
  return readFileSync(path, 'utf8');
}

const MERMAID_SRC = loadMermaidSource();

/**
 * @typedef {Object} RenderResult
 * @property {Buffer|string} data  Buffer for raster formats, SVG string for svg
 * @property {string} contentType
 * @property {string} format
 * @property {number} width   intrinsic SVG width in px
 * @property {number} height  intrinsic SVG height in px
 */

const MIME = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

/**
 * Render mermaid code to an image.
 *
 * Browser-agnostic: the caller supplies a launched Puppeteer/puppeteer-core
 * `browser` (from browser-local.mjs or browser-serverless.mjs). This keeps the
 * render logic identical across the standalone server and the Vercel function.
 *
 * @param {import('./validate.mjs').RenderRequest & {themeConfig: any}} req
 * @param {{ browser: import('puppeteer-core').Browser }} deps
 * @returns {Promise<RenderResult>}
 */
export async function renderMermaid(req, deps) {
  const { code, format, scale, background, themeConfig } = req;
  const browser = deps && deps.browser;
  if (!browser) {
    throw new Error('renderMermaid requires a { browser } instance.');
  }

  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: scale });
    // Blank same-origin document; we inline mermaid so there is no network use.
    await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><div id="container"></div></body></html>', {
      waitUntil: 'load',
    });
    await page.addScriptTag({ content: MERMAID_SRC });

    // Render inside the page (real layout engine available here).
    const evaluated = await page.evaluate(
      async (code, themeConfig, background) => {
        // eslint-disable-next-line no-undef
        const mermaid = window.mermaid;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict', // safe: no script/click handlers, sanitized
          suppressErrorRendering: true,
          theme: themeConfig.baseTheme,
          themeVariables: themeConfig.variables,
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        });

        let svg;
        try {
          const out = await mermaid.render('apiGraph', code);
          svg = out.svg;
        } catch (err) {
          return { error: (err && err.message) || String(err) };
        }

        const container = document.getElementById('container');
        container.innerHTML = svg;
        const svgEl = container.querySelector('svg');

        // Determine intrinsic size from the viewBox (robust across diagram types).
        const vb = svgEl.viewBox && svgEl.viewBox.baseVal;
        let width = (vb && vb.width) || svgEl.getBBox().width || 300;
        let height = (vb && vb.height) || svgEl.getBBox().height || 300;
        width = Math.max(1, Math.ceil(width));
        height = Math.max(1, Math.ceil(height));

        // Normalise the SVG to explicit pixel dimensions so raster output is crisp.
        svgEl.setAttribute('width', String(width));
        svgEl.setAttribute('height', String(height));
        if (background && background !== 'transparent') {
          svgEl.style.background = background;
          container.style.background = background;
        }

        return {
          svg: container.innerHTML,
          width,
          height,
        };
      },
      code,
      themeConfig,
      background,
    );

    if (evaluated && evaluated.error) {
      const e = new Error(evaluated.error);
      e.code = 'MERMAID_SYNTAX_ERROR';
      throw e;
    }

    const { svg, width, height } = evaluated;

    if (format === 'svg') {
      return { data: svg, contentType: MIME.svg, format, width, height };
    }

    // Raster: screenshot the <svg> element so scale/deviceScaleFactor applies.
    const svgHandle = await page.$('#container svg');
    const screenshotOpts = {
      type: format === 'jpeg' ? 'jpeg' : format, // 'png' | 'jpeg' | 'webp'
      omitBackground: format !== 'jpeg' && background === 'transparent',
    };
    if (format === 'jpeg' || format === 'webp') {
      screenshotOpts.quality = 92;
    }
    const buffer = await svgHandle.screenshot(screenshotOpts);

    return {
      data: Buffer.from(buffer),
      contentType: MIME[format],
      format,
      width: width * scale,
      height: height * scale,
    };
  } finally {
    await page.close().catch(() => {});
  }
}
