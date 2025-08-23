
import { generateObject, type GenerateObjectResult } from 'ai';
import type { LanguageModelV1 } from '@ai-sdk/provider';
import type {
  SEOAnalysis,
  SEORecommendation,
  KeywordAnalysis,
  SEOOptimizationOptions,
  BlogPost,
} from '../types';

/**
 * SEO optimization options
 */
export interface SEOOptimizerOptions {
  /** Model to use for SEO analysis */
  model: LanguageModelV1;
  
  /** Blog post to optimize */
  blogPost: BlogPost;
  
  /** SEO optimization settings */
  optimization: SEOOptimizationOptions;
  
  /** Additional context */
  context?: string;
}

/**
 * SEO analysis result
 */
export interface SEOAnalysisResult {
  /** SEO analysis */
  analysis: SEOAnalysis;
  
  /** Optimized blog post */
  optimizedPost?: BlogPost;
  
  /** Optimization applied */
  optimizationsApplied: string[];
}

/**
 * Comprehensive SEO optimizer for blog posts
 */
export class SEOOptimizer {
  constructor(private model: LanguageModelV1) {}
  
  /**
   * Analyze SEO performance of a blog post
   */
  async analyze(blogPost: BlogPost): Promise<SEOAnalysis> {
    const prompt = this.createAnalysisPrompt(blogPost);
    
    const result = await generateObject({
      model: this.model,
      prompt,
      schema: {
        type: 'object',
        properties: {
          score: { type: 'number', minimum: 0, maximum: 100 },
          components: {
            type: 'object',
            properties: {
              title: { type: 'number', minimum: 0, maximum: 100 },
              metaDescription: { type: 'number', minimum: 0, maximum: 100 },
              headings: { type: 'number', minimum: 0, maximum: 100 },
              keywords: { type: 'number', minimum: 0, maximum: 100 },
              contentLength: { type: 'number', minimum: 0, maximum: 100 },
              internalLinks: { type: 'number', minimum: 0, maximum: 100 },
              images: { type: 'number', minimum: 0, maximum: 100 },
              url: { type: 'number', minimum: 0, maximum: 100 },
            },
            required: ['title', 'metaDescription', 'headings', 'keywords', 'contentLength', 'internalLinks', 'images', 'url'],
          },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['critical', 'important', 'minor'] },
                category: { type: 'string' },
                message: { type: 'string' },
                current: { type: 'string' },
                suggested: { type: 'string' },
                impact: { type: 'number', minimum: 0, maximum: 100 },
                fix: { type: 'string' },
              },
              required: ['type', 'category', 'message', 'impact', 'fix'],
            },
          },
          keywords: {
            type: 'object',
            properties: {
              primary: {
                type: 'object',
                properties: {
                  keyword: { type: 'string' },
                  density: { type: 'number' },
                  recommendedDensity: {
                    type: 'object',
                    properties: {
                      min: { type: 'number' },
                      max: { type: 'number' },
                    },
                    required: ['min', 'max'],
                  },
                  positions: {
                    type: 'object',
                    properties: {
                      title: { type: 'boolean' },
                      metaDescription: { type: 'boolean' },
                      firstParagraph: { type: 'boolean' },
                      headings: { type: 'array', items: { type: 'string' } },
                      url: { type: 'boolean' },
                      altText: { type: 'boolean' },
                    },
                    required: ['title', 'metaDescription', 'firstParagraph', 'headings', 'url', 'altText'],
                  },
                },
                required: ['keyword', 'density', 'recommendedDensity', 'positions'],
              },
              secondary: {
                type: 'array',
                items: { $ref: '#/properties/keywords/properties/primary' },
              },
              related: { type: 'array', items: { type: 'string' } },
            },
          },
          content: {
            type: 'object',
            properties: {
              wordCount: { type: 'number' },
              readingLevel: { type: 'number' },
              readabilityScore: { type: 'number' },
              avgSentenceLength: { type: 'number' },
              paragraphCount: { type: 'number' },
            },
            required: ['wordCount', 'readingLevel', 'readabilityScore', 'avgSentenceLength', 'paragraphCount'],
          },
        },
        required: ['score', 'components', 'recommendations', 'content'],
      },
    });
    
    return result.object as SEOAnalysis;
  }
  
  /**
   * Optimize a blog post for SEO
   */
  async optimize(options: SEOOptimizerOptions): Promise<SEOAnalysisResult> {
    const { blogPost, optimization } = options;
    
    // First, analyze current SEO performance
    const analysis = await this.analyze(blogPost);
    
    // Apply optimizations
    let optimizedPost = { ...blogPost };
    const optimizationsApplied: string[] = [];
    
    // Optimize title
    if (optimization.meta?.title) {
      const optimizedTitle = await this.optimizeTitle(optimizedPost, optimization);
      if (optimizedTitle !== blogPost.metadata.title) {
        optimizedPost.metadata.title = optimizedTitle;
        optimizationsApplied.push('title');
      }
    }
    
    // Optimize meta description
    if (optimization.meta?.description) {
      const optimizedDescription = await this.optimizeMetaDescription(optimizedPost, optimization);
      if (optimizedDescription !== blogPost.metadata.metaDescription) {
        optimizedPost.metadata.metaDescription = optimizedDescription;
        optimizationsApplied.push('meta_description');
      }
    }
    
    // Optimize content
    if (optimization.content) {
      const optimizedContent = await this.optimizeContent(optimizedPost, optimization);
      if (optimizedContent !== blogPost.content.content) {
        optimizedPost.content.content = optimizedContent;
        optimizationsApplied.push('content');
      }
    }
    
    // Optimize images
    if (optimization.images?.altText) {
      const optimizedImages = await this.optimizeImages(optimizedPost, optimization);
      optimizedPost = optimizedImages;
      if (optimizedImages !== blogPost) {
        optimizationsApplied.push('images');
      }
    }
    
    return {
      analysis,
      optimizedPost: optimizationsApplied.length > 0 ? optimizedPost : undefined,
      optimizationsApplied,
    };
  }
  
  /**
   * Analyze keyword performance
   */
  async analyzeKeywords(
    content: string,
    keywords: string[]
  ): Promise<KeywordAnalysis[]> {
    if (keywords.length === 0) return [];
    
    const prompt = `Analyze keyword performance in this content:

**Keywords to analyze**: ${keywords.join(', ')}

**Content**: ${content.substring(0, 2000)}...

For each keyword, analyze:
1. Current density in the content
2. Recommended density range for SEO
3. Where the keyword appears (title, headings, first paragraph, etc.)
4. Related keywords and synonyms
5. Long-tail variations

Provide detailed analysis for optimization recommendations.`;
    
    const result = await generateObject({
      model: this.model,
      prompt,
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            keyword: { type: 'string' },
            density: { type: 'number' },
            recommendedDensity: {
              type: 'object',
              properties: {
                min: { type: 'number' },
                max: { type: 'number' },
              },
              required: ['min', 'max'],
            },
            positions: {
              type: 'object',
              properties: {
                title: { type: 'boolean' },
                metaDescription: { type: 'boolean' },
                firstParagraph: { type: 'boolean' },
                headings: { type: 'array', items: { type: 'string' } },
                url: { type: 'boolean' },
                altText: { type: 'boolean' },
              },
              required: ['title', 'metaDescription', 'firstParagraph', 'headings', 'url', 'altText'],
            },
            related: { type: 'array', items: { type: 'string' } },
            longTail: { type: 'array', items: { type: 'string' } },
          },
          required: ['keyword', 'density', 'recommendedDensity', 'positions'],
        },
      },
    });
    
    return result.object as KeywordAnalysis[];
  }
  
  /**
   * Generate SEO recommendations
   */
  async generateRecommendations(
    blogPost: BlogPost,
    targetKeywords?: string[]
  ): Promise<SEORecommendation[]> {
    const prompt = `Analyze this blog post and provide specific SEO recommendations:

**Title**: ${blogPost.metadata.title}
**Meta Description**: ${blogPost.metadata.metaDescription || 'Not set'}
**Content**: ${blogPost.content.content.substring(0, 1500)}...
**Target Keywords**: ${targetKeywords?.join(', ') || 'Not specified'}
**Current Word Count**: ${blogPost.metadata.seo.wordCount}

Provide prioritized, actionable SEO recommendations that will improve search engine rankings.
Focus on:
1. Title and meta optimization
2. Content structure and headings
3. Keyword usage and density
4. Image optimization
5. Internal linking opportunities

Each recommendation should include:
- Type (critical, important, or minor)
- Category
- Specific issue description
- Current value (if applicable)
- Suggested improvement
- Expected impact (0-100)
- How to fix it`;
    
    const result = await generateObject({
      model: this.model,
      prompt,
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['critical', 'important', 'minor'] },
            category: { type: 'string' },
            message: { type: 'string' },
            current: { type: 'string' },
            suggested: { type: 'string' },
            impact: { type: 'number', minimum: 0, maximum: 100 },
            fix: { type: 'string' },
          },
          required: ['type', 'category', 'message', 'impact', 'fix'],
        },
      },
    });
    
    return result.object as SEORecommendation[];
  }
  
  /**
   * Private helper methods
   */
  
  private createAnalysisPrompt(blogPost: BlogPost): string {
    return `Perform a comprehensive SEO analysis of this blog post:

**Title**: ${blogPost.metadata.title}
**URL Slug**: ${blogPost.metadata.slug}
**Meta Description**: ${blogPost.metadata.metaDescription || 'Not set'}
**Focus Keyword**: ${blogPost.metadata.seo.focusKeyword || 'Not set'}
**Target Keywords**: ${blogPost.metadata.seo.keywords?.join(', ') || 'None'}
**Word Count**: ${blogPost.metadata.seo.wordCount}

**Content Preview**: ${blogPost.content.content.substring(0, 2000)}...

**Featured Image**: ${blogPost.content.featuredImage ? `${blogPost.content.featuredImage.url} (Alt: ${blogPost.content.featuredImage.alt || 'No alt text'})` : 'None'}

Analyze all SEO aspects and provide scores (0-100) for each component, specific recommendations, keyword analysis, and content metrics. Be thorough and specific in your analysis.`;
  }
  
  private async optimizeTitle(
    blogPost: BlogPost,
    optimization: SEOOptimizationOptions
  ): Promise<string> {
    const keywords = optimization.keywords?.primary || blogPost.metadata.seo.focusKeyword;
    
    const prompt = `Optimize this blog title for SEO:

**Current Title**: ${blogPost.metadata.title}
**Target Keyword**: ${keywords}
**Content Topic**: ${blogPost.content.content.substring(0, 300)}...

Create an optimized title that:
- Includes the target keyword naturally
- Is 30-60 characters long
- Is compelling and click-worthy
- Accurately represents the content
- Follows SEO best practices

Return only the optimized title.`;
    
    const result = await generateObject({
      model: this.model,
      prompt,
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
        },
        required: ['title'],
      },
    });
    
    return result.object.title;
  }
  
  private async optimizeMetaDescription(
    blogPost: BlogPost,
    optimization: SEOOptimizationOptions
  ): Promise<string> {
    const keywords = optimization.keywords?.primary || blogPost.metadata.seo.focusKeyword;
    
    const prompt = `Create an SEO-optimized meta description:

**Title**: ${blogPost.metadata.title}
**Current Meta Description**: ${blogPost.metadata.metaDescription || 'None'}
**Target Keyword**: ${keywords}
**Content Summary**: ${blogPost.content.excerpt || blogPost.content.content.substring(0, 400)}...

Create a meta description that:
- Is 150-160 characters long
- Includes the target keyword naturally
- Is compelling and encourages clicks
- Accurately summarizes the content
- Has a clear value proposition

Return only the optimized meta description.`;
    
    const result = await generateObject({
      model: this.model,
      prompt,
      schema: {
        type: 'object',
        properties: {
          description: { type: 'string' },
        },
        required: ['description'],
      },
    });
    
    return result.object.description;
  }
  
  private async optimizeContent(
    blogPost: BlogPost,
    optimization: SEOOptimizationOptions
  ): Promise<string> {
    const prompt = `Optimize this content for SEO while maintaining quality and readability:

**Target Keywords**: ${optimization.keywords?.primary || 'Not specified'}
**Current Content**: ${blogPost.content.content}

Optimization goals:
- Improve heading structure (H1, H2, H3)
- Optimize keyword density and placement
- Enhance readability and flow
- Add internal linking opportunities
- Improve content structure

Return the optimized content in markdown format.`;
    
    const result = await generateObject({
      model: this.model,
      prompt,
      schema: {
        type: 'object',
        properties: {
          content: { type: 'string' },
        },
        required: ['content'],
      },
    });
    
    return result.object.content;
  }
  
  private async optimizeImages(
    blogPost: BlogPost,
    optimization: SEOOptimizationOptions
  ): Promise<BlogPost> {
    // This would optimize image alt text, file names, and captions
    // For now, return the original post
    return blogPost;
  }
}

/**
 * Quick SEO analysis function
 */
export async function analyzeSEO(
  model: LanguageModelV1,
  blogPost: BlogPost
): Promise<SEOAnalysis> {
  const optimizer = new SEOOptimizer(model);
  return optimizer.analyze(blogPost);
}

/**
 * Quick SEO optimization function
 */
export async function optimizeSEO(
  model: LanguageModelV1,
  blogPost: BlogPost,
  options: SEOOptimizationOptions
): Promise<SEOAnalysisResult> {
  const optimizer = new SEOOptimizer(model);
  return optimizer.optimize({
    model,
    blogPost,
    optimization: options,
  });
}
