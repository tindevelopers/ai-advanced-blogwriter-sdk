

// Re-export all types
export * from './base-config';
export * from './blog-config';
export * from './blog-post';
export * from './seo';
export * from './templates';
// Research types (selective exports to avoid conflicts)
export {
  ContentResearchConfig,
  ContentResearchResult,
  KeywordResearchData,
  ExpertProfile,
  ExpertQuote,
  TopicResearchOptions
} from './research';

// Export specific interfaces as requested in requirements
export type { 
  BlogAIConfig, 
  ToneConfiguration,
  ExtendedBlogAIConfig 
} from './blog-config';
export type { 
  RequiredBlogPost,
  BlogPost, 
  PostMetadata, 
  ContentVersion,
  BlogPostStatus 
} from './blog-post';

// Week 3-4 Content Management Foundation
export * from './versioning';
export * from './workflow';
export * from './metadata';
export * from './categorization';
export * from './notifications';

// Week 5-6 Content Strategy Engine (selective exports to avoid conflicts)
export {
  // Main interfaces
  ContentStrategy,
  CompetitorInsight,
  TrendingTopic,
  ContentStructure,
  // Other key interfaces
  TopicCluster,
  TopicResearch,
  EditorialCalendar,
  EditorialCalendarEntry,
  Competitor,
  CompetitorAnalysis,
  ContentBrief,
  StrategyReport,
  // API interfaces
  TopicResearchRequest,
  TopicResearchResponse,
  CompetitorAnalysisRequest,
  CompetitorAnalysisResponse,
  ContentBriefRequest,
  ContentBriefResponse,
  EditorialCalendarRequest,
  EditorialCalendarResponse,
  // Enums and types
  CompetitionLevel,
  TopicStatus,
  Priority,
  TopicRelationshipType,
  CalendarEntryStatus,
  ActivityType,
  CompetitorType,
  SearchIntent,
  BriefStatus
} from './strategy-engine';

// Week 7-8 Advanced Writing Features  
export * from './advanced-writing';

// Week 9-10 SEO Analysis Engine (selective exports to avoid conflicts)
export {
  // Core SEO interfaces
  DataForSEOConfig,
  DataForSEOConnectionStatus,
  KeywordResearchRequest,
  KeywordData,
  KeywordTrends,
  MonthlySearch,
  KeywordDifficulty,
  KeywordCluster,
  OnPageSEOAnalysis,
  TitleAnalysis,
  MetaDescriptionAnalysis,
  HeadingAnalysis,
  ContentAnalysis,
  KeywordDensityAnalysis,
  ContentStructureAnalysis,
  TopicCoverageAnalysis,
  ImageOptimization,
  ImageAnalysisDetail,
  ImageIssue,
  LinkAnalysis,
  InternalLinkAnalysis,
  ExternalLinkAnalysis,
  InternalLinkSuggestion,
  ExternalLinkSuggestion,
  AnchorTextAnalysis,
  AnchorTextDistribution,
  TechnicalSEO,
  PageSpeedAnalysis,
  SpeedMetrics,
  CoreWebVitals,
  PageSpeedSuggestion,
  MobileAnalysis,
  MetaTagSuggestions,
  OpenGraphTags,
  TwitterCardTags,
  CustomMetaTag,
  SchemaMarkup,
  ArticleSchema,
  AuthorSchema,
  PublisherSchema,
  ImageObjectSchema,
  BreadcrumbSchema,
  BreadcrumbItem,
  FAQSchema,
  FAQItem,
  HowToSchema,
  HowToStep,
  OrganizationSchema,
  ContactPointSchema,
  WebsiteSchema,
  SearchActionSchema,
  SchemaAnalysis,
  SchemaError,
  SchemaSuggestion,
  ReadabilityMetrics,
  ReadingLevel,
  ReadabilitySuggestion,
  ContentQualityScore,
  QualityFactor,
  QualityRecommendation,
  CompetitorPage,
  CompetitorMetrics,
  ContentGap,
  SEOOpportunity,
  CanonicalizationAnalysis,
  CanonicalizationIssue,
  IndexabilityAnalysis,
  RobotsTxtAnalysis,
  MetaRobotsAnalysis,
  SitemapAnalysis,
  IndexabilityIssue,
  SEOAnalysisResult,
  SEORecommendationType,
  SEOAnalysisRequest,
  KeywordResearchResponse,
  SchemaGenerationRequest
} from './seo-engine';

// Week 11-12 Performance Optimization (selective exports to avoid conflicts)  
export {
  // Core Performance interfaces
  PerformanceMetrics,
  EngagementMetrics,
  ScrollDepthMetrics,
  HeatmapPoint,
  ConversionMetrics,
  GoalCompletion,
  LeadMetrics,
  SEOMetrics,
  KeywordRanking,
  SocialMetrics,
  PlatformMetrics,
  SocialPlatform,
  SentimentAnalysis,
  TrafficSourceMetrics,
  DeviceMetrics,
  BrowserMetrics,
  OSMetrics,
  DemographicMetrics,
  AgeGroupMetrics,
  GenderMetrics,
  GeographicMetrics,
  InterestMetrics,
  ABTestConfig,
  ContentVariant,
  ContentVariantStructure,
  VariantSection,
  SEOVariantElements,
  SuccessMetric,
  MetricType,
  TestTargeting,
  TargetingRule,
  ABTestStatus,
  ABTestResult,
  VariantResult,
  VariantMetricResult,
  SegmentAnalysisResult,
  TimeSeriesDataPoint,
  TestRecommendation,
  EngagementPrediction,
  PredictionType,
  PredictedMetrics,
  PredictionRange,
  SimpleOptimizationSuggestion,
  OptimizationType,
  SuggestionPriority,
  EffortLevel,
  SuggestionCategory,
  PredictionFeatures,
  ContentFeatures,
  HistoricalFeatures,
  AuthorPerformance,
  ContentPerformance,
  SeasonalTrend,
  AudienceHistory,
  ContextualFeatures,
  MarketCondition,
  CompetitorFeatures,
  ActualVsPredicted,
  OptimizationRecommendation,
  ImplementationGuide,
  ImplementationStep,
  CodeChange,
  ContentChange,
  DesignChange,
  RecommendationEvidence,
  DataSource,
  PerformanceComparison,
  SimilarImplementation,
  IndustryBenchmark,
  UserFeedback,
  AIAnalysisResult,
  RecommendationStatus,
  ActualImpact,
  MetricImprovement,
  BenchmarkData,
  PerformanceOptimizationConfig,
  AnalyticsProvider,
  ABTestingConfig,
  PredictionModelConfig,
  ModelConfig,
  RecommendationEngineConfig,
  PrivacySettings,
  NotificationSettings,
  PerformanceTrackingRequest,
  PerformanceTrackingResponse,
  ABTestRequest,
  ABTestResponse,
  PredictionRequest,
  PredictionResponse
} from './performance-optimization';

// Re-export database types for convenience (when generated)
// export type {
//   BlogPost as PrismaBlogPost,
//   BlogPostVersion as PrismaBlogPostVersion,
//   BlogPostStatus as PrismaBlogPostStatus,
//   ContentType,
//   ToneType,
//   ResearchDepth,
//   BlogAIConfiguration,
//   BlogTemplate as PrismaBlogTemplate,
//   ContentTypePattern,
//   ContentResearch,
// } from '../generated/prisma-client';

// Import BlogPost for interface definition
import type { BlogPost } from './blog-post';

// Enhanced generation result types
export interface EnhancedGenerateBlogResult {
  blogPost: BlogPost;
  contentTypeDetection: {
    detectedType: string;
    confidence: number;
    suggestions: string[];
  };
  seoAnalysis: {
    score: number;
    recommendations: string[];
  };
  metadata: {
    wordCount: number;
    readingTime: number;
    processingTime: number;
    modelUsed: string;
    template: string;
  };
  suggestions: {
    improvements: string[];
    nextSteps: string[];
  };
}

// Provider configuration types
export interface BlogProviderConfig {
  defaultModel?: string;
  defaultTemplate?: string;
  autoSEOOptimization?: boolean;
  contentTypeDetection?: boolean;
  persistenceEnabled?: boolean;
  researchEnabled?: boolean;
}

// Additional exports for specific requested interfaces
export type {
  // Week 7-8 Advanced Writing Features - Main interfaces
  WritingConfig,
  StyleGuideSettings,
  SEORequirements
} from './advanced-writing';

// Export requested specific interfaces
export type {
  // SEO Analysis specific interfaces
  SEOAnalysis,
  KeywordAnalysis,
  SchemaMarkupConfig,
  SEOComparison,
  SchemaValidationError,
  CustomSchemaConfig,
  SchemaRecommendation,
  CompetitorSEOData,
  ComparisonMetric,
  LinkOpportunity,
  CompetitorBasedRecommendation
} from './seo-engine';

export type {
  // Content Performance specific interfaces
  ContentPerformance,
  EngagementData,
  RankingData,
  TrafficData,
  ConversionData,
  OptimizationSuggestion,
  // Supporting types for comprehensive integration
  SocialPlatformEngagement,
  HashtagMetrics,
  HeatmapData,
  ExitPointData,
  DemographicSegment,
  TrafficSourceDetail,
  GoalCompletionData,
  FunnelStageData,
  DropOffAnalysis,
  ConversionPathData,
  AttributionData,
  SegmentConversionData,
  CTAPerformanceData,
  ImplementationStep,
  ResourceLink,
  DataPoint,
  BenchmarkComparison,
  SuccessCaseData,
  BestPracticeReference
} from './performance-optimization';

// Week 13-14 Platform Integration Framework
export * from './platform-integration';
export * from './platform-credentials';
