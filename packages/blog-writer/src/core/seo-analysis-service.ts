

/**
 * Unified SEO Analysis Service
 * Orchestrates all Week 9-10 SEO features: DataForSEO integration, keyword research,
 * on-page optimization, meta/schema generation, and readability scoring
 */

import { LanguageModel } from 'ai';
import { PrismaClient } from '../generated/prisma-client';
import { DataForSEOService } from './dataforseo-service';
import { KeywordResearchService } from './keyword-research-service';
import { OnPageSEOService } from './onpage-seo-service';
import { MetaSchemaService } from './meta-schema-service';
import { ReadabilityScoringService } from './readability-scoring-service';
import {
  DataForSEOConfig,
  SEOAnalysisRequest,
  SEOAnalysisResult,
  KeywordResearchRequest,
  OnPageSEOAnalysis,
  MetaTagSuggestions,
  SchemaMarkup,
  ReadabilityMetrics,
  ContentQualityScore,
  SEORecommendation,
  SEORecommendationType,
  CompetitorAnalysis
} from '../types/seo-engine';

export interface SEOAnalysisConfig {
  model: LanguageModel;
  prisma?: PrismaClient;
  dataForSEOConfig?: DataForSEOConfig;
  defaultOrganization?: {
    name: string;
    logo: string;
    url: string;
  };
  defaultSite?: {
    name: string;
    url: string;
    twitterHandle?: string;
  };
  cacheResults?: boolean;
  cacheTTL?: number; // hours
  enableAllFeatures?: boolean;
  qualityGates?: {
    minimumScore?: number; // Minimum overall SEO score required
    minimumReadability?: number; // Minimum readability score
    minimumContentLength?: number; // Minimum word count
    requireMetaDescription?: boolean;
    requireKeywordOptimization?: boolean;
  };
}

export interface SEOAnalysisOptions {
  includeKeywordResearch?: boolean;
  includeCompetitorAnalysis?: boolean;
  includeSchemaGeneration?: boolean;
  includeReadabilityAnalysis?: boolean;
  includeMetaGeneration?: boolean;
  useDataForSEO?: boolean;
  prioritizeQuickWins?: boolean;
  targetAudience?: string;
  contentType?: string;
}

export interface StreamingCallbacks {
  onKeywordAnalysis?: (keywords: any[]) => void;
  onOnPageAnalysis?: (analysis: OnPageSEOAnalysis) => void;
  onMetaGeneration?: (metaTags: MetaTagSuggestions) => void;
  onSchemaGeneration?: (schema: SchemaMarkup) => void;
  onReadabilityAnalysis?: (metrics: ReadabilityMetrics) => void;
  onQualityScoring?: (score: ContentQualityScore) => void;
  onCompetitorAnalysis?: (analysis: CompetitorAnalysis) => void;
  onRecommendations?: (recommendations: SEORecommendation[]) => void;
  onProgress?: (step: string, progress: number) => void;
  onComplete?: (result: SEOAnalysisResult) => void;
  onError?: (error: string) => void;
}

/**
 * Unified SEO Analysis Service
 * Comprehensive SEO analysis orchestrating all Week 9-10 features
 */
export class SEOAnalysisService {
  private config: SEOAnalysisConfig;
  private dataForSEOService?: DataForSEOService;
  private keywordResearchService: KeywordResearchService;
  private onPageSEOService: OnPageSEOService;
  private metaSchemaService: MetaSchemaService;
  private readabilityScoringService: ReadabilityScoringService;

  constructor(config: SEOAnalysisConfig) {
    this.config = {
      cacheResults: true,
      cacheTTL: 24, // 24 hours default
      enableAllFeatures: true,
      qualityGates: {
        minimumScore: 70,
        minimumReadability: 60,
        minimumContentLength: 300,
        requireMetaDescription: true,
        requireKeywordOptimization: true
      },
      ...config
    };

    // Initialize DataForSEO service if configured
    if (config.dataForSEOConfig) {
      this.dataForSEOService = new DataForSEOService({
        config: config.dataForSEOConfig,
        model: config.model,
        prisma: config.prisma,
        enableCaching: config.cacheResults
      });
    }

    // Initialize all core services
    this.keywordResearchService = new KeywordResearchService({
      model: config.model,
      prisma: config.prisma,
      dataForSEOConfig: config.dataForSEOConfig,
      cacheResults: config.cacheResults,
      cacheTTL: config.cacheTTL
    });

    this.onPageSEOService = new OnPageSEOService({
      model: config.model,
      prisma: config.prisma,
      cacheResults: config.cacheResults,
      cacheTTL: config.cacheTTL
    });

    this.metaSchemaService = new MetaSchemaService({
      model: config.model,
      prisma: config.prisma,
      defaultOrganization: config.defaultOrganization,
      defaultSite: config.defaultSite,
      cacheResults: config.cacheResults,
      cacheTTL: config.cacheTTL
    });

    this.readabilityScoringService = new ReadabilityScoringService({
      model: config.model,
      prisma: config.prisma,
      cacheResults: config.cacheResults,
      cacheTTL: config.cacheTTL
    });
  }

  /**
   * Perform comprehensive SEO analysis
   */
  async analyzeSEO(
    request: SEOAnalysisRequest,
    options: SEOAnalysisOptions = {},
    callbacks?: StreamingCallbacks
  ): Promise<SEOAnalysisResult> {
    const startTime = Date.now();
    const analysisId = `seo_analysis_${Date.now()}`;

    try {
      callbacks?.onProgress?.('Starting SEO Analysis', 0);

      // Set default options
      const analysisOptions: Required<SEOAnalysisOptions> = {
        includeKeywordResearch: true,
        includeCompetitorAnalysis: true,
        includeSchemaGeneration: true,
        includeReadabilityAnalysis: true,
        includeMetaGeneration: true,
        useDataForSEO: !!this.dataForSEOService,
        prioritizeQuickWins: true,
        targetAudience: 'general',
        contentType: 'blog',
        ...options
      };

      // Get content from request
      const content = request.content || await this.getContentFromBlogPost(request.blogPostId);
      if (!content) {
        throw new Error('Content not found');
      }

      const results: Partial<SEOAnalysisResult> = {
        id: analysisId,
        blogPostId: request.blogPostId,
        url: request.url,
        analyzedAt: new Date(),
        dataSource: analysisOptions.useDataForSEO ? 'dataforseo' : 'ai_analysis'
      };

      // Step 1: Keyword Analysis
      callbacks?.onProgress?.('Analyzing Keywords', 15);
      let keywordAnalysis: any[] = [];
      if (analysisOptions.includeKeywordResearch && request.targetKeywords) {
        try {
          const keywordRequest: KeywordResearchRequest = {
            seedKeywords: request.targetKeywords,
            maxResults: 50,
            includeVariations: true,
            includeLongTail: true,
            competitorAnalysis: analysisOptions.includeCompetitorAnalysis
          };
          
          const keywordResponse = await this.keywordResearchService.performKeywordResearch(keywordRequest);
          keywordAnalysis = keywordResponse.keywords;
          callbacks?.onKeywordAnalysis?.(keywordAnalysis);
        } catch (error) {
          console.warn('Keyword analysis failed:', error);
        }
      }
      results.keywordAnalysis = keywordAnalysis;

      // Step 2: On-Page SEO Analysis
      callbacks?.onProgress?.('Analyzing On-Page SEO', 30);
      let onPageAnalysis: OnPageSEOAnalysis;
      try {
        onPageAnalysis = await this.onPageSEOService.analyzeOnPageSEO({
          content: content.content,
          title: content.title,
          metaDescription: content.metaDescription,
          url: request.url,
          targetKeywords: request.targetKeywords,
          images: content.images || [],
          links: content.links || []
        });
        callbacks?.onOnPageAnalysis?.(onPageAnalysis);
      } catch (error) {
        console.warn('On-page analysis failed:', error);
        onPageAnalysis = this.getDefaultOnPageAnalysis();
      }
      results.onPageSEO = onPageAnalysis;

      // Step 3: Meta Tags Generation
      callbacks?.onProgress?.('Generating Meta Tags', 45);
      let metaTags: MetaTagSuggestions;
      if (analysisOptions.includeMetaGeneration) {
        try {
          metaTags = await this.metaSchemaService.generateMetaTags({
            title: content.title,
            content: content.content,
            excerpt: content.excerpt,
            author: content.author,
            publishDate: content.publishDate,
            image: content.image,
            url: request.url,
            keywords: request.targetKeywords,
            category: content.category
          });
          callbacks?.onMetaGeneration?.(metaTags);
        } catch (error) {
          console.warn('Meta tag generation failed:', error);
          metaTags = this.getDefaultMetaTags(content);
        }
      } else {
        metaTags = this.getDefaultMetaTags(content);
      }
      results.metaTags = metaTags;

      // Step 4: Schema Markup Generation
      callbacks?.onProgress?.('Generating Schema Markup', 60);
      let schemaMarkup: SchemaMarkup;
      if (analysisOptions.includeSchemaGeneration) {
        try {
          schemaMarkup = await this.metaSchemaService.generateSchemaMarkup({
            contentType: analysisOptions.contentType as any,
            title: content.title,
            description: content.excerpt || content.content.substring(0, 160),
            author: content.author?.name,
            publishDate: content.publishDate,
            modifiedDate: content.modifiedDate,
            image: content.image,
            url: request.url,
            organization: this.config.defaultOrganization
          });
          callbacks?.onSchemaGeneration?.(schemaMarkup);
        } catch (error) {
          console.warn('Schema generation failed:', error);
          schemaMarkup = this.getDefaultSchema(content);
        }
      } else {
        schemaMarkup = this.getDefaultSchema(content);
      }
      results.schemaMarkup = schemaMarkup;

      // Step 5: Readability Analysis
      callbacks?.onProgress?.('Analyzing Readability', 75);
      let readabilityMetrics: ReadabilityMetrics;
      if (analysisOptions.includeReadabilityAnalysis) {
        try {
          readabilityMetrics = await this.readabilityScoringService.analyzeReadability({
            content: content.content,
            targetAudience: analysisOptions.targetAudience,
            includeSuggestions: true
          });
          callbacks?.onReadabilityAnalysis?.(readabilityMetrics);
        } catch (error) {
          console.warn('Readability analysis failed:', error);
          readabilityMetrics = this.getDefaultReadabilityMetrics();
        }
      } else {
        readabilityMetrics = this.getDefaultReadabilityMetrics();
      }
      results.readabilityScore = readabilityMetrics;

      // Step 6: Content Quality Scoring
      callbacks?.onProgress?.('Calculating Quality Score', 85);
      let contentQuality: ContentQualityScore;
      try {
        contentQuality = await this.readabilityScoringService.calculateContentQuality({
          title: content.title,
          content: content.content,
          targetKeywords: request.targetKeywords,
          targetAudience: analysisOptions.targetAudience,
          contentType: analysisOptions.contentType,
          images: content.images?.length || 0,
          links: content.links ? {
            internal: content.links.filter(l => l.internal).length,
            external: content.links.filter(l => !l.internal).length
          } : { internal: 0, external: 0 }
        });
        callbacks?.onQualityScoring?.(contentQuality);
      } catch (error) {
        console.warn('Content quality scoring failed:', error);
        contentQuality = this.getDefaultContentQuality();
      }
      results.contentQuality = contentQuality;

      // Step 7: Competitor Analysis (if requested)
      if (analysisOptions.includeCompetitorAnalysis && request.competitorUrls && this.dataForSEOService) {
        callbacks?.onProgress?.('Analyzing Competitors', 90);
        try {
          const competitorResponse = await this.dataForSEOService.analyzeCompetitors(
            request.targetKeywords?.[0] || content.title,
            request.competitorUrls
          );
          if (competitorResponse.success && competitorResponse.data) {
            results.competitorAnalysis = competitorResponse.data;
            callbacks?.onCompetitorAnalysis?.(competitorResponse.data);
          }
        } catch (error) {
          console.warn('Competitor analysis failed:', error);
        }
      }

      // Step 8: Calculate Aggregate Scores
      callbacks?.onProgress?.('Calculating Final Scores', 95);
      const categoryScores = {
        onPage: onPageAnalysis.overallScore,
        technical: onPageAnalysis.technical.score,
        content: contentQuality.overall,
        keywords: keywordAnalysis.length > 0 ? 75 : 50,
        mobile: onPageAnalysis.technical.mobile.score
      };

      const overallScore = this.calculateOverallScore(categoryScores, contentQuality);
      results.overallScore = overallScore;
      results.categoryScores = categoryScores;

      // Step 9: Generate Comprehensive Recommendations
      const recommendations = await this.generateComprehensiveRecommendations(
        results as SEOAnalysisResult,
        analysisOptions
      );
      
      const quickWins = analysisOptions.prioritizeQuickWins ? 
        this.identifyQuickWins(recommendations) : [];

      results.recommendations = recommendations;
      results.quickWins = quickWins;
      callbacks?.onRecommendations?.(recommendations);

      // Step 10: Apply Quality Gates
      const qualityGateResults = this.applyQualityGates(results as SEOAnalysisResult);
      if (!qualityGateResults.passed) {
        console.warn('Quality gates failed:', qualityGateResults.failedGates);
      }

      // Calculate processing time
      results.processingTime = Date.now() - startTime;
      results.model = this.config.model.modelId || 'unknown';

      callbacks?.onProgress?.('Analysis Complete', 100);
      
      const finalResult = results as SEOAnalysisResult;
      callbacks?.onComplete?.(finalResult);

      // Save results to database if enabled
      if (this.config.prisma) {
        await this.saveAnalysisResults(finalResult);
      }

      return finalResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      callbacks?.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Perform quick SEO health check
   */
  async quickSEOHealthCheck(blogPostId: string): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const content = await this.getContentFromBlogPost(blogPostId);
      if (!content) {
        return { score: 0, issues: ['Content not found'], recommendations: [] };
      }

      const issues: string[] = [];
      const recommendations: string[] = [];
      let score = 100;

      // Check title
      if (!content.title || content.title.length < 30) {
        issues.push('Title too short');
        recommendations.push('Create a compelling title with 30-60 characters');
        score -= 15;
      }

      // Check meta description
      if (!content.metaDescription) {
        issues.push('Missing meta description');
        recommendations.push('Add a meta description with 150-160 characters');
        score -= 20;
      }

      // Check content length
      const wordCount = this.countWords(content.content);
      if (wordCount < 300) {
        issues.push('Content too short');
        recommendations.push('Expand content to at least 800 words for better SEO');
        score -= 25;
      }

      // Check headings
      if (!content.content.includes('#')) {
        issues.push('No headings found');
        recommendations.push('Add H1, H2, H3 headings to structure content');
        score -= 15;
      }

      return {
        score: Math.max(0, score),
        issues,
        recommendations
      };

    } catch (error) {
      return {
        score: 0,
        issues: ['Analysis failed'],
        recommendations: ['Please try again later']
      };
    }
  }

  /**
   * Generate SEO improvement roadmap
   */
  async generateSEOImprovementRoadmap(analysisResult: SEOAnalysisResult): Promise<{
    quickWins: SEORecommendation[];
    shortTerm: SEORecommendation[];
    longTerm: SEORecommendation[];
    estimatedImpact: number;
  }> {
    const recommendations = analysisResult.recommendations;
    
    const quickWins = recommendations.filter(r => 
      r.effort === 'easy' && r.impact >= 70
    ).slice(0, 5);

    const shortTerm = recommendations.filter(r => 
      r.effort === 'moderate' && r.impact >= 60
    ).slice(0, 8);

    const longTerm = recommendations.filter(r => 
      r.effort === 'difficult' || (r.effort === 'moderate' && r.impact < 60)
    ).slice(0, 10);

    const estimatedImpact = this.calculateEstimatedImpact(recommendations);

    return {
      quickWins,
      shortTerm,
      longTerm,
      estimatedImpact
    };
  }

  /**
   * Private helper methods
   */

  private async getContentFromBlogPost(blogPostId: string): Promise<any> {
    if (!this.config.prisma) {
      throw new Error('Database not configured');
    }

    try {
      const blogPost = await this.config.prisma.blogPost.findUnique({
        where: { id: blogPostId },
        include: {
          media: true,
          ctas: true
        }
      });

      if (!blogPost) {
        return null;
      }

      return {
        title: blogPost.title,
        content: blogPost.content,
        metaDescription: blogPost.metaDescription,
        excerpt: blogPost.excerpt,
        author: {
          name: blogPost.authorName || 'Unknown',
          email: blogPost.authorEmail
        },
        publishDate: blogPost.publishedAt?.toISOString(),
        modifiedDate: blogPost.updatedAt.toISOString(),
        image: blogPost.featuredImageUrl,
        category: blogPost.category,
        images: blogPost.media?.filter(m => m.type === 'image').map(m => ({
          src: m.url,
          alt: m.alt,
          caption: m.caption
        })) || [],
        links: [] // Would need to extract from content
      };

    } catch (error) {
      console.error('Failed to fetch blog post:', error);
      return null;
    }
  }

  private calculateOverallScore(categoryScores: any, contentQuality: ContentQualityScore): number {
    const weights = {
      onPage: 0.25,
      technical: 0.20,
      content: 0.25,
      keywords: 0.20,
      mobile: 0.10
    };

    return Object.entries(categoryScores).reduce((total, [category, score]) => {
      return total + (score * (weights[category as keyof typeof weights] || 0));
    }, 0);
  }

  private async generateComprehensiveRecommendations(
    result: SEOAnalysisResult,
    options: Required<SEOAnalysisOptions>
  ): Promise<SEORecommendation[]> {
    const recommendations: SEORecommendation[] = [];
    let recId = 1;

    // On-page recommendations
    if (result.onPageSEO.recommendations) {
      recommendations.push(...result.onPageSEO.recommendations);
    }

    // Content quality recommendations
    if (result.contentQuality.recommendations) {
      recommendations.push(...result.contentQuality.recommendations.map(r => ({
        id: `rec_${recId++}`,
        type: SEORecommendationType.CONTENT_LENGTH, // Map based on category
        priority: r.priority,
        category: r.category,
        title: r.title,
        description: r.description,
        impact: r.impact,
        effort: r.effort,
        timeframe: this.getTimeframeFromEffort(r.effort),
        implementation: r.action,
        resources: []
      })));
    }

    // Keyword optimization recommendations
    if (result.keywordAnalysis.length === 0) {
      recommendations.push({
        id: `rec_${recId++}`,
        type: SEORecommendationType.KEYWORD_OPTIMIZATION,
        priority: 'high',
        category: 'keywords',
        title: 'Perform Keyword Research',
        description: 'No keyword analysis available for content optimization',
        impact: 85,
        effort: 'moderate',
        timeframe: '2-4 hours',
        implementation: 'Conduct keyword research and optimize content accordingly',
        resources: ['Keyword research tools', 'Competitor analysis']
      });
    }

    // Readability recommendations
    if (result.readabilityScore.suggestions) {
      recommendations.push(...result.readabilityScore.suggestions.map(s => ({
        id: `rec_${recId++}`,
        type: SEORecommendationType.READABILITY,
        priority: s.impact === 'high' ? 'high' as const : 'medium' as const,
        category: 'content' as const,
        title: `Improve ${s.type.replace('_', ' ')}`,
        description: s.description,
        impact: s.impact === 'high' ? 80 : 60,
        effort: 'moderate' as const,
        timeframe: '1-2 hours',
        implementation: s.description,
        resources: s.examples || []
      })));
    }

    // Sort by priority and impact
    return recommendations.sort((a, b) => {
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.impact - a.impact;
    });
  }

  private identifyQuickWins(recommendations: SEORecommendation[]): SEORecommendation[] {
    return recommendations
      .filter(r => r.effort === 'easy' && r.impact >= 60)
      .slice(0, 5);
  }

  private applyQualityGates(result: SEOAnalysisResult): { passed: boolean; failedGates: string[] } {
    const gates = this.config.qualityGates!;
    const failedGates: string[] = [];

    if (gates.minimumScore && result.overallScore < gates.minimumScore) {
      failedGates.push(`Overall score ${result.overallScore} below minimum ${gates.minimumScore}`);
    }

    if (gates.minimumReadability && result.readabilityScore.averageScore > 12) {
      failedGates.push(`Readability grade level too high: ${result.readabilityScore.averageScore}`);
    }

    if (gates.requireMetaDescription && !result.metaTags.description) {
      failedGates.push('Meta description is required but missing');
    }

    return {
      passed: failedGates.length === 0,
      failedGates
    };
  }

  private calculateEstimatedImpact(recommendations: SEORecommendation[]): number {
    if (recommendations.length === 0) return 0;
    
    const totalImpact = recommendations.reduce((sum, rec) => sum + rec.impact, 0);
    return Math.round(totalImpact / recommendations.length);
  }

  private async saveAnalysisResults(result: SEOAnalysisResult): Promise<void> {
    if (!this.config.prisma) return;

    try {
      await this.config.prisma.sEOAnalysis.create({
        data: {
          blogPostId: result.blogPostId,
          score: result.overallScore,
          keywordOptimization: result.categoryScores.keywords,
          contentStructure: result.categoryScores.content,
          metaOptimization: result.metaTags ? 85 : 0,
          readability: result.readabilityScore.averageScore,
          recommendations: result.recommendations || [],
          analyzedAt: result.analyzedAt
        }
      });
    } catch (error) {
      console.warn('Failed to save analysis results:', error);
    }
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private getTimeframeFromEffort(effort: string): string {
    switch (effort) {
      case 'easy': return '15-30 minutes';
      case 'moderate': return '1-3 hours';
      case 'difficult': return '1-2 days';
      default: return '1 hour';
    }
  }

  // Default fallback methods
  private getDefaultOnPageAnalysis(): OnPageSEOAnalysis {
    return {
      title: { text: '', length: 0, keywordPresence: false, keywordPosition: -1, readability: 0, clickworthiness: 0, suggestions: [], score: 0 },
      metaDescription: { length: 0, keywordPresence: false, callToAction: false, uniqueness: 0, suggestions: [], score: 0 },
      headings: { structure: [], h1Count: 0, keywordOptimization: 0, hierarchy: false, suggestions: [], score: 0 },
      content: { wordCount: 0, keywordDensity: [], readability: { fleschKincaidGrade: 8, fleschReadingEase: 70, gunningFog: 8, colemanLiau: 8, automatedReadabilityIndex: 8, averageScore: 8, readingLevel: { grade: 8, description: 'Standard', audience: 'General' }, suggestions: [] }, structure: { paragraphs: 0, averageParagraphLength: 0, sentences: 0, averageSentenceLength: 0, listsCount: 0, imagesCount: 0, hasTableOfContents: false, hasConclusion: false, score: 50 }, uniqueness: 70, topicCoverage: { mainTopics: [], relatedTopics: [], coverage: 50, gaps: [], suggestions: [] }, score: 50 },
      keywords: [],
      images: { totalImages: 0, optimizedImages: 0, missingAltText: 0, oversizedImages: 0, details: [], score: 100 },
      links: { internal: { totalLinks: 0, uniqueLinks: 0, brokenLinks: 0, noFollowLinks: 0, anchors: [], linkDepth: 2, suggestions: [], score: 50 }, external: { totalLinks: 0, uniqueDomains: 0, authorityScore: 0, brokenLinks: 0, noFollowRatio: 0, suggestions: [], score: 50 }, anchor: { distribution: [], overOptimized: [], branded: 20, generic: 40, exact: 30, suggestions: [], score: 70 }, score: 60 },
      technical: { pageSpeed: { desktop: { score: 0, loadTime: 0, firstContentfulPaint: 0, largestContentfulPaint: 0, timeToInteractive: 0 }, mobile: { score: 0, loadTime: 0, firstContentfulPaint: 0, largestContentfulPaint: 0, timeToInteractive: 0 }, coreWebVitals: { lcp: 0, fid: 0, cls: 0, passed: false }, suggestions: [] }, mobile: { responsive: true, mobileOptimized: true, touchElementsSize: true, viewportConfigured: true, score: 85 }, schema: { present: [], missing: [], errors: [], suggestions: [], score: 0 }, canonicalization: { hasCanonical: false, selfReferencing: false, issues: [], score: 50 }, indexability: { indexable: true, robotsTxt: { exists: true, accessible: true, blocks: false, errors: [] }, metaRobots: { present: false, directives: [], blocks: false }, noindex: false, sitemap: { exists: true, accessible: true, includesPage: true }, issues: [], score: 85 }, score: 70 },
      overallScore: 60,
      recommendations: []
    };
  }

  private getDefaultMetaTags(content: any): MetaTagSuggestions {
    return {
      title: content.title || 'Untitled',
      description: content.excerpt || 'No description available',
      robots: 'index, follow',
      openGraph: { title: content.title || 'Untitled', description: content.excerpt || 'No description available', image: content.image || '', url: '', type: 'article' },
      twitterCard: { card: 'summary_large_image', title: content.title || 'Untitled', description: content.excerpt || 'No description available', image: content.image || '' },
      other: []
    };
  }

  private getDefaultSchema(content: any): SchemaMarkup {
    return {
      article: {
        '@type': 'Article',
        headline: content.title || 'Untitled',
        description: content.excerpt || 'No description available',
        author: { '@type': 'Person', name: content.author?.name || 'Anonymous' },
        publisher: { '@type': 'Organization', name: 'Publisher', logo: { '@type': 'ImageObject', url: '' } },
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        image: [],
        mainEntityOfPage: ''
      }
    };
  }

  private getDefaultReadabilityMetrics(): ReadabilityMetrics {
    return {
      fleschKincaidGrade: 8,
      fleschReadingEase: 70,
      gunningFog: 8,
      colemanLiau: 8,
      automatedReadabilityIndex: 8,
      averageScore: 8,
      readingLevel: { grade: 8, description: 'Standard reading level', audience: 'General public' },
      suggestions: []
    };
  }

  private getDefaultContentQuality(): ContentQualityScore {
    return {
      overall: 70,
      components: { readability: 70, structure: 60, engagement: 60, seo: 50, expertise: 60 },
      factors: [
        { name: 'Readability', score: 70, weight: 0.2, description: 'Content readability' },
        { name: 'Structure', score: 60, weight: 0.2, description: 'Content organization' },
        { name: 'Engagement', score: 60, weight: 0.2, description: 'Reader engagement' },
        { name: 'SEO', score: 50, weight: 0.25, description: 'SEO optimization' },
        { name: 'Expertise', score: 60, weight: 0.15, description: 'Content expertise' }
      ],
      recommendations: []
    };
  }

  /**
   * Get DataForSEO connection status
   */
  getDataForSEOStatus() {
    return this.dataForSEOService?.getConnectionStatus() || {
      connected: false,
      lastChecked: new Date(),
      apiQuota: { remaining: 0, limit: 0, resetAt: new Date() },
      error: 'DataForSEO not configured'
    };
  }
}

