
import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const THEMES = ['neutral', 'dark', 'forest', 'default'] as const;
export type Theme = (typeof THEMES)[number];

const INITIAL_CODE = `graph TD
    A[Start] --> B{Is it responsive?};
    B -- Yes --> C[Looks great on mobile!];
    B -- No --> D[Add Tailwind classes];
    C --> E[Finish Project];
    D -- Refactor --> B;
    E --> F(Celebrate 🎉);`;

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  private readonly platformId = inject(PLATFORM_ID);

  // State Signals
  readonly mermaidCode = signal<string>(INITIAL_CODE);
  readonly theme = signal<Theme>('neutral');
  
  // Modal State Signals
  readonly isAiModalOpen = signal(false);
  readonly isExampleModalOpen = signal(false);
  readonly isExportModalOpen = signal(false);

  // Status Signals
  readonly isRendering = signal(false);
  readonly renderError = signal<string | null>(null);

  readonly themes = THEMES;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedCode = localStorage.getItem('mermaidCode');
      if (savedCode) this.mermaidCode.set(savedCode);

      const savedTheme = localStorage.getItem('mermaidTheme') as Theme;
      if (savedTheme && THEMES.includes(savedTheme)) {
        this.theme.set(savedTheme);
      }

      // Persist changes
      effect(() => {
        localStorage.setItem('mermaidCode', this.mermaidCode());
        localStorage.setItem('mermaidTheme', this.theme());
      });
    }
  }

  setCode(code: string) {
    this.mermaidCode.set(code);
  }

  setTheme(theme: Theme) {
    this.theme.set(theme);
  }
}
