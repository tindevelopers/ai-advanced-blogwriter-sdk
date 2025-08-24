// Core type exports
export type { BlogPost, BlogPostMetadata, BlogPostContent, BlogPostVersion } from './blog-post';
export type { BlogTemplate } from './blog-config';
export type { AIConfig as BlogAIConfig } from './base-config';

// Advanced Writing Types
export type {
  ContentOutline,
  OutlineSection,
  ContentSection,
  BrandVoiceProfile,
  ToneAnalysis,
  FactCheck,
  OptimizationSuggestion,
  StyleCheck,
  StyleViolation,
  StyleSuggestion,
  ToneAnalysisRequest,
  StyleCheckRequest,
} from './advanced-writing';

export { ToneCategory, SectionType, StyleCheckType, StyleSeverity } from './advanced-writing';

// Strategy Engine Types
export type {
  ContentStrategy,
  ContentBrief,
  TopicResearch,
  EditorialCalendar,
  CompetitorAnalysis,
  Priority,
} from './strategy-engine';

// Research Types
export type {
  ContentResearchConfig,
  ContentResearchResult,
  KeywordResearchData,
  CompetitorContent,
  ResearchSource,
  TopicResearchOptions,
} from './research';

// SEO Types
export type {
  SEOAnalysis,
  SEORecommendation,
  KeywordAnalysis,
  SEOOptimizationOptions,
  SEOAnalysisRequest,
  SEOAnalysisResult,
  KeywordResearchRequest,
  KeywordResearchResponse,
} from './seo';

// Platform Integration Types
export type {
  PlatformCredentials,
  PlatformAdapter,
  MultiPlatformPublishOptions,
} from './platform-integration';

// Platform Credentials
export type {
  ShopifyCredentials,
  WebflowCredentials,
  WordPressCredentials,
  MediumCredentials,
  LinkedInCredentials,
} from './platform-credentials';

// Performance and Optimization Types
export type {
  PerformanceTrackingRequest,
  PerformanceTrackingResponse,
  ABTestConfig,
  ABTestResult,
  ContentVariant,
  PredictionRequest,
  PredictionResponse,
  EngagementPrediction,
  OptimizationRequest,
  OptimizationRecommendation,
} from './performance-optimization';

// Utility Functions
export { createPlatformCredentials } from './platform-credentials';
