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
  ChangeDetectionStrategy,
  computed,
  DestroyRef,
} from "@angular/core";
import { isPlatformBrowser, CommonModule } from "@angular/common";
import Prism from "prismjs";
import { AppStateService } from "../services/core/app-state.service";
import { DiffViewerComponent } from "./diff-viewer.component";

@Component({
  selector: "app-code-editor",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, DiffViewerComponent],
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
        @if (!store.proposedCode()) {
          <button
            (click)="copyCode()"
            class="text-xs app-text-muted hover:text-[var(--text-main)] transition-colors flex items-center justify-center p-1 rounded hover:bg-[var(--bg-secondary)]"
            [title]="copyText()"
            [attr.aria-label]="copyText()"
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

          <!-- Focus Mode Toggle Button -->
          <button
            (click)="toggleExpand.emit()"
            class="hidden md:flex text-xs app-text-muted hover:text-[var(--text-main)] transition-colors items-center justify-center p-1 rounded hover:bg-[var(--bg-secondary)]"
            [title]="isExpanded() ? 'Collapse view' : 'Maximize view'"
            [attr.aria-label]="isExpanded() ? 'Collapse view' : 'Maximize view'"
          >
            @if (isExpanded()) {
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4"/></svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            }
          </button>
        }
      </div>
      
      @if (!store.proposedCode()) {
        <ng-content select="[actions]"></ng-content>
      } @else {
        <div class="flex items-center gap-2 animate-fade-in shrink-0">
          <button (click)="acceptProposal()" class="text-xs bg-emerald-600 hover:bg-emerald-500 font-bold px-3 py-1.5 rounded-md text-white transition-colors shadow-sm flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Accept
          </button>
          <button (click)="discardProposal()" class="text-xs bg-slate-700 hover:bg-slate-650 font-medium px-3 py-1.5 rounded-md text-slate-200 transition-colors border border-slate-600/50 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            Discard
          </button>
        </div>
      }
    </div>

    <!-- AI Proposal Banner -->
    @if (store.proposedCode()) {
      <div class="bg-indigo-950/80 border border-indigo-700/50 text-indigo-200 px-4 py-2.5 rounded-lg mb-2 text-xs flex justify-between items-center gap-2 animate-fade-in shrink-0">
        <div class="flex items-center gap-2">
           <svg class="text-indigo-400 animate-pulse" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg>
           <span class="font-medium">AI proposed an optimized chart structure. Review differences below:</span>
        </div>
      </div>
    }

    <div
      class="editor-container relative flex-1 w-full min-h-0 app-bg-secondary bg-opacity-50 border app-border rounded-lg overflow-hidden transition-colors duration-300"
    >
      <!-- Line Numbers Gutter -->
      <div 
        #gutter
        [class.hidden]="store.proposedCode()"
        class="editor-gutter absolute left-0 top-0 bottom-0 w-9 text-right select-none pr-1.5 border-r border-slate-700/30 text-slate-500 overflow-hidden pointer-events-none bg-slate-900/10"
      >
        @for (line of lines(); track $index) {
          <div class="leading-[1.5rem] h-[1.5rem]">{{ $index + 1 }}</div>
        }
      </div>

      <textarea
        #textarea
        id="mermaid-code"
        [class.hidden]="store.proposedCode()"
        class="editor-layer editor-textarea editor-layer-with-gutter absolute inset-0 w-full h-full focus:outline-none app-text-main"
        [value]="code()"
        (input)="onInput($event)"
        (scroll)="onScroll($event)"
        placeholder="Enter your Mermaid syntax here..."
        spellcheck="false"
      ></textarea>

      <pre
        #pre
        [class.hidden]="store.proposedCode()"
        class="editor-layer editor-pre editor-layer-with-gutter absolute inset-0 w-full h-full"
      ><code #codeEl class="language-mermaid"></code></pre>

      @if (store.proposedCode()) {
        <app-diff-viewer 
          [oldCode]="code()" 
          [newCode]="store.proposedCode()!" 
          class="absolute inset-0 w-full h-full z-20"
        />
      }
    </div>
  `,
  styles: [
    `
      .editor-container {
        min-height: 0;
      }
      .editor-layer, .editor-gutter {
        font-family: "Fira Code", monospace !important;
        font-size: 0.875rem !important;
        line-height: 1.5rem !important;
      }
      .editor-layer {
        padding: 1rem !important;
        padding-left: 3rem !important;
        margin: 0 !important;
        border: 0 !important;
        white-space: pre !important;
        overflow: auto !important;
        box-sizing: border-box !important;
      }
      .editor-gutter {
        padding-top: 1rem !important;
        padding-bottom: 1rem !important;
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
  isExpanded = input<boolean>(false);
  
  codeChange = output<string>();
  toggleExpand = output<void>();

  textarea = viewChild.required<ElementRef<HTMLTextAreaElement>>("textarea");
  pre = viewChild.required<ElementRef<HTMLPreElement>>("pre");
  codeEl = viewChild.required<ElementRef<HTMLElement>>("codeEl");
  gutter = viewChild<ElementRef<HTMLDivElement>>("gutter");

  isCopied = signal(false);
  copyText = signal("Copy code");

  lines = computed(() => {
    return this.code().split("\n");
  });

  store = inject(AppStateService);

  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  private copyTimeout: any;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.copyTimeout) {
        clearTimeout(this.copyTimeout);
      }
    });

    effect(() => {
      const c = this.code();
      const el = this.codeEl().nativeElement;
      if (isPlatformBrowser(this.platformId)) {
        el.textContent = c;
        if (Prism.highlightElement) {
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

    const gutterEl = this.gutter()?.nativeElement;
    if (gutterEl) {
      gutterEl.scrollTop = target.scrollTop;
    }
  }

  async copyCode() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      await navigator.clipboard.writeText(this.code());
      this.isCopied.set(true);
      this.copyText.set("Copied!");
      
      if (this.copyTimeout) {
        clearTimeout(this.copyTimeout);
      }
      
      this.copyTimeout = setTimeout(() => {
        this.isCopied.set(false);
        this.copyText.set("Copy code");
        this.copyTimeout = null;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  }

  acceptProposal() {
    const proposal = this.store.proposedCode();
    if (proposal !== null) {
      this.codeChange.emit(proposal);
      this.store.proposedCode.set(null);
    }
  }

  discardProposal() {
    this.store.proposedCode.set(null);
  }
}

