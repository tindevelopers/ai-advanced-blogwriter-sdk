

/**
 * Content Optimization Service
 * Real-time optimization suggestions, readability analysis, SEO enhancement, and engagement optimization
 */

import { LanguageModel, generateText, generateObject } from 'ai';
import { PrismaClient } from '../generated/prisma-client';
import { z } from 'zod';
import {
  OptimizationSuggestion,
  OptimizationCategory,
  ImpactLevel,
  EffortLevel,
  OptimizationRequest,
  ContentMetrics
} from '../types/advanced-writing';

export interface OptimizationConfig {
  model: LanguageModel;
  prisma?: PrismaClient;
  cacheResults?: boolean;
  cacheTTL?: number; // hours
  seoTools?: {
    keywordResearch?: boolean;
    competitorAnalysis?: boolean;
    rankTracking?: boolean;
  };
}

// Zod schemas for structured AI responses
const OptimizationAnalysisSchema = z.object({
  suggestions: z.array(z.object({
    category: z.enum(['SEO', 'READABILITY', 'ENGAGEMENT', 'STRUCTURE', 'TONE_STYLE', 'FACT_ACCURACY', 'SOURCE_QUALITY', 'CTA_OPTIMIZATION', 'HEADLINE', 'META_DESCRIPTION', 'KEYWORDS', 'INTERNAL_LINKING', 'CONTENT_LENGTH', 'FORMATTING']),
    title: z.string(),
    description: z.string(),
    impact: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    effort: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    priority: z.number().min(1).max(100),
    currentValue: z.string().optional(),
    suggestedValue: z.string().optional(),
    beforeText: z.string().optional(),
    afterText: z.string().optional(),
    position: z.number().optional(),
    seoImpact: z.number().min(0).max(100).optional(),
    keywordTarget: z.string().optional(),
    readabilityImpact: z.number().min(0).max(100).optional(),
    engagementMetric: z.string().optional(),
    expectedLift: z.number().min(0).max(100).optional()
  })),
  overallScores: z.object({
    seoScore: z.number().min(0).max(100),
    readabilityScore: z.number().min(0).max(100),
    engagementScore: z.number().min(0).max(100),
    structureScore: z.number().min(0).max(100)
  })
});

const ReadabilityAnalysisSchema = z.object({
  fleschKincaidScore: z.number(),
  gradeLevel: z.number(),
  readingEase: z.number().min(0).max(100),
  avgSentenceLength: z.number(),
  avgWordsPerSentence: z.number(),
  complexWordsPercentage: z.number().min(0).max(100),
  passiveVoicePercentage: z.number().min(0).max(100),
  improvementSuggestions: z.array(z.string())
});

const SEOAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  keywordDensity: z.record(z.number().min(0).max(100)),
  titleOptimization: z.object({
    score: z.number().min(0).max(100),
    issues: z.array(z.string()),
    suggestions: z.array(z.string())
  }),
  metaDescription: z.object({
    score: z.number().min(0).max(100),
    length: z.number(),
    issues: z.array(z.string()),
    suggestions: z.array(z.string())
  }),
  headingStructure: z.object({
    score: z.number().min(0).max(100),
    h1Count: z.number(),
    h2Count: z.number(),
    h3Count: z.number(),
    issues: z.array(z.string())
  }),
  internalLinking: z.object({
    score: z.number().min(0).max(100),
    linkCount: z.number(),
    suggestions: z.array(z.string())
  })
});

export class ContentOptimizationService {
  constructor(private config: OptimizationConfig) {}

  /**
   * Generate comprehensive optimization suggestions for content
   */
  async optimizeContent(request: OptimizationRequest): Promise<{
    suggestions: OptimizationSuggestion[];
    metrics: ContentMetrics;
    prioritizedActions: OptimizationSuggestion[];
    implementationGuide: {
      quickWins: OptimizationSuggestion[];
      mediumEffort: OptimizationSuggestion[];
      highImpact: OptimizationSuggestion[];
    };
  }> {
    const content = await this.getContentForOptimization(request.blogPostId);
    
    // Perform different types of analysis
    const analyses = await Promise.all([
      this.performSEOAnalysis(content, request.targetKeywords || []),
      this.performReadabilityAnalysis(content),
      this.performEngagementAnalysis(content),
      this.performStructureAnalysis(content),
      this.performContentLengthAnalysis(content),
      this.performCTAAnalysis(content)
    ]);

    // Generate suggestions based on analyses
    const suggestions = await this.generateOptimizationSuggestions(
      content,
      analyses,
      request
    );

    // Filter by requested categories if specified
    const filteredSuggestions = request.categories 
      ? suggestions.filter(s => request.categories!.includes(s.category))
      : suggestions;

    // Limit suggestions if requested
    const finalSuggestions = request.maxSuggestions 
      ? filteredSuggestions
          .sort((a, b) => b.priority - a.priority)
          .slice(0, request.maxSuggestions)
      : filteredSuggestions;

    // Create metrics
    const metrics = await this.generateContentMetrics(request.blogPostId, analyses);

    // Prioritize actions
    const prioritizedActions = this.prioritizeSuggestions(
      finalSuggestions, 
      request.prioritizeHighImpact !== false
    );

    // Create implementation guide
    const implementationGuide = this.createImplementationGuide(finalSuggestions);

    // Save to database
    if (this.config.prisma) {
      await this.saveOptimizationsToDatabase(finalSuggestions);
      await this.saveMetricsToDatabase(metrics);
    }

    return {
      suggestions: finalSuggestions,
      metrics,
      prioritizedActions,
      implementationGuide
    };
  }

  /**
   * Perform SEO-focused optimization analysis
   */
  async performSEOOptimization(
    blogPostId: string,
    targetKeywords: string[],
    competitorUrls?: string[]
  ): Promise<{
    seoScore: number;
    keywordOptimization: OptimizationSuggestion[];
    technicalSEO: OptimizationSuggestion[];
    contentSEO: OptimizationSuggestion[];
    competitorInsights?: {
      gaps: string[];
      opportunities: string[];
    };
  }> {
    const content = await this.getContentForOptimization(blogPostId);
    const seoAnalysis = await this.performSEOAnalysis(content, targetKeywords);
    
    const suggestions: OptimizationSuggestion[] = [];

    // Generate keyword optimization suggestions
    const keywordOptimization = await this.generateKeywordSuggestions(
      content,
      targetKeywords,
      seoAnalysis.keywordDensity
    );
    suggestions.push(...keywordOptimization);

    // Generate technical SEO suggestions
    const technicalSEO = await this.generateTechnicalSEOSuggestions(
      content,
      seoAnalysis
    );
    suggestions.push(...technicalSEO);

    // Generate content SEO suggestions
    const contentSEO = await this.generateContentSEOSuggestions(
      content,
      seoAnalysis,
      targetKeywords
    );
    suggestions.push(...contentSEO);

    // Competitor analysis if URLs provided
    let competitorInsights;
    if (competitorUrls && competitorUrls.length > 0) {
      competitorInsights = await this.analyzeCompetitors(content, competitorUrls);
    }

    return {
      seoScore: seoAnalysis.overallScore,
      keywordOptimization,
      technicalSEO,
      contentSEO,
      competitorInsights
    };
  }

  /**
   * Analyze readability and provide improvement suggestions
   */
  async improveReadability(
    content: string,
    targetGradeLevel?: number
  ): Promise<{
    currentReadability: {
      gradeLevel: number;
      readingEase: number;
      complexity: string;
    };
    suggestions: OptimizationSuggestion[];
    improvedExcerpts: Array<{
      original: string;
      improved: string;
      improvement: string;
    }>;
  }> {
    const readabilityAnalysis = await this.performReadabilityAnalysis(content);
    const target = targetGradeLevel || 8;

    const suggestions = await this.generateReadabilitySuggestions(
      content,
      readabilityAnalysis,
      target
    );

    const improvedExcerpts = await this.generateImprovedExcerpts(
      content,
      readabilityAnalysis,
      target
    );

    return {
      currentReadability: {
        gradeLevel: readabilityAnalysis.gradeLevel,
        readingEase: readabilityAnalysis.readingEase,
        complexity: this.getComplexityDescription(readabilityAnalysis.gradeLevel)
      },
      suggestions,
      improvedExcerpts
    };
  }

  /**
   * Optimize content for engagement
   */
  async optimizeEngagement(
    content: string,
    targetAudience?: string
  ): Promise<{
    engagementScore: number;
    hooks: Array<{
      position: number;
      current: string;
      improved: string;
      reason: string;
    }>;
    ctas: Array<{
      position: number;
      text: string;
      strength: number;
      suggestions: string[];
    }>;
    suggestions: OptimizationSuggestion[];
  }> {
    const engagementAnalysis = await this.performEngagementAnalysis(content);
    
    const hooks = await this.analyzeAndImproveHooks(content);
    const ctas = await this.analyzeCTAs(content);
    const suggestions = await this.generateEngagementSuggestions(
      content,
      engagementAnalysis,
      targetAudience
    );

    return {
      engagementScore: engagementAnalysis.score,
      hooks,
      ctas,
      suggestions
    };
  }

  /**
   * Generate A/B testing suggestions for content variations
   */
  async generateABTestSuggestions(
    content: string,
    elements: Array<'headline' | 'introduction' | 'cta' | 'conclusion'>
  ): Promise<{
    variations: Array<{
      element: string;
      originalVersion: string;
      variations: Array<{
        version: string;
        hypothesis: string;
        expectedImpact: string;
      }>;
    }>;
    testPlan: {
      duration: string;
      sampleSize: string;
      metrics: string[];
      implementation: string[];
    };
  }> {
    const variations: Array<any> = [];

    for (const element of elements) {
      const elementVariations = await this.generateElementVariations(content, element);
      variations.push({
        element,
        originalVersion: elementVariations.original,
        variations: elementVariations.alternatives
      });
    }

    const testPlan = this.generateTestPlan(elements, variations);

    return {
      variations,
      testPlan
    };
  }

  /**
   * Track and validate optimization implementations
   */
  async trackOptimizationResults(
    suggestionIds: string[],
    metrics: {
      before: Record<string, number>;
      after: Record<string, number>;
    }
  ): Promise<{
    results: Array<{
      suggestionId: string;
      actualImpact: number;
      expectedImpact: number;
      success: boolean;
      insights: string[];
    }>;
    overallImprovement: number;
    recommendedNextSteps: string[];
  }> {
    if (!this.config.prisma) {
      throw new Error('Prisma required for tracking optimization results');
    }

    const results: Array<any> = [];
    let totalImpactAchieved = 0;
    let totalImpactExpected = 0;

    for (const suggestionId of suggestionIds) {
      const suggestion = await this.config.prisma.optimizationSuggestion.findUnique({
        where: { id: suggestionId }
      });

      if (!suggestion) continue;

      const actualImpact = this.calculateActualImpact(suggestion, metrics.before, metrics.after);
      const expectedImpact = suggestion.expectedLift || 0;
      
      totalImpactAchieved += actualImpact;
      totalImpactExpected += expectedImpact;

      const result = {
        suggestionId,
        actualImpact,
        expectedImpact,
        success: actualImpact >= expectedImpact * 0.8, // 80% of expected is considered success
        insights: this.generateImpactInsights(suggestion, actualImpact, expectedImpact)
      };

      results.push(result);

      // Update database with results
      await this.config.prisma.optimizationSuggestion.update({
        where: { id: suggestionId },
        data: {
          isValidated: true,
          actualImpact,
          validationScore: actualImpact / Math.max(expectedImpact, 1)
        }
      });
    }

    const overallImprovement = totalImpactExpected > 0 
      ? (totalImpactAchieved / totalImpactExpected) * 100 
      : 0;

    const recommendedNextSteps = this.generateNextStepRecommendations(results, metrics);

    return {
      results,
      overallImprovement,
      recommendedNextSteps
    };
  }

  // Private helper methods

  private async performSEOAnalysis(content: string, keywords: string[]): Promise<any> {
    const prompt = `Perform comprehensive SEO analysis of this content:

"${content.slice(0, 2000)}..."

Target Keywords: ${keywords.join(', ')}

Analyze:
1. Overall SEO score (0-100)
2. Keyword density for each target keyword (percentage)
3. Title optimization (score, issues, suggestions)
4. Meta description analysis (score, length, issues, suggestions)
5. Heading structure (H1, H2, H3 counts and quality)
6. Internal linking opportunities

Provide detailed analysis and specific improvement recommendations.`;

    try {
      const result = await generateObject({
        model: this.config.model,
        schema: SEOAnalysisSchema,
        prompt
      });

      return result.object;
    } catch (error) {
      console.error('Failed to perform SEO analysis:', error);
      return {
        overallScore: 70,
        keywordDensity: {},
        titleOptimization: { score: 70, issues: [], suggestions: [] },
        metaDescription: { score: 60, length: 0, issues: [], suggestions: [] },
        headingStructure: { score: 75, h1Count: 1, h2Count: 0, h3Count: 0, issues: [] },
        internalLinking: { score: 50, linkCount: 0, suggestions: [] }
      };
    }
  }

  private async performReadabilityAnalysis(content: string): Promise<any> {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const avgSentenceLength = words.length / sentences.length;

    const prompt = `Analyze the readability of this content:

"${content.slice(0, 1500)}..."

Provide:
1. Flesch-Kincaid grade level
2. Flesch Reading Ease score (0-100)
3. Average words per sentence
4. Complex words percentage
5. Passive voice percentage
6. Specific improvement suggestions

Focus on making the content more accessible and engaging.`;

    try {
      const result = await generateObject({
        model: this.config.model,
        schema: ReadabilityAnalysisSchema,
        prompt
      });

      return {
        ...result.object,
        avgSentenceLength
      };
    } catch (error) {
      console.error('Failed to perform readability analysis:', error);
      return {
        fleschKincaidScore: 10,
        gradeLevel: 10,
        readingEase: 60,
        avgSentenceLength,
        avgWordsPerSentence: avgSentenceLength,
        complexWordsPercentage: 20,
        passiveVoicePercentage: 25,
        improvementSuggestions: ['Shorten sentences', 'Use simpler words', 'Reduce passive voice']
      };
    }
  }

  private async performEngagementAnalysis(content: string): Promise<{ score: number; issues: string[]; strengths: string[] }> {
    // Analyze content for engagement factors
    const wordCount = content.split(/\s+/).length;
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const avgParagraphLength = wordCount / paragraphs.length;
    
    let score = 70; // Base score
    const issues: string[] = [];
    const strengths: string[] = [];

    // Analyze paragraph length
    if (avgParagraphLength > 100) {
      score -= 10;
      issues.push('Paragraphs are too long for online reading');
    } else if (avgParagraphLength < 80) {
      score += 5;
      strengths.push('Good paragraph length for readability');
    }

    // Check for engagement elements
    const hasQuestions = /\?/.test(content);
    const hasLists = /^\s*[-*\d+\.]/m.test(content);
    const hasEmphasis = /\*\*|__/.test(content);

    if (hasQuestions) {
      score += 5;
      strengths.push('Uses questions to engage readers');
    } else {
      issues.push('Could benefit from rhetorical questions');
    }

    if (hasLists) {
      score += 5;
      strengths.push('Uses lists for better scanability');
    }

    if (hasEmphasis) {
      score += 3;
      strengths.push('Uses emphasis for important points');
    }

    return { score: Math.max(0, Math.min(100, score)), issues, strengths };
  }

  private async performStructureAnalysis(content: string): Promise<{ score: number; structure: any; suggestions: string[] }> {
    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
    const h1Count = (content.match(/^#\s+/gm) || []).length;
    const h2Count = (content.match(/^##\s+/gm) || []).length;
    const h3Count = (content.match(/^###\s+/gm) || []).length;

    let score = 80;
    const suggestions: string[] = [];

    if (h1Count !== 1) {
      score -= 15;
      suggestions.push(h1Count === 0 ? 'Add a main heading (H1)' : 'Use only one main heading (H1)');
    }

    if (h2Count === 0) {
      score -= 10;
      suggestions.push('Add section headings (H2) to break up content');
    }

    const structure = {
      totalHeadings: headings.length,
      h1Count,
      h2Count,
      h3Count,
      hasIntroduction: content.trim().split('\n')[0].length > 100,
      hasConclusion: content.trim().split('\n').slice(-3).join(' ').length > 100
    };

    return { score: Math.max(0, score), structure, suggestions };
  }

  private async performContentLengthAnalysis(content: string): Promise<{ wordCount: number; score: number; recommendation: string }> {
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    let score = 80;
    let recommendation = 'Content length is appropriate';

    if (wordCount < 300) {
      score = 40;
      recommendation = 'Content is too short. Add more value and depth.';
    } else if (wordCount < 500) {
      score = 60;
      recommendation = 'Content is on the shorter side. Consider expanding key points.';
    } else if (wordCount > 3000) {
      score = 70;
      recommendation = 'Content is quite long. Consider breaking into multiple pieces or sections.';
    } else if (wordCount > 1500 && wordCount <= 2500) {
      score = 95;
      recommendation = 'Excellent content length for engagement and SEO.';
    }

    return { wordCount, score, recommendation };
  }

  private async performCTAAnalysis(content: string): Promise<{ ctas: any[]; score: number; suggestions: string[] }> {
    // Simple CTA detection patterns
    const ctaPatterns = [
      /\b(click here|learn more|read more|get started|sign up|subscribe|download|contact us|buy now)\b/gi,
      /\b(try|start|begin|explore|discover)\s+(now|today|free)\b/gi
    ];

    const ctas: any[] = [];
    const suggestions: string[] = [];

    ctaPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => {
        ctas.push({
          text: match,
          type: index === 0 ? 'direct' : 'action-oriented',
          strength: index === 0 ? 0.6 : 0.8
        });
      });
    });

    let score = 70;

    if (ctas.length === 0) {
      score = 30;
      suggestions.push('Add clear calls-to-action to guide reader behavior');
    } else if (ctas.length > 5) {
      score = 60;
      suggestions.push('Too many CTAs may dilute effectiveness. Focus on 1-3 primary actions.');
    }

    if (ctas.every(cta => cta.strength < 0.7)) {
      suggestions.push('Use more compelling and action-oriented CTA language');
    }

    return { ctas, score, suggestions };
  }

  private async generateOptimizationSuggestions(
    content: string,
    analyses: any[],
    request: OptimizationRequest
  ): Promise<OptimizationSuggestion[]> {
    const [seoAnalysis, readabilityAnalysis, engagementAnalysis, structureAnalysis, lengthAnalysis, ctaAnalysis] = analyses;

    const prompt = `Generate comprehensive optimization suggestions for this content based on analysis results:

Content Analysis Results:
- SEO Score: ${seoAnalysis.overallScore}/100
- Readability Grade Level: ${readabilityAnalysis.gradeLevel}
- Engagement Score: ${engagementAnalysis.score}/100
- Structure Score: ${structureAnalysis.score}/100
- Word Count: ${lengthAnalysis.wordCount}
- CTA Score: ${ctaAnalysis.score}/100

${request.targetKeywords ? `Target Keywords: ${request.targetKeywords.join(', ')}` : ''}

Generate specific, actionable optimization suggestions across categories:
1. SEO improvements
2. Readability enhancements
3. Engagement optimizations
4. Structural improvements
5. Content length adjustments
6. CTA optimizations

For each suggestion, provide:
- Clear title and description
- Impact level (LOW/MEDIUM/HIGH/CRITICAL)
- Effort required (LOW/MEDIUM/HIGH)
- Priority score (1-100)
- Expected improvement metrics
- Specific before/after examples where applicable

Focus on suggestions that will have the highest impact with reasonable effort.`;

    try {
      const result = await generateObject({
        model: this.config.model,
        schema: OptimizationAnalysisSchema,
        prompt
      });

      return result.object.suggestions.map((s, index) => ({
        id: `opt_${Date.now()}_${index}`,
        blogPostId: request.blogPostId,
        category: s.category as OptimizationCategory,
        title: s.title,
        description: s.description,
        impact: s.impact as ImpactLevel,
        effort: s.effort as EffortLevel,
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
        isImplemented: false,
        isValidated: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    } catch (error) {
      console.error('Failed to generate optimization suggestions:', error);
      return [];
    }
  }

  private async generateKeywordSuggestions(
    content: string,
    keywords: string[],
    densities: Record<string, number>
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    keywords.forEach((keyword, index) => {
      const density = densities[keyword] || 0;
      
      if (density < 0.5) {
        suggestions.push({
          id: `keyword_${index}`,
          blogPostId: '',
          category: OptimizationCategory.KEYWORDS,
          title: `Increase "${keyword}" keyword density`,
          description: `Current density is ${density.toFixed(1)}%. Recommend 1-2% for better SEO.`,
          impact: ImpactLevel.HIGH,
          effort: EffortLevel.MEDIUM,
          priority: 85,
          keywordTarget: keyword,
          seoImpact: 15,
          expectedLift: 10,
          isImplemented: false,
          isValidated: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else if (density > 3) {
        suggestions.push({
          id: `keyword_over_${index}`,
          blogPostId: '',
          category: OptimizationCategory.KEYWORDS,
          title: `Reduce "${keyword}" keyword density`,
          description: `Current density is ${density.toFixed(1)}%. This may be seen as keyword stuffing.`,
          impact: ImpactLevel.MEDIUM,
          effort: EffortLevel.LOW,
          priority: 70,
          keywordTarget: keyword,
          seoImpact: -5,
          isImplemented: false,
          isValidated: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    return suggestions;
  }

  private async generateTechnicalSEOSuggestions(
    content: string,
    seoAnalysis: any
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    if (seoAnalysis.titleOptimization.score < 80) {
      suggestions.push({
        id: 'title_opt',
        blogPostId: '',
        category: OptimizationCategory.HEADLINE,
        title: 'Optimize title for SEO',
        description: seoAnalysis.titleOptimization.suggestions.join('; '),
        impact: ImpactLevel.HIGH,
        effort: EffortLevel.LOW,
        priority: 95,
        seoImpact: 20,
        isImplemented: false,
        isValidated: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    if (seoAnalysis.metaDescription.score < 80) {
      suggestions.push({
        id: 'meta_desc',
        blogPostId: '',
        category: OptimizationCategory.META_DESCRIPTION,
        title: 'Improve meta description',
        description: seoAnalysis.metaDescription.suggestions.join('; '),
        impact: ImpactLevel.HIGH,
        effort: EffortLevel.LOW,
        priority: 90,
        seoImpact: 15,
        isImplemented: false,
        isValidated: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return suggestions;
  }

  private async generateContentSEOSuggestions(
    content: string,
    seoAnalysis: any,
    keywords: string[]
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    if (seoAnalysis.headingStructure.score < 80) {
      suggestions.push({
        id: 'heading_structure',
        blogPostId: '',
        category: OptimizationCategory.STRUCTURE,
        title: 'Improve heading structure',
        description: `Current: H1=${seoAnalysis.headingStructure.h1Count}, H2=${seoAnalysis.headingStructure.h2Count}. ${seoAnalysis.headingStructure.issues.join('; ')}`,
        impact: ImpactLevel.MEDIUM,
        effort: EffortLevel.MEDIUM,
        priority: 75,
        seoImpact: 10,
        isImplemented: false,
        isValidated: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    if (seoAnalysis.internalLinking.score < 70) {
      suggestions.push({
        id: 'internal_links',
        blogPostId: '',
        category: OptimizationCategory.INTERNAL_LINKING,
        title: 'Add internal links',
        description: `Currently ${seoAnalysis.internalLinking.linkCount} internal links. ${seoAnalysis.internalLinking.suggestions.join('; ')}`,
        impact: ImpactLevel.MEDIUM,
        effort: EffortLevel.MEDIUM,
        priority: 70,
        seoImpact: 8,
        isImplemented: false,
        isValidated: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return suggestions;
  }

  private async generateReadabilitySuggestions(
    content: string,
    analysis: any,
    targetGradeLevel: number
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    if (analysis.gradeLevel > targetGradeLevel + 2) {
      suggestions.push({
        id: 'readability_grade',
        blogPostId: '',
        category: OptimizationCategory.READABILITY,
        title: 'Simplify language complexity',
        description: `Current grade level: ${analysis.gradeLevel}. Target: ${targetGradeLevel}. ${analysis.improvementSuggestions.join('; ')}`,
        impact: ImpactLevel.HIGH,
        effort: EffortLevel.MEDIUM,
        priority: 80,
        readabilityImpact: 15,
        isImplemented: false,
        isValidated: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    if (analysis.avgSentenceLength > 25) {
      suggestions.push({
        id: 'sentence_length',
        blogPostId: '',
        category: OptimizationCategory.READABILITY,
        title: 'Shorten sentence length',
        description: `Average sentence length is ${analysis.avgSentenceLength.toFixed(1)} words. Aim for under 20 words per sentence.`,
        impact: ImpactLevel.MEDIUM,
        effort: EffortLevel.MEDIUM,
        priority: 70,
        readabilityImpact: 10,
        isImplemented: false,
        isValidated: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return suggestions;
  }

  private async generateEngagementSuggestions(
    content: string,
    analysis: any,
    targetAudience?: string
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    if (analysis.score < 70) {
      analysis.issues.forEach((issue: string, index: number) => {
        suggestions.push({
          id: `engagement_${index}`,
          blogPostId: '',
          category: OptimizationCategory.ENGAGEMENT,
          title: 'Improve content engagement',
          description: issue,
          impact: ImpactLevel.MEDIUM,
          effort: EffortLevel.MEDIUM,
          priority: 75,
          engagementMetric: 'time-on-page',
          expectedLift: 15,
          isImplemented: false,
          isValidated: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    }

    return suggestions;
  }

  private prioritizeSuggestions(
    suggestions: OptimizationSuggestion[],
    prioritizeHighImpact: boolean
  ): OptimizationSuggestion[] {
    return suggestions.sort((a, b) => {
      if (prioritizeHighImpact) {
        // Prioritize by impact first, then by priority score
        const impactWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const impactDiff = impactWeight[b.impact] - impactWeight[a.impact];
        if (impactDiff !== 0) return impactDiff;
      }
      
      return b.priority - a.priority;
    });
  }

  private createImplementationGuide(suggestions: OptimizationSuggestion[]): any {
    const quickWins = suggestions.filter(s => s.effort === EffortLevel.LOW && s.impact !== ImpactLevel.LOW);
    const mediumEffort = suggestions.filter(s => s.effort === EffortLevel.MEDIUM);
    const highImpact = suggestions.filter(s => s.impact === ImpactLevel.HIGH || s.impact === ImpactLevel.CRITICAL);

    return {
      quickWins: quickWins.slice(0, 5),
      mediumEffort: mediumEffort.slice(0, 3),
      highImpact: highImpact.slice(0, 3)
    };
  }

  private async generateContentMetrics(blogPostId: string, analyses: any[]): Promise<ContentMetrics> {
    const [seoAnalysis, readabilityAnalysis, engagementAnalysis, structureAnalysis, lengthAnalysis, ctaAnalysis] = analyses;

    return {
      id: `metrics_${Date.now()}`,
      blogPostId,
      sectionsGenerated: 0, // Will be updated by multi-section service
      overallQualityScore: (seoAnalysis.overallScore + readabilityAnalysis.readingEase + engagementAnalysis.score + structureAnalysis.score) / 400,
      coherenceScore: structureAnalysis.score / 100,
      consistencyScore: 0.8, // Would be calculated by tone service
      originalityScore: 0.9, // Would be calculated by fact-checking service
      toneConsistencyScore: 0.8, // Would be calculated by tone service
      brandAlignmentScore: 0.7, // Would be calculated by tone service
      totalClaims: 0, // Would be updated by fact-checking service
      verifiedClaims: 0,
      disputedClaims: 0,
      sourcesUsed: 0,
      reliableSources: 0,
      seoScore: seoAnalysis.overallScore,
      readabilityScore: readabilityAnalysis.readingEase,
      engagementScore: engagementAnalysis.score,
      totalSuggestions: 0, // Will be updated when suggestions are saved
      implementedSuggestions: 0,
      measuredAt: new Date()
    };
  }

  // Additional helper methods for advanced features

  private async analyzeCompetitors(content: string, competitorUrls: string[]): Promise<any> {
    // Mock competitor analysis - in practice, would scrape and analyze competitor content
    return {
      gaps: ['Missing FAQ section', 'No comparison tables', 'Limited examples'],
      opportunities: ['Add video content', 'Include customer testimonials', 'Create downloadable resources']
    };
  }

  private async analyzeAndImproveHooks(content: string): Promise<any[]> {
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const hooks: any[] = [];

    // Analyze first few paragraphs for engagement
    paragraphs.slice(0, 3).forEach((paragraph, index) => {
      if (paragraph.length > 100) {
        hooks.push({
          position: index,
          current: paragraph.slice(0, 100) + '...',
          improved: `Did you know that ${paragraph.slice(20, 80)}? Here's what you need to know.`,
          reason: 'Added curiosity gap and direct address to reader'
        });
      }
    });

    return hooks;
  }

  private async analyzeCTAs(content: string): Promise<any[]> {
    // Simple CTA analysis - would be more sophisticated in practice
    const ctas: any[] = [];
    const ctaMatches = content.match(/\b(click|try|start|get|download|subscribe|learn more)\b[^.!?]*[.!?]/gi) || [];

    ctaMatches.forEach((match, index) => {
      ctas.push({
        position: content.indexOf(match),
        text: match.trim(),
        strength: match.toLowerCase().includes('free') ? 0.8 : 0.6,
        suggestions: ['Add urgency', 'Be more specific', 'Highlight value proposition']
      });
    });

    return ctas;
  }

  private async generateElementVariations(content: string, element: string): Promise<any> {
    const prompt = `Generate 3 alternative versions for the ${element} element of this content:

Original Content:
"${content.slice(0, 1000)}..."

Create variations that test different approaches:
1. Different emotional appeals
2. Various value propositions  
3. Alternative structures/formats

For each variation, explain the hypothesis and expected impact.`;

    // Mock implementation - would use AI generation in practice
    return {
      original: element === 'headline' ? content.split('\n')[0] : `Original ${element}`,
      alternatives: [
        {
          version: `Alternative ${element} version 1`,
          hypothesis: 'Testing emotional appeal vs logical approach',
          expectedImpact: 'Higher click-through rate'
        },
        {
          version: `Alternative ${element} version 2`,
          hypothesis: 'Testing longer vs shorter format',
          expectedImpact: 'Better conversion rate'
        }
      ]
    };
  }

  private generateTestPlan(elements: string[], variations: any[]): any {
    return {
      duration: '2-4 weeks',
      sampleSize: 'Minimum 1000 visitors per variation',
      metrics: ['Click-through rate', 'Time on page', 'Conversion rate', 'Bounce rate'],
      implementation: [
        'Set up A/B testing tool',
        'Define success metrics',
        'Run test for statistical significance',
        'Analyze results and implement winner'
      ]
    };
  }

  private getComplexityDescription(gradeLevel: number): string {
    if (gradeLevel <= 6) return 'Very Easy';
    if (gradeLevel <= 8) return 'Easy';
    if (gradeLevel <= 10) return 'Moderate';
    if (gradeLevel <= 12) return 'Difficult';
    return 'Very Difficult';
  }

  private async generateImprovedExcerpts(
    content: string,
    analysis: any,
    targetGradeLevel: number
  ): Promise<Array<{
    original: string;
    improved: string;
    improvement: string;
  }>> {
    // Mock implementation - would generate actual improved text using AI
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 50);
    const improvements: Array<any> = [];

    sentences.slice(0, 3).forEach(sentence => {
      if (sentence.split(' ').length > 20) {
        improvements.push({
          original: sentence.trim(),
          improved: `Simplified version: ${sentence.trim().slice(0, 50)}...`,
          improvement: 'Shortened sentence length for better readability'
        });
      }
    });

    return improvements;
  }

  private calculateActualImpact(
    suggestion: any,
    beforeMetrics: Record<string, number>,
    afterMetrics: Record<string, number>
  ): number {
    // Calculate actual impact based on suggestion category
    const category = suggestion.category;
    
    switch (category) {
      case 'SEO':
        return this.calculateMetricImprovement(beforeMetrics.seoScore, afterMetrics.seoScore);
      case 'READABILITY':
        return this.calculateMetricImprovement(beforeMetrics.readabilityScore, afterMetrics.readabilityScore);
      case 'ENGAGEMENT':
        return this.calculateMetricImprovement(beforeMetrics.engagementScore, afterMetrics.engagementScore);
      default:
        return this.calculateOverallImprovement(beforeMetrics, afterMetrics);
    }
  }

  private calculateMetricImprovement(before: number, after: number): number {
    if (before === 0) return after > 0 ? 100 : 0;
    return ((after - before) / before) * 100;
  }

  private calculateOverallImprovement(
    before: Record<string, number>,
    after: Record<string, number>
  ): number {
    const metrics = ['seoScore', 'readabilityScore', 'engagementScore'];
    let totalImprovement = 0;
    let validMetrics = 0;

    metrics.forEach(metric => {
      if (before[metric] !== undefined && after[metric] !== undefined) {
        totalImprovement += this.calculateMetricImprovement(before[metric], after[metric]);
        validMetrics++;
      }
    });

    return validMetrics > 0 ? totalImprovement / validMetrics : 0;
  }

  private generateImpactInsights(suggestion: any, actualImpact: number, expectedImpact: number): string[] {
    const insights: string[] = [];
    
    if (actualImpact >= expectedImpact * 1.2) {
      insights.push('Exceeded expectations - consider applying similar optimizations');
    } else if (actualImpact >= expectedImpact * 0.8) {
      insights.push('Met expectations - good optimization');
    } else if (actualImpact >= 0) {
      insights.push('Some improvement achieved but below expectations');
    } else {
      insights.push('Negative impact - consider reverting changes');
    }

    return insights;
  }

  private generateNextStepRecommendations(results: any[], metrics: any): string[] {
    const recommendations: string[] = [];
    
    const successfulOptimizations = results.filter(r => r.success).length;
    const totalOptimizations = results.length;
    
    if (successfulOptimizations / totalOptimizations >= 0.8) {
      recommendations.push('Great results! Consider implementing similar optimizations on other content');
    } else if (successfulOptimizations / totalOptimizations >= 0.5) {
      recommendations.push('Mixed results. Analyze successful optimizations and refine approach');
    } else {
      recommendations.push('Low success rate. Review optimization strategy and consider different approaches');
    }

    return recommendations;
  }

  // Database helper methods

  private async getContentForOptimization(blogPostId: string): Promise<string> {
    if (!this.config.prisma) {
      throw new Error('Prisma not available');
    }

    const blogPost = await this.config.prisma.blogPost.findUnique({
      where: { id: blogPostId }
    });

    if (!blogPost) {
      throw new Error('Blog post not found');
    }

    return blogPost.content;
  }

  private async saveOptimizationsToDatabase(suggestions: OptimizationSuggestion[]): Promise<void> {
    if (!this.config.prisma) return;

    for (const suggestion of suggestions) {
      try {
        await this.config.prisma.optimizationSuggestion.create({
          data: {
            blogPostId: suggestion.blogPostId,
            category: suggestion.category,
            title: suggestion.title,
            description: suggestion.description,
            impact: suggestion.impact,
            effort: suggestion.effort,
            priority: suggestion.priority,
            currentValue: suggestion.currentValue,
            suggestedValue: suggestion.suggestedValue,
            beforeText: suggestion.beforeText,
            afterText: suggestion.afterText,
            position: suggestion.position,
            seoImpact: suggestion.seoImpact,
            keywordTarget: suggestion.keywordTarget,
            readabilityImpact: suggestion.readabilityImpact,
            engagementMetric: suggestion.engagementMetric,
            expectedLift: suggestion.expectedLift,
            isImplemented: suggestion.isImplemented,
            isValidated: suggestion.isValidated
          }
        });
      } catch (error) {
        console.error('Failed to save optimization suggestion:', error);
      }
    }
  }

  private async saveMetricsToDatabase(metrics: ContentMetrics): Promise<void> {
    if (!this.config.prisma) return;

    try {
      await this.config.prisma.contentMetrics.create({
        data: {
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
          implementedSuggestions: metrics.implementedSuggestions
        }
      });
    } catch (error) {
      console.error('Failed to save content metrics:', error);
    }
  }
}

