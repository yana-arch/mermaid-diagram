import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPanZoomController, PAN_ZOOM, PanZoomController } from './pan-zoom-controller';

/** Minimal MouseEvent-like stub (jsdom MouseEvent lacks layout but has the fields we read). */
function mouse(partial: Partial<MouseEvent>): MouseEvent {
  return { button: 0, clientX: 0, clientY: 0, preventDefault: vi.fn(), ...partial } as unknown as MouseEvent;
}

function touchEvent(points: Array<{ clientX: number; clientY: number }>): TouchEvent {
  return {
    touches: points as unknown as TouchList,
    preventDefault: vi.fn(),
  } as unknown as TouchEvent;
}

describe('createPanZoomController', () => {
  let pz: PanZoomController;

  beforeEach(() => {
    pz = createPanZoomController();
  });

  it('starts at scale 1, origin, not panning', () => {
    expect(pz.zoomScale()).toBe(1);
    expect(pz.panOffset()).toEqual({ x: 0, y: 0 });
    expect(pz.isPanning()).toBe(false);
    expect(pz.zoomPercentage()).toBe(100);
  });

  it('zoomIn/zoomOut step by the configured factor and clamp', () => {
    pz.zoomIn();
    expect(pz.zoomScale()).toBeCloseTo(PAN_ZOOM.STEP);
    pz.resetZoom();

    // Clamp at MAX_SCALE
    for (let i = 0; i < 50; i++) pz.zoomIn();
    expect(pz.zoomScale()).toBe(PAN_ZOOM.MAX_SCALE);

    // Clamp at MIN_SCALE
    for (let i = 0; i < 100; i++) pz.zoomOut();
    expect(pz.zoomScale()).toBe(PAN_ZOOM.MIN_SCALE);
  });

  it('zoomPercentage tracks the scale', () => {
    pz.setView({ x: 0, y: 0 }, 1.5);
    expect(pz.zoomPercentage()).toBe(150);
  });

  it('resetZoom returns to 1:1 and origin', () => {
    pz.setView({ x: 40, y: -20 }, 3);
    pz.resetZoom();
    expect(pz.zoomScale()).toBe(1);
    expect(pz.panOffset()).toEqual({ x: 0, y: 0 });
  });

  it('wheel up zooms in, wheel down zooms out', () => {
    pz.onWheel({ deltaY: -1, preventDefault: vi.fn() } as unknown as WheelEvent);
    expect(pz.zoomScale()).toBeGreaterThan(1);
    const afterIn = pz.zoomScale();
    pz.onWheel({ deltaY: 1, preventDefault: vi.fn() } as unknown as WheelEvent);
    expect(pz.zoomScale()).toBeLessThan(afterIn);
  });

  it('mouse drag pans by the delta from drag start', () => {
    pz.onMouseDown(mouse({ clientX: 100, clientY: 100 }));
    expect(pz.isPanning()).toBe(true);
    pz.onMouseMove(mouse({ clientX: 130, clientY: 90 }));
    expect(pz.panOffset()).toEqual({ x: 30, y: -10 });
    pz.onMouseUp();
    expect(pz.isPanning()).toBe(false);
  });

  it('ignores non-left mouse buttons', () => {
    pz.onMouseDown(mouse({ button: 2, clientX: 10, clientY: 10 }));
    expect(pz.isPanning()).toBe(false);
  });

  it('does not pan when the pointer is not down', () => {
    pz.onMouseMove(mouse({ clientX: 50, clientY: 50 }));
    expect(pz.panOffset()).toEqual({ x: 0, y: 0 });
  });

  it('accumulates pan across a second drag', () => {
    pz.onMouseDown(mouse({ clientX: 0, clientY: 0 }));
    pz.onMouseMove(mouse({ clientX: 20, clientY: 20 }));
    pz.onMouseUp();
    pz.onMouseDown(mouse({ clientX: 0, clientY: 0 }));
    pz.onMouseMove(mouse({ clientX: 5, clientY: 5 }));
    expect(pz.panOffset()).toEqual({ x: 25, y: 25 });
  });

  it('single-touch drag pans', () => {
    pz.onTouchStart(touchEvent([{ clientX: 200, clientY: 200 }]));
    expect(pz.isPanning()).toBe(true);
    pz.onTouchMove(touchEvent([{ clientX: 180, clientY: 210 }]));
    expect(pz.panOffset()).toEqual({ x: -20, y: 10 });
    pz.onTouchEnd();
    expect(pz.isPanning()).toBe(false);
  });

  it('two-finger pinch scales relative to the starting distance', () => {
    // Start pinch: fingers 100px apart.
    pz.onTouchStart(touchEvent([{ clientX: 0, clientY: 0 }, { clientX: 100, clientY: 0 }]));
    expect(pz.isPanning()).toBe(false);
    // Spread to 200px => 2x zoom.
    pz.onTouchMove(touchEvent([{ clientX: 0, clientY: 0 }, { clientX: 200, clientY: 0 }]));
    expect(pz.zoomScale()).toBeCloseTo(2);
  });

  it('pinch scaling clamps to MAX_SCALE', () => {
    pz.onTouchStart(touchEvent([{ clientX: 0, clientY: 0 }, { clientX: 10, clientY: 0 }]));
    pz.onTouchMove(touchEvent([{ clientX: 0, clientY: 0 }, { clientX: 10000, clientY: 0 }]));
    expect(pz.zoomScale()).toBe(PAN_ZOOM.MAX_SCALE);
  });
});
