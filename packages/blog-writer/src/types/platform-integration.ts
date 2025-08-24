/**
 * Platform Integration Framework Types
 * Week 13-14 Implementation
 *
 * Comprehensive type definitions for multi-platform content distribution
 * following the established provider pattern from AI SDK
 */

import type { BlogPost } from './blog-post';

// ===== CORE PLATFORM TYPES =====

/**
 * Platform capabilities definition
 * Describes what a platform can and cannot do
 */
export interface PlatformCapabilities {
  // Content constraints
  maxContentLength: number;
  maxTitleLength?: number;
  maxDescriptionLength?: number;
  maxTagsCount?: number;

  // Media support
  supportsImages: boolean;
  supportsVideo: boolean;
  supportsAudio: boolean;
  supportsGalleries?: boolean;
  maxImageSize?: number; // in bytes
  supportedImageFormats?: string[];

  // Publishing features
  supportsScheduling: boolean;
  supportsDrafts: boolean;
  supportsUpdates: boolean;
  supportsDeleting: boolean;
  supportsCategories?: boolean;
  supportsTags?: boolean;

  // Analytics and tracking
  supportsAnalytics: boolean;
  supportsRealTimeMetrics?: boolean;
  supportsCustomEvents?: boolean;

  // SEO and metadata
  supportsCustomMeta: boolean;
  supportsOpenGraph: boolean;
  supportsTwitterCards: boolean;
  supportsSchema: boolean;
  supportsCanonical?: boolean;

  // Formatting and styling
  supportedFormats: ContentFormat[];
  supportsMarkdown?: boolean;
  supportsHTML: boolean;
  supportsRichText: boolean;
  supportsCustomCSS?: boolean;

  // Social and engagement
  supportsComments?: boolean;
  supportsSharing?: boolean;
  supportsReactions?: boolean;
  supportsSubscriptions?: boolean;

  // Advanced features
  supportsA11y?: boolean; // Accessibility
  supportsMultiLanguage?: boolean;
  supportsVersioning?: boolean;
  supportsBulkOperations?: boolean;
}

export enum ContentFormat {
  MARKDOWN = 'markdown',
  HTML = 'html',
  RICH_TEXT = 'rich_text',
  PLAIN_TEXT = 'plain_text',
  JSON = 'json',
  AMP = 'amp',
  RSS = 'rss',
}

/**
 * Platform authentication credentials
 */
export interface PlatformCredentials {
  type: AuthenticationType;
  data: Record<string, any>;
  expiresAt?: Date;
  refreshToken?: string;
  scopes?: string[];
}

export enum AuthenticationType {
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  BASIC_AUTH = 'basic_auth',
  TOKEN = 'token',
  JWT = 'jwt',
  CUSTOM = 'custom',
}

/**
 * Formatted content for platform publishing
 */
export interface FormattedContent {
  // Core content
  title: string;
  content: string;
  excerpt?: string;

  // Metadata
  metadata: ContentMetadata;
  seo: SEOMetadata;

  // Media and attachments
  featuredImage?: MediaFile;
  gallery?: MediaFile[];
  attachments?: MediaFile[];

  // Platform-specific data
  platformSpecific?: Record<string, any>;

  // Formatting info
  format: ContentFormat;
  originalWordCount: number;
  adaptedWordCount: number;
  adaptationScore: number; // 0-1 how well adapted
}

export interface ContentMetadata {
  // Basic metadata
  slug?: string;
  description?: string;
  keywords?: string[];
  tags?: string[];
  categories?: string[];

  // Publishing metadata
  publishDate?: Date;
  lastModified?: Date;
  status?: string;
  visibility?: 'public' | 'private' | 'unlisted' | 'password';

  // Author information
  author?: AuthorInfo;

  // Custom metadata
  customFields?: Record<string, any>;
}

export interface SEOMetadata {
  // Basic SEO
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;

  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;

  // Twitter Cards
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;

  // Technical SEO
  canonical?: string;
  robots?: string;
  schema?: Record<string, any>;

  // Platform-specific SEO
  platformSEO?: Record<string, any>;
}

export interface MediaFile {
  id?: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number; // bytes
  dimensions?: {
    width: number;
    height: number;
  };
  altText?: string;
  caption?: string;
  credit?: string;
}

export interface AuthorInfo {
  id?: string;
  name: string;
  email?: string;
  bio?: string;
  avatar?: string;
  socialLinks?: Record<string, string>;
}

// ===== PLATFORM ADAPTER INTERFACE =====

/**
 * Core platform adapter interface
 * All platform adapters must implement this interface
 */
export interface PlatformAdapter {
  // Platform identification
  readonly name: string;
  readonly displayName: string;
  readonly version: string;
  readonly capabilities: PlatformCapabilities;

  // Connection management
  authenticate(credentials: PlatformCredentials): Promise<AuthenticationResult>;
  validateConnection(): Promise<ConnectionValidationResult>;
  refreshAuth(refreshToken: string): Promise<AuthenticationResult>;
  disconnect(): Promise<void>;

  // Content operations
  formatContent(
    content: BlogPost,
    options?: FormatOptions,
  ): Promise<FormattedContent>;
  validateContent(content: FormattedContent): Promise<ValidationResult>;

  // Publishing operations
  publish(
    content: FormattedContent,
    options?: PublishOptions,
  ): Promise<PublishResult>;
  schedule(
    content: FormattedContent,
    publishTime: Date,
    options?: PublishOptions,
  ): Promise<ScheduleResult>;
  update(
    externalId: string,
    content: FormattedContent,
    options?: PublishOptions,
  ): Promise<PublishResult>;
  delete(externalId: string): Promise<DeleteResult>;

  // Batch operations
  publishMultiple(
    contents: FormattedContent[],
    options?: BulkPublishOptions,
  ): Promise<BulkPublishResult>;

  // Analytics and metrics
  getAnalytics(
    timeRange: DateRange,
    options?: AnalyticsOptions,
  ): Promise<PlatformAnalytics>;
  getContentAnalytics(
    externalId: string,
    timeRange: DateRange,
  ): Promise<ContentAnalytics>;

  // Platform-specific operations
  getCategories?(): Promise<Category[]>;
  getTags?(): Promise<Tag[]>;
  getCustomFields?(): Promise<CustomField[]>;

  // Health and status
  healthCheck(): Promise<HealthCheckResult>;
  getRateLimit(): Promise<RateLimitStatus>;
  getQuota(): Promise<QuotaStatus>;
}

// ===== OPERATION RESULTS =====

export interface AuthenticationResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
  error?: string;
  userInfo?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface ConnectionValidationResult {
  isValid: boolean;
  isAuthenticated: boolean;
  expiresAt?: Date;
  capabilities: PlatformCapabilities;
  error?: string;
  warnings?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface ValidationSuggestion {
  field: string;
  suggestion: string;
  impact: 'low' | 'medium' | 'high';
}

export interface PublishResult {
  success: boolean;
  externalId?: string;
  externalUrl?: string;
  platformResponse?: any;
  publishedAt?: Date;
  error?: string;
  warnings?: string[];

  // Analytics and tracking
  initialMetrics?: {
    views?: number;
    impressions?: number;
  };
}

export interface ScheduleResult {
  success: boolean;
  scheduleId?: string;
  scheduledTime: Date;
  error?: string;
  platformResponse?: any;
}

export interface DeleteResult {
  success: boolean;
  deletedAt?: Date;
  error?: string;
}

export interface BulkPublishResult {
  totalItems: number;
  successCount: number;
  failureCount: number;
  results: PublishResult[];
  errors: string[];
  duration: number; // seconds
}

// ===== OPTIONS AND CONFIGURATION =====

export interface FormatOptions {
  targetWordCount?: number;
  preserveFormatting?: boolean;
  adaptForSEO?: boolean;
  includeImages?: boolean;
  customMappings?: Record<string, any>;
}

export interface PublishOptions {
  status?: 'draft' | 'published' | 'private' | 'unlisted';
  categories?: string[];
  tags?: string[];
  featuredImage?: MediaFile;
  customFields?: Record<string, any>;
  seoOptions?: SEOPublishOptions;
  socialOptions?: SocialPublishOptions;
}

export interface SEOPublishOptions {
  customMetaTitle?: string;
  customMetaDescription?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  canonical?: string;
}

export interface SocialPublishOptions {
  autoShare?: boolean;
  platforms?: string[];
  customMessage?: string;
  scheduledShareTime?: Date;
}

export interface BulkPublishOptions extends PublishOptions {
  batchSize?: number;
  delayBetweenPublishes?: number; // milliseconds
  stopOnError?: boolean;
  retryFailures?: boolean;
  maxRetries?: number;
}

export interface AnalyticsOptions {
  metrics?: string[];
  breakdown?: 'day' | 'week' | 'month';
  includeComparisons?: boolean;
  includeGoals?: boolean;
}

// ===== ANALYTICS TYPES =====

export interface PlatformAnalytics {
  platformName: string;
  timeRange: DateRange;

  // Traffic metrics
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  bounceRate: number;
  avgSessionDuration: number;

  // Engagement metrics
  totalEngagements: number;
  engagementRate: number;
  shares: number;
  comments: number;
  likes: number;
  saves?: number;

  // Conversion metrics
  conversions: number;
  conversionRate: number;
  goalCompletions?: GoalCompletion[];

  // Content performance
  topContent: ContentPerformance[];
  contentBreakdown: ContentBreakdown[];

  // Audience insights
  audienceInsights: AudienceInsights;

  // Revenue (if applicable)
  revenue?: number;
  revenuePerVisitor?: number;

  // Raw platform data
  platformSpecificMetrics: Record<string, any>;
}

export interface ContentAnalytics {
  contentId: string;
  externalId: string;
  title: string;

  // Performance metrics
  views: number;
  uniqueViews: number;
  engagements: number;
  shares: number;
  comments: number;

  // Time-based metrics
  publishedAt: Date;
  lastUpdated?: Date;
  peakTrafficTime?: Date;

  // Engagement patterns
  engagementOverTime: TimeSeriesData[];
  topReferrers: TrafficSource[];

  // Social metrics
  socialShares: SocialShareBreakdown[];
  viralityScore?: number;
}

export interface GoalCompletion {
  goalId: string;
  goalName: string;
  completions: number;
  conversionRate: number;
  value?: number;
}

export interface ContentPerformance {
  contentId: string;
  title: string;
  views: number;
  engagements: number;
  score: number; // 0-1
}

export interface ContentBreakdown {
  contentType: string;
  count: number;
  totalViews: number;
  avgEngagement: number;
}

export interface AudienceInsights {
  totalAudience: number;
  newVsReturning: {
    new: number;
    returning: number;
  };
  demographics?: {
    age?: AgeBreakdown[];
    gender?: GenderBreakdown[];
    location?: LocationBreakdown[];
  };
  interests?: InterestBreakdown[];
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  percentage: number;
}

export interface SocialShareBreakdown {
  platform: string;
  shares: number;
  engagement: number;
}

export interface AgeBreakdown {
  ageRange: string;
  percentage: number;
}

export interface GenderBreakdown {
  gender: string;
  percentage: number;
}

export interface LocationBreakdown {
  country: string;
  region?: string;
  city?: string;
  sessions: number;
  percentage: number;
}

export interface InterestBreakdown {
  interest: string;
  affinity: number; // 0-1
  inMarketSegment?: boolean;
}

// ===== SCHEDULING TYPES =====

export interface PublishSchedule {
  id: string;
  name: string;
  description?: string;

  // Timing
  scheduledTime: Date;
  timezone: string;
  recurringPattern?: RecurringPattern;

  // Content and targeting
  content: FormattedContent;
  platforms: string[];
  targetAudience?: AudienceTargeting;

  // Status
  status: ScheduleStatus;
  lastExecuted?: Date;
  nextExecution?: Date;

  // Results
  executionHistory: ScheduleExecution[];
}

export enum ScheduleStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
  endDate?: Date;
  maxOccurrences?: number;
}

export interface AudienceTargeting {
  demographics?: {
    age?: string[];
    gender?: string[];
    location?: string[];
  };
  interests?: string[];
  customAudiences?: string[];
  excludeAudiences?: string[];
}

export interface ScheduleExecution {
  id: string;
  executedAt: Date;
  success: boolean;
  results: PublishResult[];
  error?: string;
  duration: number; // seconds
}

// ===== UTILITY TYPES =====

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect';
  options?: string[];
  required?: boolean;
  default?: any;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number; // milliseconds
  errors?: string[];
  warnings?: string[];
  lastChecked: Date;
}

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // seconds
}

export interface QuotaStatus {
  limit: number;
  used: number;
  remaining: number;
  resetDate: Date;
  overageAllowed?: boolean;
  overageRate?: number;
}

// ===== MULTI-PLATFORM PUBLISHER INTERFACE =====

/**
 * Multi-platform publisher for coordinated publishing across platforms
 */
export interface MultiPlatformPublisher {
  // Platform management
  addPlatform(
    adapter: PlatformAdapter,
    credentials: PlatformCredentials,
  ): Promise<void>;
  removePlatform(platformName: string): Promise<void>;
  getPlatforms(): PlatformAdapter[];

  // Cross-platform publishing
  publishToAll(
    content: BlogPost,
    platforms?: string[],
    options?: MultiPlatformPublishOptions,
  ): Promise<MultiPlatformPublishResult>;
  publishToSelected(
    content: BlogPost,
    platforms: string[],
    options?: MultiPlatformPublishOptions,
  ): Promise<MultiPlatformPublishResult>;

  // Scheduling
  scheduleAcrossPlatforms(
    content: BlogPost,
    schedule: PublishSchedule,
  ): Promise<MultiPlatformScheduleResult>;

  // Analytics aggregation
  getAggregatedAnalytics(
    platforms?: string[],
    timeRange?: DateRange,
  ): Promise<AggregatedAnalytics>;
  getComparativeAnalytics(
    platforms: string[],
    timeRange: DateRange,
  ): Promise<ComparativeAnalytics>;

  // Batch operations
  bulkPublish(
    contents: BlogPost[],
    platforms: string[],
    options?: BulkPublishOptions,
  ): Promise<BulkPublishResult>;

  // Health monitoring
  checkPlatformHealth(): Promise<PlatformHealthReport>;
}

export interface MultiPlatformPublishOptions extends PublishOptions {
  platformSpecificOptions?: Record<string, PublishOptions>;
  publishOrder?: string[]; // Order to publish to platforms
  stopOnFirstFailure?: boolean;
  requireAllSuccess?: boolean;

  // Content adaptation per platform
  adaptContentPerPlatform?: boolean;
  adaptationRules?: Record<string, FormatOptions>;
}

export interface MultiPlatformPublishResult {
  success: boolean;
  results: Record<string, PublishResult>;
  errors: Record<string, string>;
  successCount: number;
  failureCount: number;
  totalDuration: number; // seconds
}

export interface MultiPlatformScheduleResult {
  success: boolean;
  scheduleResults: Record<string, ScheduleResult>;
  errors: Record<string, string>;
}

export interface AggregatedAnalytics {
  platforms: string[];
  timeRange: DateRange;

  // Aggregated totals
  totalViews: number;
  totalEngagements: number;
  totalShares: number;
  totalConversions: number;
  totalRevenue: number;

  // Average metrics
  avgEngagementRate: number;
  avgConversionRate: number;
  avgBounceRate: number;

  // Platform breakdown
  platformBreakdown: Record<string, PlatformAnalytics>;

  // Cross-platform insights
  crossPlatformInsights: CrossPlatformInsight[];
  topPerformingPlatform: string;
  recommendations: PlatformRecommendation[];
}

export interface ComparativeAnalytics {
  platforms: string[];
  timeRange: DateRange;

  // Head-to-head comparisons
  comparisons: PlatformComparison[];

  // Performance rankings
  rankings: PlatformRanking[];

  // Insights and recommendations
  insights: AnalyticsInsight[];
  winnerByMetric: Record<string, string>; // metric -> platform
}

export interface CrossPlatformInsight {
  type: 'opportunity' | 'trend' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  platforms: string[];
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: string;
}

export interface PlatformRecommendation {
  platform: string;
  type: 'content' | 'timing' | 'audience' | 'format';
  recommendation: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  priority: number; // 1-10
}

export interface PlatformComparison {
  metric: string;
  platforms: Record<string, number>;
  winner: string;
  difference: number; // percentage difference
}

export interface PlatformRanking {
  metric: string;
  rankings: Array<{
    platform: string;
    value: number;
    rank: number;
  }>;
}

export interface AnalyticsInsight {
  type: 'positive' | 'negative' | 'neutral';
  metric: string;
  platforms: string[];
  description: string;
  significance: 'low' | 'medium' | 'high';
}

export interface PlatformHealthReport {
  overall: 'healthy' | 'degraded' | 'critical';
  platforms: Record<string, HealthCheckResult>;
  issues: HealthIssue[];
  recommendations: HealthRecommendation[];
}

export interface HealthIssue {
  platform: string;
  severity: 'warning' | 'error' | 'critical';
  message: string;
  since?: Date;
  affectedFeatures?: string[];
}

export interface HealthRecommendation {
  platform: string;
  issue: string;
  recommendation: string;
  urgency: 'low' | 'medium' | 'high';
}

// ===== REQUEST/RESPONSE TYPES =====

export interface PlatformIntegrationRequest {
  blogPostId: string;
  platforms: string[];
  publishType: 'immediate' | 'scheduled' | 'draft';
  scheduledTime?: Date;
  options?: MultiPlatformPublishOptions;
}

export interface PlatformIntegrationResponse {
  success: boolean;
  results: MultiPlatformPublishResult;
  analytics?: AggregatedAnalytics;
  recommendations?: PlatformRecommendation[];
}

export interface PlatformAnalyticsRequest {
  platforms?: string[];
  timeRange: DateRange;
  metrics?: string[];
  breakdown?: 'platform' | 'content' | 'time';
  includeComparisons?: boolean;
}

export interface PlatformAnalyticsResponse {
  aggregated: AggregatedAnalytics;
  comparative?: ComparativeAnalytics;
  rawData: Record<string, PlatformAnalytics>;
}

// ===== ERROR TYPES =====

export class PlatformError extends Error {
  constructor(
    message: string,
    public platform: string,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'PlatformError';
  }
}

export class AuthenticationError extends PlatformError {
  constructor(platform: string, message: string) {
    super(message, platform, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends PlatformError {
  constructor(platform: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${platform}`, platform, 'RATE_LIMIT');
    this.name = 'RateLimitError';
    if (retryAfter) {
      this.details = { retryAfter };
    }
  }
}

export class ContentValidationError extends PlatformError {
  constructor(platform: string, validationErrors: ValidationError[]) {
    super(
      `Content validation failed for ${platform}`,
      platform,
      'VALIDATION_ERROR',
    );
    this.name = 'ContentValidationError';
    this.details = { errors: validationErrors };
  }
}

export class PublishingError extends PlatformError {
  constructor(platform: string, message: string, originalError?: any) {
    super(message, platform, 'PUBLISHING_ERROR');
    this.name = 'PublishingError';
    this.details = { originalError };
  }
}
