/**
 * Vercel serverless function: GET /api/capabilities
 * Static metadata — no browser needed.
 */
import { THEMES, FORMATS, SCALES } from '../src/themes.mjs';
import { MAX_CODE_LENGTH, DEFAULTS } from '../src/validate.mjs';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      themes: THEMES,
      formats: FORMATS,
      scales: SCALES,
      defaults: DEFAULTS,
      maxCodeLength: MAX_CODE_LENGTH,
    }),
  );
}
