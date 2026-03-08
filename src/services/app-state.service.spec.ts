import { jest, expect, describe, it, beforeEach } from '@jest/globals';
import { TestBed } from '@angular/core/testing';
import { AppStateService, AiMode, MobileTab } from './app-state.service';
import { PLATFORM_ID } from '@angular/core';

describe('AppStateService', () => {
  let service: AppStateService;

  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
      clear: jest.fn(() => { for (const key in store) delete store[key]; })
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage
    });

    TestBed.configureTestingModule({
      providers: [
        AppStateService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(AppStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default state', () => {
    expect(service.theme()).toBe('default');
    expect(service.mobileTab()).toBe('editor');
    expect(service.history()).toEqual([]);
  });

  it('should set code', () => {
    const newCode = 'graph TD;\nA-->B;';
    service.setCode(newCode);
    expect(service.mermaidCode()).toBe(newCode);
  });

  it('should set theme', () => {
    service.setTheme('dark');
    expect(service.theme()).toBe('dark');
  });

  it('should set mobile tab', () => {
    service.setMobileTab('preview');
    expect(service.mobileTab()).toBe('preview');
  });

  it('should update AI config', () => {
    service.updateAiConfig({ model: 'test-model' });
    expect(service.aiConfig().model).toBe('test-model');
  });

  it('should add to history', () => {
    service.setCode('graph TD;\nA-->B;');
    service.addToHistory('Test label');
    
    const history = service.history();
    expect(history.length).toBe(1);
    expect(history[0].code).toBe('graph TD;\nA-->B;');
    expect(history[0].label).toBe('Test label');
  });
});
