/**
 * Theme configuration for server-side Mermaid rendering.
 *
 * Ported verbatim from the web app's MermaidService.getThemeConfig
 * (src/services/diagram/mermaid.service.ts) so the API output matches what
 * users see in the browser preview. Keep the two in sync when themes change.
 */

/** The theme names the web app's toolbar exposes. */
export const THEMES = [
  'default',
  'neutral',
  'dark',
  'forest',
  'cyberpunk',
  'ocean',
  'sunset',
  'minimal',
];

/** Output image formats the API can produce. */
export const FORMATS = ['svg', 'png', 'jpeg', 'webp'];

/** Allowed raster resolution multipliers (mirrors the Export modal). */
export const SCALES = [1, 2, 4];

/**
 * @typedef {{ baseTheme: string, variables?: Record<string,string> }} MermaidThemeConfig
 */

const CUSTOM_THEME_CONFIGS = {
  cyberpunk: {
    baseTheme: 'dark',
    variables: {
      primaryColor: '#ff00ff',
      primaryTextColor: '#00ffff',
      primaryBorderColor: '#ff00ff',
      lineColor: '#00ffff',
      secondaryColor: '#1a0033',
      tertiaryColor: '#330066',
      fontFamily: '"Courier New", monospace',
      mainBkg: '#090014',
      nodeBorder: '#ff00ff',
    },
  },
  ocean: {
    baseTheme: 'base',
    variables: {
      primaryColor: '#006994',
      primaryTextColor: '#e0f7fa',
      primaryBorderColor: '#4dd0e1',
      lineColor: '#80deea',
      secondaryColor: '#0097a7',
      tertiaryColor: '#00bcd4',
      fontFamily: 'Inter, sans-serif',
    },
  },
  sunset: {
    baseTheme: 'base',
    variables: {
      primaryColor: '#ff6b6b',
      primaryTextColor: '#2d3436',
      primaryBorderColor: '#ffd93d',
      lineColor: '#ff9f43',
      secondaryColor: '#f9c74f',
      tertiaryColor: '#90be6d',
    },
  },
  minimal: {
    baseTheme: 'base',
    variables: {
      primaryColor: '#ffffff',
      primaryTextColor: '#1a1a1a',
      primaryBorderColor: '#1a1a1a',
      lineColor: '#1a1a1a',
      secondaryColor: '#f3f4f6',
      tertiaryColor: '#e5e7eb',
      fontFamily: 'Inter, sans-serif',
    },
  },
};

/**
 * Resolve a theme name to a Mermaid base theme + variables.
 * Unknown names fall back to Mermaid's built-in theme of the same name.
 * @param {string} themeName
 * @returns {MermaidThemeConfig}
 */
export function getThemeConfig(themeName) {
  if (CUSTOM_THEME_CONFIGS[themeName]) {
    return CUSTOM_THEME_CONFIGS[themeName];
  }
  // 'default' maps to the dark UI, matching the web preview.
  if (themeName === 'default') {
    return { baseTheme: 'dark' };
  }
  // Built-in themes: neutral, dark, forest.
  return { baseTheme: themeName };
}
