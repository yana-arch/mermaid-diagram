
import { Component, input, output, computed, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HistoryItem } from '../../services/app-state.service';

@Component({
  selector: 'app-history-modal',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 bg-black/60 z-40 animate-fade-in backdrop-blur-sm" (click)="close.emit()"></div>
      <!-- Responsive Modal Container -->
      <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700 shadow-2xl z-50 flex flex-col animate-slide-up
                  w-[95%] h-[90vh] rounded-xl
                  sm:w-full sm:max-w-4xl sm:h-auto sm:max-h-[85vh]">
        
        <!-- Header -->
        <div class="flex justify-between items-center p-4 sm:p-5 border-b border-slate-700 flex-shrink-0 bg-slate-800/95 backdrop-blur z-10 rounded-t-xl">
          <div>
            <h3 class="text-lg sm:text-xl font-bold text-white">History</h3>
            <p class="text-xs sm:text-sm text-slate-400">Manage your saved diagrams</p>
          </div>
          <button (click)="close.emit()" class="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <!-- Controls: Search -->
        <div class="border-b border-slate-700 bg-slate-800/50 flex flex-col shrink-0">
          <div class="px-4 py-2 sm:px-5 sm:py-3">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <input 
                type="text" 
                class="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-slate-500"
                placeholder="Search history..."
                [value]="searchTerm()"
                (input)="searchTerm.set($any($event.target).value)"
              >
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-grow">
          @if (displayedItems().length === 0) {
             <div class="text-center py-12 text-slate-500">
               <p>No history found matching your criteria.</p>
               @if (history().length === 0) {
                 <p class="mt-2 text-sm text-slate-400">Save your current work to see it here.</p>
               } @else {
                 <button (click)="searchTerm.set('')" class="mt-2 text-indigo-400 hover:underline text-sm">Clear search</button>
               }
             </div>
          }

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (item of displayedItems(); track item.id) {
              <div class="group relative bg-slate-700/30 hover:bg-slate-700 border border-slate-700/50 hover:border-indigo-500/50 rounded-xl transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg flex flex-col h-full overflow-hidden">
                <button (click)="load.emit(item)" class="text-left p-4 flex-grow w-full">
                  <div class="flex items-start justify-between w-full mb-2">
                    <div class="flex-1 min-w-0 pr-2">
                      <h5 class="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors truncate" [title]="item.label || 'Untitled'">{{ item.label || 'Untitled' }}</h5>
                      <span class="inline-block mt-1 text-[10px] text-slate-500 border border-slate-600/50 px-1.5 py-0.5 rounded">{{ item.timestamp | date:'medium' }}</span>
                    </div>
                  </div>
                  <div class="text-xs text-slate-500 font-mono line-clamp-3 bg-slate-800/50 p-2 rounded border border-slate-700/50 group-hover:border-slate-600 transition-colors">
                    {{ item.code }}
                  </div>
                </button>
                
                <div class="flex border-t border-slate-700/30">
                  <button (click)="load.emit(item)" class="flex-1 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-indigo-600/20 transition-colors flex items-center justify-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    Load
                  </button>
                  <div class="w-px bg-slate-700/30"></div>
                  <button (click)="delete.emit(item.id)" class="px-4 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors flex items-center justify-center gap-1" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
  `]
})
export class HistoryModalComponent {
  isOpen = input.required<boolean>();
  history = input.required<HistoryItem[]>();
  
  close = output<void>();
  load = output<HistoryItem>();
  delete = output<string>();

  searchTerm = signal('');

  // Filter items based on Search
  displayedItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const items = this.history();
    
    if (!term) return items;

    return items.filter(item => {
       const labelMatch = item.label?.toLowerCase().includes(term);
       const codeMatch = item.code.toLowerCase().includes(term);
       return labelMatch || codeMatch;
    });
  });
}
