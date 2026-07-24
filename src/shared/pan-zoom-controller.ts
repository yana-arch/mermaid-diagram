import { computed, signal, Signal } from '@angular/core';

export interface Point {
  x: number;
  y: number;
}

/** Zoom/pan bounds and step, shared so the UI and tests agree on limits. */
export const PAN_ZOOM = {
  MIN_SCALE: 0.2,
  MAX_SCALE: 5,
  /** Multiplicative step for a single zoom-in/out (button or wheel tick). */
  STEP: 1.2,
  /** Cap applied by auto-fit to avoid upscaling small diagrams into blur. */
  AUTOFIT_MAX_SCALE: 2.0,
} as const;

/**
 * Headless pan & zoom state machine backed by Angular signals.
 *
 * Extracted from ChartPreviewComponent so the interaction math (clamping,
 * drag deltas, pinch scaling) lives in one testable place instead of being
 * tangled into a 400-line component. The controller never touches the DOM;
 * the component wires template events to these handlers and reads the exposed
 * signals for its transform/cursor bindings.
 */
export interface PanZoomController {
  readonly zoomScale: Signal<number>;
  readonly panOffset: Signal<Point>;
  readonly isPanning: Signal<boolean>;
  readonly zoomPercentage: Signal<number>;

  zoomIn(): void;
  zoomOut(): void;
  resetZoom(): void;
  /** Set pan + scale directly (used by the component's DOM-based auto-fit). */
  setView(pan: Point, scale: number): void;

  onWheel(e: WheelEvent): void;
  onMouseDown(e: MouseEvent): void;
  onMouseMove(e: MouseEvent): void;
  onMouseUp(): void;
  onMouseLeave(): void;
  onTouchStart(e: TouchEvent): void;
  onTouchMove(e: TouchEvent): void;
  onTouchEnd(): void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export function createPanZoomController(): PanZoomController {
  const zoomScale = signal(1);
  const panOffset = signal<Point>({ x: 0, y: 0 });
  const isPanning = signal(false);
  const zoomPercentage = computed(() => Math.round(zoomScale() * 100));

  let dragStart: Point = { x: 0, y: 0 };
  let initialPan: Point = { x: 0, y: 0 };
  let initialDistance = 0;
  let initialZoom = 1;

  const distance = (touches: TouchList): number => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  return {
    zoomScale,
    panOffset,
    isPanning,
    zoomPercentage,

    zoomIn() {
      zoomScale.update(s => Math.min(s * PAN_ZOOM.STEP, PAN_ZOOM.MAX_SCALE));
    },
    zoomOut() {
      zoomScale.update(s => Math.max(s / PAN_ZOOM.STEP, PAN_ZOOM.MIN_SCALE));
    },
    resetZoom() {
      zoomScale.set(1);
      panOffset.set({ x: 0, y: 0 });
    },
    setView(pan: Point, scale: number) {
      panOffset.set({ x: pan.x, y: pan.y });
      zoomScale.set(scale);
    },

    onWheel(e: WheelEvent) {
      e.preventDefault();
      if (e.deltaY < 0) {
        this.zoomIn();
      } else if (e.deltaY > 0) {
        this.zoomOut();
      }
    },

    onMouseDown(e: MouseEvent) {
      if (e.button !== 0) return;
      e.preventDefault();
      isPanning.set(true);
      dragStart = { x: e.clientX, y: e.clientY };
      initialPan = { ...panOffset() };
    },
    onMouseMove(e: MouseEvent) {
      if (!isPanning()) return;
      e.preventDefault();
      panOffset.set({
        x: initialPan.x + (e.clientX - dragStart.x),
        y: initialPan.y + (e.clientY - dragStart.y),
      });
    },
    onMouseUp() {
      isPanning.set(false);
    },
    onMouseLeave() {
      isPanning.set(false);
    },

    onTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) {
        isPanning.set(true);
        dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        initialPan = { ...panOffset() };
      } else if (e.touches.length === 2) {
        isPanning.set(false);
        initialDistance = distance(e.touches);
        initialZoom = zoomScale();
      }
    },
    onTouchMove(e: TouchEvent) {
      if (e.touches.length === 1 && isPanning()) {
        e.preventDefault();
        panOffset.set({
          x: initialPan.x + (e.touches[0].clientX - dragStart.x),
          y: initialPan.y + (e.touches[0].clientY - dragStart.y),
        });
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = distance(e.touches);
        if (initialDistance > 0) {
          const scale = currentDistance / initialDistance;
          zoomScale.set(clamp(initialZoom * scale, PAN_ZOOM.MIN_SCALE, PAN_ZOOM.MAX_SCALE));
        }
      }
    },
    onTouchEnd() {
      isPanning.set(false);
    },
  };
}
