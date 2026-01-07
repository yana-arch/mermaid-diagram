
import { Injectable } from '@angular/core';
import { GoogleGenAI } from "@google/genai";

export interface AiInputData {
  prompt: string; // User instructions
  contextCode?: string; // Existing Mermaid code (for Refine/Fix mode)
  media?: {
    mimeType: string;
    data: string; // base64
  };
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private readonly ai: GoogleGenAI;

  constructor() {
    // Initialize Gemini Client
    // process.env.API_KEY is handled by the build environment/runtime
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] });
  }

  async generateMermaidCode(input: AiInputData): Promise<string> {
    try {
      const model = 'gemini-2.5-flash';
      
      let systemInstruction = `
        You are an expert in Mermaid.js diagramming syntax.
        Your task is to generate or update Mermaid.js code based on the user's request.
        
        Rules:
        1. Return ONLY the code. Do not include markdown code fences (like \`\`\`mermaid).
        2. Do not include explanations or conversational text.
        3. Ensure syntax is valid and error-free.
      `;

      // Adjust instruction if we are refining existing code
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

      const response = await this.ai.models.generateContent({
        model: model,
        contents: { parts },
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2,
        }
      });

      const rawText = response.text || '';
      return this.cleanResponse(rawText);
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate diagram from AI.');
    }
  }

  private cleanResponse(text: string): string {
    // Remove markdown code blocks if the AI includes them despite instructions
    let clean = text.trim();
    // Remove ```mermaid ... ``` or just ``` ... ```
    clean = clean.replace(/^```(mermaid)?/i, '').replace(/```$/, '');
    return clean.trim();
  }
}
