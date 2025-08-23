

// Core exports
export { validateBlogPost } from './core/blog-validation';
export type { BlogValidationResult } from './core/blog-validation';

// Platform Adapters (Individual exports)
export { ShopifyAdapter } from './core/platform-adapters/shopify-adapter';
export { WebflowAdapter } from './core/platform-adapters/webflow-adapter';

// Platform credential types and utilities
export type {
  ShopifyCredentials,
  ShopifyConfig,
  WebflowCredentials,
  WebflowConfig
} from './types/platform-credentials';

export { createPlatformCredentials } from './types/platform-credentials';

// Version
export const VERSION = '0.1.0';

// Blog Templates
export const BLOG_TEMPLATES = {
  howto: {
    type: 'howto',
    name: 'How-to Guide',
    description: 'Step-by-step instructional content to help readers accomplish specific tasks',
    structure: [
      { id: 'introduction', title: 'Introduction', order: 1, required: true },
      { id: 'prerequisites', title: 'Prerequisites', order: 2, required: false },
      { id: 'steps', title: 'Step-by-step Instructions', order: 3, required: true },
      { id: 'conclusion', title: 'Conclusion', order: 4, required: true }
    ]
  },
  listicle: {
    type: 'listicle',
    name: 'List Article',
    description: 'Numbered or bulleted list format for easy consumption',
    structure: [
      { id: 'introduction', title: 'Introduction', order: 1, required: true },
      { id: 'items', title: 'List Items', order: 2, required: true },
      { id: 'conclusion', title: 'Conclusion', order: 3, required: true }
    ]
  },
  comparison: {
    type: 'comparison',
    name: 'Comparison Article',
    description: 'Side-by-side analysis of products, services, or concepts',
    structure: [
      { id: 'introduction', title: 'Introduction', order: 1, required: true },
      { id: 'criteria', title: 'Comparison Criteria', order: 2, required: true },
      { id: 'comparison', title: 'Detailed Comparison', order: 3, required: true },
      { id: 'verdict', title: 'Final Verdict', order: 4, required: true }
    ]
  },
  tutorial: {
    type: 'tutorial',
    name: 'Tutorial',
    description: 'Comprehensive learning guide with examples and exercises',
    structure: [
      { id: 'overview', title: 'Overview', order: 1, required: true },
      { id: 'prerequisites', title: 'Prerequisites', order: 2, required: false },
      { id: 'lessons', title: 'Lessons', order: 3, required: true },
      { id: 'practice', title: 'Practice Exercises', order: 4, required: false }
    ]
  },
  news: {
    type: 'news',
    name: 'News Article',
    description: 'Timely reporting on current events and developments',
    structure: [
      { id: 'headline', title: 'Headline', order: 1, required: true },
      { id: 'lead', title: 'Lead Paragraph', order: 2, required: true },
      { id: 'body', title: 'Article Body', order: 3, required: true },
      { id: 'conclusion', title: 'Conclusion', order: 4, required: false }
    ]
  }
};

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
// export { generateEnhancedBlog } from './core/enhanced-blog-generator';
