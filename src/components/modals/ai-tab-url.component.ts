
import { Component, input, output, viewChild, ElementRef, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ai-tab-url',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Public URL (Text content)</label>
        <div class="flex gap-2 flex-col sm:flex-row">
          <input #urlInput type="url" 
            class="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
            placeholder="https://example.com/docs" 
            [disabled]="isLoading()"/>
          <button (click)="onFetch.emit(urlInput.value)" [disabled]="isLoading()" 
            class="bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 py-2 sm:py-0 rounded-lg border border-slate-600 transition-colors">
            Fetch
          </button>
        </div>
        <p class="text-xs text-slate-500 mt-1">Note: Many websites block direct access (CORS). If fetching fails, please copy/paste the content into the "Describe" tab.</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Additional Instructions <span class="text-slate-500 font-normal">(Optional)</span></label>
        <textarea #urlInstructionInput 
          class="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all" 
          rows="3" 
          placeholder="e.g. Focus only on the authentication flow..."></textarea>
      </div>
    </div>
  `
})
export class AiTabUrlComponent {
  isLoading = input.required<boolean>();
  onFetch = output<string>();

  urlInput = viewChild<ElementRef<HTMLInputElement>>('urlInput');
  urlInstructionInput = viewChild<ElementRef<HTMLTextAreaElement>>('urlInstructionInput');

  get url(): string { return this.urlInput()?.nativeElement.value || ''; }
  get instructions(): string { return this.urlInstructionInput()?.nativeElement.value || ''; }

  clear() {
    if (this.urlInput()?.nativeElement) this.urlInput()!.nativeElement.value = '';
    if (this.urlInstructionInput()?.nativeElement) this.urlInstructionInput()!.nativeElement.value = '';
  }
}
