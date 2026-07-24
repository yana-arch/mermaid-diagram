
import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ModalService } from './modal.service';
import { INITIAL_CODE as INITIAL_CODE } from '../../data/initial-code';

const THEMES = ['default', 'neutral', 'dark', 'forest', 'cyberpunk', 'ocean', 'sunset', 'minimal'] as const;
export type Theme = (typeof THEMES)[number];
export type AiMode = 'generate' | 'refine';
export type MobileTab = 'editor' | 'preview';

/** Soft cap to avoid unbounded localStorage growth. */
export const MAX_HISTORY_ITEMS = 50;

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

export { INITIAL_CODE } from '../../data/initial-code';

export const DEFAULT_AI_CONFIG: AiConfig = {
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
  private readonly modalService = inject(ModalService);

  // State Signals
  readonly mermaidCode = signal<string>(INITIAL_CODE);
  readonly theme = signal<Theme>('default');
  readonly proposedCode = signal<string | null>(null);

  // UI State
  readonly mobileTab = signal<MobileTab>('editor');

  // AI Config
  readonly aiConfig = signal<AiConfig>(DEFAULT_AI_CONFIG);

  // History State
  readonly history = signal<HistoryItem[]>([]);
  readonly isHistoryModalOpen = this.modalService.isHistoryOpen;

  // Modal State Signals
  readonly isAiModalOpen = this.modalService.isAiOpen;
  readonly aiModalMode = signal<AiMode>('generate');

  /** True when any modal/panel is currently open. */
  readonly isAnyModalOpen = this.modalService.isAnyModalOpen;

  readonly isExampleModalOpen = this.modalService.isExampleOpen;
  readonly isExportModalOpen = this.modalService.isExportOpen;
  readonly isSettingsModalOpen = this.modalService.isSettingsOpen;

  // Status Signals
  readonly isRendering = signal(false);
  readonly renderError = signal<string | null>(null);
  /** Transient toast for save/export feedback (null = hidden). */
  readonly statusMessage = signal<string | null>(null);

  readonly themes = THEMES;

  private statusTimer: ReturnType<typeof setTimeout> | null = null;

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
      } else {
        // Seed from build-time env only when no saved config exists
        this.seedAiConfigFromEnv();
      }

      const savedHistory = localStorage.getItem('mermaidHistory');
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed)) {
            this.history.set(parsed.slice(0, MAX_HISTORY_ITEMS));
          }
        } catch (e) {
          console.error('Failed to parse history', e);
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

  private seedAiConfigFromEnv(): void {
    try {
      if (typeof process !== 'undefined' && process.env) {
        const envKey = process.env['API_KEY'] || process.env['GEMINI_API_KEY'];
        const envUrl = process.env['CUSTOM_URL'];
        const envModel = process.env['AI_MODEL'];
        const envApiVersion = process.env['AI_API_VERSION'];

        if (envKey || envUrl || envModel || envApiVersion) {
          this.aiConfig.update(c => ({
            ...c,
            apiKey: envKey || c.apiKey,
            customUrl: envUrl || c.customUrl,
            useCustomUrl: !!envUrl || c.useCustomUrl,
            model: envModel || c.model,
            apiVersion: envApiVersion || c.apiVersion
          }));
        }
      }
    } catch {
      // Ignore if process is not defined (browser)
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

    this.history.update(h => [newItem, ...h].slice(0, MAX_HISTORY_ITEMS));
    this.showStatus('Saved to history');
  }

  deleteFromHistory(id: string) {
    this.history.update(h => h.filter(item => item.id !== id));
  }

  loadFromHistory(item: HistoryItem) {
    this.setCode(item.code);
    this.modalService.close();
  }

  openAiModal(mode: AiMode) {
    this.aiModalMode.set(mode);
    this.modalService.open('ai');
  }

  openSettingsModal() {
    this.modalService.open('settings');
  }

  openHistoryModal() {
    this.modalService.open('history');
  }

  openExampleModal() {
    this.modalService.open('example');
  }

  openExportModal() {
    this.modalService.open('export');
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

  /**
   * Closes active modal/panel only. Does NOT clear AI proposals —
   * proposals persist until accept/discard so users can review diffs.
   */
  closeAllModals() {
    this.modalService.close();
  }

  /** Explicitly discard a pending AI proposal. */
  discardProposal() {
    this.proposedCode.set(null);
  }

  /** Apply a pending AI proposal into the editor. */
  acceptProposal() {
    const proposal = this.proposedCode();
    if (proposal !== null) {
      this.setCode(proposal);
      this.proposedCode.set(null);
      this.showStatus('AI proposal applied');
    }
  }

  /**
   * After AI generates a proposal: store code, focus editor (mobile),
   * keep copilot open so user can refine further if needed.
   */
  setProposal(code: string) {
    this.proposedCode.set(code);
    this.setMobileTab('editor');
  }

  updateAiConfig(config: Partial<AiConfig>) {
    this.aiConfig.update(current => ({ ...current, ...config }));
  }

  showStatus(message: string, durationMs = 2200) {
    this.statusMessage.set(message);
    if (this.statusTimer) clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(() => {
      this.statusMessage.set(null);
      this.statusTimer = null;
    }, durationMs);
  }
}
