import { Component, ElementRef, ViewEncapsulation, input, output, viewChild, signal, effect, inject, PLATFORM_ID, computed, ChangeDetectionStrategy, DestroyRef, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MermaidService } from '../services/diagram/mermaid.service';
import { createCopyFeedback } from '../shared/copy-feedback';

@Component({
  selector: 'app-chart-preview',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'block h-full'
  },
  template: `
    <div class="flex flex-col h-full">
      <div class="flex flex-wrap gap-2 sm:gap-4 justify-between items-center mb-2 shrink-0">
        <div class="flex gap-2 items-center shrink-0">
          <h2 class="text-sm font-medium app-text-main xxs-hidden">Live Preview</h2>
          
          <!-- Focus Mode Toggle Button -->
          <button
            (click)="toggleExpand.emit()"
            class="hidden md:flex text-xs app-text-muted hover:text-[var(--text-main)] transition-colors items-center justify-center p-1 rounded hover:bg-[var(--bg-secondary)]"
            [title]="isExpanded() ? 'Collapse view' : 'Maximize view'"
            [attr.aria-label]="isExpanded() ? 'Collapse view' : 'Maximize view'"
          >
            @if (isExpanded()) {
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4"/></svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            }
          </button>
        </div>
        <ng-content select="[controls]"></ng-content>
      </div>

      @if (error()) {
        <div class="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-xs shrink-0" role="alert">
          <p class="font-bold mb-1">Syntax Error</p>
          <pre class="whitespace-pre-wrap font-mono">{{ error() }}</pre>
        </div>
      }

      <div class="flex-1 min-h-0 border app-border rounded-lg overflow-hidden relative select-none transition-all duration-300"
           [ngClass]="containerClass()"
           [class.render-shimmer-effect]="isRendering()">
        
        <!-- Compilation Loader Overlay Mask -->
        @if (isRendering()) {
          <div class="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] pointer-events-none z-10 flex items-center justify-center transition-all duration-300">
            <div class="flex flex-col items-center gap-3 bg-slate-900/80 backdrop-blur-md px-6 py-4 rounded-xl border border-slate-700/50 shadow-2xl">
              <div class="relative w-8 h-8">
                <div class="absolute inset-0 border-2 border-indigo-500/20 rounded-full"></div>
                <div class="absolute inset-0 border-2 border-t-indigo-500 border-r-indigo-500 rounded-full animate-spin"></div>
              </div>
              <span class="text-xs font-medium tracking-wide text-indigo-200">Compiling Diagram...</span>
            </div>
          </div>
        }
        
        <!-- Zoom Level HUD Indicator -->
        <div class="absolute top-4 left-4 z-20 pointer-events-none bg-slate-900/60 backdrop-blur px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-mono text-slate-300 border border-slate-700/50">
          Zoom: {{ zoomPercentage() }}%
        </div>

        <!-- Controls Container -->
        <div class="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
          <!-- Actions -->
          <div class="flex flex-col gap-1 backdrop-blur-sm p-1.5 rounded-lg border shadow-xl transition-colors"
               [class]="controlsClass()">
             <button (click)="copySvg()" class="p-2 sm:p-1.5 rounded transition flex justify-center items-center"
                     [class]="buttonClass()" 
                     [title]="copyFeedback.label()"
                     [attr.aria-label]="copyFeedback.label()">
               @if(copyFeedback.copied()) {
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" sm:width="16" sm:height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-emerald-400"><polyline points="20 6 9 17 4 12"></polyline></svg>
               } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" sm:width="16" sm:height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
               }
             </button>
          </div>
          <!-- Zoom & Fit Controls -->
          <div class="flex flex-col gap-1 backdrop-blur-sm p-1.5 rounded-lg border shadow-xl transition-colors"
               [class]="controlsClass()">
            <button (click)="zoomIn()" class="p-2 sm:p-1.5 rounded transition flex justify-center items-center"
                     [class]="buttonClass()" title="Zoom In" aria-label="Zoom In">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" sm:width="16" sm:height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            </button>
            <button (click)="autoFit()" class="p-2 sm:p-1.5 rounded transition flex justify-center items-center"
                     [class]="buttonClass()" title="Auto Fit to Screen" aria-label="Auto Fit to Screen">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" sm:width="16" sm:height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6M10 14l-7 7M14 10l7-7"/></svg>
            </button>
            <button (click)="resetZoom()" class="p-2 sm:p-1.5 rounded transition flex justify-center items-center"
                     [class]="buttonClass()" title="Reset Zoom (100%)" aria-label="Reset Zoom">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" sm:width="16" sm:height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
            </button>
            <button (click)="zoomOut()" class="p-2 sm:p-1.5 rounded transition flex justify-center items-center"
                     [class]="buttonClass()" title="Zoom Out" aria-label="Zoom Out">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" sm:width="16" sm:height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            </button>
          </div>
        </div>

        <!-- Pannable Container -->
        <div 
          class="w-full h-full flex items-center justify-center transition-transform duration-75 origin-top-left"
          [class.cursor-grab]="!isPanning()"
          [class.cursor-grabbing]="isPanning()"
          (mousedown)="onMouseDown($event)"
          (mousemove)="onMouseMove($event)"
          (mouseup)="onMouseUp()"
          (mouseleave)="onMouseLeave()"
          (wheel)="onWheel($event)"
          (touchstart)="onTouchStart($event)"
          (touchmove)="onTouchMove($event)"
          (touchend)="onTouchEnd()"
          (touchcancel)="onTouchEnd()"
        >
            <div 
              #chartOutput 
              class="origin-center transition-transform duration-75 pointer-events-none"
              [style.transform]="'translate(' + panOffset().x + 'px, ' + panOffset().y + 'px) scale(' + zoomScale() + ')'"
            ></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .mermaid svg { max-width: none !important; height: auto; }
    .cursor-grab { cursor: grab; }
    .cursor-grabbing { cursor: grabbing; }
  `]
})
export class ChartPreviewComponent {
  code = input.required<string>();
  theme = input.required<string>();
  isExpanded = input<boolean>(false);
  
  onRenderStart = output<void>();
  onRenderEnd = output<void>();
  onRenderError = output<string | null>();
  toggleExpand = output<void>();

  chartOutput = viewChild.required<ElementRef<HTMLDivElement>>('chartOutput');
  
  error = signal<string | null>(null);
  readonly copyFeedback = createCopyFeedback({ idleLabel: 'Copy SVG Code' });
  isRendering = signal(false);

  private readonly THEME_CONTAINER_CLASSES: Record<string, string> = {
    'dark': 'bg-slate-900 border-slate-700',
    'forest': 'bg-[#181d1b] border-emerald-900/30',
    'cyberpunk': 'bg-[#090014] border-fuchsia-900/50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#090014] to-[#090014]',
    'ocean': 'bg-gradient-to-b from-cyan-950 to-blue-950 border-cyan-900/30',
    'sunset': 'bg-gradient-to-br from-orange-50 to-rose-50 border-orange-200',
    'minimal': 'bg-white border-black border-2',
    'neutral': 'app-bg-secondary'
  };
  
  // Computed Theme Classes
  containerClass = computed(() => {
    return this.THEME_CONTAINER_CLASSES[this.theme()] || 'app-bg-secondary';
  });

  controlsClass = computed(() => {
    const t = this.theme();
    if (['default', 'dark', 'forest', 'cyberpunk', 'ocean'].includes(t)) {
       return 'bg-slate-800/90 border-slate-600';
    }
    if (t === 'minimal') {
      return 'bg-white border-black border-2 shadow-none';
    }
    if (['neutral', 'sunset'].includes(t)) {
        return 'bg-white/90 border-slate-200';
    }
    return 'app-bg-panel border-opacity-50 app-border'; 
  });

  buttonClass = computed(() => {
     const t = this.theme();
     if (['default', 'dark', 'forest', 'cyberpunk', 'ocean'].includes(t)) {
       return 'text-slate-200 hover:text-sky-400 hover:bg-slate-700';
    }
    if (t === 'minimal') {
      return 'text-black hover:bg-gray-100';
    }
    return 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100';
  });

  // HUD zoom indicator
  zoomPercentage = computed(() => {
    return Math.round(this.zoomScale() * 100);
  });

  // Pan & Zoom
  zoomScale = signal(1);
  panOffset = signal({ x: 0, y: 0 });
  isPanning = signal(false);
  private dragStart = { x: 0, y: 0 };
  private initialPan = { x: 0, y: 0 };
  private initialDistance = 0;
  private initialZoom = 1;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private autoFitTimer: ReturnType<typeof setTimeout> | null = null;

  private mermaidService = inject(MermaidService);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      if (this.autoFitTimer) clearTimeout(this.autoFitTimer);
    });

    // Auto-fit when expanded state changes (after transition)
    effect(() => {
      this.isExpanded();
      if (this.autoFitTimer) clearTimeout(this.autoFitTimer);
      this.autoFitTimer = setTimeout(() => {
        this.autoFit();
      }, 350);
    });

    effect(() => {
      const code = this.code();
      const theme = this.theme();
      const el = this.chartOutput().nativeElement;

      if (!isPlatformBrowser(this.platformId)) return;

      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      if (code.trim()) {
        this.isRendering.set(true);
      }
      this.onRenderStart.emit();
      this.error.set(null);
      this.onRenderError.emit(null);

      this.debounceTimer = setTimeout(async () => {
        if (!code.trim()) {
          el.innerHTML = '<p class="opacity-40 text-center p-8 select-none" style="color: currentColor">Your chart will appear here.</p>';
          this.onRenderEnd.emit();
          this.isRendering.set(false);
          return;
        }
        try {
          const svg = await this.mermaidService.render(code, theme);
          el.innerHTML = svg;
          this.onRenderEnd.emit();
          this.isRendering.set(false);

          // Auto-fit to screen after successful rendering
          if (this.autoFitTimer) clearTimeout(this.autoFitTimer);
          this.autoFitTimer = setTimeout(() => {
            this.autoFit();
          }, 150);
        } catch (e: unknown) {
          const msg = this.parseMermaidError(e);
          this.error.set(msg);
          this.onRenderError.emit(msg);
          el.innerHTML = '';
          this.onRenderEnd.emit();
          this.isRendering.set(false);
        }
      }, 400);
    });
  }

  // API for Parent to call
  public getSvgElement(): SVGSVGElement | null {
    return this.chartOutput().nativeElement.querySelector('svg');
  }

  @HostListener('window:resize')
  onResize() {
    this.autoFit();
  }

  async copySvg() {
    const svgEl = this.getSvgElement();
    if (!svgEl || !isPlatformBrowser(this.platformId)) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    await this.copyFeedback.copy(svgData);
  }

  // Auto Fit Logic
  autoFit() {
    const svgEl = this.getSvgElement();
    if (!svgEl) return;

    const viewBox = svgEl.viewBox.baseVal;
    const svgWidth = viewBox?.width || svgEl.clientWidth || 300;
    const svgHeight = viewBox?.height || svgEl.clientHeight || 300;

    const container = svgEl.parentElement?.parentElement;
    if (!container) return;
    const containerWidth = container.clientWidth || 400;
    const containerHeight = container.clientHeight || 400;

    const padding = 24;
    const usableWidth = containerWidth - padding;
    const usableHeight = containerHeight - padding;

    const scaleX = usableWidth / svgWidth;
    const scaleY = usableHeight / svgHeight;
    const scale = Math.min(scaleX, scaleY, 2.0); // Maximum 2.0x scaling to prevent blurriness

    this.panOffset.set({ x: 0, y: 0 });
    this.zoomScale.set(scale);
  }

  // Pan Zoom Logic
  zoomIn() { this.zoomScale.update(s => Math.min(s * 1.2, 5)); }
  zoomOut() { this.zoomScale.update(s => Math.max(s / 1.2, 0.2)); }
  resetZoom() { this.zoomScale.set(1); this.panOffset.set({ x: 0, y: 0 }); }

  onWheel(e: WheelEvent) {
    e.preventDefault();
    if (e.deltaY < 0) {
      this.zoomIn();
    } else if (e.deltaY > 0) {
      this.zoomOut();
    }
  }

  onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    this.isPanning.set(true);
    this.dragStart = { x: e.clientX, y: e.clientY };
    this.initialPan = { ...this.panOffset() };
  }
  onMouseMove(e: MouseEvent) {
    if (!this.isPanning()) return;
    e.preventDefault();
    this.panOffset.set({
      x: this.initialPan.x + (e.clientX - this.dragStart.x),
      y: this.initialPan.y + (e.clientY - this.dragStart.y)
    });
  }
  onMouseUp() { this.isPanning.set(false); }
  onMouseLeave() { this.isPanning.set(false); }

  // Touch Support
  onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      this.isPanning.set(true);
      this.dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.initialPan = { ...this.panOffset() };
    } else if (e.touches.length === 2) {
      this.isPanning.set(false);
      this.initialDistance = this.getDistance(e.touches);
      this.initialZoom = this.zoomScale();
    }
  }

  onTouchMove(e: TouchEvent) {
    if (e.touches.length === 1 && this.isPanning()) {
      e.preventDefault();
      this.panOffset.set({
        x: this.initialPan.x + (e.touches[0].clientX - this.dragStart.x),
        y: this.initialPan.y + (e.touches[0].clientY - this.dragStart.y)
      });
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const currentDistance = this.getDistance(e.touches);
      if (this.initialDistance > 0) {
        const scale = currentDistance / this.initialDistance;
        this.zoomScale.set(Math.min(Math.max(this.initialZoom * scale, 0.2), 5));
      }
    }
  }

  private getDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  onTouchEnd() {
    this.isPanning.set(false);
  }

  private parseMermaidError(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') {
      const err = error as { message?: string; str?: string };
      if (err.message) return err.message;
      if (err.str) return err.str;
    }
    return 'Unknown syntax error.';
  }
}

