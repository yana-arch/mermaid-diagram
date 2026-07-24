/**
 * Serverless browser provider (Vercel / AWS Lambda).
 *
 * Uses `puppeteer-core` (no bundled Chromium) + `@sparticuz/chromium`, a
 * brotli-compressed Chromium (~50MB) built to fit the Lambda/Vercel bundle and
 * unpack into /tmp at runtime.
 *
 * Dependencies are imported dynamically so the standalone local server (which
 * uses full `puppeteer` via browser-local.mjs) does not need these installed.
 *
 * Within a single function instance the browser is reused across invocations
 * (warm container); a fresh instance cold-starts its own.
 */
let browserPromise = null;

async function launch() {
  const [{ default: chromium }, puppeteer] = await Promise.all([
    import('@sparticuz/chromium'),
    import('puppeteer-core'),
  ]);

  const executablePath = await chromium.executablePath();

  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
  });
}

/** Lazily launch (and reuse within a warm instance) a headless browser. */
export function getBrowser() {
  if (!browserPromise) {
    browserPromise = launch();
  }
  return browserPromise;
}

/** Close the browser. On serverless this is optional (instance is frozen/torn down). */
export async function closeBrowser() {
  if (browserPromise) {
    const b = await browserPromise.catch(() => null);
    browserPromise = null;
    if (b) await b.close().catch(() => {});
  }
}
