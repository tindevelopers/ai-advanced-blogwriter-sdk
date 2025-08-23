
import type { AIConfig } from './base-config';

// Define LanguageModelV1 interface locally to avoid dependency
interface LanguageModelV1 {
  modelId: string;
  provider?: string;
}

/**
 * Tone configuration settings for content generation
 */
export interface ToneConfiguration {
  /** Primary tone of voice */
  primary: 'professional' | 'casual' | 'authoritative' | 'friendly' | 'technical' | 'conversational';
  /** Emotional undertone */
  emotion?: 'neutral' | 'enthusiastic' | 'empathetic' | 'confident' | 'encouraging';
  /** Formality level (1-5, with 5 being most formal) */
  formalityLevel?: number;
  /** Target audience awareness */
  audience?: 'beginner' | 'intermediate' | 'expert' | 'general';
  /** Writing style preferences */
  style?: {
    /** Use active voice preference */
    activeVoice?: boolean;
    /** Sentence length preference */
    sentenceLength?: 'short' | 'medium' | 'long' | 'mixed';
    /** Include humor or personality */
    personality?: boolean;
    /** Technical jargon level */
    technicalLevel?: 'minimal' | 'moderate' | 'heavy';
  };
}

/**
 * Blog-specific AI configuration extending the base AI SDK configuration.
 * This interface provides the exact properties as specified in the requirements.
 */
export interface BlogAIConfig extends AIConfig {
  /**
   * Content type for the blog post
   */
  contentType: 'blog' | 'article' | 'tutorial';
  
  /**
   * Target length for the generated content in words
   */
  targetLength: number;
  
  /**
   * Enable or disable SEO optimization
   */
  seoOptimization: boolean;
  
  /**
   * Tone and style settings for content generation
   */
  toneSettings: ToneConfiguration;
}

/**
 * Extended blog AI configuration with additional settings for advanced use cases.
 * This maintains backward compatibility with existing implementations.
 */
export interface ExtendedBlogAIConfig extends BlogAIConfig {
  /**
   * Default model for blog generation
   */
  model?: string;
  
  /**
   * Advanced SEO optimization settings
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
