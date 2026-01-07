
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
  baseUrl?: string;
  model: string;
  thinkingBudget?: number;
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
      // Initialize client with request-specific config
      const clientOptions: any = { 
        apiKey: config.apiKey
      };
      
      if (config.baseUrl && config.baseUrl.trim().length > 0) {
        // Strip trailing slash to avoid double slash issues (e.g. proxy.com/ + /v1/...)
        clientOptions.baseUrl = config.baseUrl.replace(/\/$/, '');
      }

      const ai = new GoogleGenAI(clientOptions);

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
        systemInstruction: systemInstruction,
        temperature: 0.2,
      };

      // Handle Thinking Config (Only for supported models like gemini-2.5-flash)
      if (config.model.includes('gemini-2.5-flash') && config.thinkingBudget && config.thinkingBudget > 0) {
         generationConfig.thinkingConfig = { thinkingBudget: config.thinkingBudget };
      }

      const response = await ai.models.generateContent({
        model: config.model || 'gemini-2.5-flash',
        contents: [{ parts }],
        config: generationConfig
      });

      const rawText = response.text || '';
      return this.cleanResponse(rawText);
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      throw new Error(error.message || 'Failed to generate diagram from AI.');
    }
  }

  private cleanResponse(text: string): string {
    let clean = text.trim();
    clean = clean.replace(/^```(mermaid)?/i, '').replace(/```$/, '');
    return clean.trim();
  }
}
