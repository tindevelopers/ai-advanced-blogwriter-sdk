// Core exports
export { validateBlogPost } from './core/validation';
export type { BlogPostValidation as BlogValidationResult } from './core/validation';

// Type exports
export type { BlogPost } from './types/blog-post';
export type { BlogTemplate } from './types/blog-config';

// Architecture exports - use explicit exports to avoid conflicts
export type {
  BaseService,
  BaseServiceClass,
} from './core/interfaces/base-service';

export type {
  ServiceConfig as BaseServiceConfig,
  AIModelProvider,
  DatabaseProvider,
  CacheProvider,
  LoggerProvider,
  EventBusProvider,
  ConfigurationProvider,
  ServiceContainer,
} from './core/interfaces/base-service';

export {
  ConfigurationManager,
  DatabaseConfigSchema,
  AIModelConfigSchema,
  CacheConfigSchema,
  LoggingConfigSchema,
  ServiceConfigSchema,
  BlogWriterConfigSchema,
} from './core/config/configuration-manager';

export type {
  DatabaseConfig,
  AIModelConfig,
  CacheConfig,
  LoggingConfig,
  ServiceConfig,
} from './core/config/configuration-manager';

export {
  ServiceContainerImpl,
  ServiceContainerBuilder,
} from './core/container/service-container';

export type {
  ServiceRegistration,
  LifecycleHook,
  ValidationResult as ContainerValidationResult,
} from './core/container/service-container';

export {
  BlogGeneratorService,
} from './core/services/blog-generator-service';

export type {
  BlogGenerationOptions,
  BlogGenerationResult,
} from './core/services/blog-generator-service';

export {
  BlogWriterFactory,
  BlogWriter,
} from './core/factories/blog-writer-factory';

export type {
  BlogWriterOptions,
  BlogWriterConfig,
} from './core/factories/blog-writer-factory';

// Core Services (existing)
export { generateBlog } from './core/blog-generator';
export { AdvancedWritingService } from './core/advanced-writing-service';
export { ContentStrategyService } from './core/content-strategy-service';
export { TopicResearchService } from './core/topic-research-service';
export { EditorialCalendarService } from './core/editorial-calendar-service';
export { CompetitorAnalysisService } from './core/competitor-analysis-service';
export { ContentBriefService } from './core/content-brief-service';
export { MultiSectionGenerationService } from './core/multi-section-generation-service';
export { ToneStyleConsistencyService } from './core/tone-style-consistency-service';
export { FactCheckingService } from './core/fact-checking-service';
export { ContentOptimizationService } from './core/content-optimization-service';
export { ContentManagementService } from './core/content-management-service';
export { ContentFormattingService } from './core/content-formatting-service';
export { VersionManager } from './core/version-manager';
export { WorkflowManager } from './core/workflow-manager';
export { MetadataManager } from './core/metadata-manager';
export { NotificationManager } from './core/notification-manager';
export { PerformanceTrackingService } from './core/performance-tracking-service';
export { OptimizationRecommendationEngine } from './core/optimization-recommendation-engine';
export { PlatformSchedulingService } from './core/platform-scheduling-service';

// Type exports from existing types
export type { AIConfig as BlogAIConfig } from './types/base-config';
export type { ContentStrategy } from './types/strategy-engine';
export type { ComprehensiveWritingRequest, BrandVoiceProfile, ToneCategory, ContentOutline } from './types/advanced-writing';
export type { Priority } from './types/strategy-engine';

// Blog Templates and Configuration
export const BLOG_TEMPLATES = {
  howto: {
    name: 'How-To Guide',
    structure: [
      { id: 'intro', title: 'Introduction', required: true },
      { id: 'prerequisites', title: 'Prerequisites', required: false },
      { id: 'steps', title: 'Step-by-Step Instructions', required: true },
      { id: 'tips', title: 'Tips and Best Practices', required: false },
      { id: 'conclusion', title: 'Conclusion', required: true },
    ],
  },
  listicle: {
    name: 'Listicle',
    structure: [
      { id: 'intro', title: 'Introduction', required: true },
      { id: 'list', title: 'The List', required: true },
      { id: 'conclusion', title: 'Conclusion', required: true },
    ],
  },
  comparison: {
    name: 'Comparison',
    structure: [
      { id: 'intro', title: 'Introduction', required: true },
      { id: 'criteria', title: 'Comparison Criteria', required: true },
      { id: 'comparison', title: 'Detailed Comparison', required: true },
      { id: 'recommendation', title: 'Recommendation', required: true },
    ],
  },
  tutorial: {
    name: 'Tutorial',
    structure: [
      { id: 'intro', title: 'Introduction', required: true },
      { id: 'setup', title: 'Setup and Prerequisites', required: true },
      { id: 'tutorial', title: 'Tutorial Steps', required: true },
      { id: 'examples', title: 'Examples', required: false },
      { id: 'conclusion', title: 'Conclusion', required: true },
    ],
  },
  news: {
    name: 'News Article',
    structure: [
      { id: 'headline', title: 'Headline', required: true },
      { id: 'lead', title: 'Lead Paragraph', required: true },
      { id: 'context', title: 'Context and Background', required: true },
      { id: 'details', title: 'Details and Analysis', required: true },
      { id: 'impact', title: 'Impact and Implications', required: false },
    ],
  },
  review: {
    name: 'Review',
    structure: [
      { id: 'intro', title: 'Introduction', required: true },
      { id: 'overview', title: 'Product/Service Overview', required: true },
      { id: 'pros-cons', title: 'Pros and Cons', required: true },
      { id: 'detailed-review', title: 'Detailed Review', required: true },
      { id: 'verdict', title: 'Verdict and Recommendation', required: true },
    ],
  },
  guide: {
    name: 'Comprehensive Guide',
    structure: [
      { id: 'intro', title: 'Introduction', required: true },
      { id: 'basics', title: 'Basics and Fundamentals', required: true },
      { id: 'advanced', title: 'Advanced Concepts', required: false },
      { id: 'examples', title: 'Real-World Examples', required: true },
      { id: 'best-practices', title: 'Best Practices', required: true },
      { id: 'conclusion', title: 'Conclusion', required: true },
    ],
  },
  'case-study': {
    name: 'Case Study',
    structure: [
      { id: 'intro', title: 'Introduction', required: true },
      { id: 'background', title: 'Background and Context', required: true },
      { id: 'challenge', title: 'The Challenge', required: true },
      { id: 'solution', title: 'Solution and Implementation', required: true },
      { id: 'results', title: 'Results and Outcomes', required: true },
      { id: 'lessons', title: 'Lessons Learned', required: true },
    ],
  },
  opinion: {
    name: 'Opinion Piece',
    structure: [
      { id: 'hook', title: 'Hook and Introduction', required: true },
      { id: 'argument', title: 'Main Argument', required: true },
      { id: 'evidence', title: 'Supporting Evidence', required: true },
      { id: 'counter-arguments', title: 'Counter-Arguments', required: false },
      { id: 'conclusion', title: 'Conclusion', required: true },
    ],
  },
  interview: {
    name: 'Interview',
    structure: [
      { id: 'intro', title: 'Introduction', required: true },
      { id: 'background', title: 'Interviewee Background', required: true },
      { id: 'questions', title: 'Interview Questions and Answers', required: true },
      { id: 'insights', title: 'Key Insights', required: true },
      { id: 'conclusion', title: 'Conclusion', required: true },
    ],
  },
};

export const DEFAULT_BLOG_CONFIG = {
  seo: {
    keywordDensity: 0.02,
    minLength: 300,
    maxLength: 3000,
    titleLength: { min: 30, max: 60 },
    metaDescriptionLength: { min: 120, max: 160 },
  },
  quality: {
    minWordCount: 300,
    targetReadabilityScore: 70,
    minSeoScore: 80,
    plagiarismThreshold: 0.1,
  },
  research: {
    maxSources: 10,
    minSourceQuality: 0.7,
    factCheckEnabled: true,
    competitorAnalysisEnabled: true,
  },
};

// Default configuration for the new architecture
export const DEFAULT_CONFIG = {
  service: {
    name: 'BlogWriter',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    debug: process.env.NODE_ENV === 'development',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  aiModel: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY || '',
    maxTokens: 4000,
    temperature: 0.7,
    timeout: 30000,
    retryAttempts: 3,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    destination: 'console',
  },
  features: {
    seoAnalysis: true,
    factChecking: true,
    plagiarismDetection: true,
    contentOptimization: true,
    multiPlatformPublishing: true,
  },
  limits: {
    maxWordCount: 10000,
    maxConcurrentRequests: 10,
    maxRetryAttempts: 3,
    rateLimitPerMinute: 60,
  },
};

// Convenience function for creating a blog writer instance
export async function createBlogWriter(options?: any) {
  // This would be implemented when the factory is properly set up
  throw new Error('BlogWriterFactory not yet implemented');
}
