
import { generateText, generateObject, type GenerateTextResult, type GenerateObjectResult } from 'ai';
import type { LanguageModelV1 } from '@ai-sdk/provider';
import type { BlogAIConfig, BlogPost, BlogTemplate, BlogTemplateConfig, BlogTemplateContext } from '../types';
import { BLOG_TEMPLATES } from '../types/templates';
import { createBlogPrompt } from './prompts';
import { validateBlogPost } from './validation';

/**
 * Blog generation options
 */
export interface GenerateBlogOptions {
  /** Model to use for generation */
  model: LanguageModelV1;
  
  /** Blog topic */
  topic: string;
  
  /** Target keywords */
  keywords?: string[];
  
  /** Blog template to use */
  template?: BlogTemplate;
  
  /** Template variables */
  templateVariables?: Record<string, any>;
  
  /** Target word count */
  wordCount?: {
    min?: number;
    max?: number;
  };
  
  /** Content tone */
  tone?: string;
  
  /** Target audience */
  audience?: string;
  
  /** Additional context or instructions */
  context?: string;
  
  /** SEO optimization */
  seo?: {
    /** Primary keyword */
    focusKeyword?: string;
    /** Meta description */
    metaDescription?: string;
    /** Include table of contents */
    includeToC?: boolean;
  };
  
  /** Research data to include */
  research?: any;
  
  /** Configuration overrides */
  config?: Partial<BlogAIConfig>;
}

/**
 * Blog generation result
 */
export interface GenerateBlogResult {
  /** Generated blog post */
  blogPost: BlogPost;
  
  /** Generation metadata */
  metadata: {
    /** Template used */
    template: BlogTemplate;
    /** Word count */
    wordCount: number;
    /** Generation time */
    generationTime: number;
    /** Model used */
    model: string;
  };
  
  /** SEO analysis */
  seoAnalysis?: any;
  
  /** Suggestions for improvement */
  suggestions?: string[];
  
  /** Generation warnings */
  warnings?: string[];
}

/**
 * Generate a complete blog post using AI
 */
export async function generateBlog(options: GenerateBlogOptions): Promise<GenerateBlogResult> {
  const startTime = Date.now();
  
  // Get template configuration
  const template = options.template || 'howto';
  const templateConfig = BLOG_TEMPLATES[template];
  
  if (!templateConfig) {
    throw new Error(`Unknown template: ${template}`);
  }
  
  // Create template context
  const templateContext: BlogTemplateContext = {
    template: templateConfig,
    variables: options.templateVariables || {},
    keywords: options.keywords,
    constraints: {
      wordCount: options.wordCount,
      tone: options.tone,
    },
    research: options.research ? { topic: options.research } : undefined,
  };
  
  // Generate the blog content
  const contentResult = await generateBlogContent({
    model: options.model,
    topic: options.topic,
    templateContext,
    audience: options.audience,
    context: options.context,
    config: options.config,
  });
  
  // Generate metadata
  const metadataResult = await generateBlogMetadata({
    model: options.model,
    title: contentResult.title,
    content: contentResult.content,
    keywords: options.keywords,
    seo: options.seo,
  });
  
  // Construct the blog post
  const blogPost: BlogPost = {
    metadata: {
      id: generateId(),
      title: contentResult.title,
      slug: generateSlug(contentResult.title),
      metaDescription: metadataResult.metaDescription,
      createdAt: new Date(),
      updatedAt: new Date(),
      seo: {
        focusKeyword: options.seo?.focusKeyword,
        keywords: options.keywords || [],
        wordCount: contentResult.wordCount,
        seoScore: 0, // Will be calculated later
        readabilityScore: 0, // Will be calculated later
      },
      settings: {
        language: 'en',
        template: template,
        readingTime: Math.ceil(contentResult.wordCount / 200), // Assume 200 WPM
      },
    },
    content: {
      content: contentResult.content,
      excerpt: contentResult.excerpt,
      tableOfContents: contentResult.tableOfContents,
    },
    status: 'draft',
  };
  
  // Validate the blog post
  const validation = validateBlogPost(blogPost);
  const warnings = validation.warnings || [];
  
  // Calculate generation time
  const generationTime = Date.now() - startTime;
  
  return {
    blogPost,
    metadata: {
      template,
      wordCount: contentResult.wordCount,
      generationTime,
      model: options.model.constructor.name,
    },
    suggestions: validation.suggestions,
    warnings,
  };
}

/**
 * Generate blog content using structured approach
 */
async function generateBlogContent(options: {
  model: LanguageModelV1;
  topic: string;
  templateContext: BlogTemplateContext;
  audience?: string;
  context?: string;
  config?: Partial<BlogAIConfig>;
}): Promise<{
  title: string;
  content: string;
  excerpt: string;
  wordCount: number;
  tableOfContents?: Array<{ title: string; anchor: string; level: number }>;
}> {
  // Create the blog prompt
  const prompt = createBlogPrompt({
    topic: options.topic,
    template: options.templateContext.template,
    variables: options.templateContext.variables,
    keywords: options.templateContext.keywords,
    constraints: options.templateContext.constraints,
    audience: options.audience,
    context: options.context,
  });
  
  // Generate structured blog content
  const result = await generateObject({
    model: options.model,
    prompt,
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Engaging blog post title',
        },
        excerpt: {
          type: 'string',
          description: 'Brief excerpt or summary of the post',
        },
        content: {
          type: 'string',
          description: 'Full blog post content in markdown format',
        },
        tableOfContents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              anchor: { type: 'string' },
              level: { type: 'number' },
            },
            required: ['title', 'anchor', 'level'],
          },
          description: 'Table of contents entries',
        },
      },
      required: ['title', 'excerpt', 'content'],
    },
  });
  
  const contentData = result.object;
  const wordCount = countWords(contentData.content);
  
  return {
    title: contentData.title,
    content: contentData.content,
    excerpt: contentData.excerpt,
    wordCount,
    tableOfContents: contentData.tableOfContents,
  };
}

/**
 * Generate blog metadata
 */
async function generateBlogMetadata(options: {
  model: LanguageModelV1;
  title: string;
  content: string;
  keywords?: string[];
  seo?: any;
}): Promise<{
  metaDescription: string;
  tags: string[];
  category: string;
}> {
  const prompt = `Generate SEO-optimized metadata for this blog post:

Title: ${options.title}

Content preview: ${options.content.substring(0, 500)}...

Keywords: ${options.keywords?.join(', ') || 'N/A'}

Generate appropriate:
1. Meta description (150-160 characters, compelling and keyword-rich)
2. Relevant tags (5-8 tags)
3. Primary category

Ensure the metadata is optimized for search engines while being user-friendly.`;
  
  const result = await generateObject({
    model: options.model,
    prompt,
    schema: {
      type: 'object',
      properties: {
        metaDescription: {
          type: 'string',
          description: 'SEO-optimized meta description',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Relevant tags for the post',
        },
        category: {
          type: 'string',
          description: 'Primary category for the post',
        },
      },
      required: ['metaDescription', 'tags', 'category'],
    },
  });
  
  return result.object;
}

/**
 * Stream blog generation for real-time updates
 */
export async function streamBlog(options: GenerateBlogOptions): Promise<AsyncIterable<any>> {
  // Implementation for streaming blog generation
  // This would use streamText instead of generateText
  throw new Error('Stream blog generation not implemented yet');
}

/**
 * Utility functions
 */

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}
