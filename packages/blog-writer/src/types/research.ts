
/**
 * Content research configuration
 */
export interface ContentResearchConfig {
  /** Research topic */
  topic: string;
  
  /** Target keywords */
  keywords?: string[];
  
  /** Research depth */
  depth?: 'basic' | 'detailed' | 'comprehensive';
  
  /** Content type being researched */
  contentType?: string;
  
  /** Target audience */
  audience?: string;
  
  /** Language for research */
  language?: string;
  
  /** Include trending topics */
  includeTrends?: boolean;
  
  /** Include competitor analysis */
  includeCompetitors?: boolean;
  
  /** Research sources */
  sources?: {
    /** Search engines */
    searchEngines?: boolean;
    /** News sources */
    news?: boolean;
    /** Social media */
    social?: boolean;
    /** Academic sources */
    academic?: boolean;
    /** Industry reports */
    reports?: boolean;
    /** Specific domains */
    domains?: string[];
  };
}

/**
 * Research result
 */
export interface ContentResearchResult {
  /** Research topic */
  topic: string;
  
  /** Research timestamp */
  timestamp: Date;
  
  /** Topic overview */
  overview: {
    /** Topic summary */
    summary: string;
    /** Key concepts */
    keyConcepts: string[];
    /** Related topics */
    relatedTopics: string[];
    /** Trending aspects */
    trending?: string[];
  };
  
  /** Keyword research */
  keywords: {
    /** Primary keywords */
    primary: KeywordResearchData[];
    /** Long-tail keywords */
    longTail: KeywordResearchData[];
    /** Related keywords */
    related: KeywordResearchData[];
    /** Trending keywords */
    trending?: KeywordResearchData[];
  };
  
  /** Content gaps and opportunities */
  opportunities: {
    /** Content gaps to fill */
    gaps: string[];
    /** Unique angles */
    angles: string[];
    /** Questions to answer */
    questions: string[];
    /** Underserved subtopics */
    subtopics: string[];
  };
  
  /** Competitor analysis */
  competitors?: {
    /** Top competing content */
    topContent: CompetitorContent[];
    /** Content analysis */
    analysis: {
      /** Average content length */
      avgLength: number;
      /** Common topics covered */
      commonTopics: string[];
      /** Missing topics */
      missingTopics: string[];
      /** Content formats used */
      formats: string[];
    };
  };
  
  /** Source citations */
  sources: ResearchSource[];
  
  /** Expert insights */
  experts?: {
    /** Industry experts */
    experts: ExpertProfile[];
    /** Expert quotes */
    quotes: ExpertQuote[];
    /** Expert perspectives */
    perspectives: string[];
  };
  
  /** Trending data */
  trends?: {
    /** Search trends */
    search: TrendData[];
    /** Social media trends */
    social: TrendData[];
    /** News trends */
    news: TrendData[];
  };
  
  /** Content recommendations */
  recommendations: {
    /** Recommended content structure */
    structure: string[];
    /** Recommended word count */
    wordCount: { min: number; max: number };
    /** Recommended tone */
    tone: string;
    /** Key points to cover */
    keyPoints: string[];
    /** Calls to action */
    cta: string[];
  };
}

/**
 * Keyword research data
 */
export interface KeywordResearchData {
  /** Keyword phrase */
  keyword: string;
  
  /** Search volume */
  searchVolume?: number;
  
  /** Keyword difficulty */
  difficulty?: number;
  
  /** Competition level */
  competition?: 'low' | 'medium' | 'high';
  
  /** Cost per click */
  cpc?: number;
  
  /** Search intent */
  intent?: 'informational' | 'navigational' | 'transactional' | 'commercial';
  
  /** Trend direction */
  trend?: 'rising' | 'stable' | 'declining';
  
  /** Related queries */
  relatedQueries?: string[];
  
  /** Questions people ask */
  questions?: string[];
}

/**
 * Competitor content analysis
 */
export interface CompetitorContent {
  /** Content URL */
  url: string;
  
  /** Content title */
  title: string;
  
  /** Domain authority */
  domainAuthority?: number;
  
  /** Content metrics */
  metrics: {
    /** Word count */
    wordCount: number;
    /** Reading level */
    readingLevel?: number;
    /** Social shares */
    shares?: number;
    /** Backlinks */
    backlinks?: number;
  };
  
  /** Content structure */
  structure: {
    /** Headings used */
    headings: string[];
    /** Sections covered */
    sections: string[];
    /** Media types */
    mediaTypes: string[];
  };
  
  /** SEO analysis */
  seo: {
    /** Meta title */
    metaTitle?: string;
    /** Meta description */
    metaDescription?: string;
    /** Keywords targeted */
    keywords: string[];
    /** SEO score */
    score?: number;
  };
  
  /** Content gaps */
  gaps?: string[];
  
  /** Strengths */
  strengths?: string[];
  
  /** Weaknesses */
  weaknesses?: string[];
}

/**
 * Research source
 */
export interface ResearchSource {
  /** Source URL */
  url: string;
  
  /** Source title */
  title: string;
  
  /** Source type */
  type: 'article' | 'study' | 'report' | 'news' | 'blog' | 'academic' | 'social';
  
  /** Publication date */
  publishedAt?: Date;
  
  /** Author */
  author?: string;
  
  /** Source credibility score */
  credibility?: number;
  
  /** Key points from source */
  keyPoints: string[];
  
  /** Relevant quotes */
  quotes?: string[];
  
  /** Source summary */
  summary: string;
}

/**
 * Expert profile
 */
export interface ExpertProfile {
  /** Expert name */
  name: string;
  
  /** Expert title/position */
  title?: string;
  
  /** Organization/company */
  organization?: string;
  
  /** Expertise areas */
  expertise: string[];
  
  /** Social media profiles */
  social?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  
  /** Bio */
  bio?: string;
  
  /** Credibility score */
  credibility?: number;
}

/**
 * Expert quote
 */
export interface ExpertQuote {
  /** Quote text */
  quote: string;
  
  /** Expert who said it */
  expert: ExpertProfile;
  
  /** Context */
  context?: string;
  
  /** Source URL */
  source?: string;
  
  /** Quote relevance score */
  relevance: number;
}

/**
 * Trend data
 */
export interface TrendData {
  /** Trend topic */
  topic: string;
  
  /** Trend score */
  score: number;
  
  /** Trend direction */
  direction: 'rising' | 'stable' | 'declining';
  
  /** Time period */
  period: string;
  
  /** Geographic region */
  region?: string;
  
  /** Related trends */
  related?: string[];
  
  /** Trend source */
  source: string;
}

/**
 * Topic research options
 */
export interface TopicResearchOptions {
  /** Research query */
  query: string;
  
  /** Number of results to analyze */
  maxResults?: number;
  
  /** Content types to analyze */
  contentTypes?: string[];
  
  /** Language preference */
  language?: string;
  
  /** Geographic region */
  region?: string;
  
  /** Time range for analysis */
  timeRange?: '24h' | '7d' | '30d' | '3m' | '1y' | 'all';
  
  /** Include social media data */
  includeSocial?: boolean;
  
  /** Include news data */
  includeNews?: boolean;
  
  /** Include academic sources */
  includeAcademic?: boolean;
}
