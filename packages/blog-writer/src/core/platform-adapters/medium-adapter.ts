

/**
 * Medium Platform Adapter
 * Supports Medium's publishing API
 */

import { BasePlatformAdapter, type PlatformAdapterConfig } from '../base-platform-adapter';
import type {
  PlatformCapabilities,
  ContentFormat,
  PlatformCredentials,
  AuthenticationResult,
  ConnectionValidationResult,
  FormattedContent,
  PublishResult,
  ScheduleResult,
  PlatformAnalytics,
  ContentAnalytics,
  RateLimitStatus,
  FormatOptions,
  PublishOptions,
  AnalyticsOptions,
  DateRange,
  ValidationError
} from '../../types/platform-integration';
import type { BlogPost } from '../../types/blog-post';

export interface MediumConfig extends PlatformAdapterConfig {
  apiUrl?: string; // Default: 'https://api.medium.com/v1'
}

/**
 * Medium platform adapter
 * Handles publishing to Medium's API
 */
export class MediumAdapter extends BasePlatformAdapter {
  readonly name = 'medium';
  readonly displayName = 'Medium';
  readonly version = '1.0.0';

  readonly capabilities: PlatformCapabilities = {
    maxContentLength: 100000,
    maxTitleLength: 100,
    maxDescriptionLength: 1000,
    maxTagsCount: 5,

    // Media support
    supportsImages: true,
    supportsVideo: false,
    supportsAudio: false,
    supportsGalleries: false,
    maxImageSize: 25 * 1024 * 1024, // 25MB
    supportedImageFormats: ['jpeg', 'jpg', 'png', 'gif'],

    // Publishing features
    supportsScheduling: false,
    supportsDrafts: true,
    supportsUpdates: false,
    supportsDeleting: false,
    supportsCategories: false,
    supportsTags: true,

    // Analytics
    supportsAnalytics: true,
    supportsRealTimeMetrics: false,
    supportsCustomEvents: false,

    // SEO
    supportsCustomMeta: false,
    supportsOpenGraph: false,
    supportsTwitterCards: false,
    supportsSchema: false,
    supportsCanonical: true,

    // Formatting
    supportedFormats: [ContentFormat.MARKDOWN, ContentFormat.HTML],
    supportsMarkdown: true,
    supportsHTML: true,
    supportsRichText: false,
    supportsCustomCSS: false,

    // Social features
    supportsComments: true,
    supportsSharing: true,
    supportsReactions: true,
    supportsSubscriptions: false,

    // Advanced features
    supportsA11y: false,
    supportsMultiLanguage: false,
    supportsVersioning: false,
    supportsBulkOperations: false,
  };

  private mediumConfig: MediumConfig;

  constructor(config: MediumConfig = {}) {
    super(config);
    this.mediumConfig = {
      apiUrl: 'https://api.medium.com/v1',
      ...config,
    };
  }

  async authenticate(credentials: PlatformCredentials): Promise<AuthenticationResult> {
    try {
      this.credentials = credentials;

      // Test the token with Medium's user API
      const response = await this.makeRequest(
        `${this.mediumConfig.apiUrl}/me`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${credentials.data.accessToken}`,
            'Accept': 'application/json',
            'Accept-Charset': 'utf-8'
          }
        }
      );

      const userData = await response.json();

      return {
        success: true,
        token: credentials.data.accessToken,
        userInfo: {
          id: userData.data.id,
          name: userData.data.name || userData.data.username,
          email: userData.data.email,
        }
      };
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  async validateConnection(): Promise<ConnectionValidationResult> {
    try {
      if (!this.credentials) {
        return {
          isValid: false,
          isAuthenticated: false,
          capabilities: this.capabilities,
          error: 'No credentials provided'
        };
      }

      const response = await this.makeRequest(
        `${this.mediumConfig.apiUrl}/me`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.credentials.data.accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      const userData = await response.json();

      return {
        isValid: true,
        isAuthenticated: true,
        capabilities: this.capabilities
      };
    } catch (error) {
      return {
        isValid: false,
        isAuthenticated: false,
        capabilities: this.capabilities,
        error: String(error)
      };
    }
  }

  async formatContent(
    content: BlogPost,
    options?: FormatOptions
  ): Promise<FormattedContent> {
    // Convert content to Medium's format
    let formattedContent = content.content.content;
    
    // Medium supports Markdown and HTML
    if (options?.preserveFormatting !== false) {
      // Convert to Markdown for better Medium compatibility
      formattedContent = this.convertToMarkdown(formattedContent);
    }

    // Apply word count constraints if specified
    if (options?.targetWordCount) {
      formattedContent = this.truncateContent(formattedContent, options.targetWordCount);
    }

    return {
      title: content.metadata.title,
      content: formattedContent,
      excerpt: content.content.excerpt,
      
      metadata: {
        slug: content.metadata.slug,
        description: content.metadata.metaDescription,
        tags: content.metadata.tags?.slice(0, this.capabilities.maxTagsCount) || [],
        categories: [],
        publishDate: content.metadata.publishedAt,
        author: content.metadata.author ? {
          name: content.metadata.author.name,
          email: content.metadata.author.email,
          bio: content.metadata.author.bio
        } : undefined,
        customFields: {}
      },

      seo: {
        metaTitle: content.metadata.title,
        metaDescription: content.metadata.metaDescription,
        canonical: content.metadata.seo.focusKeyword ? 
          `https://medium.com/@${content.metadata.author?.name || 'author'}/${content.metadata.slug}` : 
          undefined
      },

      featuredImage: content.content.featuredImage ? {
        id: content.content.featuredImage.url,
        filename: 'featured-image',
        url: content.content.featuredImage.url,
        mimeType: 'image/jpeg',
        size: 0,
        altText: content.content.featuredImage.alt,
        caption: content.content.featuredImage.caption
      } : undefined,

      format: ContentFormat.MARKDOWN,
      originalWordCount: content.metadata.seo.wordCount,
      adaptedWordCount: this.countWords(formattedContent),
      adaptationScore: this.calculateAdaptationScore(content, formattedContent)
    };
  }

  async publish(
    content: FormattedContent,
    options?: PublishOptions
  ): Promise<PublishResult> {
    try {
      if (!this.credentials) {
        throw new Error('Not authenticated');
      }

      // Validate content first
      const validation = await this.validateContent(content);
      this.throwIfValidationErrors(validation);

      // Get user ID first
      const userResponse = await this.makeRequest(
        `${this.mediumConfig.apiUrl}/me`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.credentials.data.accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      const userData = await userResponse.json();
      const userId = userData.data.id;

      // Prepare the post data
      const postData = {
        title: content.title,
        contentFormat: 'markdown',
        content: content.content,
        tags: content.metadata.tags || [],
        publishStatus: options?.status === 'draft' ? 'draft' : 'public',
        notifyFollowers: true,
        license: 'all-rights-reserved'
      };

      // Publish to Medium
      const response = await this.makeRequest(
        `${this.mediumConfig.apiUrl}/users/${userId}/posts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.credentials.data.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(postData)
        }
      );

      const result = await response.json();

      return {
        success: true,
        externalId: result.data.id,
        externalUrl: result.data.url,
        publishedAt: new Date(),
        platformResponse: result
      };

    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  }

  // Private helper methods
  private convertToMarkdown(content: string): string {
    // Basic HTML to Markdown conversion
    // This is a simplified version - you might want to use a proper library like turndown
    return content
      .replace(/<h1>(.*?)<\/h1>/g, '# $1')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1')
      .replace(/<h4>(.*?)<\/h4>/g, '#### $1')
      .replace(/<h5>(.*?)<\/h5>/g, '##### $1')
      .replace(/<h6>(.*?)<\/h6>/g, '###### $1')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<b>(.*?)<\/b>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<i>(.*?)<\/i>/g, '*$1*')
      .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')
      .replace(/<br\s*\/?>/g, '  \n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<[^>]*>/g, ''); // Remove remaining HTML tags
  }

  private truncateContent(content: string, targetWordCount: number): string {
    const words = content.split(/\s+/);
    if (words.length <= targetWordCount) {
      return content;
    }
    return words.slice(0, targetWordCount).join(' ') + '...';
  }

  private countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  private calculateAdaptationScore(originalContent: BlogPost, adaptedContent: string): number {
    const originalWordCount = originalContent.metadata.seo.wordCount;
    const adaptedWordCount = this.countWords(adaptedContent);
    
    // Simple scoring based on content preservation
    const wordCountRatio = Math.min(adaptedWordCount / originalWordCount, 1);
    return wordCountRatio * 0.8 + 0.2; // Base score of 0.2 plus up to 0.8 based on word preservation
  }
}
