
/**
 * Base Platform Adapter
 * Provides common functionality and patterns for all platform adapters
 */

import type {
  PlatformAdapter,
  PlatformCapabilities,
  PlatformCredentials,
  AuthenticationResult,
  ConnectionValidationResult,
  FormattedContent,
  ValidationResult,
  PublishResult,
  ScheduleResult,
  DeleteResult,
  BulkPublishResult,
  PlatformAnalytics,
  ContentAnalytics,
  HealthCheckResult,
  RateLimitStatus,
  QuotaStatus,
  FormatOptions,
  PublishOptions,
  BulkPublishOptions,
  AnalyticsOptions,
  DateRange,
  Category,
  Tag,
  CustomField,
  AuthenticationError,
  RateLimitError,
  ContentValidationError,
  PublishingError,
  ValidationError
} from '../types/platform-integration';
import type { BlogPost } from '../types/blog-post';

/**
 * Abstract base class for platform adapters
 * Implements common patterns and utilities
 */
export abstract class BasePlatformAdapter implements PlatformAdapter {
  // Platform identification (must be overridden)
  public abstract readonly name: string;
  public abstract readonly displayName: string;
  public abstract readonly version: string;
  public abstract readonly capabilities: PlatformCapabilities;
  
  // Internal state
  protected credentials?: PlatformCredentials;
  protected isAuthenticated = false;
  protected lastAuthCheck?: Date;
  protected rateLimitStatus?: RateLimitStatus;
  protected quotaStatus?: QuotaStatus;
  
  // Configuration
  protected maxRetries = 3;
  protected retryDelay = 1000; // milliseconds
  protected timeout = 30000; // milliseconds
  
  constructor(
    protected config: PlatformAdapterConfig = {}
  ) {
    if (config.maxRetries !== undefined) {
      this.maxRetries = config.maxRetries;
    }
    if (config.retryDelay !== undefined) {
      this.retryDelay = config.retryDelay;
    }
    if (config.timeout !== undefined) {
      this.timeout = config.timeout;
    }
  }
  
  // ===== ABSTRACT METHODS (must be implemented by subclasses) =====
  
  protected abstract performAuthentication(credentials: PlatformCredentials): Promise<AuthenticationResult>;
  protected abstract validateConnectionInternal(): Promise<ConnectionValidationResult>;
  protected abstract formatContentInternal(content: BlogPost, options?: FormatOptions): Promise<FormattedContent>;
  protected abstract publishContentInternal(content: FormattedContent, options?: PublishOptions): Promise<PublishResult>;
  protected abstract scheduleContentInternal(content: FormattedContent, publishTime: Date, options?: PublishOptions): Promise<ScheduleResult>;
  protected abstract getAnalyticsInternal(timeRange: DateRange, options?: AnalyticsOptions): Promise<PlatformAnalytics>;
  
  // ===== AUTHENTICATION =====
  
  public async authenticate(credentials: PlatformCredentials): Promise<AuthenticationResult> {
    try {
      const result = await this.performAuthentication(credentials);
      
      if (result.success) {
        this.credentials = credentials;
        this.isAuthenticated = true;
        this.lastAuthCheck = new Date();
      }
      
      return result;
    } catch (error) {
      throw new AuthenticationError(this.name, `Authentication failed: ${error.message}`);
    }
  }
  
  public async validateConnection(): Promise<ConnectionValidationResult> {
    if (!this.isAuthenticated || !this.credentials) {
      return {
        isValid: false,
        isAuthenticated: false,
        capabilities: this.capabilities,
        error: 'Not authenticated'
      };
    }
    
    try {
      const result = await this.validateConnectionInternal();
      this.lastAuthCheck = new Date();
      return result;
    } catch (error) {
      return {
        isValid: false,
        isAuthenticated: false,
        capabilities: this.capabilities,
        error: error.message
      };
    }
  }
  
  public async refreshAuth(refreshToken: string): Promise<AuthenticationResult> {
    if (!this.capabilities.supportsScheduling) {
      throw new Error(`Platform ${this.name} does not support token refresh`);
    }
    
    // Default implementation - should be overridden by platforms that support refresh
    throw new Error(`Refresh authentication not implemented for ${this.name}`);
  }
  
  public async disconnect(): Promise<void> {
    this.credentials = undefined;
    this.isAuthenticated = false;
    this.lastAuthCheck = undefined;
    this.rateLimitStatus = undefined;
    this.quotaStatus = undefined;
  }
  
  // ===== CONTENT OPERATIONS =====
  
  public async formatContent(content: BlogPost, options?: FormatOptions): Promise<FormattedContent> {
    this.ensureAuthenticated();
    
    try {
      const formatted = await this.formatContentInternal(content, options);
      
      // Apply common post-processing
      return this.postProcessFormattedContent(formatted, options);
    } catch (error) {
      throw new Error(`Content formatting failed for ${this.name}: ${error.message}`);
    }
  }
  
  public async validateContent(content: FormattedContent): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: any[] = [];
    
    // Common validation checks
    await this.validateBasicConstraints(content, errors, warnings, suggestions);
    await this.validatePlatformSpecificConstraints(content, errors, warnings, suggestions);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }
  
  // ===== PUBLISHING OPERATIONS =====
  
  public async publish(content: FormattedContent, options?: PublishOptions): Promise<PublishResult> {
    this.ensureAuthenticated();
    
    // Validate content first
    const validation = await this.validateContent(content);
    if (!validation.isValid) {
      throw new ContentValidationError(this.name, validation.errors);
    }
    
    return this.executeWithRetry(async () => {
      return this.publishContentInternal(content, options);
    });
  }
  
  public async schedule(content: FormattedContent, publishTime: Date, options?: PublishOptions): Promise<ScheduleResult> {
    this.ensureAuthenticated();
    
    if (!this.capabilities.supportsScheduling) {
      throw new Error(`Platform ${this.name} does not support scheduling`);
    }
    
    const validation = await this.validateContent(content);
    if (!validation.isValid) {
      throw new ContentValidationError(this.name, validation.errors);
    }
    
    return this.executeWithRetry(async () => {
      return this.scheduleContentInternal(content, publishTime, options);
    });
  }
  
  public async update(externalId: string, content: FormattedContent, options?: PublishOptions): Promise<PublishResult> {
    this.ensureAuthenticated();
    
    if (!this.capabilities.supportsUpdates) {
      throw new Error(`Platform ${this.name} does not support content updates`);
    }
    
    // Default implementation - should be overridden by platforms that support updates
    throw new Error(`Content updates not implemented for ${this.name}`);
  }
  
  public async delete(externalId: string): Promise<DeleteResult> {
    this.ensureAuthenticated();
    
    if (!this.capabilities.supportsDeleting) {
      throw new Error(`Platform ${this.name} does not support content deletion`);
    }
    
    // Default implementation - should be overridden by platforms that support deletion
    throw new Error(`Content deletion not implemented for ${this.name}`);
  }
  
  // ===== BATCH OPERATIONS =====
  
  public async publishMultiple(contents: FormattedContent[], options?: BulkPublishOptions): Promise<BulkPublishResult> {
    this.ensureAuthenticated();
    
    if (!this.capabilities.supportsBulkOperations) {
      // Fallback to individual publishing
      return this.publishMultipleSequentially(contents, options);
    }
    
    // Default sequential implementation - can be overridden for true bulk support
    return this.publishMultipleSequentially(contents, options);
  }
  
  protected async publishMultipleSequentially(contents: FormattedContent[], options?: BulkPublishOptions): Promise<BulkPublishResult> {
    const startTime = Date.now();
    const results: PublishResult[] = [];
    const errors: string[] = [];
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      
      try {
        const result = await this.publish(content, options);
        results.push(result);
        
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
          if (result.error) errors.push(result.error);
        }
        
        // Add delay between publishes if specified
        if (options?.delayBetweenPublishes && i < contents.length - 1) {
          await this.delay(options.delayBetweenPublishes);
        }
        
      } catch (error) {
        failureCount++;
        const errorResult: PublishResult = {
          success: false,
          error: error.message
        };
        results.push(errorResult);
        errors.push(error.message);
        
        // Stop on first error if configured
        if (options?.stopOnError) {
          break;
        }
      }
    }
    
    const duration = (Date.now() - startTime) / 1000;
    
    return {
      totalItems: contents.length,
      successCount,
      failureCount,
      results,
      errors,
      duration
    };
  }
  
  // ===== ANALYTICS =====
  
  public async getAnalytics(timeRange: DateRange, options?: AnalyticsOptions): Promise<PlatformAnalytics> {
    this.ensureAuthenticated();
    
    if (!this.capabilities.supportsAnalytics) {
      throw new Error(`Platform ${this.name} does not support analytics`);
    }
    
    return this.getAnalyticsInternal(timeRange, options);
  }
  
  public async getContentAnalytics(externalId: string, timeRange: DateRange): Promise<ContentAnalytics> {
    this.ensureAuthenticated();
    
    if (!this.capabilities.supportsAnalytics) {
      throw new Error(`Platform ${this.name} does not support analytics`);
    }
    
    // Default implementation - should be overridden by platforms
    throw new Error(`Content analytics not implemented for ${this.name}`);
  }
  
  // ===== PLATFORM-SPECIFIC OPERATIONS =====
  
  public async getCategories(): Promise<Category[]> {
    if (!this.capabilities.supportsCategories) {
      return [];
    }
    
    // Default implementation - should be overridden
    throw new Error(`Categories not implemented for ${this.name}`);
  }
  
  public async getTags(): Promise<Tag[]> {
    if (!this.capabilities.supportsTags) {
      return [];
    }
    
    // Default implementation - should be overridden
    throw new Error(`Tags not implemented for ${this.name}`);
  }
  
  public async getCustomFields(): Promise<CustomField[]> {
    // Default implementation - should be overridden
    throw new Error(`Custom fields not implemented for ${this.name}`);
  }
  
  // ===== HEALTH AND STATUS =====
  
  public async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Check authentication
      if (!this.isAuthenticated) {
        errors.push('Not authenticated');
      }
      
      // Check connection
      const connectionResult = await this.validateConnection();
      if (!connectionResult.isValid) {
        errors.push(connectionResult.error || 'Connection invalid');
      }
      
      // Check rate limits
      try {
        const rateLimit = await this.getRateLimit();
        if (rateLimit.remaining < 10) {
          warnings.push(`Rate limit almost exceeded: ${rateLimit.remaining} remaining`);
        }
      } catch (error) {
        warnings.push(`Could not check rate limits: ${error.message}`);
      }
      
      const responseTime = Date.now() - startTime;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (errors.length > 0) {
        status = 'unhealthy';
      } else if (warnings.length > 0) {
        status = 'degraded';
      }
      
      return {
        status,
        responseTime,
        errors,
        warnings,
        lastChecked: new Date()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        errors: [error.message],
        lastChecked: new Date()
      };
    }
  }
  
  public async getRateLimit(): Promise<RateLimitStatus> {
    // Default implementation - should be overridden by platforms
    // Return a default that indicates no rate limiting info available
    return {
      limit: 1000,
      remaining: 1000,
      resetTime: new Date(Date.now() + 3600000) // 1 hour from now
    };
  }
  
  public async getQuota(): Promise<QuotaStatus> {
    // Default implementation - should be overridden by platforms
    return {
      limit: 10000,
      used: 0,
      remaining: 10000,
      resetDate: new Date(Date.now() + 86400000) // 24 hours from now
    };
  }
  
  // ===== PROTECTED UTILITY METHODS =====
  
  protected ensureAuthenticated(): void {
    if (!this.isAuthenticated || !this.credentials) {
      throw new AuthenticationError(this.name, 'Platform not authenticated');
    }
  }
  
  protected async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry certain types of errors
        if (error instanceof ContentValidationError || 
            error instanceof AuthenticationError) {
          throw error;
        }
        
        // Handle rate limiting
        if (error instanceof RateLimitError) {
          if (error.details?.retryAfter) {
            await this.delay(error.details.retryAfter * 1000);
          } else {
            await this.delay(this.retryDelay * attempt);
          }
        } else {
          // Exponential backoff for other errors
          await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
        }
      }
    }
    
    throw new PublishingError(this.name, `Operation failed after ${this.maxRetries} retries`, lastError);
  }
  
  protected async delay(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }
  
  protected postProcessFormattedContent(content: FormattedContent, options?: FormatOptions): FormattedContent {
    // Apply common post-processing logic
    let processedContent = { ...content };
    
    // Trim content if it exceeds platform limits
    if (content.content.length > this.capabilities.maxContentLength) {
      processedContent.content = this.truncateContent(content.content, this.capabilities.maxContentLength);
    }
    
    // Trim title if it exceeds limits
    if (this.capabilities.maxTitleLength && content.title.length > this.capabilities.maxTitleLength) {
      processedContent.title = content.title.substring(0, this.capabilities.maxTitleLength - 3) + '...';
    }
    
    // Trim description if it exceeds limits
    if (this.capabilities.maxDescriptionLength && content.excerpt) {
      if (content.excerpt.length > this.capabilities.maxDescriptionLength) {
        processedContent.excerpt = content.excerpt.substring(0, this.capabilities.maxDescriptionLength - 3) + '...';
      }
    }
    
    return processedContent;
  }
  
  protected truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    
    // Try to truncate at word boundary
    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) { // If we can truncate at a word boundary reasonably close
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated.substring(0, maxLength - 3) + '...';
  }
  
  protected async validateBasicConstraints(
    content: FormattedContent, 
    errors: ValidationError[], 
    warnings: ValidationError[], 
    suggestions: any[]
  ): Promise<void> {
    // Title validation
    if (!content.title || content.title.trim().length === 0) {
      errors.push({
        field: 'title',
        message: 'Title is required',
        code: 'REQUIRED',
        severity: 'error'
      });
    }
    
    // Content validation
    if (!content.content || content.content.trim().length === 0) {
      errors.push({
        field: 'content',
        message: 'Content is required',
        code: 'REQUIRED',
        severity: 'error'
      });
    }
    
    // Length validations
    if (content.title.length > this.capabilities.maxContentLength) {
      errors.push({
        field: 'title',
        message: `Title exceeds maximum length of ${this.capabilities.maxContentLength}`,
        code: 'MAX_LENGTH',
        severity: 'error'
      });
    }
    
    if (content.content.length > this.capabilities.maxContentLength) {
      errors.push({
        field: 'content',
        message: `Content exceeds maximum length of ${this.capabilities.maxContentLength}`,
        code: 'MAX_LENGTH',
        severity: 'error'
      });
    }
    
    // Format validation
    if (!this.capabilities.supportedFormats.includes(content.format)) {
      errors.push({
        field: 'format',
        message: `Format ${content.format} is not supported by ${this.name}`,
        code: 'UNSUPPORTED_FORMAT',
        severity: 'error'
      });
    }
    
    // Media validation
    if (content.featuredImage && !this.capabilities.supportsImages) {
      warnings.push({
        field: 'featuredImage',
        message: `Platform ${this.name} does not support images`,
        code: 'UNSUPPORTED_FEATURE',
        severity: 'warning'
      });
    }
    
    if (content.gallery && !this.capabilities.supportsGalleries) {
      warnings.push({
        field: 'gallery',
        message: `Platform ${this.name} does not support image galleries`,
        code: 'UNSUPPORTED_FEATURE',
        severity: 'warning'
      });
    }
  }
  
  protected async validatePlatformSpecificConstraints(
    content: FormattedContent, 
    errors: ValidationError[], 
    warnings: ValidationError[], 
    suggestions: any[]
  ): Promise<void> {
    // Default implementation - should be overridden by platforms
    // This is where platform-specific validation logic goes
  }
}

// ===== CONFIGURATION INTERFACE =====

export interface PlatformAdapterConfig {
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  timeout?: number; // milliseconds
  customEndpoints?: Record<string, string>;
  debugging?: boolean;
}

// ===== PLATFORM REGISTRY =====

/**
 * Registry for managing platform adapters
 */
export class PlatformRegistry {
  private adapters = new Map<string, typeof BasePlatformAdapter>();
  
  register(name: string, adapterClass: typeof BasePlatformAdapter): void {
    this.adapters.set(name, adapterClass);
  }
  
  get(name: string): typeof BasePlatformAdapter | undefined {
    return this.adapters.get(name);
  }
  
  has(name: string): boolean {
    return this.adapters.has(name);
  }
  
  list(): string[] {
    return Array.from(this.adapters.keys());
  }
  
  create(name: string, config?: PlatformAdapterConfig): BasePlatformAdapter {
    const AdapterClass = this.adapters.get(name);
    if (!AdapterClass) {
      throw new Error(`Platform adapter '${name}' not found`);
    }
    
    return new AdapterClass(config);
  }
}

// Global registry instance
export const platformRegistry = new PlatformRegistry();
