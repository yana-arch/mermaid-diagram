
import { Component, ElementRef, ViewEncapsulation, input, output, viewChild, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

declare const Prism: any;

@Component({
  selector: 'app-code-editor',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'flex flex-col h-full'
  },
  template: `
    <div class="flex justify-between items-center mb-2 shrink-0">
      <label for="mermaid-code" class="text-sm font-medium text-slate-300">Mermaid Code Editor</label>
      <ng-content select="[actions]"></ng-content>
    </div>
    <div class="editor-container relative flex-1 w-full min-h-0 bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
      <textarea 
        #textarea
        id="mermaid-code"
        class="editor-layer editor-textarea absolute inset-0 w-full h-full focus:outline-none"
        [value]="code()"
        (input)="onInput($event)"
        (scroll)="onScroll($event)"
        placeholder="Enter your Mermaid syntax here..."
        spellcheck="false"
      ></textarea>
      
      <pre #pre class="editor-layer editor-pre absolute inset-0 w-full h-full"><code #codeEl class="language-mermaid"></code></pre>
    </div>
  `,
  styles: [`
    .editor-container { container-type: inline-size; }
    .editor-layer {
      font-family: "Fira Code", monospace !important;
      font-size: 0.875rem !important;
      line-height: 1.5rem !important;
      padding: 1rem !important;
      margin: 0 !important;
      border: 0 !important;
      white-space: pre !important;
      overflow: auto !important;
      box-sizing: border-box !important;
    }
    .editor-textarea {
      color: transparent !important;
      background: transparent !important;
      caret-color: #34d399;
      resize: none;
      z-index: 10;
    }
    .editor-pre {
      z-index: 0;
      pointer-events: none;
      background: transparent !important;
      text-shadow: none !important;
    }
    .editor-pre code {
      font-family: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
      padding: 0 !important;
      white-space: pre !important;
    }
  `]
})
export class CodeEditorComponent {
  code = input.required<string>();
  codeChange = output<string>();

  textarea = viewChild.required<ElementRef<HTMLTextAreaElement>>('textarea');
  pre = viewChild.required<ElementRef<HTMLPreElement>>('pre');
  codeEl = viewChild.required<ElementRef<HTMLElement>>('codeEl');

  private platformId = inject(PLATFORM_ID);

  constructor() {
    effect(() => {
      const c = this.code();
      const el = this.codeEl().nativeElement;
      if (isPlatformBrowser(this.platformId)) {
        el.textContent = c;
        if (typeof Prism !== 'undefined' && Prism.highlightElement) {
          Prism.highlightElement(el);
        }
      }
    });
  }

  onInput(event: Event) {
    this.codeChange.emit((event.target as HTMLTextAreaElement).value);
  }

  onScroll(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    const pre = this.pre().nativeElement;
    pre.scrollTop = target.scrollTop;
    pre.scrollLeft = target.scrollLeft;
  }
}
