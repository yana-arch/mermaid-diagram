
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-example-modal',
  standalone: true,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 bg-black/60 z-40 animate-fade-in" (click)="close.emit()"></div>
      <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 w-full max-w-3xl max-h-[80vh] flex flex-col animate-slide-up">
        <div class="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h3 class="text-lg font-semibold text-slate-100">Load a Chart Example</h3>
          <button (click)="close.emit()" class="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="p-6 overflow-y-auto">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (example of examples; track example.name) {
              <button (click)="select.emit(example.code)" class="text-left p-4 bg-slate-700/50 hover:bg-sky-900/40 border border-slate-700 hover:border-sky-600 rounded-lg transition-all duration-200 transform hover:-translate-y-1">
                <h4 class="font-semibold text-sky-400">{{ example.name }}</h4>
                <p class="text-xs text-slate-400 mt-1">Click to load.</p>
              </button>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class ExampleModalComponent {
  isOpen = input.required<boolean>();
  examples = input.required<any[]>();
  close = output<void>();
  select = output<string>();
}
