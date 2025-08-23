
import type { AIConfig } from 'ai';
import type { LanguageModelV1 } from '@ai-sdk/provider';

/**
 * Blog-specific AI configuration extending the base AI SDK configuration
 */
export interface BlogAIConfig extends AIConfig {
  /**
   * Default model for blog generation
   */
  model: LanguageModelV1;
  
  /**
   * SEO optimization settings
   */
  seo?: {
    /** Target keyword density (0-1) */
    keywordDensity?: number;
    /** Minimum content length in words */
    minLength?: number;
    /** Maximum content length in words */
    maxLength?: number;
    /** Focus keywords to optimize for */
    focusKeywords?: string[];
    /** Meta description optimization */
    optimizeMetaDescription?: boolean;
    /** Generate alt text for images */
    generateAltText?: boolean;
  };
  
  /**
   * Content quality settings
   */
  quality?: {
    /** Reading level (1-12, grade level) */
    readingLevel?: number;
    /** Tone of voice */
    tone?: 'professional' | 'casual' | 'authoritative' | 'friendly' | 'technical' | 'conversational';
    /** Content style */
    style?: 'blog' | 'tutorial' | 'news' | 'review' | 'comparison' | 'howto' | 'listicle';
    /** Include citations and sources */
    includeSources?: boolean;
    /** Fact-checking requirements */
    factCheck?: boolean;
  };
  
  /**
   * Template-specific settings
   */
  template?: {
    /** Default template type */
    type?: BlogTemplate;
    /** Custom template variables */
    variables?: Record<string, any>;
  };
  
  /**
   * Research and content enrichment
   */
  research?: {
    /** Enable automatic research */
    enabled?: boolean;
    /** Research depth level */
    depth?: 'basic' | 'detailed' | 'comprehensive';
    /** Include trending topics */
    includeTrends?: boolean;
    /** Competitor analysis */
    competitorAnalysis?: boolean;
  };
}

/**
 * Blog template types
 */
export type BlogTemplate = 
  | 'howto'
  | 'listicle'
  | 'comparison'
  | 'tutorial'
  | 'news'
  | 'review'
  | 'guide'
  | 'case-study'
  | 'opinion'
  | 'interview';
