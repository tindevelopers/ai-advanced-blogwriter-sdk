
// Core functionality
export * from './core/blog-generator';
export * from './core/prompts';
export * from './core/validation';

// SEO optimization
export * from './seo/seo-optimizer';

// Content research
export * from './research/content-researcher';

// Types
export * from './types';

// Templates (re-export for convenience)
export { BLOG_TEMPLATES } from './types/templates';

// Version
export const VERSION = '0.1.0';

// Default configuration
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
};
