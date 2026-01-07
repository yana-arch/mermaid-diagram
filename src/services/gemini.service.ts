
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

    try {
      let systemInstruction = `
        You are an expert in Mermaid.js diagramming syntax.
        Your task is to generate or update Mermaid.js code based on the user's request.
        
        Rules:
        1. Return ONLY the code. Do not include markdown code fences (like \`\`\`mermaid).
        2. Do not include explanations or conversational text.
        3. Ensure syntax is valid and error-free.
      `;

      if (input.contextCode) {
        systemInstruction += `
        
        CONTEXT - EXISTING CODE:
        The user wants to MODIFY the following existing code:
        ----------------
        ${input.contextCode}
        ----------------
        
        Perform the requested changes to this specific code. Keep the existing structure unless asked to change it.
        `;
      } else {
        systemInstruction += `
        If the user provides code (Python, Java, etc.), analyze logic and generate a relevant diagram.
        If the user provides an image/PDF, analyze visual structure and replicate it in Mermaid.
        `;
      }

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
          return this.generateWithFetch(config, systemInstruction, parts, generationConfig);
      }

      // USE SDK FOR STANDARD CALLS
      const clientOptions: any = { 
        apiKey: config.apiKey
      };
      
      if (config.apiVersion) {
        clientOptions.apiVersion = config.apiVersion;
      }

      const ai = new GoogleGenAI(clientOptions);

      const response = await ai.models.generateContent({
        model: config.model || 'gemini-2.5-flash',
        contents: [{ parts }],
        config: {
            ...generationConfig,
            systemInstruction: systemInstruction
        }
      });

      const rawText = response.text || '';
      return this.cleanResponse(rawText);
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      throw new Error(error.message || 'Failed to generate diagram from AI.');
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

  async listModels(config: AiRequestConfig): Promise<string[]> {
      if (!config.useCustomUrl || !config.baseUrl) {
          return [];
      }
      
      const apiVersion = config.apiVersion || 'v1beta';
      const baseUrl = config.baseUrl.replace(/\/$/, '');
      const url = `${baseUrl}/${apiVersion}/models?key=${config.apiKey}`;
      
      try {
          console.log('[GeminiService] Fetching models from:', url);
          const response = await fetch(url, {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json',
                  'x-goog-api-key': config.apiKey
              }
          });
          
          if (!response.ok) {
              console.warn('Failed to fetch models:', response.statusText);
              return [];
          }
          
          const data = await response.json();
          let models: string[] = [];

          // Google format: { models: [{ name: 'models/gemini-pro' }] }
          if (data.models && Array.isArray(data.models)) {
              models = data.models.map((m: any) => m.name.replace(/^models\//, ''));
          } 
          // OpenAI / Generic format: { data: [{ id: 'gemini-pro' }] }
          else if (data.data && Array.isArray(data.data)) {
              models = data.data.map((m: any) => m.id);
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
