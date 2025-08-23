
/**
 * Base AI configuration interface that can be extended
 */
export interface BaseAIConfig {
  /**
   * Optional configuration for the AI model
   */
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  
  /**
   * Custom headers for API requests
   */
  headers?: Record<string, string>;
  
  /**
   * Additional provider-specific options
   */
  providerOptions?: Record<string, any>;
}

/**
 * Core AI configuration (replaces the missing AIConfig import)
 */
export interface AIConfig extends BaseAIConfig {
  /**
   * Model identifier
   */
  model?: string;
  
  /**
   * API key for the provider
   */
  apiKey?: string;
  
  /**
   * Base URL for the API
   */
  baseURL?: string;
}
