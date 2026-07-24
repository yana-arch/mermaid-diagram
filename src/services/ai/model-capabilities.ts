/**
 * Shared capability checks for AI models.
 *
 * Keeping these predicates in one place avoids drift between the service
 * layer (which decides whether to send a thinkingConfig) and the settings
 * UI (which decides whether to show the Thinking Level control).
 */

/** Model-name fragments that indicate extended-reasoning ("thinking") support. */
const THINKING_MODEL_MARKERS = ['thinking', '2.5', '2.0-flash'] as const;

/**
 * Returns true when the given model name supports an extended-reasoning
 * ("thinking") budget. Matching is case-insensitive and null-safe.
 *
 * @param model - The model identifier, e.g. "gemini-2.5-flash".
 */
export function modelSupportsThinking(model: string | null | undefined): boolean {
  if (!model) return false;
  const normalized = model.toLowerCase();
  return THINKING_MODEL_MARKERS.some(marker => normalized.includes(marker));
}
