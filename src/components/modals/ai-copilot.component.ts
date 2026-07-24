import { Component, inject, signal, viewChild, effect, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService, AiInputData } from '../../services/ai/gemini.service';
import { AiMode, AppStateService } from '../../services/core/app-state.service';
import { AiTabDescribeComponent } from './ai-tab-describe.component';
import { AiTabUrlComponent } from './ai-tab-url.component';
import { AiTabFileComponent } from './ai-tab-file.component';
import { IconComponent } from '../../shared/icon.component';

export type AiTab = 'text' | 'url' | 'file';

@Component({
  selector: 'app-ai-copilot',
  standalone: true,
  imports: [CommonModule, AiTabDescribeComponent, AiTabUrlComponent, AiTabFileComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- Mobile Drawer Overlay -->
    @if (store.isAiModalOpen()) {
      <div class="fixed inset-0 bg-black/60 z-40 animate-fade-in backdrop-blur-sm md:hidden" (click)="closeCopilot()"></div>
    }
    
    <div [class.open]="store.isAiModalOpen()" 
         class="copilot-panel h-full flex flex-col bg-[var(--bg-secondary)] border-l border-slate-700/30 overflow-hidden transition-all duration-300">
      
      <!-- Drag Handle Indicator for Mobile Bottom Sheet -->
      <div class="h-1.5 w-12 bg-slate-600 rounded-full mx-auto my-3 shrink-0 md:hidden"></div>
      
      <!-- Header -->
      <div class="flex justify-between items-center px-4 pb-4 pt-2 md:pt-4 md:px-5 border-b border-slate-700/50 shrink-0">
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center gap-2">
             <svg class="text-indigo-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg>
             <h3 class="text-base sm:text-lg font-bold text-white">AI Copilot</h3>
          </div>
          
          <!-- Mode Toggle Switch -->
          <div class="flex bg-slate-900/80 p-0.5 rounded-lg border border-slate-800 shrink-0">
            <button (click)="setMode('generate')" 
              [class.bg-indigo-600]="store.aiModalMode() === 'generate'" 
              [class.text-white]="store.aiModalMode() === 'generate'"
              class="px-3 py-1 rounded-md text-[0.675rem] font-bold text-slate-400 hover:text-slate-200 transition-all">New Chart</button>
            <button (click)="setMode('refine')" 
              [class.bg-indigo-600]="store.aiModalMode() === 'refine'"
              [class.text-white]="store.aiModalMode() === 'refine'" 
              class="px-3 py-1 rounded-md text-[0.675rem] font-bold text-slate-400 hover:text-slate-200 transition-all">Refine</button>
          </div>
        </div>
        
        <button (click)="closeCopilot()" [disabled]="isAiLoading()" 
          class="text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-slate-800 disabled:opacity-50"
          aria-label="Close panel" title="Close">
          <app-icon name="close" [size]="18" />
        </button>
      </div>

      <!-- Tabs (Only show in Generate/New Mode) -->
      @if(store.aiModalMode() === 'generate') {
        <div class="flex border-b border-slate-700/50 px-4 sm:px-5 gap-4 shrink-0 overflow-x-auto" role="tablist">
          <button (click)="setTab('text')" role="tab" [attr.aria-selected]="activeTab() === 'text'"
            class="py-3 text-xs font-semibold border-b-2 transition-colors focus:outline-none whitespace-nowrap" [ngClass]="activeTab() === 'text' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'">Describe</button>
          <button (click)="setTab('url')" role="tab" [attr.aria-selected]="activeTab() === 'url'"
            class="py-3 text-xs font-semibold border-b-2 transition-colors focus:outline-none whitespace-nowrap" [ngClass]="activeTab() === 'url' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'">From URL</button>
          <button (click)="setTab('file')" role="tab" [attr.aria-selected]="activeTab() === 'file'"
            class="py-3 text-xs font-semibold border-b-2 transition-colors focus:outline-none whitespace-nowrap" [ngClass]="activeTab() === 'file' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'">From File</button>
        </div>
      }

      <!-- Panel Body Container -->
      <div class="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-grow space-y-4">
        <!-- Describe Tab -->
        <app-ai-tab-describe #describeTab
          [class.hidden]="store.aiModalMode() === 'generate' && activeTab() !== 'text'"
          [mode]="store.aiModalMode()" 
          [isLoading]="isAiLoading()" />

        <!-- URL Tab -->
        <app-ai-tab-url #urlTab
          [class.hidden]="store.aiModalMode() !== 'generate' || activeTab() !== 'url'"
          [isLoading]="isAiLoading()"
          (onFetch)="handleUrlFetch($event)" />

        <!-- File Tab -->
        <app-ai-tab-file #fileTab
          [class.hidden]="store.aiModalMode() !== 'generate' || activeTab() !== 'file'"
          [selectedFile]="selectedFile()"
          (onFileSelect)="onFileSelected($event)"
          (onRemoveFile)="removeFile()" />
        
        @if (selectedFile() && activeTab() !== 'file' && store.aiModalMode() === 'generate') {
          <div class="mt-4 flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/10 p-2.5 rounded border border-indigo-500/30 select-none">
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
             <span class="truncate">Attached: {{ selectedFile()?.name }}</span>
          </div>
        }
        
        @if (error()) { 
           <p class="mt-3 text-xs text-red-400 flex items-center gap-1.5 animate-pulse bg-red-500/10 border border-red-500/25 p-2.5 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>{{ error() }}</span>
           </p> 
        }
      </div>

      <!-- Action Footer -->
      <div class="p-4 sm:p-5 border-t border-slate-700/50 bg-slate-800/20 flex justify-end gap-3 shrink-0">
        <button (click)="closeCopilot()" [disabled]="isAiLoading()" 
          class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50">Cancel</button>
        
        <button (click)="generate()" [disabled]="isAiLoading()" 
          class="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold py-2 px-5 rounded-lg shadow-md flex items-center gap-2 transition-all text-xs">
           @if (isAiLoading()) {
              <svg class="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                 <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Thinking...</span>
           } @else {
              <span>{{ store.aiModalMode() === 'refine' ? 'Propose' : 'Generate' }}</span>
           }
        </button>
      </div>
    </div>
  `
})
export class AiCopilotComponent {
  activeTab = signal<AiTab>('text');
  isAiLoading = signal(false);
  error = signal<string | null>(null);
  selectedFile = signal<{name: string, type: string, content: string, isBase64: boolean} | null>(null);

  describeTab = viewChild<AiTabDescribeComponent>('describeTab');
  urlTab = viewChild<AiTabUrlComponent>('urlTab');
  fileTab = viewChild<AiTabFileComponent>('fileTab');

  private geminiService = inject(GeminiService);
  store = inject(AppStateService);

  constructor() {
    effect(() => {
        // Reset inputs on mode toggles
        if (this.store.aiModalMode() === 'refine') {
            this.activeTab.set('text');
            this.error.set(null);
            this.removeFile();
        }
    });
  }

  setMode(mode: AiMode) {
    this.store.aiModalMode.set(mode);
  }

  setTab(tab: AiTab) { 
    this.activeTab.set(tab); 
    this.error.set(null); 
  }

  async handleUrlFetch(url: string) {
    if (!url) return;
    this.isAiLoading.set(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Fetch failed');
      const text = (await res.text()).slice(0, 100000);
      
      this.selectedFile.set({
          name: url,
          type: 'text/html',
          content: text,
          isBase64: false
      });
      this.error.set(null);
    } catch {
      this.error.set('Could not fetch URL due to CORS restrictions. Please paste manually.');
    } finally {
      this.isAiLoading.set(false);
    }
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    const isBin = file.type.startsWith('image/') || file.type === 'application/pdf';

    reader.onload = () => {
      this.selectedFile.set({
        name: file.name,
        type: file.type || 'text/plain',
        content: isBin ? (reader.result as string).split(',')[1] : reader.result as string,
        isBase64: isBin
      });
    };
    isBin ? reader.readAsDataURL(file) : reader.readAsText(file);
  }

  removeFile() {
    this.selectedFile.set(null);
    this.fileTab()?.clear();
    this.urlTab()?.clear();
  }

  closeCopilot() {
    this.store.closeAllModals();
  }

  async generate() {
    const aiConfig = this.store.aiConfig();
    if (!aiConfig.apiKey) {
      this.error.set('API Key is missing. Click the Settings icon to configure it.');
      return;
    }

    this.isAiLoading.set(true);
    this.error.set(null);
    
    try {
        let prompt = '';
        let file = this.selectedFile();

        // 1. Resolve prompt based on mode & tab
        if (this.store.aiModalMode() === 'generate') {
            if (this.activeTab() === 'text') {
                prompt = this.describeTab()?.value || '';
                if (!prompt.trim()) {
                  throw new Error('Please describe the diagram you want to generate.');
                }
            }
            else if (this.activeTab() === 'url') {
                const instructions = this.urlTab()?.instructions || '';
                const url = this.urlTab()?.url;
                if (!file && url) {
                    await this.handleUrlFetch(url);
                    file = this.selectedFile();
                }
                if (!file) { throw new Error('No URL content fetched.'); }
                prompt = `Analyze the content from ${file.name}.\nInstructions: ${instructions || 'Generate a Mermaid diagram that captures the main structure and relationships.'}`;
            }
            else if (this.activeTab() === 'file') {
                const instructions = this.fileTab()?.instructions || '';
                if (!file) { throw new Error('No file selected.'); }
                prompt = `Analyze the attached file (${file.name}).\nInstructions: ${instructions || 'Generate a Mermaid diagram that captures the main structure and relationships.'}`;
            }
        }
        else {
             prompt = this.describeTab()?.value || '';
             if (!prompt.trim()) { throw new Error('Please enter update instructions.'); }
        }

        const inputData: AiInputData = { prompt };
        
        // 2. Attach metadata content
        if (file) {
            if (file.isBase64) {
                inputData.media = { mimeType: file.type, data: file.content };
            } else {
                inputData.prompt += `\n\n--- Source Content (${file.name}) ---\n${file.content}\n`;
            }
        }

        // 3. Inject context code if in refine mode or current code exists
        if (this.store.aiModalMode() === 'refine') {
            inputData.contextCode = this.store.mermaidCode();
        }

        const useBaseUrl = aiConfig.useCustomUrl && aiConfig.customUrl?.trim().length > 0;

        const code = await this.geminiService.generateMermaidCode(inputData, {
          apiKey: aiConfig.apiKey,
          useCustomUrl: aiConfig.useCustomUrl,
          baseUrl: useBaseUrl ? aiConfig.customUrl.trim() : undefined,
          model: aiConfig.model,
          thinkingBudget: aiConfig.thinkingBudget,
          apiVersion: aiConfig.apiVersion
        });

        // 4. Set proposal + switch mobile tab to editor so the user sees the diff
        this.store.setProposal(code);

        // Clean up inputs on success
        this.removeFile();
        this.describeTab()?.clear();
        this.urlTab()?.clear();
        this.fileTab()?.clear();

    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Generation failed.';
        this.error.set(message);
    } finally {
        this.isAiLoading.set(false);
    }
  }
}
