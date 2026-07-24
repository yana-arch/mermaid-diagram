/**
 * Vercel serverless function: POST /api/render
 *
 * Reuses the same validation + render logic as the standalone server, but
 * launches Chromium via the serverless provider (@sparticuz/chromium +
 * puppeteer-core). Configure the deploy with Root Directory = `server`.
 *
 * Runtime notes:
 * - Set a generous maxDuration (see vercel.json); Chromium cold start is ~2-5s.
 * - Hobby plan caps function duration at ~10s — complex diagrams may need Pro.
 */
import { validateRenderRequest } from '../src/validate.mjs';
import { renderMermaid } from '../src/render.mjs';
import { getBrowser } from '../src/browser-serverless.mjs';

export const config = {
  // Vercel Node.js runtime (not Edge — Chromium needs full Node).
  maxDuration: 60,
};

/**
 * @param {import('http').IncomingMessage & { method?: string, body?: any, query?: any }} req
 * @param {import('http').ServerResponse} res
 */
export default async function handler(req, res) {
  // Basic CORS (tighten origin in production).
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'MethodNotAllowed' }));
  }

  // Vercel parses JSON into req.body for us; guard for string bodies too.
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const validation = validateRenderRequest(body);
  if (!validation.ok) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'ValidationError', details: validation.errors }));
  }

  try {
    const browser = await getBrowser();
    const result = await renderMermaid(validation.value, { browser });

    const wantsBase64 =
      (req.query && (req.query.encoding === 'base64')) ||
      (req.url && req.url.includes('encoding=base64'));

    if (wantsBase64) {
      const dataStr =
        result.format === 'svg'
          ? Buffer.from(result.data).toString('base64')
          : result.data.toString('base64');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          format: result.format,
          contentType: result.contentType,
          width: result.width,
          height: result.height,
          data: `data:${result.contentType};base64,${dataStr}`,
        }),
      );
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('X-Image-Width', String(result.width));
    res.setHeader('X-Image-Height', String(result.height));
    return res.end(result.format === 'svg' ? result.data : result.data);
  } catch (err) {
    if (err && err.code === 'MERMAID_SYNTAX_ERROR') {
      res.statusCode = 422;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'MermaidSyntaxError', message: err.message }));
    }
    console.error('[api/render] error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'InternalError', message: 'Failed to render diagram.' }));
  }
}
