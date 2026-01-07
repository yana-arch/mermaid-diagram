
import { Injectable } from '@angular/core';
import { GoogleGenAI } from "@google/genai";

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

  async generateMermaidCode(userPrompt: string): Promise<string> {
    try {
      const model = 'gemini-2.5-flash';
      
      const systemInstruction = `
        You are an expert in Mermaid.js diagramming syntax.
        Your task is to convert the user's natural language description into valid Mermaid.js code.
        
        Rules:
        1. Return ONLY the code. Do not include markdown code fences (like \`\`\`mermaid).
        2. Do not include explanations or conversational text.
        3. If the user asks for a specific diagram type (Sequence, Flowchart, Class, etc.), use that.
        4. If unspecified, choose the best diagram type for the data.
        5. Ensure syntax is valid and error-free.
      `;

      const response = await this.ai.models.generateContent({
        model: model,
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2, // Low temperature for more deterministic code generation
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
