import { generateObject, type GenerateObjectResult } from 'ai';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type {
  SEOAnalysis,
  SEORecommendation,
  KeywordAnalysis,
  SEOOptimizationOptions,
  BlogPost,
} from '../types';
import {
  SEOAnalysisSchema,
  KeywordAnalysisSchema,
  SEORecommendationSchema,
  TitleOptimizationSchema,
  MetaDescriptionSchema,
  ContentOptimizationSchema,
} from '../schemas/ai-schemas';

/**
 * SEO optimization options
 */
export interface SEOOptimizerOptions {
  /** Model to use for SEO analysis */
  model: LanguageModelV2;

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
  constructor(private model: LanguageModelV2) {}

  /**
   * Analyze SEO performance of a blog post
   */
  async analyze(blogPost: BlogPost): Promise<SEOAnalysis> {
    const prompt = this.createAnalysisPrompt(blogPost);

    const result = await generateObject({
      model: this.model,
      prompt,
      schema: SEOAnalysisSchema,
    });

    // Convert the AI result to match the SEOAnalysis interface
    const analysis: SEOAnalysis = {
      id: `seo_${Date.now()}`,
      blogPostId: blogPost.id,
      score: result.object.score,
      components: {
        title: result.object.components.title.score,
        metaDescription: result.object.components.metaDescription.score,
        headings: result.object.components.structure?.score || 0,
        keywords: result.object.components.keywords.score,
        contentLength: result.object.components.content.score,
        internalLinks: 0, // Would be calculated separately
        images: 0, // Not available in current schema
        url: result.object.components.url.score,
      },
      recommendations: (result.object.recommendations.map((rec: any) => ({
        type:
          rec.impact === 'critical'
            ? 'critical'
            : rec.impact === 'high'
              ? 'important'
              : 'minor',
        category: rec.category as any, // Map AI schema category to interface category
        message: rec.message,
        current: rec.current,
        suggested: rec.suggested,
        impact:
          rec.impact === 'critical'
            ? 100
            : rec.impact === 'high'
              ? 75
              : rec.impact === 'medium'
                ? 50
                : 25,
        fix: rec.fix || rec.message,
      })) as unknown) as SEORecommendation[],
      keywords: {
        primary: result.object.keywords?.[0]
          ? {
              keyword: result.object.keywords[0].keyword,
              density: result.object.keywords[0].density,
              recommendedDensity: result.object.keywords[0].recommendedDensity,
              positions: result.object.keywords[0].positions || [],
              related: result.object.keywords[0].related || [],
              longTail: result.object.keywords[0].longTail || [],
            }
          : undefined,
        secondary:
          result.object.keywords?.slice(1).map((k: any) => ({
            keyword: k.keyword,
            density: k.density,
            recommendedDensity: k.recommendedDensity,
            positions: k.positions || [],
            related: k.related || [],
            longTail: k.longTail || [],
          })) || [],
      },
      content: {
        wordCount: blogPost.metadata.seo.wordCount,
        readingLevel: 8, // Would be calculated separately
        readabilityScore: result.object.components.readability?.score || 0,
        avgSentenceLength: 15, // Would be calculated separately
        paragraphCount: 10, // Would be calculated separately
      },
      analyzedAt: new Date(),
      modelUsed: 'ai-model',
    };

    return analysis;
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
      const optimizedTitle = await this.optimizeTitle(
        optimizedPost,
        optimization,
      );
      if (optimizedTitle !== blogPost.metadata.title) {
        optimizedPost.metadata.title = optimizedTitle;
        optimizationsApplied.push('title');
      }
    }

    // Optimize meta description
    if (optimization.meta?.description) {
      const optimizedDescription = await this.optimizeMetaDescription(
        optimizedPost,
        optimization,
      );
      if (optimizedDescription !== blogPost.metadata.metaDescription) {
        optimizedPost.metadata.metaDescription = optimizedDescription;
        optimizationsApplied.push('meta_description');
      }
    }

    // Optimize content
    if (optimization.content) {
      const optimizedContent = await this.optimizeContent(
        optimizedPost,
        optimization,
      );
      if (optimizedContent !== blogPost.content.content) {
        optimizedPost.content.content = optimizedContent;
        optimizationsApplied.push('content');
      }
    }

    // Optimize images
    if (optimization.images?.altText) {
      const optimizedImages = await this.optimizeImages(
        optimizedPost,
        optimization,
      );
      optimizedPost = optimizedImages;
      if (optimizedImages !== blogPost) {
        optimizationsApplied.push('images');
      }
    }

    return {
      analysis,
      optimizedPost:
        optimizationsApplied.length > 0 ? optimizedPost : undefined,
      optimizationsApplied,
    };
  }

  /**
   * Analyze keyword performance
   */
  async analyzeKeywords(
    content: string,
    keywords: string[],
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
      schema: KeywordAnalysisSchema,
    });

    return result.object as KeywordAnalysis[];
  }

  /**
   * Generate SEO recommendations
   */
  async generateRecommendations(
    blogPost: BlogPost,
    targetKeywords?: string[],
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
      schema: SEORecommendationSchema,
    });

    return (result.object as unknown) as SEORecommendation[];
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
    optimization: SEOOptimizationOptions,
  ): Promise<string> {
    const keywords =
      optimization.keywords?.primary || blogPost.metadata.seo.focusKeyword;

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
      schema: TitleOptimizationSchema,
    });

    return result.object.title;
  }

  private async optimizeMetaDescription(
    blogPost: BlogPost,
    optimization: SEOOptimizationOptions,
  ): Promise<string> {
    const keywords =
      optimization.keywords?.primary || blogPost.metadata.seo.focusKeyword;

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
      schema: MetaDescriptionSchema,
    });

    return result.object.description;
  }

  private async optimizeContent(
    blogPost: BlogPost,
    optimization: SEOOptimizationOptions,
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
      schema: ContentOptimizationSchema,
    });

    return result.object.content;
  }

  private async optimizeImages(
    blogPost: BlogPost,
    optimization: SEOOptimizationOptions,
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
  model: LanguageModelV2,
  blogPost: BlogPost,
): Promise<SEOAnalysis> {
  const optimizer = new SEOOptimizer(model);
  return optimizer.analyze(blogPost);
}

/**
 * Quick SEO optimization function
 */
export async function optimizeSEO(
  model: LanguageModelV2,
  blogPost: BlogPost,
  options: SEOOptimizationOptions,
): Promise<SEOAnalysisResult> {
  const optimizer = new SEOOptimizer(model);
  return optimizer.optimize({
    model,
    blogPost,
    optimization: options,
  });
}
