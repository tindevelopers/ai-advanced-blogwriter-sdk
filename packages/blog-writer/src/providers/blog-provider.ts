import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { BlogAIConfig, BlogTemplate } from '../types';
import {
  contentTypeDetector,
  type ContentTypeDetectionResult,
} from '../database/content-type-detector';
import { configurationRepository } from '../database/configuration-repository';
import { blogPostRepository } from '../database/blog-post-repository';

/**
 * Blog provider configuration options
 */
export interface BlogProviderOptions {
  /**
   * Default AI configuration
   */
  defaultConfig?: Partial<BlogAIConfig>;

  /**
   * Auto-detect content types
   */
  autoDetectContentType?: boolean;

  /**
   * Enable content routing based on type detection
   */
  enableContentRouting?: boolean;

  /**
   * Persist blog posts to database
   */
  persistToDB?: boolean;

  /**
   * Configuration name to load from database
   */
  configurationName?: string;
}

/**
 * Content processing pipeline result
 */
export interface ContentProcessingResult {
  contentType: ContentTypeDetectionResult;
  routingConfig: {
    template: string;
    wordCountRange: { min: number; max: number };
    sections: string[];
    requiredElements: string[];
  };
  enhancedConfig: BlogAIConfig;
  templatePrompt: string;
}

/**
 * Enhanced blog provider with content type detection and routing
 */
export class BlogProvider {
  private config: BlogProviderOptions;
  private loadedConfig?: Partial<BlogAIConfig>;

  constructor(options: BlogProviderOptions = {}) {
    this.config = {
      autoDetectContentType: true,
      enableContentRouting: true,
      persistToDB: true,
      ...options,
    };
  }

  /**
   * Initialize the provider and load configuration
   */
  async initialize(): Promise<void> {
    // Load configuration from database if specified
    if (this.config.configurationName) {
      const dbConfig = await configurationRepository.getConfiguration(
        this.config.configurationName,
      );
      if (dbConfig) {
        this.loadedConfig = configurationRepository.toBlogAIConfig(dbConfig);
      }
    }

    // Initialize content type detector
    await contentTypeDetector.initialize();

    // Seed default templates if none exist
    const templates = await configurationRepository.getTemplatesByType();
    if (templates.length === 0) {
      await configurationRepository.seedDefaultTemplates();
    }
  }

  /**
   * Process content topic and prepare optimized configuration
   */
  async processContent(
    topic: string,
    description?: string,
    additionalContext?: string,
    model?: LanguageModelV2,
  ): Promise<ContentProcessingResult> {
    // Detect content type
    let contentTypeResult: ContentTypeDetectionResult;

    if (this.config.autoDetectContentType && model) {
      // Use AI-powered detection if model is available
      contentTypeResult = await contentTypeDetector.detectContentTypeWithAI(
        model,
        topic,
        description,
        additionalContext,
      );
    } else {
      // Fall back to pattern-based detection
      contentTypeResult = await contentTypeDetector.detectContentType(
        topic,
        description,
        additionalContext,
      );
    }

    // Get routing configuration
    const routingConfig = contentTypeDetector.getRoutingConfig(
      contentTypeResult.contentType,
    );

    // Build enhanced configuration
    const enhancedConfig = this.buildEnhancedConfig(
      contentTypeResult,
      routingConfig,
    );

    // Get template prompt
    const templatePrompt = await this.getTemplatePrompt(
      contentTypeResult.suggestedTemplate || routingConfig.template,
      contentTypeResult.contentType,
    );

    return {
      contentType: contentTypeResult,
      routingConfig,
      enhancedConfig,
      templatePrompt,
    };
  }

  /**
   * Create a blog-optimized model configuration
   */
  createBlogModel(
    baseModel: LanguageModelV2,
    topic: string,
    options: {
      contentType?: string;
      template?: BlogTemplate;
      keywords?: string[];
      tone?: string;
      audience?: string;
      wordCount?: { min: number; max: number };
    } = {},
  ): LanguageModelV2 {
    // This would wrap the base model with blog-specific optimizations
    // For now, we'll return the base model with enhanced metadata
    return baseModel;
  }

  /**
   * Get configuration for specific content type
   */
  async getContentTypeConfig(
    contentType: string,
    overrides?: Partial<BlogAIConfig>,
  ): Promise<Partial<BlogAIConfig>> {
    const baseConfig = this.getMergedConfig();

    // Content-type specific optimizations
    const typeOptimizations: Record<string, Partial<BlogAIConfig>> = {
      tutorial: {
        quality: {
          ...baseConfig.quality,
          style: 'tutorial',
          readingLevel: 6, // More accessible for tutorials
        },
        seo: {
          ...baseConfig.seo,
          minLength: 1500,
          maxLength: 4000,
        },
      },
      listicle: {
        quality: {
          ...baseConfig.quality,
          style: 'listicle',
          tone: 'friendly',
        },
        seo: {
          ...baseConfig.seo,
          minLength: 1000,
          maxLength: 3000,
        },
      },
      comparison: {
        quality: {
          ...baseConfig.quality,
          style: 'comparison',
          tone: 'authoritative',
          includeSources: true,
        },
        seo: {
          ...baseConfig.seo,
          minLength: 1200,
          maxLength: 2500,
        },
      },
      guide: {
        quality: {
          ...baseConfig.quality,
          style: 'tutorial',
          tone: 'professional',
          includeSources: true,
        },
        seo: {
          ...baseConfig.seo,
          minLength: 2000,
          maxLength: 5000,
        },
      },
    };

    const optimizedConfig = {
      ...baseConfig,
      ...typeOptimizations[contentType],
      ...overrides,
    };

    return optimizedConfig;
  }

  /**
   * Save content processing result for reuse
   */
  async saveProcessingResult(
    topic: string,
    result: ContentProcessingResult,
    blogPostId?: string,
  ): Promise<void> {
    if (!this.config.persistToDB) return;

    // Save content research if enabled
    if (this.loadedConfig?.research?.enabled) {
      await configurationRepository.saveContentResearch({
        topic,
        keywords: {
          primary: result.contentType.matchedPatterns,
          suggestions: result.contentType.recommendations,
        },
        trends: {
          contentType: result.contentType.contentType,
          confidence: result.contentType.confidence,
          template: result.contentType.suggestedTemplate,
        },
        researchDepth: 'DETAILED',
        metadata: {
          routingConfig: result.routingConfig,
          processingTimestamp: new Date().toISOString(),
        },
        blogPostId,
      });
    }
  }

  /**
   * Get available templates
   */
  async getAvailableTemplates(contentType?: string): Promise<
    {
      name: string;
      type: string;
      description?: string;
      wordCountRange?: { min: number; max: number };
    }[]
  > {
    const templates = await configurationRepository.getTemplatesByType(
      contentType as any,
    );

    return templates.map(template => ({
      name: template.name,
      type: template.type,
      description: template.description || undefined,
      wordCountRange: template.wordCountRange as any,
    }));
  }

  /**
   * Create a new configuration and save it
   */
  async createConfiguration(
    name: string,
    config: Partial<BlogAIConfig> & {
      modelProvider: string;
      modelId: string;
    },
  ): Promise<void> {
    await configurationRepository.saveConfiguration({
      name,
      description: `Blog AI configuration for ${name}`,
      modelProvider: config.modelProvider,
      modelId: config.modelId,
      seo: config.seo,
      quality: {
        readingLevel: config.quality?.readingLevel,
        tone: this.mapToneToPrisma(config.quality?.tone),
        contentType: this.mapContentTypeToPrisma(config.quality?.style),
        includeSources: config.quality?.includeSources,
        factCheck: config.quality?.factCheck,
      },
      template: config.template,
      research: {
        enabled: config.research?.enabled,
        depth: this.mapResearchDepthToPrisma(config.research?.depth),
        includeTrends: config.research?.includeTrends,
        competitorAnalysis: config.research?.competitorAnalysis,
      },
    });
  }

  // Private helper methods
  private getMergedConfig(): Partial<BlogAIConfig> {
    return {
      ...this.config.defaultConfig,
      ...this.loadedConfig,
    };
  }

  private buildEnhancedConfig(
    contentType: ContentTypeDetectionResult,
    routingConfig: any,
  ): BlogAIConfig {
    const baseConfig = this.getMergedConfig();

    return {
      ...baseConfig,
      quality: {
        ...baseConfig.quality,
        style: this.mapContentTypeToStyle(contentType.contentType),
        readingLevel: this.getOptimalReadingLevel(contentType.contentType),
      },
      seo: {
        ...baseConfig.seo,
        minLength: routingConfig.wordCountRange.min,
        maxLength: routingConfig.wordCountRange.max,
      },
      template: {
        ...baseConfig.template,
        type: contentType.suggestedTemplate as BlogTemplate,
      },
    } as BlogAIConfig;
  }

  private async getTemplatePrompt(
    templateName: string,
    contentType: any,
  ): Promise<string> {
    const template = await configurationRepository.getTemplate(templateName);

    if (template?.promptTemplate) {
      return template.promptTemplate;
    }

    // Return default prompt based on content type
    return this.getDefaultPromptForType(contentType);
  }

  private getDefaultPromptForType(contentType: any): string {
    const defaultPrompts: Record<string, string> = {
      BLOG: 'Create an engaging blog post about: {{topic}}\n\nMake it informative and reader-friendly.',
      TUTORIAL:
        'Create a step-by-step tutorial for: {{topic}}\n\nInclude clear instructions and examples.',
      HOWTO:
        'Create a how-to guide for: {{topic}}\n\nMake it practical and actionable.',
      LISTICLE:
        'Create a list-based article: {{topic}}\n\nMake each item substantial and valuable.',
      COMPARISON:
        'Create a detailed comparison: {{topic}}\n\nBe objective and provide clear recommendations.',
      GUIDE:
        'Create a comprehensive guide: {{topic}}\n\nCover all important aspects thoroughly.',
    };

    return defaultPrompts[contentType] || defaultPrompts.BLOG;
  }

  private mapContentTypeToStyle(contentType: any): string {
    const styleMap: Record<string, string> = {
      BLOG: 'blog',
      TUTORIAL: 'tutorial',
      HOWTO: 'howto',
      LISTICLE: 'listicle',
      COMPARISON: 'comparison',
      GUIDE: 'tutorial',
      REVIEW: 'review',
      NEWS: 'news',
    };

    return styleMap[contentType] || 'blog';
  }

  private getOptimalReadingLevel(contentType: any): number {
    const readingLevels: Record<string, number> = {
      BLOG: 8,
      TUTORIAL: 6, // More accessible
      HOWTO: 7,
      LISTICLE: 8,
      COMPARISON: 9, // More detailed analysis
      GUIDE: 8,
      REVIEW: 8,
      NEWS: 7,
    };

    return readingLevels[contentType] || 8;
  }

  // Type mapping helpers
  private mapToneToPrisma(tone?: string): any {
    const toneMap: Record<string, any> = {
      professional: 'PROFESSIONAL',
      casual: 'CASUAL',
      authoritative: 'AUTHORITATIVE',
      friendly: 'FRIENDLY',
      technical: 'TECHNICAL',
      conversational: 'CONVERSATIONAL',
    };
    return tone ? toneMap[tone] : 'PROFESSIONAL';
  }

  private mapContentTypeToPrisma(style?: string): any {
    const typeMap: Record<string, any> = {
      blog: 'BLOG',
      tutorial: 'TUTORIAL',
      howto: 'HOWTO',
      listicle: 'LISTICLE',
      comparison: 'COMPARISON',
      news: 'NEWS',
      review: 'REVIEW',
    };
    return style ? typeMap[style] : 'BLOG';
  }

  private mapResearchDepthToPrisma(depth?: string): any {
    const depthMap: Record<string, any> = {
      basic: 'BASIC',
      detailed: 'DETAILED',
      comprehensive: 'COMPREHENSIVE',
    };
    return depth ? depthMap[depth] : 'DETAILED';
  }
}

/**
 * Create a blog provider instance
 */
export function createBlogProvider(
  options: BlogProviderOptions = {},
): BlogProvider {
  return new BlogProvider(options);
}

/**
 * Default blog provider instance
 */
export const blogProvider = createBlogProvider();
