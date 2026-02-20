
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

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  
  constructor() {}

  async generateMermaidCode(input: AiInputData, config: AiRequestConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error('API Key is missing. Please configure it in Settings.');
    }

    // DEBUGGING: Log the configuration being used
    console.log('[GeminiService] Initializing request:', {
      model: config.model,
      hasApiKey: !!config.apiKey,
      baseUrl: config.baseUrl ? config.baseUrl : '(Default Google Endpoint)',
      thinkingBudget: config.thinkingBudget
    });

    const systemInstruction = this.getSystemInstruction(input.contextCode);

    try {
      const parts: any[] = [{ text: input.prompt }];

      if (input.media) {
        parts.push({
          inlineData: {
            mimeType: input.media.mimeType,
            data: input.media.data
          }
        });
      }

      // Prepare configuration
      const generationConfig: any = {
        temperature: 0.2,
      };

      // Handle Thinking Config (Only for supported models like gemini-2.5-flash)
      if (config.model.includes('gemini-2.5-flash') && config.thinkingBudget && config.thinkingBudget > 0) {
         generationConfig.thinkingConfig = { thinkingBudget: config.thinkingBudget };
      }

      // USE FETCH FOR CUSTOM URL (Bypass SDK)
      if (config.useCustomUrl && config.baseUrl && config.baseUrl.trim().length > 0) {
          return this.retry(() => this.generateWithFetch(config, systemInstruction, parts, generationConfig));
      }

      // USE SDK FOR STANDARD CALLS
      const clientOptions: any = { 
        apiKey: config.apiKey
      };
      
      if (config.apiVersion) {
        clientOptions.apiVersion = config.apiVersion;
      }

      const ai = new GoogleGenAI(clientOptions);

      const response = await this.retry(async () => {
        const result = await ai.models.generateContent({
          model: config.model || 'gemini-2.5-flash',
          contents: [{ parts }],
          config: {
              ...generationConfig,
              systemInstruction: systemInstruction
          }
        });
        return result;
      });

      const rawText = response.text || '';
      return this.cleanResponse(rawText);
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      throw new Error(error.message || 'Failed to generate diagram from AI.');
    }
  }

  private getSystemInstruction(contextCode?: string): string {
    let instruction = `
      You are an expert in Mermaid.js diagramming syntax.
      Your task is to generate or update Mermaid.js code based on the user's request.
      
      Rules:
      1. Return ONLY the code. Do not include markdown code fences (like \`\`\`mermaid).
      2. Do not include explanations or conversational text.
      3. Ensure syntax is valid and error-free.
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
    } catch (error: any) {
      const status = error.status || error.response?.status;
      if (retries > 0 && (status === 429 || status >= 500 || error.message?.includes('fetch failed'))) {
        console.warn(`[GeminiService] Retrying... (${retries} left)`);
        await new Promise(res => setTimeout(res, delay));
        return this.retry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  private async generateWithFetch(config: AiRequestConfig, systemInstruction: string, parts: any[], generationConfig: any): Promise<string> {
      const apiVersion = config.apiVersion || 'v1beta';
      // Strip trailing slash from baseUrl
      const baseUrl = config.baseUrl!.replace(/\/$/, '');
      const url = `${baseUrl}/${apiVersion}/models/${config.model}:generateContent`;
      
      const body = {
        contents: [{
            role: 'user',
            parts: parts
        }],
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        },
        generationConfig: generationConfig
      };

      console.log('[GeminiService] Custom Fetch URL:', url);

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
      } catch (e: any) {
          console.error('Custom API Fetch Error', e);
          throw new Error(e.message || 'Failed to generate with custom URL');
      }
  }

  async listModels(config: AiRequestConfig): Promise<AiModelInfo[]> {
      let baseUrl = config.useCustomUrl && config.baseUrl ? config.baseUrl : 'https://generativelanguage.googleapis.com';
      
      const apiVersion = config.apiVersion || 'v1beta';
      baseUrl = baseUrl.replace(/\/$/, '');
      const url = `${baseUrl}/${apiVersion}/models?key=${config.apiKey}`;
      
      try {
          console.log('[GeminiService] Fetching models from:', url);
          // Use fetch without custom headers for Google API to avoid CORS preflight issues
          const headers: any = { 'Content-Type': 'application/json' };
          
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
              models = data.models
                  .filter((m: any) => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'))
                  .map((m: any) => {
                      const id = m.name.replace(/^models\//, '');
                      return {
                          id: id,
                          displayName: m.displayName ? `${m.displayName} (${id})` : id
                      };
                  });
          } 
          // OpenAI / Generic format: { data: [{ id: 'gemini-pro' }] }
          else if (data.data && Array.isArray(data.data)) {
              models = data.data.map((m: any) => ({
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
    clean = clean.replace(/^```(mermaid)?/i, '').replace(/```$/, '');
    return clean.trim();
  }
}
