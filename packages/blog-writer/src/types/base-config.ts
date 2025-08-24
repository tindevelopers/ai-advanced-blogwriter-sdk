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
 * Quality configuration for content generation
 */
export interface QualityConfig {
  /** Reading level (1-10) */
  readingLevel?: number;
  /** Tone configuration */
  tone?: string;
  /** Content style */
  style?: string;
  /** Include sources in content */
  includeSources?: boolean;
  /** Enable fact checking */
  factCheck?: boolean;
}

/**
 * SEO configuration for content optimization
 */
export interface SEOConfig {
  /** Primary keyword */
  primaryKeyword?: string;
  /** Secondary keywords */
  secondaryKeywords?: string[];
  /** Meta description */
  metaDescription?: string;
  /** Title optimization */
  titleOptimization?: boolean;
  /** Keyword density (0-1) */
  keywordDensity?: number;
  /** Minimum content length */
  minLength?: number;
  /** Maximum content length */
  maxLength?: number;
  /** Optimize meta description */
  optimizeMetaDescription?: boolean;
  /** Generate alt text for images */
  generateAltText?: boolean;
  /** Focus keywords */
  focusKeywords?: string[];
}

/**
 * Research configuration for content research
 */
export interface ResearchConfig {
  /** Enable research */
  enabled?: boolean;
  /** Research depth */
  depth?: string;
  /** Include trends */
  includeTrends?: boolean;
  /** Competitor analysis */
  competitorAnalysis?: boolean;
}

/**
 * Template configuration
 */
export interface TemplateConfig {
  /** Template name */
  name?: string;
  /** Template structure */
  structure?: any;
  /** Template type */
  type?: string;
  /** Template variables */
  variables?: Record<string, any>;
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

  /**
   * Quality configuration
   */
  quality?: QualityConfig;

  /**
   * SEO configuration
   */
  seo?: SEOConfig;

  /**
   * Research configuration
   */
  research?: ResearchConfig;

  /**
   * Template configuration
   */
  template?: TemplateConfig;
}
