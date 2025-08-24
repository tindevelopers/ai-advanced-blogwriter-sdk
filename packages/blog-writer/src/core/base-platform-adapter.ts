/**
 * Base Platform Adapter
 * Provides common functionality for all platform adapters
 */

import {
  PlatformCapabilities,
  PlatformCredentials,
  AuthenticationResult,
  ConnectionValidationResult,
  FormattedContent,
  ValidationResult,
  PublishResult,
  ScheduleResult,
  DeleteResult,
  PlatformAnalytics,
  ContentAnalytics,
  HealthCheckResult,
  RateLimitStatus,
  QuotaStatus,
  DateRange,
  FormatOptions,
  PublishOptions,
  AnalyticsOptions,
  Category,
  Tag,
  CustomField,
  BulkPublishResult,
  BulkPublishOptions,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  ContentValidationError,
  PlatformError,
} from '../types/platform-integration';
import type { BlogPost } from '../types/blog-post';

export interface PlatformAdapterConfig {
  baseUrl?: string;
  apiVersion?: string;
  timeout?: number; // milliseconds
  retryAttempts?: number;
  retryDelay?: number; // milliseconds
  rateLimitBuffer?: number; // percentage buffer for rate limits
}

/**
 * Base class for all platform adapters
 * Provides common functionality and error handling
 */
export abstract class BasePlatformAdapter {
  protected config: PlatformAdapterConfig;
  protected credentials?: PlatformCredentials;
  protected lastError?: Error | null = null;
  protected rateLimitStatus?: RateLimitStatus;

  constructor(config: PlatformAdapterConfig = {}) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimitBuffer: 10,
      ...config,
    };
  }

  // Abstract properties and methods that must be implemented
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly version: string;
  abstract readonly capabilities: PlatformCapabilities;

  // Core methods
  abstract authenticate(
    credentials: PlatformCredentials,
  ): Promise<AuthenticationResult>;
  abstract validateConnection(): Promise<ConnectionValidationResult>;
  abstract formatContent(
    content: BlogPost,
    options?: FormatOptions,
  ): Promise<FormattedContent>;
  abstract publish(
    content: FormattedContent,
    options?: PublishOptions,
  ): Promise<PublishResult>;

  // ===== COMMON HELPER METHODS =====

  /**
   * Handle authentication errors with retry logic
   */
  protected async handleAuthError(error: unknown): Promise<never> {
    this.lastError = error instanceof Error ? error : new Error(String(error));
    throw new AuthenticationError(this.name, String(error));
  }

  /**
   * Handle API rate limiting
   */
  protected async handleRateLimit(response: Response): Promise<void> {
    const retryAfter = response.headers.get('Retry-After');
    const resetTime = response.headers.get('X-RateLimit-Reset');

    if (retryAfter) {
      const delay = parseInt(retryAfter) * 1000;
      await this.delay(delay);
    } else if (resetTime) {
      const resetTimestamp = parseInt(resetTime) * 1000;
      const delay = Math.max(0, resetTimestamp - Date.now());
      await this.delay(delay);
    } else {
      // Default backoff
      await this.delay(60000); // 1 minute
    }
  }

  /**
   * Generic HTTP request with retry logic and error handling
   */
  protected async makeRequest(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeout,
        );

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
          await this.handleRateLimit(response);
          continue;
        }

        if (!response.ok) {
          throw new PlatformError(
            `HTTP ${response.status}: ${response.statusText}`,
            this.name,
            `HTTP_${response.status}`,
            { response: response.clone() },
          );
        }

        return response;
      } catch (error) {
        lastError = error;

        if (attempt < this.config.retryAttempts!) {
          await this.delay(this.config.retryDelay! * attempt);
        }
      }
    }

    this.lastError =
      lastError instanceof Error ? lastError : new Error(String(lastError));
    throw new PlatformError(
      `Request failed after ${this.config.retryAttempts} attempts: ${String(lastError)}`,
      this.name,
      'REQUEST_FAILED',
      { originalError: lastError },
    );
  }

  /**
   * Validate content before publishing
   */
  protected validateContentFormat(content: FormattedContent): ValidationResult {
    const errors: ValidationError[] = [];

    // Basic validation
    if (!content.title?.trim()) {
      errors.push({
        field: 'title',
        message: 'Title is required',
        code: 'MISSING_TITLE',
        severity: 'error',
      });
    }

    if (!content.content?.trim()) {
      errors.push({
        field: 'content',
        message: 'Content is required',
        code: 'MISSING_CONTENT',
        severity: 'error',
      });
    }

    // Platform-specific validation
    const capabilities = this.capabilities;

    if (
      content.title &&
      content.title.length > (capabilities.maxTitleLength || 200)
    ) {
      errors.push({
        field: 'title',
        message: `Title exceeds maximum length of ${capabilities.maxTitleLength} characters`,
        code: 'TITLE_TOO_LONG',
        severity: 'error',
      });
    }

    if (
      content.content &&
      content.content.length > capabilities.maxContentLength
    ) {
      errors.push({
        field: 'content',
        message: `Content exceeds maximum length of ${capabilities.maxContentLength} characters`,
        code: 'CONTENT_TOO_LONG',
        severity: 'error',
      });
    }

    if (
      capabilities.maxTagsCount &&
      content.metadata.tags &&
      content.metadata.tags.length > capabilities.maxTagsCount
    ) {
      errors.push({
        field: 'tags',
        message: `Too many tags. Maximum allowed: ${capabilities.maxTagsCount}`,
        code: 'TOO_MANY_TAGS',
        severity: 'error',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      suggestions: [],
    };
  }

  /**
   * Check if content validation has errors
   */
  protected throwIfValidationErrors(validation: ValidationResult): void {
    if (!validation.isValid) {
      throw new ContentValidationError(this.name, validation.errors);
    }
  }

  /**
   * Utility method for delays
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===== DEFAULT IMPLEMENTATIONS =====

  async refreshAuth(refreshToken: string): Promise<AuthenticationResult> {
    throw new PlatformError(
      'Refresh authentication not supported',
      this.name,
      'NOT_SUPPORTED',
    );
  }

  async disconnect(): Promise<void> {
    this.credentials = undefined;
    this.lastError = null;
  }

  async validateContent(content: FormattedContent): Promise<ValidationResult> {
    return this.validateContentFormat(content);
  }

  async schedule(
    content: FormattedContent,
    publishTime: Date,
    options?: PublishOptions,
  ): Promise<ScheduleResult> {
    throw new PlatformError(
      'Scheduling not supported',
      this.name,
      'NOT_SUPPORTED',
    );
  }

  async update(
    externalId: string,
    content: FormattedContent,
    options?: PublishOptions,
  ): Promise<PublishResult> {
    throw new PlatformError(
      'Content updates not supported',
      this.name,
      'NOT_SUPPORTED',
    );
  }

  async delete(externalId: string): Promise<DeleteResult> {
    throw new PlatformError(
      'Content deletion not supported',
      this.name,
      'NOT_SUPPORTED',
    );
  }

  async publishMultiple(
    contents: FormattedContent[],
    options?: BulkPublishOptions,
  ): Promise<BulkPublishResult> {
    const results: PublishResult[] = [];
    const errors: string[] = [];
    const startTime = Date.now();

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < contents.length; i++) {
      try {
        if (options?.delayBetweenPublishes && i > 0) {
          await this.delay(options.delayBetweenPublishes);
        }

        const result = await this.publish(contents[i], options);
        results.push(result);

        if (result.success) {
          successCount++;
        } else {
          failureCount++;
          if (result.error) {
            errors.push(result.error);
          }
        }

        if (!result.success && options?.stopOnError) {
          break;
        }
      } catch (error) {
        failureCount++;
        const errorMessage = String(error);
        errors.push(errorMessage);

        results.push({
          success: false,
          error: errorMessage,
        });

        if (options?.stopOnError) {
          break;
        }
      }
    }

    return {
      totalItems: contents.length,
      successCount,
      failureCount,
      results,
      errors,
      duration: (Date.now() - startTime) / 1000,
    };
  }

  async getAnalytics(
    timeRange: DateRange,
    options?: AnalyticsOptions,
  ): Promise<PlatformAnalytics> {
    throw new PlatformError(
      'Analytics not supported',
      this.name,
      'NOT_SUPPORTED',
    );
  }

  async getContentAnalytics(
    externalId: string,
    timeRange: DateRange,
  ): Promise<ContentAnalytics> {
    throw new PlatformError(
      'Content analytics not supported',
      this.name,
      'NOT_SUPPORTED',
    );
  }

  async getCategories?(): Promise<Category[]> {
    return [];
  }

  async getTags?(): Promise<Tag[]> {
    return [];
  }

  async getCustomFields?(): Promise<CustomField[]> {
    return [];
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const connectionValid = await this.validateConnection();
      const responseTime = Date.now() - startTime;

      return {
        status: connectionValid.isValid ? 'healthy' : 'unhealthy',
        responseTime,
        errors: connectionValid.error ? [connectionValid.error] : [],
        warnings: connectionValid.warnings || [],
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        errors: [String(error)],
        lastChecked: new Date(),
      };
    }
  }

  async getRateLimit(): Promise<RateLimitStatus> {
    // Return cached rate limit status if available
    if (this.rateLimitStatus) {
      return this.rateLimitStatus;
    }

    // Default implementation
    return {
      limit: 1000,
      remaining: 1000,
      resetTime: new Date(Date.now() + 3600000), // 1 hour from now
    };
  }

  async getQuota(): Promise<QuotaStatus> {
    return {
      limit: 10000,
      used: 0,
      remaining: 10000,
      resetDate: new Date(Date.now() + 86400000 * 30), // 30 days from now
    };
  }

  // ===== ERROR HANDLING =====

  protected createError(
    message: string,
    code?: string,
    details?: any,
  ): PlatformError {
    return new PlatformError(message, this.name, code, details);
  }

  protected handleError(error: unknown): PlatformError {
    if (error instanceof PlatformError) {
      return error;
    }

    this.lastError = error instanceof Error ? error : new Error(String(error));

    // Map common error types
    if (error instanceof Error && error.message.includes('authentication')) {
      return new AuthenticationError(this.name, error.message);
    }
    if (error instanceof Error && error.message.includes('validation')) {
      return new ContentValidationError(this.name, []);
    }
    if (error instanceof Error && error.message.includes('rate limit')) {
      return new RateLimitError(this.name);
    }

    return new PlatformError(String(error), this.name);
  }
}
