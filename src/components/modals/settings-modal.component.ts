
import { Component, input, output, inject, signal, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService, AiConfig } from '../../services/app-state.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 bg-black/70 z-50 animate-fade-in backdrop-blur-sm" (click)="close.emit()"></div>
      <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-600 shadow-2xl z-50 flex flex-col animate-scale-in
                  w-[95%] rounded-xl max-h-[90vh] overflow-y-auto
                  sm:w-full sm:max-w-md sm:rounded-2xl">
        
        <!-- Header -->
        <div class="flex justify-between items-center p-4 sm:p-5 border-b border-slate-700 bg-slate-800/95 sticky top-0 z-10">
          <h3 class="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            Settings
          </h3>
          <button (click)="close.emit()" class="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-4 sm:p-6 space-y-6">
          
          <!-- API Key -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">Gemini API Key</label>
            <input 
              type="password" 
              class="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600"
              placeholder="AIza..."
              [(ngModel)]="config.apiKey"
            >
            <p class="mt-1.5 text-xs text-slate-500">
              Key is stored locally. Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-indigo-400 hover:underline">Google AI Studio</a>.
            </p>
          </div>

          <!-- API Endpoint Configuration -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">API Endpoint</label>
            <div class="flex gap-2 mb-3 bg-slate-900/50 p-1 rounded-lg border border-slate-700">
              <button 
                class="flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-all"
                [class]="!config.useCustomUrl ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'"
                (click)="setUseCustom(false)"
              >
                Default (Google)
              </button>
              <button 
                class="flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-all"
                [class]="config.useCustomUrl ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'"
                (click)="setUseCustom(true)"
              >
                Custom / Proxy
              </button>
            </div>

            @if (config.useCustomUrl) {
              <div class="animate-fade-in relative">
                 <input 
                  type="text" 
                  class="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600"
                  placeholder="https://generativelanguage.googleapis.com"
                  [(ngModel)]="config.customUrl"
                >
                <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </div>
              </div>
              <p class="mt-1.5 text-xs text-slate-500">
                Enter the base URL for your proxy or enterprise gateway (e.g., <code>https://my-proxy.vercel.app</code>).
              </p>
            }
          </div>

          <!-- Model -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">Model</label>
            <div class="relative">
              <select 
                class="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all"
                [(ngModel)]="config.model"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended)</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp</option>
              </select>
              <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>
          
          <!-- Thinking Level (Only for supported models) -->
          @if (isThinkingSupported()) {
             <div class="animate-fade-in">
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Thinking Level</label>
                <div class="relative">
                  <select 
                    class="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all"
                    [(ngModel)]="config.thinkingBudget"
                  >
                    <option [ngValue]="0">Disabled (Faster)</option>
                    <option [ngValue]="1024">Low (1024 tokens)</option>
                    <option [ngValue]="2048">Medium (2048 tokens)</option>
                    <option [ngValue]="8192">High (8192 tokens)</option>
                  </select>
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
                <p class="mt-1.5 text-xs text-slate-500">
                  Enables extended reasoning for complex diagrams. May increase generation time.
                </p>
             </div>
          }

        </div>

        <!-- Footer -->
        <div class="p-4 sm:p-5 border-t border-slate-700 bg-slate-800/50 rounded-b-xl sm:rounded-b-2xl flex justify-end gap-3">
          <button (click)="close.emit()" class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Cancel</button>
          <button (click)="save()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all">
            Save
          </button>
        </div>
      </div>
    }
  `
})
export class SettingsModalComponent {
  isOpen = input.required<boolean>();
  close = output<void>();
  
  store = inject(AppStateService);
  cdr = inject(ChangeDetectorRef);
  
  // Local state for form
  config: AiConfig = { ...this.store.aiConfig() };

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        // Reset local form when opening
        this.config = { ...this.store.aiConfig() };
        this.cdr.markForCheck();
      }
    });
  }
  
  // Explicitly handle boolean toggle
  setUseCustom(val: boolean) {
    this.config.useCustomUrl = val;
  }
  
  isThinkingSupported(): boolean {
      return this.config.model.includes('gemini-2.5-flash');
  }

  save() {
    this.store.updateAiConfig(this.config);
    this.close.emit();
  }
}
