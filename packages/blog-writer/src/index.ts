

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
    title: 'How-to Guide',
    structure: {
      introduction: 'Brief overview of what readers will learn',
      prerequisites: 'What readers need before starting',
      steps: 'Step-by-step instructions',
      conclusion: 'Summary and next steps'
    },
    seo: {
      titlePrefix: 'How to',
      keywordPlacement: 'title-and-headings',
      metaDescription: 'Learn how to {topic} with this comprehensive step-by-step guide'
    },
    contentGuidelines: {
      tone: 'instructional',
      length: '800-1500 words',
      includeImages: true,
      includeExamples: true
    }
  },
  listicle: {
    title: 'List Article',
    structure: {
      introduction: 'Hook and overview of the list',
      items: 'Numbered or bulleted list items',
      conclusion: 'Summary and call-to-action'
    },
    seo: {
      titlePrefix: 'X Best/Top',
      keywordPlacement: 'title-and-items',
      metaDescription: 'Discover the top {number} {topic} in our comprehensive list'
    },
    contentGuidelines: {
      tone: 'engaging',
      length: '600-1200 words',
      includeImages: true,
      includeNumbers: true
    }
  },
  comparison: {
    title: 'Comparison Article',
    structure: {
      introduction: 'Overview of items being compared',
      criteria: 'Comparison criteria and methodology',
      comparison: 'Side-by-side analysis',
      verdict: 'Recommendation and conclusion'
    },
    seo: {
      titlePrefix: 'A vs B',
      keywordPlacement: 'title-and-headings',
      metaDescription: 'Compare {item1} vs {item2} to find the best choice for your needs'
    },
    contentGuidelines: {
      tone: 'analytical',
      length: '1000-2000 words',
      includeTable: true,
      includeProsCons: true
    }
  },
  tutorial: {
    title: 'Tutorial',
    structure: {
      overview: 'What the tutorial covers',
      prerequisites: 'Required knowledge and tools',
      lessons: 'Sequential learning modules',
      practice: 'Exercises and examples'
    },
    seo: {
      titlePrefix: 'Tutorial',
      keywordPlacement: 'throughout',
      metaDescription: 'Master {topic} with our comprehensive tutorial and hands-on examples'
    },
    contentGuidelines: {
      tone: 'educational',
      length: '1500-3000 words',
      includeCode: true,
      includeExercises: true
    }
  },
  news: {
    title: 'News Article',
    structure: {
      headline: 'Attention-grabbing title',
      lead: 'Key facts and summary',
      body: 'Detailed information and context',
      conclusion: 'Implications and future outlook'
    },
    seo: {
      titlePrefix: 'Breaking',
      keywordPlacement: 'title-and-lead',
      metaDescription: 'Latest news on {topic} - get all the details and analysis'
    },
    contentGuidelines: {
      tone: 'journalistic',
      length: '400-800 words',
      includeQuotes: true,
      includeSources: true
    }
  },
  review: {
    title: 'Product Review',
    structure: {
      overview: 'Product introduction and key features',
      testing: 'Hands-on experience and methodology',
      analysis: 'Pros, cons, and performance evaluation',
      verdict: 'Final rating and recommendation'
    },
    seo: {
      titlePrefix: 'Review',
      keywordPlacement: 'title-and-headings',
      metaDescription: 'Honest review of {product} - features, performance, and value analysis'
    },
    contentGuidelines: {
      tone: 'objective',
      length: '1000-1800 words',
      includeRating: true,
      includeImages: true
    }
  },
  guide: {
    title: 'Comprehensive Guide',
    structure: {
      introduction: 'Guide scope and objectives',
      fundamentals: 'Basic concepts and principles',
      advanced: 'In-depth techniques and strategies',
      resources: 'Additional tools and references'
    },
    seo: {
      titlePrefix: 'Complete Guide to',
      keywordPlacement: 'throughout',
      metaDescription: 'Everything you need to know about {topic} in this complete guide'
    },
    contentGuidelines: {
      tone: 'comprehensive',
      length: '2000-4000 words',
      includeTableOfContents: true,
      includeResources: true
    }
  },
  'case-study': {
    title: 'Case Study',
    structure: {
      background: 'Context and challenge overview',
      approach: 'Strategy and methodology used',
      implementation: 'Execution and process details',
      results: 'Outcomes and key learnings'
    },
    seo: {
      titlePrefix: 'Case Study',
      keywordPlacement: 'title-and-sections',
      metaDescription: 'Real-world case study: How {company/person} achieved {result}'
    },
    contentGuidelines: {
      tone: 'analytical',
      length: '1200-2000 words',
      includeData: true,
      includeVisuals: true
    }
  },
  opinion: {
    title: 'Opinion Piece',
    structure: {
      stance: 'Clear position statement',
      arguments: 'Supporting evidence and reasoning',
      counterpoints: 'Addressing opposing views',
      conclusion: 'Reinforced position and call-to-action'
    },
    seo: {
      titlePrefix: 'Why',
      keywordPlacement: 'title-and-arguments',
      metaDescription: 'My take on {topic} - why {position} and what it means'
    },
    contentGuidelines: {
      tone: 'persuasive',
      length: '800-1500 words',
      includePersonalExperience: true,
      includeEvidence: true
    }
  },
  interview: {
    title: 'Interview',
    structure: {
      introduction: 'Subject background and interview context',
      questions: 'Q&A format with key insights',
      highlights: 'Most important takeaways',
      conclusion: 'Contact information and next steps'
    },
    seo: {
      titlePrefix: 'Interview with',
      keywordPlacement: 'title-and-highlights',
      metaDescription: 'Exclusive interview with {person} about {topic} - insights and advice'
    },
    contentGuidelines: {
      tone: 'conversational',
      length: '1000-2000 words',
      includeQuotes: true,
      includeBio: true
    }
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
