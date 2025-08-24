/**
 * Content Formatting Service
 * Handles content formatting, conversion, and platform-specific adaptations
 */

import { LanguageModel } from 'ai';
import { PrismaClient } from '../generated/prisma-client';
import { BlogPost } from '../types/blog-post';
import {
  ContentFormat,
  FormattedContent,
  FormatOptions,
  PlatformCapabilities,
  ValidationResult,
  ValidationError,
  MediaFile,
  ContentMetadata,
  SEOMetadata,
} from '../types/platform-integration';

export interface ContentFormattingConfig {
  defaultFormat?: ContentFormat;
  preserveFormatting?: boolean;
  optimizeForSEO?: boolean;
  enableSmartTruncation?: boolean;
  customRules?: ContentFormattingRule[];
}

export interface ContentFormattingRule {
  platformName: string;
  contentType?: string;
  rules: {
    maxLength?: number;
    format?: ContentFormat;
    preserveSections?: string[];
    addCallToAction?: boolean;
    optimizeForEngagement?: boolean;
    customTransformations?: ContentTransformation[];
  };
}

export interface ContentTransformation {
  type: 'replace' | 'append' | 'prepend' | 'remove' | 'reformat';
  pattern?: RegExp | string;
  replacement?: string;
  condition?: (content: string) => boolean;
}

export interface AdaptationResult {
  original: BlogPost;
  formatted: FormattedContent;
  adaptationScore: number; // 0-1
  modifications: ContentModification[];
  warnings: string[];
  suggestions: string[];
}

export interface ContentModification {
  type:
    | 'length_reduction'
    | 'format_change'
    | 'structure_change'
    | 'media_optimization'
    | 'seo_optimization';
  description: string;
  impact: 'low' | 'medium' | 'high';
  beforeValue?: string;
  afterValue?: string;
}

/**
 * Content Formatting Service
 * Handles intelligent content adaptation for different platforms
 */
export class ContentFormattingService {
  private config: ContentFormattingConfig;
  private platformRules = new Map<string, ContentFormattingRule>();

  constructor(config: ContentFormattingConfig = {}) {
    this.config = {
      defaultFormat: ContentFormat.HTML,
      preserveFormatting: true,
      optimizeForSEO: true,
      enableSmartTruncation: true,
      ...config,
    };

    // Load custom rules
    if (config.customRules) {
      config.customRules.forEach(rule => {
        this.platformRules.set(rule.platformName, rule);
      });
    }

    // Load default platform rules
    this.loadDefaultRules();
  }

  // ===== MAIN FORMATTING METHODS =====

  /**
   * Format content for a specific platform
   */
  public async formatForPlatform(
    content: BlogPost,
    platformName: string,
    capabilities: PlatformCapabilities,
    options?: FormatOptions,
  ): Promise<AdaptationResult> {
    const modifications: ContentModification[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Get platform-specific rules
    const platformRule = this.platformRules.get(platformName);
    const mergedOptions = this.mergeOptions(options, platformRule?.rules);

    // Start with base formatting
    let formattedContent = this.createBaseFormattedContent(content);

    // Apply format conversion
    formattedContent = await this.applyFormatConversion(
      formattedContent,
      capabilities,
      mergedOptions,
      modifications,
    );

    // Apply length constraints
    formattedContent = await this.applyLengthConstraints(
      formattedContent,
      capabilities,
      mergedOptions,
      modifications,
      warnings,
    );

    // Apply structure adaptations
    formattedContent = await this.applyStructureAdaptations(
      formattedContent,
      platformName,
      capabilities,
      mergedOptions,
      modifications,
    );

    // Optimize media
    formattedContent = await this.optimizeMedia(
      formattedContent,
      capabilities,
      modifications,
      warnings,
    );

    // Apply SEO optimizations
    if (this.config.optimizeForSEO) {
      formattedContent = await this.applySEOOptimizations(
        formattedContent,
        platformName,
        capabilities,
        modifications,
      );
    }

    // Apply platform-specific enhancements
    formattedContent = await this.applyPlatformSpecificEnhancements(
      formattedContent,
      platformName,
      mergedOptions,
      modifications,
    );

    // Generate suggestions
    suggestions.push(
      ...this.generateSuggestions(formattedContent, platformName, capabilities),
    );

    // Calculate adaptation score
    const adaptationScore = this.calculateAdaptationScore(
      content,
      formattedContent,
      modifications,
    );

    return {
      original: content,
      formatted: formattedContent,
      adaptationScore,
      modifications,
      warnings,
      suggestions,
    };
  }

  /**
   * Bulk format content for multiple platforms
   */
  public async formatForMultiplePlatforms(
    content: BlogPost,
    platforms: Array<{
      name: string;
      capabilities: PlatformCapabilities;
      options?: FormatOptions;
    }>,
  ): Promise<Map<string, AdaptationResult>> {
    const results = new Map<string, AdaptationResult>();

    for (const platform of platforms) {
      try {
        const result = await this.formatForPlatform(
          content,
          platform.name,
          platform.capabilities,
          platform.options,
        );
        results.set(platform.name, result);
      } catch (error) {
        console.error(`Failed to format content for ${platform.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Validate formatted content against platform constraints
   */
  public validateContent(
    content: FormattedContent,
    capabilities: PlatformCapabilities,
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: any[] = [];

    // Validate basic constraints
    this.validateBasicConstraints(content, capabilities, errors, warnings);

    // Validate media constraints
    this.validateMediaConstraints(content, capabilities, errors, warnings);

    // Validate format constraints
    this.validateFormatConstraints(content, capabilities, errors, warnings);

    // Generate suggestions
    this.generateValidationSuggestions(content, capabilities, suggestions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  // ===== FORMATTING IMPLEMENTATION METHODS =====

  private createBaseFormattedContent(content: BlogPost): FormattedContent {
    return {
      title: content.title,
      content: content.content,
      excerpt: content.excerpt,

      metadata: {
        slug: content.slug,
        description: content.metaDescription,
        keywords: content.keywords || [],
        publishDate: content.publishedAt
          ? new Date(content.publishedAt)
          : undefined,
        status: this.mapContentStatus(content.status),
        visibility: 'public',
        author: {
          name: content.authorName || 'Unknown Author',
          email: content.authorEmail,
          bio: content.authorBio,
        },
      },

      seo: {
        metaTitle: content.title,
        metaDescription: content.metaDescription,
        focusKeyword: content.focusKeyword,
        ogTitle: content.ogTitle || content.title,
        ogDescription: content.ogDescription || content.metaDescription,
        ogImage: content.ogImage,
        twitterCard: 'summary_large_image',
        twitterTitle: content.title,
        twitterDescription: content.metaDescription,
        twitterImage: content.twitterImage || content.ogImage,
      },

      featuredImage: content.featuredImageUrl
        ? {
            filename: this.extractFilename(content.featuredImageUrl),
            url: content.featuredImageUrl,
            mimeType: this.guessMimeType(content.featuredImageUrl),
            size: 0, // Unknown
            altText: content.featuredImageAlt,
            caption: content.featuredImageCaption,
          }
        : undefined,

      format: this.config.defaultFormat || ContentFormat.HTML,
      originalWordCount: content.wordCount || this.countWords(content.content),
      adaptedWordCount: 0, // Will be calculated
      adaptationScore: 1.0, // Start with perfect score
    };
  }

  private async applyFormatConversion(
    content: FormattedContent,
    capabilities: PlatformCapabilities,
    options?: FormatOptions,
    modifications: ContentModification[] = [],
  ): Promise<FormattedContent> {
    const targetFormat = this.determineTargetFormat(capabilities, options);

    if (content.format !== targetFormat) {
      const originalFormat = content.format;
      content.content = await this.convertFormat(
        content.content,
        content.format,
        targetFormat,
      );
      content.format = targetFormat;

      modifications.push({
        type: 'format_change',
        description: `Converted from ${originalFormat} to ${targetFormat}`,
        impact: 'medium',
        beforeValue: originalFormat,
        afterValue: targetFormat,
      });
    }

    return content;
  }

  private async applyLengthConstraints(
    content: FormattedContent,
    capabilities: PlatformCapabilities,
    options?: FormatOptions,
    modifications: ContentModification[] = [],
    warnings: string[] = [],
  ): Promise<FormattedContent> {
    const maxLength = options?.targetWordCount
      ? options.targetWordCount * 6 // Rough characters per word
      : capabilities.maxContentLength;

    if (content.content.length > maxLength) {
      const originalContent = content.content;

      if (this.config.enableSmartTruncation) {
        content.content = this.smartTruncate(content.content, maxLength);
      } else {
        content.content = this.simpleTruncate(content.content, maxLength);
      }

      modifications.push({
        type: 'length_reduction',
        description: `Reduced content length from ${originalContent.length} to ${content.content.length} characters`,
        impact: 'high',
        beforeValue: `${originalContent.length} chars`,
        afterValue: `${content.content.length} chars`,
      });

      warnings.push(
        `Content was truncated to fit ${maxLength} character limit. Consider reviewing for completeness.`,
      );
    }

    // Apply title length constraints
    if (
      capabilities.maxTitleLength &&
      content.title.length > capabilities.maxTitleLength
    ) {
      const originalTitle = content.title;
      content.title = this.truncateTitle(
        content.title,
        capabilities.maxTitleLength,
      );

      modifications.push({
        type: 'length_reduction',
        description: `Truncated title`,
        impact: 'medium',
        beforeValue: originalTitle,
        afterValue: content.title,
      });
    }

    // Apply description length constraints
    if (
      capabilities.maxDescriptionLength &&
      content.excerpt &&
      content.excerpt.length > capabilities.maxDescriptionLength
    ) {
      const originalExcerpt = content.excerpt;
      content.excerpt = this.truncateDescription(
        content.excerpt,
        capabilities.maxDescriptionLength,
      );

      modifications.push({
        type: 'length_reduction',
        description: `Truncated description`,
        impact: 'low',
        beforeValue: originalExcerpt,
        afterValue: content.excerpt,
      });
    }

    return content;
  }

  private async applyStructureAdaptations(
    content: FormattedContent,
    platformName: string,
    capabilities: PlatformCapabilities,
    options?: FormatOptions,
    modifications: ContentModification[] = [],
  ): Promise<FormattedContent> {
    // Apply platform-specific structure changes
    switch (platformName.toLowerCase()) {
      case 'linkedin':
        content = this.adaptForLinkedIn(content, modifications);
        break;
      case 'twitter':
        content = this.adaptForTwitter(content, modifications);
        break;
      case 'medium':
        content = this.adaptForMedium(content, modifications);
        break;
      case 'wordpress':
        content = this.adaptForWordPress(content, modifications);
        break;
      default:
        // Generic adaptations
        content = this.applyGenericAdaptations(
          content,
          capabilities,
          modifications,
        );
        break;
    }

    return content;
  }

  private async optimizeMedia(
    content: FormattedContent,
    capabilities: PlatformCapabilities,
    modifications: ContentModification[] = [],
    warnings: string[] = [],
  ): Promise<FormattedContent> {
    // Handle featured image
    if (content.featuredImage) {
      if (!capabilities.supportsImages) {
        warnings.push(
          'Platform does not support images. Featured image will be removed.',
        );
        content.featuredImage = undefined;

        modifications.push({
          type: 'media_optimization',
          description: 'Removed featured image (not supported by platform)',
          impact: 'medium',
        });
      } else {
        // Validate image constraints
        if (
          capabilities.maxImageSize &&
          content.featuredImage.size > capabilities.maxImageSize
        ) {
          warnings.push(
            `Featured image exceeds maximum size of ${capabilities.maxImageSize} bytes`,
          );
        }

        // Check supported formats
        if (capabilities.supportedImageFormats) {
          const extension = this.getFileExtension(
            content.featuredImage.filename,
          );
          if (!capabilities.supportedImageFormats.includes(extension)) {
            warnings.push(`Image format ${extension} may not be supported`);
          }
        }
      }
    }

    // Handle gallery
    if (content.gallery && content.gallery.length > 0) {
      if (!capabilities.supportsGalleries) {
        warnings.push(
          'Platform does not support image galleries. Gallery will be removed.',
        );
        content.gallery = undefined;

        modifications.push({
          type: 'media_optimization',
          description: 'Removed image gallery (not supported by platform)',
          impact: 'medium',
        });
      }
    }

    return content;
  }

  private async applySEOOptimizations(
    content: FormattedContent,
    platformName: string,
    capabilities: PlatformCapabilities,
    modifications: ContentModification[] = [],
  ): Promise<FormattedContent> {
    // Optimize meta tags if supported
    if (capabilities.supportsCustomMeta) {
      // Ensure meta description is within limits
      if (
        content.seo.metaDescription &&
        content.seo.metaDescription.length > 160
      ) {
        const originalDesc = content.seo.metaDescription;
        content.seo.metaDescription =
          content.seo.metaDescription.substring(0, 157) + '...';

        modifications.push({
          type: 'seo_optimization',
          description: 'Optimized meta description length',
          impact: 'low',
          beforeValue: originalDesc,
          afterValue: content.seo.metaDescription,
        });
      }

      // Optimize meta title
      if (content.seo.metaTitle && content.seo.metaTitle.length > 60) {
        const originalTitle = content.seo.metaTitle;
        content.seo.metaTitle = content.seo.metaTitle.substring(0, 57) + '...';

        modifications.push({
          type: 'seo_optimization',
          description: 'Optimized meta title length',
          impact: 'low',
          beforeValue: originalTitle,
          afterValue: content.seo.metaTitle,
        });
      }
    }

    // Handle Open Graph tags
    if (!capabilities.supportsOpenGraph) {
      content.seo.ogTitle = undefined;
      content.seo.ogDescription = undefined;
      content.seo.ogImage = undefined;

      modifications.push({
        type: 'seo_optimization',
        description: 'Removed Open Graph tags (not supported)',
        impact: 'low',
      });
    }

    // Handle Twitter Cards
    if (!capabilities.supportsTwitterCards) {
      content.seo.twitterCard = undefined;
      content.seo.twitterTitle = undefined;
      content.seo.twitterDescription = undefined;
      content.seo.twitterImage = undefined;

      modifications.push({
        type: 'seo_optimization',
        description: 'Removed Twitter Card tags (not supported)',
        impact: 'low',
      });
    }

    return content;
  }

  private async applyPlatformSpecificEnhancements(
    content: FormattedContent,
    platformName: string,
    options?: FormatOptions,
    modifications: ContentModification[] = [],
  ): Promise<FormattedContent> {
    const platformRule = this.platformRules.get(platformName);

    if (platformRule?.rules.addCallToAction) {
      const cta = this.generateCallToAction(platformName);
      content.content += '\n\n' + cta;

      modifications.push({
        type: 'structure_change',
        description: 'Added call-to-action',
        impact: 'low',
      });
    }

    if (platformRule?.rules.optimizeForEngagement) {
      content = this.optimizeForEngagement(
        content,
        platformName,
        modifications,
      );
    }

    // Apply custom transformations
    if (platformRule?.rules.customTransformations) {
      for (const transform of platformRule.rules.customTransformations) {
        content = this.applyCustomTransformation(
          content,
          transform,
          modifications,
        );
      }
    }

    // Update adapted word count
    content.adaptedWordCount = this.countWords(content.content);

    return content;
  }

  // ===== PLATFORM-SPECIFIC ADAPTATIONS =====

  private adaptForLinkedIn(
    content: FormattedContent,
    modifications: ContentModification[],
  ): FormattedContent {
    // LinkedIn-specific adaptations

    // Add professional tone markers
    if (
      !content.content.includes('professional') &&
      !content.content.includes('business')
    ) {
      // Could add professional context
    }

    // Optimize for LinkedIn's algorithm
    if (content.metadata.keywords && content.metadata.keywords.length > 3) {
      content.metadata.keywords = content.metadata.keywords.slice(0, 3);

      modifications.push({
        type: 'structure_change',
        description: 'Limited keywords to 3 for LinkedIn optimization',
        impact: 'low',
      });
    }

    // Ensure content encourages engagement
    if (!this.hasEngagementTriggers(content.content)) {
      content.content += '\n\nWhat are your thoughts on this topic?';

      modifications.push({
        type: 'structure_change',
        description: 'Added engagement trigger for LinkedIn',
        impact: 'medium',
      });
    }

    return content;
  }

  private adaptForTwitter(
    content: FormattedContent,
    modifications: ContentModification[],
  ): FormattedContent {
    // Twitter-specific adaptations (for Twitter threads or links)

    // Create thread-friendly content
    if (content.content.length > 280) {
      const threads = this.createTwitterThreads(content.content);
      content.platformSpecific = { threads };

      modifications.push({
        type: 'structure_change',
        description: `Created ${threads.length} Twitter threads`,
        impact: 'high',
      });
    }

    // Add relevant hashtags
    if (content.metadata.keywords) {
      const hashtags = content.metadata.keywords
        .slice(0, 3)
        .map(k => `#${k.replace(/\s+/g, '')}`)
        .join(' ');

      content.platformSpecific = {
        ...content.platformSpecific,
        hashtags,
      };
    }

    return content;
  }

  private adaptForMedium(
    content: FormattedContent,
    modifications: ContentModification[],
  ): FormattedContent {
    // Medium-specific adaptations

    // Ensure proper formatting for Medium's editor
    if (content.format !== ContentFormat.MARKDOWN) {
      // Medium prefers Markdown
      content.content = this.convertToMarkdown(content.content);
      content.format = ContentFormat.MARKDOWN;

      modifications.push({
        type: 'format_change',
        description: 'Converted to Markdown for Medium',
        impact: 'medium',
      });
    }

    // Add subtitle if missing
    if (!content.excerpt) {
      content.excerpt = this.generateSubtitle(content.content);

      modifications.push({
        type: 'structure_change',
        description: 'Generated subtitle for Medium',
        impact: 'low',
      });
    }

    return content;
  }

  private adaptForWordPress(
    content: FormattedContent,
    modifications: ContentModification[],
  ): FormattedContent {
    // WordPress-specific adaptations

    // Ensure proper HTML structure
    if (content.format === ContentFormat.MARKDOWN) {
      content.content = this.convertMarkdownToHtml(content.content);
      content.format = ContentFormat.HTML;

      modifications.push({
        type: 'format_change',
        description: 'Converted to HTML for WordPress',
        impact: 'medium',
      });
    }

    // Add WordPress-specific SEO structure
    if (content.seo.focusKeyword) {
      // Ensure keyword appears in first paragraph
      const firstPara = content.content.match(/<p[^>]*>(.*?)<\/p>/i);
      if (
        firstPara &&
        !firstPara[1]
          .toLowerCase()
          .includes(content.seo.focusKeyword.toLowerCase())
      ) {
        // Could suggest keyword optimization
        modifications.push({
          type: 'seo_optimization',
          description: 'Keyword density optimization needed',
          impact: 'medium',
        });
      }
    }

    return content;
  }

  private applyGenericAdaptations(
    content: FormattedContent,
    capabilities: PlatformCapabilities,
    modifications: ContentModification[],
  ): FormattedContent {
    // Generic adaptations based on capabilities

    // Remove unsupported HTML if platform doesn't support it
    if (!capabilities.supportsHTML && content.format === ContentFormat.HTML) {
      content.content = this.stripHtml(content.content);
      content.format = ContentFormat.PLAIN_TEXT;

      modifications.push({
        type: 'format_change',
        description: 'Converted to plain text (HTML not supported)',
        impact: 'high',
      });
    }

    // Handle custom CSS
    if (!capabilities.supportsCustomCSS) {
      content.content = content.content.replace(
        /<style[^>]*>.*?<\/style>/gis,
        '',
      );

      if (content.content !== content.content) {
        modifications.push({
          type: 'format_change',
          description: 'Removed custom CSS (not supported)',
          impact: 'low',
        });
      }
    }

    return content;
  }

  // ===== UTILITY METHODS =====

  private mergeOptions(
    options?: FormatOptions,
    ruleOptions?: any,
  ): FormatOptions {
    return {
      ...ruleOptions,
      ...options,
    };
  }

  private determineTargetFormat(
    capabilities: PlatformCapabilities,
    options?: FormatOptions,
  ): ContentFormat {
    if (options?.customMappings?.format) {
      return options.customMappings.format as ContentFormat;
    }

    // Choose best supported format
    if (capabilities.supportedFormats.includes(ContentFormat.HTML)) {
      return ContentFormat.HTML;
    } else if (capabilities.supportedFormats.includes(ContentFormat.MARKDOWN)) {
      return ContentFormat.MARKDOWN;
    } else if (
      capabilities.supportedFormats.includes(ContentFormat.RICH_TEXT)
    ) {
      return ContentFormat.RICH_TEXT;
    } else {
      return ContentFormat.PLAIN_TEXT;
    }
  }

  private async convertFormat(
    content: string,
    fromFormat: ContentFormat,
    toFormat: ContentFormat,
  ): Promise<string> {
    if (fromFormat === toFormat) return content;

    // Implement format conversions
    switch (`${fromFormat}->${toFormat}`) {
      case `${ContentFormat.MARKDOWN}->${ContentFormat.HTML}`:
        return this.convertMarkdownToHtml(content);
      case `${ContentFormat.HTML}->${ContentFormat.MARKDOWN}`:
        return this.convertHtmlToMarkdown(content);
      case `${ContentFormat.HTML}->${ContentFormat.PLAIN_TEXT}`:
        return this.stripHtml(content);
      case `${ContentFormat.MARKDOWN}->${ContentFormat.PLAIN_TEXT}`:
        return this.stripMarkdown(content);
      default:
        return content;
    }
  }

  private smartTruncate(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;

    // Try to truncate at sentence boundary
    const sentences = content.split(/[.!?]+/);
    let truncated = '';

    for (const sentence of sentences) {
      if (truncated.length + sentence.length + 1 > maxLength - 50) {
        break;
      }
      truncated += sentence + '. ';
    }

    return truncated.trim() || content.substring(0, maxLength - 3) + '...';
  }

  private simpleTruncate(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength - 3) + '...';
  }

  private truncateTitle(title: string, maxLength: number): string {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength - 3) + '...';
  }

  private truncateDescription(description: string, maxLength: number): string {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength - 3) + '...';
  }

  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  private mapContentStatus(
    status: string,
  ): 'draft' | 'published' | 'private' | 'unlisted' {
    switch (status.toLowerCase()) {
      case 'published':
        return 'published';
      case 'private':
        return 'private';
      case 'unlisted':
        return 'unlisted';
      default:
        return 'draft';
    }
  }

  private extractFilename(url: string): string {
    return url.split('/').pop() || 'file';
  }

  private guessMimeType(url: string): string {
    const ext = this.getFileExtension(url);
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private generateCallToAction(platformName: string): string {
    const ctas = {
      linkedin:
        'What are your thoughts? Share your experience in the comments below.',
      twitter: 'What do you think? Reply with your thoughts!',
      medium:
        'If you found this helpful, please give it a clap and follow for more insights.',
      default: 'Thanks for reading! Share your thoughts in the comments.',
    };

    return ctas[platformName as keyof typeof ctas] || ctas.default;
  }

  private hasEngagementTriggers(content: string): boolean {
    const triggers = [
      /what do you think/i,
      /share your/i,
      /comment/i,
      /thoughts/i,
      /\?/,
    ];

    return triggers.some(trigger => trigger.test(content));
  }

  private optimizeForEngagement(
    content: FormattedContent,
    platformName: string,
    modifications: ContentModification[],
  ): FormattedContent {
    // Add engagement optimizations based on platform

    if (
      platformName === 'linkedin' &&
      !this.hasEngagementTriggers(content.content)
    ) {
      content.content +=
        "\n\n💭 What's your experience with this? Share in the comments!";

      modifications.push({
        type: 'structure_change',
        description: 'Added engagement optimization',
        impact: 'medium',
      });
    }

    return content;
  }

  private applyCustomTransformation(
    content: FormattedContent,
    transform: ContentTransformation,
    modifications: ContentModification[],
  ): FormattedContent {
    if (transform.condition && !transform.condition(content.content)) {
      return content;
    }

    const originalContent = content.content;

    switch (transform.type) {
      case 'replace':
        if (transform.pattern && transform.replacement !== undefined) {
          content.content = content.content.replace(
            transform.pattern,
            transform.replacement,
          );
        }
        break;
      case 'append':
        if (transform.replacement) {
          content.content += transform.replacement;
        }
        break;
      case 'prepend':
        if (transform.replacement) {
          content.content = transform.replacement + content.content;
        }
        break;
      case 'remove':
        if (transform.pattern) {
          content.content = content.content.replace(transform.pattern, '');
        }
        break;
    }

    if (content.content !== originalContent) {
      modifications.push({
        type: 'structure_change',
        description: `Applied custom transformation: ${transform.type}`,
        impact: 'low',
      });
    }

    return content;
  }

  private createTwitterThreads(content: string): string[] {
    const maxTweetLength = 270; // Leave room for thread numbering
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const threads: string[] = [];
    let currentThread = '';

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim() + '.';

      if (currentThread.length + sentence.length + 1 > maxTweetLength) {
        if (currentThread.length > 0) {
          threads.push(currentThread.trim());
          currentThread = sentence;
        } else {
          // Single sentence is too long, truncate it
          threads.push(sentence.substring(0, maxTweetLength - 3) + '...');
        }
      } else {
        currentThread += (currentThread.length > 0 ? ' ' : '') + sentence;
      }
    }

    if (currentThread.length > 0) {
      threads.push(currentThread.trim());
    }

    // Add thread numbering
    return threads.map(
      (thread, index) => `${index + 1}/${threads.length} ${thread}`,
    );
  }

  private generateSubtitle(content: string): string {
    // Generate a subtitle from the first paragraph
    const firstParagraph = content.split('\n\n')[0];
    const plainText = this.stripHtml(firstParagraph);

    if (plainText.length > 100) {
      return plainText.substring(0, 97) + '...';
    }

    return plainText;
  }

  private convertMarkdownToHtml(markdown: string): string {
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^\)]+)\)/gim, '<img src="$2" alt="$1" />')
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2">$1</a>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gim, '<p>$1</p>')
      .replace(/<p><h([1-6])>/gi, '<h$1>')
      .replace(/<\/h([1-6])><\/p>/gi, '</h$1>');
  }

  private convertHtmlToMarkdown(html: string): string {
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
      .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<[^>]*>/g, ''); // Remove remaining HTML tags
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  private stripMarkdown(markdown: string): string {
    return markdown
      .replace(/^#{1,6}\s+/gm, '') // Headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1') // Images
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
      .trim();
  }

  private convertToMarkdown(content: string): string {
    // If content is HTML, convert to Markdown
    if (content.includes('<') && content.includes('>')) {
      return this.convertHtmlToMarkdown(content);
    }
    return content;
  }

  private calculateAdaptationScore(
    original: BlogPost,
    formatted: FormattedContent,
    modifications: ContentModification[],
  ): number {
    let score = 1.0;

    // Deduct points for high-impact modifications
    for (const mod of modifications) {
      switch (mod.impact) {
        case 'high':
          score -= 0.15;
          break;
        case 'medium':
          score -= 0.08;
          break;
        case 'low':
          score -= 0.03;
          break;
      }
    }

    // Adjust based on content length preservation
    const lengthRatio =
      formatted.adaptedWordCount / formatted.originalWordCount;
    if (lengthRatio < 0.7) {
      score -= 0.2; // Significant content loss
    } else if (lengthRatio < 0.9) {
      score -= 0.1; // Moderate content loss
    }

    return Math.max(0, Math.min(1, score));
  }

  private generateSuggestions(
    content: FormattedContent,
    platformName: string,
    capabilities: PlatformCapabilities,
  ): string[] {
    const suggestions: string[] = [];

    // Platform-specific suggestions
    if (platformName === 'linkedin' && content.adaptedWordCount > 1000) {
      suggestions.push(
        'Consider breaking this into multiple LinkedIn posts for better engagement',
      );
    }

    if (platformName === 'twitter' && content.adaptedWordCount > 100) {
      suggestions.push(
        'This content might work better as a Twitter thread or blog link',
      );
    }

    // General suggestions
    if (!content.featuredImage && capabilities.supportsImages) {
      suggestions.push('Adding a featured image could improve engagement');
    }

    if (!content.metadata.keywords || content.metadata.keywords.length === 0) {
      suggestions.push(
        'Adding relevant keywords could improve discoverability',
      );
    }

    return suggestions;
  }

  // ===== VALIDATION METHODS =====

  private validateBasicConstraints(
    content: FormattedContent,
    capabilities: PlatformCapabilities,
    errors: ValidationError[],
    warnings: ValidationError[],
  ): void {
    // Title validation
    if (!content.title || content.title.trim().length === 0) {
      errors.push({
        field: 'title',
        message: 'Title is required',
        code: 'REQUIRED',
        severity: 'error',
      });
    }

    if (
      capabilities.maxTitleLength &&
      content.title.length > capabilities.maxTitleLength
    ) {
      errors.push({
        field: 'title',
        message: `Title exceeds maximum length of ${capabilities.maxTitleLength}`,
        code: 'MAX_LENGTH',
        severity: 'error',
      });
    }

    // Content validation
    if (!content.content || content.content.trim().length === 0) {
      errors.push({
        field: 'content',
        message: 'Content is required',
        code: 'REQUIRED',
        severity: 'error',
      });
    }

    if (content.content.length > capabilities.maxContentLength) {
      errors.push({
        field: 'content',
        message: `Content exceeds maximum length of ${capabilities.maxContentLength}`,
        code: 'MAX_LENGTH',
        severity: 'error',
      });
    }
  }

  private validateMediaConstraints(
    content: FormattedContent,
    capabilities: PlatformCapabilities,
    errors: ValidationError[],
    warnings: ValidationError[],
  ): void {
    if (content.featuredImage) {
      if (!capabilities.supportsImages) {
        warnings.push({
          field: 'featuredImage',
          message: 'Platform does not support images',
          code: 'UNSUPPORTED',
          severity: 'warning',
        });
      }

      if (
        capabilities.maxImageSize &&
        content.featuredImage.size > capabilities.maxImageSize
      ) {
        errors.push({
          field: 'featuredImage',
          message: `Image size exceeds limit of ${capabilities.maxImageSize} bytes`,
          code: 'FILE_TOO_LARGE',
          severity: 'error',
        });
      }
    }

    if (content.gallery && !capabilities.supportsGalleries) {
      warnings.push({
        field: 'gallery',
        message: 'Platform does not support image galleries',
        code: 'UNSUPPORTED',
        severity: 'warning',
      });
    }
  }

  private validateFormatConstraints(
    content: FormattedContent,
    capabilities: PlatformCapabilities,
    errors: ValidationError[],
    warnings: ValidationError[],
  ): void {
    if (!capabilities.supportedFormats.includes(content.format)) {
      errors.push({
        field: 'format',
        message: `Format ${content.format} is not supported`,
        code: 'UNSUPPORTED_FORMAT',
        severity: 'error',
      });
    }
  }

  private generateValidationSuggestions(
    content: FormattedContent,
    capabilities: PlatformCapabilities,
    suggestions: any[],
  ): void {
    // Add validation-based suggestions
    if (capabilities.supportsImages && !content.featuredImage) {
      suggestions.push({
        field: 'featuredImage',
        suggestion: 'Consider adding a featured image to improve engagement',
        impact: 'medium',
      });
    }

    if (
      capabilities.supportsTags &&
      (!content.metadata.keywords || content.metadata.keywords.length === 0)
    ) {
      suggestions.push({
        field: 'keywords',
        suggestion: 'Add relevant keywords/tags to improve discoverability',
        impact: 'medium',
      });
    }
  }

  // ===== CONFIGURATION METHODS =====

  private loadDefaultRules(): void {
    // Load default platform rules
    const defaultRules: ContentFormattingRule[] = [
      {
        platformName: 'linkedin',
        rules: {
          maxLength: 3000,
          optimizeForEngagement: true,
          addCallToAction: true,
        },
      },
      {
        platformName: 'twitter',
        rules: {
          maxLength: 280,
          format: ContentFormat.PLAIN_TEXT,
          customTransformations: [
            {
              type: 'append',
              replacement: ' #content',
            },
          ],
        },
      },
      {
        platformName: 'medium',
        rules: {
          format: ContentFormat.MARKDOWN,
          preserveSections: ['introduction', 'conclusion'],
        },
      },
      {
        platformName: 'wordpress',
        rules: {
          format: ContentFormat.HTML,
          optimizeForEngagement: false,
        },
      },
    ];

    defaultRules.forEach(rule => {
      if (!this.platformRules.has(rule.platformName)) {
        this.platformRules.set(rule.platformName, rule);
      }
    });
  }

  public addPlatformRule(rule: ContentFormattingRule): void {
    this.platformRules.set(rule.platformName, rule);
  }

  public removePlatformRule(platformName: string): void {
    this.platformRules.delete(platformName);
  }

  public getPlatformRule(
    platformName: string,
  ): ContentFormattingRule | undefined {
    return this.platformRules.get(platformName);
  }
}

// Export factory function
export function createContentFormattingService(
  config?: ContentFormattingConfig,
): ContentFormattingService {
  return new ContentFormattingService(config);
}
