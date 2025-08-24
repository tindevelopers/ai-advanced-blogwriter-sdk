
/**
 * Topic Research & Trend Analysis Service
 * Intelligent topic discovery and trend analysis using AI providers
 */

import { 
  TopicResearch, 
  TopicCluster, 
  TopicRelationship,
  TopicResearchRequest,
  TopicResearchResponse,
  TrendData,
  SeasonalityData,
  KeywordData,
  CompetitionLevel,
  Priority,
  TopicStatus
} from '../types/strategy-engine';

import { LanguageModel } from 'ai';
import { PrismaClient } from '../generated/prisma-client';
import {
  TopicResearchSchema,
  RelatedTopicsSchema,
  TopicValidationSchema
} from '../schemas/ai-schemas';

export interface TopicResearchConfig {
  model: LanguageModel;
  prisma?: PrismaClient;
  cacheResults?: boolean;
  cacheTTL?: number; // hours
}

export class TopicResearchService {
  private model: LanguageModel;
  private prisma?: PrismaClient;
  private cacheResults: boolean;
  private cacheTTL: number;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config: TopicResearchConfig) {
    this.model = config.model;
    this.prisma = config.prisma;
    this.cacheResults = config.cacheResults ?? true;
    this.cacheTTL = config.cacheTTL ?? 24; // 24 hours default
  }

  /**
   * Research a topic with comprehensive analysis
   */
  async researchTopic(request: TopicResearchRequest): Promise<TopicResearchResponse> {
    const cacheKey = `topic_research_${JSON.stringify(request)}`;
    
    // Check cache first
    if (this.cacheResults && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.cacheTTL * 60 * 60 * 1000) {
        return cached.data;
      }
    }

    try {
      // Generate comprehensive topic research using AI
      const researchPrompt = this.buildTopicResearchPrompt(request);
      
      const result = await this.model.generateObject({
        schema: TopicResearchSchema,
        prompt: researchPrompt
      });

      const response: TopicResearchResponse = {
        topic: await this.createTopicFromAIResult(result.object.topic, request),
        keywords: result.object.keywords,
        trends: result.object.trends,
        competitors: [], // Will be populated if includeCompetitors is true
        opportunities: result.object.opportunities,
        confidence: result.object.confidence
      };

      // Include competitor analysis if requested
      if (request.includeCompetitors) {
        response.competitors = await this.analyzeCompetitorTopics(request.query, response.keywords);
      }

      // Cache the result
      if (this.cacheResults) {
        this.cache.set(cacheKey, { data: response, timestamp: Date.now() });
      }

      // Save to database if Prisma is available
      if (this.prisma) {
        await this.saveTopic(response.topic);
      }

      return response;

    } catch (error) {
      console.error('Error in topic research:', error);
      throw new Error(`Topic research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Discover trending topics in a specific niche
   */
  async discoverTrendingTopics(niche: string, limit: number = 10): Promise<TopicResearch[]> {
    const prompt = `
      Analyze the "${niche}" niche and identify the top ${limit} trending topics that are gaining momentum.
      
      For each topic, provide:
      1. Title and description
      2. Primary and secondary keywords
      3. Trend momentum and direction
      4. Opportunity score (0-1) based on search volume vs competition
      5. Content gap analysis
      6. Estimated effort required
      
      Focus on topics that are:
      - Currently trending upward
      - Have good search volume potential
      - Show content gaps in the market
      - Are aligned with the "${niche}" niche
      
      Return comprehensive data for strategic content planning.
    `;

    try {
      const result = await this.model.generateObject({
        schema: {
          type: 'object',
          properties: {
            topics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  primaryKeywords: { type: 'array', items: { type: 'string' } },
                  secondaryKeywords: { type: 'array', items: { type: 'string' } },
                  longTailKeywords: { type: 'array', items: { type: 'string' } },
                  trendScore: { type: 'number', minimum: 0, maximum: 1 },
                  opportunityScore: { type: 'number', minimum: 0, maximum: 1 },
                  competitionLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
                  contentGapScore: { type: 'number', minimum: 0, maximum: 1 },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                  estimatedEffort: { type: 'number' },
                  peakMonths: { type: 'array', items: { type: 'string' } },
                  tags: { type: 'array', items: { type: 'string' } }
                },
                required: ['title', 'primaryKeywords', 'trendScore', 'opportunityScore']
              }
            }
          },
          required: ['topics']
        },
        prompt
      });

      const topics = await Promise.all(
        result.object.topics.map(topicData => this.createTopicFromAIResult(topicData))
      );

      // Save to database if available
      if (this.prisma) {
        for (const topic of topics) {
          await this.saveTopic(topic);
        }
      }

      return topics;

    } catch (error) {
      console.error('Error discovering trending topics:', error);
      throw new Error(`Trending topics discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze seasonality patterns for a topic
   */
  async analyzeSeasonality(topic: string, keywords: string[]): Promise<SeasonalityData> {
    const prompt = `
      Analyze the seasonality patterns for the topic "${topic}" with these keywords: ${keywords.join(', ')}.
      
      Provide:
      1. Monthly search volume patterns
      2. Peak and low seasons
      3. Volatility analysis
      4. Year-over-year trends
      5. Predictable seasonal fluctuations
      
      Base your analysis on known search behavior patterns, seasonal events, industry cycles, and consumer behavior.
    `;

    try {
      const result = await this.model.generateObject({
        schema: {
          type: 'object',
          properties: {
            months: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  month: { type: 'string' },
                  searchVolume: { type: 'number' },
                  trend: { type: 'number', minimum: -1, maximum: 1 }
                },
                required: ['month', 'searchVolume', 'trend']
              }
            },
            peakSeason: { type: 'string' },
            lowSeason: { type: 'string' },
            volatility: { type: 'number', minimum: 0, maximum: 1 }
          },
          required: ['months', 'peakSeason', 'lowSeason', 'volatility']
        },
        prompt
      });

      return result.object;

    } catch (error) {
      console.error('Error analyzing seasonality:', error);
      throw new Error(`Seasonality analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find related topics and build topic clusters
   */
  async findRelatedTopics(topicId: string, maxResults: number = 5): Promise<TopicResearch[]> {
    if (!this.prisma) {
      throw new Error('Database connection required for finding related topics');
    }

    try {
      const baseTopic = await this.prisma.topicResearch.findUnique({
        where: { id: topicId }
      });

      if (!baseTopic) {
        throw new Error('Base topic not found');
      }

      const prompt = `
        Find ${maxResults} topics related to "${baseTopic.title}".
        
        Base topic keywords: ${baseTopic.primaryKeywords.join(', ')}
        Base topic description: ${baseTopic.description || 'Not provided'}
        
        For each related topic, provide:
        1. How it relates to the base topic
        2. Complementary keywords
        3. Content angle differences
        4. Audience overlap potential
        5. Strategic value for content series
        
        Focus on topics that would work well together in a content strategy.
      `;

      const result = await this.model.generateObject({
        schema: {
          type: 'object',
          properties: {
            relatedTopics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  relationshipType: { 
                    type: 'string', 
                    enum: ['related', 'prerequisite', 'followup', 'similar', 'alternative'] 
                  },
                  strength: { type: 'number', minimum: 0, maximum: 1 },
                  primaryKeywords: { type: 'array', items: { type: 'string' } },
                  secondaryKeywords: { type: 'array', items: { type: 'string' } },
                  opportunityScore: { type: 'number', minimum: 0, maximum: 1 },
                  competitionLevel: { type: 'string', enum: ['low', 'medium', 'high'] }
                },
                required: ['title', 'relationshipType', 'strength', 'primaryKeywords']
              }
            }
          },
          required: ['relatedTopics']
        },
        prompt
      });

      const relatedTopics = await Promise.all(
        result.object.relatedTopics.map(async (topicData) => {
          const topic = await this.createTopicFromAIResult(topicData);
          await this.saveTopic(topic);
          
          // Create relationship
          await this.createTopicRelationship(
            topicId, 
            topic.id, 
            topicData.relationshipType,
            topicData.strength
          );
          
          return topic;
        })
      );

      return relatedTopics;

    } catch (error) {
      console.error('Error finding related topics:', error);
      throw new Error(`Related topics search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Score topic opportunities based on multiple factors
   */
  async scoreTopicOpportunity(topic: TopicResearch): Promise<number> {
    const prompt = `
      Analyze the opportunity score for this topic:
      
      Title: ${topic.title}
      Primary Keywords: ${topic.primaryKeywords.join(', ')}
      Competition Level: ${topic.competitionLevel}
      Current Opportunity Score: ${topic.opportunityScore}
      Content Gap Score: ${topic.contentGapScore}
      
      Consider:
      1. Search volume potential
      2. Competition difficulty
      3. Content gap opportunities
      4. Trending momentum
      5. Commercial intent
      6. Authority building potential
      7. Content series potential
      
      Provide a refined opportunity score (0-1) with detailed reasoning.
    `;

    try {
      const result = await this.model.generateObject({
        schema: {
          type: 'object',
          properties: {
            opportunityScore: { type: 'number', minimum: 0, maximum: 1 },
            reasoning: { type: 'string' },
            factors: {
              type: 'object',
              properties: {
                searchVolume: { type: 'number', minimum: 0, maximum: 1 },
                competition: { type: 'number', minimum: 0, maximum: 1 },
                contentGap: { type: 'number', minimum: 0, maximum: 1 },
                trending: { type: 'number', minimum: 0, maximum: 1 },
                commercial: { type: 'number', minimum: 0, maximum: 1 },
                authority: { type: 'number', minimum: 0, maximum: 1 }
              },
              required: ['searchVolume', 'competition', 'contentGap']
            },
            recommendations: { type: 'array', items: { type: 'string' } }
          },
          required: ['opportunityScore', 'reasoning', 'factors']
        },
        prompt
      });

      return result.object.opportunityScore;

    } catch (error) {
      console.error('Error scoring topic opportunity:', error);
      return topic.opportunityScore; // Return existing score on error
    }
  }

  // Private helper methods

  private buildTopicResearchPrompt(request: TopicResearchRequest): string {
    return `
      Conduct comprehensive topic research for: "${request.query}"
      
      Research Requirements:
      - Depth: ${request.depth || 'detailed'}
      - Include Keywords: ${request.includeKeywords ?? true}
      - Include Trends: ${request.includeTrends ?? true}
      - Include Competitors: ${request.includeCompetitors ?? false}
      - Language: ${request.language || 'English'}
      - Location: ${request.location || 'Global'}
      
      Provide:
      1. Comprehensive topic analysis with primary, secondary, and long-tail keywords
      2. Opportunity scoring based on search volume vs competition
      3. Content gap identification
      4. Trend analysis with momentum indicators
      5. Strategic recommendations for content creation
      6. Estimated effort and priority assessment
      
      Focus on actionable insights for content strategy and competitive positioning.
    `;
  }

  private async createTopicFromAIResult(aiResult: any, request?: TopicResearchRequest): Promise<TopicResearch> {
    const slug = aiResult.title?.toLowerCase()?.replace(/[^a-z0-9]+/g, '-')?.replace(/^-|-$/g, '') || '';
    
    return {
      id: `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: aiResult.title || '',
      slug,
      description: aiResult.description,
      primaryKeywords: aiResult.primaryKeywords || [],
      secondaryKeywords: aiResult.secondaryKeywords || [],
      longTailKeywords: aiResult.longTailKeywords || [],
      
      // Search data - would be populated from real APIs in production
      searchVolume: aiResult.searchVolume,
      keywordDifficulty: aiResult.keywordDifficulty,
      cpc: aiResult.cpc,
      seasonalityData: aiResult.seasonalityData,
      
      // Trend analysis
      trendScore: aiResult.trendScore || 0.5,
      trending: aiResult.trending || false,
      trendData: aiResult.trendData,
      peakMonths: aiResult.peakMonths || [],
      
      // Opportunity scoring
      opportunityScore: aiResult.opportunityScore || 0.5,
      competitionLevel: aiResult.competitionLevel || 'medium',
      contentGapScore: aiResult.contentGapScore || 0.5,
      
      // Metadata
      status: 'researched' as TopicStatus,
      priority: aiResult.priority || 'medium',
      estimatedEffort: aiResult.estimatedEffort,
      tags: aiResult.tags || [],
      
      clusterId: aiResult.clusterId,
      
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Related entities - initialized empty
      competitors: [],
      contentBriefs: [],
      calendarEntries: [],
      relatedTopics: [],
      relatedFrom: []
    };
  }

  private async analyzeCompetitorTopics(query: string, keywords: KeywordData[]): Promise<any[]> {
    // This would integrate with competitor analysis service
    // For now, return empty array
    return [];
  }

  private async saveTopic(topic: TopicResearch): Promise<void> {
    if (!this.prisma) return;

    try {
      await this.prisma.topicResearch.upsert({
        where: { slug: topic.slug },
        update: {
          title: topic.title,
          description: topic.description,
          primaryKeywords: topic.primaryKeywords,
          secondaryKeywords: topic.secondaryKeywords,
          longTailKeywords: topic.longTailKeywords,
          searchVolume: topic.searchVolume,
          keywordDifficulty: topic.keywordDifficulty,
          cpc: topic.cpc,
          seasonalityData: topic.seasonalityData as any,
          trendScore: topic.trendScore,
          trending: topic.trending,
          trendData: topic.trendData as any,
          peakMonths: topic.peakMonths,
          opportunityScore: topic.opportunityScore,
          competitionLevel: topic.competitionLevel,
          contentGapScore: topic.contentGapScore,
          status: topic.status,
          priority: topic.priority,
          estimatedEffort: topic.estimatedEffort,
          tags: topic.tags,
          clusterId: topic.clusterId,
          updatedAt: new Date()
        },
        create: {
          id: topic.id,
          title: topic.title,
          slug: topic.slug,
          description: topic.description,
          primaryKeywords: topic.primaryKeywords,
          secondaryKeywords: topic.secondaryKeywords,
          longTailKeywords: topic.longTailKeywords,
          searchVolume: topic.searchVolume,
          keywordDifficulty: topic.keywordDifficulty,
          cpc: topic.cpc,
          seasonalityData: topic.seasonalityData as any,
          trendScore: topic.trendScore,
          trending: topic.trending,
          trendData: topic.trendData as any,
          peakMonths: topic.peakMonths,
          opportunityScore: topic.opportunityScore,
          competitionLevel: topic.competitionLevel,
          contentGapScore: topic.contentGapScore,
          status: topic.status,
          priority: topic.priority,
          estimatedEffort: topic.estimatedEffort,
          tags: topic.tags,
          clusterId: topic.clusterId,
          createdAt: topic.createdAt,
          updatedAt: topic.updatedAt
        }
      });
    } catch (error) {
      console.error('Error saving topic:', error);
    }
  }

  private async createTopicRelationship(
    fromTopicId: string, 
    toTopicId: string, 
    relationshipType: string, 
    strength: number
  ): Promise<void> {
    if (!this.prisma) return;

    try {
      await this.prisma.topicRelationship.create({
        data: {
          fromTopicId,
          toTopicId,
          relationshipType,
          strength
        }
      });
    } catch (error) {
      console.error('Error creating topic relationship:', error);
    }
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

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Would need to implement hit tracking
    };
  }
}
