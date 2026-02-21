
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  template: `
    <div class="flex items-center gap-2 sm:gap-4">
      <div class="flex items-center gap-1 sm:gap-2">
        <label for="theme-select" class="hidden sm:block text-xs text-slate-400">Theme:</label>
        <select 
          id="theme-select"
          class="bg-slate-700 border border-slate-600 rounded-md text-xs py-1 px-1 sm:px-2 text-slate-200 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 max-w-[100px] sm:max-w-none"
          (change)="onThemeChange($event)"
          [value]="selectedTheme()">
          @for (theme of themes(); track theme) {
            <option [value]="theme">{{ theme.charAt(0).toUpperCase() + theme.slice(1) }}</option>
          }
        </select>
      </div>
  
      <button 
        (click)="openExport.emit()"
        [disabled]="disabledExport()"
          class="disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2 sm:px-3 py-1 rounded-md transition-colors shadow-lg shadow-emerald-900/20 shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        <span class="hidden sm:inline">Export</span>
        <span class="sm:hidden uppercase font-bold text-[10px]">Exp</span>
      </button>

      @if (isRendering()) {
        <div class="flex items-center space-x-2 text-sky-400 text-xs">
          <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Wait...</span>
        </div>
      }
    </div>
  `
})
export class AppToolbarComponent {
  selectedTheme = input.required<string>();
  themes = input.required<readonly string[]>();
  isRendering = input.required<boolean>();
  disabledExport = input.required<boolean>();

  themeChange = output<string>();
  openExport = output<void>();

  onThemeChange(e: Event) {
    this.themeChange.emit((e.target as HTMLSelectElement).value);
  }
}
