
import { Component, input, output, viewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ai-tab-describe',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-300">
        {{ mode() === 'refine' ? 'What changes would you like to make?' : 'Instructions' }}
      </label>
      <textarea #promptInput 
        class="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all" 
        rows="5" 
        [placeholder]="mode() === 'refine' ? 'e.g., Change the red nodes to blue, add a condition check before step C...' : 'Describe your diagram structure, relationships, and labels...'" 
        [disabled]="isLoading()"></textarea>
    </div>
  `
})
export class AiTabDescribeComponent {
  mode = input.required<'generate' | 'refine'>();
  isLoading = input.required<boolean>();
  
  promptInput = viewChild<ElementRef<HTMLTextAreaElement>>('promptInput');

  get value(): string {
    return this.promptInput()?.nativeElement.value || '';
  }

  clear() {
    if (this.promptInput()?.nativeElement) {
      this.promptInput()!.nativeElement.value = '';
    }
  }
}
