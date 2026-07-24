/**
 * Request validation for the render API.
 *
 * Keeps the render endpoint from being trivially abused: bounds the code size,
 * whitelists theme/format/scale, and normalises defaults. This is a minimal
 * safety net — NOT a substitute for auth + rate limiting before exposing the
 * service publicly (see docs/API.md § Security).
 */
import { THEMES, FORMATS, SCALES, getThemeConfig } from './themes.mjs';

/** Hard cap on mermaid source length (characters). Generous but bounded. */
export const MAX_CODE_LENGTH = 50_000;

export const DEFAULTS = {
  theme: 'default',
  format: 'png',
  scale: 2,
  background: 'transparent', // 'transparent' | 'white' | any CSS color
};

/**
 * @typedef {Object} RenderRequest
 * @property {string} code
 * @property {string} theme
 * @property {string} format
 * @property {number} scale
 * @property {string} background
 */

/**
 * Validate and normalise a raw request body.
 * @param {unknown} body
 * @returns {{ ok: true, value: RenderRequest } | { ok: false, errors: string[] }}
 */
export function validateRenderRequest(body) {
  const errors = [];
  const b = body && typeof body === 'object' ? body : {};

  // code — required, non-empty, bounded
  const code = typeof b.code === 'string' ? b.code : '';
  if (!code.trim()) {
    errors.push('`code` is required and must be a non-empty string.');
  } else if (code.length > MAX_CODE_LENGTH) {
    errors.push(`\`code\` exceeds the maximum length of ${MAX_CODE_LENGTH} characters.`);
  }

  // theme — optional, whitelisted
  const theme = b.theme === undefined ? DEFAULTS.theme : b.theme;
  if (typeof theme !== 'string' || !THEMES.includes(theme)) {
    errors.push(`\`theme\` must be one of: ${THEMES.join(', ')}.`);
  }

  // format — optional, whitelisted
  const format = b.format === undefined ? DEFAULTS.format : b.format;
  if (typeof format !== 'string' || !FORMATS.includes(format)) {
    errors.push(`\`format\` must be one of: ${FORMATS.join(', ')}.`);
  }

  // scale — optional, whitelisted (ignored for svg but validated for consistency)
  const scale = b.scale === undefined ? DEFAULTS.scale : b.scale;
  if (typeof scale !== 'number' || !SCALES.includes(scale)) {
    errors.push(`\`scale\` must be one of: ${SCALES.join(', ')}.`);
  }

  // background — optional string; keep it simple (no injection into markup)
  const background = b.background === undefined ? DEFAULTS.background : b.background;
  if (typeof background !== 'string' || background.length > 64) {
    errors.push('`background` must be a string of at most 64 characters.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { code, theme, format, scale, background, themeConfig: getThemeConfig(theme) },
  };
}
