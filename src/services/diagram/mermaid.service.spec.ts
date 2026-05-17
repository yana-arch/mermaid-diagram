
import { TestBed } from '@angular/core/testing';
import { MermaidService } from './mermaid.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import mermaid from 'mermaid';

// Mock mermaid
vi.mock('mermaid', () => {
  return {
    default: {
      initialize: vi.fn(),
      render: vi.fn().mockResolvedValue({ svg: '<svg>mock</svg>' })
    }
  };
});

describe('MermaidService', () => {
  let service: MermaidService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MermaidService]
    });
    service = TestBed.inject(MermaidService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty string if code is empty', async () => {
    const result = await service.render('', 'default');
    expect(result).toBe('');
  });

  it('should render SVG successfully', async () => {
    const code = 'graph TD\nA-->B';
    const svg = await service.render(code, 'dark');
    expect(mermaid.render).toHaveBeenCalled();
    expect(svg).toBe('<svg>mock</svg>');
  });

  it('should handle mermaid errors correctly', async () => {
    // Force mermaid.render to reject
    vi.mocked(mermaid.render).mockRejectedValueOnce(new Error('Syntax error line 1'));
    
    await expect(service.render('invalid code', 'default')).rejects.toThrow('Syntax error line 1');
  });

  it('should get theme config correctly', () => {
     // Accessing private method
     const cyberpunk = (service as any).getThemeConfig('cyberpunk');
     expect(cyberpunk.baseTheme).toBe('dark');
     expect(cyberpunk.variables.primaryColor).toBe('#ff00ff');
     
     const ocean = (service as any).getThemeConfig('ocean');
     expect(ocean.baseTheme).toBe('base');
     
     const fallback = (service as any).getThemeConfig('unknown');
     expect(fallback.baseTheme).toBe('unknown');
  });
});
