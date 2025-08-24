import { BaseServiceClass, ServiceConfig, LoggerProvider, ServiceContainer, AIModelProvider } from '../interfaces/base-service';
import { BlogPost, BlogTemplate } from '../../types';
import { validateBlogPost } from '../validation';

/**
 * Blog generation options
 */
export interface BlogGenerationOptions {
  topic: string;
  template?: BlogTemplate;
  keywords?: string[];
  wordCount?: { min: number; max: number };
  tone?: string;
  audience?: string;
  seo?: {
    focusKeyword?: string;
    metaDescription?: string;
    includeToC?: boolean;
  };
  content?: {
    includeImages?: boolean;
    includeCode?: boolean;
    includeExamples?: boolean;
  };
}

/**
 * Blog generation result
 */
export interface BlogGenerationResult {
  blogPost: BlogPost;
  metadata: {
    template: BlogTemplate;
    wordCount: number;
    processingTime: number;
    tokenUsage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    quality: {
      seoScore: number;
      readabilityScore: number;
      overallScore: number;
    };
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  };
}

/**
 * Blog Generator Service with proper dependency injection
 */
export class BlogGeneratorService extends BaseServiceClass {
  readonly serviceName = 'BlogGeneratorService';
  readonly version = '1.0.0';

  private readonly aiModel: AIModelProvider;
  private readonly validationService: typeof validateBlogPost;

  constructor(
    config: ServiceConfig,
    logger: LoggerProvider,
    container: ServiceContainer,
    aiModel: AIModelProvider
  ) {
    super(config, logger, container);
    this.aiModel = aiModel;
    this.validationService = validateBlogPost;
  }

  /**
   * Generate a blog post with the given options
   */
  async generateBlog(options: BlogGenerationOptions): Promise<BlogGenerationResult> {
    const startTime = Date.now();
    
    this.log('info', 'Starting blog generation', { topic: options.topic, template: options.template });

    try {
      // Validate input options
      this.validateOptions(options);

      // Generate content using AI model
      const content = await this.generateContent(options);

      // Create blog post structure
      const blogPost = await this.createBlogPost(options, content);

      // Validate the generated blog post
      const validation = this.validationService(blogPost);

      // Calculate processing time and token usage
      const processingTime = Date.now() - startTime;

      const result: BlogGenerationResult = {
        blogPost,
        metadata: {
          template: options.template || 'howto',
          wordCount: this.calculateWordCount(content.text),
          processingTime,
          tokenUsage: {
            promptTokens: content.tokenUsage?.promptTokens || 0,
            completionTokens: content.tokenUsage?.completionTokens || 0,
            totalTokens: content.tokenUsage?.totalTokens || 0,
          },
          quality: {
            seoScore: validation.qualityScore,
            readabilityScore: this.calculateReadabilityScore(content.text),
            overallScore: validation.qualityScore,
          },
        },
        validation: {
          isValid: validation.isValid,
          errors: validation.errors.map(e => e.message),
          warnings: validation.warnings.map(w => w.message),
          suggestions: validation.suggestions,
        },
      };

      this.log('info', 'Blog generation completed', {
        topic: options.topic,
        wordCount: result.metadata.wordCount,
        processingTime: result.metadata.processingTime,
        isValid: result.validation.isValid,
      });

      return result;

    } catch (error) {
      this.log('error', 'Blog generation failed', { 
        topic: options.topic, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Generate multiple blog posts
   */
  async generateMultipleBlogs(
    options: BlogGenerationOptions[],
    concurrency: number = 3
  ): Promise<BlogGenerationResult[]> {
    this.log('info', 'Starting multiple blog generation', { count: options.length, concurrency });

    const results: BlogGenerationResult[] = [];
    const chunks = this.chunkArray(options, concurrency);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(option => this.generateBlog(option));
      const chunkResults = await Promise.allSettled(chunkPromises);
      
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          this.log('error', 'Failed to generate blog in batch', {
            topic: chunk[index].topic,
            error: result.reason,
          });
        }
      });
    }

    this.log('info', 'Multiple blog generation completed', {
      requested: options.length,
      successful: results.length,
      failed: options.length - results.length,
    });

    return results;
  }

  /**
   * Generate content using AI model
   */
  private async generateContent(options: BlogGenerationOptions): Promise<{
    text: string;
    tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    const prompt = this.buildPrompt(options);
    
    const result = await this.withRetry(async () => {
      return await this.withTimeout(
        this.aiModel.generateText(prompt, {
          maxTokens: options.wordCount?.max || 4000,
          temperature: 0.7,
        }),
        this.config.timeout
      );
    });

    return {
      text: result.text,
      tokenUsage: result.usage,
    };
  }

  /**
   * Build prompt for AI model
   */
  private buildPrompt(options: BlogGenerationOptions): string {
    const template = options.template || 'howto';
    const wordCount = options.wordCount?.min || 1000;
    
    return `Write a comprehensive ${template} blog post about "${options.topic}".

Requirements:
- Word count: ${wordCount} words minimum
- Tone: ${options.tone || 'professional'}
- Target audience: ${options.audience || 'general readers'}
- Keywords to include: ${options.keywords?.join(', ') || 'none specified'}
- Focus keyword: ${options.seo?.focusKeyword || 'none specified'}

Structure:
1. Engaging introduction
2. Main content with clear sections
3. Practical examples and actionable advice
4. Strong conclusion

Make sure the content is:
- Well-researched and accurate
- SEO-optimized
- Easy to read and understand
- Valuable to the target audience

Format the content with proper markdown headings (H1, H2, H3).`;
  }

  /**
   * Create blog post structure
   */
  private async createBlogPost(
    options: BlogGenerationOptions,
    content: { text: string }
  ): Promise<BlogPost> {
    const now = new Date();
    const wordCount = this.calculateWordCount(content.text);
    
    return {
      metadata: {
        id: this.generateId(),
        title: this.extractTitle(content.text),
        slug: this.generateSlug(options.topic),
        metaDescription: options.seo?.metaDescription || this.generateMetaDescription(content.text),
        createdAt: now,
        updatedAt: now,
        seo: {
          focusKeyword: options.seo?.focusKeyword || options.keywords?.[0] || '',
          keywords: options.keywords || [],
          wordCount,
          seoScore: this.calculateSeoScore(content.text, options),
          readabilityScore: this.calculateReadabilityScore(content.text),
        },
        settings: {
          language: 'en',
          template: options.template || 'howto',
          readingTime: Math.ceil(wordCount / 200), // Average reading speed
        },
      },
      content: {
        content: content.text,
        excerpt: this.generateExcerpt(content.text),
        featuredImage: options.content?.includeImages ? this.generateFeaturedImage(options.topic) : undefined,
      },
      status: 'draft',
    };
  }

  /**
   * Validate input options
   */
  private validateOptions(options: BlogGenerationOptions): void {
    if (!options.topic || options.topic.trim().length === 0) {
      throw new Error('Topic is required');
    }

    if (options.topic.length > 500) {
      throw new Error('Topic is too long (max 500 characters)');
    }

    if (options.wordCount) {
      if (options.wordCount.min < 100) {
        throw new Error('Minimum word count must be at least 100');
      }
      if (options.wordCount.max > 10000) {
        throw new Error('Maximum word count cannot exceed 10,000');
      }
      if (options.wordCount.min > options.wordCount.max) {
        throw new Error('Minimum word count cannot be greater than maximum word count');
      }
    }

    if (options.keywords && options.keywords.length > 20) {
      throw new Error('Too many keywords (max 20)');
    }
  }

  /**
   * Calculate word count
   */
  private calculateWordCount(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Calculate SEO score
   */
  private calculateSeoScore(text: string, options: BlogGenerationOptions): number {
    let score = 70; // Base score

    // Check for focus keyword
    if (options.seo?.focusKeyword && text.toLowerCase().includes(options.seo.focusKeyword.toLowerCase())) {
      score += 10;
    }

    // Check for other keywords
    if (options.keywords) {
      const keywordMatches = options.keywords.filter(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      score += (keywordMatches / options.keywords.length) * 10;
    }

    // Check for proper heading structure
    const headings = text.match(/^#{1,6}\s+.+$/gm);
    if (headings && headings.length >= 3) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate readability score
   */
  private calculateReadabilityScore(text: string): number {
    // Simple Flesch Reading Ease calculation
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = this.calculateWordCount(text);
    const syllables = this.countSyllables(text);

    if (sentences === 0 || words === 0) return 0;

    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Count syllables in text
   */
  private countSyllables(text: string): number {
    // Simplified syllable counting
    const words = text.toLowerCase().split(/\s+/);
    return words.reduce((count, word) => {
      const syllables = word.match(/[aeiouy]+/g)?.length || 1;
      return count + syllables;
    }, 0);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `blog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract title from content
   */
  private extractTitle(text: string): string {
    const titleMatch = text.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : 'Untitled Blog Post';
  }

  /**
   * Generate slug from topic
   */
  private generateSlug(topic: string): string {
    return topic
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Generate meta description
   */
  private generateMetaDescription(text: string): string {
    const firstParagraph = text.match(/^[^#\n]+/m)?.[0] || '';
    const cleanText = firstParagraph.replace(/[#*`]/g, '').trim();
    return cleanText.length > 160 ? cleanText.substring(0, 157) + '...' : cleanText;
  }

  /**
   * Generate excerpt
   */
  private generateExcerpt(text: string): string {
    const firstParagraph = text.match(/^[^#\n]+/m)?.[0] || '';
    const cleanText = firstParagraph.replace(/[#*`]/g, '').trim();
    return cleanText.length > 200 ? cleanText.substring(0, 197) + '...' : cleanText;
  }

  /**
   * Generate featured image placeholder
   */
  private generateFeaturedImage(topic: string): { url: string; alt: string } {
    return {
      url: `https://via.placeholder.com/800x400/4A90E2/FFFFFF?text=${encodeURIComponent(topic)}`,
      alt: `Featured image for ${topic}`,
    };
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
