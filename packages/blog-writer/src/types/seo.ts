/**
 * Basic SEO analysis result (legacy interface)
 * @deprecated Use the comprehensive SEOAnalysis interface from seo-engine.ts instead
 */
export interface BasicSEOAnalysis {
  /** Overall SEO score (0-100) */
  score: number;

  /** Individual component scores */
  components: {
    /** Title optimization score */
    title: number;
    /** Meta description score */
    metaDescription: number;
    /** Heading structure score */
    headings: number;
    /** Keyword optimization score */
    keywords: number;
    /** Content length score */
    contentLength: number;
    /** Internal linking score */
    internalLinks: number;
    /** Image optimization score */
    images: number;
    /** URL structure score */
    url: number;
  };

  /** Specific recommendations */
  recommendations: SEORecommendation[];

  /** Keyword analysis */
  keywords: {
    /** Primary keyword analysis */
    primary?: KeywordAnalysis;
    /** Secondary keywords analysis */
    secondary?: KeywordAnalysis[];
    /** Related keywords found */
    related?: string[];
    /** Keyword density issues */
    densityIssues?: {
      keyword: string;
      currentDensity: number;
      recommendedDensity: number;
      issue: 'too_high' | 'too_low';
    }[];
  };

  /** Content analysis */
  content: {
    /** Word count */
    wordCount: number;
    /** Reading level (Flesch-Kincaid grade) */
    readingLevel: number;
    /** Readability score (0-100) */
    readabilityScore: number;
    /** Average sentence length */
    avgSentenceLength: number;
    /** Paragraph count */
    paragraphCount: number;
  };
}

/**
 * SEO recommendation
 */
export interface SEORecommendation {
  /** Recommendation type */
  type: 'critical' | 'important' | 'minor';

  /** Category of the recommendation */
  category:
    | 'title'
    | 'meta'
    | 'content'
    | 'keywords'
    | 'structure'
    | 'images'
    | 'links';

  /** Recommendation message */
  message: string;

  /** Current value (if applicable) */
  current?: string | number;

  /** Suggested value (if applicable) */
  suggested?: string | number;

  /** Impact score (0-100) */
  impact: number;

  /** How to fix the issue */
  fix: string;
}

/**
 * Keyword analysis
 */
export interface KeywordAnalysis {
  /** The keyword */
  keyword: string;

  /** Search volume (monthly) */
  searchVolume?: number;

  /** Keyword difficulty (0-100) */
  difficulty?: number;

  /** Competition level */
  competition?: 'low' | 'medium' | 'high';

  /** Current density in content (0-1) */
  density: number;

  /** Recommended density range */
  recommendedDensity: {
    min: number;
    max: number;
  };

  /** Positions where keyword appears */
  positions: {
    /** In title */
    title: boolean;
    /** In meta description */
    metaDescription: boolean;
    /** In first paragraph */
    firstParagraph: boolean;
    /** In headings */
    headings: string[];
    /** In URL */
    url: boolean;
    /** In alt text */
    altText: boolean;
  };

  /** Related keywords and synonyms */
  related?: string[];

  /** Long-tail variations */
  longTail?: string[];
}

/**
 * SEO optimization options
 */
export interface SEOOptimizationOptions {
  /** Target keywords */
  keywords?: {
    /** Primary focus keyword */
    primary: string;
    /** Secondary keywords */
    secondary?: string[];
    /** Long-tail keywords */
    longTail?: string[];
  };

  /** Content optimization */
  content?: {
    /** Target word count range */
    wordCount?: {
      min: number;
      max: number;
    };
    /** Target reading level */
    readingLevel?: number;
    /** Include table of contents */
    tableOfContents?: boolean;
    /** Optimize headings */
    optimizeHeadings?: boolean;
  };

  /** Meta optimization */
  meta?: {
    /** Generate optimized title */
    title?: boolean;
    /** Generate meta description */
    description?: boolean;
    /** Optimize URL slug */
    slug?: boolean;
  };

  /** Image optimization */
  images?: {
    /** Generate alt text */
    altText?: boolean;
    /** Optimize file names */
    fileNames?: boolean;
    /** Add captions */
    captions?: boolean;
  };

  /** Link optimization */
  links?: {
    /** Include internal links */
    internal?: boolean;
    /** Suggest external links */
    external?: boolean;
    /** Optimize anchor text */
    anchorText?: boolean;
  };
}

/**
 * SEO competitive analysis
 */
export interface SEOCompetitiveAnalysis {
  /** Target keyword */
  keyword: string;

  /** Top competitors */
  competitors: {
    /** Competitor URL */
    url: string;
    /** Domain authority */
    domainAuthority?: number;
    /** Page authority */
    pageAuthority?: number;
    /** Content length */
    wordCount: number;
    /** Title tag */
    title: string;
    /** Meta description */
    metaDescription?: string;
    /** Key SEO factors */
    seoFactors: {
      /** H1 optimization */
      h1Optimized: boolean;
      /** Keyword in title */
      keywordInTitle: boolean;
      /** Schema markup */
      hasSchema: boolean;
      /** Loading speed score */
      speedScore?: number;
    };
  }[];

  /** Content gap analysis */
  contentGaps: string[];

  /** Opportunity keywords */
  opportunities: {
    keyword: string;
    difficulty: number;
    potential: number;
    reason: string;
  }[];
}
