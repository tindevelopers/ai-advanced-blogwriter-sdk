// Core exports
export { validateBlogPost } from './core/validation';
export type { BlogPostValidation as BlogValidationResult } from './core/validation';

// Type exports
export type { BlogPost } from './types/blog-post';
export type { BlogTemplate } from './types/blog-config';

// Platform Adapters (Individual exports)
export { ShopifyAdapter } from './core/platform-adapters/shopify-adapter';
export { WebflowAdapter } from './core/platform-adapters/webflow-adapter';

// Platform credential types and utilities
export type {
  ShopifyCredentials,
  ShopifyConfig,
  WebflowCredentials,
  WebflowConfig,
} from './types/platform-credentials';

export { createPlatformCredentials } from './types/platform-credentials';

// Version
export const VERSION = '0.1.0';

// Blog Templates
export const BLOG_TEMPLATES = {
  howto: {
    type: 'howto',
    name: 'How-to Guide',
    description:
      'Step-by-step instructional content to help readers accomplish specific tasks',
    structure: [
      {
        id: 'introduction',
        title: 'Introduction',
        order: 1,
        required: true,
        contentType: 'text',
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        order: 2,
        required: false,
        contentType: 'list',
      },
      {
        id: 'steps',
        title: 'Step-by-step Instructions',
        order: 3,
        required: true,
        contentType: 'steps',
      },
      {
        id: 'conclusion',
        title: 'Conclusion',
        order: 4,
        required: true,
        contentType: 'text',
      },
    ],
  },
  listicle: {
    type: 'listicle',
    name: 'List Article',
    description: 'Numbered or bulleted list format for easy consumption',
    structure: [
      {
        id: 'introduction',
        title: 'Introduction',
        order: 1,
        required: true,
        contentType: 'text',
      },
      {
        id: 'items',
        title: 'List Items',
        order: 2,
        required: true,
        contentType: 'list',
      },
      {
        id: 'conclusion',
        title: 'Conclusion',
        order: 3,
        required: true,
        contentType: 'text',
      },
    ],
  },
  comparison: {
    type: 'comparison',
    name: 'Comparison Article',
    description: 'Side-by-side analysis of products, services, or concepts',
    structure: [
      {
        id: 'introduction',
        title: 'Introduction',
        order: 1,
        required: true,
        contentType: 'text',
      },
      {
        id: 'criteria',
        title: 'Comparison Criteria',
        order: 2,
        required: true,
        contentType: 'table',
      },
      {
        id: 'comparison',
        title: 'Detailed Comparison',
        order: 3,
        required: true,
        contentType: 'comparison',
      },
      {
        id: 'verdict',
        title: 'Final Verdict',
        order: 4,
        required: true,
        contentType: 'text',
      },
    ],
  },
  tutorial: {
    type: 'tutorial',
    name: 'Tutorial',
    description: 'Comprehensive learning guide with examples and exercises',
    structure: [
      {
        id: 'overview',
        title: 'Overview',
        order: 1,
        required: true,
        contentType: 'text',
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        order: 2,
        required: false,
        contentType: 'list',
      },
      {
        id: 'lessons',
        title: 'Lessons',
        order: 3,
        required: true,
        contentType: 'steps',
      },
      {
        id: 'practice',
        title: 'Practice Exercises',
        order: 4,
        required: false,
        contentType: 'exercises',
      },
    ],
  },
  news: {
    type: 'news',
    name: 'News Article',
    description: 'Timely reporting on current events and developments',
    structure: [
      {
        id: 'headline',
        title: 'Headline',
        order: 1,
        required: true,
        contentType: 'headline',
      },
      {
        id: 'lead',
        title: 'Lead Paragraph',
        order: 2,
        required: true,
        contentType: 'text',
      },
      {
        id: 'body',
        title: 'Article Body',
        order: 3,
        required: true,
        contentType: 'text',
      },
      {
        id: 'conclusion',
        title: 'Conclusion',
        order: 4,
        required: false,
        contentType: 'text',
      },
    ],
  },
  review: {
    type: 'review',
    name: 'Product Review',
    description:
      'Comprehensive evaluation and analysis of products or services',
    structure: [
      {
        id: 'overview',
        title: 'Product Overview',
        order: 1,
        required: true,
        contentType: 'text',
      },
      {
        id: 'testing',
        title: 'Testing Methodology',
        order: 2,
        required: true,
        contentType: 'text',
      },
      {
        id: 'analysis',
        title: 'Performance Analysis',
        order: 3,
        required: true,
        contentType: 'pros-cons',
      },
      {
        id: 'verdict',
        title: 'Final Verdict',
        order: 4,
        required: true,
        contentType: 'rating',
      },
    ],
  },
  guide: {
    type: 'guide',
    name: 'Comprehensive Guide',
    description: 'In-depth guide covering all aspects of a topic',
    structure: [
      {
        id: 'introduction',
        title: 'Guide Introduction',
        order: 1,
        required: true,
        contentType: 'text',
      },
      {
        id: 'fundamentals',
        title: 'Fundamentals',
        order: 2,
        required: true,
        contentType: 'text',
      },
      {
        id: 'advanced',
        title: 'Advanced Topics',
        order: 3,
        required: true,
        contentType: 'text',
      },
      {
        id: 'resources',
        title: 'Additional Resources',
        order: 4,
        required: false,
        contentType: 'resources',
      },
    ],
  },
  'case-study': {
    type: 'case-study',
    name: 'Case Study',
    description: 'Real-world analysis and examination of specific examples',
    structure: [
      {
        id: 'background',
        title: 'Background',
        order: 1,
        required: true,
        contentType: 'text',
      },
      {
        id: 'approach',
        title: 'Approach & Methodology',
        order: 2,
        required: true,
        contentType: 'text',
      },
      {
        id: 'implementation',
        title: 'Implementation Details',
        order: 3,
        required: true,
        contentType: 'steps',
      },
      {
        id: 'results',
        title: 'Results & Learnings',
        order: 4,
        required: true,
        contentType: 'metrics',
      },
    ],
  },
  opinion: {
    type: 'opinion',
    name: 'Opinion Piece',
    description: 'Personal viewpoint and analysis on current topics',
    structure: [
      {
        id: 'stance',
        title: 'Position Statement',
        order: 1,
        required: true,
        contentType: 'text',
      },
      {
        id: 'arguments',
        title: 'Supporting Arguments',
        order: 2,
        required: true,
        contentType: 'arguments',
      },
      {
        id: 'counterpoints',
        title: 'Counter-arguments',
        order: 3,
        required: false,
        contentType: 'text',
      },
      {
        id: 'conclusion',
        title: 'Final Thoughts',
        order: 4,
        required: true,
        contentType: 'text',
      },
    ],
  },
  interview: {
    type: 'interview',
    name: 'Interview',
    description: 'Q&A format conversation with subject matter experts',
    structure: [
      {
        id: 'introduction',
        title: 'Subject Introduction',
        order: 1,
        required: true,
        contentType: 'text',
      },
      {
        id: 'questions',
        title: 'Interview Questions',
        order: 2,
        required: true,
        contentType: 'qa',
      },
      {
        id: 'highlights',
        title: 'Key Takeaways',
        order: 3,
        required: true,
        contentType: 'highlights',
      },
      {
        id: 'conclusion',
        title: 'Wrap-up',
        order: 4,
        required: false,
        contentType: 'text',
      },
    ],
  },
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
