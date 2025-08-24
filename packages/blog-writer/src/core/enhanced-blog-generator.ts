import { generateText } from 'ai';
import type { LanguageModelV1 } from '@ai-sdk/provider';
import type {
  BlogAIConfig,
  BlogPost,
  EnhancedGenerateBlogResult,
  BlogTemplate,
} from '../types';
import { blogProvider } from '../providers/blog-provider';
import { contentRouter } from '../providers/content-router';
import { templateSelector } from '../providers/template-selector';
import { blogPostRepository } from '../database/blog-post-repository';
import { contentTypeDetector } from '../database/content-type-detector';
import { generateId } from '@ai-sdk/provider-utils';

/**
 * Enhanced blog generation options with Week 1-2 features
 */
export interface EnhancedGenerateBlogOptions {
  /** Language model to use */
  model: LanguageModelV1;

  /** Blog topic */
  topic: string;

  /** Optional description for better content type detection */
  description?: string;

  /** Target keywords */
  keywords?: string[];

  /** Target audience */
  audience?: 'beginners' | 'intermediate' | 'experts' | 'general';

  /** Business goals */
  businessGoals?: (
    | 'lead-generation'
    | 'brand-awareness'
    | 'thought-leadership'
    | 'education'
    | 'product-promotion'
    | 'seo-ranking'
  )[];

  /** Industry context */
  industry?: string;

  /** Specific template to use (optional - will auto-detect if not provided) */
  template?: BlogTemplate;

  /** Target word count range */
  wordCount?: { min: number; max: number };

  /** Writing tone */
  tone?:
    | 'professional'
    | 'casual'
    | 'authoritative'
    | 'friendly'
    | 'technical'
    | 'conversational';

  /** Configuration overrides */
  config?: Partial<BlogAIConfig>;

  /** Whether to save to database */
  persistToDB?: boolean;

  /** Author information */
  author?: {
    name: string;
    email?: string;
    bio?: string;
  };

  /** Additional context for AI processing */
  additionalContext?: string;

  /** Enable advanced content routing */
  useContentRouting?: boolean;

  /** Configuration name to load from database */
  configurationName?: string;
}

/**
 * Enhanced blog generator implementing Week 1-2 core architecture
 */
export async function generateEnhancedBlog(
  options: EnhancedGenerateBlogOptions,
): Promise<EnhancedGenerateBlogResult> {
  const startTime = Date.now();

  // Initialize blog provider
  const provider = blogProvider;
  await provider.initialize();

  // Step 1: Content Type Detection and Routing
  let contentProcessingResult;
  let routingDecision;

  if (options.useContentRouting !== false) {
    // Use advanced content routing
    routingDecision = await contentRouter.routeContent({
      topic: options.topic,
      description: options.description,
      audience: options.audience,
      goals: options.businessGoals,
      keywords: options.keywords,
      businessContext: options.industry
        ? `Industry: ${options.industry}`
        : undefined,
      model: options.model,
    });

    contentProcessingResult = await provider.processContent(
      options.topic,
      options.description,
      `${options.additionalContext || ''} Audience: ${options.audience || 'general'} Goals: ${options.businessGoals?.join(', ') || 'inform'}`,
      options.model,
    );
  } else {
    // Simple content processing
    contentProcessingResult = await provider.processContent(
      options.topic,
      options.description,
      options.additionalContext,
      options.model,
    );
  }

  // Step 2: Template Selection and Optimization
  const templateResult = await templateSelector.selectTemplate({
    topic: options.topic,
    contentType: contentProcessingResult.contentType.contentType,
    audience: options.audience,
    purpose: options.businessGoals?.includes('education')
      ? 'education'
      : options.businessGoals?.includes('lead-generation')
        ? 'marketing'
        : 'information',
    tone: options.tone,
    wordCountRange:
      options.wordCount || contentProcessingResult.routingConfig.wordCountRange,
    businessGoals: options.businessGoals,
    industry: options.industry,
  });

  // Step 3: Enhanced Prompt Creation
  const enhancedPrompt = await createEnhancedPrompt(
    templateResult.selectedTemplate.promptTemplate,
    options,
    contentProcessingResult,
    routingDecision,
  );

  // Step 4: Content Generation
  const generationResult = await generateText({
    model: options.model,
    prompt: enhancedPrompt,
    temperature: 0.7,
    maxTokens: Math.min(4000, (options.wordCount?.max || 2500) * 1.5), // Rough token estimation
  });

  // Step 5: Parse and Structure Content
  const blogPost = await parseGeneratedContent(
    generationResult.text,
    options,
    contentProcessingResult,
    templateResult,
  );

  // Step 6: SEO Analysis and Optimization
  const seoAnalysis = await performSEOAnalysis(blogPost, options.keywords);

  // Step 7: Persistence (if enabled)
  let persistedPost;
  if (options.persistToDB !== false) {
    try {
      persistedPost = await blogPostRepository.create(blogPost);

      // Save processing result for future reference
      await provider.saveProcessingResult(
        options.topic,
        contentProcessingResult,
        persistedPost.id,
      );
    } catch (error) {
      console.warn('Failed to persist blog post:', error);
    }
  }

  // Step 8: Generate Recommendations and Suggestions
  const suggestions = generateSuggestions(
    blogPost,
    contentProcessingResult,
    templateResult,
    seoAnalysis,
  );

  const processingTime = Date.now() - startTime;

  return {
    blogPost,
    contentTypeDetection: {
      detectedType: contentProcessingResult.contentType.contentType,
      confidence: contentProcessingResult.contentType.confidence,
      suggestions: contentProcessingResult.contentType.recommendations || [],
    },
    seoAnalysis: {
      score: seoAnalysis.score,
      recommendations: seoAnalysis.recommendations,
    },
    metadata: {
      wordCount: blogPost.metadata.seo?.wordCount || 0,
      readingTime: Math.ceil((blogPost.metadata.seo?.wordCount || 0) / 200), // Assume 200 WPM reading speed
      processingTime,
      modelUsed: options.model.constructor.name || 'Unknown',
      template: templateResult.selectedTemplate.name,
    },
    suggestions: {
      improvements: suggestions.improvements,
      nextSteps: suggestions.nextSteps,
    },
  };
}

/**
 * Create enhanced prompt incorporating all Week 1-2 features
 */
async function createEnhancedPrompt(
  basePrompt: string,
  options: EnhancedGenerateBlogOptions,
  contentResult: any,
  routingResult?: any,
): Promise<string> {
  let enhancedPrompt = basePrompt;

  // Replace template variables
  const variables = {
    topic: options.topic,
    keywords: options.keywords?.join(', ') || '',
    audience: options.audience || 'general',
    tone: options.tone || 'professional',
    industry: options.industry || '',
    wordCount: options.wordCount
      ? `${options.wordCount.min}-${options.wordCount.max}`
      : 'flexible',
    contentType: contentResult.contentType.contentType.toLowerCase(),
    businessGoals: options.businessGoals?.join(', ') || '',
  };

  // Replace variables in template
  for (const [key, value] of Object.entries(variables)) {
    enhancedPrompt = enhancedPrompt.replace(
      new RegExp(`{{${key}}}`, 'gi'),
      String(value),
    );
  }

  // Add content routing guidance
  if (routingResult) {
    enhancedPrompt += `\n\nContent Routing Guidance:
- Content Type: ${routingResult.config.contentType}
- Quality Level: ${routingResult.config.qualityLevel}
- SEO Optimization: ${routingResult.config.seoOptimization}
- Required Sections: ${routingResult.config.requiredSections.join(', ')}
- Word Count Target: ${routingResult.config.wordCountTarget.optimal} words (${routingResult.config.wordCountTarget.min}-${routingResult.config.wordCountTarget.max})`;
  }

  // Add SEO instructions
  if (options.keywords?.length > 0) {
    enhancedPrompt += `\n\nSEO Requirements:
- Primary keyword: ${options.keywords[0]}
- Secondary keywords: ${options.keywords.slice(1, 4).join(', ')}
- Include keywords naturally in title, headings, and throughout content
- Target keyword density: 1-2%
- Create compelling meta description (150-160 characters)`;
  }

  // Add business goal alignment
  if (options.businessGoals?.length > 0) {
    const goalInstructions = {
      'lead-generation':
        'Include strategic call-to-action elements and value propositions that encourage reader engagement',
      'brand-awareness':
        'Emphasize brand values and unique positioning while providing valuable insights',
      'thought-leadership':
        'Demonstrate expertise with original insights, industry analysis, and forward-thinking perspectives',
      education:
        'Focus on clear explanations, practical examples, and actionable takeaways for learning',
      'product-promotion':
        'Naturally integrate product benefits and use cases without being overly promotional',
      'seo-ranking':
        'Optimize for search engines with comprehensive keyword coverage and authoritative content structure',
    };

    enhancedPrompt += `\n\nBusiness Goal Alignment:`;
    for (const goal of options.businessGoals) {
      enhancedPrompt += `\n- ${goal}: ${goalInstructions[goal]}`;
    }
  }

  // Add format specifications
  enhancedPrompt += `\n\nOutput Format:
Please provide the content in the following structure:
1. Title: [Compelling, SEO-optimized title]
2. Meta Description: [150-160 character description]
3. Content: [Full blog post content with proper headings and structure]
4. Key Takeaways: [3-5 bullet points summarizing main insights]
5. Suggested Tags: [5-7 relevant tags for categorization]

Make the content engaging, informative, and optimized for both readers and search engines.`;

  return enhancedPrompt;
}

/**
 * Parse and structure generated content into BlogPost format
 */
async function parseGeneratedContent(
  generatedText: string,
  options: EnhancedGenerateBlogOptions,
  contentResult: any,
  templateResult: any,
): Promise<BlogPost> {
  // Simple parsing logic - in production, this could be more sophisticated
  const lines = generatedText.split('\n').filter(line => line.trim());

  let title = '';
  let metaDescription = '';
  let content = '';
  let keyTakeaways: string[] = [];
  let suggestedTags: string[] = [];

  let currentSection = '';
  let contentLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.toLowerCase().startsWith('title:')) {
      title = trimmedLine.substring(6).trim();
      continue;
    }

    if (trimmedLine.toLowerCase().startsWith('meta description:')) {
      metaDescription = trimmedLine.substring(17).trim();
      continue;
    }

    if (trimmedLine.toLowerCase().startsWith('content:')) {
      currentSection = 'content';
      continue;
    }

    if (trimmedLine.toLowerCase().startsWith('key takeaways:')) {
      currentSection = 'takeaways';
      continue;
    }

    if (trimmedLine.toLowerCase().startsWith('suggested tags:')) {
      currentSection = 'tags';
      continue;
    }

    // Process content based on current section
    if (currentSection === 'content') {
      if (
        trimmedLine &&
        !trimmedLine.toLowerCase().includes('takeaways') &&
        !trimmedLine.toLowerCase().includes('tags')
      ) {
        contentLines.push(line);
      }
    } else if (currentSection === 'takeaways') {
      if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
        keyTakeaways.push(trimmedLine.substring(1).trim());
      }
    } else if (currentSection === 'tags') {
      if (trimmedLine) {
        // Parse comma-separated tags
        const tags = trimmedLine
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag);
        suggestedTags.push(...tags);
      }
    }
  }

  // Join content lines
  content = contentLines.join('\n').trim();

  // Fallback to full text if parsing failed
  if (!content) {
    content = generatedText;
  }

  // Generate title if not parsed
  if (!title) {
    title = options.topic;
  }

  // Generate slug
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Calculate word count
  const wordCount = content.split(/\s+/).filter(word => word).length;

  // Create blog post structure
  const blogPost: BlogPost = {
    metadata: {
      id: generateId(),
      title,
      metaDescription,
      slug,
      author: options.author,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: contentResult.contentType.contentType.toLowerCase(),
      tags: suggestedTags.slice(0, 7), // Limit to 7 tags
      seo: {
        focusKeyword: options.keywords?.[0],
        keywords: options.keywords,
        wordCount,
        seoScore: 0, // Will be calculated in SEO analysis
        readabilityScore: 0, // Will be calculated in SEO analysis
      },
      settings: {
        language: 'en',
        template: templateResult.selectedTemplate.name,
        readingTime: Math.ceil(wordCount / 200), // 200 WPM average
      },
    },
    content: {
      content,
      excerpt:
        content
          .split('\n')
          .find(line => line.trim().length > 50)
          ?.substring(0, 200) + '...',
    },
    status: 'draft',
  };

  return blogPost;
}

/**
 * Perform SEO analysis on generated content
 */
async function performSEOAnalysis(
  blogPost: BlogPost,
  keywords?: string[],
): Promise<{ score: number; recommendations: string[] }> {
  const recommendations: string[] = [];
  let score = 0;

  // Title optimization
  if (
    blogPost.metadata.title.length >= 30 &&
    blogPost.metadata.title.length <= 60
  ) {
    score += 15;
  } else {
    recommendations.push('Optimize title length (30-60 characters)');
  }

  // Meta description
  if (
    blogPost.metadata.metaDescription &&
    blogPost.metadata.metaDescription.length >= 150 &&
    blogPost.metadata.metaDescription.length <= 160
  ) {
    score += 15;
  } else {
    recommendations.push('Add meta description (150-160 characters)');
  }

  // Word count
  const wordCount = blogPost.metadata.seo?.wordCount || 0;
  if (wordCount >= 800) {
    score += 20;
  } else {
    recommendations.push('Increase content length (minimum 800 words)');
  }

  // Keyword optimization
  if (keywords?.length > 0 && blogPost.content.content) {
    const content = blogPost.content.content.toLowerCase();
    const titleLower = blogPost.metadata.title.toLowerCase();
    const primaryKeyword = keywords[0].toLowerCase();

    if (titleLower.includes(primaryKeyword)) {
      score += 15;
    } else {
      recommendations.push('Include primary keyword in title');
    }

    // Simple keyword density check
    const keywordCount = (content.match(new RegExp(primaryKeyword, 'g')) || [])
      .length;
    const density = keywordCount / wordCount;

    if (density >= 0.01 && density <= 0.025) {
      score += 15;
    } else if (density < 0.01) {
      recommendations.push('Increase keyword density (1-2.5%)');
    } else {
      recommendations.push('Reduce keyword density to avoid over-optimization');
    }
  }

  // Headings structure
  const headingMatches =
    blogPost.content.content.match(/^#{1,6}\s+.+$/gm) || [];
  if (headingMatches.length >= 3) {
    score += 10;
  } else {
    recommendations.push('Add more headings for better structure');
  }

  // Internal structure
  if (blogPost.content.content.includes('\n\n')) {
    score += 10; // Has paragraphs
  } else {
    recommendations.push('Improve content structure with proper paragraphs');
  }

  return { score: Math.min(100, score), recommendations };
}

/**
 * Generate improvement suggestions based on analysis
 */
function generateSuggestions(
  blogPost: BlogPost,
  contentResult: any,
  templateResult: any,
  seoAnalysis: { score: number; recommendations: string[] },
): { improvements: string[]; nextSteps: string[] } {
  const improvements: string[] = [...seoAnalysis.recommendations];
  const nextSteps: string[] = [];

  // Content type specific improvements
  if (contentResult.contentType.confidence < 0.8) {
    improvements.push(
      'Consider refining topic focus for better content type detection',
    );
  }

  // Template optimization suggestions
  if (templateResult.alternatives.length > 0) {
    const topAlternative = templateResult.alternatives[0];
    if (topAlternative.score > 80) {
      improvements.push(
        `Consider using ${topAlternative.name} template for potentially better results`,
      );
    }
  }

  // Word count optimization
  const wordCount = blogPost.metadata.seo?.wordCount || 0;
  if (wordCount < 1000) {
    improvements.push('Consider expanding content for better SEO performance');
  } else if (wordCount > 3000) {
    improvements.push('Consider breaking into a series for better readability');
  }

  // Next steps
  nextSteps.push('Review and edit for clarity and flow');
  nextSteps.push('Add relevant images and optimize alt text');
  nextSteps.push('Set up internal linking to related content');

  if (seoAnalysis.score < 80) {
    nextSteps.push('Implement SEO recommendations before publishing');
  }

  nextSteps.push('Schedule social media promotion');
  nextSteps.push('Monitor performance and update based on analytics');

  return { improvements, nextSteps };
}
