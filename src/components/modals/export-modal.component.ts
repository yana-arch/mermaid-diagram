
import { Component, input, output, signal } from '@angular/core';

export type ExportFormat = 'svg' | 'png' | 'jpeg' | 'webp';

@Component({
  selector: 'app-export-modal',
  standalone: true,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 bg-black/70 z-50 animate-fade-in backdrop-blur-sm" (click)="close.emit()"></div>
      <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl z-50 w-full max-w-md flex flex-col animate-scale-in">
        
        <!-- Header -->
        <div class="flex justify-between items-center p-5 border-b border-slate-700">
          <h3 class="text-xl font-bold text-white">Export Diagram</h3>
          <button (click)="close.emit()" class="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 flex-col gap-6">
          <div class="mb-6">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Format</label>
            <div class="grid grid-cols-2 gap-3">
              @for (fmt of formats; track fmt) {
                <button 
                  (click)="format.set(fmt)" 
                  class="flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200"
                  [class]="format() === fmt 
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                    : 'border-slate-700 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/50'"
                >
                  <span 
                    class="text-lg font-bold uppercase mb-1" 
                    [class]="format() === fmt ? 'text-emerald-400' : 'text-slate-400'"
                  >{{fmt}}</span>
                  <span class="text-[10px] text-slate-500 uppercase">{{ getFormatDesc(fmt) }}</span>
                </button>
              }
            </div>
          </div>

          <div class="mb-2 transition-opacity duration-200" [class.opacity-50]="format() === 'svg'" [class.pointer-events-none]="format() === 'svg'">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Resolution Scale</label>
            <div class="flex bg-slate-900/50 p-1.5 rounded-lg border border-slate-700">
              @for (s of [1,2,4]; track s) {
                <button (click)="scale.set(s)" class="flex-1 py-2 text-xs font-medium rounded-md transition-all"
                  [class]="scale() === s ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'">{{s}}x</button>
              }
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-5 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl">
          <button (click)="onExport()" class="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition active:scale-[0.98] flex justify-center items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Download {{ format().toUpperCase() }}
          </button>
        </div>
      </div>
    }
  `
})
export class ExportModalComponent {
  isOpen = input.required<boolean>();
  close = output<void>();
  confirm = output<{format: ExportFormat, scale: number}>();
  
  formats: ExportFormat[] = ['png', 'jpeg', 'webp', 'svg'];
  format = signal<ExportFormat>('png');
  scale = signal(2);

  getFormatDesc(fmt: ExportFormat): string {
    switch(fmt) {
      case 'png': return 'High Quality';
      case 'jpeg': return 'Small Size';
      case 'webp': return 'Modern Web';
      case 'svg': return 'Vector';
      default: return '';
    }
  }

  onExport() {
    this.confirm.emit({ format: this.format(), scale: this.scale() });
  }
}
