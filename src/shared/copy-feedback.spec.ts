import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCopyFeedback, CopyFeedback } from './copy-feedback';

/** Host component so createCopyFeedback() runs inside an injection context. */
@Component({ selector: 'test-host', standalone: true, template: '' })
class HostComponent {
  readonly feedback: CopyFeedback = createCopyFeedback({ idleLabel: 'Copy code' });
}

describe('createCopyFeedback', () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    writeText = vi.fn().mockResolvedValue(undefined);
    // jsdom has no clipboard by default; install a stub.
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function makeFeedback(): CopyFeedback {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    return TestBed.createComponent(HostComponent).componentInstance.feedback;
  }

  it('starts idle', () => {
    const fb = makeFeedback();
    expect(fb.copied()).toBe(false);
    expect(fb.label()).toBe('Copy code');
  });

  it('flashes the copied state then reverts after the duration', async () => {
    const fb = makeFeedback();
    const ok = await fb.copy('hello');

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(fb.copied()).toBe(true);
    expect(fb.label()).toBe('Copied!');

    vi.advanceTimersByTime(2000);
    expect(fb.copied()).toBe(false);
    expect(fb.label()).toBe('Copy code');
  });

  it('returns false and stays idle when the clipboard write rejects', async () => {
    writeText.mockRejectedValueOnce(new Error('denied'));
    const fb = makeFeedback();

    const ok = await fb.copy('x');
    expect(ok).toBe(false);
    expect(fb.copied()).toBe(false);
    expect(fb.label()).toBe('Copy code');
  });
});
