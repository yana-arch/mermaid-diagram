
import { TestBed } from '@angular/core/testing';
import { GeminiService, AiInputData, AiRequestConfig } from './gemini.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the GoogleGenAI SDK
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: 'graph LR\nA-->B'
          })
        }
      };
    })
  };
});

describe('GeminiService', () => {
  let service: GeminiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GeminiService]
    });
    service = TestBed.inject(GeminiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should clean response by removing code fences', () => {
    // Accessing private method for testing logic
    const rawResponse = '```mermaid\ngraph TD\n  A-->B\n```';
    const cleaned = (service as any).cleanResponse(rawResponse);
    expect(cleaned).toBe('graph TD\n  A-->B');
    
    const rawResponseNoMermaid = '```\ngraph TD\n  A-->B\n```';
    const cleaned2 = (service as any).cleanResponse(rawResponseNoMermaid);
    expect(cleaned2).toBe('graph TD\n  A-->B');

    // Test with conversational padding before/after
    const paddedResponse = 'Here is the diagram:\n```mermaid\nflowchart LR\n  X --> Y\n```\nHope this helps!';
    const cleanedPadded = (service as any).cleanResponse(paddedResponse);
    expect(cleanedPadded).toBe('flowchart LR\n  X --> Y');

    // Test with HTML code/pre wrappers
    const htmlResponse = '<pre><code>flowchart TD\n  1 --> 2</code></pre>';
    const cleanedHtml = (service as any).cleanResponse(htmlResponse);
    expect(cleanedHtml).toBe('flowchart TD\n  1 --> 2');
  });

  it('should throw error if API key is missing', async () => {
    const input: AiInputData = { prompt: 'test' };
    const config: AiRequestConfig = { apiKey: '', model: 'test' };
    
    await expect(service.generateMermaidCode(input, config)).rejects.toThrow('API Key is missing');
  });

  it('should generate system instruction correctly with context', () => {
    const contextCode = 'graph TD\n  A-->B';
    const instruction = (service as any).getSystemInstruction(contextCode);
    expect(instruction).toContain('MODIFY');
    expect(instruction).toContain(contextCode);
  });

  it('should generate system instruction correctly without context', () => {
    const instruction = (service as any).getSystemInstruction();
    expect(instruction).toContain('expert in Mermaid.js');
    expect(instruction).not.toContain('MODIFY');
  });
});
