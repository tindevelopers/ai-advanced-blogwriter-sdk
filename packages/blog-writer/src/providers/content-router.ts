import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { BlogAIConfig } from '../types';
import { contentTypeDetector } from '../database/content-type-detector';
import { configurationRepository } from '../database/configuration-repository';

/**
 * Content routing configuration
 */
export interface ContentRoutingConfig {
  contentType: string;
  template: string;
  promptStrategy: 'structured' | 'conversational' | 'technical' | 'creative';
  seoOptimization: 'basic' | 'advanced' | 'comprehensive';
  qualityLevel: 'standard' | 'premium' | 'expert';
  wordCountTarget: { min: number; max: number; optimal: number };
  requiredSections: string[];
  optionalSections: string[];
}

/**
 * Content routing decision
 */
export interface RoutingDecision {
  config: ContentRoutingConfig;
  reasoning: string;
  confidence: number;
  alternatives: ContentRoutingConfig[];
  optimizations: string[];
}

/**
 * Intelligent content routing system
 */
export class ContentRouter {
  /**
   * Route content based on topic, audience, and goals
   */
  async routeContent(options: {
    topic: string;
    description?: string;
    audience?: string;
    goals?: string[];
    keywords?: string[];
    competitorAnalysis?: boolean;
    businessContext?: string;
    model?: LanguageModelV2;
  }): Promise<RoutingDecision> {
    // Detect content type
    const contentTypeResult = options.model
      ? await contentTypeDetector.detectContentTypeWithAI(
          options.model,
          options.topic,
          options.description,
          `Audience: ${options.audience || 'general'}, Goals: ${options.goals?.join(', ') || 'inform'}, Business Context: ${options.businessContext || 'none'}`,
        )
      : await contentTypeDetector.detectContentType(
          options.topic,
          options.description,
          `Audience: ${options.audience || 'general'}`,
        );

    // Get routing configuration
    const baseConfig = contentTypeDetector.getRoutingConfig(
      contentTypeResult.contentType,
    );

    // Create enhanced routing config
    const routingConfig = await this.createRoutingConfig(
      contentTypeResult,
      baseConfig,
      options,
    );

    // Generate alternatives
    const alternatives = await this.generateAlternatives(
      routingConfig,
      options,
    );

    // Create optimization recommendations
    const optimizations = this.createOptimizations(routingConfig, options);

    return {
      config: routingConfig,
      reasoning: this.generateReasoning(
        contentTypeResult,
        routingConfig,
        options,
      ),
      confidence: contentTypeResult.confidence,
      alternatives,
      optimizations,
    };
  }

  /**
   * Route content for specific business goals
   */
  async routeForGoals(options: {
    topic: string;
    businessGoals: (
      | 'lead-generation'
      | 'brand-awareness'
      | 'thought-leadership'
      | 'education'
      | 'product-promotion'
      | 'seo-ranking'
    )[];
    targetAudience:
      | 'beginners'
      | 'intermediate'
      | 'experts'
      | 'decision-makers'
      | 'general';
    industry?: string;
    competitiveContext?: string;
  }): Promise<RoutingDecision> {
    const goalBasedStrategies: Record<string, Partial<ContentRoutingConfig>> = {
      'lead-generation': {
        promptStrategy: 'conversational',
        seoOptimization: 'comprehensive',
        qualityLevel: 'premium',
        requiredSections: [
          'introduction',
          'value-proposition',
          'call-to-action',
          'social-proof',
        ],
      },
      'brand-awareness': {
        promptStrategy: 'creative',
        seoOptimization: 'advanced',
        qualityLevel: 'premium',
        requiredSections: ['brand-story', 'unique-value', 'industry-insights'],
      },
      'thought-leadership': {
        promptStrategy: 'technical',
        seoOptimization: 'advanced',
        qualityLevel: 'expert',
        requiredSections: [
          'expert-analysis',
          'industry-trends',
          'future-predictions',
          'actionable-insights',
        ],
      },
      education: {
        promptStrategy: 'structured',
        seoOptimization: 'basic',
        qualityLevel: 'standard',
        requiredSections: [
          'learning-objectives',
          'step-by-step-content',
          'examples',
          'summary',
        ],
      },
      'product-promotion': {
        promptStrategy: 'conversational',
        seoOptimization: 'comprehensive',
        qualityLevel: 'premium',
        requiredSections: [
          'problem-identification',
          'solution-presentation',
          'benefits',
          'social-proof',
          'call-to-action',
        ],
      },
      'seo-ranking': {
        promptStrategy: 'structured',
        seoOptimization: 'comprehensive',
        qualityLevel: 'premium',
        requiredSections: [
          'keyword-rich-introduction',
          'comprehensive-coverage',
          'internal-links',
          'related-topics',
        ],
      },
    };

    // Combine strategies for multiple goals
    const combinedStrategy = this.combineStrategies(
      options.businessGoals.map(goal => goalBasedStrategies[goal]),
    );

    // Route with combined strategy
    return this.routeContent({
      topic: options.topic,
      description: `Target audience: ${options.targetAudience}, Industry: ${options.industry || 'general'}, Goals: ${options.businessGoals.join(', ')}`,
      audience: options.targetAudience,
      goals: options.businessGoals,
      businessContext: `Industry: ${options.industry}, Competitive context: ${options.competitiveContext}`,
    });
  }

  /**
   * Create content routing pipeline for batch processing
   */
  async createRoutingPipeline(
    topics: Array<{
      topic: string;
      description?: string;
      audience?: string;
      priority: 'high' | 'medium' | 'low';
    }>,
    globalConfig: {
      businessGoals: string[];
      brandVoice: string;
      industry: string;
      contentCalendarContext?: string;
    },
  ): Promise<
    Array<{
      topic: string;
      routing: RoutingDecision;
      schedulingPriority: number;
      contentSeries?: string;
    }>
  > {
    const results = [];

    for (const topicConfig of topics) {
      const routing = await this.routeContent({
        topic: topicConfig.topic,
        description: topicConfig.description,
        audience: topicConfig.audience,
        goals: globalConfig.businessGoals,
        businessContext: `Brand voice: ${globalConfig.brandVoice}, Industry: ${globalConfig.industry}`,
      });

      // Calculate scheduling priority
      const priorityScore = this.calculatePriorityScore(
        topicConfig,
        routing,
        globalConfig,
      );

      // Detect potential content series
      const contentSeries = this.detectContentSeries(
        topicConfig.topic,
        results,
      );

      results.push({
        topic: topicConfig.topic,
        routing,
        schedulingPriority: priorityScore,
        contentSeries,
      });
    }

    // Sort by priority
    return results.sort((a, b) => b.schedulingPriority - a.schedulingPriority);
  }

  // Private helper methods
  private async createRoutingConfig(
    contentTypeResult: any,
    baseConfig: any,
    options: any,
  ): Promise<ContentRoutingConfig> {
    const audienceAdjustments = this.getAudienceAdjustments(options.audience);
    const goalAdjustments = this.getGoalAdjustments(options.goals);

    return {
      contentType: contentTypeResult.contentType,
      template: contentTypeResult.suggestedTemplate || baseConfig.template,
      promptStrategy: this.selectPromptStrategy(contentTypeResult, options),
      seoOptimization: this.selectSEOLevel(options),
      qualityLevel: this.selectQualityLevel(options),
      wordCountTarget: {
        ...baseConfig.wordCountRange,
        optimal: Math.floor(
          (baseConfig.wordCountRange.min + baseConfig.wordCountRange.max) / 2,
        ),
      },
      requiredSections: [
        ...baseConfig.requiredElements,
        ...audienceAdjustments.requiredSections,
        ...goalAdjustments.requiredSections,
      ],
      optionalSections: [
        ...audienceAdjustments.optionalSections,
        ...goalAdjustments.optionalSections,
      ],
    };
  }

  private async generateAlternatives(
    primaryConfig: ContentRoutingConfig,
    options: any,
  ): Promise<ContentRoutingConfig[]> {
    const alternatives: ContentRoutingConfig[] = [];

    // Different content type alternatives
    const alternativeTypes = ['BLOG', 'TUTORIAL', 'HOWTO', 'LISTICLE', 'GUIDE'];

    for (const type of alternativeTypes) {
      if (type !== primaryConfig.contentType) {
        const altConfig = contentTypeDetector.getRoutingConfig(type as any);
        alternatives.push({
          ...primaryConfig,
          contentType: type,
          template: this.mapContentTypeToTemplate(type),
          wordCountTarget: {
            ...altConfig.wordCountRange,
            optimal: Math.floor(
              (altConfig.wordCountRange.min + altConfig.wordCountRange.max) / 2,
            ),
          },
          requiredSections: altConfig.requiredElements,
        });
      }
    }

    return alternatives.slice(0, 3); // Return top 3 alternatives
  }

  private createOptimizations(
    config: ContentRoutingConfig,
    options: any,
  ): string[] {
    const optimizations: string[] = [];

    if (options.keywords?.length > 0) {
      optimizations.push(
        `Optimize for keywords: ${options.keywords.slice(0, 3).join(', ')}`,
      );
    }

    if (config.seoOptimization === 'basic') {
      optimizations.push(
        'Consider upgrading to advanced SEO optimization for better rankings',
      );
    }

    if (config.qualityLevel === 'standard' && options.businessContext) {
      optimizations.push(
        'Consider premium quality level for business-critical content',
      );
    }

    if (config.wordCountTarget.optimal < 1000) {
      optimizations.push(
        'Consider increasing word count for better SEO performance',
      );
    }

    return optimizations;
  }

  private generateReasoning(
    contentTypeResult: any,
    config: ContentRoutingConfig,
    options: any,
  ): string {
    const reasons = [];

    reasons.push(
      `Content type detected as ${config.contentType} with ${Math.round(contentTypeResult.confidence * 100)}% confidence`,
    );
    reasons.push(
      `Selected ${config.template} template based on content structure requirements`,
    );
    reasons.push(
      `Chose ${config.promptStrategy} prompt strategy for optimal ${options.audience || 'general'} audience engagement`,
    );

    if (options.goals?.length > 0) {
      reasons.push(`Configured for ${options.goals.join(' and ')} goals`);
    }

    return reasons.join('. ');
  }

  private getAudienceAdjustments(audience?: string): {
    requiredSections: string[];
    optionalSections: string[];
  } {
    const adjustments: Record<
      string,
      { requiredSections: string[]; optionalSections: string[] }
    > = {
      beginners: {
        requiredSections: ['glossary', 'prerequisites'],
        optionalSections: ['further-reading', 'advanced-tips'],
      },
      experts: {
        requiredSections: ['technical-details', 'advanced-concepts'],
        optionalSections: ['basic-introduction'],
      },
      'decision-makers': {
        requiredSections: [
          'executive-summary',
          'roi-analysis',
          'implementation-timeline',
        ],
        optionalSections: ['technical-specifications'],
      },
    };

    return (
      adjustments[audience || 'general'] || {
        requiredSections: [],
        optionalSections: [],
      }
    );
  }

  private getGoalAdjustments(goals?: string[]): {
    requiredSections: string[];
    optionalSections: string[];
  } {
    if (!goals?.length) return { requiredSections: [], optionalSections: [] };

    const requiredSections: string[] = [];
    const optionalSections: string[] = [];

    if (goals.includes('lead-generation')) {
      requiredSections.push('call-to-action', 'contact-information');
    }

    if (goals.includes('seo-ranking')) {
      requiredSections.push('meta-description', 'keyword-optimization');
    }

    if (goals.includes('education')) {
      requiredSections.push('learning-objectives', 'summary');
      optionalSections.push('quiz', 'exercises');
    }

    return { requiredSections, optionalSections };
  }

  private selectPromptStrategy(
    contentTypeResult: any,
    options: any,
  ): ContentRoutingConfig['promptStrategy'] {
    if (
      options.audience === 'experts' ||
      contentTypeResult.contentType === 'TUTORIAL'
    ) {
      return 'technical';
    }
    if (
      contentTypeResult.contentType === 'OPINION' ||
      options.goals?.includes('brand-awareness')
    ) {
      return 'creative';
    }
    if (
      contentTypeResult.contentType === 'HOWTO' ||
      contentTypeResult.contentType === 'GUIDE'
    ) {
      return 'structured';
    }
    return 'conversational';
  }

  private selectSEOLevel(
    options: any,
  ): ContentRoutingConfig['seoOptimization'] {
    if (options.goals?.includes('seo-ranking') || options.competitorAnalysis) {
      return 'comprehensive';
    }
    if (options.keywords?.length > 3) {
      return 'advanced';
    }
    return 'basic';
  }

  private selectQualityLevel(
    options: any,
  ): ContentRoutingConfig['qualityLevel'] {
    if (
      options.businessContext ||
      options.goals?.includes('thought-leadership')
    ) {
      return 'expert';
    }
    if (
      options.goals?.includes('lead-generation') ||
      options.goals?.includes('brand-awareness')
    ) {
      return 'premium';
    }
    return 'standard';
  }

  private combineStrategies(
    strategies: Array<Partial<ContentRoutingConfig> | undefined>,
  ): Partial<ContentRoutingConfig> {
    const combined: Partial<ContentRoutingConfig> = {};

    // Take the highest quality level
    const qualityLevels = ['standard', 'premium', 'expert'];
    const maxQuality = strategies.reduce(
      (max, strategy) => {
        if (strategy?.qualityLevel) {
          const currentIndex = qualityLevels.indexOf(strategy.qualityLevel);
          const maxIndex = qualityLevels.indexOf(max);
          return currentIndex > maxIndex ? strategy.qualityLevel : max;
        }
        return max;
      },
      'standard' as ContentRoutingConfig['qualityLevel'],
    );

    combined.qualityLevel = maxQuality;

    // Combine required sections
    const allRequiredSections = strategies.flatMap(
      s => s?.requiredSections || [],
    );
    combined.requiredSections = [...new Set(allRequiredSections)];

    return combined;
  }

  private calculatePriorityScore(
    topicConfig: any,
    routing: RoutingDecision,
    globalConfig: any,
  ): number {
    let score = 0;

    // Base priority
    const priorityScores = { high: 100, medium: 50, low: 25 };
    score += priorityScores[topicConfig.priority];

    // Content type bonus
    if (
      routing.config.contentType === 'GUIDE' ||
      routing.config.contentType === 'TUTORIAL'
    ) {
      score += 20; // Evergreen content
    }

    // Quality level bonus
    const qualityScores = { standard: 0, premium: 15, expert: 30 };
    score += qualityScores[routing.config.qualityLevel];

    // Confidence bonus
    score += Math.round(routing.confidence * 20);

    return score;
  }

  private detectContentSeries(
    topic: string,
    existingResults: any[],
  ): string | undefined {
    // Simple series detection based on topic similarity
    const topicWords = topic.toLowerCase().split(' ');

    for (const result of existingResults) {
      const resultWords = result.topic.toLowerCase().split(' ');
      const commonWords = topicWords.filter(word => resultWords.includes(word));

      if (commonWords.length >= 2) {
        return `${commonWords.slice(0, 2).join('-')}-series`;
      }
    }

    return undefined;
  }

  private mapContentTypeToTemplate(contentType: string): string {
    const templateMap: Record<string, string> = {
      BLOG: 'howto',
      TUTORIAL: 'tutorial',
      HOWTO: 'howto',
      LISTICLE: 'listicle',
      GUIDE: 'guide',
      COMPARISON: 'comparison',
      REVIEW: 'review',
    };

    return templateMap[contentType] || 'howto';
  }
}

// Export singleton instance
export const contentRouter = new ContentRouter();
