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
  /** Keyword */
  keyword: string;

  /** Current density */
  density: number;

  /** Recommended density range */
  recommendedDensity: {
    min: number;
    max: number;
  };

  /** Keyword positions in content */
  positions: number[];

  /** Related keywords */
  related: string[];

  /** Long-tail variations */
  longTail: string[];
}

/**
 * Comprehensive SEO Analysis
 */
export interface SEOAnalysis {
  id: string;
  blogPostId: string;
  score: number;
  components: {
    title: number;
    metaDescription: number;
    headings: number;
    keywords: number;
    contentLength: number;
    internalLinks: number;
    images: number;
    url: number;
  };
  recommendations: SEORecommendation[];
  keywords: {
    primary?: KeywordAnalysis;
    secondary?: KeywordAnalysis[];
    related?: string[];
    densityIssues?: {
      keyword: string;
      currentDensity: number;
      recommendedDensity: number;
      issue: 'too_high' | 'too_low';
    }[];
  };
  content: {
    wordCount: number;
    readingLevel: number;
    readabilityScore: number;
    avgSentenceLength: number;
    paragraphCount: number;
  };
  analyzedAt: Date;
  modelUsed: string;
}

/**
 * SEO Optimization Options
 */
export interface SEOOptimizationOptions {
  targetKeywords?: string[];
  titleLength?: { min: number; max: number };
  metaDescriptionLength?: { min: number; max: number };
  keywordDensity?: { min: number; max: number };
  includeRecommendations?: boolean;
  includeKeywordAnalysis?: boolean;
  includeContentAnalysis?: boolean;
  // Additional properties for backward compatibility
  meta?: {
    title?: boolean;
    description?: boolean;
  };
  content?: boolean;
  images?: {
    altText?: boolean;
  };
  keywords?: {
    primary?: string;
  };
}

/**
 * SEO Analysis Request
 */
export interface SEOAnalysisRequest {
  blogPostId: string;
  targetKeywords?: string[];
  includeRecommendations?: boolean;
  includeKeywordAnalysis?: boolean;
  includeContentAnalysis?: boolean;
  optimizationOptions?: SEOOptimizationOptions;
}

/**
 * SEO Analysis Result
 */
export interface SEOAnalysisResult {
  analysis: SEOAnalysis;
  optimizationSuggestions?: SEORecommendation[];
  keywordOpportunities?: KeywordAnalysis[];
  contentImprovements?: {
    readability?: string[];
    structure?: string[];
    engagement?: string[];
  };
}

/**
 * Keyword Research Request
 */
export interface KeywordResearchRequest {
  topic: string;
  language?: string;
  location?: string;
  searchVolume?: boolean;
  difficulty?: boolean;
  relatedKeywords?: boolean;
  longTail?: boolean;
  competitorAnalysis?: boolean;
}

/**
 * Keyword Research Response
 */
export interface KeywordResearchResponse {
  primaryKeyword: {
    keyword: string;
    searchVolume?: number;
    difficulty?: number;
    cpc?: number;
    competition?: number;
  };
  relatedKeywords: Array<{
    keyword: string;
    searchVolume?: number;
    difficulty?: number;
    cpc?: number;
    competition?: number;
  }>;
  longTailKeywords: Array<{
    keyword: string;
    searchVolume?: number;
    difficulty?: number;
    cpc?: number;
  }>;
  competitorKeywords?: Array<{
    keyword: string;
    competitor: string;
    url: string;
    position: number;
  }>;
  insights: {
    opportunities: string[];
    challenges: string[];
    recommendations: string[];
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
