
import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const THEMES = ['default', 'neutral', 'dark', 'forest', 'cyberpunk', 'ocean', 'sunset', 'minimal'] as const;
export type Theme = (typeof THEMES)[number];
export type AiMode = 'generate' | 'refine';
export type MobileTab = 'editor' | 'preview';

export interface AiConfig {
  apiKey: string;
  useCustomUrl: boolean;
  customUrl: string;
  model: string;
  thinkingBudget: number; // 0 = disabled
  apiVersion: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  code: string;
  label?: string;
}

const INITIAL_CODE = `graph TD
    A[Start] --> B{Is it responsive?};
    B -- Yes --> C[Looks great on mobile!];
    B -- No --> D[Add Tailwind classes];
    C --> E[Finish Project];
    D -- Refactor --> B;
    E --> F(Celebrate 🎉);`;

const DEFAULT_AI_CONFIG: AiConfig = {
  apiKey: '', // Empty by default, user must provide
  useCustomUrl: false,
  customUrl: '',
  model: 'gemini-2.5-flash',
  thinkingBudget: 0, // Default to disabled for speed
  apiVersion: 'v1beta'
};

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  private readonly platformId = inject(PLATFORM_ID);

  // State Signals
  readonly mermaidCode = signal<string>(INITIAL_CODE);
  readonly theme = signal<Theme>('default');
  
  // UI State
  readonly mobileTab = signal<MobileTab>('editor');

  // AI Config
  readonly aiConfig = signal<AiConfig>(DEFAULT_AI_CONFIG);

  // History State
  readonly history = signal<HistoryItem[]>([]);
  readonly isHistoryModalOpen = signal(false);

  // Modal State Signals
  readonly isAiModalOpen = signal(false);
  readonly aiModalMode = signal<AiMode>('generate');
  
  readonly isExampleModalOpen = signal(false);
  readonly isExportModalOpen = signal(false);
  readonly isSettingsModalOpen = signal(false);

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

      const savedAiConfig = localStorage.getItem('mermaidAiConfig');
      if (savedAiConfig) {
        try {
          // Merge with default to ensure new fields (thinkingBudget) exist
          this.aiConfig.set({ ...DEFAULT_AI_CONFIG, ...JSON.parse(savedAiConfig) });
        } catch (e) {
          console.error('Failed to parse AI config', e);
        }
      }

      const savedHistory = localStorage.getItem('mermaidHistory');
      if (savedHistory) {
        try {
          this.history.set(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse history', e);
        }
      } else {
        // Try to check if env var is available (in some build setups)
        // Check if process is defined (Node.js/Build time) before accessing it
        try {
          if (typeof process !== 'undefined' && process.env) {
            const envKey = process.env['API_KEY'];
            const envUrl = process.env['CUSTOM_URL'];
            const envModel = process.env['AI_MODEL'];
            const envApiVersion = process.env['AI_API_VERSION'];
            
            this.aiConfig.update(c => ({ 
                ...c, 
                apiKey: envKey || c.apiKey,
                customUrl: envUrl || c.customUrl,
                useCustomUrl: !!envUrl || c.useCustomUrl,
                model: envModel || c.model,
                apiVersion: envApiVersion || c.apiVersion
            }));
          }
        } catch (e) {
          // Ignore ReferenceError if process is not defined
        }
      }

      // Persist changes
      effect(() => {
        localStorage.setItem('mermaidCode', this.mermaidCode());
        localStorage.setItem('mermaidTheme', this.theme());
        localStorage.setItem('mermaidAiConfig', JSON.stringify(this.aiConfig()));
        localStorage.setItem('mermaidHistory', JSON.stringify(this.history()));
      });
    }
  }

  addToHistory(label?: string) {
    const code = this.mermaidCode();
    if (!code.trim()) return;

    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      code,
      label: label || `Snapshot ${new Date().toLocaleTimeString()}`
    };

    this.history.update(h => [newItem, ...h]);
  }

  deleteFromHistory(id: string) {
    this.history.update(h => h.filter(item => item.id !== id));
  }

  loadFromHistory(item: HistoryItem) {
    this.setCode(item.code);
    this.isHistoryModalOpen.set(false);
  }

  openAiModal(mode: AiMode) {
    this.aiModalMode.set(mode);
    this.isAiModalOpen.set(true);
  }

  setCode(code: string) {
    this.mermaidCode.set(code);
  }

  setTheme(theme: Theme) {
    this.theme.set(theme);
  }

  setMobileTab(tab: MobileTab) {
    this.mobileTab.set(tab);
  }
  
  updateAiConfig(config: Partial<AiConfig>) {
    this.aiConfig.update(current => ({ ...current, ...config }));
  }
}
