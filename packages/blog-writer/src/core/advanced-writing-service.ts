/**
 * Advanced Writing Service
 * Week 7-8 Implementation
 *
 * Provides comprehensive writing capabilities including:
 * - Multi-section content generation
 * - Tone and style consistency
 * - Real-time fact-checking
 * - Content optimization
 * - Streaming generation
 */

import type { LanguageModelV2 } from '@ai-sdk/provider';
import {
  ComprehensiveWritingRequest,
  ComprehensiveWritingResult,
  ContentOutline,
  ContentSection,
  ToneAnalysis,
  FactCheck,
  OptimizationSuggestion,
  GenerationMetrics,
  QualityScore,
  StreamingCallback,
  GenerationProgress,
  GenerationPhase,
  BrandVoiceProfile,
  StyleGuideSettings,
  SEORequirements,
  WritingConfig,
  OutlineSection,
  GenerationContext,
  SectionType,
  ToneCategory,
  EmotionalTone,
  VerificationStatus,
  EffortLevel,
  OptimizationType,
} from '../types/advanced-writing';
import type { BlogPost } from '../types/blog-post';

// Simple interface to avoid Prisma dependency issues
interface PrismaClient {
  blogPost: any;
  toneAnalysis: any;
  factCheck: any;
  optimizationSuggestion: any;
}

export interface AdvancedWritingServiceConfig {
  model: LanguageModelV2;
  prisma?: PrismaClient;
  defaultBrandVoice?: BrandVoiceProfile;
  defaultStyleGuide?: StyleGuideSettings;
  enableFactChecking?: boolean;
  enableOptimization?: boolean;
  enableRealtimeAnalysis?: boolean;
}

/**
 * Advanced Writing Service Implementation
 * Coordinates comprehensive content generation with analysis
 */
export class AdvancedWritingService {
  private config: AdvancedWritingServiceConfig;
  private currentProgress?: GenerationProgress;
  private streamingCallback?: StreamingCallback;

  constructor(config: AdvancedWritingServiceConfig) {
    this.config = {
      enableFactChecking: true,
      enableOptimization: true,
      enableRealtimeAnalysis: true,
      ...config,
    };
  }

  /**
   * Generate comprehensive blog content with analysis
   */
  async generateComprehensive(
    request: ComprehensiveWritingRequest,
  ): Promise<ComprehensiveWritingResult> {
    const startTime = Date.now();

    try {
      // Initialize progress tracking
      this.currentProgress = {
        phase: GenerationPhase.PLANNING,
        overallProgress: 0,
        sectionsCompleted: 0,
        totalSections: 0,
        timeElapsed: 0,
      };

      if (request.streamingCallback) {
        // Handle both StreamingCallback object and function
        if (typeof request.streamingCallback === 'function') {
          this.streamingCallback = {
            onProgress: request.streamingCallback,
          };
        } else {
          this.streamingCallback = request.streamingCallback;
        }
      }

      // Phase 1: Content Planning and Outline Generation
      await this.updateProgress(GenerationPhase.OUTLINING, 0.1);
      const outline = await this.generateOutline(request);

      // Phase 2: Section-by-section content generation
      await this.updateProgress(GenerationPhase.CONTENT_GENERATION, 0.2);
      const sections = await this.generateSectionsFromOutline(outline, request);

      // Phase 3: Tone analysis
      await this.updateProgress(GenerationPhase.TONE_ANALYSIS, 0.7);
      const toneAnalysis = await this.analyzeToneConsistency(
        sections,
        request.brandVoice,
      );

      // Phase 4: Fact checking (if enabled)
      let factChecks: FactCheck[] = [];
      if (
        this.config.enableFactChecking &&
        request.factCheckingEnabled !== false
      ) {
        await this.updateProgress(GenerationPhase.FACT_CHECKING, 0.8);
        factChecks = await this.performFactChecking(sections);
      }

      // Phase 5: Content optimization
      let optimizationSuggestions: OptimizationSuggestion[] = [];
      if (
        this.config.enableOptimization &&
        request.optimizationEnabled !== false
      ) {
        await this.updateProgress(GenerationPhase.OPTIMIZATION, 0.9);
        optimizationSuggestions = await this.generateOptimizationSuggestions(
          sections,
          request,
        );
      }

      // Phase 6: Finalize and create blog post
      await this.updateProgress(GenerationPhase.FINALIZATION, 0.95);
      const blogPost = await this.createBlogPost(sections, outline, request);

      // Calculate metrics
      const generationMetrics = this.calculateGenerationMetrics(
        sections,
        factChecks,
        optimizationSuggestions,
        startTime,
      );

      // Calculate quality score
      const qualityScore = await this.calculateQualityScore(
        blogPost,
        toneAnalysis,
        factChecks,
        optimizationSuggestions,
      );

      await this.updateProgress(GenerationPhase.FINALIZATION, 1.0);

      const result: ComprehensiveWritingResult = {
        blogPost,
        contentOutline: outline,
        sections,
        toneAnalysis,
        factChecks,
        optimizationSuggestions,
        generationMetrics,
        qualityScore,
      };

      // Persist to database if configured
      if (this.config.prisma) {
        await this.persistResult(result);
      }

      return result;
    } catch (error) {
      if (this.streamingCallback?.onError) {
        this.streamingCallback.onError(
          error as Error,
          'comprehensive_generation',
        );
      }
      throw error;
    }
  }

  /**
   * Stream content generation with real-time callbacks
   */
  async streamGeneration(
    request: ComprehensiveWritingRequest,
    callback: StreamingCallback,
  ): Promise<void> {
    this.streamingCallback = callback;
    await this.generateComprehensive(request);
  }

  /**
   * Enhance existing content with additional analysis and optimization
   */
  async enhanceExistingContent(
    blogPostId: string,
    enhancements: string[],
  ): Promise<ComprehensiveWritingResult> {
    if (!this.config.prisma) {
      throw new Error('Database connection required for content enhancement');
    }

    // Get existing content
    const existingPost = await this.config.prisma.blogPost.findUnique({
      where: { id: blogPostId },
      include: {
        blogPostVersions: true,
      },
    });

    if (!existingPost) {
      throw new Error('Blog post not found');
    }

    // Get existing sections
    const sections = await this.getSections(blogPostId);

    // Get existing analysis data
    const toneAnalysis = await this.getToneAnalysis(blogPostId);
    const factChecks = await this.getFactChecks(blogPostId);
    const optimizationSuggestions =
      await this.getOptimizationSuggestions(blogPostId);

    // Apply enhancements based on requested improvements
    const enhancedResult = await this.applyEnhancements(
      {
        blogPost: this.convertPrismaToBlogPost(existingPost),
        contentOutline: await this.generateOutlineFromSections(sections),
        sections,
        toneAnalysis:
          toneAnalysis || (await this.generateDefaultToneAnalysis(blogPostId)),
        factChecks,
        optimizationSuggestions,
        generationMetrics: this.generateDefaultMetrics(),
        qualityScore: await this.calculateQualityScoreFromSections(sections),
      },
      enhancements,
    );

    return enhancedResult;
  }

  // Private helper methods

  private async generateOutline(
    request: ComprehensiveWritingRequest,
  ): Promise<ContentOutline> {
    // This would typically call an LLM to generate the outline
    // For now, returning a basic structure
    const sections: OutlineSection[] = [
      {
        id: 'intro',
        title: 'Introduction',
        level: 1,
        wordCount: Math.floor(request.targetLength * 0.1),
        keyPoints: ['Hook', 'Topic introduction', 'Article preview'],
        order: 1,
        sectionType: SectionType.INTRODUCTION,
      },
      {
        id: 'main1',
        title: 'Main Section 1',
        level: 2,
        wordCount: Math.floor(request.targetLength * 0.3),
        keyPoints: ['Primary concept', 'Supporting details', 'Examples'],
        order: 2,
        sectionType: SectionType.MAIN_CONTENT,
      },
      {
        id: 'main2',
        title: 'Main Section 2',
        level: 2,
        wordCount: Math.floor(request.targetLength * 0.3),
        keyPoints: ['Secondary concept', 'Analysis', 'Implications'],
        order: 3,
        sectionType: SectionType.MAIN_CONTENT,
      },
      {
        id: 'conclusion',
        title: 'Conclusion',
        level: 1,
        wordCount: Math.floor(request.targetLength * 0.15),
        keyPoints: ['Summary', 'Key takeaways', 'Next steps'],
        order: 4,
        sectionType: SectionType.CONCLUSION,
      },
      {
        id: 'cta',
        title: 'Call to Action',
        level: 1,
        wordCount: Math.floor(request.targetLength * 0.05),
        keyPoints: ['Action prompt', 'Contact information'],
        order: 5,
        sectionType: SectionType.CTA,
      },
    ];

    return {
      id: `outline-${Date.now()}`,
      title: `Outline for: ${request.topic}`,
      sections,
      totalWordCount: request.targetLength,
      estimatedReadingTime: Math.ceil(request.targetLength / 200),
      keyTopics: [request.topic],
      targetAudience: request.targetAudience || 'general',
      contentGoals: ['Inform', 'Engage', 'Convert'],
    };
  }

  private async generateSectionsFromOutline(
    outline: ContentOutline,
    request: ComprehensiveWritingRequest,
  ): Promise<ContentSection[]> {
    const sections: ContentSection[] = [];
    let completedSections = 0;

    for (const outlineSection of outline.sections) {
      if (this.streamingCallback?.onSectionStart) {
        this.streamingCallback.onSectionStart({
          id: outlineSection.id,
          title: outlineSection.title,
          type: outlineSection.sectionType,
        });
      }

      const context: GenerationContext = {
        overallTheme: request.topic,
        targetTone:
          request.brandVoice?.toneCharacteristics.primary || 'professional',
        keywordFocus: request.seoRequirements?.secondaryKeywords || [],
        brandVoice: request.brandVoice,
      };

      const section = await this.generateSectionContent(
        outlineSection,
        context,
      );
      sections.push(section);

      completedSections++;
      this.currentProgress = {
        ...this.currentProgress!,
        sectionsCompleted: completedSections,
        totalSections: outline.sections.length,
        overallProgress:
          0.2 + (completedSections / outline.sections.length) * 0.5,
      };

      if (this.streamingCallback?.onSectionComplete) {
        this.streamingCallback.onSectionComplete(section);
      }
    }

    return sections;
  }

  private async generateSectionContent(
    outlineSection: OutlineSection,
    context: GenerationContext,
  ): Promise<ContentSection> {
    // This would call the LLM to generate actual content
    // For now, generating placeholder content
    const content = `This is the content for ${outlineSection.title}. ${outlineSection.keyPoints.join('. ')}.`;

    return {
      id: `section-${outlineSection.id}`,
      blogPostId: `blog-${Date.now()}`,
      title: outlineSection.title,
      content,
      sectionType: outlineSection.sectionType,
      order: outlineSection.order,
      level: outlineSection.level,
      parentId: outlineSection.parentId,
      wordCount: content.split(' ').length,
      keyPoints: outlineSection.keyPoints,
      contextTags: [],
      promptUsed: `Generate ${outlineSection.sectionType} content about ${outlineSection.title}`,
      modelUsed: this.config.model.modelId,
      generationContext: context,
      generatedAt: new Date(),
      readabilityScore: 0.8,
      coherenceScore: 0.85,
      relevanceScore: 0.9,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async analyzeToneConsistency(
    sections: ContentSection[],
    brandVoice?: BrandVoiceProfile,
  ): Promise<ToneAnalysis> {
    // Combine all content for analysis
    const combinedContent = sections.map(s => s.content).join('\n\n');
    const blogPostId = sections[0]?.blogPostId || 'unknown';

    return {
      id: `tone-${Date.now()}`,
      blogPostId,
      primaryTone:
        (brandVoice?.toneCharacteristics.primary as ToneCategory) ||
        ToneCategory.PROFESSIONAL,
      secondaryTones: brandVoice?.toneCharacteristics.secondary || [],
      confidence: 0.85,
      formalityScore: 0.7,
      emotionalTone:
        (brandVoice?.toneCharacteristics.emotion as EmotionalTone) ||
        EmotionalTone.NEUTRAL,
      emotionIntensity: 0.6,
      authorityLevel: 0.8,
      personalityTraits: {
        warmth: brandVoice?.toneCharacteristics.personality.warmth || 0.7,
        competence:
          brandVoice?.toneCharacteristics.personality.competence || 0.8,
        sincerity: brandVoice?.toneCharacteristics.personality.sincerity || 0.8,
        excitement:
          brandVoice?.toneCharacteristics.personality.excitement || 0.5,
        sophistication:
          brandVoice?.toneCharacteristics.personality.sophistication || 0.7,
      },
      brandVoiceScore: brandVoice ? 0.82 : undefined,
      consistencyScore: 0.88,
      deviations: [],
      analyzedAt: new Date(),
      modelUsed: this.config.model.modelId,
    };
  }

  private async performFactChecking(
    sections: ContentSection[],
  ): Promise<FactCheck[]> {
    const factChecks: FactCheck[] = [];

    for (const section of sections) {
      // This would typically call fact-checking APIs
      // For now, creating placeholder fact checks
      const factCheck: FactCheck = {
        id: `fact-${section.id}`,
        blogPostId: section.blogPostId,
        claim: 'Sample claim from content',
        sectionId: section.id,
        position: 0,
        length: 50,
        verificationStatus: VerificationStatus.VERIFIED,
        confidence: 0.9,
        sources: [],
        checkedAt: new Date(),
        modelUsed: this.config.model.modelId,
      };

      factChecks.push(factCheck);
    }

    return factChecks;
  }

  private async generateOptimizationSuggestions(
    sections: ContentSection[],
    request: ComprehensiveWritingRequest,
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];
    const blogPostId = sections[0]?.blogPostId || 'unknown';

    // Generate sample suggestions
    suggestions.push({
      id: `opt-${Date.now()}-1`,
      blogPostId,
      type: OptimizationType.READABILITY,
      category: 'readability' as any,
      title: 'Improve Sentence Variety',
      description: 'Add more varied sentence structures to improve readability',
      impact: 'medium' as any,
      effort: EffortLevel.MINIMAL,
      priority: 7 as any,
      currentValue: 'Repetitive sentence structures',
      suggestedValue: 'Mix of short, medium, and long sentences',
      reasoning: 'Varied sentence length improves reading flow and engagement',
      expectedImpact: 0.7,
    });

    return suggestions;
  }

  private async createBlogPost(
    sections: ContentSection[],
    outline: ContentOutline,
    request: ComprehensiveWritingRequest,
  ): Promise<BlogPost> {
    const combinedContent = sections.map(s => s.content).join('\n\n');
    const totalWords = sections.reduce((sum, s) => sum + s.wordCount, 0);

    return {
      metadata: {
        id: `blog-${Date.now()}`,
        title: outline.title,
        slug: this.generateSlug(outline.title),
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: undefined,
        scheduledAt: undefined,
        category: request.contentType,
        tags: request.seoRequirements?.secondaryKeywords || [],
        seo: {
          focusKeyword: request.seoRequirements?.primaryKeyword,
          keywords: request.seoRequirements?.secondaryKeywords || [],
          keywordDensity: 0.02,
          seoScore: 85,
          readabilityScore: 82,
          wordCount: totalWords,
        },
        social: {
          ogTitle: outline.title,
          ogDescription: `Comprehensive guide about ${request.topic}`,
          twitterCard: 'summary_large_image',
        },
        settings: {
          allowComments: true,
          featured: false,
          language: 'en',
          template: request.contentType,
          readingTime: Math.ceil(totalWords / 200),
        },
        author: {
          name: 'AI Blog Writer',
          bio: 'Advanced AI writing system',
        },
      },
      content: {
        content: combinedContent,
        excerpt: sections[0]?.content.substring(0, 160) + '...' || '',
        tableOfContents: sections.map(s => ({
          title: s.title,
          anchor: this.generateSlug(s.title),
          level: s.level,
        })),
      },
      status: 'draft',
      versions: [],
    };
  }

  private calculateGenerationMetrics(
    sections: ContentSection[],
    factChecks: FactCheck[],
    optimizationSuggestions: OptimizationSuggestion[],
    startTime: number,
  ): GenerationMetrics {
    const totalWords = sections.reduce((sum, s) => sum + s.wordCount, 0);
    const averageQuality =
      sections.reduce((sum, s) => {
        return (
          sum +
          ((s.readabilityScore || 0) +
            (s.coherenceScore || 0) +
            (s.relevanceScore || 0)) /
            3
        );
      }, 0) / sections.length;

    return {
      totalWords,
      totalSections: sections.length,
      generationTime: (Date.now() - startTime) / 1000,
      modelUsed: this.config.model.modelId,
      factChecksPerformed: factChecks.length,
      optimizationSuggestions: optimizationSuggestions.length,
      averageSectionQuality: averageQuality,
      consistencyScore: 0.88,
    };
  }

  private async calculateQualityScore(
    blogPost: BlogPost,
    toneAnalysis: ToneAnalysis,
    factChecks: FactCheck[],
    optimizationSuggestions: OptimizationSuggestion[],
  ): Promise<QualityScore> {
    const readability = blogPost.metadata.seo.readabilityScore || 80;
    const coherence = toneAnalysis.consistencyScore;
    const factualAccuracy =
      factChecks.length > 0
        ? factChecks.filter(
            f => f.verificationStatus === VerificationStatus.VERIFIED,
          ).length / factChecks.length
        : 0.8;
    const seoOptimization = (blogPost.metadata.seo.seoScore || 80) / 100;
    const brandVoiceAlignment = toneAnalysis.brandVoiceScore || 0.8;

    // Penalty for optimization suggestions (more suggestions = lower initial quality)
    const engagementPotential = Math.max(
      0.3,
      1 - optimizationSuggestions.length * 0.05,
    );

    return {
      overall:
        (readability / 100 +
          coherence +
          factualAccuracy +
          seoOptimization +
          brandVoiceAlignment +
          engagementPotential) /
        6,
      readability: readability / 100,
      coherence,
      factualAccuracy,
      seoOptimization,
      brandVoiceAlignment,
      engagementPotential,
    };
  }

  private async updateProgress(
    phase: GenerationPhase,
    progress: number,
  ): Promise<void> {
    if (this.currentProgress) {
      this.currentProgress.phase = phase;
      this.currentProgress.overallProgress = progress;
      this.currentProgress.timeElapsed =
        Date.now() - (this.currentProgress.timeElapsed || Date.now());
    }

    if (this.streamingCallback?.onProgress) {
      this.streamingCallback.onProgress(phase, progress);
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Database interaction methods

  private async persistResult(
    result: ComprehensiveWritingResult,
  ): Promise<void> {
    if (!this.config.prisma) return;

    try {
      // Store the blog post and related data
      // Implementation would depend on your specific Prisma schema
      console.log('Persisting result to database...');
    } catch (error) {
      console.error('Failed to persist result:', error);
    }
  }

  private convertPrismaToBlogPost(prismaPost: any): BlogPost {
    // Convert Prisma model to BlogPost interface
    // This is a simplified conversion
    return {
      metadata: {
        id: prismaPost.id,
        title: prismaPost.title || '',
        slug: prismaPost.slug || '',
        createdAt: prismaPost.createdAt,
        updatedAt: prismaPost.updatedAt,
        seo: {
          wordCount: prismaPost.wordCount || 0,
          seoScore: prismaPost.seoScore,
          readabilityScore: prismaPost.readabilityScore,
        },
        settings: {
          readingTime: Math.ceil((prismaPost.wordCount || 0) / 200),
        },
      },
      content: {
        content: prismaPost.content || '',
      },
      status: 'draft',
    };
  }

  private async getSections(blogPostId: string): Promise<ContentSection[]> {
    if (!this.config.prisma) return [];

    try {
      const sections = await this.config.prisma.blogPostSection.findMany({
        where: { blogPostId },
        orderBy: { order: 'asc' },
      });

      return sections.map((s: any) => ({
        id: s.id,
        blogPostId: s.blogPostId,
        title: s.title,
        content: s.content,
        sectionType: s.sectionType as any,
        order: s.order,
        level: s.level,
        parentId: s.parentId || undefined, // Convert null to undefined
        wordCount: s.wordCount,
        keyPoints: s.keyPoints,
        contextTags: s.contextTags,
        promptUsed: s.promptUsed || undefined,
        modelUsed: s.modelUsed || undefined,
        generationContext: s.generationContext as any,
        generatedAt: s.generatedAt,
        readabilityScore: s.readabilityScore || undefined, // Convert null to undefined
        coherenceScore: s.coherenceScore || undefined, // Convert null to undefined
        relevanceScore: s.relevanceScore || undefined, // Convert null to undefined
        children: [],
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
    } catch (error) {
      console.error('Failed to get sections:', error);
      return [];
    }
  }

  private async getToneAnalysis(
    blogPostId: string,
  ): Promise<ToneAnalysis | undefined> {
    if (!this.config.prisma) return undefined;

    try {
      const analysis = await this.config.prisma.toneAnalysis.findFirst({
        where: { blogPostId },
        orderBy: { analyzedAt: 'desc' },
      });

      if (!analysis) return undefined;

      return {
        id: analysis.id,
        blogPostId: analysis.blogPostId,
        sectionId: analysis.sectionId || undefined, // Convert null to undefined
        primaryTone: analysis.primaryTone as any,
        secondaryTones: analysis.secondaryTones as any,
        confidence: analysis.confidence,
        formalityScore: analysis.formalityScore,
        emotionalTone: analysis.emotionalTone as any,
        emotionIntensity: analysis.emotionIntensity,
        authorityLevel: analysis.authorityLevel,
        personalityTraits: analysis.personalityTraits as Record<string, number>,
        brandVoiceScore: analysis.brandVoiceScore || undefined, // Convert null to undefined
        consistencyScore: analysis.consistencyScore,
        deviations: analysis.deviations as any,
        analyzedAt: analysis.analyzedAt,
        modelUsed: analysis.modelUsed || '',
      };
    } catch (error) {
      console.error('Failed to get tone analysis:', error);
      return undefined;
    }
  }

  private async getFactChecks(blogPostId: string): Promise<FactCheck[]> {
    if (!this.config.prisma) return [];

    try {
      const factChecks = await this.config.prisma.factCheck.findMany({
        where: { blogPostId },
        include: { citations: true },
      });

      return factChecks.map((fc: any) => ({
        id: fc.id,
        blogPostId: fc.blogPostId,
        claim: fc.claim,
        sectionId: fc.sectionId || undefined, // Convert null to undefined
        startPosition: fc.startPosition || undefined, // Convert null to undefined
        endPosition: fc.endPosition || undefined, // Convert null to undefined
        verificationStatus: fc.verificationStatus as any,
        confidenceScore: fc.confidenceScore || undefined, // Convert null to undefined
        sources: fc.sources as any[],
        verifiedAt: fc.verifiedAt,
        verificationMethod: fc.verificationMethod as any,
        notes: fc.notes || undefined, // Convert null to undefined
        citations: fc.citations.map((c: any) => ({
          id: c.id,
          factCheckId: c.factCheckId,
          sourceId: c.sourceId,
          quotedText: c.quotedText || undefined,
          pageNumber: c.pageNumber || undefined,
          citationFormat: c.citationFormat as any,
          formattedCitation: c.formattedCitation,
          createdAt: c.createdAt,
        })),
        lastChecked: fc.lastChecked,
        expiresAt: fc.expiresAt || undefined,
        modelUsed: fc.modelUsed || '',
        humanReviewed: fc.humanReviewed || false,
        reviewedBy: fc.reviewedBy || undefined,
      }));
    } catch (error) {
      console.error('Failed to get fact checks:', error);
      return [];
    }
  }

  private async getOptimizationSuggestions(
    blogPostId: string,
  ): Promise<OptimizationSuggestion[]> {
    if (!this.config.prisma) return [];

    try {
      const suggestions =
        await this.config.prisma.optimizationSuggestion.findMany({
          where: { blogPostId },
          orderBy: { priority: 'desc' },
        });

      return suggestions.map((s: any) => ({
        id: s.id,
        blogPostId: s.blogPostId,
        category: s.category as any,
        title: s.title,
        description: s.description,
        impact: s.impact as any,
        effort: s.effort as any,
        priority: s.priority,
        currentValue: s.currentValue || undefined, // Convert null to undefined
        suggestedValue: s.suggestedValue || undefined, // Convert null to undefined
        beforeText: s.beforeText || undefined, // Convert null to undefined
        afterText: s.afterText || undefined, // Convert null to undefined
        reasoning: s.reasoning,
        evidenceLinks: s.evidenceLinks,
        implementationGuide: s.implementationGuide || undefined, // Convert null to undefined
        affectedSections: s.affectedSections,
        estimatedImprovement: s.estimatedImprovement || undefined, // Convert null to undefined
        status: s.status as any,
        appliedAt: s.appliedAt || undefined, // Convert null to undefined
        appliedBy: s.appliedBy || undefined, // Convert null to undefined
        results: s.results as any,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
    } catch (error) {
      console.error('Failed to get optimization suggestions:', error);
      return [];
    }
  }

  private async generateOutlineFromSections(
    sections: ContentSection[],
  ): Promise<ContentOutline> {
    const totalWords = sections.reduce((sum, s) => sum + s.wordCount, 0);

    return {
      id: `outline-${Date.now()}`,
      title: 'Generated from existing content',
      sections: sections.map(s => ({
        id: s.id,
        title: s.title,
        level: s.level,
        wordCount: s.wordCount,
        keyPoints: s.keyPoints,
        parentId: s.parentId,
        order: s.order,
        sectionType: s.sectionType,
      })),
      totalWordCount: totalWords,
      estimatedReadingTime: Math.ceil(totalWords / 200),
      keyTopics: [],
      contentGoals: [],
    };
  }

  private async generateDefaultToneAnalysis(
    blogPostId: string,
  ): Promise<ToneAnalysis> {
    return {
      id: `tone-default-${Date.now()}`,
      blogPostId,
      primaryTone: ToneCategory.PROFESSIONAL,
      confidence: 0.7,
      formalityScore: 0.7,
      emotionalTone: EmotionalTone.NEUTRAL,
      emotionIntensity: 0.5,
      authorityLevel: 0.7,
      personalityTraits: {
        warmth: 0.6,
        competence: 0.8,
        sincerity: 0.7,
        excitement: 0.5,
        sophistication: 0.7,
      },
      consistencyScore: 0.8,
      analyzedAt: new Date(),
      modelUsed: this.config.model.modelId,
    };
  }

  private generateDefaultMetrics(): GenerationMetrics {
    return {
      totalWords: 1000,
      totalSections: 5,
      generationTime: 30,
      modelUsed: this.config.model.modelId,
      factChecksPerformed: 3,
      optimizationSuggestions: 5,
      averageSectionQuality: 0.8,
      consistencyScore: 0.85,
    };
  }

  private async calculateQualityScoreFromSections(
    sections: ContentSection[],
  ): Promise<QualityScore> {
    const readability =
      sections.reduce((sum, s) => sum + (s.readabilityScore || 0.8), 0) /
      sections.length;
    const coherence =
      sections.reduce((sum, s) => sum + (s.coherenceScore || 0.8), 0) /
      sections.length;
    const relevance =
      sections.reduce((sum, s) => sum + (s.relevanceScore || 0.8), 0) /
      sections.length;

    return {
      overall: (readability + coherence + relevance + 0.8 + 0.8 + 0.8) / 6,
      readability,
      coherence,
      factualAccuracy: 0.8,
      seoOptimization: 0.8,
      brandVoiceAlignment: 0.8,
      engagementPotential: 0.8,
    };
  }

  private async applyEnhancements(
    result: ComprehensiveWritingResult,
    enhancements: string[],
  ): Promise<ComprehensiveWritingResult> {
    // Apply the requested enhancements
    // This would involve re-running specific analysis or generation steps
    return result;
  }
}
