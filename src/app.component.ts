import { Component, ChangeDetectionStrategy, signal, effect, viewChild, ElementRef, inject, PLATFORM_ID, ViewEncapsulation } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MermaidService } from './services/mermaid.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [MermaidService],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  private readonly mermaidService = inject(MermaidService);
  private readonly platformId = inject(PLATFORM_ID);

  chartOutput = viewChild.required<ElementRef<HTMLDivElement>>('chartOutput');

  initialCode = `graph TD
    A[Start] --> B{Is it responsive?};
    B -- Yes --> C[Looks great on mobile!];
    B -- No --> D[Add Tailwind classes];
    C --> E[Finish Project];
    D -- Refactor --> B;
    E --> F(Celebrate 🎉);`;

  mermaidCode = signal<string>(this.initialCode);
  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  private debounceTimer: any;

  constructor() {
    effect(() => {
      const code = this.mermaidCode();
      const outputElement = this.chartOutput()?.nativeElement;

      if (outputElement && isPlatformBrowser(this.platformId)) {
        clearTimeout(this.debounceTimer);
        this.isLoading.set(true);
        this.errorMessage.set(null);

        this.debounceTimer = setTimeout(async () => {
          if (!code.trim()) {
            outputElement.innerHTML = '<p class="text-slate-400 text-center p-8">Your chart will appear here.</p>';
            this.isLoading.set(false);
            return;
          }
          try {
            const svg = await this.mermaidService.render(code);
            outputElement.innerHTML = svg;
            this.errorMessage.set(null);
          } catch (e: any) {
            const friendlyMessage = this.parseMermaidError(e);
            this.errorMessage.set(friendlyMessage);
            outputElement.innerHTML = '';
          } finally {
            this.isLoading.set(false);
          }
        }, 400);
      }
    }, { allowSignalWrites: true });
  }

  onCodeChange(event: Event): void {
    const newCode = (event.target as HTMLTextAreaElement).value;
    this.mermaidCode.set(newCode);
  }

  private parseMermaidError(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.str) return error.str;
    return 'An unknown error occurred while parsing the Mermaid syntax.';
  }
}
