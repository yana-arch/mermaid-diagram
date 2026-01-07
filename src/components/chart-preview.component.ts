
import { Component, ElementRef, ViewEncapsulation, input, output, viewChild, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MermaidService } from '../services/mermaid.service';

@Component({
  selector: 'app-chart-preview',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'block h-full'
  },
  template: `
    <div class="flex flex-col h-full">
      <div class="flex flex-wrap gap-4 justify-between items-center mb-2 shrink-0">
        <h2 class="text-sm font-medium text-slate-300">Live Preview</h2>
        <ng-content select="[controls]"></ng-content>
      </div>

      @if (error()) {
        <div class="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-xs shrink-0" role="alert">
          <p class="font-bold mb-1">Syntax Error</p>
          <pre class="whitespace-pre-wrap font-mono">{{ error() }}</pre>
        </div>
      }

      <div class="flex-1 min-h-0 bg-white border border-slate-700 rounded-lg overflow-hidden relative select-none">
        <!-- Zoom Controls -->
        <div class="absolute bottom-4 right-4 z-20 flex flex-col gap-2 bg-slate-800/90 backdrop-blur-sm p-2 rounded-lg border border-slate-600 shadow-xl">
          <button (click)="zoomIn()" class="p-1.5 text-slate-200 hover:text-sky-400 hover:bg-slate-700 rounded transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          </button>
          <button (click)="resetZoom()" class="p-1.5 text-slate-200 hover:text-sky-400 hover:bg-slate-700 rounded transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
          </button>
          <button (click)="zoomOut()" class="p-1.5 text-slate-200 hover:text-sky-400 hover:bg-slate-700 rounded transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          </button>
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
  
  onRenderStart = output<void>();
  onRenderEnd = output<void>();
  onRenderError = output<string | null>();

  chartOutput = viewChild.required<ElementRef<HTMLDivElement>>('chartOutput');
  
  error = signal<string | null>(null);
  
  // Pan & Zoom
  zoomScale = signal(1);
  panOffset = signal({ x: 0, y: 0 });
  isPanning = signal(false);
  private dragStart = { x: 0, y: 0 };
  private initialPan = { x: 0, y: 0 };
  private debounceTimer: any;

  private mermaidService = inject(MermaidService);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    effect(() => {
      const code = this.code();
      const theme = this.theme();
      const el = this.chartOutput().nativeElement;

      if (!isPlatformBrowser(this.platformId)) return;

      clearTimeout(this.debounceTimer);
      this.onRenderStart.emit();
      this.error.set(null);
      this.onRenderError.emit(null);

      this.debounceTimer = setTimeout(async () => {
        if (!code.trim()) {
          el.innerHTML = '<p class="text-slate-400 text-center p-8 select-none">Your chart will appear here.</p>';
          this.onRenderEnd.emit();
          return;
        }
        try {
          const svg = await this.mermaidService.render(code, theme);
          el.innerHTML = svg;
          this.onRenderEnd.emit();
        } catch (e: any) {
          const msg = this.parseMermaidError(e);
          this.error.set(msg);
          this.onRenderError.emit(msg);
          el.innerHTML = '';
          this.onRenderEnd.emit();
        }
      }, 400);
    });
  }

  // API for Parent to call
  public getSvgElement(): SVGSVGElement | null {
    return this.chartOutput().nativeElement.querySelector('svg');
  }

  // Pan Zoom Logic
  zoomIn() { this.zoomScale.update(s => Math.min(s * 1.2, 5)); }
  zoomOut() { this.zoomScale.update(s => Math.max(s / 1.2, 0.2)); }
  resetZoom() { this.zoomScale.set(1); this.panOffset.set({ x: 0, y: 0 }); }
  
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

  private parseMermaidError(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.str) return error.str;
    return 'Unknown syntax error.';
  }
}
