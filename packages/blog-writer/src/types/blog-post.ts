/**
 * Blog post status - core statuses as specified in requirements
 */
export type BlogPostStatus = 'draft' | 'published' | 'archived';

/**
 * Extended blog post status with additional workflow states
 */
export type ExtendedBlogPostStatus = BlogPostStatus | 'review' | 'scheduled';

/**
 * Post metadata as specified in the requirements
 */
export interface PostMetadata {
  /** SEO title */
  title?: string;
  /** Meta description */
  description?: string;
  /** Keywords for SEO */
  keywords?: string[];
  /** Author information */
  author?: string;
  /** Category */
  category?: string;
  /** Tags */
  tags?: string[];
  /** Featured image URL */
  featuredImage?: string;
  /** Publishing date */
  publishDate?: Date;
  /** Additional custom metadata */
  [key: string]: any;
}

/**
 * Content version for version history as specified in the requirements
 */
export interface ContentVersion {
  /** Version identifier */
  id: string;
  /** Version number or label */
  version: string;
  /** Content at this version */
  content: string;
  /** Metadata at this version */
  metadata: PostMetadata;
  /** Creation timestamp */
  createdAt: Date;
  /** Author of this version */
  createdBy?: string;
  /** Change description */
  changeNote?: string;
}

/**
 * Blog post interface as specified in the requirements
 * This interface provides the exact structure requested in the specifications.
 */
export interface RequiredBlogPost {
  /** Unique identifier */
  id: string;
  /** Blog post title */
  title: string;
  /** Blog post content */
  content: string;
  /** Post metadata */
  metadata: PostMetadata;
  /** Current status */
  status: BlogPostStatus;
  /** Version history */
  versions: ContentVersion[];
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Extended blog post metadata for advanced use cases
 */
export interface BlogPostMetadata {
  /** Unique identifier */
  id: string;

  /** Post title */
  title: string;

  /** Meta description for SEO */
  metaDescription?: string;

  /** URL slug */
  slug: string;

  /** Author information */
  author?: {
    name: string;
    email?: string;
    bio?: string;
  };

  /** Publishing information */
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  scheduledAt?: Date;

  /** Content classification */
  category?: string;
  tags?: string[];

  /** SEO and optimization */
  seo: {
    /** Primary focus keyword */
    focusKeyword?: string;
    /** Additional keywords */
    keywords?: string[];
    /** Keyword density */
    keywordDensity?: number;
    /** SEO score (0-100) */
    seoScore?: number;
    /** Readability score */
    readabilityScore?: number;
    /** Content length in words */
    wordCount: number;
  };

  /** Social media and sharing */
  social?: {
    /** Open Graph title */
    ogTitle?: string;
    /** Open Graph description */
    ogDescription?: string;
    /** Open Graph image URL */
    ogImage?: string;
    /** Twitter card type */
    twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
    /** Twitter image URL */
    twitterImage?: string;
  };

  /** Content settings */
  settings: {
    /** Allow comments */
    allowComments?: boolean;
    /** Featured post */
    featured?: boolean;
    /** Content language */
    language?: string;
    /** Content type/template used */
    template?: string;
    /** Estimated reading time in minutes */
    readingTime?: number;
  };
}

/**
 * Blog post content structure
 */
export interface BlogPostContent {
  /** Main content in markdown or HTML */
  content: string;

  /** Content excerpts */
  excerpt?: string;

  /** Table of contents */
  tableOfContents?: {
    title: string;
    anchor: string;
    level: number;
  }[];

  /** Featured image */
  featuredImage?: {
    url: string;
    alt: string;
    caption?: string;
    credit?: string;
  };

  /** Additional media */
  media?: {
    type: 'image' | 'video' | 'audio' | 'embed';
    url: string;
    alt?: string;
    caption?: string;
    position?: 'inline' | 'sidebar' | 'header' | 'footer';
  }[];

  /** Call-to-action sections */
  cta?: {
    text: string;
    url: string;
    type: 'primary' | 'secondary';
    position: 'inline' | 'end' | 'sidebar';
  }[];
}

/**
 * Blog post version for content management
 */
export interface BlogPostVersion {
  /** Version identifier */
  version: string;

  /** Version metadata */
  metadata: BlogPostMetadata;

  /** Version content */
  content: BlogPostContent;

  /** Version creation info */
  createdAt: Date;
  createdBy?: string;

  /** Change summary */
  changeSummary?: string;

  /** Version status */
  status: BlogPostStatus;
}

/**
 * Complete blog post with version history and all required properties
 * This is the main interface used throughout the application
 */
export interface BlogPost {
  /** Unique identifier */
  id: string;

  /** Blog post title */
  title: string;

  /** Blog post content */
  content: BlogPostContent;

  /** Meta description for SEO */
  metaDescription?: string;

  /** URL slug */
  slug: string;

  /** Author name */
  authorName?: string;

  /** Featured image URL */
  featuredImageUrl?: string;

  /** Focus keyword for SEO */
  focusKeyword?: string;

  /** SEO score (0-100) */
  seoScore?: number;

  /** Keywords array */
  keywords?: string[];

  /** Content excerpt */
  excerpt?: string;

  /** Current metadata */
  metadata: BlogPostMetadata;

  /** Current status */
  status: BlogPostStatus;

  /** Version history */
  versions?: BlogPostVersion[];

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;

  /** Images array */
  images?: {
    url: string;
    alt: string;
    caption?: string;
  }[];

  /** Analytics and performance */
  analytics?: {
    /** Page views */
    views?: number;
    /** Unique visitors */
    uniqueVisitors?: number;
    /** Social shares */
    shares?: number;
    /** Comments count */
    comments?: number;
    /** Average time on page (seconds) */
    avgTimeOnPage?: number;
    /** Bounce rate (0-1) */
    bounceRate?: number;
    /** SEO performance */
    searchRankings?: {
      keyword: string;
      position: number;
      searchEngine: string;
    }[];
  };

  /** Content optimization suggestions */
  suggestions?: {
    /** SEO improvements */
    seo?: string[];
    /** Content quality improvements */
    quality?: string[];
    /** Readability improvements */
    readability?: string[];
    /** Engagement improvements */
    engagement?: string[];
  };
}
