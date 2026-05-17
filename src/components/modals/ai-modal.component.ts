
import { Component, ElementRef, inject, input, output, signal, viewChild, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService, AiInputData } from '../../services/ai/gemini.service';
import { AiMode, AppStateService } from '../../services/core/app-state.service';
import { AiTabDescribeComponent } from './ai-tab-describe.component';
import { AiTabUrlComponent } from './ai-tab-url.component';
import { AiTabFileComponent } from './ai-tab-file.component';

export type AiTab = 'text' | 'url' | 'file';

@Component({
  selector: 'app-ai-modal',
  standalone: true,
  imports: [CommonModule, AiTabDescribeComponent, AiTabUrlComponent, AiTabFileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 bg-black/70 z-50 animate-fade-in backdrop-blur-sm" (click)="close.emit()"></div>
      <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-indigo-500/50 shadow-2xl z-50 flex flex-col animate-scale-in
                  w-[95%] rounded-xl max-h-[90vh]
                  sm:w-full sm:max-max-lg sm:rounded-2xl sm:max-w-lg">
        
        <!-- Header -->
        <div class="flex justify-between items-center p-4 sm:p-5 border-b border-slate-700 shrink-0">
          <div class="flex items-center gap-2">
             <svg class="text-indigo-400" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg>
             <h3 class="text-lg sm:text-xl font-bold text-white">
               @if(mode() === 'refine') { Refine / Fix Chart } @else { Generate with AI }
             </h3>
          </div>
          <button (click)="close.emit()" [disabled]="isAiLoading()" 
            class="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700 disabled:opacity-50"
            aria-label="Close modal" title="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
  
        <!-- Tabs (Only show in Generate Mode) -->
        @if(mode() === 'generate') {
          <div class="flex border-b border-slate-700 px-4 sm:px-5 gap-4 shrink-0 overflow-x-auto" role="tablist">
            <button (click)="setTab('text')" role="tab" [attr.aria-selected]="activeTab() === 'text'"
              class="py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none whitespace-nowrap" [ngClass]="activeTab() === 'text' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'">Describe</button>
            <button (click)="setTab('url')" role="tab" [attr.aria-selected]="activeTab() === 'url'"
              class="py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none whitespace-nowrap" [ngClass]="activeTab() === 'url' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'">From URL</button>
            <button (click)="setTab('file')" role="tab" [attr.aria-selected]="activeTab() === 'file'"
              class="py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none whitespace-nowrap" [ngClass]="activeTab() === 'file' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'">From File</button>
          </div>
        }
  
        <div class="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-grow">
          <!-- Describe Tab -->
          <app-ai-tab-describe #describeTab
            [class.hidden]="mode() === 'generate' && activeTab() !== 'text'"
            [mode]="mode()" 
            [isLoading]="isAiLoading()" />

          <!-- URL Tab -->
          <app-ai-tab-url #urlTab
            [class.hidden]="mode() !== 'generate' || activeTab() !== 'url'"
            [isLoading]="isAiLoading()"
            (onFetch)="handleUrlFetch($event)" />

          <!-- File Tab -->
          <app-ai-tab-file #fileTab
            [class.hidden]="mode() !== 'generate' || activeTab() !== 'file'"
            [selectedFile]="selectedFile()"
            (onFileSelect)="onFileSelected($event)"
            (onRemoveFile)="removeFile()" />
          
          @if (selectedFile() && activeTab() !== 'file' && mode() === 'generate') {
            <div class="mt-4 flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/10 p-2 rounded border border-indigo-500/30">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
               Attached: {{ selectedFile()?.name }}
            </div>
          }
          @if (error()) { 
             <p class="mt-3 text-xs text-red-400 flex items-center gap-1 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {{ error() }}
             </p> 
          }
        </div>
  
        <div class="p-4 sm:p-5 border-t border-slate-700 bg-slate-800/50 rounded-b-xl sm:rounded-b-2xl flex justify-end gap-3 shrink-0">
          <button (click)="close.emit()" [disabled]="isAiLoading()" class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-50">Cancel</button>
          <button (click)="generate()" [disabled]="isAiLoading()" class="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold py-2 px-6 rounded-lg shadow-md flex items-center gap-2 transition-all">
             @if (isAiLoading()) {
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                   <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="hidden sm:inline">Thinking...</span>
             } @else {
                {{ mode() === 'refine' ? 'Update' : 'Generate' }}
             }
          </button>
        </div>
      </div>
    }
  `
})
export class AiModalComponent {
  isOpen = input.required<boolean>();
  mode = input.required<AiMode>();
  currentCode = input<string>(''); // For refine mode
  
  close = output<void>();
  codeGenerated = output<string>();

  activeTab = signal<AiTab>('text');
  isAiLoading = signal(false);
  error = signal<string | null>(null);
  selectedFile = signal<{name: string, type: string, content: string, isBase64: boolean} | null>(null);

  describeTab = viewChild<AiTabDescribeComponent>('describeTab');
  urlTab = viewChild<AiTabUrlComponent>('urlTab');
  fileTab = viewChild<AiTabFileComponent>('fileTab');

  private geminiService = inject(GeminiService);
  private store = inject(AppStateService);

  constructor() {
    effect(() => {
        // Reset tab to text if mode is refine
        if (this.mode() === 'refine') {
            this.activeTab.set('text');
            this.error.set(null);
            this.removeFile();
        }
    });
  }

  setTab(tab: AiTab) { this.activeTab.set(tab); this.error.set(null); }

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
      this.error.set('Could not fetch URL. This is likely due to CORS restrictions on the target website. Please copy the text content manually.');
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

  async generate() {
    // Basic validation before starting
    const aiConfig = this.store.aiConfig();
    if (!aiConfig.apiKey) {
      this.error.set('API Key is missing. Please click the Settings (gear icon) to configure it.');
      return;
    }

    this.isAiLoading.set(true);
    this.error.set(null);
    
    try {
        let prompt = '';
        let file = this.selectedFile();

        // LOGIC FOR GENERATE MODE
        if (this.mode() === 'generate') {
            if (this.activeTab() === 'text') {
                prompt = this.describeTab()?.value || '';
            } 
            else if (this.activeTab() === 'url') {
                const instructions = this.urlTab()?.instructions || '';
                const url = this.urlTab()?.url;
                if (!file && url) {
                    await this.handleUrlFetch(url);
                    file = this.selectedFile();
                }
                if (!file) { throw new Error('No URL content fetched.'); }
                prompt = `Analyze the content from ${file.name}.\nInstructions: ${instructions}`;
            }
            else if (this.activeTab() === 'file') {
                const instructions = this.fileTab()?.instructions || '';
                if (!file) { throw new Error('No file selected.'); }
                prompt = `Analyze the attached file (${file.name}).\nInstructions: ${instructions}`;
            }
        } 
        // LOGIC FOR REFINE MODE
        else {
             prompt = this.describeTab()?.value || '';
             if (!prompt.trim()) { throw new Error('Please enter update instructions.'); }
        }

        const inputData: AiInputData = { prompt };
        
        // Add Media/Content
        if (file) {
            if (file.isBase64) {
                inputData.media = { mimeType: file.type, data: file.content };
            } else {
                inputData.prompt += `\n\n--- Source Content (${file.name}) ---\n${file.content}\n`;
            }
        }

        if (this.mode() === 'refine') {
            inputData.contextCode = this.currentCode();
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

        this.codeGenerated.emit(code);
        this.removeFile();
        this.describeTab()?.clear();
        this.urlTab()?.clear();
        this.fileTab()?.clear();
        
    } catch (e: any) {
        this.error.set(e.message || 'Generation failed.');
    } finally {
        this.isAiLoading.set(false);
    }
  }
}
