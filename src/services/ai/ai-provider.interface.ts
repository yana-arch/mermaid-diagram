
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

/**
 * Interface for AI providers to generate Mermaid diagrams.
 * This allows swapping between Google Gemini, OpenAI, Ollama, etc.
 */
export interface IAiProvider {
  /**
   * Generates Mermaid code based on input and configuration.
   */
  generateMermaidCode(input: AiInputData, config: AiRequestConfig): Promise<string>;

  /**
   * Lists available models for this provider.
   */
  listModels(config: AiRequestConfig): Promise<AiModelInfo[]>;
}
