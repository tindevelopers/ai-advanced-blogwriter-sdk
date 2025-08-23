
/**
 * Blog post status
 */
export type BlogPostStatus = 
  | 'draft'
  | 'review'
  | 'published'
  | 'archived'
  | 'scheduled';

/**
 * Blog post metadata
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
 * Complete blog post with version history
 */
export interface BlogPost {
  /** Current metadata */
  metadata: BlogPostMetadata;
  
  /** Current content */
  content: BlogPostContent;
  
  /** Current status */
  status: BlogPostStatus;
  
  /** Version history */
  versions?: BlogPostVersion[];
  
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
