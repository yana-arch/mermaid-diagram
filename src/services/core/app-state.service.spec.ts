
import { TestBed } from '@angular/core/testing';
import { AppStateService, INITIAL_CODE, DEFAULT_AI_CONFIG } from './app-state.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AppStateService', () => {
  let service: AppStateService;

  beforeEach(() => {
    // Mock localStorage
    const storageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString();
        },
        clear: () => {
          store = {};
        },
        removeItem: (key: string) => {
          delete store[key];
        },
      };
    })();
    
    vi.stubGlobal('localStorage', storageMock);

    TestBed.configureTestingModule({
      providers: [AppStateService]
    });
    service = TestBed.inject(AppStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial code', () => {
    expect(service.mermaidCode()).toBe(INITIAL_CODE);
  });

  it('should update code', () => {
    const newCode = 'graph LR\nA-->B';
    service.setCode(newCode);
    expect(service.mermaidCode()).toBe(newCode);
  });

  it('should toggle AI modal', () => {
    expect(service.isAiModalOpen()).toBe(false);
    service.openAiModal('generate');
    expect(service.isAiModalOpen()).toBe(true);
    expect(service.aiModalMode()).toBe('generate');
    
    service.closeAllModals();
    expect(service.isAiModalOpen()).toBe(false);
  });

  it('should add to history', () => {
    const code = 'graph LR\nA-->B';
    service.setCode(code);
    service.addToHistory('Test Snapshot');
    
    const history = service.history();
    expect(history.length).toBe(1);
    expect(history[0].code).toBe(code);
    expect(history[0].label).toBe('Test Snapshot');
  });

  it('should delete from history', () => {
    service.setCode('test code');
    service.addToHistory('Test');
    const id = service.history()[0].id;
    
    service.deleteFromHistory(id);
    expect(service.history().length).toBe(0);
  });

  it('should update AI config', () => {
    const newConfig = { apiKey: 'test-key', model: 'test-model' };
    service.updateAiConfig(newConfig);
    
    const currentConfig = service.aiConfig();
    expect(currentConfig.apiKey).toBe('test-key');
    expect(currentConfig.model).toBe('test-model');
    // Ensure other fields are preserved
    expect(currentConfig.apiVersion).toBe(DEFAULT_AI_CONFIG.apiVersion);
  });
});
