
import { Injectable } from '@angular/core';

declare const mermaid: any;

@Injectable({
  providedIn: 'root',
})
export class MermaidService {
  constructor() {
    this.initializeBase();
  }

  private initializeBase() {
    if (typeof mermaid === 'undefined') {
      return;
    }

    // Initialize with settings that minimize console output and worker complexity
    // to avoid "Function object could not be cloned" errors in some environments.
    mermaid.initialize({
      startOnLoad: false,
      suppressErrorRendering: true, // We handle errors manually in the component
      logLevel: 'fatal', // Critical: Debug logs can cause cloning errors in iframe/worker bridges
      securityLevel: 'loose', // Often helps with HTML labels and avoids some strict sandboxing issues
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    });
  }

  public async render(code: string, theme: string): Promise<string> {
    if (!code?.trim()) {
      return '';
    }

    try {
      if (typeof mermaid === 'undefined') {
        throw new Error('Mermaid library not loaded');
      }

      // Update theme configuration before render.
      mermaid.initialize({ 
        theme,
        suppressErrorRendering: true // Ensure error rendering is suppressed when theme changes
      });

      const graphId = `mermaid-graph-${this.generateId()}`;
      
      // render(id, text) returns { svg, bindFunctions } in Mermaid v10
      const { svg } = await mermaid.render(graphId, code);
      return svg;
    } catch (e: any) {
      // Extract error message safely to handle complex error objects from Mermaid
      let errorMessage = 'Mermaid syntax error';
      
      if (typeof e === 'string') {
        errorMessage = e;
      } else if (e instanceof Error) {
        errorMessage = e.message;
      } else if (e && typeof e === 'object') {
        // Handle Mermaid's custom error objects which might contain 'str' or 'message'
        errorMessage = e.str || e.message || 'Unknown syntax error';
      }

      console.error("Mermaid render failed:", errorMessage);
      // Throw a simple Error object to avoid "cloning" issues in some environments with complex objects
      throw new Error(errorMessage);
    }
  }
  
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
