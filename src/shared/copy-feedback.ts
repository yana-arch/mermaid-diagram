import { DestroyRef, inject, signal, Signal } from '@angular/core';

export interface CopyFeedbackOptions {
  /** Label shown when idle, e.g. "Copy code". */
  idleLabel: string;
  /** Label shown briefly after a successful copy (default "Copied!"). */
  activeLabel?: string;
  /** How long the active label stays before reverting, in ms (default 2000). */
  durationMs?: number;
}

export interface CopyFeedback {
  /** True for `durationMs` after a successful copy. */
  readonly copied: Signal<boolean>;
  /** The current button label (idle vs active). */
  readonly label: Signal<string>;
  /** Write `text` to the clipboard and flash the "copied" state. Returns success. */
  copy(text: string): Promise<boolean>;
}

/**
 * Creates a self-resetting "Copied!" feedback controller backed by signals.
 *
 * Centralises the copy-to-clipboard + transient-label pattern that was
 * duplicated across the code editor and chart preview. Must be called from an
 * injection context (a component field initializer or constructor) because it
 * uses inject(DestroyRef) to clean up its pending timer.
 */
export function createCopyFeedback(options: CopyFeedbackOptions): CopyFeedback {
  const { idleLabel, activeLabel = 'Copied!', durationMs = 2000 } = options;
  const destroyRef = inject(DestroyRef);

  const copied = signal(false);
  const label = signal(idleLabel);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  destroyRef.onDestroy(clearTimer);

  return {
    copied,
    label,
    async copy(text: string): Promise<boolean> {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        return false;
      }
      try {
        await navigator.clipboard.writeText(text);
        copied.set(true);
        label.set(activeLabel);
        clearTimer();
        timer = setTimeout(() => {
          copied.set(false);
          label.set(idleLabel);
          timer = null;
        }, durationMs);
        return true;
      } catch (err) {
        console.error('Clipboard write failed', err);
        return false;
      }
    },
  };
}
