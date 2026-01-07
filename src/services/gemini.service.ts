
import { Injectable } from '@angular/core';
import { GoogleGenAI } from "@google/genai";

export interface AiInputData {
  prompt: string;
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
      
      const systemInstruction = `
        You are an expert in Mermaid.js diagramming syntax.
        Your task is to convert the user's request (which may include code files, documents, or images) into valid Mermaid.js code.
        
        Rules:
        1. Return ONLY the code. Do not include markdown code fences (like \`\`\`mermaid).
        2. Do not include explanations or conversational text.
        3. If the user provides code (Python, Java, SQL, etc.), analyze the logic/schema and generate a relevant diagram (Class Diagram, ERD, Flowchart).
        4. If the user provides an image/PDF, analyze the visual structure and replicate it in Mermaid.
        5. Ensure syntax is valid and error-free.
      `;

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
        contents: { parts }, // Correct structure for multimodal
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
