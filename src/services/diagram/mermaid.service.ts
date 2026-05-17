import { Injectable } from "@angular/core";
import mermaid from "mermaid";

export interface MermaidThemeConfig {
  baseTheme: string;
  variables?: Record<string, string>;
}

@Injectable({
  providedIn: "root",
})
export class MermaidService {
  constructor() {
    this.initializeBase();
  }

  private initializeBase() {
    // Initialize with settings that minimize console output and worker complexity
    // to avoid "Function object could not be cloned" errors in some environments.
    mermaid.initialize({
      startOnLoad: false,
      suppressErrorRendering: true, // We handle errors manually in the component
      logLevel: "fatal", // Critical: Debug logs can cause cloning errors in iframe/worker bridges
      securityLevel: "antiscript", // safer than 'loose' for Capacitor Android WebView CSP
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    });
  }

  private getThemeConfig(themeName: string): MermaidThemeConfig {
    const configs: Record<string, MermaidThemeConfig> = {
      cyberpunk: {
        baseTheme: "dark",
        variables: {
          primaryColor: "#ff00ff",
          primaryTextColor: "#00ffff",
          primaryBorderColor: "#ff00ff",
          lineColor: "#00ffff",
          secondaryColor: "#1a0033",
          tertiaryColor: "#330066",
          fontFamily: '"Courier New", monospace',
          mainBkg: "#090014",
          nodeBorder: "#ff00ff",
        },
      },
      ocean: {
        baseTheme: "base",
        variables: {
          primaryColor: "#006994",
          primaryTextColor: "#e0f7fa",
          primaryBorderColor: "#4dd0e1",
          lineColor: "#80deea",
          secondaryColor: "#0097a7",
          tertiaryColor: "#00bcd4",
          fontFamily: "Inter, sans-serif",
        },
      },
      sunset: {
        baseTheme: "base",
        variables: {
          primaryColor: "#ff6b6b",
          primaryTextColor: "#2d3436",
          primaryBorderColor: "#ffd93d",
          lineColor: "#ff9f43",
          secondaryColor: "#f9c74f",
          tertiaryColor: "#90be6d",
        },
      },
      minimal: {
        baseTheme: "base",
        variables: {
          primaryColor: "#ffffff",
          primaryTextColor: "#1a1a1a",
          primaryBorderColor: "#1a1a1a",
          lineColor: "#1a1a1a",
          secondaryColor: "#f3f4f6",
          tertiaryColor: "#e5e7eb",
          fontFamily: "Inter, sans-serif",
        },
      },
    };

    if (configs[themeName]) {
      return configs[themeName];
    }

    // Special handling for 'default' to match the Dark UI
    if (themeName === "default") {
      return { baseTheme: "dark" };
    }

    // Fallback for built-in themes (neutral, dark, forest)
    return { baseTheme: themeName };
  }

  public async render(code: string, theme: string): Promise<string> {
    if (!code?.trim()) {
      return "";
    }

    try {
      // Update theme configuration before render.
      const config = this.getThemeConfig(theme);

      mermaid.initialize({
        theme: config.baseTheme as any,
        themeVariables: config.variables,
        suppressErrorRendering: true,
      });

      const graphId = `mermaid-graph-${this.generateId()}`;

      // render(id, text) returns { svg, bindFunctions } in Mermaid v10
      const { svg } = await mermaid.render(graphId, code);
      return svg;
    } catch (e: any) {
      // Extract error message safely to handle complex error objects from Mermaid
      let errorMessage = "Mermaid syntax error";

      if (typeof e === "string") {
        errorMessage = e;
      } else if (e instanceof Error) {
        errorMessage = e.message;
      } else if (e && typeof e === "object") {
        // Handle Mermaid's custom error objects which might contain 'str' or 'message'
        errorMessage = e.str || e.message || "Unknown syntax error";
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
