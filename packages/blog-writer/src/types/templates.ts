import type { BlogTemplate } from './blog-config';

/**
 * Blog template configuration
 */
export interface BlogTemplateConfig {
  /** Template type */
  type: BlogTemplate;

  /** Template name */
  name: string;

  /** Template description */
  description: string;

  /** Template structure */
  structure: BlogTemplateSection[];

  /** Template variables */
  variables?: Record<string, BlogTemplateVariable>;

  /** SEO optimization settings for this template */
  seoSettings?: {
    /** Recommended word count range */
    wordCount?: { min: number; max: number };
    /** Typical keyword density */
    keywordDensity?: { min: number; max: number };
    /** Recommended headings structure */
    headingsStructure?: string[];
  };

  /** Content guidelines for this template */
  guidelines?: {
    /** Writing tone */
    tone?: string;
    /** Style requirements */
    style?: string;
    /** Must-have sections */
    requiredSections?: string[];
    /** Optional sections */
    optionalSections?: string[];
  };
}

/**
 * Template section definition
 */
export interface BlogTemplateSection {
  /** Section identifier */
  id: string;

  /** Section title */
  title: string;

  /** Section description */
  description?: string;

  /** Section order */
  order: number;

  /** Whether section is required */
  required: boolean;

  /** Section content type */
  contentType:
    | 'paragraph'
    | 'list'
    | 'heading'
    | 'image'
    | 'code'
    | 'quote'
    | 'table';

  /** Section prompt/instructions */
  prompt?: string;

  /** Expected word count for this section */
  wordCount?: { min: number; max: number };

  /** Sub-sections */
  subsections?: BlogTemplateSection[];
}

/**
 * Template variable definition
 */
export interface BlogTemplateVariable {
  /** Variable name */
  name: string;

  /** Variable type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';

  /** Variable description */
  description: string;

  /** Whether variable is required */
  required: boolean;

  /** Default value */
  default?: any;

  /** Validation rules */
  validation?: {
    /** Minimum length/value */
    min?: number;
    /** Maximum length/value */
    max?: number;
    /** Pattern to match */
    pattern?: string;
    /** Allowed values */
    enum?: any[];
  };

  /** Example values */
  examples?: any[];
}

/**
 * Template execution context
 */
export interface BlogTemplateContext {
  /** Template configuration */
  template: BlogTemplateConfig;

  /** Variable values */
  variables: Record<string, any>;

  /** Target keywords */
  keywords?: string[];

  /** Content constraints */
  constraints?: {
    /** Word count limits */
    wordCount?: { min: number; max: number };
    /** Tone requirements */
    tone?: string;
    /** Style requirements */
    style?: string;
  };

  /** Research data */
  research?: {
    /** Topic research */
    topic?: any;
    /** Competitor analysis */
    competitors?: any[];
    /** Trending topics */
    trends?: string[];
  };
}

/**
 * Pre-defined blog templates
 */
export const BLOG_TEMPLATES: Record<BlogTemplate, BlogTemplateConfig> = {
  howto: {
    type: 'howto',
    name: 'How-To Guide',
    description: 'Step-by-step instructional content',
    structure: [
      {
        id: 'introduction',
        title: 'Introduction',
        order: 1,
        required: true,
        contentType: 'paragraph',
        prompt:
          'Write an engaging introduction that explains what the reader will learn and why it matters.',
        wordCount: { min: 100, max: 200 },
      },
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        order: 2,
        required: false,
        contentType: 'list',
        prompt: 'List any tools, skills, or knowledge needed before starting.',
        wordCount: { min: 50, max: 150 },
      },
      {
        id: 'steps',
        title: 'Step-by-Step Instructions',
        order: 3,
        required: true,
        contentType: 'list',
        prompt: 'Provide clear, numbered steps with detailed explanations.',
        wordCount: { min: 500, max: 1500 },
      },
      {
        id: 'tips',
        title: 'Tips and Best Practices',
        order: 4,
        required: false,
        contentType: 'list',
        prompt: 'Share helpful tips and best practices.',
        wordCount: { min: 100, max: 300 },
      },
      {
        id: 'conclusion',
        title: 'Conclusion',
        order: 5,
        required: true,
        contentType: 'paragraph',
        prompt: 'Summarize what was covered and next steps.',
        wordCount: { min: 50, max: 150 },
      },
    ],
    seoSettings: {
      wordCount: { min: 800, max: 2500 },
      keywordDensity: { min: 0.01, max: 0.03 },
    },
  },

  listicle: {
    type: 'listicle',
    name: 'Listicle',
    description: 'List-based article with numbered or bulleted items',
    structure: [
      {
        id: 'introduction',
        title: 'Introduction',
        order: 1,
        required: true,
        contentType: 'paragraph',
        prompt: 'Write a compelling introduction that previews the list items.',
        wordCount: { min: 100, max: 250 },
      },
      {
        id: 'list-items',
        title: 'List Items',
        order: 2,
        required: true,
        contentType: 'list',
        prompt: 'Create engaging list items with explanations and examples.',
        wordCount: { min: 800, max: 2000 },
      },
      {
        id: 'conclusion',
        title: 'Conclusion',
        order: 3,
        required: true,
        contentType: 'paragraph',
        prompt: 'Wrap up with key takeaways and call to action.',
        wordCount: { min: 100, max: 200 },
      },
    ],
    seoSettings: {
      wordCount: { min: 1000, max: 3000 },
      keywordDensity: { min: 0.01, max: 0.025 },
    },
  },

  comparison: {
    type: 'comparison',
    name: 'Comparison',
    description: 'Compare two or more options, products, or concepts',
    structure: [
      {
        id: 'introduction',
        title: 'Introduction',
        order: 1,
        required: true,
        contentType: 'paragraph',
        prompt:
          'Introduce what is being compared and why the comparison matters.',
        wordCount: { min: 150, max: 300 },
      },
      {
        id: 'comparison-table',
        title: 'Comparison Overview',
        order: 2,
        required: false,
        contentType: 'table',
        prompt: 'Create a comparison table highlighting key differences.',
        wordCount: { min: 100, max: 300 },
      },
      {
        id: 'detailed-comparison',
        title: 'Detailed Analysis',
        order: 3,
        required: true,
        contentType: 'paragraph',
        prompt: 'Provide detailed analysis of each option with pros and cons.',
        wordCount: { min: 800, max: 1500 },
      },
      {
        id: 'recommendation',
        title: 'Recommendation',
        order: 4,
        required: true,
        contentType: 'paragraph',
        prompt: 'Provide clear recommendations based on different use cases.',
        wordCount: { min: 200, max: 400 },
      },
    ],
    seoSettings: {
      wordCount: { min: 1200, max: 2500 },
      keywordDensity: { min: 0.01, max: 0.025 },
    },
  },

  tutorial: {
    type: 'tutorial',
    name: 'Tutorial',
    description: 'In-depth educational content with examples',
    structure: [
      {
        id: 'introduction',
        title: 'Introduction',
        order: 1,
        required: true,
        contentType: 'paragraph',
        prompt: 'Introduce the topic and learning objectives.',
        wordCount: { min: 150, max: 300 },
      },
      {
        id: 'concepts',
        title: 'Key Concepts',
        order: 2,
        required: true,
        contentType: 'paragraph',
        prompt: 'Explain fundamental concepts and terminology.',
        wordCount: { min: 300, max: 600 },
      },
      {
        id: 'examples',
        title: 'Examples and Demonstrations',
        order: 3,
        required: true,
        contentType: 'paragraph',
        prompt: 'Provide practical examples with code or screenshots.',
        wordCount: { min: 600, max: 1200 },
      },
      {
        id: 'exercises',
        title: 'Practice Exercises',
        order: 4,
        required: false,
        contentType: 'list',
        prompt: 'Suggest hands-on exercises for practice.',
        wordCount: { min: 200, max: 400 },
      },
      {
        id: 'conclusion',
        title: 'Conclusion and Next Steps',
        order: 5,
        required: true,
        contentType: 'paragraph',
        prompt: 'Summarize learning and suggest next steps.',
        wordCount: { min: 150, max: 300 },
      },
    ],
    seoSettings: {
      wordCount: { min: 1500, max: 3500 },
      keywordDensity: { min: 0.01, max: 0.02 },
    },
  },

  news: {
    type: 'news',
    name: 'News Article',
    description: 'News-style article with current information',
    structure: [
      {
        id: 'headline',
        title: 'Headline and Lead',
        order: 1,
        required: true,
        contentType: 'paragraph',
        prompt:
          'Write attention-grabbing headline and lead paragraph with key information.',
        wordCount: { min: 100, max: 200 },
      },
      {
        id: 'body',
        title: 'Main Content',
        order: 2,
        required: true,
        contentType: 'paragraph',
        prompt: 'Provide detailed information in inverted pyramid structure.',
        wordCount: { min: 400, max: 1000 },
      },
      {
        id: 'quotes',
        title: 'Quotes and Sources',
        order: 3,
        required: false,
        contentType: 'quote',
        prompt: 'Include relevant quotes from sources and experts.',
        wordCount: { min: 100, max: 300 },
      },
      {
        id: 'background',
        title: 'Background Information',
        order: 4,
        required: false,
        contentType: 'paragraph',
        prompt: 'Provide context and background information.',
        wordCount: { min: 200, max: 500 },
      },
    ],
    seoSettings: {
      wordCount: { min: 600, max: 2000 },
      keywordDensity: { min: 0.008, max: 0.02 },
    },
  },

  review: {
    type: 'review',
    name: 'Review',
    description: 'Product, service, or content review',
    structure: [
      {
        id: 'introduction',
        title: 'Introduction',
        order: 1,
        required: true,
        contentType: 'paragraph',
        prompt: 'Introduce what is being reviewed and initial impressions.',
        wordCount: { min: 150, max: 250 },
      },
      {
        id: 'features',
        title: 'Key Features',
        order: 2,
        required: true,
        contentType: 'list',
        prompt: 'Detail the main features and functionality.',
        wordCount: { min: 300, max: 600 },
      },
      {
        id: 'pros-cons',
        title: 'Pros and Cons',
        order: 3,
        required: true,
        contentType: 'list',
        prompt: 'List the advantages and disadvantages.',
        wordCount: { min: 200, max: 400 },
      },
      {
        id: 'verdict',
        title: 'Final Verdict',
        order: 4,
        required: true,
        contentType: 'paragraph',
        prompt: 'Provide overall assessment and recommendation.',
        wordCount: { min: 150, max: 300 },
      },
    ],
    seoSettings: {
      wordCount: { min: 800, max: 2000 },
      keywordDensity: { min: 0.01, max: 0.025 },
    },
  },

  guide: {
    type: 'guide',
    name: 'Comprehensive Guide',
    description: 'Complete guide covering all aspects of a topic',
    structure: [
      {
        id: 'introduction',
        title: 'Introduction',
        order: 1,
        required: true,
        contentType: 'paragraph',
        prompt:
          'Comprehensive introduction to the topic and what the guide covers.',
        wordCount: { min: 200, max: 400 },
      },
      {
        id: 'fundamentals',
        title: 'Fundamentals',
        order: 2,
        required: true,
        contentType: 'paragraph',
        prompt: 'Cover the basic concepts and foundational knowledge.',
        wordCount: { min: 500, max: 1000 },
      },
      {
        id: 'advanced',
        title: 'Advanced Topics',
        order: 3,
        required: false,
        contentType: 'paragraph',
        prompt: 'Discuss more complex aspects and advanced techniques.',
        wordCount: { min: 600, max: 1200 },
      },
      {
        id: 'resources',
        title: 'Additional Resources',
        order: 4,
        required: false,
        contentType: 'list',
        prompt: 'Provide links to additional resources and further reading.',
        wordCount: { min: 100, max: 300 },
      },
    ],
    seoSettings: {
      wordCount: { min: 2000, max: 5000 },
      keywordDensity: { min: 0.008, max: 0.02 },
    },
  },

  'case-study': {
    type: 'case-study',
    name: 'Case Study',
    description: 'Real-world example and analysis',
    structure: [
      {
        id: 'overview',
        title: 'Overview',
        order: 1,
        required: true,
        contentType: 'paragraph',
        prompt: 'Provide overview of the case study and key metrics.',
        wordCount: { min: 150, max: 300 },
      },
      {
        id: 'challenge',
        title: 'Challenge',
        order: 2,
        required: true,
        contentType: 'paragraph',
        prompt: 'Describe the problem or challenge that needed solving.',
        wordCount: { min: 200, max: 400 },
      },
      {
        id: 'solution',
        title: 'Solution',
        order: 3,
        required: true,
        contentType: 'paragraph',
        prompt: 'Explain the approach and solution implemented.',
        wordCount: { min: 400, max: 800 },
      },
      {
        id: 'results',
        title: 'Results',
        order: 4,
        required: true,
        contentType: 'paragraph',
        prompt: 'Present the outcomes and measurable results.',
        wordCount: { min: 200, max: 400 },
      },
      {
        id: 'lessons',
        title: 'Lessons Learned',
        order: 5,
        required: false,
        contentType: 'list',
        prompt: 'Share key insights and lessons from the experience.',
        wordCount: { min: 150, max: 300 },
      },
    ],
    seoSettings: {
      wordCount: { min: 1200, max: 2500 },
      keywordDensity: { min: 0.01, max: 0.025 },
    },
  },

  opinion: {
    type: 'opinion',
    name: 'Opinion Piece',
    description: 'Editorial or opinion article',
    structure: [
      {
        id: 'hook',
        title: 'Opening Hook',
        order: 1,
        required: true,
        contentType: 'paragraph',
        prompt: 'Start with a compelling hook and state your position clearly.',
        wordCount: { min: 100, max: 200 },
      },
      {
        id: 'arguments',
        title: 'Supporting Arguments',
        order: 2,
        required: true,
        contentType: 'paragraph',
        prompt: 'Present evidence and reasoning that supports your viewpoint.',
        wordCount: { min: 600, max: 1200 },
      },
      {
        id: 'counterpoints',
        title: 'Counterarguments',
        order: 3,
        required: false,
        contentType: 'paragraph',
        prompt:
          'Address opposing viewpoints and explain why your position is stronger.',
        wordCount: { min: 200, max: 400 },
      },
      {
        id: 'conclusion',
        title: 'Conclusion',
        order: 4,
        required: true,
        contentType: 'paragraph',
        prompt:
          'Reinforce your main argument and call for action or consideration.',
        wordCount: { min: 150, max: 300 },
      },
    ],
    seoSettings: {
      wordCount: { min: 1000, max: 2500 },
      keywordDensity: { min: 0.01, max: 0.02 },
    },
  },

  interview: {
    type: 'interview',
    name: 'Interview',
    description: 'Q&A format interview content',
    structure: [
      {
        id: 'introduction',
        title: 'Introduction',
        order: 1,
        required: true,
        contentType: 'paragraph',
        prompt: 'Introduce the interviewee and context for the interview.',
        wordCount: { min: 150, max: 300 },
      },
      {
        id: 'qa',
        title: 'Question and Answer',
        order: 2,
        required: true,
        contentType: 'paragraph',
        prompt:
          'Present the interview in Q&A format with insightful questions.',
        wordCount: { min: 800, max: 2000 },
      },
      {
        id: 'key-insights',
        title: 'Key Insights',
        order: 3,
        required: false,
        contentType: 'list',
        prompt: 'Highlight the most important takeaways from the interview.',
        wordCount: { min: 200, max: 400 },
      },
      {
        id: 'bio',
        title: 'About the Interviewee',
        order: 4,
        required: false,
        contentType: 'paragraph',
        prompt: 'Provide background information about the interviewee.',
        wordCount: { min: 100, max: 200 },
      },
    ],
    seoSettings: {
      wordCount: { min: 1200, max: 3000 },
      keywordDensity: { min: 0.008, max: 0.02 },
    },
  },
};
