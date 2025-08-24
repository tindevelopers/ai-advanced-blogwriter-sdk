/**
 * LinkedIn Platform Adapter
 * Supports LinkedIn articles and posts via LinkedIn API
 */

import {
  BasePlatformAdapter,
  type PlatformAdapterConfig,
} from '../base-platform-adapter';
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
  ValidationError,
} from '../../types/platform-integration';
import type { BlogPost } from '../../types/blog-post';

export interface LinkedInConfig extends PlatformAdapterConfig {
  apiUrl?: string; // Default: 'https://api.linkedin.com/v2'
  contentType?: 'article' | 'post'; // Default: 'article'
}

export interface LinkedInCredentials {
  type: 'oauth2';
  accessToken: string;
  personUrn?: string; // LinkedIn person URN
}

export class LinkedInAdapter extends BasePlatformAdapter {
  public readonly name = 'linkedin';
  public readonly displayName = 'LinkedIn';
  public readonly version = '1.0.0';

  public readonly capabilities: PlatformCapabilities = {
    maxContentLength: 125000, // LinkedIn article limit
    maxTitleLength: 150,
    maxDescriptionLength: 200,
    maxTagsCount: 3, // LinkedIn allows few tags

    // Media support
    supportsImages: true,
    supportsVideo: true,
    supportsAudio: false,
    supportsGalleries: false,
    maxImageSize: 5 * 1024 * 1024, // 5MB
    supportedImageFormats: ['jpeg', 'jpg', 'png', 'gif'],

    // Publishing features
    supportsScheduling: false, // LinkedIn API doesn't support scheduling
    supportsDrafts: false, // Limited draft support
    supportsUpdates: false, // LinkedIn doesn't allow editing published content
    supportsDeleting: true, // Can delete posts/articles
    supportsCategories: false,
    supportsTags: false, // LinkedIn uses different tagging system

    // Analytics
    supportsAnalytics: true,
    supportsRealTimeMetrics: false,
    supportsCustomEvents: false,

    // SEO and metadata
    supportsCustomMeta: false,
    supportsOpenGraph: false, // LinkedIn generates its own
    supportsTwitterCards: false,
    supportsSchema: false,
    supportsCanonical: false,

    // Formatting
    supportedFormats: [ContentFormat.HTML, ContentFormat.PLAIN_TEXT],
    supportsMarkdown: false,
    supportsHTML: true,
    supportsRichText: true,
    supportsCustomCSS: false,

    // Social and engagement
    supportsComments: true,
    supportsSharing: true,
    supportsReactions: true, // LinkedIn reactions
    supportsSubscriptions: false,

    // Advanced features
    supportsA11y: false,
    supportsMultiLanguage: false,
    supportsVersioning: false,
    supportsBulkOperations: false,
  };

  private apiUrl: string;
  private accessToken?: string;
  private personUrn?: string;
  private contentType: 'article' | 'post';

  constructor(config: LinkedInConfig = {}) {
    super(config);
    this.apiUrl = config.apiUrl || 'https://api.linkedin.com/v2';
    this.contentType = config.contentType || 'article';
  }

  // ===== AUTHENTICATION =====

  protected async performAuthentication(
    credentials: PlatformCredentials,
  ): Promise<AuthenticationResult> {
    const linkedInCreds = credentials.data as LinkedInCredentials;

    if (!linkedInCreds.accessToken) {
      return {
        success: false,
        error: 'Access token is required',
      };
    }

    this.accessToken = linkedInCreds.accessToken;
    this.personUrn = linkedInCreds.personUrn;

    try {
      // Get user profile to verify token
      const profile = await this.makeRequest(
        'GET',
        'people/~:(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))',
      );

      if (!this.personUrn) {
        this.personUrn = `urn:li:person:${profile.id}`;
      }

      return {
        success: true,
        token: linkedInCreds.accessToken,
        userInfo: {
          id: profile.id,
          name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Authentication failed: ${error.message}`,
      };
    }
  }

  protected async validateConnectionInternal(): Promise<ConnectionValidationResult> {
    if (!this.accessToken) {
      return {
        isValid: false,
        isAuthenticated: false,
        capabilities: this.capabilities,
        error: 'No access token provided',
      };
    }

    try {
      await this.makeRequest('GET', 'people/~:(id)');

      return {
        isValid: true,
        isAuthenticated: true,
        capabilities: this.capabilities,
      };
    } catch (error) {
      return {
        isValid: false,
        isAuthenticated: false,
        capabilities: this.capabilities,
        error: error.message,
      };
    }
  }

  // ===== CONTENT FORMATTING =====

  protected async formatContentInternal(
    content: BlogPost,
    options?: FormatOptions,
  ): Promise<FormattedContent> {
    // LinkedIn formatting depends on content type (article vs post)
    const isArticle = this.contentType === 'article';
    const maxLength = isArticle ? this.capabilities.maxContentLength : 3000; // Posts have shorter limit

    let formattedContent: FormattedContent = {
      title: content.title,
      content: this.formatContentForLinkedIn(
        content.content,
        isArticle,
        maxLength,
      ),

      metadata: {
        publishDate: content.publishedAt
          ? new Date(content.publishedAt)
          : undefined,
        status: this.mapPostStatus(content.status),
        visibility: 'public',
        author: {
          name: content.authorName || 'Unknown Author',
        },
      },

      seo: {},

      format: ContentFormat.HTML,
      originalWordCount: content.wordCount || 0,
      adaptedWordCount: 0,
      adaptationScore: 1.0,

      platformSpecific: {
        contentType: this.contentType,
        isArticle,
      },
    };

    // For posts, create a shorter excerpt-style content
    if (!isArticle) {
      formattedContent.content = this.createLinkedInPost(content);
    }

    // Calculate adapted word count
    formattedContent.adaptedWordCount = this.countWords(
      formattedContent.content,
    );

    return formattedContent;
  }

  private formatContentForLinkedIn(
    content: string,
    isArticle: boolean,
    maxLength: number,
  ): string {
    if (!isArticle) {
      // For posts, create a concise version
      return this.createPostContent(content, 3000);
    }

    // For articles, preserve most of the content but clean it up
    let formatted = content;

    // Convert markdown to basic HTML if needed
    if (!content.includes('<') || !content.includes('>')) {
      formatted = this.convertMarkdownToHtml(formatted);
    }

    // Clean up HTML for LinkedIn
    formatted = this.cleanHtmlForLinkedIn(formatted);

    // Ensure length limits
    if (formatted.length > maxLength) {
      formatted = this.truncateContent(formatted, maxLength);
    }

    return formatted;
  }

  private createLinkedInPost(content: BlogPost): string {
    // Create an engaging LinkedIn post from the blog content
    let postContent = '';

    // Start with a hook
    postContent += this.createHook(content.title);
    postContent += '\n\n';

    // Add key insights (bullet points)
    const insights = this.extractKeyInsights(content.content);
    if (insights.length > 0) {
      postContent += insights
        .slice(0, 3)
        .map(insight => `• ${insight}`)
        .join('\n');
      postContent += '\n\n';
    }

    // Add call to action
    postContent += this.createCallToAction(content);

    // Add hashtags if available
    if (content.keywords && content.keywords.length > 0) {
      postContent += '\n\n';
      postContent += content.keywords
        .slice(0, 3)
        .map(keyword => `#${keyword.replace(/\s+/g, '').toLowerCase()}`)
        .join(' ');
    }

    return postContent;
  }

  private createHook(title: string): string {
    // Create an engaging opening line
    const hooks = [
      `Here's what I learned about ${title.toLowerCase()}:`,
      `${title} - and why it matters:`,
      `The truth about ${title.toLowerCase()}:`,
      `What everyone gets wrong about ${title.toLowerCase()}:`,
    ];

    return hooks[Math.floor(Math.random() * hooks.length)];
  }

  private extractKeyInsights(content: string): string[] {
    // Extract key points from content
    const insights: string[] = [];

    // Remove HTML tags for analysis
    const plainText = content.replace(/<[^>]*>/g, '');

    // Split into sentences and look for key indicators
    const sentences = plainText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    // Look for sentences with key phrases
    const keyPhrases = [
      /(?:key|important|crucial|essential|vital)\s+(?:is|are|point|factor)/i,
      /(?:remember|note|consider)\s+that/i,
      /(?:the\s+)?(?:main|primary|key)\s+(?:benefit|advantage|reason)/i,
      /(?:this\s+)?(?:means|shows|proves|demonstrates)/i,
      /(?:you\s+)?(?:should|must|need\s+to|have\s+to)/i,
    ];

    for (const sentence of sentences) {
      for (const phrase of keyPhrases) {
        if (phrase.test(sentence) && sentence.length <= 120) {
          insights.push(sentence);
          break;
        }
      }

      if (insights.length >= 5) break;
    }

    return insights;
  }

  private createCallToAction(content: BlogPost): string {
    const ctas = [
      'What are your thoughts on this?',
      'Have you experienced something similar?',
      'What would you add to this list?',
      'Share your experience in the comments!',
      "What's your take on this approach?",
    ];

    return ctas[Math.floor(Math.random() * ctas.length)];
  }

  private createPostContent(content: string, maxLength: number): string {
    // Create a post-style content from article
    const plainText = content.replace(/<[^>]*>/g, '');
    const sentences = plainText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let postContent = '';
    for (const sentence of sentences) {
      if (postContent.length + sentence.length + 2 > maxLength - 100) {
        // Leave room for CTA
        break;
      }
      postContent += sentence + '. ';
    }

    postContent = postContent.trim();
    if (postContent.length < maxLength - 50) {
      postContent +=
        '\n\n' + this.createCallToAction({ title: 'this topic' } as BlogPost);
    }

    return postContent;
  }

  private convertMarkdownToHtml(markdown: string): string {
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^\)]+)\)/gim, '<img src="$2" alt="$1" />')
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2">$1</a>');
  }

  private cleanHtmlForLinkedIn(html: string): string {
    // LinkedIn supports limited HTML tags
    const allowedTags = [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'a',
      'h1',
      'h2',
      'h3',
      'ul',
      'ol',
      'li',
    ];

    // Remove unsupported tags but keep content
    let cleaned = html.replace(
      /<(?!\/?(?:p|br|strong|b|em|i|u|a|h[1-3]|ul|ol|li)\b)[^>]*>/gi,
      '',
    );

    // Clean up whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  // ===== PUBLISHING =====

  protected async publishContentInternal(
    content: FormattedContent,
    options?: PublishOptions,
  ): Promise<PublishResult> {
    if (!this.personUrn) {
      throw new Error(
        'Person URN not available - authentication may have failed',
      );
    }

    const isArticle =
      content.platformSpecific?.isArticle || this.contentType === 'article';

    try {
      if (isArticle) {
        return await this.publishArticle(content, options);
      } else {
        return await this.publishPost(content, options);
      }
    } catch (error) {
      return {
        success: false,
        error: `Publishing failed: ${error.message}`,
      };
    }
  }

  private async publishArticle(
    content: FormattedContent,
    options?: PublishOptions,
  ): Promise<PublishResult> {
    const articleData = {
      author: this.personUrn,
      lifecycleState: options?.status === 'draft' ? 'DRAFT' : 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content.title,
          },
          shareMediaCategory: 'ARTICLE',
          media: [
            {
              status: 'READY',
              description: {
                text: content.excerpt || '',
              },
              media: content.featuredImage?.url,
              originalUrl: content.seo.canonical || '',
              title: {
                text: content.title,
              },
            },
          ],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await this.makeRequest('POST', 'ugcPosts', articleData);

    return {
      success: true,
      externalId: this.extractIdFromUrn(response.id),
      externalUrl: '', // LinkedIn doesn't return direct URL
      publishedAt: new Date(),
      platformResponse: response,
    };
  }

  private async publishPost(
    content: FormattedContent,
    options?: PublishOptions,
  ): Promise<PublishResult> {
    const postData = {
      author: this.personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content.content,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    // Add media if available
    if (content.featuredImage) {
      postData.specificContent[
        'com.linkedin.ugc.ShareContent'
      ].shareMediaCategory = 'IMAGE';
      postData.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY',
          description: {
            text: content.featuredImage.altText || '',
          },
          media: content.featuredImage.url,
          title: {
            text: content.title,
          },
        },
      ];
    }

    const response = await this.makeRequest('POST', 'ugcPosts', postData);

    return {
      success: true,
      externalId: this.extractIdFromUrn(response.id),
      externalUrl: '', // LinkedIn doesn't return direct URL
      publishedAt: new Date(),
      platformResponse: response,
    };
  }

  protected async scheduleContentInternal(
    content: FormattedContent,
    publishTime: Date,
    options?: PublishOptions,
  ): Promise<ScheduleResult> {
    throw new Error('LinkedIn does not support scheduled publishing via API');
  }

  public async delete(externalId: string): Promise<DeleteResult> {
    this.ensureAuthenticated();

    try {
      await this.makeRequest('DELETE', `ugcPosts/${externalId}`);

      return {
        success: true,
        deletedAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Deletion failed: ${error.message}`,
      };
    }
  }

  // ===== ANALYTICS =====

  protected async getAnalyticsInternal(
    timeRange: DateRange,
    options?: AnalyticsOptions,
  ): Promise<PlatformAnalytics> {
    // LinkedIn provides analytics through the Social Actions API
    // This is a simplified implementation

    return {
      platformName: this.name,
      timeRange,
      pageViews: 0,
      uniqueVisitors: 0,
      sessions: 0,
      bounceRate: 0,
      avgSessionDuration: 0,
      totalEngagements: 0,
      engagementRate: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      conversions: 0,
      conversionRate: 0,
      topContent: [],
      contentBreakdown: [],
      audienceInsights: {
        totalAudience: 0,
        newVsReturning: { new: 0, returning: 0 },
      },
      platformSpecificMetrics: {
        impressions: 0,
        clicks: 0,
        reactions: 0,
        followerGain: 0,
        note: 'LinkedIn analytics require additional API endpoints and may have limited availability',
      },
    };
  }

  // ===== VALIDATION =====

  protected async validatePlatformSpecificConstraints(
    content: FormattedContent,
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: any[],
  ): Promise<void> {
    const isArticle = content.platformSpecific?.isArticle;

    // Content length validation based on type
    const maxLength = isArticle ? 125000 : 3000;
    if (content.content.length > maxLength) {
      errors.push({
        field: 'content',
        message: `Content exceeds LinkedIn ${isArticle ? 'article' : 'post'} limit of ${maxLength} characters`,
        code: 'MAX_LENGTH',
        severity: 'error',
      });
    }

    // LinkedIn-specific content guidelines
    if (!isArticle && content.content.length < 50) {
      warnings.push({
        field: 'content',
        message: 'LinkedIn posts perform better with at least 50 characters',
        code: 'MIN_LENGTH',
        severity: 'warning',
      });
    }

    // Check for engagement elements
    if (!isArticle && !this.hasEngagementElements(content.content)) {
      suggestions.push({
        field: 'content',
        suggestion:
          'Consider adding a question or call-to-action to increase engagement',
        impact: 'medium',
      });
    }
  }

  private hasEngagementElements(content: string): boolean {
    const engagementPatterns = [
      /\?/,
      /what do you think/i,
      /share your/i,
      /comment/i,
      /thoughts/i,
      /experience/i,
    ];

    return engagementPatterns.some(pattern => pattern.test(content));
  }

  // ===== HELPER METHODS =====

  private async makeRequest(
    method: string,
    endpoint: string,
    data?: any,
  ): Promise<any> {
    const url = `${this.apiUrl}/${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'User-Agent': 'AI-Blog-Writer-SDK/1.0',
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Use default error message
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  private extractIdFromUrn(urn: string): string {
    // Extract ID from LinkedIn URN format
    const parts = urn.split(':');
    return parts[parts.length - 1];
  }

  private mapPostStatus(
    status: string,
  ): 'draft' | 'published' | 'private' | 'unlisted' {
    switch (status.toLowerCase()) {
      case 'draft':
      case 'pending_review':
      case 'in_review':
        return 'draft';
      case 'published':
        return 'published';
      default:
        return 'draft';
    }
  }

  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  public async getRateLimit(): Promise<RateLimitStatus> {
    // LinkedIn has rate limits that vary by API endpoint
    return {
      limit: 500,
      remaining: 450,
      resetTime: new Date(Date.now() + 3600000), // 1 hour from now
    };
  }
}

// Register the adapter
import { platformRegistry } from '../base-platform-adapter';
platformRegistry.register('linkedin', LinkedInAdapter);
