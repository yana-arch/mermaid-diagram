
import { Component, input, output, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-example-modal',
  standalone: true,
  imports: [CommonModule],
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
            <h3 class="text-lg sm:text-xl font-bold text-white">Example Gallery</h3>
            <p class="text-xs sm:text-sm text-slate-400">Select a template</p>
          </div>
          <button (click)="close.emit()" class="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <!-- Controls: Search & Tabs -->
        <div class="border-b border-slate-700 bg-slate-800/50 flex flex-col shrink-0">
          <!-- Search -->
          <div class="px-4 py-2 sm:px-5 sm:py-3 border-b border-slate-700/50">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <input 
                type="text" 
                class="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-slate-500"
                placeholder="Search diagrams..."
                [value]="searchTerm()"
                (input)="searchTerm.set($any($event.target).value)"
              >
            </div>
          </div>
          
          <!-- Category Tabs -->
          <div class="flex overflow-x-auto custom-scrollbar px-4 py-2 sm:px-5 sm:py-3 gap-2">
             <button 
               (click)="selectedCategory.set('All')"
               class="whitespace-nowrap px-3 py-1.5 sm:px-4 rounded-full text-xs font-medium transition-all border"
               [ngClass]="selectedCategory() === 'All' 
                 ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-900/20' 
                 : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:text-slate-200 hover:bg-slate-700'"
             >
               All
             </button>
             @for (cat of uniqueCategories(); track cat) {
               <button 
                 (click)="selectedCategory.set(cat)"
                 class="whitespace-nowrap px-3 py-1.5 sm:px-4 rounded-full text-xs font-medium transition-all border"
                 [ngClass]="selectedCategory() === cat
                   ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-900/20' 
                   : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:text-slate-200 hover:bg-slate-700'"
               >
                 {{ cat }}
               </button>
             }
          </div>
        </div>

        <!-- Body -->
        <div class="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-grow">
          @if (displayedItems().length === 0) {
             <div class="text-center py-12 text-slate-500">
               <p>No examples found matching your criteria.</p>
               <button (click)="resetFilters()" class="mt-2 text-indigo-400 hover:underline text-sm">Clear filters</button>
             </div>
          }

          @if (selectedCategory() !== 'All') {
            <!-- Flat Grid for Specific Category -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (example of displayedItems(); track example.name) {
                <ng-container *ngTemplateOutlet="cardTemplate; context: {$implicit: example}"></ng-container>
              }
            </div>
          } @else {
            <!-- Grouped View for 'All' -->
            @for (group of groupedDisplayedItems(); track group.category) {
              <div class="mb-8 last:mb-0">
                <h4 class="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4 border-b border-slate-700/50 pb-2 flex items-center gap-2">
                  {{ group.category }}
                  <span class="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{{ group.items.length }}</span>
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                   @for (example of group.items; track example.name) {
                     <ng-container *ngTemplateOutlet="cardTemplate; context: {$implicit: example}"></ng-container>
                   }
                </div>
              </div>
            }
          }
        </div>
      </div>
    }

    <!-- Reusable Card Template -->
    <ng-template #cardTemplate let-example>
      <button (click)="select.emit(example.code)" class="w-full group text-left p-4 bg-slate-700/30 hover:bg-slate-700 border border-slate-700/50 hover:border-indigo-500/50 rounded-xl transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg flex flex-col h-full">
        <div class="flex items-start justify-between w-full mb-2">
          <div class="flex-1 min-w-0 pr-2">
             <h5 class="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">{{ example.name }}</h5>
             @if(selectedCategory() === 'All') {
                <span class="inline-block mt-1 text-[10px] text-slate-500 border border-slate-600/50 px-1.5 py-0.5 rounded">{{ example.category }}</span>
             }
          </div>
          <div class="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
        </div>
        <div class="mt-auto pt-2 border-t border-slate-700/30 w-full">
             <div class="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                <div class="h-full bg-indigo-500/30 w-2/3 group-hover:w-full transition-all duration-500"></div>
             </div>
        </div>
      </button>
    </ng-template>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
  `]
})
export class ExampleModalComponent {
  isOpen = input.required<boolean>();
  examples = input.required<any[]>();
  close = output<void>();
  select = output<string>();

  searchTerm = signal('');
  selectedCategory = signal('All');

  // Compute unique categories from data
  uniqueCategories = computed(() => {
    const cats = new Set(this.examples().map(e => e.category));
    return Array.from(cats).sort();
  });

  // Filter items based on Search + Category
  displayedItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const cat = this.selectedCategory();
    
    return this.examples().filter(ex => {
       const matchSearch = !term || ex.name.toLowerCase().includes(term) || ex.category.toLowerCase().includes(term);
       const matchCat = cat === 'All' || ex.category === cat;
       return matchSearch && matchCat;
    });
  });

  // Group items specifically for the 'All' view
  groupedDisplayedItems = computed(() => {
    const raw = this.displayedItems();
    const map = new Map<string, any[]>();
    
    raw.forEach(ex => {
      const cat = ex.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(ex);
    });

    return Array.from(map.entries()).map(([category, items]) => ({
      category,
      items
    }));
  });

  resetFilters() {
    this.searchTerm.set('');
    this.selectedCategory.set('All');
  }
}
