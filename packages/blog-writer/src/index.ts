

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
