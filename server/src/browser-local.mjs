/**
 * Local / long-running browser provider (full `puppeteer`).
 *
 * Used by the standalone Express server (server/src/index.mjs) on a normal
 * machine or container. Bundles its own Chromium, so it "just works" after
 * `npm install`. A single browser instance is launched lazily and reused.
 *
 * `puppeteer` is imported dynamically so this module doesn't hard-fail to load
 * in a serverless bundle where only puppeteer-core is present (that path uses
 * browser-serverless.mjs instead).
 */
let browserPromise = null;

async function launch() {
  const { default: puppeteer } = await import('puppeteer');
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
}

/** Lazily launch (and reuse) a single headless browser. */
export function getBrowser() {
  if (!browserPromise) {
    browserPromise = launch();
  }
  return browserPromise;
}

/** Close the shared browser (used on graceful shutdown). */
export async function closeBrowser() {
  if (browserPromise) {
    const b = await browserPromise.catch(() => null);
    browserPromise = null;
    if (b) await b.close().catch(() => {});
  }
}
