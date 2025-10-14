import { Injectable, isDevMode } from '@angular/core';

declare const mermaid: any;

@Injectable({
  providedIn: 'root',
})
export class MermaidService {
  public async render(code: string, theme: string): Promise<string> {
    if (!code?.trim()) {
      return Promise.resolve('');
    }

    mermaid.initialize({
      startOnLoad: false,
      theme,
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      logLevel: isDevMode() ? 'debug' : 'fatal',
    });

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
