import { prisma } from './prisma';
import type { ContentType } from '../generated/prisma-client';
import type { LanguageModelV1 } from '@ai-sdk/provider';
import { generateText } from 'ai';

/**
 * Content type detection patterns and configurations
 */
interface DetectionPattern {
  contentType: ContentType;
  keywords: string[];
  patterns: RegExp[];
  priority: number;
  minMatches: number;
}

/**
 * Content type detection result
 */
export interface ContentTypeDetectionResult {
  contentType: ContentType;
  confidence: number;
  matchedPatterns: string[];
  suggestedTemplate?: string;
  recommendations?: string[];
}

/**
 * Content classification and routing system
 */
export class ContentTypeDetector {
  private patterns: DetectionPattern[] = [];
  private initialized = false;

  /**
   * Initialize detection patterns
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load patterns from database
    const dbPatterns = await prisma.contentTypePattern.findMany({
      where: { enabled: true },
      orderBy: { priority: 'desc' },
    });

    // Convert database patterns to runtime patterns
    this.patterns = dbPatterns.map(pattern => ({
      contentType: pattern.contentType,
      keywords: pattern.keywords,
      patterns: pattern.patterns.map(p => new RegExp(p, 'i')),
      priority: pattern.priority,
      minMatches: Math.max(1, Math.floor(pattern.keywords.length * 0.3)),
    }));

    // Add default patterns if none exist in database
    if (this.patterns.length === 0) {
      await this.seedDefaultPatterns();
      await this.initialize(); // Reload after seeding
    }

    this.initialized = true;
  }

  /**
   * Detect content type from topic and description
   */
  async detectContentType(
    topic: string,
    description?: string,
    additionalContext?: string,
  ): Promise<ContentTypeDetectionResult> {
    await this.initialize();

    const content =
      `${topic} ${description || ''} ${additionalContext || ''}`.toLowerCase();
    const results: Array<{
      contentType: ContentType;
      score: number;
      matches: string[];
    }> = [];

    // Pattern-based detection
    for (const pattern of this.patterns) {
      const matches: string[] = [];
      let score = 0;

      // Check keywords
      for (const keyword of pattern.keywords) {
        if (content.includes(keyword.toLowerCase())) {
          matches.push(keyword);
          score += 1;
        }
      }

      // Check regex patterns
      for (const regex of pattern.patterns) {
        const regexMatches = content.match(regex);
        if (regexMatches) {
          matches.push(regexMatches[0]);
          score += 2; // Regex matches weighted higher
        }
      }

      // Calculate weighted score
      if (matches.length >= pattern.minMatches) {
        const weightedScore =
          (score / (pattern.keywords.length + pattern.patterns.length)) *
          pattern.priority *
          (matches.length / pattern.keywords.length);

        results.push({
          contentType: pattern.contentType,
          score: weightedScore,
          matches,
        });
      }
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    if (results.length === 0) {
      // Default to BLOG if no patterns match
      return {
        contentType: 'BLOG',
        confidence: 0.5,
        matchedPatterns: [],
        suggestedTemplate: 'howto',
        recommendations: [
          'Consider providing more specific keywords or context for better content type detection',
        ],
      };
    }

    const bestResult = results[0];
    const confidence = Math.min(0.95, bestResult.score / 10); // Normalize to 0-0.95

    return {
      contentType: bestResult.contentType,
      confidence,
      matchedPatterns: bestResult.matches,
      suggestedTemplate: this.getSuggestedTemplate(bestResult.contentType),
      recommendations: this.getRecommendations(
        bestResult.contentType,
        confidence,
      ),
    };
  }

  /**
   * AI-powered content type detection using language model
   */
  async detectContentTypeWithAI(
    model: LanguageModelV1,
    topic: string,
    description?: string,
    additionalContext?: string,
  ): Promise<ContentTypeDetectionResult> {
    const prompt = `
Analyze the following content topic and determine the most appropriate content type for a blog post.

Topic: ${topic}
Description: ${description || 'Not provided'}
Additional Context: ${additionalContext || 'None'}

Available content types:
- BLOG: General blog posts and articles
- ARTICLE: In-depth articles and feature pieces  
- TUTORIAL: Step-by-step educational content
- HOWTO: How-to guides and instructions
- LISTICLE: List-based content (Top 10, 5 Ways, etc.)
- COMPARISON: Product/service comparisons
- NEWS: News updates and announcements
- REVIEW: Product/service reviews
- GUIDE: Comprehensive guides and resources
- CASE_STUDY: Case studies and success stories
- OPINION: Opinion pieces and editorials
- INTERVIEW: Q&A format and interviews

Respond with a JSON object containing:
- contentType: The most appropriate content type
- confidence: Confidence score from 0 to 1
- reasoning: Brief explanation of why this type was chosen
- suggestedTemplate: Recommended template name
- recommendations: Array of optimization suggestions

Example response:
{
  "contentType": "TUTORIAL",
  "confidence": 0.9,
  "reasoning": "The topic clearly indicates step-by-step instructions",
  "suggestedTemplate": "tutorial",
  "recommendations": ["Include numbered steps", "Add code examples", "Include screenshots"]
}
`;

    try {
      const result = await generateText({
        model,
        prompt,
        temperature: 0.3,
      });

      const parsed = JSON.parse(result.text);

      return {
        contentType: parsed.contentType as ContentType,
        confidence: Math.max(0.1, Math.min(0.95, parsed.confidence)),
        matchedPatterns: [`AI Analysis: ${parsed.reasoning}`],
        suggestedTemplate: parsed.suggestedTemplate,
        recommendations: parsed.recommendations || [],
      };
    } catch (error) {
      console.error('AI content type detection failed:', error);

      // Fall back to pattern-based detection
      return this.detectContentType(topic, description, additionalContext);
    }
  }

  /**
   * Get suggested template for content type
   */
  private getSuggestedTemplate(contentType: ContentType): string {
    const templateMap: Record<ContentType, string> = {
      BLOG: 'howto',
      ARTICLE: 'guide',
      TUTORIAL: 'tutorial',
      HOWTO: 'howto',
      LISTICLE: 'listicle',
      COMPARISON: 'comparison',
      NEWS: 'news',
      REVIEW: 'review',
      GUIDE: 'guide',
      CASE_STUDY: 'case-study',
      OPINION: 'opinion',
      INTERVIEW: 'interview',
    };

    return templateMap[contentType] || 'howto';
  }

  /**
   * Get optimization recommendations for content type
   */
  private getRecommendations(
    contentType: ContentType,
    confidence: number,
  ): string[] {
    const baseRecommendations: Record<ContentType, string[]> = {
      BLOG: [
        'Focus on providing value to readers',
        'Include relevant keywords',
        'Add engaging visuals',
      ],
      ARTICLE: [
        'Conduct thorough research',
        'Include authoritative sources',
        'Structure with clear sections',
      ],
      TUTORIAL: [
        'Break down into clear steps',
        'Include examples and screenshots',
        'Add troubleshooting section',
      ],
      HOWTO: [
        'Use numbered steps',
        'Include prerequisite information',
        'Add success criteria',
      ],
      LISTICLE: [
        'Use compelling numbers',
        'Make each item substantial',
        'Include brief explanations',
      ],
      COMPARISON: [
        'Create comparison tables',
        'Include pros and cons',
        'Provide clear recommendations',
      ],
      NEWS: [
        'Include recent developments',
        'Add credible sources',
        'Keep content timely',
      ],
      REVIEW: [
        'Include personal experience',
        'Add ratings or scores',
        'Compare with alternatives',
      ],
      GUIDE: [
        'Create comprehensive coverage',
        'Include resources and tools',
        'Add actionable advice',
      ],
      CASE_STUDY: [
        'Include specific metrics',
        'Tell a complete story',
        'Add lessons learned',
      ],
      OPINION: [
        'Support with evidence',
        'Acknowledge counterarguments',
        'Include personal insights',
      ],
      INTERVIEW: [
        'Prepare thoughtful questions',
        'Include background context',
        'Add key takeaways',
      ],
    };

    const recommendations = [...(baseRecommendations[contentType] || [])];

    if (confidence < 0.7) {
      recommendations.unshift(
        'Consider refining your topic or providing more context for better content type detection',
      );
    }

    return recommendations;
  }

  /**
   * Add custom detection pattern
   */
  async addPattern(
    contentType: ContentType,
    keywords: string[],
    patterns: string[],
    priority: number = 1,
  ): Promise<void> {
    await prisma.contentTypePattern.create({
      data: {
        contentType,
        keywords,
        patterns,
        priority,
        enabled: true,
      },
    });

    // Reload patterns
    this.initialized = false;
  }

  /**
   * Seed default detection patterns
   */
  private async seedDefaultPatterns(): Promise<void> {
    const defaultPatterns = [
      {
        contentType: 'TUTORIAL' as ContentType,
        keywords: [
          'tutorial',
          'learn',
          'course',
          'lesson',
          'training',
          'education',
          'teaching',
        ],
        patterns: ['\\btutorial\\b', '\\blearn how\\b', '\\bstep by step\\b'],
        priority: 8,
      },
      {
        contentType: 'HOWTO' as ContentType,
        keywords: [
          'how to',
          'guide',
          'instructions',
          'steps',
          'method',
          'way',
          'process',
        ],
        patterns: [
          '\\bhow to\\b',
          '\\bguide to\\b',
          '\\bsteps to\\b',
          '\\binstructions\\b',
        ],
        priority: 9,
      },
      {
        contentType: 'LISTICLE' as ContentType,
        keywords: [
          'top',
          'best',
          'worst',
          'reasons',
          'ways',
          'tips',
          'tricks',
          'ideas',
        ],
        patterns: [
          '\\d+\\s+(ways|tips|reasons|ideas|tools|methods)',
          '\\btop\\s+\\d+\\b',
          '\\bbest\\s+\\d+\\b',
        ],
        priority: 7,
      },
      {
        contentType: 'COMPARISON' as ContentType,
        keywords: [
          'vs',
          'versus',
          'compare',
          'comparison',
          'difference',
          'better',
          'alternative',
        ],
        patterns: [
          '\\bvs\\b',
          '\\bversus\\b',
          '\\bcompare\\b',
          '\\balternative to\\b',
        ],
        priority: 6,
      },
      {
        contentType: 'REVIEW' as ContentType,
        keywords: [
          'review',
          'rating',
          'opinion',
          'experience',
          'test',
          'evaluation',
        ],
        patterns: [
          '\\breview\\b',
          '\\brating\\b',
          '\\bmy experience\\b',
          '\\btested\\b',
        ],
        priority: 7,
      },
      {
        contentType: 'NEWS' as ContentType,
        keywords: [
          'news',
          'announcement',
          'update',
          'release',
          'breaking',
          'latest',
        ],
        patterns: [
          '\\bnews\\b',
          '\\bannouncement\\b',
          '\\bupdate\\b',
          '\\breleased\\b',
        ],
        priority: 6,
      },
      {
        contentType: 'CASE_STUDY' as ContentType,
        keywords: [
          'case study',
          'success story',
          'example',
          'real world',
          'implementation',
        ],
        patterns: [
          '\\bcase study\\b',
          '\\bsuccess story\\b',
          '\\breal world\\b',
        ],
        priority: 5,
      },
      {
        contentType: 'INTERVIEW' as ContentType,
        keywords: [
          'interview',
          'conversation',
          'chat',
          'discussion',
          'q&a',
          'questions',
        ],
        patterns: ['\\binterview\\b', '\\bq&a\\b', '\\bconversation with\\b'],
        priority: 5,
      },
      {
        contentType: 'GUIDE' as ContentType,
        keywords: [
          'guide',
          'complete',
          'comprehensive',
          'ultimate',
          'definitive',
          'master',
        ],
        patterns: [
          '\\bcomplete guide\\b',
          '\\bultimate guide\\b',
          '\\bcomprehensive\\b',
        ],
        priority: 6,
      },
      {
        contentType: 'OPINION' as ContentType,
        keywords: [
          'opinion',
          'thoughts',
          'perspective',
          'view',
          'believe',
          'think',
        ],
        patterns: [
          '\\bmy opinion\\b',
          '\\bmy thoughts\\b',
          '\\bi think\\b',
          '\\bi believe\\b',
        ],
        priority: 4,
      },
    ];

    await prisma.contentTypePattern.createMany({
      data: defaultPatterns,
    });
  }

  /**
   * Get content routing configuration for detected type
   */
  getRoutingConfig(contentType: ContentType): {
    template: string;
    wordCountRange: { min: number; max: number };
    sections: string[];
    requiredElements: string[];
  } {
    const configs = {
      BLOG: {
        template: 'howto',
        wordCountRange: { min: 800, max: 2500 },
        sections: ['Introduction', 'Main Content', 'Conclusion'],
        requiredElements: ['title', 'introduction', 'body', 'conclusion'],
      },
      ARTICLE: {
        template: 'guide',
        wordCountRange: { min: 1200, max: 3500 },
        sections: ['Introduction', 'Background', 'Analysis', 'Conclusion'],
        requiredElements: ['title', 'abstract', 'sections', 'references'],
      },
      TUTORIAL: {
        template: 'tutorial',
        wordCountRange: { min: 1500, max: 4000 },
        sections: [
          'Prerequisites',
          'Step-by-Step Instructions',
          'Troubleshooting',
          'Conclusion',
        ],
        requiredElements: [
          'title',
          'prerequisites',
          'steps',
          'examples',
          'summary',
        ],
      },
      HOWTO: {
        template: 'howto',
        wordCountRange: { min: 800, max: 2500 },
        sections: ['Introduction', 'Requirements', 'Instructions', 'Tips'],
        requiredElements: ['title', 'overview', 'steps', 'tips'],
      },
      LISTICLE: {
        template: 'listicle',
        wordCountRange: { min: 1000, max: 3000 },
        sections: ['Introduction', 'List Items', 'Conclusion'],
        requiredElements: ['title', 'intro', 'numbered_items', 'summary'],
      },
      COMPARISON: {
        template: 'comparison',
        wordCountRange: { min: 1200, max: 2500 },
        sections: [
          'Introduction',
          'Comparison Criteria',
          'Analysis',
          'Recommendation',
        ],
        requiredElements: ['title', 'criteria', 'comparison_table', 'verdict'],
      },
      NEWS: {
        template: 'news',
        wordCountRange: { min: 600, max: 2000 },
        sections: ['Headline', 'Lead', 'Body', 'Background'],
        requiredElements: ['headline', 'lead_paragraph', 'details', 'context'],
      },
      REVIEW: {
        template: 'review',
        wordCountRange: { min: 800, max: 2000 },
        sections: ['Introduction', 'Features', 'Pros & Cons', 'Verdict'],
        requiredElements: [
          'title',
          'overview',
          'pros_cons',
          'rating',
          'recommendation',
        ],
      },
      GUIDE: {
        template: 'guide',
        wordCountRange: { min: 2000, max: 5000 },
        sections: ['Overview', 'Fundamentals', 'Advanced Topics', 'Resources'],
        requiredElements: [
          'title',
          'table_of_contents',
          'sections',
          'resources',
        ],
      },
      CASE_STUDY: {
        template: 'case-study',
        wordCountRange: { min: 1200, max: 2500 },
        sections: ['Background', 'Challenge', 'Solution', 'Results', 'Lessons'],
        requiredElements: [
          'title',
          'background',
          'problem',
          'solution',
          'results',
          'takeaways',
        ],
      },
      OPINION: {
        template: 'opinion',
        wordCountRange: { min: 1000, max: 2500 },
        sections: [
          'Introduction',
          'Arguments',
          'Counterarguments',
          'Conclusion',
        ],
        requiredElements: [
          'title',
          'thesis',
          'arguments',
          'evidence',
          'conclusion',
        ],
      },
      INTERVIEW: {
        template: 'interview',
        wordCountRange: { min: 1200, max: 3000 },
        sections: ['Introduction', 'Q&A', 'Key Takeaways'],
        requiredElements: ['title', 'intro', 'questions_answers', 'highlights'],
      },
    };

    return configs[contentType] || configs.BLOG;
  }
}

// Export singleton instance
export const contentTypeDetector = new ContentTypeDetector();
