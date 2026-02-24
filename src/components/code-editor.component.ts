import {
  Component,
  ElementRef,
  ViewEncapsulation,
  input,
  output,
  viewChild,
  effect,
  inject,
  PLATFORM_ID,
  signal,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import Prism from "prismjs";

@Component({
  selector: "app-code-editor",
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: "flex flex-col h-full",
  },
  template: `
    <div class="flex justify-between items-center mb-2 shrink-0 gap-2">
      <div class="flex items-center gap-3 shrink-0">
        <label
          for="mermaid-code"
          class="hidden sm:block text-sm font-medium app-text-main"
          >Mermaid Code Editor</label
        >
        <button
          (click)="copyCode()"
          class="text-xs app-text-muted hover:text-[var(--text-main)] transition-colors flex items-center justify-center p-1 rounded hover:bg-[var(--bg-secondary)]"
          [title]="copyText()"
        >
          @if (isCopied()) {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-emerald-400"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          } @else {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path
                d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
              ></path>
            </svg>
          }
        </button>
      </div>
      <ng-content select="[actions]"></ng-content>
    </div>
    <div
      class="editor-container relative flex-1 w-full min-h-0 app-bg-secondary bg-opacity-50 border app-border rounded-lg overflow-hidden transition-colors duration-300"
    >
      <textarea
        #textarea
        id="mermaid-code"
        class="editor-layer editor-textarea absolute inset-0 w-full h-full focus:outline-none app-text-main"
        [value]="code()"
        (input)="onInput($event)"
        (scroll)="onScroll($event)"
        placeholder="Enter your Mermaid syntax here..."
        spellcheck="false"
      ></textarea>

      <pre
        #pre
        class="editor-layer editor-pre absolute inset-0 w-full h-full"
      ><code #codeEl class="language-mermaid"></code></pre>
    </div>
  `,
  styles: [
    `
      .editor-container {
        min-height: 0;
      }
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
    `,
  ],
})
export class CodeEditorComponent {
  code = input.required<string>();
  codeChange = output<string>();

  textarea = viewChild.required<ElementRef<HTMLTextAreaElement>>("textarea");
  pre = viewChild.required<ElementRef<HTMLPreElement>>("pre");
  codeEl = viewChild.required<ElementRef<HTMLElement>>("codeEl");

  isCopied = signal(false);
  copyText = signal("Copy code");

  private platformId = inject(PLATFORM_ID);

  constructor() {
    effect(() => {
      const c = this.code();
      const el = this.codeEl().nativeElement;
      if (isPlatformBrowser(this.platformId)) {
        el.textContent = c;
        if (typeof Prism !== "undefined" && Prism.highlightElement) {
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

  async copyCode() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      await navigator.clipboard.writeText(this.code());
      this.isCopied.set(true);
      this.copyText.set("Copied!");
      setTimeout(() => {
        this.isCopied.set(false);
        this.copyText.set("Copy code");
      }, 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  }
}
