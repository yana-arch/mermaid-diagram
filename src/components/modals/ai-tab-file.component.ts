
import { Component, input, output, viewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ai-tab-file',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Upload Source File</label>
        <div class="relative border-2 border-dashed border-slate-600 rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center text-center hover:border-indigo-500 transition-colors bg-slate-900/50 group">
          @if(!selectedFile()) {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 sm:h-10 sm:w-10 text-slate-500 mb-3 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <button (click)="onRemoveFile.emit()" class="text-slate-400 hover:text-red-400 p-1 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          }
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Additional Instructions <span class="text-slate-500 font-normal">(Optional)</span></label>
        <textarea #fileInstructionInput 
          class="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all" 
          rows="3" 
          placeholder="e.g. Visualize the relationship between classes..."></textarea>
      </div>
    </div>
  `
})
export class AiTabFileComponent {
  selectedFile = input<any>();
  onFileSelect = output<Event>();
  onRemoveFile = output<void>();

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  fileInstructionInput = viewChild<ElementRef<HTMLTextAreaElement>>('fileInstructionInput');

  get instructions(): string { return this.fileInstructionInput()?.nativeElement.value || ''; }

  onFileSelected(e: Event) {
    this.onFileSelect.emit(e);
  }

  clear() {
    if (this.fileInput()?.nativeElement) this.fileInput()!.nativeElement.value = '';
    if (this.fileInstructionInput()?.nativeElement) this.fileInstructionInput()!.nativeElement.value = '';
  }
}
