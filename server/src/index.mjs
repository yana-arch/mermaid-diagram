/**
 * Mermaid Render API — HTTP server.
 *
 * Endpoints:
 *   POST /api/render        mermaid code -> image (png/jpeg/webp/svg)
 *   GET  /api/health        liveness probe
 *   GET  /api/capabilities  supported themes / formats / scales / limits
 *
 * SECURITY: this minimal server has NO authentication or rate limiting. The
 * render endpoint drives a headless browser and is therefore DoS-sensitive.
 * Put it behind auth + a rate limiter + resource limits before exposing it
 * publicly. See docs/API.md § Security.
 */
import express from 'express';
import { validateRenderRequest, MAX_CODE_LENGTH, DEFAULTS } from './validate.mjs';
import { renderMermaid } from './render.mjs';
import { getBrowser, closeBrowser } from './browser-local.mjs';
import { THEMES, FORMATS, SCALES } from './themes.mjs';

const PORT = Number(process.env.PORT) || 4001;
const HOST = process.env.HOST || '127.0.0.1';
const RENDER_TIMEOUT_MS = Number(process.env.RENDER_TIMEOUT_MS) || 30_000;
// Body cap slightly above MAX_CODE_LENGTH to allow for JSON envelope overhead.
const BODY_LIMIT = `${Math.ceil((MAX_CODE_LENGTH + 4096) / 1024)}kb`;

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: BODY_LIMIT }));

// Permissive CORS so the SPA (or any client) can call the API. Tighten the
// origin allow-list in production.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/capabilities', (_req, res) => {
  res.json({
    themes: THEMES,
    formats: FORMATS,
    scales: SCALES,
    defaults: DEFAULTS,
    maxCodeLength: MAX_CODE_LENGTH,
  });
});

app.post('/api/render', async (req, res) => {
  const validation = validateRenderRequest(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: 'ValidationError', details: validation.errors });
  }

  try {
    const browser = await getBrowser();
    const result = await Promise.race([
      renderMermaid(validation.value, { browser }),
      new Promise((_, reject) =>
        setTimeout(() => {
          const e = new Error(`Render timed out after ${RENDER_TIMEOUT_MS}ms`);
          e.code = 'RENDER_TIMEOUT';
          reject(e);
        }, RENDER_TIMEOUT_MS),
      ),
    ]);

    // Optional JSON envelope (base64) when the client asks for it; default is
    // raw image bytes with the right Content-Type.
    if (req.query.encoding === 'base64') {
      const dataStr =
        result.format === 'svg'
          ? Buffer.from(result.data).toString('base64')
          : result.data.toString('base64');
      return res.json({
        format: result.format,
        contentType: result.contentType,
        width: result.width,
        height: result.height,
        data: `data:${result.contentType};base64,${dataStr}`,
      });
    }

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('X-Image-Width', String(result.width));
    res.setHeader('X-Image-Height', String(result.height));
    return res.send(result.format === 'svg' ? result.data : result.data);
  } catch (err) {
    if (err && err.code === 'MERMAID_SYNTAX_ERROR') {
      return res.status(422).json({ error: 'MermaidSyntaxError', message: err.message });
    }
    if (err && err.code === 'RENDER_TIMEOUT') {
      return res.status(504).json({ error: 'RenderTimeout', message: err.message });
    }
    console.error('[render] unexpected error:', err);
    return res.status(500).json({ error: 'InternalError', message: 'Failed to render diagram.' });
  }
});

// 404 fallthrough
app.use((_req, res) => res.status(404).json({ error: 'NotFound' }));

let server;
async function start() {
  // Warm the browser so the first request isn't slow (best-effort).
  getBrowser().catch((e) => console.warn('[startup] browser warm-up failed:', e.message));
  server = app.listen(PORT, HOST, () => {
    console.log(`Mermaid Render API listening on http://${HOST}:${PORT}`);
  });
}

async function shutdown(signal) {
  console.log(`\n${signal} received, shutting down...`);
  if (server) server.close();
  await closeBrowser();
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Only auto-start when run directly (not when imported by tests).
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export { app, start };
