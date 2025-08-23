
/**
 * WordPress Platform Adapter
 * Supports WordPress.com and self-hosted WordPress with REST API
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
  DeleteResult,
  PlatformAnalytics,
  ContentAnalytics,
  RateLimitStatus,
  FormatOptions,
  PublishOptions,
  AnalyticsOptions,
  DateRange,
  Category,
  Tag,
  CustomField,
  ValidationError,
  MediaFile
} from '../../types/platform-integration';
import type { BlogPost } from '../../types/blog-post';

export interface WordPressConfig extends PlatformAdapterConfig {
  siteUrl?: string; // For self-hosted WordPress
  apiVersion?: string; // Default: 'wp/v2'
  isWordPressCom?: boolean; // true for WordPress.com
}

export interface WordPressCredentials {
  type: 'api_key' | 'oauth2' | 'application_password';
  username?: string;
  password?: string; // Application password
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  siteUrl?: string;
}

export class WordPressAdapter extends BasePlatformAdapter {
  public readonly name = 'wordpress';
  public readonly displayName = 'WordPress';
  public readonly version = '1.0.0';
  
  public readonly capabilities: PlatformCapabilities = {
    maxContentLength: 65535, // WordPress post_content limit
    maxTitleLength: 255,
    maxDescriptionLength: 320, // Meta description best practice
    maxTagsCount: 50,
    
    // Media support
    supportsImages: true,
    supportsVideo: true,
    supportsAudio: true,
    supportsGalleries: true,
    maxImageSize: 10 * 1024 * 1024, // 10MB default
    supportedImageFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg'],
    
    // Publishing features
    supportsScheduling: true,
    supportsDrafts: true,
    supportsUpdates: true,
    supportsDeleting: true,
    supportsCategories: true,
    supportsTags: true,
    
    // Analytics (limited without plugins)
    supportsAnalytics: false, // Native WP doesn't provide analytics
    supportsRealTimeMetrics: false,
    supportsCustomEvents: false,
    
    // SEO and metadata
    supportsCustomMeta: true,
    supportsOpenGraph: true, // With plugins like Yoast
    supportsTwitterCards: true,
    supportsSchema: true,
    supportsCanonical: true,
    
    // Formatting
    supportedFormats: [
      ContentFormat.HTML,
      ContentFormat.RICH_TEXT,
      ContentFormat.MARKDOWN // With plugins
    ],
    supportsMarkdown: false, // Requires plugin
    supportsHTML: true,
    supportsRichText: true,
    supportsCustomCSS: true, // With appropriate permissions
    
    // Social and engagement
    supportsComments: true,
    supportsSharing: true, // With plugins
    supportsReactions: false, // Requires plugins
    supportsSubscriptions: true, // With plugins
    
    // Advanced features
    supportsA11y: true,
    supportsMultiLanguage: true, // With plugins like WPML
    supportsVersioning: true, // WordPress revisions
    supportsBulkOperations: false // Not natively supported
  };
  
  private baseUrl: string;
  private apiUrl: string;
  private authHeader?: string;
  
  constructor(config: WordPressConfig = {}) {
    super(config);
    
    const wpConfig = config as WordPressConfig;
    this.baseUrl = wpConfig.siteUrl || '';
    
    if (wpConfig.isWordPressCom) {
      this.apiUrl = `https://public-api.wordpress.com/wp/v2/sites/${this.getSiteId()}/`;
    } else {
      const apiVersion = wpConfig.apiVersion || 'wp/v2';
      this.apiUrl = `${this.baseUrl}/wp-json/${apiVersion}/`;
    }
  }
  
  // ===== AUTHENTICATION =====
  
  protected async performAuthentication(credentials: PlatformCredentials): Promise<AuthenticationResult> {
    const wpCreds = credentials.data as WordPressCredentials;
    
    if (wpCreds.type === 'application_password') {
      return this.authenticateWithApplicationPassword(wpCreds);
    } else if (wpCreds.type === 'oauth2') {
      return this.authenticateWithOAuth2(wpCreds);
    } else {
      throw new Error('Unsupported authentication type for WordPress');
    }
  }
  
  private async authenticateWithApplicationPassword(creds: WordPressCredentials): Promise<AuthenticationResult> {
    if (!creds.username || !creds.password) {
      return {
        success: false,
        error: 'Username and application password are required'
      };
    }
    
    const auth = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
    this.authHeader = `Basic ${auth}`;
    
    // Test authentication by fetching user info
    try {
      const response = await this.makeRequest('GET', 'users/me');
      
      if (response.id) {
        return {
          success: true,
          userInfo: {
            id: response.id.toString(),
            name: response.name,
            email: response.email
          }
        };
      } else {
        return {
          success: false,
          error: 'Authentication failed - invalid credentials'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Authentication failed: ${error.message}`
      };
    }
  }
  
  private async authenticateWithOAuth2(creds: WordPressCredentials): Promise<AuthenticationResult> {
    if (!creds.accessToken) {
      return {
        success: false,
        error: 'Access token is required for OAuth2 authentication'
      };
    }
    
    this.authHeader = `Bearer ${creds.accessToken}`;
    
    try {
      const response = await this.makeRequest('GET', 'users/me');
      
      return {
        success: true,
        token: creds.accessToken,
        userInfo: {
          id: response.id.toString(),
          name: response.name,
          email: response.email
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `OAuth2 authentication failed: ${error.message}`
      };
    }
  }
  
  protected async validateConnectionInternal(): Promise<ConnectionValidationResult> {
    try {
      const response = await this.makeRequest('GET', 'users/me');
      
      if (response.id) {
        return {
          isValid: true,
          isAuthenticated: true,
          capabilities: this.capabilities
        };
      } else {
        return {
          isValid: false,
          isAuthenticated: false,
          capabilities: this.capabilities,
          error: 'Invalid connection'
        };
      }
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
    // Convert blog post to WordPress format
    const formattedContent: FormattedContent = {
      title: content.title,
      content: this.formatContentBody(content.content, options),
      excerpt: content.excerpt || this.generateExcerpt(content.content),
      
      metadata: {
        slug: content.slug,
        description: content.metaDescription,
        keywords: content.keywords || [],
        tags: [], // Will be populated from content.keywords if needed
        categories: content.category ? [content.category] : [],
        publishDate: content.publishedAt ? new Date(content.publishedAt) : undefined,
        status: this.mapPostStatus(content.status),
        visibility: 'public',
        author: {
          name: content.authorName || 'Unknown Author',
          email: content.authorEmail
        }
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
        canonical: options?.customMappings?.canonical as string
      },
      
      featuredImage: content.featuredImageUrl ? {
        filename: this.extractFilenameFromUrl(content.featuredImageUrl),
        url: content.featuredImageUrl,
        mimeType: this.guessMimeTypeFromUrl(content.featuredImageUrl),
        size: 0, // Unknown without fetching
        altText: content.featuredImageAlt
      } : undefined,
      
      format: ContentFormat.HTML,
      originalWordCount: content.wordCount || 0,
      adaptedWordCount: 0, // Will be calculated
      adaptationScore: 1.0 // Start with perfect score
    };
    
    // Calculate adapted word count
    formattedContent.adaptedWordCount = this.countWords(formattedContent.content);
    
    return formattedContent;
  }
  
  private formatContentBody(content: string, options?: FormatOptions): string {
    let formatted = content;
    
    // Convert markdown to HTML if needed
    if (options?.preserveFormatting === false) {
      // Basic markdown to HTML conversion
      formatted = this.convertBasicMarkdownToHtml(formatted);
    }
    
    // Apply WordPress-specific formatting
    formatted = this.applyWordPressFormatting(formatted);
    
    return formatted;
  }
  
  private convertBasicMarkdownToHtml(content: string): string {
    // Basic markdown conversions
    return content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^\)]+)\)/gim, '<img src="$2" alt="$1" />')
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2">$1</a>');
  }
  
  private applyWordPressFormatting(content: string): string {
    // WordPress-specific content formatting
    // Add WordPress blocks if needed
    if (content.includes('<!-- wp:')) {
      return content; // Already in block format
    }
    
    // Wrap in paragraph blocks for Gutenberg
    const paragraphs = content.split(/\n\s*\n/);
    return paragraphs
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => {
        if (p.startsWith('<h') || p.startsWith('<img') || p.startsWith('<div')) {
          return p; // Already formatted
        }
        return `<p>${p}</p>`;
      })
      .join('\n\n');
  }
  
  // ===== PUBLISHING =====
  
  protected async publishContentInternal(content: FormattedContent, options?: PublishOptions): Promise<PublishResult> {
    const postData = this.buildWordPressPostData(content, options);
    
    try {
      const response = await this.makeRequest('POST', 'posts', postData);
      
      return {
        success: true,
        externalId: response.id.toString(),
        externalUrl: response.link,
        publishedAt: new Date(response.date),
        platformResponse: response
      };
    } catch (error) {
      return {
        success: false,
        error: `Publishing failed: ${error.message}`
      };
    }
  }
  
  protected async scheduleContentInternal(content: FormattedContent, publishTime: Date, options?: PublishOptions): Promise<ScheduleResult> {
    const postData = this.buildWordPressPostData(content, options);
    postData.status = 'future';
    postData.date = publishTime.toISOString();
    
    try {
      const response = await this.makeRequest('POST', 'posts', postData);
      
      return {
        success: true,
        scheduleId: response.id.toString(),
        scheduledTime: new Date(response.date),
        platformResponse: response
      };
    } catch (error) {
      return {
        success: false,
        scheduledTime: publishTime,
        error: `Scheduling failed: ${error.message}`
      };
    }
  }
  
  public async update(externalId: string, content: FormattedContent, options?: PublishOptions): Promise<PublishResult> {
    this.ensureAuthenticated();
    
    const postData = this.buildWordPressPostData(content, options);
    
    try {
      const response = await this.makeRequest('PUT', `posts/${externalId}`, postData);
      
      return {
        success: true,
        externalId: response.id.toString(),
        externalUrl: response.link,
        publishedAt: new Date(response.modified),
        platformResponse: response
      };
    } catch (error) {
      return {
        success: false,
        error: `Update failed: ${error.message}`
      };
    }
  }
  
  public async delete(externalId: string): Promise<DeleteResult> {
    this.ensureAuthenticated();
    
    try {
      const response = await this.makeRequest('DELETE', `posts/${externalId}?force=true`);
      
      return {
        success: true,
        deletedAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: `Deletion failed: ${error.message}`
      };
    }
  }
  
  // ===== ANALYTICS (Limited Support) =====
  
  protected async getAnalyticsInternal(timeRange: DateRange, options?: AnalyticsOptions): Promise<PlatformAnalytics> {
    // WordPress doesn't provide native analytics, return basic structure
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
        newVsReturning: { new: 0, returning: 0 }
      },
      platformSpecificMetrics: {
        note: 'WordPress does not provide native analytics. Consider integrating with Google Analytics or similar services.'
      }
    };
  }
  
  // ===== PLATFORM-SPECIFIC OPERATIONS =====
  
  public async getCategories(): Promise<Category[]> {
    this.ensureAuthenticated();
    
    try {
      const response = await this.makeRequest('GET', 'categories');
      
      return response.map((cat: any) => ({
        id: cat.id.toString(),
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parent ? cat.parent.toString() : undefined
      }));
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }
  
  public async getTags(): Promise<Tag[]> {
    this.ensureAuthenticated();
    
    try {
      const response = await this.makeRequest('GET', 'tags');
      
      return response.map((tag: any) => ({
        id: tag.id.toString(),
        name: tag.name,
        slug: tag.slug,
        count: tag.count
      }));
    } catch (error) {
      throw new Error(`Failed to fetch tags: ${error.message}`);
    }
  }
  
  public async getCustomFields(): Promise<CustomField[]> {
    // WordPress custom fields would require additional plugins/configuration
    return [];
  }
  
  // ===== RATE LIMITING =====
  
  public async getRateLimit(): Promise<RateLimitStatus> {
    // WordPress doesn't typically have strict rate limits for authenticated users
    // But some hosting providers may implement them
    return {
      limit: 1000,
      remaining: 1000,
      resetTime: new Date(Date.now() + 3600000) // 1 hour from now
    };
  }
  
  // ===== PRIVATE HELPER METHODS =====
  
  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const url = `${this.apiUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AI-Blog-Writer-SDK/1.0'
    };
    
    if (this.authHeader) {
      headers.Authorization = this.authHeader;
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
  
  private buildWordPressPostData(content: FormattedContent, options?: PublishOptions): any {
    const postData: any = {
      title: content.title,
      content: content.content,
      excerpt: content.excerpt,
      status: options?.status || 'publish'
    };
    
    // Add slug if provided
    if (content.metadata.slug) {
      postData.slug = content.metadata.slug;
    }
    
    // Add categories
    if (options?.categories && options.categories.length > 0) {
      postData.categories = options.categories.map(cat => parseInt(cat, 10)).filter(id => !isNaN(id));
    }
    
    // Add tags
    if (options?.tags && options.tags.length > 0) {
      postData.tags = options.tags.map(tag => parseInt(tag, 10)).filter(id => !isNaN(id));
    }
    
    // Add featured image
    if (options?.featuredImage || content.featuredImage) {
      // Would need to upload image first and get media ID
      // This is a simplified version
      postData.featured_media = null;
    }
    
    // Add meta data
    if (content.seo.metaDescription) {
      postData.meta = postData.meta || {};
      postData.meta._yoast_wpseo_metadesc = content.seo.metaDescription;
    }
    
    if (content.seo.focusKeyword) {
      postData.meta = postData.meta || {};
      postData.meta._yoast_wpseo_focuskw = content.seo.focusKeyword;
    }
    
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
      case 'private':
        return 'private';
      default:
        return 'draft';
    }
  }
  
  private generateExcerpt(content: string, maxLength: number = 150): string {
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;
    
    return plainText.substring(0, maxLength).trim() + '...';
  }
  
  private extractFilenameFromUrl(url: string): string {
    return url.split('/').pop() || 'image';
  }
  
  private guessMimeTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml'
    };
    
    return mimeTypes[extension || ''] || 'image/jpeg';
  }
  
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }
  
  private getSiteId(): string {
    // For WordPress.com, extract site ID from URL or credentials
    // This is a simplified implementation
    return this.baseUrl.replace(/https?:\/\//, '').replace(/\/$/, '');
  }
}

// Register the adapter
import { platformRegistry } from '../base-platform-adapter';
platformRegistry.register('wordpress', WordPressAdapter);
