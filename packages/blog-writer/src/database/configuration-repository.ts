
import { prisma } from './prisma';
import type { BlogAIConfiguration, BlogTemplate, ContentResearch, ToneType, ContentType, ResearchDepth } from '../generated/prisma-client';
import type { BlogAIConfig } from '../types';

/**
 * Configuration repository for managing AI configurations and templates
 */
export class ConfigurationRepository {
  /**
   * Create or update AI configuration
   */
  async saveConfiguration(config: {
    name: string;
    description?: string;
    modelProvider: string;
    modelId: string;
    seo?: {
      keywordDensity?: number;
      minLength?: number;
      maxLength?: number;
      optimizeMetaDescription?: boolean;
      generateAltText?: boolean;
      focusKeywords?: string[];
    };
    quality?: {
      readingLevel?: number;
      tone?: ToneType;
      contentType?: ContentType;
      includeSources?: boolean;
      factCheck?: boolean;
    };
    template?: {
      type?: string;
      variables?: Record<string, any>;
    };
    research?: {
      enabled?: boolean;
      depth?: ResearchDepth;
      includeTrends?: boolean;
      competitorAnalysis?: boolean;
    };
  }): Promise<BlogAIConfiguration> {
    return prisma.blogAIConfiguration.upsert({
      where: { name: config.name },
      update: {
        description: config.description,
        modelProvider: config.modelProvider,
        modelId: config.modelId,
        
        // SEO settings
        keywordDensity: config.seo?.keywordDensity,
        minLength: config.seo?.minLength,
        maxLength: config.seo?.maxLength,
        optimizeMetaDescription: config.seo?.optimizeMetaDescription ?? true,
        generateAltText: config.seo?.generateAltText ?? true,
        focusKeywords: config.seo?.focusKeywords || [],
        
        // Quality settings
        readingLevel: config.quality?.readingLevel,
        tone: config.quality?.tone,
        contentType: config.quality?.contentType,
        includeSources: config.quality?.includeSources ?? true,
        factCheck: config.quality?.factCheck ?? false,
        
        // Template settings
        defaultTemplate: config.template?.type,
        templateVariables: config.template?.variables,
        
        // Research settings
        researchEnabled: config.research?.enabled ?? true,
        researchDepth: config.research?.depth,
        includeTrends: config.research?.includeTrends ?? true,
        competitorAnalysis: config.research?.competitorAnalysis ?? false,
        
        updatedAt: new Date(),
      },
      create: {
        name: config.name,
        description: config.description,
        modelProvider: config.modelProvider,
        modelId: config.modelId,
        
        // SEO settings
        keywordDensity: config.seo?.keywordDensity ?? 0.02,
        minLength: config.seo?.minLength ?? 300,
        maxLength: config.seo?.maxLength ?? 3000,
        optimizeMetaDescription: config.seo?.optimizeMetaDescription ?? true,
        generateAltText: config.seo?.generateAltText ?? true,
        focusKeywords: config.seo?.focusKeywords || [],
        
        // Quality settings
        readingLevel: config.quality?.readingLevel ?? 8,
        tone: config.quality?.tone ?? 'PROFESSIONAL',
        contentType: config.quality?.contentType ?? 'BLOG',
        includeSources: config.quality?.includeSources ?? true,
        factCheck: config.quality?.factCheck ?? false,
        
        // Template settings
        defaultTemplate: config.template?.type,
        templateVariables: config.template?.variables,
        
        // Research settings
        researchEnabled: config.research?.enabled ?? true,
        researchDepth: config.research?.depth ?? 'DETAILED',
        includeTrends: config.research?.includeTrends ?? true,
        competitorAnalysis: config.research?.competitorAnalysis ?? false,
      },
    });
  }

  /**
   * Get configuration by name
   */
  async getConfiguration(name: string): Promise<BlogAIConfiguration | null> {
    return prisma.blogAIConfiguration.findUnique({
      where: { name },
    });
  }

  /**
   * List all configurations
   */
  async listConfigurations(): Promise<BlogAIConfiguration[]> {
    return prisma.blogAIConfiguration.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete configuration
   */
  async deleteConfiguration(name: string): Promise<void> {
    await prisma.blogAIConfiguration.delete({
      where: { name },
    });
  }

  /**
   * Convert database configuration to BlogAIConfig
   */
  toBlogAIConfig(dbConfig: BlogAIConfiguration): Partial<BlogAIConfig> {
    return {
      seo: {
        keywordDensity: dbConfig.keywordDensity ?? 0.02,
        minLength: dbConfig.minLength ?? 300,
        maxLength: dbConfig.maxLength ?? 3000,
        optimizeMetaDescription: dbConfig.optimizeMetaDescription,
        generateAltText: dbConfig.generateAltText,
        focusKeywords: dbConfig.focusKeywords,
      },
      quality: {
        readingLevel: dbConfig.readingLevel ?? 8,
        tone: this.mapToneFromPrisma(dbConfig.tone),
        style: this.mapContentTypeFromPrisma(dbConfig.contentType),
        includeSources: dbConfig.includeSources,
        factCheck: dbConfig.factCheck,
      },
      template: {
        type: this.mapTemplateFromPrisma(dbConfig.defaultTemplate),
        variables: dbConfig.templateVariables as Record<string, any>,
      },
      research: {
        enabled: dbConfig.researchEnabled,
        depth: this.mapResearchDepthFromPrisma(dbConfig.researchDepth),
        includeTrends: dbConfig.includeTrends,
        competitorAnalysis: dbConfig.competitorAnalysis,
      },
    };
  }

  /**
   * Create or update template
   */
  async saveTemplate(template: {
    name: string;
    type: ContentType;
    description?: string;
    promptTemplate: string;
    structureTemplate?: string;
    variables?: Record<string, any>;
    wordCountRange?: { min: number; max: number };
    sections?: string[];
  }): Promise<BlogTemplate> {
    return prisma.blogTemplate.upsert({
      where: { name: template.name },
      update: {
        type: template.type,
        description: template.description,
        promptTemplate: template.promptTemplate,
        structureTemplate: template.structureTemplate,
        variables: template.variables,
        wordCountRange: template.wordCountRange,
        sections: template.sections,
        updatedAt: new Date(),
      },
      create: {
        name: template.name,
        type: template.type,
        description: template.description,
        promptTemplate: template.promptTemplate,
        structureTemplate: template.structureTemplate,
        variables: template.variables,
        wordCountRange: template.wordCountRange,
        sections: template.sections,
      },
    });
  }

  /**
   * Get template by name
   */
  async getTemplate(name: string): Promise<BlogTemplate | null> {
    return prisma.blogTemplate.findUnique({
      where: { name, enabled: true },
    });
  }

  /**
   * List templates by content type
   */
  async getTemplatesByType(contentType?: ContentType): Promise<BlogTemplate[]> {
    const where = {
      enabled: true,
      ...(contentType && { type: contentType }),
    };

    return prisma.blogTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Save content research
   */
  async saveContentResearch(research: {
    topic: string;
    keywords: any;
    trends?: any;
    competitors?: any;
    audience?: any;
    researchDepth: ResearchDepth;
    metadata?: any;
    blogPostId?: string;
  }): Promise<ContentResearch> {
    return prisma.contentResearch.create({
      data: research,
    });
  }

  /**
   * Get content research
   */
  async getContentResearch(id: string): Promise<ContentResearch | null> {
    return prisma.contentResearch.findUnique({
      where: { id },
    });
  }

  /**
   * Find research by topic
   */
  async findResearchByTopic(topic: string, limit = 5): Promise<ContentResearch[]> {
    return prisma.contentResearch.findMany({
      where: {
        topic: { contains: topic, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Seed default templates
   */
  async seedDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      {
        name: 'howto',
        type: 'HOWTO' as ContentType,
        description: 'Step-by-step how-to guide template',
        promptTemplate: `Create a comprehensive how-to guide for: {{topic}}

Structure:
1. Introduction - Explain what readers will learn and why it's valuable
2. Prerequisites - List what readers need before starting
3. Step-by-Step Instructions - Break down the process into clear, numbered steps
4. Tips and Best Practices - Share additional insights
5. Troubleshooting - Address common issues
6. Conclusion - Summarize key points and next steps

Keywords: {{keywords}}
Tone: {{tone}}
Target Audience: {{audience}}

Make it actionable and easy to follow.`,
        structureTemplate: JSON.stringify({
          sections: ['Introduction', 'Prerequisites', 'Instructions', 'Tips', 'Troubleshooting', 'Conclusion'],
          required: ['title', 'introduction', 'steps', 'conclusion'],
        }),
        wordCountRange: { min: 800, max: 2500 },
        sections: ['Introduction', 'Prerequisites', 'Instructions', 'Tips', 'Troubleshooting', 'Conclusion'],
      },
      {
        name: 'listicle',
        type: 'LISTICLE' as ContentType,
        description: 'List-based article template',
        promptTemplate: `Create an engaging listicle: {{topic}}

Structure:
1. Compelling Introduction - Hook readers and preview the list
2. {{numberOfItems}} Main Items - Each with substantial content
3. Brief Conclusion - Wrap up with key takeaways

Each list item should:
- Have a clear heading
- Include 2-3 paragraphs of explanation
- Provide actionable insights or examples

Keywords: {{keywords}}
Tone: {{tone}}
Make it scannable and engaging.`,
        wordCountRange: { min: 1000, max: 3000 },
        sections: ['Introduction', 'List Items', 'Conclusion'],
      },
      {
        name: 'tutorial',
        type: 'TUTORIAL' as ContentType,
        description: 'In-depth tutorial template',
        promptTemplate: `Create a comprehensive tutorial: {{topic}}

Structure:
1. Overview - What will be covered and learning objectives
2. Prerequisites - Required knowledge, tools, or setup
3. Core Content - Break into logical sections with examples
4. Hands-on Exercises - Practical applications
5. Advanced Topics - Optional deeper dives
6. Resources and Next Steps

Keywords: {{keywords}}
Include code examples, screenshots, and step-by-step instructions.
Make it educational and thorough.`,
        wordCountRange: { min: 1500, max: 4000 },
        sections: ['Overview', 'Prerequisites', 'Core Content', 'Exercises', 'Advanced Topics', 'Resources'],
      },
      {
        name: 'comparison',
        type: 'COMPARISON' as ContentType,
        description: 'Product/service comparison template',
        promptTemplate: `Create a detailed comparison: {{topic}}

Structure:
1. Introduction - What's being compared and why
2. Comparison Criteria - Key factors to evaluate
3. Detailed Analysis - Compare each option across criteria
4. Pros and Cons - Summarize advantages and disadvantages
5. Recommendation - Which option is best for whom

Include comparison tables and clear verdicts.
Keywords: {{keywords}}
Be objective and provide clear guidance.`,
        wordCountRange: { min: 1200, max: 2500 },
        sections: ['Introduction', 'Criteria', 'Analysis', 'Pros & Cons', 'Recommendation'],
      },
      {
        name: 'guide',
        type: 'GUIDE' as ContentType,
        description: 'Comprehensive guide template',
        promptTemplate: `Create an ultimate guide: {{topic}}

Structure:
1. Table of Contents
2. Introduction - Scope and value proposition
3. Fundamentals - Basic concepts and terminology
4. Core Sections - Main content organized logically
5. Advanced Techniques - For experienced users
6. Tools and Resources - Helpful links and references
7. Conclusion and Next Steps

This should be comprehensive and authoritative.
Keywords: {{keywords}}
Include internal linking and resource lists.`,
        wordCountRange: { min: 2000, max: 5000 },
        sections: ['TOC', 'Introduction', 'Fundamentals', 'Core Sections', 'Advanced', 'Resources', 'Conclusion'],
      },
    ];

    for (const template of defaultTemplates) {
      await this.saveTemplate(template);
    }
  }

  // Helper methods for type conversion
  private mapToneFromPrisma(tone?: ToneType): string {
    const toneMap: Record<ToneType, string> = {
      PROFESSIONAL: 'professional',
      CASUAL: 'casual',
      AUTHORITATIVE: 'authoritative',
      FRIENDLY: 'friendly',
      TECHNICAL: 'technical',
      CONVERSATIONAL: 'conversational',
    };
    return tone ? toneMap[tone] : 'professional';
  }

  private mapContentTypeFromPrisma(contentType?: ContentType): string {
    const typeMap: Record<ContentType, string> = {
      BLOG: 'blog',
      ARTICLE: 'tutorial',
      TUTORIAL: 'tutorial',
      HOWTO: 'howto',
      LISTICLE: 'listicle',
      COMPARISON: 'comparison',
      NEWS: 'news',
      REVIEW: 'review',
      GUIDE: 'tutorial',
      CASE_STUDY: 'blog',
      OPINION: 'blog',
      INTERVIEW: 'blog',
    };
    return contentType ? typeMap[contentType] : 'blog';
  }

  private mapTemplateFromPrisma(template?: string | null): string {
    return template || 'howto';
  }

  private mapResearchDepthFromPrisma(depth?: ResearchDepth): 'basic' | 'detailed' | 'comprehensive' {
    const depthMap: Record<ResearchDepth, 'basic' | 'detailed' | 'comprehensive'> = {
      BASIC: 'basic',
      DETAILED: 'detailed',
      COMPREHENSIVE: 'comprehensive',
    };
    return depth ? depthMap[depth] : 'detailed';
  }
}

// Export singleton instance
export const configurationRepository = new ConfigurationRepository();
