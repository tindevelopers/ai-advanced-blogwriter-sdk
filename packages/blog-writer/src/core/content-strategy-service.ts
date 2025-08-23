
/**
 * Unified Content Strategy Service
 * Orchestrates all content strategy engine components for comprehensive content planning
 */

import {
  TopicResearch,
  EditorialCalendar,
  EditorialCalendarEntry,
  CompetitorAnalysis,
  ContentBrief,
  StrategyReport,
  ReportSummary,
  Recommendation,
  Opportunity,
  Priority
} from '../types/strategy-engine';

import { LanguageModel } from 'ai';
import { PrismaClient } from '../generated/prisma-client';

import { TopicResearchService } from './topic-research-service';
import { EditorialCalendarService } from './editorial-calendar-service';
import { CompetitorAnalysisService } from './competitor-analysis-service';
import { ContentBriefService } from './content-brief-service';

export interface ContentStrategyConfig {
  model: LanguageModel;
  prisma?: PrismaClient;
  cacheResults?: boolean;
  cacheTTL?: number; // hours
}

export interface StrategyAnalysisRequest {
  niche: string;
  targetKeywords?: string[];
  competitors?: string[];
  timeframe: {
    start: Date;
    end: Date;
  };
  goals: {
    contentVolume?: number; // posts per month
    targetAudience?: string[];
    businessObjectives?: string[];
  };
  constraints?: {
    budget?: number;
    teamSize?: number;
    expertiseAreas?: string[];
  };
}

export interface ComprehensiveStrategyResponse {
  overview: StrategyOverview;
  topics: TopicResearch[];
  calendar: EditorialCalendar;
  competitorInsights: CompetitorAnalysis[];
  contentBriefs: ContentBrief[];
  recommendations: Recommendation[];
  opportunities: Opportunity[];
  report: StrategyReport;
  implementation: ImplementationPlan;
}

export interface StrategyOverview {
  totalTopicsIdentified: number;
  highPriorityTopics: number;
  calendarEntries: number;
  competitorsAnalyzed: number;
  contentGapsFound: number;
  overallOpportunityScore: number;
  estimatedTimeToImplement: number; // weeks
  confidenceScore: number;
}

export interface ImplementationPlan {
  phases: ImplementationPhase[];
  timeline: string;
  resources: ResourceRequirement[];
  milestones: Milestone[];
  riskAssessment: Risk[];
}

export interface ImplementationPhase {
  name: string;
  description: string;
  duration: string;
  activities: string[];
  deliverables: string[];
  dependencies: string[];
}

export interface ResourceRequirement {
  type: 'content_writer' | 'seo_specialist' | 'designer' | 'developer' | 'tools';
  quantity: number;
  duration: string;
  skills: string[];
}

export interface Milestone {
  name: string;
  description: string;
  targetDate: Date;
  success_criteria: string[];
  dependencies: string[];
}

export interface Risk {
  type: 'competition' | 'resource' | 'technical' | 'market';
  description: string;
  impact: 'low' | 'medium' | 'high';
  probability: 'low' | 'medium' | 'high';
  mitigation: string;
}

export class ContentStrategyService {
  private model: LanguageModel;
  private prisma?: PrismaClient;
  private topicResearchService: TopicResearchService;
  private calendarService: EditorialCalendarService;
  private competitorAnalysisService: CompetitorAnalysisService;
  private briefService: ContentBriefService;
  private cacheResults: boolean;
  private cacheTTL: number;

  constructor(config: ContentStrategyConfig) {
    this.model = config.model;
    this.prisma = config.prisma;
    this.cacheResults = config.cacheResults ?? true;
    this.cacheTTL = config.cacheTTL ?? 24;

    // Initialize all sub-services
    this.topicResearchService = new TopicResearchService({
      model: this.model,
      prisma: this.prisma,
      cacheResults: this.cacheResults,
      cacheTTL: this.cacheTTL
    });

    this.calendarService = new EditorialCalendarService({
      model: this.model,
      prisma: this.prisma,
      autoAssignment: true
    });

    this.competitorAnalysisService = new CompetitorAnalysisService({
      model: this.model,
      prisma: this.prisma,
      cacheResults: this.cacheResults,
      cacheTTL: this.cacheTTL
    });

    this.briefService = new ContentBriefService({
      model: this.model,
      prisma: this.prisma,
      topicResearchService: this.topicResearchService,
      competitorAnalysisService: this.competitorAnalysisService
    });
  }

  /**
   * Generate comprehensive content strategy
   */
  async generateStrategy(request: StrategyAnalysisRequest): Promise<ComprehensiveStrategyResponse> {
    try {
      console.log('Starting comprehensive content strategy generation...');

      // Phase 1: Topic Research & Discovery
      console.log('Phase 1: Discovering trending topics...');
      const trendingTopics = await this.topicResearchService.discoverTrendingTopics(
        request.niche, 
        request.goals.contentVolume || 20
      );

      // Research additional topics based on target keywords
      let additionalTopics: TopicResearch[] = [];
      if (request.targetKeywords?.length) {
        console.log('Phase 1b: Researching target keywords...');
        additionalTopics = await Promise.all(
          request.targetKeywords.slice(0, 5).map(keyword =>
            this.topicResearchService.researchTopic({
              query: keyword,
              includeKeywords: true,
              includeTrends: true,
              includeCompetitors: true,
              depth: 'detailed'
            }).then(response => response.topic)
          )
        );
      }

      const allTopics = [...trendingTopics, ...additionalTopics];

      // Phase 2: Competitor Analysis
      console.log('Phase 2: Analyzing competitors...');
      let competitorAnalyses: CompetitorAnalysis[] = [];
      if (request.competitors?.length) {
        const competitorResponse = await this.competitorAnalysisService.analyzeCompetitors({
          competitors: request.competitors,
          keywords: request.targetKeywords,
          includeContent: true,
          includeKeywords: true,
          includeTopics: true,
          depth: 'detailed'
        });
        competitorAnalyses = competitorResponse.analysis;
      }

      // Phase 3: Editorial Calendar Generation
      console.log('Phase 3: Creating editorial calendar...');
      const calendarResponse = await this.calendarService.generateCalendar({
        startDate: request.timeframe.start,
        endDate: request.timeframe.end,
        topics: allTopics.slice(0, 10).map(t => t.title),
        priority: 'medium'
      });

      // Phase 4: Content Brief Generation
      console.log('Phase 4: Generating content briefs...');
      const contentBriefs = await Promise.all(
        allTopics.slice(0, 8).map(topic =>
          this.briefService.createBriefFromTopic(topic.id)
        )
      );

      // Phase 5: Strategic Analysis & Recommendations
      console.log('Phase 5: Generating strategic recommendations...');
      const strategicAnalysis = await this.generateStrategicAnalysis(
        request,
        allTopics,
        competitorAnalyses,
        calendarResponse.entries,
        contentBriefs
      );

      // Phase 6: Implementation Plan
      console.log('Phase 6: Creating implementation plan...');
      const implementationPlan = await this.createImplementationPlan(
        request,
        strategicAnalysis
      );

      // Compile comprehensive response
      const response: ComprehensiveStrategyResponse = {
        overview: {
          totalTopicsIdentified: allTopics.length,
          highPriorityTopics: allTopics.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
          calendarEntries: calendarResponse.entries.length,
          competitorsAnalyzed: competitorAnalyses.length,
          contentGapsFound: competitorAnalyses.reduce((sum, c) => sum + c.contentGaps.length, 0),
          overallOpportunityScore: allTopics.reduce((sum, t) => sum + t.opportunityScore, 0) / allTopics.length,
          estimatedTimeToImplement: this.calculateImplementationTime(implementationPlan),
          confidenceScore: this.calculateConfidenceScore(allTopics, competitorAnalyses)
        },
        topics: allTopics,
        calendar: calendarResponse.calendar,
        competitorInsights: competitorAnalyses,
        contentBriefs,
        recommendations: strategicAnalysis.recommendations,
        opportunities: strategicAnalysis.opportunities,
        report: await this.generateStrategyReport(request, strategicAnalysis),
        implementation: implementationPlan
      };

      console.log('Content strategy generation completed successfully');
      return response;

    } catch (error) {
      console.error('Error generating content strategy:', error);
      throw new Error(`Content strategy generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze content performance and suggest optimizations
   */
  async analyzeContentPerformance(
    timeframe: { start: Date; end: Date },
    metrics?: {
      traffic?: boolean;
      rankings?: boolean;
      engagement?: boolean;
    }
  ): Promise<{
    performance: ContentPerformanceAnalysis;
    optimizations: ContentOptimization[];
    nextActions: string[];
  }> {
    try {
      const prompt = `
        Analyze content performance for the period: ${timeframe.start.toISOString()} to ${timeframe.end.toISOString()}
        
        Analysis should include:
        1. Top performing content pieces
        2. Underperforming content that needs optimization
        3. Content gaps based on performance data
        4. SEO optimization opportunities
        5. Content refresh recommendations
        6. New content suggestions based on performance patterns
        
        ${metrics?.traffic ? 'Include traffic analysis' : ''}
        ${metrics?.rankings ? 'Include ranking analysis' : ''}
        ${metrics?.engagement ? 'Include engagement analysis' : ''}
        
        Provide actionable insights for content strategy optimization.
      `;

      const result = await this.model.generateObject({
        schema: {
          type: 'object',
          properties: {
            performance: {
              type: 'object',
              properties: {
                topPerformers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      metrics: { type: 'object' },
                      successFactors: { type: 'array', items: { type: 'string' } }
                    }
                  }
                },
                underperformers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      issues: { type: 'array', items: { type: 'string' } },
                      optimizationPotential: { type: 'number' }
                    }
                  }
                },
                overallTrends: { type: 'array', items: { type: 'string' } }
              }
            },
            optimizations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                  estimatedImpact: { type: 'number' },
                  effort: { type: 'number' },
                  timeline: { type: 'string' }
                }
              }
            },
            nextActions: { type: 'array', items: { type: 'string' } }
          },
          required: ['performance', 'optimizations', 'nextActions']
        },
        prompt
      });

      return result.object as any;

    } catch (error) {
      console.error('Error analyzing content performance:', error);
      throw new Error(`Content performance analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate content strategy report
   */
  async generateStrategyReport(
    request: StrategyAnalysisRequest,
    analysis: any
  ): Promise<StrategyReport> {
    try {
      const prompt = `
        Generate a comprehensive content strategy report based on the analysis:
        
        Strategy Request:
        - Niche: ${request.niche}
        - Target Keywords: ${request.targetKeywords?.join(', ') || 'Not specified'}
        - Competitors: ${request.competitors?.join(', ') || 'Not specified'}
        - Timeframe: ${request.timeframe.start.toISOString()} to ${request.timeframe.end.toISOString()}
        - Content Goals: ${request.goals.contentVolume || 0} posts per month
        
        Analysis Results:
        - Topics Identified: ${analysis.topics?.length || 0}
        - Competitors Analyzed: ${analysis.competitors?.length || 0}
        - Opportunities Found: ${analysis.opportunities?.length || 0}
        - Recommendations Generated: ${analysis.recommendations?.length || 0}
        
        Create an executive summary that includes:
        1. Key strategic findings
        2. Market opportunity assessment
        3. Competitive landscape insights
        4. Content strategy recommendations
        5. Implementation roadmap
        6. Success metrics and KPIs
        7. Risk assessment and mitigation
        
        Make it actionable and business-focused.
      `;

      const result = await this.model.generateObject({
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            type: { type: 'string', enum: ['topic_analysis', 'competitor_analysis', 'content_gap', 'opportunity'] },
            summary: {
              type: 'object',
              properties: {
                keyFindings: { type: 'array', items: { type: 'string' } },
                opportunities: { type: 'number' },
                threats: { type: 'number' },
                overallScore: { type: 'number' },
                confidence: { type: 'number' }
              }
            },
            data: { type: 'object' },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['content', 'seo', 'keyword', 'technical'] },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  estimatedImpact: { type: 'number' },
                  estimatedEffort: { type: 'number' }
                }
              }
            },
            nextSteps: { type: 'array', items: { type: 'string' } }
          },
          required: ['title', 'type', 'summary', 'recommendations', 'nextSteps']
        },
        prompt
      });

      const report: StrategyReport = {
        id: `report_${Date.now()}`,
        title: result.object.title,
        type: result.object.type as any,
        generatedAt: new Date(),
        summary: result.object.summary as ReportSummary,
        data: analysis,
        recommendations: result.object.recommendations as Recommendation[],
        nextSteps: result.object.nextSteps
      };

      return report;

    } catch (error) {
      console.error('Error generating strategy report:', error);
      throw new Error(`Strategy report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create content calendar from strategy analysis
   */
  async createContentCalendarFromStrategy(
    strategy: ComprehensiveStrategyResponse,
    preferences?: {
      postsPerWeek?: number;
      preferredDays?: string[];
      authorAssignments?: Record<string, string[]>;
    }
  ): Promise<EditorialCalendar> {
    try {
      // Prioritize topics based on opportunity score and difficulty
      const prioritizedTopics = strategy.topics
        .sort((a, b) => (b.opportunityScore - b.contentGapScore) - (a.opportunityScore - a.contentGapScore))
        .slice(0, preferences?.postsPerWeek ? preferences.postsPerWeek * 4 : 16); // 4 weeks worth

      const calendarEntries = await Promise.all(
        prioritizedTopics.map(async (topic, index) => {
          const startDate = new Date();
          const plannedDate = new Date(startDate.getTime() + (index * 3 * 24 * 60 * 60 * 1000)); // Every 3 days

          return this.calendarService.addEntry({
            title: topic.title,
            description: topic.description,
            plannedDate,
            dueDate: new Date(plannedDate.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days to complete
            contentType: 'BLOG',
            priority: topic.priority as Priority,
            topicId: topic.id,
            targetWordCount: topic.estimatedEffort ? topic.estimatedEffort * 200 : 1500, // 200 words per hour estimate
            estimatedHours: topic.estimatedEffort,
            tags: topic.tags,
            categories: topic.clusterId ? [topic.clusterId] : []
          });
        })
      );

      return strategy.calendar;

    } catch (error) {
      console.error('Error creating content calendar from strategy:', error);
      throw error;
    }
  }

  // Private helper methods

  private async generateStrategicAnalysis(
    request: StrategyAnalysisRequest,
    topics: TopicResearch[],
    competitors: CompetitorAnalysis[],
    calendarEntries: EditorialCalendarEntry[],
    briefs: ContentBrief[]
  ): Promise<{ recommendations: Recommendation[]; opportunities: Opportunity[] }> {
    try {
      const prompt = `
        Analyze the comprehensive content strategy data and provide strategic recommendations:
        
        Context:
        - Niche: ${request.niche}
        - Topics Researched: ${topics.length}
        - High-Opportunity Topics: ${topics.filter(t => t.opportunityScore > 0.7).length}
        - Competitors Analyzed: ${competitors.length}
        - Calendar Entries: ${calendarEntries.length}
        - Content Briefs: ${briefs.length}
        
        Topic Insights:
        - Average Opportunity Score: ${(topics.reduce((sum, t) => sum + t.opportunityScore, 0) / topics.length).toFixed(2)}
        - High-Priority Topics: ${topics.filter(t => t.priority === 'high' || t.priority === 'urgent').map(t => t.title).join(', ')}
        
        Competitor Insights:
        - Average Competitor Strength: ${competitors.length ? (competitors.reduce((sum, c) => sum + c.overallScore, 0) / competitors.length).toFixed(2) : 'N/A'}
        - Total Content Gaps Identified: ${competitors.reduce((sum, c) => sum + c.contentGaps.length, 0)}
        
        Provide:
        1. Strategic recommendations prioritized by impact and feasibility
        2. High-value opportunities with clear potential
        3. Competitive differentiation strategies
        4. Content optimization recommendations
        5. Resource allocation suggestions
        
        Focus on actionable insights that can drive measurable business results.
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
                  type: { type: 'string', enum: ['content', 'seo', 'keyword', 'technical'] },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  estimatedImpact: { type: 'number' },
                  estimatedEffort: { type: 'number' },
                  resources: { type: 'array', items: { type: 'string' } },
                  timeline: { type: 'string' },
                  successMetrics: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            opportunities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  type: { type: 'string', enum: ['keyword', 'topic', 'content_gap', 'technical'] },
                  potential: { type: 'number' },
                  difficulty: { type: 'number' },
                  timeline: { type: 'string' },
                  keywords: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          },
          required: ['recommendations', 'opportunities']
        },
        prompt
      });

      return result.object;

    } catch (error) {
      console.error('Error generating strategic analysis:', error);
      return { recommendations: [], opportunities: [] };
    }
  }

  private async createImplementationPlan(
    request: StrategyAnalysisRequest,
    analysis: any
  ): Promise<ImplementationPlan> {
    try {
      const prompt = `
        Create a detailed implementation plan for the content strategy:
        
        Strategy Context:
        - Niche: ${request.niche}
        - Timeframe: ${request.timeframe.start.toISOString()} to ${request.timeframe.end.toISOString()}
        - Content Volume Goal: ${request.goals.contentVolume || 'Not specified'} posts per month
        - Team Size: ${request.constraints?.teamSize || 'Not specified'}
        - Budget: ${request.constraints?.budget || 'Not specified'}
        
        Analysis Results:
        - Recommendations: ${analysis.recommendations?.length || 0}
        - Opportunities: ${analysis.opportunities?.length || 0}
        
        Create an implementation plan with:
        1. Phased approach (3-6 phases)
        2. Timeline and dependencies
        3. Resource requirements
        4. Key milestones
        5. Risk assessment and mitigation
        
        Make it practical and achievable based on the constraints.
      `;

      const result = await this.model.generateObject({
        schema: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  duration: { type: 'string' },
                  activities: { type: 'array', items: { type: 'string' } },
                  deliverables: { type: 'array', items: { type: 'string' } },
                  dependencies: { type: 'array', items: { type: 'string' } }
                },
                required: ['name', 'description', 'duration', 'activities', 'deliverables']
              }
            },
            timeline: { type: 'string' },
            resources: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['content_writer', 'seo_specialist', 'designer', 'developer', 'tools'] },
                  quantity: { type: 'number' },
                  duration: { type: 'string' },
                  skills: { type: 'array', items: { type: 'string' } }
                },
                required: ['type', 'quantity', 'duration', 'skills']
              }
            },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  targetDate: { type: 'string' },
                  success_criteria: { type: 'array', items: { type: 'string' } },
                  dependencies: { type: 'array', items: { type: 'string' } }
                },
                required: ['name', 'description', 'targetDate', 'success_criteria']
              }
            },
            riskAssessment: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['competition', 'resource', 'technical', 'market'] },
                  description: { type: 'string' },
                  impact: { type: 'string', enum: ['low', 'medium', 'high'] },
                  probability: { type: 'string', enum: ['low', 'medium', 'high'] },
                  mitigation: { type: 'string' }
                },
                required: ['type', 'description', 'impact', 'probability', 'mitigation']
              }
            }
          },
          required: ['phases', 'timeline', 'resources', 'milestones', 'riskAssessment']
        },
        prompt
      });

      // Convert string dates to Date objects
      const milestones = result.object.milestones.map(m => ({
        ...m,
        targetDate: new Date(m.targetDate)
      }));

      return {
        ...result.object,
        milestones
      } as ImplementationPlan;

    } catch (error) {
      console.error('Error creating implementation plan:', error);
      throw new Error(`Implementation plan creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateImplementationTime(plan: ImplementationPlan): number {
    // Extract duration from phases and calculate total weeks
    const totalDuration = plan.phases.reduce((total, phase) => {
      const match = phase.duration.match(/(\d+)\s*(week|month)/i);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        return total + (unit === 'month' ? value * 4 : value);
      }
      return total + 4; // Default to 4 weeks if can't parse
    }, 0);

    return Math.max(totalDuration, 4); // Minimum 4 weeks
  }

  private calculateConfidenceScore(topics: TopicResearch[], competitors: CompetitorAnalysis[]): number {
    const topicConfidence = topics.length > 10 ? 0.8 : topics.length / 10 * 0.8;
    const competitorConfidence = competitors.length > 3 ? 0.2 : competitors.length / 3 * 0.2;
    return Math.min(topicConfidence + competitorConfidence, 1.0);
  }

  /**
   * Get service instances for advanced usage
   */
  public getServices() {
    return {
      topicResearch: this.topicResearchService,
      calendar: this.calendarService,
      competitorAnalysis: this.competitorAnalysisService,
      contentBrief: this.briefService
    };
  }

  /**
   * Clear all service caches
   */
  public clearAllCaches(): void {
    this.topicResearchService.clearExpiredCache();
    this.competitorAnalysisService.clearExpiredCache();
  }
}

// Additional interfaces for content performance analysis
interface ContentPerformanceAnalysis {
  topPerformers: Array<{
    title: string;
    metrics: Record<string, number>;
    successFactors: string[];
  }>;
  underperformers: Array<{
    title: string;
    issues: string[];
    optimizationPotential: number;
  }>;
  overallTrends: string[];
}

interface ContentOptimization {
  type: string;
  title: string;
  description: string;
  priority: Priority;
  estimatedImpact: number;
  effort: number;
  timeline: string;
}
