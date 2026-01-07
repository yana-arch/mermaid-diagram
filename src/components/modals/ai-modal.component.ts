
import { Component, ElementRef, inject, input, output, signal, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService, AiInputData } from '../../services/gemini.service';
import { AiMode } from '../../services/app-state.service';

export type AiTab = 'text' | 'url' | 'file';

@Component({
  selector: 'app-ai-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 bg-black/70 z-50 animate-fade-in backdrop-blur-sm" (click)="close.emit()"></div>
      <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-indigo-500/50 rounded-2xl shadow-2xl z-50 w-full max-w-lg flex flex-col animate-scale-in">
        
        <!-- Header -->
        <div class="flex justify-between items-center p-5 border-b border-slate-700">
          <div class="flex items-center gap-2">
             <svg class="text-indigo-400" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
             <h3 class="text-xl font-bold text-white">
               @if(mode() === 'refine') { Refine / Fix Chart } @else { Generate with AI }
             </h3>
          </div>
          <button (click)="close.emit()" [disabled]="isAiLoading()" class="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700 disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
  
        <!-- Tabs (Only show in Generate Mode) -->
        @if(mode() === 'generate') {
          <div class="flex border-b border-slate-700 px-5 gap-4">
            <button (click)="setTab('text')" class="py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none" [ngClass]="activeTab() === 'text' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'">Describe</button>
            <button (click)="setTab('url')" class="py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none" [ngClass]="activeTab() === 'url' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'">From URL</button>
            <button (click)="setTab('file')" class="py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none" [ngClass]="activeTab() === 'file' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'">From File</button>
          </div>
        }
  
        <div class="p-6">
          <!-- Text Tab / Refine Mode -->
          <div [class.hidden]="mode() === 'generate' && activeTab() !== 'text'">
             <label class="block text-sm font-medium text-slate-300 mb-2">
               @if(mode() === 'refine') { What changes would you like to make? } @else { Instructions }
             </label>
             <textarea #promptInput class="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all" rows="5" 
               [placeholder]="mode() === 'refine' ? 'e.g., Change the red nodes to blue, add a condition check before step C...' : 'Describe your diagram structure, relationships, and labels...'" 
               [disabled]="isAiLoading()"></textarea>
          </div>
  
          <!-- URL Tab -->
          <div [class.hidden]="mode() !== 'generate' || activeTab() !== 'url'">
             <div class="space-y-4">
               <div>
                 <label class="block text-sm font-medium text-slate-300 mb-2">Public URL (Text content)</label>
                 <div class="flex gap-2">
                   <input #urlInput type="url" class="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="https://example.com/docs" [disabled]="isAiLoading()"/>
                   <button (click)="fetchUrl()" [disabled]="isAiLoading()" class="bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 rounded-lg border border-slate-600 transition-colors">Fetch</button>
                 </div>
               </div>
               <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Additional Instructions <span class="text-slate-500 font-normal">(Optional)</span></label>
                  <textarea #urlInstructionInput class="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all" rows="3" placeholder="e.g. Focus only on the authentication flow..."></textarea>
               </div>
             </div>
          </div>
  
          <!-- File Tab -->
          <div [class.hidden]="mode() !== 'generate' || activeTab() !== 'file'">
            <div class="space-y-4">
               <div>
                 <label class="block text-sm font-medium text-slate-300 mb-2">Upload Source File</label>
                 <div class="relative border-2 border-dashed border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-indigo-500 transition-colors bg-slate-900/50 group">
                   @if(!selectedFile()) {
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-slate-500 mb-3 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                     </svg>
                     <p class="text-sm text-slate-400 mb-1">Drag & drop or click to upload</p>
                     <p class="text-xs text-slate-500">Supported: Code, Text, PDF, Images</p>
                     <input 
                       #fileInput 
                       type="file" 
                       class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                       (change)="onFileSelected($event)" 
                       accept=".txt,.md,.py,.js,.ts,.java,.cpp,.html,.css,.json,.sql,.xml,.png,.jpg,.jpeg,.webp,.pdf"
                     />
                   } @else {
                      <div class="flex items-center gap-3 w-full bg-slate-800 p-3 rounded-lg border border-indigo-500/50">
                         <div class="bg-indigo-500/20 p-2 rounded text-indigo-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                         </div>
                         <span class="text-white truncate flex-1 text-left text-sm font-medium">{{ selectedFile()?.name }}</span>
                         <button (click)="removeFile()" class="text-slate-400 hover:text-red-400 p-1 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                         </button>
                      </div>
                   }
                 </div>
               </div>
               <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Additional Instructions <span class="text-slate-500 font-normal">(Optional)</span></label>
                  <textarea #fileInstructionInput class="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all" rows="3" placeholder="e.g. Visualize the relationship between classes..."></textarea>
               </div>
            </div>
          </div>
          
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
  
        <div class="p-5 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl flex justify-end gap-3">
          <button (click)="close.emit()" [disabled]="isAiLoading()" class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-50">Cancel</button>
          <button (click)="generate()" [disabled]="isAiLoading()" class="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold py-2 px-6 rounded-lg shadow-md flex items-center gap-2 transition-all">
             @if (isAiLoading()) {
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                   <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Thinking...
             } @else {
                {{ mode() === 'refine' ? 'Update Code' : 'Generate' }}
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

  promptInput = viewChild<ElementRef<HTMLTextAreaElement>>('promptInput');
  urlInput = viewChild<ElementRef<HTMLInputElement>>('urlInput');
  urlInstructionInput = viewChild<ElementRef<HTMLTextAreaElement>>('urlInstructionInput');
  
  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  fileInstructionInput = viewChild<ElementRef<HTMLTextAreaElement>>('fileInstructionInput');

  private geminiService = inject(GeminiService);

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

  async fetchUrl() {
    const url = this.urlInput()?.nativeElement.value;
    if (!url) return;
    this.isAiLoading.set(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Fetch failed');
      const text = (await res.text()).slice(0, 100000);
      
      // Store content temporarily in a way that doesn't mess up the UI, 
      // effectively simulation file selection for URL content
      this.selectedFile.set({
          name: url,
          type: 'text/html',
          content: text,
          isBase64: false
      });
      // Visual feedback handled by showing "Attached" or we can just proceed.
      // For this flow, we will keep it simple and just set it ready for generation.
      this.error.set(null);
    } catch {
      this.error.set('Could not fetch URL (CORS might block this).');
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
    if(this.fileInput()?.nativeElement) this.fileInput()!.nativeElement.value = '';
    // Clear URL temporary file if any
    if(this.urlInput()?.nativeElement) this.urlInput()!.nativeElement.value = '';
  }

  async generate() {
    this.isAiLoading.set(true);
    this.error.set(null);
    
    try {
        let prompt = '';
        let file = this.selectedFile();

        // LOGIC FOR GENERATE MODE
        if (this.mode() === 'generate') {
            if (this.activeTab() === 'text') {
                prompt = this.promptInput()?.nativeElement.value || '';
            } 
            else if (this.activeTab() === 'url') {
                const instructions = this.urlInstructionInput()?.nativeElement.value || '';
                // If we fetched URL content, it's in selectedFile.
                if (!file) {
                    // Try fetch if user didn't click fetch but typed url
                    await this.fetchUrl();
                    file = this.selectedFile();
                }
                if (!file) { throw new Error('No URL content fetched.'); }
                prompt = `Analyze the content from ${file.name}.\nInstructions: ${instructions}`;
            }
            else if (this.activeTab() === 'file') {
                const instructions = this.fileInstructionInput()?.nativeElement.value || '';
                if (!file) { throw new Error('No file selected.'); }
                prompt = `Analyze the attached file (${file.name}).\nInstructions: ${instructions}`;
            }
        } 
        // LOGIC FOR REFINE MODE
        else {
             prompt = this.promptInput()?.nativeElement.value || '';
             if (!prompt.trim()) { throw new Error('Please enter update instructions.'); }
        }

        const inputData: AiInputData = { prompt };
        
        // Add Media/Content
        if (file) {
            if (file.isBase64) {
                inputData.media = { mimeType: file.type, data: file.content };
            } else {
                // If text content (from file or URL), append to prompt for robustness
                inputData.prompt += `\n\n--- Source Content (${file.name}) ---\n${file.content}\n`;
            }
        }

        // Add Context Code (Refine Mode)
        if (this.mode() === 'refine') {
            inputData.contextCode = this.currentCode();
        }

        const code = await this.geminiService.generateMermaidCode(inputData);
        this.codeGenerated.emit(code);
        this.removeFile();
        
        // Clean inputs
        if(this.promptInput()?.nativeElement) this.promptInput()!.nativeElement.value = '';
        if(this.urlInstructionInput()?.nativeElement) this.urlInstructionInput()!.nativeElement.value = '';
        if(this.fileInstructionInput()?.nativeElement) this.fileInstructionInput()!.nativeElement.value = '';
        
    } catch (e: any) {
        this.error.set(e.message || 'Generation failed.');
    } finally {
        this.isAiLoading.set(false);
    }
  }
}
