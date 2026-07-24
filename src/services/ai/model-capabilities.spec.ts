import { describe, it, expect } from 'vitest';
import { modelSupportsThinking } from './model-capabilities';

describe('modelSupportsThinking', () => {
  it('returns true for the 2.5 family', () => {
    expect(modelSupportsThinking('gemini-2.5-flash')).toBe(true);
    expect(modelSupportsThinking('gemini-2.5-pro')).toBe(true);
  });

  it('returns true for 2.0-flash', () => {
    expect(modelSupportsThinking('gemini-2.0-flash')).toBe(true);
  });

  it('returns true for explicit *thinking* variants', () => {
    expect(modelSupportsThinking('gemini-2.0-flash-thinking-exp')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(modelSupportsThinking('GEMINI-2.5-FLASH')).toBe(true);
    expect(modelSupportsThinking('Thinking-Model')).toBe(true);
  });

  it('returns false for models without thinking support', () => {
    expect(modelSupportsThinking('gemini-1.5-flash')).toBe(false);
    expect(modelSupportsThinking('gemini-1.5-pro')).toBe(false);
    expect(modelSupportsThinking('gpt-4o')).toBe(false);
  });

  it('is null-safe (empty / null / undefined)', () => {
    expect(modelSupportsThinking('')).toBe(false);
    expect(modelSupportsThinking(null)).toBe(false);
    expect(modelSupportsThinking(undefined)).toBe(false);
  });
});
