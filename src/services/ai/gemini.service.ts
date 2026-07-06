
import { Injectable } from '@angular/core';
import { GoogleGenAI } from "@google/genai";

export interface AiInputData {
  prompt: string; 
  contextCode?: string; 
  media?: {
    mimeType: string;
    data: string;
  };
}

export interface AiRequestConfig {
  apiKey: string;
  useCustomUrl?: boolean;
  baseUrl?: string;
  model: string;
  thinkingBudget?: number;
  apiVersion?: string;
}

export interface AiModelInfo {
  id: string;
  displayName: string;
}

export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GeminiContent {
  role?: string;
  parts: GeminiPart[];
}

export interface GeminiGenerationConfig {
  temperature?: number;
  thinkingConfig?: {
    thinkingBudget: number;
  };
}

export interface GeminiGenerateContentRequest {
  model?: string;
  contents: GeminiContent[];
  systemInstruction?: string | { parts: GeminiPart[] };
  generationConfig?: GeminiGenerationConfig;
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  
  constructor() {}

  /**
   * Generates Mermaid diagram code from a natural language prompt using Google Gemini.
   *
   * Supports both direct Google API calls and custom proxy URLs.
   * Includes retry logic with exponential backoff for transient failures.
   *
   * @param input - The prompt, optional context code, and optional media input
   * @param config - API configuration including key, model, and optional custom endpoint
   * @returns Generated Mermaid diagram code as a string
   * @throws Error if API key is missing or generation fails after retries
   */
  async generateMermaidCode(input: AiInputData, config: AiRequestConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error('API Key is missing. Please configure it in Settings.');
    }

    const systemInstruction = this.getSystemInstruction(input.contextCode);
    const parts: GeminiPart[] = [{ text: input.prompt }];

    if (input.media) {
      parts.push({
        inlineData: {
          mimeType: input.media.mimeType,
          data: input.media.data
        }
      });
    }

    // Prepare configuration
    const generationConfig: GeminiGenerationConfig = {
      temperature: 0.2,
    };

    // Handle Thinking Config (Only for supported models like gemini-2.0-flash-thinking-exp-1219)
    if (config.model.includes('thinking') && config.thinkingBudget && config.thinkingBudget > 0) {
        generationConfig.thinkingConfig = { thinkingBudget: config.thinkingBudget };
    }

    try {
      if (config.useCustomUrl && config.baseUrl && config.baseUrl.trim().length > 0) {
          return await this.retry(() => this.generateWithFetch(config, systemInstruction, parts, generationConfig));
      }

      return await this.retry(() => this.generateWithSdk(config, systemInstruction, parts, generationConfig));
    } catch (error: unknown) {
      console.error('Gemini API Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate diagram from AI.';
      throw new Error(errorMessage);
    }
  }

  private async generateWithSdk(config: AiRequestConfig, systemInstruction: string, parts: GeminiPart[], generationConfig: GeminiGenerationConfig): Promise<string> {
    const ai = new GoogleGenAI({
        apiKey: config.apiKey
    });

    const result = await ai.models.generateContent({
      model: config.model || 'gemini-1.5-flash',
      contents: [{ role: 'user', parts }],
      config: {
        ...generationConfig,
        systemInstruction: systemInstruction
      }
    });

    const text = result.text || '';
    return this.cleanResponse(text);
  }

  private getSystemInstruction(contextCode?: string): string {
    let instruction = `
      You are an expert in Mermaid.js (v11.12.3) diagramming syntax.
      Your task is to generate or update valid, clean, and error-free Mermaid.js code based on the user's request.
      
      CRITICAL RULES FOR SYNTAX STABILITY (Mermaid v11.12.3):
      1. Return ONLY the raw code. Do not include markdown code fences (like \`\`\`mermaid or \`\`\`), HTML tags, or conversational/explanation texts.
      2. Ensure syntax is fully valid and error-free.
      3. Flowchart Syntax:
         - Always use the 'flowchart' keyword (e.g., flowchart TD, flowchart LR) instead of the obsolete 'graph' keyword.
         - Node IDs: Use simple alphanumeric/underscore strings (e.g., node1, step_A). Never use spaces or special characters in Node IDs.
         - Node Labels: If a label contains spaces, brackets [], parentheses (), curly braces {}, quotes, mathematical symbols, or punctuation, you MUST wrap the entire label in double quotes (e.g., node1["Label with (text) and [brackets]"]).
         - Escaping Characters: Do not use raw # or ; inside labels. Use HTML entity code '#35;' for # and '#59;' for ;. If double quotes are needed inside double-quoted labels, escape them with '#quot;'.
         - Reserved Keywords: Do not use keywords like 'end', 'subgraph', 'style', 'click' as Node IDs. If 'end' or other keywords are needed inside a label, capitalize them (e.g., END) or enclose the label in double quotes (e.g., node2["end"]).
         - Arrows and Connections: Ensure arrows are standard (e.g., -->, ---, -.->, ==>). In flowcharts, keep spaces around connectors to avoid ambiguity (e.g., 'A --- o B' instead of 'A---oB', as characters like 'o' or 'x' touching lines can break rendering).
      4. Subgraphs: Ensure every 'subgraph' has a unique ID and is explicitly closed with 'end'.
    `;

    if (contextCode) {
      instruction += `
      
      CONTEXT - EXISTING CODE:
      The user wants to MODIFY the following existing code:
      ----------------
      ${contextCode}
      ----------------
      
      Perform the requested changes to this specific code. Keep the existing structure unless asked to change it.
      `;
    } else {
      instruction += `
      If the user provides code (Python, Java, etc.), analyze logic and generate a relevant diagram.
      If the user provides an image/PDF, analyze visual structure and replicate it in Mermaid.
      `;
    }
    return instruction;
  }

  private async retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error: unknown) {
      const err = error as { status?: number; response?: { status?: number }; message?: string };
      const status = err.status || err.response?.status;
      if (retries > 0 && (status === 429 || status >= 500 || err.message?.includes('fetch failed'))) {
        console.warn(`[GeminiService] Retrying... (${retries} left)`);
        await new Promise(res => setTimeout(res, delay));
        return this.retry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  private async generateWithFetch(config: AiRequestConfig, systemInstruction: string, parts: GeminiPart[], generationConfig: GeminiGenerationConfig): Promise<string> {
      const apiVersion = config.apiVersion || 'v1beta';
      // Strip trailing slash from baseUrl
      const baseUrl = config.baseUrl!.replace(/\/$/, '');
      const url = `${baseUrl}/${apiVersion}/models/${config.model}:generateContent`;

      const body: GeminiGenerateContentRequest = {
        contents: [{
            role: 'user',
            parts: parts
        }],
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        },
        generationConfig: generationConfig
      };

      try {
          const response = await fetch(url, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'x-goog-api-key': config.apiKey
              },
              body: JSON.stringify(body)
          });

          if (!response.ok) {
              const errorText = await response.text();
              console.error('Fetch error body:', errorText);
              throw new Error(`API Error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          // Extract text from candidates
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return this.cleanResponse(text);
      } catch (e: unknown) {
          console.error('Custom API Fetch Error', e);
          const message = e instanceof Error ? e.message : 'Failed to generate with custom URL';
          throw new Error(message);
      }
  }

  /**
   * Lists available Gemini models from the API or custom endpoint.
   *
   * Fetches the list of models that can be used for diagram generation.
   * Handles both direct Google API and custom proxy configurations.
   *
   * @param config - API configuration including key and optional custom endpoint
   * @returns Array of model information objects with id and displayName
   */
  async listModels(config: AiRequestConfig): Promise<AiModelInfo[]> {
      let baseUrl = config.useCustomUrl && config.baseUrl ? config.baseUrl : 'https://generativelanguage.googleapis.com';

      const apiVersion = config.apiVersion || 'v1beta';
      baseUrl = baseUrl.replace(/\/$/, '');
      const url = `${baseUrl}/${apiVersion}/models?key=${config.apiKey}`;

      try {
          // Use fetch without custom headers for Google API to avoid CORS preflight issues
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };

          // Only add API key header if using a custom proxy that might require it (not Google directly)
          if (config.useCustomUrl) {
              headers['x-goog-api-key'] = config.apiKey;
          } else {
              // For direct Google calls, the key is in the URL.
              // We remove Content-Type to make it a "simple request" if possible,
              // but keeping it is usually fine for GET.
              delete headers['Content-Type'];
          }

          const response = await fetch(url, {
              method: 'GET',
              headers: Object.keys(headers).length > 0 ? headers : undefined
          });

          if (!response.ok) {
              console.warn('Failed to fetch models:', response.statusText);
              return [];
          }

          const data = await response.json();
          let models: AiModelInfo[] = [];

          // Google format: { models: [{ name: 'models/gemini-pro' }] }
          if (data.models && Array.isArray(data.models)) {
              models = (data.models as Array<{ name: string; displayName?: string; supportedGenerationMethods?: string[] }>)
                  .filter(m => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'))
                  .map(m => {
                      const id = m.name.replace(/^models\//, '');
                      return {
                          id: id,
                          displayName: m.displayName ? `${m.displayName} (${id})` : id
                      };
                  });
          }
          // OpenAI / Generic format: { data: [{ id: 'gemini-pro' }] }
          else if (data.data && Array.isArray(data.data)) {
              models = (data.data as Array<{ id: string }>).map(m => ({
                  id: m.id,
                  displayName: m.id
              }));
          }

          return models;
      } catch (e) {
          console.error('Failed to list models', e);
          return [];
      }
  }

  private cleanResponse(text: string): string {
    let clean = text.trim();
    
    // Attempt to extract content between triple backticks (with or without 'mermaid' identifier)
    const fenceMatch = clean.match(/```(?:mermaid)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) {
      clean = fenceMatch[1];
    } else {
      // Fallback standard replacement if only starting or ending fences are present
      clean = clean.replace(/^```(mermaid)?/i, '').replace(/```$/, '');
    }
    
    // Strip HTML pre/code wrappers if the AI accidentally added them
    clean = clean.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/i, '$1');
    clean = clean.replace(/<code[^>]*>([\s\S]*?)<\/code>/i, '$1');
    
    return clean.trim();
  }
}
