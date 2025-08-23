

/**
 * Unified Advanced Writing Service
 * Orchestrates all Week 7-8 advanced writing features for comprehensive content generation and optimization
 */

import { LanguageModel } from 'ai';
import { PrismaClient } from '../generated/prisma-client';

import { MultiSectionGenerationService } from './multi-section-generation-service';
import { ToneStyleConsistencyService } from './tone-style-consistency-service';
import { FactCheckingService } from './fact-checking-service';
import { ContentOptimizationService } from './content-optimization-service';

import {
  MultiSectionGenerationRequest,
  SectionGenerationOptions,
  ToneAnalysisRequest,
  StyleCheckRequest,
  FactCheckRequest,
  OptimizationRequest,
  AdvancedWritingResult,
  ContentSection,
  ToneAnalysis,
  StyleCheck,
  FactCheck,
  OptimizationSuggestion,
  ContentMetrics,
  BrandVoiceProfile,
  ContentOutline
} from '../types/advanced-writing';

export interface AdvancedWritingConfig {
  model: LanguageModel;
  prisma?: PrismaClient;
  cacheResults?: boolean;
  cacheTTL?: number; // hours
  services?: {
    enableMultiSection?: boolean;
    enableToneStyle?: boolean;
    enableFactChecking?: boolean;
    enableOptimization?: boolean;
  };
  apiKeys?: {
    newsApi?: string;
    serpApi?: string;
    factCheckApi?: string;
  };
}

export interface ComprehensiveWritingRequest {
  // Content generation
  topic: string;
  targetLength?: number;
  contentType?: string;
  targetAudience?: string;
  
  // Multi-section generation
  outline?: ContentOutline;
  generateOutline?: boolean;
  contextAwareness?: boolean;
  includeTransitions?: boolean;
  
  // Tone and style
  targetTone?: string;
  targetStyle?: string;
  brandVoice?: BrandVoiceProfile;
  styleGuideId?: string;
  maintainConsistency?: boolean;
  
  // Fact-checking
  enableFactChecking?: boolean;
  verificationThreshold?: number;
  requireReliableSources?: boolean;
  autoDetectClaims?: boolean;
  
  // Optimization
  targetKeywords?: string[];
  optimizationCategories?: string[];
  prioritizeHighImpact?: boolean;
  includeABTestSuggestions?: boolean;
  
  // Quality requirements
  minQualityScore?: number;
  maxIterations?: number;
  
  // Advanced options
  streamResults?: boolean;
  generateReport?: boolean;
}

export interface StreamingCallback {
  onOutlineGenerated?: (outline: ContentOutline) => void;
  onSectionGenerated?: (section: ContentSection, index: number, total: number) => void;
  onToneAnalyzed?: (analysis: ToneAnalysis) => void;
  onFactChecked?: (factCheck: FactCheck, claimsRemaining: number) => void;
  onOptimizationGenerated?: (suggestion: OptimizationSuggestion) => void;
  onProgress?: (phase: string, progress: number) => void;
  onError?: (error: Error, phase: string) => void;
}

export class AdvancedWritingService {
  private multiSectionService: MultiSectionGenerationService;
  private toneStyleService: ToneStyleConsistencyService;
  private factCheckingService: FactCheckingService;
  private optimizationService: ContentOptimizationService;

  constructor(private config: AdvancedWritingConfig) {
    // Initialize sub-services
    this.multiSectionService = new MultiSectionGenerationService({
      model: config.model,
      prisma: config.prisma,
      cacheResults: config.cacheResults,
      cacheTTL: config.cacheTTL
    });

    this.toneStyleService = new ToneStyleConsistencyService({
      model: config.model,
      prisma: config.prisma,
      cacheResults: config.cacheResults,
      cacheTTL: config.cacheTTL
    });

    this.factCheckingService = new FactCheckingService({
      model: config.model,
      prisma: config.prisma,
      cacheResults: config.cacheResults,
      cacheTTL: config.cacheTTL,
      apiKeys: config.apiKeys
    });

    this.optimizationService = new ContentOptimizationService({
      model: config.model,
      prisma: config.prisma,
      cacheResults: config.cacheResults,
      cacheTTL: config.cacheTTL
    });
  }

  /**
   * Generate comprehensive blog content with all advanced writing features
   */
  async generateAdvancedContent(
    request: ComprehensiveWritingRequest,
    callbacks?: StreamingCallback
  ): Promise<AdvancedWritingResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let blogPostId = '';

    try {
      callbacks?.onProgress?.('initialization', 5);

      // Phase 1: Create or use existing outline
      let outline: ContentOutline;
      if (request.outline) {
        outline = request.outline;
      } else if (request.generateOutline !== false) {
        callbacks?.onProgress?.('outline_generation', 10);
        outline = await this.multiSectionService.createOutline({
          topic: request.topic,
          targetLength: request.targetLength,
          contentType: request.contentType,
          targetAudience: request.targetAudience,
          tone: request.targetTone,
          style: request.targetStyle,
          seoKeywords: request.targetKeywords
        });
        callbacks?.onOutlineGenerated?.(outline);
      } else {
        // Create minimal outline
        outline = this.createMinimalOutline(request.topic);
      }

      callbacks?.onProgress?.('content_generation', 20);

      // Phase 2: Generate multi-section content
      const generationResult = await this.multiSectionService.generateMultiSectionContent({
        outline,
        generationOptions: {
          tone: request.targetTone,
          style: request.targetStyle,
          targetAudience: request.targetAudience,
          maintainConsistency: request.maintainConsistency,
          seoOptimized: !!request.targetKeywords,
          includeTransitions: request.includeTransitions
        },
        brandVoice: request.brandVoice,
        contextAwareness: request.contextAwareness
      });

      const sections = generationResult.sections;
      
      // Notify about each section generation
      sections.forEach((section, index) => {
        callbacks?.onSectionGenerated?.(section, index + 1, sections.length);
      });

      // Create blog post record if Prisma is available
      if (this.config.prisma) {
        blogPostId = await this.createBlogPostRecord(request, sections);
      }

      callbacks?.onProgress?.('tone_analysis', 40);

      // Phase 3: Tone and style consistency analysis
      let toneAnalysis: ToneAnalysis | undefined;
      let styleCheck: StyleCheck | undefined;

      if (this.config.services?.enableToneStyle !== false) {
        try {
          const fullContent = sections.map(s => s.content).join('\n\n');
          
          toneAnalysis = await this.toneStyleService.analyzeTone({
            blogPostId,
            content: fullContent,
            brandVoice: request.brandVoice,
            analysisDepth: 'comprehensive'
          });
          callbacks?.onToneAnalyzed?.(toneAnalysis);

          styleCheck = await this.toneStyleService.performStyleCheck({
            blogPostId,
            styleGuideId: request.styleGuideId,
            brandVoice: request.brandVoice,
            checkConsistency: request.maintainConsistency
          });

        } catch (error) {
          console.error('Tone/Style analysis failed:', error);
          warnings.push('Tone and style analysis incomplete');
        }
      }

      callbacks?.onProgress?.('fact_checking', 60);

      // Phase 4: Fact-checking and source verification
      let factChecks: FactCheck[] = [];

      if (request.enableFactChecking && this.config.services?.enableFactChecking !== false) {
        try {
          factChecks = await this.factCheckingService.performFactCheck({
            blogPostId,
            autoDetectClaims: request.autoDetectClaims !== false,
            verificationThreshold: request.verificationThreshold || 0.7,
            includeSourceAnalysis: true,
            requireReliableSources: request.requireReliableSources !== false
          });

          factChecks.forEach((factCheck, index) => {
            callbacks?.onFactChecked?.(factCheck, factChecks.length - index - 1);
          });

        } catch (error) {
          console.error('Fact-checking failed:', error);
          warnings.push('Fact-checking incomplete');
        }
      }

      callbacks?.onProgress?.('optimization', 80);

      // Phase 5: Content optimization suggestions
      let optimizationSuggestions: OptimizationSuggestion[] = [];
      let metrics: ContentMetrics;

      if (this.config.services?.enableOptimization !== false) {
        try {
          const optimizationResult = await this.optimizationService.optimizeContent({
            blogPostId,
            targetKeywords: request.targetKeywords,
            prioritizeHighImpact: request.prioritizeHighImpact,
            includeImplementationGuide: true
          });

          optimizationSuggestions = optimizationResult.suggestions;
          metrics = optimizationResult.metrics;

          // Update metrics with data from other services
          if (toneAnalysis) {
            metrics.toneConsistencyScore = toneAnalysis.consistencyScore;
            metrics.brandAlignmentScore = toneAnalysis.brandVoiceScore;
          }

          if (factChecks.length > 0) {
            metrics.totalClaims = factChecks.length;
            metrics.verifiedClaims = factChecks.filter(fc => fc.verificationStatus === 'VERIFIED').length;
            metrics.disputedClaims = factChecks.filter(fc => fc.verificationStatus === 'DISPUTED' || fc.verificationStatus === 'FALSE').length;
            metrics.sourcesUsed = factChecks.reduce((sum, fc) => sum + fc.sourcesVerified, 0);
            metrics.reliableSources = factChecks.reduce((sum, fc) => sum + fc.sourcesReliable, 0);
            metrics.averageSourceCredibility = this.calculateAverageCredibility(factChecks);
          }

          metrics.sectionsGenerated = sections.length;
          metrics.totalGenerationTime = generationResult.metrics.totalGenerationTime;
          metrics.averageSectionTime = generationResult.metrics.averageSectionTime;
          metrics.coherenceScore = generationResult.metrics.coherenceScore;
          metrics.totalSuggestions = optimizationSuggestions.length;

          optimizationSuggestions.forEach(suggestion => {
            callbacks?.onOptimizationGenerated?.(suggestion);
          });

        } catch (error) {
          console.error('Content optimization failed:', error);
          warnings.push('Content optimization incomplete');
          // Create fallback metrics
          metrics = this.createFallbackMetrics(blogPostId, sections);
        }
      } else {
        metrics = this.createFallbackMetrics(blogPostId, sections);
      }

      callbacks?.onProgress?.('finalization', 95);

      // Phase 6: Quality assessment and iteration
      await this.performQualityAssessment(
        {
          sections,
          toneAnalysis,
          styleCheck,
          factChecks,
          optimizationSuggestions,
          metrics
        },
        request,
        warnings
      );

      callbacks?.onProgress?.('completed', 100);

      const processingTime = Date.now() - startTime;

      const result: AdvancedWritingResult = {
        blogPostId,
        sections,
        toneAnalysis,
        styleCheck,
        factChecks,
        optimizationSuggestions,
        metrics,
        processingTime,
        success: errors.length === 0,
        errors,
        warnings
      };

      // Generate comprehensive report if requested
      if (request.generateReport) {
        await this.generateComprehensiveReport(result);
      }

      return result;

    } catch (error) {
      console.error('Advanced content generation failed:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
      
      callbacks?.onError?.(error instanceof Error ? error : new Error('Unknown error'), 'generation');

      return {
        blogPostId,
        sections: [],
        metrics: this.createFallbackMetrics(blogPostId, []),
        processingTime: Date.now() - startTime,
        success: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Enhance existing content with advanced writing features
   */
  async enhanceExistingContent(
    blogPostId: string,
    enhancementOptions: {
      regenerateSections?: boolean;
      analyzeTone?: boolean;
      performFactCheck?: boolean;
      optimizeContent?: boolean;
      targetKeywords?: string[];
      brandVoice?: BrandVoiceProfile;
    }
  ): Promise<AdvancedWritingResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get existing content
      const existingContent = await this.getExistingContent(blogPostId);
      let sections = existingContent.sections;

      // Regenerate sections if requested
      if (enhancementOptions.regenerateSections && sections.length === 0) {
        const outline = await this.multiSectionService.createOutline({
          topic: existingContent.title || 'Content Enhancement',
          targetLength: existingContent.content.split(' ').length,
          tone: 'professional'
        });

        const generationResult = await this.multiSectionService.generateMultiSectionContent({
          blogPostId,
          outline,
          generationOptions: {
            tone: 'professional',
            maintainConsistency: true
          },
          brandVoice: enhancementOptions.brandVoice
        });

        sections = generationResult.sections;
      }

      // Perform tone analysis if requested
      let toneAnalysis: ToneAnalysis | undefined;
      if (enhancementOptions.analyzeTone) {
        toneAnalysis = await this.toneStyleService.analyzeTone({
          blogPostId,
          brandVoice: enhancementOptions.brandVoice,
          analysisDepth: 'detailed'
        });
      }

      // Perform fact-checking if requested
      let factChecks: FactCheck[] = [];
      if (enhancementOptions.performFactCheck) {
        factChecks = await this.factCheckingService.performFactCheck({
          blogPostId,
          autoDetectClaims: true
        });
      }

      // Generate optimization suggestions if requested
      let optimizationSuggestions: OptimizationSuggestion[] = [];
      if (enhancementOptions.optimizeContent) {
        const optimizationResult = await this.optimizationService.optimizeContent({
          blogPostId,
          targetKeywords: enhancementOptions.targetKeywords
        });
        optimizationSuggestions = optimizationResult.suggestions;
      }

      // Generate metrics
      const metrics = await this.generateEnhancementMetrics(
        blogPostId,
        sections,
        toneAnalysis,
        factChecks,
        optimizationSuggestions
      );

      return {
        blogPostId,
        sections,
        toneAnalysis,
        factChecks,
        optimizationSuggestions,
        metrics,
        processingTime: Date.now() - startTime,
        success: true,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Content enhancement failed:', error);
      errors.push(error instanceof Error ? error.message : 'Enhancement failed');

      return {
        blogPostId,
        sections: [],
        metrics: this.createFallbackMetrics(blogPostId, []),
        processingTime: Date.now() - startTime,
        success: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Generate comprehensive analytics and insights report
   */
  async generateInsightsReport(blogPostId: string): Promise<{
    overallScore: number;
    qualityBreakdown: {
      contentQuality: number;
      toneConsistency: number;
      factualAccuracy: number;
      seoOptimization: number;
      readability: number;
      engagement: number;
    };
    keyInsights: string[];
    recommendations: string[];
    benchmarks: {
      industryAverage: number;
      topPerformers: number;
      yourPerformance: number;
    };
    improvementPlan: {
      quickWins: Array<{ task: string; impact: string; effort: string }>;
      mediumTerm: Array<{ task: string; impact: string; effort: string }>;
      longTerm: Array<{ task: string; impact: string; effort: string }>;
    };
  }> {
    // Get all data for the blog post
    const [sections, toneAnalysis, factChecks, optimizationSuggestions, metrics] = await Promise.all([
      this.getSections(blogPostId),
      this.getToneAnalysis(blogPostId),
      this.getFactChecks(blogPostId),
      this.getOptimizationSuggestions(blogPostId),
      this.getMetrics(blogPostId)
    ]);

    // Calculate quality scores
    const qualityBreakdown = {
      contentQuality: (metrics?.overallQualityScore || 0.7) * 100,
      toneConsistency: (toneAnalysis?.consistencyScore || 0.8) * 100,
      factualAccuracy: this.calculateFactualAccuracy(factChecks),
      seoOptimization: metrics?.seoScore || 70,
      readability: metrics?.readabilityScore || 75,
      engagement: metrics?.engagementScore || 65
    };

    const overallScore = Object.values(qualityBreakdown).reduce((sum, score) => sum + score, 0) / Object.keys(qualityBreakdown).length;

    // Generate insights and recommendations
    const keyInsights = this.generateKeyInsights(qualityBreakdown, metrics);
    const recommendations = this.generateRecommendations(optimizationSuggestions, qualityBreakdown);

    // Create improvement plan
    const improvementPlan = this.createImprovementPlan(optimizationSuggestions);

    // Mock benchmarks (in practice, these would come from industry data)
    const benchmarks = {
      industryAverage: 72,
      topPerformers: 85,
      yourPerformance: overallScore
    };

    return {
      overallScore,
      qualityBreakdown,
      keyInsights,
      recommendations,
      benchmarks,
      improvementPlan
    };
  }

  /**
   * Batch process multiple blog posts with advanced writing features
   */
  async batchProcess(
    requests: ComprehensiveWritingRequest[],
    options?: {
      concurrency?: number;
      onProgress?: (completed: number, total: number) => void;
      onError?: (error: Error, requestIndex: number) => void;
    }
  ): Promise<AdvancedWritingResult[]> {
    const concurrency = options?.concurrency || 3;
    const results: AdvancedWritingResult[] = [];
    const errors: Array<{ index: number; error: Error }> = [];

    // Process in batches
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (request, batchIndex) => {
        const globalIndex = i + batchIndex;
        try {
          const result = await this.generateAdvancedContent(request);
          options?.onProgress?.(results.length + 1, requests.length);
          return { result, index: globalIndex };
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Unknown batch processing error');
          errors.push({ index: globalIndex, error: err });
          options?.onError?.(err, globalIndex);
          return { 
            result: {
              blogPostId: '',
              sections: [],
              metrics: this.createFallbackMetrics('', []),
              processingTime: 0,
              success: false,
              errors: [err.message],
              warnings: []
            } as AdvancedWritingResult, 
            index: globalIndex 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      // Add results in correct order
      batchResults.forEach(({ result, index }) => {
        results[index] = result;
      });
    }

    return results;
  }

  // Private helper methods

  private createMinimalOutline(topic: string): ContentOutline {
    return {
      id: `outline_minimal_${Date.now()}`,
      title: topic,
      sections: [
        {
          id: 'intro',
          title: 'Introduction',
          type: 'INTRODUCTION' as any,
          level: 1,
          order: 1,
          estimatedWordCount: 200,
          keyPoints: [],
          contextTags: []
        },
        {
          id: 'main',
          title: 'Main Content',
          type: 'PARAGRAPH' as any,
          level: 1,
          order: 2,
          estimatedWordCount: 800,
          keyPoints: [],
          contextTags: []
        },
        {
          id: 'conclusion',
          title: 'Conclusion',
          type: 'CONCLUSION' as any,
          level: 1,
          order: 3,
          estimatedWordCount: 150,
          keyPoints: [],
          contextTags: []
        }
      ]
    };
  }

  private async createBlogPostRecord(
    request: ComprehensiveWritingRequest,
    sections: ContentSection[]
  ): Promise<string> {
    if (!this.config.prisma) return `mock_post_${Date.now()}`;

    try {
      const fullContent = sections.map(s => s.content).join('\n\n');
      const wordCount = fullContent.split(/\s+/).length;

      const blogPost = await this.config.prisma.blogPost.create({
        data: {
          title: sections[0]?.title || request.topic,
          slug: this.generateSlug(sections[0]?.title || request.topic),
          content: fullContent,
          excerpt: fullContent.slice(0, 200) + '...',
          status: 'DRAFT',
          contentType: (request.contentType || 'BLOG').toUpperCase() as any,
          wordCount,
          focusKeyword: request.targetKeywords?.[0],
          keywords: request.targetKeywords || [],
          language: 'en'
        }
      });

      return blogPost.id;
    } catch (error) {
      console.error('Failed to create blog post record:', error);
      return `mock_post_${Date.now()}`;
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .slice(0, 50);
  }

  private async performQualityAssessment(
    content: {
      sections: ContentSection[];
      toneAnalysis?: ToneAnalysis;
      styleCheck?: StyleCheck;
      factChecks: FactCheck[];
      optimizationSuggestions: OptimizationSuggestion[];
      metrics: ContentMetrics;
    },
    request: ComprehensiveWritingRequest,
    warnings: string[]
  ): Promise<void> {
    const minQualityScore = request.minQualityScore || 0.7;
    
    if ((content.metrics.overallQualityScore || 0) < minQualityScore) {
      warnings.push(`Content quality score (${(content.metrics.overallQualityScore || 0).toFixed(2)}) below minimum threshold (${minQualityScore})`);
    }

    // Check for critical fact-checking issues
    const criticalFactIssues = content.factChecks.filter(fc => fc.requiresAttention).length;
    if (criticalFactIssues > 0) {
      warnings.push(`${criticalFactIssues} fact-checking issues require attention`);
    }

    // Check for tone consistency issues
    if (content.toneAnalysis && (content.toneAnalysis.consistencyScore || 0) < 0.7) {
      warnings.push('Tone consistency below recommended threshold');
    }

    // Check for high-priority optimization issues
    const criticalOptimizations = content.optimizationSuggestions.filter(s => s.impact === 'CRITICAL').length;
    if (criticalOptimizations > 0) {
      warnings.push(`${criticalOptimizations} critical optimization issues identified`);
    }
  }

  private async generateComprehensiveReport(result: AdvancedWritingResult): Promise<void> {
    // In a real implementation, this would generate a detailed report
    // For now, just log the summary
    console.log('=== COMPREHENSIVE CONTENT REPORT ===');
    console.log(`Blog Post ID: ${result.blogPostId}`);
    console.log(`Sections Generated: ${result.sections.length}`);
    console.log(`Processing Time: ${result.processingTime}ms`);
    console.log(`Overall Quality Score: ${result.metrics.overallQualityScore?.toFixed(2) || 'N/A'}`);
    console.log(`SEO Score: ${result.metrics.seoScore || 'N/A'}`);
    console.log(`Readability Score: ${result.metrics.readabilityScore || 'N/A'}`);
    console.log(`Engagement Score: ${result.metrics.engagementScore || 'N/A'}`);
    console.log(`Optimization Suggestions: ${result.optimizationSuggestions?.length || 0}`);
    console.log(`Fact Checks: ${result.factChecks?.length || 0}`);
    console.log(`Warnings: ${result.warnings?.join(', ') || 'None'}`);
    console.log('=====================================');
  }

  private createFallbackMetrics(blogPostId: string, sections: ContentSection[]): ContentMetrics {
    return {
      id: `metrics_fallback_${Date.now()}`,
      blogPostId,
      sectionsGenerated: sections.length,
      overallQualityScore: 0.7,
      coherenceScore: 0.8,
      consistencyScore: 0.8,
      originalityScore: 0.9,
      toneConsistencyScore: 0.8,
      brandAlignmentScore: 0.7,
      totalClaims: 0,
      verifiedClaims: 0,
      disputedClaims: 0,
      sourcesUsed: 0,
      reliableSources: 0,
      seoScore: 70,
      readabilityScore: 75,
      engagementScore: 65,
      totalSuggestions: 0,
      implementedSuggestions: 0,
      measuredAt: new Date()
    };
  }

  private calculateAverageCredibility(factChecks: FactCheck[]): number {
    if (factChecks.length === 0) return 0;
    
    const totalCredibility = factChecks.reduce((sum, fc) => sum + (fc.sourceCredibility || 0), 0);
    return totalCredibility / factChecks.length;
  }

  private async getExistingContent(blogPostId: string): Promise<{
    title?: string;
    content: string;
    sections: ContentSection[];
  }> {
    if (!this.config.prisma) {
      throw new Error('Prisma required for getting existing content');
    }

    const [blogPost, sections] = await Promise.all([
      this.config.prisma.blogPost.findUnique({
        where: { id: blogPostId }
      }),
      this.config.prisma.contentSection.findMany({
        where: { blogPostId },
        orderBy: { order: 'asc' }
      })
    ]);

    if (!blogPost) {
      throw new Error('Blog post not found');
    }

    return {
      title: blogPost.title,
      content: blogPost.content,
      sections: sections.map(s => ({
        id: s.id,
        blogPostId: s.blogPostId,
        title: s.title,
        content: s.content,
        sectionType: s.sectionType as any,
        order: s.order,
        level: s.level,
        parentId: s.parentId,
        wordCount: s.wordCount,
        keyPoints: s.keyPoints,
        contextTags: s.contextTags,
        promptUsed: s.promptUsed,
        modelUsed: s.modelUsed,
        generationContext: s.generationContext as any,
        generatedAt: s.generatedAt,
        readabilityScore: s.readabilityScore,
        coherenceScore: s.coherenceScore,
        relevanceScore: s.relevanceScore,
        children: [],
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }))
    };
  }

  private async generateEnhancementMetrics(
    blogPostId: string,
    sections: ContentSection[],
    toneAnalysis?: ToneAnalysis,
    factChecks?: FactCheck[],
    optimizationSuggestions?: OptimizationSuggestion[]
  ): Promise<ContentMetrics> {
    const baseMetrics = this.createFallbackMetrics(blogPostId, sections);

    if (toneAnalysis) {
      baseMetrics.toneConsistencyScore = toneAnalysis.consistencyScore;
      baseMetrics.brandAlignmentScore = toneAnalysis.brandVoiceScore;
    }

    if (factChecks && factChecks.length > 0) {
      baseMetrics.totalClaims = factChecks.length;
      baseMetrics.verifiedClaims = factChecks.filter(fc => fc.verificationStatus === 'VERIFIED').length;
      baseMetrics.disputedClaims = factChecks.filter(fc => fc.verificationStatus === 'DISPUTED' || fc.verificationStatus === 'FALSE').length;
      baseMetrics.sourcesUsed = factChecks.reduce((sum, fc) => sum + fc.sourcesVerified, 0);
      baseMetrics.reliableSources = factChecks.reduce((sum, fc) => sum + fc.sourcesReliable, 0);
      baseMetrics.averageSourceCredibility = this.calculateAverageCredibility(factChecks);
    }

    if (optimizationSuggestions) {
      baseMetrics.totalSuggestions = optimizationSuggestions.length;
    }

    return baseMetrics;
  }

  // Database helper methods

  private async getSections(blogPostId: string): Promise<ContentSection[]> {
    if (!this.config.prisma) return [];

    try {
      const sections = await this.config.prisma.contentSection.findMany({
        where: { blogPostId },
        orderBy: { order: 'asc' }
      });

      return sections.map(s => ({
        id: s.id,
        blogPostId: s.blogPostId,
        title: s.title,
        content: s.content,
        sectionType: s.sectionType as any,
        order: s.order,
        level: s.level,
        parentId: s.parentId,
        wordCount: s.wordCount,
        keyPoints: s.keyPoints,
        contextTags: s.contextTags,
        promptUsed: s.promptUsed,
        modelUsed: s.modelUsed,
        generationContext: s.generationContext as any,
        generatedAt: s.generatedAt,
        readabilityScore: s.readabilityScore,
        coherenceScore: s.coherenceScore,
        relevanceScore: s.relevanceScore,
        children: [],
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }));
    } catch (error) {
      console.error('Failed to get sections:', error);
      return [];
    }
  }

  private async getToneAnalysis(blogPostId: string): Promise<ToneAnalysis | undefined> {
    if (!this.config.prisma) return undefined;

    try {
      const analysis = await this.config.prisma.toneAnalysis.findFirst({
        where: { blogPostId },
        orderBy: { analyzedAt: 'desc' }
      });

      if (!analysis) return undefined;

      return {
        id: analysis.id,
        blogPostId: analysis.blogPostId,
        sectionId: analysis.sectionId,
        primaryTone: analysis.primaryTone as any,
        secondaryTones: analysis.secondaryTones as any,
        confidence: analysis.confidence,
        formalityScore: analysis.formalityScore,
        emotionalTone: analysis.emotionalTone as any,
        emotionIntensity: analysis.emotionIntensity,
        authorityLevel: analysis.authorityLevel,
        personalityTraits: analysis.personalityTraits as Record<string, number>,
        brandVoiceScore: analysis.brandVoiceScore,
        consistencyScore: analysis.consistencyScore,
        deviations: analysis.deviations as any,
        analyzedAt: analysis.analyzedAt,
        modelUsed: analysis.modelUsed
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
        include: { citations: true }
      });

      return factChecks.map(fc => ({
        id: fc.id,
        blogPostId: fc.blogPostId,
        claim: fc.claim,
        sectionId: fc.sectionId,
        startPosition: fc.startPosition,
        endPosition: fc.endPosition,
        verificationStatus: fc.verificationStatus as any,
        confidenceScore: fc.confidenceScore,
        evidenceQuality: fc.evidenceQuality,
        sourceUrls: fc.sourceUrls,
        sourcesVerified: fc.sourcesVerified,
        sourcesReliable: fc.sourcesReliable,
        sourceCredibility: fc.sourceCredibility,
        verificationMethod: fc.verificationMethod,
        verificationNotes: fc.verificationNotes,
        verifiedAt: fc.verifiedAt,
        verifiedBy: fc.verifiedBy,
        requiresAttention: fc.requiresAttention,
        flagReason: fc.flagReason,
        createdAt: fc.createdAt,
        updatedAt: fc.updatedAt,
        citations: fc.citations.map(c => ({
          id: c.id,
          blogPostId: c.blogPostId,
          factCheckId: c.factCheckId,
          title: c.title,
          url: c.url,
          author: c.author,
          publishedDate: c.publishedDate,
          accessedDate: c.accessedDate,
          sourceType: c.sourceType as any,
          domain: c.domain,
          language: c.language,
          credibilityScore: c.credibilityScore,
          authorityScore: c.authorityScore,
          biasRating: c.biasRating as any,
          expertiseLevel: c.expertiseLevel as any,
          citationContext: c.citationContext,
          quote: c.quote,
          pageNumber: c.pageNumber,
          isPeerReviewed: c.isPeerReviewed,
          isGovernment: c.isGovernment,
          isAcademic: c.isAcademic,
          isRecent: c.isRecent,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt
        }))
      }));
    } catch (error) {
      console.error('Failed to get fact checks:', error);
      return [];
    }
  }

  private async getOptimizationSuggestions(blogPostId: string): Promise<OptimizationSuggestion[]> {
    if (!this.config.prisma) return [];

    try {
      const suggestions = await this.config.prisma.optimizationSuggestion.findMany({
        where: { blogPostId },
        orderBy: { priority: 'desc' }
      });

      return suggestions.map(s => ({
        id: s.id,
        blogPostId: s.blogPostId,
        category: s.category as any,
        title: s.title,
        description: s.description,
        impact: s.impact as any,
        effort: s.effort as any,
        priority: s.priority,
        currentValue: s.currentValue,
        suggestedValue: s.suggestedValue,
        beforeText: s.beforeText,
        afterText: s.afterText,
        position: s.position,
        seoImpact: s.seoImpact,
        keywordTarget: s.keywordTarget,
        readabilityImpact: s.readabilityImpact,
        engagementMetric: s.engagementMetric,
        expectedLift: s.expectedLift,
        isImplemented: s.isImplemented,
        implementedAt: s.implementedAt,
        implementedBy: s.implementedBy,
        isValidated: s.isValidated,
        validationScore: s.validationScore,
        actualImpact: s.actualImpact,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }));
    } catch (error) {
      console.error('Failed to get optimization suggestions:', error);
      return [];
    }
  }

  private async getMetrics(blogPostId: string): Promise<ContentMetrics | undefined> {
    if (!this.config.prisma) return undefined;

    try {
      const metrics = await this.config.prisma.contentMetrics.findFirst({
        where: { blogPostId },
        orderBy: { measuredAt: 'desc' }
      });

      if (!metrics) return undefined;

      return {
        id: metrics.id,
        blogPostId: metrics.blogPostId,
        sectionsGenerated: metrics.sectionsGenerated,
        totalGenerationTime: metrics.totalGenerationTime,
        averageSectionTime: metrics.averageSectionTime,
        overallQualityScore: metrics.overallQualityScore,
        coherenceScore: metrics.coherenceScore,
        consistencyScore: metrics.consistencyScore,
        originalityScore: metrics.originalityScore,
        toneConsistencyScore: metrics.toneConsistencyScore,
        brandAlignmentScore: metrics.brandAlignmentScore,
        totalClaims: metrics.totalClaims,
        verifiedClaims: metrics.verifiedClaims,
        disputedClaims: metrics.disputedClaims,
        sourcesUsed: metrics.sourcesUsed,
        reliableSources: metrics.reliableSources,
        averageSourceCredibility: metrics.averageSourceCredibility,
        seoScore: metrics.seoScore,
        readabilityScore: metrics.readabilityScore,
        engagementScore: metrics.engagementScore,
        totalSuggestions: metrics.totalSuggestions,
        implementedSuggestions: metrics.implementedSuggestions,
        measuredAt: metrics.measuredAt
      };
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return undefined;
    }
  }

  // Analysis helper methods

  private calculateFactualAccuracy(factChecks: FactCheck[]): number {
    if (factChecks.length === 0) return 85; // Default score when no fact-checking performed
    
    const verified = factChecks.filter(fc => fc.verificationStatus === 'VERIFIED').length;
    const total = factChecks.length;
    
    return (verified / total) * 100;
  }

  private generateKeyInsights(qualityBreakdown: any, metrics?: ContentMetrics): string[] {
    const insights: string[] = [];
    
    // Find strongest and weakest areas
    const scores = Object.entries(qualityBreakdown) as Array<[string, number]>;
    const strongest = scores.reduce((a, b) => a[1] > b[1] ? a : b);
    const weakest = scores.reduce((a, b) => a[1] < b[1] ? a : b);
    
    insights.push(`Strongest area: ${strongest[0]} (${strongest[1].toFixed(1)}%)`);
    insights.push(`Area needing improvement: ${weakest[0]} (${weakest[1].toFixed(1)}%)`);
    
    if (qualityBreakdown.seoOptimization > 80) {
      insights.push('Excellent SEO optimization - likely to rank well');
    }
    
    if (qualityBreakdown.readability < 70) {
      insights.push('Content may be difficult for average readers');
    }
    
    if (qualityBreakdown.engagement < 70) {
      insights.push('Content could benefit from more engaging elements');
    }
    
    return insights;
  }

  private generateRecommendations(
    optimizationSuggestions: OptimizationSuggestion[],
    qualityBreakdown: any
  ): string[] {
    const recommendations: string[] = [];
    
    // High-priority suggestions
    const criticalSuggestions = optimizationSuggestions.filter(s => s.impact === 'CRITICAL');
    if (criticalSuggestions.length > 0) {
      recommendations.push(`Address ${criticalSuggestions.length} critical optimization issues immediately`);
    }
    
    // Area-specific recommendations
    if (qualityBreakdown.seoOptimization < 75) {
      recommendations.push('Focus on SEO improvements: optimize title, meta description, and keyword usage');
    }
    
    if (qualityBreakdown.readability < 75) {
      recommendations.push('Improve readability: shorten sentences and simplify vocabulary');
    }
    
    if (qualityBreakdown.engagement < 75) {
      recommendations.push('Enhance engagement: add more questions, examples, and interactive elements');
    }
    
    if (qualityBreakdown.factualAccuracy < 90) {
      recommendations.push('Strengthen fact-checking and add more reliable sources');
    }
    
    return recommendations;
  }

  private createImprovementPlan(optimizationSuggestions: OptimizationSuggestion[]): any {
    const quickWins = optimizationSuggestions
      .filter(s => s.effort === 'LOW' && s.impact !== 'LOW')
      .slice(0, 3)
      .map(s => ({
        task: s.title,
        impact: s.impact,
        effort: s.effort
      }));
    
    const mediumTerm = optimizationSuggestions
      .filter(s => s.effort === 'MEDIUM')
      .slice(0, 3)
      .map(s => ({
        task: s.title,
        impact: s.impact,
        effort: s.effort
      }));
    
    const longTerm = optimizationSuggestions
      .filter(s => s.effort === 'HIGH' || s.impact === 'CRITICAL')
      .slice(0, 3)
      .map(s => ({
        task: s.title,
        impact: s.impact,
        effort: s.effort
      }));
    
    return {
      quickWins,
      mediumTerm,
      longTerm
    };
  }
}

