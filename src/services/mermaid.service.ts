import { Injectable, isDevMode } from '@angular/core';

declare const mermaid: any;

@Injectable({
  providedIn: 'root',
})
export class MermaidService {
  constructor() {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      logLevel: isDevMode() ? 'debug' : 'fatal',
    });
  }

  public async render(code: string): Promise<string> {
    if (!code?.trim()) {
      return Promise.resolve('');
    }

    try {
      // Use a unique ID for the graph to prevent caching issues
      const graphId = `mermaid-graph-${this.generateId()}`;
      const { svg } = await mermaid.render(graphId, code);
      return svg;
    } catch (e) {
      if (isDevMode()) {
        console.error("Mermaid render error: ", e);
      }
      throw e;
    }
  }
  
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
