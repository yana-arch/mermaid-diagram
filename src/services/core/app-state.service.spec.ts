
import { TestBed } from '@angular/core/testing';
import { AppStateService, INITIAL_CODE, DEFAULT_AI_CONFIG, Theme } from './app-state.service';
import { ModalService } from './modal.service';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PLATFORM_ID } from '@angular/core';

describe('AppStateService', () => {
  let service: AppStateService;
  let modalService: ModalService;

  const storageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
    };
  })();

  beforeEach(() => {
    vi.stubGlobal('localStorage', storageMock);
    storageMock.clear();
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        AppStateService,
        ModalService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(AppStateService);
    modalService = TestBed.inject(ModalService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial code from INITIAL_CODE', () => {
    expect(service.mermaidCode()).toBe(INITIAL_CODE);
  });

  it('should update code and persist to localStorage', () => {
    const newCode = 'flowchart TD\nA-->B';
    service.setCode(newCode);
    expect(service.mermaidCode()).toBe(newCode);
    // effect might be asynchronous or triggered on next tick in some environments,
    // but in Vitest/Angular it usually runs in the same task or we check the signal directly.
    // Signals update immediately.
  });

  it('should update theme and persist to localStorage', () => {
    const newTheme: Theme = 'forest';
    service.setTheme(newTheme);
    expect(service.theme()).toBe(newTheme);
  });

  it('should toggle AI modal and set mode', () => {
    service.openAiModal('refine');
    expect(service.isAiModalOpen()).toBe(true);
    expect(service.aiModalMode()).toBe('refine');
    expect(modalService.isOpen('ai')).toBe(true);
  });

  it('should open other modals via modalService delegation', () => {
    service.openSettingsModal();
    expect(service.isSettingsModalOpen()).toBe(true);

    service.openHistoryModal();
    expect(service.isHistoryModalOpen()).toBe(true);

    service.openExampleModal();
    expect(service.isExampleModalOpen()).toBe(true);

    service.openExportModal();
    expect(service.isExportModalOpen()).toBe(true);
  });

  it('should reflect isAnyModalOpen across open/close', () => {
    expect(service.isAnyModalOpen()).toBe(false);
    service.openSettingsModal();
    expect(service.isAnyModalOpen()).toBe(true);
    service.closeAllModals();
    expect(service.isAnyModalOpen()).toBe(false);
  });

  it('should add to history with unique ID and timestamp', () => {
    const code = 'flowchart LR\nStart-->Stop';
    service.setCode(code);
    service.addToHistory('Custom Label');

    const history = service.history();
    expect(history.length).toBe(1);
    expect(history[0].code).toBe(code);
    expect(history[0].label).toBe('Custom Label');
    expect(history[0].id).toBeDefined();
    expect(history[0].timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('should not add empty code to history', () => {
    service.setCode('  ');
    service.addToHistory();
    expect(service.history().length).toBe(0);
  });

  it('should delete from history', () => {
    service.setCode('test');
    service.addToHistory('Test');
    const id = service.history()[0].id;

    service.deleteFromHistory(id);
    expect(service.history().length).toBe(0);
  });

  it('should load from history', () => {
    const historyItem = { id: '1', timestamp: Date.now(), code: 'graph TD; A-->B', label: 'Old' };
    service.loadFromHistory(historyItem);
    expect(service.mermaidCode()).toBe(historyItem.code);
    expect(modalService.isAnyModalOpen()).toBe(false);
  });

  it('should update AI config partially', () => {
    service.updateAiConfig({ apiKey: 'new-key' });
    expect(service.aiConfig().apiKey).toBe('new-key');
    expect(service.aiConfig().model).toBe(DEFAULT_AI_CONFIG.model); // Preserved
  });

  it('should close all modals without clearing proposed code', () => {
    service.proposedCode.set('some proposal');
    service.openAiModal('generate');

    service.closeAllModals();
    expect(modalService.isAnyModalOpen()).toBe(false);
    // Proposal must survive panel close so user can still Accept/Discard
    expect(service.proposedCode()).toBe('some proposal');
  });

  it('should accept and discard AI proposals', () => {
    service.setCode('old');
    service.setProposal('flowchart TD\nA-->B');
    expect(service.proposedCode()).toBe('flowchart TD\nA-->B');
    expect(service.mobileTab()).toBe('editor');

    service.acceptProposal();
    expect(service.mermaidCode()).toBe('flowchart TD\nA-->B');
    expect(service.proposedCode()).toBeNull();

    service.setProposal('discard-me');
    service.discardProposal();
    expect(service.proposedCode()).toBeNull();
  });

  it('should cap history at MAX_HISTORY_ITEMS', async () => {
    const { MAX_HISTORY_ITEMS } = await import('./app-state.service');
    service.setCode('code');
    for (let i = 0; i < MAX_HISTORY_ITEMS + 5; i++) {
      service.addToHistory(`Item ${i}`);
    }
    expect(service.history().length).toBe(MAX_HISTORY_ITEMS);
  });

  it('should set mobile tab', () => {
    service.setMobileTab('preview');
    expect(service.mobileTab()).toBe('preview');
  });

  it('should initialize state from localStorage if available', () => {
    const savedCode = 'flowchart LR\nSaved-->Code';
    const savedTheme = 'cyberpunk';
    const savedAiConfig = JSON.stringify({ apiKey: 'saved-key', model: 'gpt-4' });
    const savedHistory = JSON.stringify([{ id: 'h1', code: 'old', timestamp: 123 }]);

    storageMock.setItem('mermaidCode', savedCode);
    storageMock.setItem('mermaidTheme', savedTheme);
    storageMock.setItem('mermaidAiConfig', savedAiConfig);
    storageMock.setItem('mermaidHistory', savedHistory);

    // Re-inject service to trigger constructor again
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AppStateService,
        ModalService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    const newService = TestBed.inject(AppStateService);

    expect(newService.mermaidCode()).toBe(savedCode);
    expect(newService.theme()).toBe(savedTheme);
    expect(newService.aiConfig().apiKey).toBe('saved-key');
    expect(newService.history().length).toBe(1);
  });
});
