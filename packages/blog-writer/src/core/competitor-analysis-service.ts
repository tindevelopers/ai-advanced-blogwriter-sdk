/**
 * Competitor Analysis & Gap Identification Service
 * Comprehensive competitor content analysis and opportunity identification
 */

import {
  Competitor,
  CompetitorContent,
  CompetitorTopic,
  CompetitorKeyword,
  CompetitorAnalysis,
  CompetitorAnalysisRequest,
  CompetitorAnalysisResponse,
  ContentGap,
  KeywordGap,
  TopicGap,
  Recommendation,
  Opportunity,
  CompetitorType,
  ReportSummary,
} from '../types/strategy-engine';

import type { LanguageModelV2 } from '@ai-sdk/provider';
import { PrismaClient } from '../generated/prisma-client';

export interface CompetitorAnalysisConfig {
  model: LanguageModelV2;
  prisma?: PrismaClient;
  cacheResults?: boolean;
  cacheTTL?: number; // hours
  maxConcurrentAnalysis?: number;
}

export interface SERPData {
  query: string;
  results: Array<{
    position: number;
    title: string;
    url: string;
    domain: string;
    snippet: string;
    date?: string;
  }>;
}

export interface DomainMetrics {
  domain: string;
  domainAuthority?: number;
  monthlyTraffic?: number;
  backlinks?: number;
  contentCount?: number;
  averageRanking?: number;
}

export class CompetitorAnalysisService {
  private model: LanguageModelV2;
  private prisma?: PrismaClient;
  private cacheResults: boolean;
  private cacheTTL: number;
  private maxConcurrentAnalysis: number;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config: CompetitorAnalysisConfig) {
    this.model = config.model;
    this.prisma = config.prisma;
    this.cacheResults = config.cacheResults ?? true;
    this.cacheTTL = config.cacheTTL ?? 24; // 24 hours default
    this.maxConcurrentAnalysis = config.maxConcurrentAnalysis ?? 5;
  }

  /**
   * Conduct comprehensive competitor analysis
   */
  async analyzeCompetitors(
    request: CompetitorAnalysisRequest,
  ): Promise<CompetitorAnalysisResponse> {
    const cacheKey = `competitor_analysis_${JSON.stringify(request)}`;

    // Check cache first
    if (this.cacheResults && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.cacheTTL * 60 * 60 * 1000) {
        return cached.data;
      }
    }

    try {
      // Analyze each competitor
      const competitorAnalyses = await Promise.all(
        request.competitors
          .slice(0, this.maxConcurrentAnalysis)
          .map(domain => this.analyzeCompetitor(domain, request)),
      );

      // Identify gaps and opportunities
      const gaps = await this.identifyContentGaps(competitorAnalyses, request);
      const opportunities = await this.identifyOpportunities(
        competitorAnalyses,
        gaps,
      );
      const recommendations = await this.generateRecommendations(
        competitorAnalyses,
        gaps,
        opportunities,
      );

      // Generate summary
      const summary = this.generateAnalysisSummary(
        competitorAnalyses,
        gaps,
        opportunities,
      );

      const response: CompetitorAnalysisResponse = {
        analysis: competitorAnalyses,
        gaps,
        opportunities,
        recommendations,
        summary,
      };

      // Cache the result
      if (this.cacheResults) {
        this.cache.set(cacheKey, { data: response, timestamp: Date.now() });
      }

      // Save to database if available
      if (this.prisma) {
        await this.saveAnalysisResults(response);
      }

      return response;
    } catch (error) {
      console.error('Error in competitor analysis:', error);
      throw new Error(
        `Competitor analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Analyze a single competitor
   */
  async analyzeCompetitor(
    domain: string,
    request: CompetitorAnalysisRequest,
  ): Promise<CompetitorAnalysis> {
    try {
      // Get or create competitor record
      const competitor = await this.getOrCreateCompetitor(domain);

      // Build analysis prompt
      const prompt = this.buildCompetitorAnalysisPrompt(domain, request);

      const result = await this.model.generateObject({
        schema: {
          type: 'object',
          properties: {
            overallScore: { type: 'number', minimum: 0, maximum: 1 },
            contentQuality: { type: 'number', minimum: 0, maximum: 1 },
            seoStrength: { type: 'number', minimum: 0, maximum: 1 },
            socialPresence: { type: 'number', minimum: 0, maximum: 1 },
            contentGaps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  description: { type: 'string' },
                  opportunity: { type: 'number', minimum: 0, maximum: 1 },
                  difficulty: { type: 'number', minimum: 0, maximum: 1 },
                  estimatedTraffic: { type: 'number' },
                  keywords: { type: 'array', items: { type: 'string' } },
                  competitorUrls: { type: 'array', items: { type: 'string' } },
                },
                required: ['type', 'description', 'opportunity', 'difficulty'],
              },
            },
            keywordGaps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  keyword: { type: 'string' },
                  competitorPosition: { type: 'number' },
                  searchVolume: { type: 'number' },
                  difficulty: { type: 'number', minimum: 0, maximum: 1 },
                  opportunity: { type: 'number', minimum: 0, maximum: 1 },
                  searchIntent: { type: 'string' },
                },
                required: ['keyword', 'competitorPosition', 'opportunity'],
              },
            },
            topicGaps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  topic: { type: 'string' },
                  competitorCoverage: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                  },
                  ourCoverage: { type: 'number', minimum: 0, maximum: 1 },
                  opportunity: { type: 'number', minimum: 0, maximum: 1 },
                  suggestedKeywords: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
                required: [
                  'topic',
                  'competitorCoverage',
                  'ourCoverage',
                  'opportunity',
                ],
              },
            },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['content', 'seo', 'keyword', 'technical'],
                  },
                  priority: {
                    type: 'string',
                    enum: ['low', 'medium', 'high', 'urgent'],
                  },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  estimatedImpact: { type: 'number', minimum: 0, maximum: 1 },
                  estimatedEffort: { type: 'number' },
                  resources: { type: 'array', items: { type: 'string' } },
                },
                required: [
                  'type',
                  'priority',
                  'title',
                  'description',
                  'estimatedImpact',
                  'estimatedEffort',
                ],
              },
            },
            opportunities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: ['keyword', 'topic', 'content_gap', 'technical'],
                  },
                  potential: { type: 'number', minimum: 0, maximum: 1 },
                  difficulty: { type: 'number', minimum: 0, maximum: 1 },
                  timeline: { type: 'string' },
                  keywords: { type: 'array', items: { type: 'string' } },
                  competitorUrls: { type: 'array', items: { type: 'string' } },
                },
                required: [
                  'title',
                  'description',
                  'type',
                  'potential',
                  'difficulty',
                  'timeline',
                ],
              },
            },
          },
          required: [
            'overallScore',
            'contentGaps',
            'keywordGaps',
            'topicGaps',
            'recommendations',
            'opportunities',
          ],
        },
        prompt,
      });

      const analysis: CompetitorAnalysis = {
        id: `analysis_${competitor.id}_${Date.now()}`,
        competitorId: competitor.id,
        overallScore: result.object.overallScore,
        contentQuality: result.object.contentQuality,
        seoStrength: result.object.seoStrength,
        socialPresence: result.object.socialPresence,
        contentGaps: result.object.contentGaps,
        keywordGaps: result.object.keywordGaps,
        topicGaps: result.object.topicGaps,
        recommendations: result.object.recommendations,
        opportunities: result.object.opportunities,
        analyzedAt: new Date(),
        competitor,
      };

      return analysis;
    } catch (error) {
      console.error(`Error analyzing competitor ${domain}:`, error);
      throw new Error(
        `Competitor analysis failed for ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Identify SERP competitors for keywords
   */
  async identifySERPCompetitors(keywords: string[]): Promise<Competitor[]> {
    try {
      const prompt = `
        Identify the top competitors that consistently rank well for these keywords: ${keywords.join(', ')}.
        
        For each competitor, analyze:
        1. Domain authority and trust signals
        2. Content quality and depth
        3. SEO optimization level
        4. Frequency of ranking in top 10
        5. Content strategy patterns
        
        Focus on direct competitors that target similar audiences and content themes.
        Exclude generic platforms (Wikipedia, LinkedIn, etc.) and focus on content publishers.
      `;

      const result = await this.model.generateObject({
        schema: {
          type: 'object',
          properties: {
            competitors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  domain: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: ['direct', 'indirect', 'aspirational'],
                  },
                  domainAuthority: { type: 'number' },
                  estimatedTraffic: { type: 'number' },
                  contentStrategy: { type: 'string' },
                  strengths: { type: 'array', items: { type: 'string' } },
                  weaknesses: { type: 'array', items: { type: 'string' } },
                },
                required: ['domain', 'name', 'type'],
              },
            },
          },
          required: ['competitors'],
        },
        prompt,
      });

      const competitors = await Promise.all(
        result.object.competitors.map(async competitorData => {
          const competitor = await this.getOrCreateCompetitor(
            competitorData.domain,
            competitorData.name,
            competitorData.description,
            competitorData.type as CompetitorType,
          );

          // Update metrics if provided
          if (
            competitorData.domainAuthority ||
            competitorData.estimatedTraffic
          ) {
            await this.updateCompetitorMetrics(competitor.id, {
              domainAuthority: competitorData.domainAuthority,
              monthlyTraffic: competitorData.estimatedTraffic,
            });
          }

          return competitor;
        }),
      );

      return competitors;
    } catch (error) {
      console.error('Error identifying SERP competitors:', error);
      throw new Error(
        `SERP competitor identification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Analyze content gaps across all competitors
   */
  async identifyContentGaps(
    analyses: CompetitorAnalysis[],
    request: CompetitorAnalysisRequest,
  ): Promise<ContentGap[]> {
    try {
      const allGaps = analyses.flatMap(analysis => analysis.contentGaps);
      const keywords = request.keywords?.join(', ') || 'target keywords';

      const prompt = `
        Analyze these content gaps identified across competitor analysis:
        
        ${JSON.stringify(allGaps, null, 2)}
        
        Target keywords: ${keywords}
        
        Consolidate and prioritize the most significant content gaps that represent:
        1. High opportunity, medium-low difficulty gaps
        2. Gaps with substantial search volume potential
        3. Gaps that align with our keyword targets
        4. Gaps that could establish topical authority
        5. Gaps with clear competitive differentiation potential
        
        Remove duplicates and rank by strategic importance.
      `;

      const result = await this.model.generateObject({
        schema: {
          type: 'object',
          properties: {
            consolidatedGaps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  description: { type: 'string' },
                  opportunity: { type: 'number', minimum: 0, maximum: 1 },
                  difficulty: { type: 'number', minimum: 0, maximum: 1 },
                  estimatedTraffic: { type: 'number' },
                  keywords: { type: 'array', items: { type: 'string' } },
                  competitorUrls: { type: 'array', items: { type: 'string' } },
                  strategicValue: { type: 'string' },
                  contentAngle: { type: 'string' },
                },
                required: ['type', 'description', 'opportunity', 'difficulty'],
              },
            },
          },
          required: ['consolidatedGaps'],
        },
        prompt,
      });

      return result.object.consolidatedGaps;
    } catch (error) {
      console.error('Error identifying content gaps:', error);
      return analyses.flatMap(analysis => analysis.contentGaps);
    }
  }

  /**
   * Generate strategic opportunities from gap analysis
   */
  async identifyOpportunities(
    analyses: CompetitorAnalysis[],
    gaps: ContentGap[],
  ): Promise<Opportunity[]> {
    try {
      const prompt = `
        Based on competitor analysis and content gaps, identify the top strategic opportunities.
        
        Competitor Analysis Summary:
        - ${analyses.length} competitors analyzed
        - Average competitor score: ${(analyses.reduce((sum, a) => sum + a.overallScore, 0) / analyses.length).toFixed(2)}
        - Key strengths to address: ${analyses
          .flatMap(a => a.recommendations.filter(r => r.priority === 'high'))
          .map(r => r.title)
          .join(', ')}
        
        Content Gaps Identified:
        ${gaps.map(gap => `- ${gap.type}: ${gap.description} (Opportunity: ${gap.opportunity}, Difficulty: ${gap.difficulty})`).join('\n')}
        
        Generate strategic opportunities that:
        1. Leverage identified content gaps
        2. Address competitor weaknesses
        3. Build on our potential strengths
        4. Have clear ROI potential
        5. Are actionable within reasonable timelines
        
        Prioritize opportunities by impact vs effort ratio.
      `;

      const result = await this.model.generateObject({
        schema: {
          type: 'object',
          properties: {
            opportunities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: ['keyword', 'topic', 'content_gap', 'technical'],
                  },
                  potential: { type: 'number', minimum: 0, maximum: 1 },
                  difficulty: { type: 'number', minimum: 0, maximum: 1 },
                  timeline: { type: 'string' },
                  keywords: { type: 'array', items: { type: 'string' } },
                  competitorUrls: { type: 'array', items: { type: 'string' } },
                  actionSteps: { type: 'array', items: { type: 'string' } },
                  expectedOutcome: { type: 'string' },
                  successMetrics: { type: 'array', items: { type: 'string' } },
                },
                required: [
                  'title',
                  'description',
                  'type',
                  'potential',
                  'difficulty',
                  'timeline',
                ],
              },
            },
          },
          required: ['opportunities'],
        },
        prompt,
      });

      return result.object.opportunities;
    } catch (error) {
      console.error('Error identifying opportunities:', error);
      return [];
    }
  }

  /**
   * Generate strategic recommendations
   */
  async generateRecommendations(
    analyses: CompetitorAnalysis[],
    gaps: ContentGap[],
    opportunities: Opportunity[],
  ): Promise<Recommendation[]> {
    try {
      const prompt = `
        Generate strategic recommendations based on comprehensive competitor analysis.
        
        Analysis Overview:
        - Competitors analyzed: ${analyses.length}
        - Content gaps identified: ${gaps.length}
        - Opportunities found: ${opportunities.length}
        
        Key Findings:
        ${analyses.map(a => `- ${a.competitor.domain}: Score ${a.overallScore}, Strengths: SEO ${a.seoStrength}, Content ${a.contentQuality}`).join('\n')}
        
        Top Opportunities:
        ${opportunities
          .slice(0, 5)
          .map(
            o =>
              `- ${o.title} (${o.type}): Potential ${o.potential}, Difficulty ${o.difficulty}`,
          )
          .join('\n')}
        
        Provide actionable recommendations that:
        1. Address the highest-impact opportunities
        2. Leverage competitor weaknesses
        3. Build sustainable competitive advantages
        4. Have clear implementation paths
        5. Balance quick wins with long-term strategy
        
        Prioritize recommendations by strategic importance and feasibility.
      `;

      const result = await this.model.generateObject({
        schema: {
          type: 'object',
          properties: {
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['content', 'seo', 'keyword', 'technical'],
                  },
                  priority: {
                    type: 'string',
                    enum: ['low', 'medium', 'high', 'urgent'],
                  },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  estimatedImpact: { type: 'number', minimum: 0, maximum: 1 },
                  estimatedEffort: { type: 'number' },
                  resources: { type: 'array', items: { type: 'string' } },
                  timeline: { type: 'string' },
                  successMetrics: { type: 'array', items: { type: 'string' } },
                  dependencies: { type: 'array', items: { type: 'string' } },
                },
                required: [
                  'type',
                  'priority',
                  'title',
                  'description',
                  'estimatedImpact',
                  'estimatedEffort',
                ],
              },
            },
          },
          required: ['recommendations'],
        },
        prompt,
      });

      return result.object.recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return analyses.flatMap(analysis => analysis.recommendations);
    }
  }

  /**
   * Track competitor keyword rankings over time
   */
  async trackCompetitorKeywords(
    competitorId: string,
    keywords: string[],
  ): Promise<CompetitorKeyword[]> {
    if (!this.prisma) {
      throw new Error('Database connection required for keyword tracking');
    }

    try {
      // In a real implementation, this would integrate with SEO APIs like Ahrefs, SEMrush, etc.
      // For now, we'll simulate the data
      const trackedKeywords: CompetitorKeyword[] = [];

      for (const keyword of keywords) {
        // Simulate API call to get ranking data
        const rankingData = await this.simulateKeywordRanking(keyword);

        const competitorKeyword = await this.prisma.competitorKeyword.upsert({
          where: {
            competitorId_keyword: {
              competitorId,
              keyword,
            },
          },
          update: {
            position: rankingData.position,
            searchVolume: rankingData.searchVolume,
            difficulty: rankingData.difficulty,
            traffic: rankingData.traffic,
            url: rankingData.url,
            opportunity: rankingData.opportunity,
            updatedAt: new Date(),
          },
          create: {
            competitorId,
            keyword,
            position: rankingData.position,
            searchVolume: rankingData.searchVolume,
            difficulty: rankingData.difficulty,
            traffic: rankingData.traffic,
            url: rankingData.url,
            opportunity: rankingData.opportunity,
            trackedAt: new Date(),
            updatedAt: new Date(),
          },
          include: {
            competitor: true,
          },
        });

        trackedKeywords.push(
          this.mapPrismaCompetitorKeywordToType(competitorKeyword),
        );
      }

      return trackedKeywords;
    } catch (error) {
      console.error('Error tracking competitor keywords:', error);
      throw new Error(
        `Keyword tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Private helper methods

  private buildCompetitorAnalysisPrompt(
    domain: string,
    request: CompetitorAnalysisRequest,
  ): string {
    const keywords = request.keywords?.join(', ') || 'target keywords';
    const depth = request.depth || 'detailed';

    return `
      Conduct comprehensive competitive analysis for: ${domain}
      
      Analysis Requirements:
      - Target keywords: ${keywords}
      - Include content analysis: ${request.includeContent ?? true}
      - Include keyword analysis: ${request.includeKeywords ?? true}
      - Include topic analysis: ${request.includeTopics ?? true}
      - Analysis depth: ${depth}
      
      Analyze the competitor across these dimensions:
      
      1. **Overall Competitive Strength** (0-1 score)
         - Domain authority and trust signals
         - Content publishing frequency and consistency
         - SEO optimization level
         - Social media presence and engagement
         - Brand recognition and authority
      
      2. **Content Quality Analysis**
         - Content depth and comprehensiveness
         - Writing quality and expertise
         - Visual content and design
         - User engagement indicators
         - Content freshness and updates
      
      3. **SEO Strength Assessment**
         - On-page optimization
         - Technical SEO implementation
         - Keyword targeting strategy
         - Link building and backlink profile
         - SERP performance across keywords
      
      4. **Content Gap Identification**
         - Topics they cover well that we don't
         - Keyword opportunities where they rank but we don't
         - Content formats they use effectively
         - Audience segments they serve
         - Geographic or demographic gaps
      
      5. **Strategic Opportunities**
         - Content topics we could cover better
         - Keywords where we could compete
         - Content gaps in their strategy
         - Technical or UX improvements we could make
         - Differentiation opportunities
      
      6. **Actionable Recommendations**
         - Specific content topics to create
         - Keywords to target
         - Content improvements to make
         - SEO optimizations to implement
         - Competitive differentiation strategies
      
      Focus on actionable insights that can inform content strategy and competitive positioning.
    `;
  }

  private async getOrCreateCompetitor(
    domain: string,
    name?: string,
    description?: string,
    type: CompetitorType = 'direct',
  ): Promise<Competitor> {
    if (!this.prisma) {
      // Return mock competitor if no database
      return {
        id: `competitor_${domain.replace(/\./g, '_')}`,
        name: name || domain,
        domain,
        description,
        type,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        content: [],
        topics: [],
        keywords: [],
        analysis: [],
      };
    }

    try {
      const competitor = await this.prisma.competitor.upsert({
        where: { domain },
        update: {
          name: name || undefined,
          description: description || undefined,
          type,
          updatedAt: new Date(),
        },
        create: {
          name: name || domain,
          domain,
          description,
          type,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          content: true,
          topics: true,
          keywords: true,
          analysis: true,
        },
      });

      return this.mapPrismaCompetitorToType(competitor);
    } catch (error) {
      console.error(`Error getting/creating competitor ${domain}:`, error);
      throw error;
    }
  }

  private async updateCompetitorMetrics(
    competitorId: string,
    metrics: Partial<DomainMetrics>,
  ): Promise<void> {
    if (!this.prisma) return;

    try {
      await this.prisma.competitor.update({
        where: { id: competitorId },
        data: {
          domainAuthority: metrics.domainAuthority,
          monthlyTraffic: metrics.monthlyTraffic,
          backlinks: metrics.backlinks,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating competitor metrics:', error);
    }
  }

  private async simulateKeywordRanking(keyword: string): Promise<{
    position: number;
    searchVolume?: number;
    difficulty?: number;
    traffic?: number;
    url?: string;
    opportunity: number;
  }> {
    // This would be replaced with real SEO API calls
    return {
      position: Math.floor(Math.random() * 100) + 1,
      searchVolume: Math.floor(Math.random() * 10000),
      difficulty: Math.random(),
      traffic: Math.floor(Math.random() * 1000),
      url: `https://example.com/${keyword.replace(/\s+/g, '-')}`,
      opportunity: Math.random(),
    };
  }

  private generateAnalysisSummary(
    analyses: CompetitorAnalysis[],
    gaps: ContentGap[],
    opportunities: Opportunity[],
  ): ReportSummary {
    const keyFindings = [
      `Analyzed ${analyses.length} competitors with average strength score of ${(analyses.reduce((sum, a) => sum + a.overallScore, 0) / analyses.length).toFixed(2)}`,
      `Identified ${gaps.length} content gaps with ${gaps.filter(g => g.opportunity > 0.7).length} high-opportunity gaps`,
      `Found ${opportunities.length} strategic opportunities with ${opportunities.filter(o => o.potential > 0.7 && o.difficulty < 0.5).length} quick wins`,
      `Top competitor strengths: ${analyses.reduce((acc, a) => (a.seoStrength > acc.seo ? { seo: a.seoStrength, domain: a.competitor.domain } : acc), { seo: 0, domain: '' }).domain}`,
      `Biggest opportunity: ${opportunities.sort((a, b) => b.potential - b.difficulty - (a.potential - a.difficulty))[0]?.title || 'None identified'}`,
    ];

    return {
      keyFindings,
      opportunities: opportunities.filter(o => o.potential > 0.6).length,
      threats: analyses.filter(a => a.overallScore > 0.8).length,
      overallScore: Math.min(
        1,
        Math.max(
          0,
          1 -
            analyses.reduce((sum, a) => sum + a.overallScore, 0) /
              analyses.length,
        ),
      ),
      confidence: Math.min(1, analyses.length / 5), // Confidence increases with more competitors analyzed
    };
  }

  private async saveAnalysisResults(
    response: CompetitorAnalysisResponse,
  ): Promise<void> {
    if (!this.prisma) return;

    try {
      // Save competitor analyses
      for (const analysis of response.analysis) {
        await this.prisma.competitorAnalysis.create({
          data: {
            competitorId: analysis.competitorId,
            overallScore: analysis.overallScore,
            contentQuality: analysis.contentQuality,
            seoStrength: analysis.seoStrength,
            socialPresence: analysis.socialPresence,
            contentGaps: analysis.contentGaps as any,
            keywordGaps: analysis.keywordGaps as any,
            topicGaps: analysis.topicGaps as any,
            recommendations: analysis.recommendations as any,
            opportunities: analysis.opportunities as any,
            analyzedAt: analysis.analyzedAt,
          },
        });
      }
    } catch (error) {
      console.error('Error saving analysis results:', error);
    }
  }

  // Mapping functions
  private mapPrismaCompetitorToType(prismaCompetitor: any): Competitor {
    return {
      id: prismaCompetitor.id,
      name: prismaCompetitor.name,
      domain: prismaCompetitor.domain,
      description: prismaCompetitor.description,
      type: prismaCompetitor.type,
      domainAuthority: prismaCompetitor.domainAuthority,
      monthlyTraffic: prismaCompetitor.monthlyTraffic,
      backlinks: prismaCompetitor.backlinks,
      isActive: prismaCompetitor.isActive,
      createdAt: prismaCompetitor.createdAt,
      updatedAt: prismaCompetitor.updatedAt,
      content: prismaCompetitor.content || [],
      topics: prismaCompetitor.topics || [],
      keywords: prismaCompetitor.keywords || [],
      analysis: prismaCompetitor.analysis || [],
    };
  }

  private mapPrismaCompetitorKeywordToType(
    prismaKeyword: any,
  ): CompetitorKeyword {
    return {
      id: prismaKeyword.id,
      competitorId: prismaKeyword.competitorId,
      keyword: prismaKeyword.keyword,
      position: prismaKeyword.position,
      searchVolume: prismaKeyword.searchVolume,
      difficulty: prismaKeyword.difficulty,
      traffic: prismaKeyword.traffic,
      url: prismaKeyword.url,
      ourPosition: prismaKeyword.ourPosition,
      gapSize: prismaKeyword.gapSize,
      opportunity: prismaKeyword.opportunity,
      competitor: this.mapPrismaCompetitorToType(prismaKeyword.competitor),
      trackedAt: prismaKeyword.trackedAt,
      updatedAt: prismaKeyword.updatedAt,
    };
  }

  /**
   * Clear cache entries older than TTL
   */
  public clearExpiredCache(): void {
    const now = Date.now();
    const ttlMs = this.cacheTTL * 60 * 60 * 1000;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > ttlMs) {
        this.cache.delete(key);
      }
    }
  }
}
