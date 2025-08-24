/**
 * Content Brief Generation Service
 * AI-powered content brief generation with comprehensive research and strategy
 */

import {
  ContentBrief,
  ContentBriefRequest,
  ContentBriefResponse,
  ContentOutline,
  OutlineSection,
  TargetKeywords,
  KeywordData,
  ResearchSource,
  Statistic,
  BriefCompetitorAnalysis,
  ExternalLink,
  SearchIntent,
  BriefStatus,
  TopicResearch,
} from '../types/strategy-engine';

import { LanguageModel } from 'ai';
import { PrismaClient } from '../generated/prisma-client';
import { TopicResearchService } from './topic-research-service';
import { CompetitorAnalysisService } from './competitor-analysis-service';

export interface ContentBriefConfig {
  model: LanguageModel;
  prisma?: PrismaClient;
  topicResearchService?: TopicResearchService;
  competitorAnalysisService?: CompetitorAnalysisService;
  includeResearchByDefault?: boolean;
  includeCompetitorAnalysisByDefault?: boolean;
  includeOutlineByDefault?: boolean;
  defaultWordCount?: number;
}

export interface BriefPersona {
  name: string;
  demographics: {
    age?: string;
    location?: string;
    income?: string;
    education?: string;
  };
  psychographics: {
    interests: string[];
    painPoints: string[];
    goals: string[];
    challenges: string[];
  };
  behaviors: {
    contentConsumption: string[];
    searchBehavior: string[];
    decisionMaking: string[];
  };
}

export interface BriefTemplate {
  id: string;
  name: string;
  contentType: string;
  sections: string[];
  requiredElements: string[];
  suggestedElements: string[];
  wordCountRange: { min: number; max: number };
  typicalTone: string[];
  keywordDensityTarget: number;
  readingLevelTarget: number;
}

export class ContentBriefService {
  private model: LanguageModel;
  private prisma?: PrismaClient;
  private topicResearchService?: TopicResearchService;
  private competitorAnalysisService?: CompetitorAnalysisService;
  private includeResearchByDefault: boolean;
  private includeCompetitorAnalysisByDefault: boolean;
  private includeOutlineByDefault: boolean;
  private defaultWordCount: number;

  constructor(config: ContentBriefConfig) {
    this.model = config.model;
    this.prisma = config.prisma;
    this.topicResearchService = config.topicResearchService;
    this.competitorAnalysisService = config.competitorAnalysisService;
    this.includeResearchByDefault = config.includeResearchByDefault ?? true;
    this.includeCompetitorAnalysisByDefault =
      config.includeCompetitorAnalysisByDefault ?? true;
    this.includeOutlineByDefault = config.includeOutlineByDefault ?? true;
    this.defaultWordCount = config.defaultWordCount ?? 1500;
  }

  /**
   * Generate comprehensive content brief
   */
  async generateBrief(
    request: ContentBriefRequest,
  ): Promise<ContentBriefResponse> {
    const startTime = Date.now();

    try {
      // Generate slug from title
      const slug = this.generateSlug(request.title);

      // Build comprehensive prompt
      const prompt = await this.buildBriefGenerationPrompt(request);

      // Generate the brief using AI
      const result = await this.model.generateObject({
        schema: this.getBriefSchema(),
        prompt,
      });

      // Process and enhance the generated brief
      const brief = await this.processBriefResult(result.object, request, slug);

      // Add research data if requested
      if (request.includeResearch && this.topicResearchService) {
        brief.researchSources = await this.gatherResearchSources(
          request.title,
          request.primaryKeyword,
        );
      }

      // Add competitor analysis if requested
      if (request.includeCompetitorAnalysis && this.competitorAnalysisService) {
        brief.competitorAnalysis = await this.generateCompetitorAnalysis(
          request.primaryKeyword || request.title,
          request.secondaryKeywords,
        );
      }

      // Generate outline if requested
      if (request.includeOutline) {
        brief.outline = await this.generateContentOutline(brief);
      }

      // Save to database if available
      if (this.prisma) {
        await this.saveBrief(brief);
      }

      const response: ContentBriefResponse = {
        brief,
        confidence: result.object.confidence || 0.85,
        generatedSections: this.getGeneratedSections(brief),
        researchTime: (Date.now() - startTime) / 1000,
      };

      return response;
    } catch (error) {
      console.error('Error generating content brief:', error);
      throw new Error(
        `Content brief generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Generate content outline from brief
   */
  async generateContentOutline(brief: ContentBrief): Promise<ContentOutline> {
    try {
      const prompt = `
        Create a detailed content outline for: "${brief.title}"
        
        Brief Details:
        - Primary Keyword: ${brief.primaryKeyword}
        - Secondary Keywords: ${brief.secondaryKeywords.join(', ')}
        - Target Word Count: ${brief.targetWordCount}
        - Target Audience: ${brief.targetAudience}
        - Content Type: ${brief.targetContentType}
        - Search Intent: ${brief.searchIntent}
        
        Required Sections: ${brief.requiredSections.join(', ')}
        Suggested Sections: ${brief.suggestedSections.join(', ')}
        
        User Questions to Address: ${brief.userQuestions.join(', ')}
        Pain Points to Address: ${brief.painPoints.join(', ')}
        
        Create a comprehensive outline that:
        1. Flows logically from introduction to conclusion
        2. Addresses user intent and questions
        3. Incorporates target keywords naturally
        4. Includes engaging subheadings
        5. Balances information density
        6. Includes CTAs and engagement elements
        
        Structure the outline with estimated word counts for each section.
      `;

      const result = await this.model.generateObject({
        schema: {
          type: 'object',
          properties: {
            structure: {
              type: 'string',
              enum: ['linear', 'pillar', 'listicle', 'comparison', 'guide'],
            },
            estimatedWordCount: { type: 'number' },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: ['introduction', 'main', 'conclusion', 'cta', 'faq'],
                  },
                  required: { type: 'boolean' },
                  estimatedWords: { type: 'number' },
                  keywords: { type: 'array', items: { type: 'string' } },
                  subsections: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        type: { type: 'string' },
                        required: { type: 'boolean' },
                        estimatedWords: { type: 'number' },
                        keywords: { type: 'array', items: { type: 'string' } },
                      },
                      required: ['title', 'type', 'required', 'estimatedWords'],
                    },
                  },
                },
                required: ['title', 'type', 'required', 'estimatedWords'],
              },
            },
          },
          required: ['structure', 'estimatedWordCount', 'sections'],
        },
        prompt,
      });

      return {
        sections: result.object.sections as OutlineSection[],
        estimatedWordCount: result.object.estimatedWordCount,
        structure: result.object.structure as ContentOutline['structure'],
      };
    } catch (error) {
      console.error('Error generating content outline:', error);
      throw new Error(
        `Outline generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Create brief from topic research
   */
  async createBriefFromTopic(
    topicId: string,
    customization?: Partial<ContentBrief>,
  ): Promise<ContentBrief> {
    if (!this.prisma) {
      throw new Error(
        'Database connection required for topic-based brief generation',
      );
    }

    try {
      const topic = await this.prisma.topicResearch.findUnique({
        where: { id: topicId },
        include: {
          cluster: true,
          relatedTopics: {
            include: {
              toTopic: true,
            },
          },
        },
      });

      if (!topic) {
        throw new Error('Topic not found');
      }

      // Create brief request from topic data
      const request: ContentBriefRequest = {
        title: customization?.title || topic.title,
        primaryKeyword: topic.primaryKeywords[0],
        secondaryKeywords: topic.secondaryKeywords,
        targetAudience: customization?.targetAudience,
        contentType: customization?.targetContentType || 'BLOG',
        includeCompetitorAnalysis: true,
        includeResearch: true,
        includeOutline: true,
      };

      const response = await this.generateBrief(request);

      // Link the brief to the topic
      response.brief.topicId = topicId;
      response.brief.clusterId = topic.clusterId;

      // Update the brief with topic-specific data
      response.brief.targetKeywords = {
        primary: {
          keyword: topic.primaryKeywords[0] || '',
          searchVolume: topic.searchVolume,
          difficulty: topic.keywordDifficulty,
          intent: this.inferSearchIntent(topic.primaryKeywords[0] || ''),
          trending: topic.trending,
        },
        secondary: topic.secondaryKeywords.map(kw => ({
          keyword: kw,
          intent: this.inferSearchIntent(kw),
        })),
        longTail: topic.longTailKeywords.map(kw => ({
          keyword: kw,
          intent: this.inferSearchIntent(kw),
        })),
        semantic: [],
      };

      // Apply customizations
      if (customization) {
        Object.assign(response.brief, customization);
      }

      // Save the updated brief
      if (this.prisma) {
        await this.saveBrief(response.brief);
      }

      return response.brief;
    } catch (error) {
      console.error('Error creating brief from topic:', error);
      throw new Error(
        `Brief creation from topic failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Generate persona-specific content briefs
   */
  async generatePersonaBrief(
    baseRequest: ContentBriefRequest,
    persona: BriefPersona,
  ): Promise<ContentBrief> {
    try {
      const prompt = `
        Create a content brief specifically tailored for this persona:
        
        Persona Profile:
        - Name: ${persona.name}
        - Demographics: ${JSON.stringify(persona.demographics)}
        - Interests: ${persona.psychographics.interests.join(', ')}
        - Pain Points: ${persona.psychographics.painPoints.join(', ')}
        - Goals: ${persona.psychographics.goals.join(', ')}
        - Content Consumption: ${persona.behaviors.contentConsumption.join(', ')}
        
        Base Content Request:
        - Title: ${baseRequest.title}
        - Primary Keyword: ${baseRequest.primaryKeyword}
        - Secondary Keywords: ${baseRequest.secondaryKeywords?.join(', ')}
        - Content Type: ${baseRequest.contentType}
        
        Customize the content brief to:
        1. Address this persona's specific pain points
        2. Use language and tone that resonates
        3. Include examples relevant to their situation
        4. Structure content for their consumption preferences
        5. Address their specific goals and challenges
        6. Include CTAs that match their decision-making process
        
        Focus on creating highly targeted, persona-specific content guidance.
      `;

      const result = await this.model.generateObject({
        schema: this.getBriefSchema(),
        prompt,
      });

      const brief = await this.processBriefResult(
        result.object,
        baseRequest,
        this.generateSlug(baseRequest.title),
      );

      // Add persona-specific customizations
      brief.primaryPersona = persona.name;
      brief.userQuestions = [
        ...brief.userQuestions,
        ...persona.psychographics.painPoints.map(p => `How can I solve ${p}?`),
        ...persona.psychographics.goals.map(g => `How can I achieve ${g}?`),
      ];
      brief.painPoints = [
        ...brief.painPoints,
        ...persona.psychographics.painPoints,
      ];

      return brief;
    } catch (error) {
      console.error('Error generating persona-specific brief:', error);
      throw new Error(
        `Persona brief generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Update existing brief with new research
   */
  async updateBriefWithResearch(briefId: string): Promise<ContentBrief> {
    if (!this.prisma) {
      throw new Error('Database connection required for brief updates');
    }

    try {
      const brief = await this.prisma.contentBrief.findUnique({
        where: { id: briefId },
      });

      if (!brief) {
        throw new Error('Content brief not found');
      }

      // Gather fresh research data
      const researchSources = await this.gatherResearchSources(
        brief.title,
        brief.primaryKeyword,
      );

      // Update competitor analysis
      let competitorAnalysis;
      if (this.competitorAnalysisService) {
        competitorAnalysis = await this.generateCompetitorAnalysis(
          brief.primaryKeyword || brief.title,
          brief.secondaryKeywords,
        );
      }

      // Update the brief
      const updatedBrief = await this.prisma.contentBrief.update({
        where: { id: briefId },
        data: {
          researchSources: researchSources as any,
          competitorAnalysis: competitorAnalysis as any,
          version: brief.version + 1,
          updatedAt: new Date(),
        },
      });

      return this.mapPrismaBriefToType(updatedBrief);
    } catch (error) {
      console.error('Error updating brief with research:', error);
      throw new Error(
        `Brief update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Generate brief template for content type
   */
  async generateBriefTemplate(contentType: string): Promise<BriefTemplate> {
    try {
      const prompt = `
        Create a content brief template for ${contentType} content.
        
        Define:
        1. Required sections that must be included
        2. Suggested optional sections
        3. Typical word count ranges
        4. Recommended tone options
        5. Target keyword density
        6. Optimal reading level
        7. Key elements that make this content type effective
        
        Focus on creating a reusable template that ensures consistency and quality.
      `;

      const result = await this.model.generateObject({
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            contentType: { type: 'string' },
            sections: { type: 'array', items: { type: 'string' } },
            requiredElements: { type: 'array', items: { type: 'string' } },
            suggestedElements: { type: 'array', items: { type: 'string' } },
            wordCountRange: {
              type: 'object',
              properties: {
                min: { type: 'number' },
                max: { type: 'number' },
              },
              required: ['min', 'max'],
            },
            typicalTone: { type: 'array', items: { type: 'string' } },
            keywordDensityTarget: { type: 'number' },
            readingLevelTarget: { type: 'number' },
          },
          required: [
            'name',
            'contentType',
            'sections',
            'requiredElements',
            'wordCountRange',
          ],
        },
        prompt,
      });

      return {
        id: `template_${contentType.toLowerCase().replace(/\s+/g, '_')}`,
        ...result.object,
      } as BriefTemplate;
    } catch (error) {
      console.error('Error generating brief template:', error);
      throw new Error(
        `Template generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Private helper methods

  private async buildBriefGenerationPrompt(
    request: ContentBriefRequest,
  ): Promise<string> {
    const basePrompt = `
      Generate a comprehensive content brief for: "${request.title}"
      
      Requirements:
      - Primary Keyword: ${request.primaryKeyword || 'Not specified'}
      - Secondary Keywords: ${request.secondaryKeywords?.join(', ') || 'Not specified'}
      - Target Audience: ${request.targetAudience || 'General audience'}
      - Content Type: ${request.contentType || 'Blog post'}
      
      Create a detailed content brief that includes:
      
      1. **Content Strategy**
         - Clear content objectives and goals
         - Target audience definition and personas
         - Search intent analysis (informational, commercial, navigational, transactional)
         - Content angle and unique value proposition
      
      2. **SEO Requirements**
         - Primary and secondary keyword integration strategy
         - Target keyword density (2-3% for primary)
         - Meta title and description recommendations
         - Internal and external linking strategy
         - Schema markup suggestions
      
      3. **Content Structure**
         - Required sections that must be included
         - Suggested optional sections for comprehensive coverage
         - Recommended content flow and organization
         - Call-to-action placement and messaging
      
      4. **Research Requirements**
         - Key statistics and data points to include
         - Expert quotes and citations needed
         - Examples and case studies to feature
         - Visual content requirements (images, charts, infographics)
      
      5. **User Experience Focus**
         - Key questions users have about this topic
         - Pain points to address
         - Solutions and benefits to highlight
         - Reading level and tone recommendations
      
      6. **Quality Standards**
         - Target word count range
         - Readability requirements
         - Fact-checking and source verification needs
         - Brand voice and tone guidelines
      
      7. **Competitive Differentiation**
         - How to stand out from existing content
         - Unique angles or perspectives to take
         - Value-adds that competitors are missing
         - Content gaps to fill
      
      Make the brief actionable, specific, and strategically focused on creating high-quality, user-focused content that ranks well and drives engagement.
    `;

    return basePrompt;
  }

  private getBriefSchema() {
    return {
      type: 'object',
      properties: {
        description: { type: 'string' },
        targetWordCount: { type: 'number' },
        targetAudience: { type: 'string' },
        searchIntent: {
          type: 'string',
          enum: [
            'informational',
            'commercial',
            'navigational',
            'transactional',
          ],
        },
        requiredSections: { type: 'array', items: { type: 'string' } },
        suggestedSections: { type: 'array', items: { type: 'string' } },
        examplesNeeded: { type: 'array', items: { type: 'string' } },
        differentiators: { type: 'array', items: { type: 'string' } },
        callsToAction: { type: 'array', items: { type: 'string' } },
        internalLinks: { type: 'array', items: { type: 'string' } },
        imagesNeeded: { type: 'array', items: { type: 'string' } },
        secondaryPersonas: { type: 'array', items: { type: 'string' } },
        userQuestions: { type: 'array', items: { type: 'string' } },
        painPoints: { type: 'array', items: { type: 'string' } },
        metaTitle: { type: 'string' },
        metaDescription: { type: 'string' },
        focusKeywordDensity: { type: 'number' },
        readingLevel: { type: 'number' },
        tone: { type: 'string' },
        externalLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              anchor: { type: 'string' },
              authority: { type: 'number' },
              relevance: { type: 'number' },
              reason: { type: 'string' },
            },
            required: ['url', 'anchor', 'authority', 'relevance', 'reason'],
          },
        },
        statisticsToInclude: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              description: { type: 'string' },
              source: { type: 'string' },
              year: { type: 'number' },
              relevance: { type: 'number' },
            },
            required: ['value', 'description', 'source', 'relevance'],
          },
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
      required: [
        'description',
        'targetWordCount',
        'searchIntent',
        'requiredSections',
        'userQuestions',
        'painPoints',
      ],
    };
  }

  private async processBriefResult(
    aiResult: any,
    request: ContentBriefRequest,
    slug: string,
  ): Promise<ContentBrief> {
    const brief: ContentBrief = {
      id: `brief_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: request.title,
      slug,
      description: aiResult.description,
      targetWordCount: aiResult.targetWordCount || this.defaultWordCount,
      targetContentType: request.contentType || 'BLOG',
      targetAudience: aiResult.targetAudience || request.targetAudience,
      primaryKeyword: request.primaryKeyword,
      secondaryKeywords: request.secondaryKeywords || [],
      searchIntent: aiResult.searchIntent as SearchIntent,
      requiredSections: aiResult.requiredSections || [],
      suggestedSections: aiResult.suggestedSections || [],
      examplesNeeded: aiResult.examplesNeeded || [],
      differentiators: aiResult.differentiators || [],
      callsToAction: aiResult.callsToAction || [],
      internalLinks: aiResult.internalLinks || [],
      externalLinks: aiResult.externalLinks || [],
      imagesNeeded: aiResult.imagesNeeded || [],
      primaryPersona: aiResult.primaryPersona,
      secondaryPersonas: aiResult.secondaryPersonas || [],
      userQuestions: aiResult.userQuestions || [],
      painPoints: aiResult.painPoints || [],
      metaTitle: aiResult.metaTitle,
      metaDescription: aiResult.metaDescription,
      focusKeywordDensity: aiResult.focusKeywordDensity,
      readingLevel: aiResult.readingLevel,
      tone: aiResult.tone as any,
      status: 'draft' as BriefStatus,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      blogPosts: [],
      calendarEntries: [],
    };

    // Process statistics if provided
    if (aiResult.statisticsToInclude) {
      brief.statisticsToInclude = aiResult.statisticsToInclude.map(stat => ({
        value: stat.value,
        description: stat.description,
        source: stat.source,
        year: stat.year,
        relevance: stat.relevance,
      }));
    }

    return brief;
  }

  private async gatherResearchSources(
    title: string,
    primaryKeyword?: string,
  ): Promise<ResearchSource[]> {
    try {
      const prompt = `
        Find authoritative research sources for the topic: "${title}"
        ${primaryKeyword ? `Primary keyword: ${primaryKeyword}` : ''}
        
        Identify 5-8 high-quality sources including:
        1. Industry studies and reports
        2. Expert articles and whitepapers
        3. Government or academic sources
        4. Tool-based data and statistics
        5. Case studies and examples
        
        For each source, provide:
        - Title and URL (use realistic but example URLs)
        - Source type and authority level
        - Key quotes or statistics
        - Relevance to the topic
        
        Focus on sources that would provide credible, up-to-date information.
      `;

      const result = await this.model.generateObject({
        schema: {
          type: 'object',
          properties: {
            sources: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  url: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: ['article', 'study', 'report', 'news', 'tool'],
                  },
                  authority: { type: 'number', minimum: 0, maximum: 1 },
                  relevance: { type: 'number', minimum: 0, maximum: 1 },
                  keyQuotes: { type: 'array', items: { type: 'string' } },
                  statistics: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        value: { type: 'string' },
                        description: { type: 'string' },
                        source: { type: 'string' },
                        year: { type: 'number' },
                        relevance: { type: 'number' },
                      },
                      required: ['value', 'description', 'source', 'relevance'],
                    },
                  },
                },
                required: ['title', 'url', 'type', 'authority', 'relevance'],
              },
            },
          },
          required: ['sources'],
        },
        prompt,
      });

      return result.object.sources;
    } catch (error) {
      console.error('Error gathering research sources:', error);
      return [];
    }
  }

  private async generateCompetitorAnalysis(
    keyword: string,
    secondaryKeywords?: string[],
  ): Promise<BriefCompetitorAnalysis> {
    if (!this.competitorAnalysisService) {
      return {
        topCompetitors: [],
        gapAnalysis: [],
        strengthsToAddress: [],
        weaknessesToExploit: [],
        differentiationStrategy: [],
      };
    }

    try {
      // Use the competitor analysis service to get data
      const analysisRequest = {
        competitors: [], // Would be populated from SERP analysis
        keywords: [keyword, ...(secondaryKeywords || [])],
        includeContent: true,
        includeKeywords: true,
        depth: 'basic' as const,
      };

      // For now, return mock data since we don't have actual competitors
      const prompt = `
        Analyze competitor content for keyword: "${keyword}"
        ${secondaryKeywords ? `Related keywords: ${secondaryKeywords.join(', ')}` : ''}
        
        Provide:
        1. Top 3-5 competitors likely ranking for this keyword
        2. Content gaps they haven't addressed
        3. Their main strengths we need to address
        4. Their weaknesses we can exploit
        5. Differentiation strategy recommendations
      `;

      const result = await this.model.generateObject({
        schema: {
          type: 'object',
          properties: {
            topCompetitors: { type: 'array', items: { type: 'string' } },
            gapAnalysis: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  description: { type: 'string' },
                  opportunity: { type: 'number' },
                  difficulty: { type: 'number' },
                },
                required: ['type', 'description', 'opportunity', 'difficulty'],
              },
            },
            strengthsToAddress: { type: 'array', items: { type: 'string' } },
            weaknessesToExploit: { type: 'array', items: { type: 'string' } },
            differentiationStrategy: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: [
            'topCompetitors',
            'gapAnalysis',
            'strengthsToAddress',
            'weaknessesToExploit',
            'differentiationStrategy',
          ],
        },
        prompt,
      });

      return result.object;
    } catch (error) {
      console.error('Error generating competitor analysis for brief:', error);
      return {
        topCompetitors: [],
        gapAnalysis: [],
        strengthsToAddress: [],
        weaknessesToExploit: [],
        differentiationStrategy: [],
      };
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private inferSearchIntent(keyword: string): SearchIntent {
    const commercial = [
      'buy',
      'price',
      'cost',
      'review',
      'best',
      'vs',
      'compare',
    ];
    const transactional = ['download', 'free', 'trial', 'signup', 'register'];
    const navigational = ['login', 'contact', 'about', 'support'];

    const lowerKeyword = keyword.toLowerCase();

    if (commercial.some(term => lowerKeyword.includes(term)))
      return 'commercial';
    if (transactional.some(term => lowerKeyword.includes(term)))
      return 'transactional';
    if (navigational.some(term => lowerKeyword.includes(term)))
      return 'navigational';

    return 'informational';
  }

  private getGeneratedSections(brief: ContentBrief): string[] {
    const sections = [];
    if (brief.outline) sections.push('outline');
    if (brief.researchSources?.length) sections.push('research');
    if (brief.competitorAnalysis) sections.push('competitor_analysis');
    if (brief.targetKeywords) sections.push('keyword_strategy');
    if (brief.statisticsToInclude?.length) sections.push('statistics');
    if (brief.externalLinks?.length) sections.push('external_links');
    return sections;
  }

  private async saveBrief(brief: ContentBrief): Promise<void> {
    if (!this.prisma) return;

    try {
      await this.prisma.contentBrief.upsert({
        where: { slug: brief.slug },
        update: {
          title: brief.title,
          description: brief.description,
          targetWordCount: brief.targetWordCount,
          targetContentType: brief.targetContentType,
          targetAudience: brief.targetAudience,
          primaryKeyword: brief.primaryKeyword,
          secondaryKeywords: brief.secondaryKeywords,
          searchIntent: brief.searchIntent,
          targetKeywords: brief.targetKeywords as any,
          outline: brief.outline as any,
          requiredSections: brief.requiredSections,
          suggestedSections: brief.suggestedSections,
          researchSources: brief.researchSources as any,
          statisticsToInclude: brief.statisticsToInclude as any,
          examplesNeeded: brief.examplesNeeded,
          competitorAnalysis: brief.competitorAnalysis as any,
          differentiators: brief.differentiators,
          callsToAction: brief.callsToAction,
          internalLinks: brief.internalLinks,
          externalLinks: brief.externalLinks as any,
          imagesNeeded: brief.imagesNeeded,
          primaryPersona: brief.primaryPersona,
          secondaryPersonas: brief.secondaryPersonas,
          userQuestions: brief.userQuestions,
          painPoints: brief.painPoints,
          metaTitle: brief.metaTitle,
          metaDescription: brief.metaDescription,
          focusKeywordDensity: brief.focusKeywordDensity,
          readingLevel: brief.readingLevel,
          tone: brief.tone as any,
          topicId: brief.topicId,
          clusterId: brief.clusterId,
          status: brief.status,
          version: brief.version,
          updatedAt: new Date(),
        },
        create: {
          id: brief.id,
          title: brief.title,
          slug: brief.slug,
          description: brief.description,
          targetWordCount: brief.targetWordCount,
          targetContentType: brief.targetContentType,
          targetAudience: brief.targetAudience,
          primaryKeyword: brief.primaryKeyword,
          secondaryKeywords: brief.secondaryKeywords,
          searchIntent: brief.searchIntent,
          targetKeywords: brief.targetKeywords as any,
          outline: brief.outline as any,
          requiredSections: brief.requiredSections,
          suggestedSections: brief.suggestedSections,
          researchSources: brief.researchSources as any,
          statisticsToInclude: brief.statisticsToInclude as any,
          examplesNeeded: brief.examplesNeeded,
          competitorAnalysis: brief.competitorAnalysis as any,
          differentiators: brief.differentiators,
          callsToAction: brief.callsToAction,
          internalLinks: brief.internalLinks,
          externalLinks: brief.externalLinks as any,
          imagesNeeded: brief.imagesNeeded,
          primaryPersona: brief.primaryPersona,
          secondaryPersonas: brief.secondaryPersonas,
          userQuestions: brief.userQuestions,
          painPoints: brief.painPoints,
          metaTitle: brief.metaTitle,
          metaDescription: brief.metaDescription,
          focusKeywordDensity: brief.focusKeywordDensity,
          readingLevel: brief.readingLevel,
          tone: brief.tone as any,
          topicId: brief.topicId,
          clusterId: brief.clusterId,
          status: brief.status,
          version: brief.version,
          createdAt: brief.createdAt,
          updatedAt: brief.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error saving content brief:', error);
    }
  }

  private mapPrismaBriefToType(prismaBrief: any): ContentBrief {
    return {
      id: prismaBrief.id,
      title: prismaBrief.title,
      slug: prismaBrief.slug,
      description: prismaBrief.description,
      targetWordCount: prismaBrief.targetWordCount,
      targetContentType: prismaBrief.targetContentType,
      targetAudience: prismaBrief.targetAudience,
      primaryKeyword: prismaBrief.primaryKeyword,
      secondaryKeywords: prismaBrief.secondaryKeywords,
      searchIntent: prismaBrief.searchIntent,
      targetKeywords: prismaBrief.targetKeywords,
      outline: prismaBrief.outline,
      requiredSections: prismaBrief.requiredSections,
      suggestedSections: prismaBrief.suggestedSections,
      researchSources: prismaBrief.researchSources,
      statisticsToInclude: prismaBrief.statisticsToInclude,
      examplesNeeded: prismaBrief.examplesNeeded,
      competitorAnalysis: prismaBrief.competitorAnalysis,
      differentiators: prismaBrief.differentiators,
      callsToAction: prismaBrief.callsToAction,
      internalLinks: prismaBrief.internalLinks,
      externalLinks: prismaBrief.externalLinks,
      imagesNeeded: prismaBrief.imagesNeeded,
      primaryPersona: prismaBrief.primaryPersona,
      secondaryPersonas: prismaBrief.secondaryPersonas,
      userQuestions: prismaBrief.userQuestions,
      painPoints: prismaBrief.painPoints,
      metaTitle: prismaBrief.metaTitle,
      metaDescription: prismaBrief.metaDescription,
      focusKeywordDensity: prismaBrief.focusKeywordDensity,
      readingLevel: prismaBrief.readingLevel,
      tone: prismaBrief.tone,
      topicId: prismaBrief.topicId,
      topic: prismaBrief.topic,
      clusterId: prismaBrief.clusterId,
      cluster: prismaBrief.cluster,
      status: prismaBrief.status,
      version: prismaBrief.version,
      createdAt: prismaBrief.createdAt,
      updatedAt: prismaBrief.updatedAt,
      createdBy: prismaBrief.createdBy,
      blogPosts: prismaBrief.blogPosts || [],
      calendarEntries: prismaBrief.calendarEntries || [],
    };
  }
}
