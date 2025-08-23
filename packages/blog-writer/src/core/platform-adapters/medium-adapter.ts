
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

export interface MediumCredentials {
  type: 'integration_token';
  integrationToken: string;
}

export class MediumAdapter extends BasePlatformAdapter {
  public readonly name = 'medium';
  public readonly displayName = 'Medium';
  public readonly version = '1.0.0';
  
  public readonly capabilities: PlatformCapabilities = {
    maxContentLength: 200000, // Medium allows very long content
    maxTitleLength: 100,
    maxDescriptionLength: 300,
    maxTagsCount: 5, // Medium allows up to 5 tags
    
    // Media support
    supportsImages: true,
    supportsVideo: false, // Medium doesn't support direct video uploads
    supportsAudio: false,
    supportsGalleries: false,
    maxImageSize: 25 * 1024 * 1024, // 25MB
    supportedImageFormats: ['jpeg', 'jpg', 'png', 'gif'],
    
    // Publishing features
    supportsScheduling: false, // Medium doesn't support scheduling via API
    supportsDrafts: true,
    supportsUpdates: false, // Medium doesn't allow editing via API
    supportsDeleting: false, // Medium doesn't allow deletion via API
    supportsCategories: false,
    supportsTags: true,
    
    // Analytics
    supportsAnalytics: true, // Limited analytics available
    supportsRealTimeMetrics: false,
    supportsCustomEvents: false,
    
    // SEO and metadata
    supportsCustomMeta: false, // Medium controls most meta tags
    supportsOpenGraph: false, // Medium generates OG tags
    supportsTwitterCards: false, // Medium generates Twitter cards
    supportsSchema: false,
    supportsCanonical: true, // Can set canonical URL
    
    // Formatting
    supportedFormats: [
      ContentFormat.MARKDOWN,
      ContentFormat.HTML
    ],
    supportsMarkdown: true,
    supportsHTML: true,
    supportsRichText: false,
    supportsCustomCSS: false,
    
    // Social and engagement
    supportsComments: true, // Readers can comment
    supportsSharing: true, // Built into Medium
    supportsReactions: true, // Claps
    supportsSubscriptions: false, // No direct subscription control
    
    // Advanced features
    supportsA11y: false, // Limited control
    supportsMultiLanguage: false,
    supportsVersioning: false,
    supportsBulkOperations: false
  };
  
  private apiUrl: string;
  private integrationToken?: string;
  private userId?: string;
  
  constructor(config: MediumConfig = {}) {
    super(config);
    this.apiUrl = config.apiUrl || 'https://api.medium.com/v1';
  }
  
  // ===== AUTHENTICATION =====
  
  protected async performAuthentication(credentials: PlatformCredentials): Promise<AuthenticationResult> {
    const mediumCreds = credentials.data as MediumCredentials;
    
    if (!mediumCreds.integrationToken) {
      return {
        success: false,
        error: 'Integration token is required'
      };
    }
    
    this.integrationToken = mediumCreds.integrationToken;
    
    try {
      const user = await this.makeRequest('GET', 'me');
      this.userId = user.data.id;
      
      return {
        success: true,
        token: mediumCreds.integrationToken,
        userInfo: {
          id: user.data.id,
          name: user.data.name,
          email: user.data.username // Medium uses username, not email
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Authentication failed: ${error.message}`
      };
    }
  }
  
  protected async validateConnectionInternal(): Promise<ConnectionValidationResult> {
    if (!this.integrationToken) {
      return {
        isValid: false,
        isAuthenticated: false,
        capabilities: this.capabilities,
        error: 'No integration token provided'
      };
    }
    
    try {
      const user = await this.makeRequest('GET', 'me');
      
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
        error: error.message
      };
    }
  }
  
  // ===== CONTENT FORMATTING =====
  
  protected async formatContentInternal(content: BlogPost, options?: FormatOptions): Promise<FormattedContent> {
    // Medium uses Markdown format
    const formattedContent: FormattedContent = {
      title: content.title,
      content: this.formatContentForMedium(content.content, options),
      excerpt: content.excerpt,
      
      metadata: {
        tags: this.extractAndLimitTags(content.keywords || []),
        publishDate: content.publishedAt ? new Date(content.publishedAt) : undefined,
        status: this.mapPostStatus(content.status),
        visibility: 'public',
        author: {
          name: content.authorName || 'Unknown Author'
        }
      },
      
      seo: {
        canonical: options?.customMappings?.canonical as string
      },
      
      format: ContentFormat.MARKDOWN,
      originalWordCount: content.wordCount || 0,
      adaptedWordCount: 0,
      adaptationScore: 1.0
    };
    
    // Calculate adapted word count
    formattedContent.adaptedWordCount = this.countWords(formattedContent.content);
    
    return formattedContent;
  }
  
  private formatContentForMedium(content: string, options?: FormatOptions): string {
    let formatted = content;
    
    // Convert HTML to Markdown if needed
    if (content.includes('<') && content.includes('>')) {
      formatted = this.convertBasicHtmlToMarkdown(formatted);
    }
    
    // Medium-specific formatting
    formatted = this.applyMediumFormatting(formatted);
    
    return formatted;
  }
  
  private convertBasicHtmlToMarkdown(html: string): string {
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1')
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
  
  private applyMediumFormatting(content: string): string {
    // Medium-specific enhancements
    let formatted = content;
    
    // Ensure proper spacing around headings
    formatted = formatted.replace(/^(#{1,6})\s*(.+)$/gm, '$1 $2\n');
    
    // Clean up excessive whitespace
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    return formatted.trim();
  }
  
  private extractAndLimitTags(keywords: string[]): string[] {
    // Medium allows up to 5 tags
    return keywords.slice(0, 5).map(tag => 
      tag.toLowerCase().replace(/[^a-z0-9]/g, '')
    ).filter(tag => tag.length > 0);
  }
  
  // ===== PUBLISHING =====
  
  protected async publishContentInternal(content: FormattedContent, options?: PublishOptions): Promise<PublishResult> {
    if (!this.userId) {
      throw new Error('User ID not available - authentication may have failed');
    }
    
    const postData = this.buildMediumPostData(content, options);
    
    try {
      const response = await this.makeRequest('POST', `users/${this.userId}/posts`, postData);
      
      return {
        success: true,
        externalId: response.data.id,
        externalUrl: response.data.url,
        publishedAt: new Date(response.data.publishedAt),
        platformResponse: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: `Publishing failed: ${error.message}`
      };
    }
  }
  
  protected async scheduleContentInternal(content: FormattedContent, publishTime: Date, options?: PublishOptions): Promise<ScheduleResult> {
    // Medium doesn't support scheduling via API
    throw new Error('Medium does not support scheduled publishing via API');
  }
  
  // ===== ANALYTICS =====
  
  protected async getAnalyticsInternal(timeRange: DateRange, options?: AnalyticsOptions): Promise<PlatformAnalytics> {
    // Medium provides limited analytics through their API
    // This would require additional implementation based on Medium's stats API
    
    return {
      platformName: this.name,
      timeRange,
      pageViews: 0, // Would need to fetch from Medium's stats
      uniqueVisitors: 0,
      sessions: 0,
      bounceRate: 0,
      avgSessionDuration: 0,
      totalEngagements: 0, // Claps, highlights, etc.
      engagementRate: 0,
      shares: 0,
      comments: 0,
      likes: 0, // Claps in Medium terminology
      conversions: 0,
      conversionRate: 0,
      topContent: [],
      contentBreakdown: [],
      audienceInsights: {
        totalAudience: 0,
        newVsReturning: { new: 0, returning: 0 }
      },
      platformSpecificMetrics: {
        claps: 0,
        highlights: 0,
        followers_gained: 0,
        note: 'Medium analytics require additional API endpoints that may not be publicly available'
      }
    };
  }
  
  public async getContentAnalytics(externalId: string, timeRange: DateRange): Promise<ContentAnalytics> {
    // Medium's API has limited analytics endpoints
    return {
      contentId: externalId,
      externalId,
      title: 'Unknown', // Would need to fetch post details
      views: 0,
      uniqueViews: 0,
      engagements: 0,
      shares: 0,
      comments: 0,
      publishedAt: new Date(),
      engagementOverTime: [],
      topReferrers: [],
      socialShares: []
    };
  }
  
  // ===== RATE LIMITING =====
  
  public async getRateLimit(): Promise<RateLimitStatus> {
    // Medium has rate limits but they're not clearly documented
    // Return conservative estimates
    return {
      limit: 1000,
      remaining: 950,
      resetTime: new Date(Date.now() + 3600000) // 1 hour from now
    };
  }
  
  // ===== VALIDATION =====
  
  protected async validatePlatformSpecificConstraints(
    content: FormattedContent, 
    errors: ValidationError[], 
    warnings: ValidationError[], 
    suggestions: any[]
  ): Promise<void> {
    // Medium-specific validation
    
    // Check tag limit
    if (content.metadata.tags && content.metadata.tags.length > 5) {
      warnings.push({
        field: 'tags',
        message: 'Medium allows maximum 5 tags. Extra tags will be ignored.',
        code: 'TAG_LIMIT',
        severity: 'warning'
      });
    }
    
    // Check for unsupported features
    if (content.gallery && content.gallery.length > 0) {
      warnings.push({
        field: 'gallery',
        message: 'Medium does not support image galleries. Only featured image will be used.',
        code: 'UNSUPPORTED_FEATURE',
        severity: 'warning'
      });
    }
    
    // Check content format
    if (content.format !== ContentFormat.MARKDOWN && content.format !== ContentFormat.HTML) {
      errors.push({
        field: 'format',
        message: 'Medium only supports Markdown and HTML formats',
        code: 'UNSUPPORTED_FORMAT',
        severity: 'error'
      });
    }
  }
  
  // ===== PRIVATE HELPER METHODS =====
  
  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const url = `${this.apiUrl}/${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'AI-Blog-Writer-SDK/1.0'
    };
    
    if (this.integrationToken) {
      headers.Authorization = `Bearer ${this.integrationToken}`;
    }
    
    const config: RequestInit = {
      method,
      headers
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
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0].message;
        }
      } catch {
        // Use default error message
      }
      
      throw new Error(errorMessage);
    }
    
    return response.json();
  }
  
  private buildMediumPostData(content: FormattedContent, options?: PublishOptions): any {
    const postData: any = {
      title: content.title,
      contentFormat: 'markdown',
      content: content.content,
      publishStatus: options?.status === 'draft' ? 'draft' : 'public'
    };
    
    // Add tags
    if (content.metadata.tags && content.metadata.tags.length > 0) {
      postData.tags = content.metadata.tags.slice(0, 5); // Limit to 5 tags
    }
    
    // Add canonical URL
    if (content.seo.canonical) {
      postData.canonicalUrl = content.seo.canonical;
    }
    
    // Add license (Medium supports different licenses)
    postData.license = 'all-rights-reserved'; // Default, could be configurable
    
    return postData;
  }
  
  private mapPostStatus(status: string): 'draft' | 'published' | 'private' | 'unlisted' {
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
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
}

// Register the adapter
import { platformRegistry } from '../base-platform-adapter';
platformRegistry.register('medium', MediumAdapter);
