

// Core functionality
export * from './core/blog-generator';
export * from './core/prompts';
export * from './core/validation';

// Week 3-4 Content Management Foundation
export * from './core/version-manager';
export * from './core/workflow-manager';
export * from './core/metadata-manager';
export * from './core/categorization-manager';
export * from './core/notification-manager';
export * from './core/content-management-service';

// Week 5-6 Content Strategy Engine
export * from './core/topic-research-service';
export * from './core/editorial-calendar-service';
export * from './core/competitor-analysis-service';
export * from './core/content-brief-service';
export * from './core/content-strategy-service';

// Week 7-8 Advanced Writing Features
export * from './core/multi-section-generation-service';
export * from './core/tone-style-consistency-service';
export * from './core/fact-checking-service';
export * from './core/content-optimization-service';
export * from './core/advanced-writing-service';

// Week 9-10 SEO Analysis Engine
export * from './core/dataforseo-service';
export * from './core/keyword-research-service';
export * from './core/onpage-seo-service';
export * from './core/meta-schema-service';
export * from './core/readability-scoring-service';
export * from './core/seo-analysis-service';

// Week 11-12 Performance Optimization
export * from './core/performance-tracking-service';
export * from './core/ab-testing-service';
export * from './core/engagement-prediction-service';
export * from './core/optimization-recommendation-engine';

// Week 13-14 Platform Integration Framework
export * from './core/base-platform-adapter';
export * from './core/multi-platform-publisher';
export * from './core/content-formatting-service';
export * from './core/platform-scheduling-service';
export * from './core/platform-adapters';

// SEO optimization
export * from './seo/seo-optimizer';

// Content research
export * from './research/content-researcher';

// Database layer
export * from './database';

// Provider system
export * from './providers';

// Types
export * from './types';

// Templates (re-export for convenience)
export { BLOG_TEMPLATES } from './types/templates';

// Version
export const VERSION = '0.1.0';

// Default configuration with enhanced features
export const DEFAULT_BLOG_CONFIG = {
  seo: {
    keywordDensity: 0.02,
    minLength: 300,
    maxLength: 3000,
    optimizeMetaDescription: true,
    generateAltText: true,
  },
  quality: {
    readingLevel: 8,
    tone: 'professional' as const,
    style: 'blog' as const,
    includeSources: true,
    factCheck: false,
  },
  research: {
    enabled: true,
    depth: 'detailed' as const,
    includeTrends: true,
    competitorAnalysis: false,
  },
  database: {
    persistence: true,
    versioning: true,
    analytics: true,
  },
  contentType: {
    autoDetection: true,
    aiPowered: true,
    routingEnabled: true,
  },
};

// Enhanced blog generation function with new features
export { generateEnhancedBlog } from './core/enhanced-blog-generator';
