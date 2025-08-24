/**
 * Week 9-10 SEO Analysis Engine Types
 * Comprehensive types for DataForSEO integration, keyword research, on-page optimization,
 * meta tag generation, schema markup, and readability analysis
 */

// ===== DataForSEO CONFIGURATION & INTEGRATION =====

export interface DataForSEOConfig {
  apiKey: string;
  username: string;
  password: string;
  baseUrl?: string;
  rateLimit?: number; // requests per minute
  timeout?: number; // milliseconds
  retryAttempts?: number;
  cacheTTL?: number; // cache duration in minutes
  fallbackMode?: boolean; // use fallback when API unavailable
}

export interface DataForSEOConnectionStatus {
  connected: boolean;
  lastChecked: Date;
  apiQuota: {
    remaining: number;
    limit: number;
    resetAt: Date;
  };
  error?: string;
}

// ===== KEYWORD RESEARCH & ANALYSIS =====

export interface KeywordResearchRequest {
  seedKeywords: string[];
  language?: string;
  location?: string;
  searchEngine?: 'google' | 'bing' | 'yahoo';
  includeVariations?: boolean;
  includeLongTail?: boolean;
  competitorAnalysis?: boolean;
  maxResults?: number;
}

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  cpc?: number;
  competition?: number;
  competitionIndex?: number;
  seasonality?: number[];
  difficulty: KeywordDifficulty;
  trends: KeywordTrends;
  relatedKeywords?: string[];
  longTailVariations?: string[];
  searchIntent: SearchIntent;
  topPages?: CompetitorPage[];
}

export interface KeywordTrends {
  monthlySearches: MonthlySearch[];
  yearOverYear: number;
  trending: 'rising' | 'falling' | 'stable';
  seasonalPattern: boolean;
}

export interface MonthlySearch {
  year: number;
  month: number;
  searchVolume: number;
}

export interface KeywordDifficulty {
  score: number; // 0-100
  level: 'very_easy' | 'easy' | 'possible' | 'difficult' | 'very_difficult';
  factors: {
    domainAuthority: number;
    contentQuality: number;
    backlinks: number;
    competition: number;
  };
}

export interface SearchIntent {
  primary: 'informational' | 'navigational' | 'commercial' | 'transactional';
  confidence: number; // 0-1
  modifiers: string[];
}

export interface KeywordCluster {
  id: string;
  name: string;
  primaryKeyword: string;
  keywords: KeywordData[];
  totalSearchVolume: number;
  averageDifficulty: number;
  searchIntent: SearchIntent;
  priority: number; // 1-100
}

// ===== ON-PAGE SEO OPTIMIZATION =====

export interface OnPageSEOAnalysis {
  url?: string;
  title: TitleAnalysis;
  metaDescription: MetaDescriptionAnalysis;
  headings: HeadingAnalysis;
  content: ContentAnalysis;
  keywords: KeywordDensityAnalysis[];
  images: ImageOptimization;
  links: LinkAnalysis;
  technical: TechnicalSEO;
  overallScore: number; // 0-100
  recommendations: SEORecommendation[];
}

export interface TitleAnalysis {
  text: string;
  length: number;
  keywordPresence: boolean;
  keywordPosition: number; // -1 if not present
  readability: number; // 0-100
  clickworthiness: number; // 0-100
  suggestions: string[];
  score: number; // 0-100
}

export interface MetaDescriptionAnalysis {
  text?: string;
  length: number;
  keywordPresence: boolean;
  callToAction: boolean;
  uniqueness: number; // 0-100
  suggestions: string[];
  score: number; // 0-100
}

export interface HeadingAnalysis {
  structure: HeadingStructure[];
  h1Count: number;
  h1Text?: string;
  keywordOptimization: number; // 0-100
  hierarchy: boolean; // proper H1->H2->H3 structure
  suggestions: string[];
  score: number; // 0-100
}

export interface HeadingStructure {
  level: number; // 1-6
  text: string;
  keywordPresence: boolean;
  position: number;
  wordCount: number;
}

export interface ContentAnalysis {
  wordCount: number;
  keywordDensity: KeywordDensityAnalysis[];
  readability: ReadabilityMetrics;
  structure: ContentStructureAnalysis;
  uniqueness: number; // 0-100, content uniqueness
  topicCoverage: TopicCoverageAnalysis;
  score: number; // 0-100
}

export interface KeywordDensityAnalysis {
  keyword: string;
  count: number;
  density: number; // percentage
  optimalRange: { min: number; max: number };
  positions: number[];
  context: string[];
  overOptimized: boolean;
}

export interface ContentStructureAnalysis {
  paragraphs: number;
  averageParagraphLength: number;
  sentences: number;
  averageSentenceLength: number;
  listsCount: number;
  imagesCount: number;
  hasTableOfContents: boolean;
  hasConclusion: boolean;
  score: number; // 0-100
}

export interface TopicCoverageAnalysis {
  mainTopics: string[];
  relatedTopics: string[];
  coverage: number; // 0-100
  gaps: string[];
  suggestions: string[];
}

// ===== IMAGE OPTIMIZATION =====

export interface ImageOptimization {
  totalImages: number;
  optimizedImages: number;
  missingAltText: number;
  oversizedImages: number;
  details: ImageAnalysisDetail[];
  score: number; // 0-100
}

export interface ImageAnalysisDetail {
  src: string;
  alt?: string;
  title?: string;
  fileSize?: number;
  dimensions?: { width: number; height: number };
  format: string;
  loading?: 'lazy' | 'eager';
  issues: ImageIssue[];
  suggestions: string[];
}

export interface ImageIssue {
  type:
    | 'missing_alt'
    | 'poor_alt'
    | 'oversized'
    | 'wrong_format'
    | 'not_optimized';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

// ===== LINK ANALYSIS =====

export interface LinkAnalysis {
  internal: InternalLinkAnalysis;
  external: ExternalLinkAnalysis;
  anchor: AnchorTextAnalysis;
  score: number; // 0-100
}

export interface InternalLinkAnalysis {
  totalLinks: number;
  uniqueLinks: number;
  brokenLinks: number;
  noFollowLinks: number;
  anchors: string[];
  linkDepth: number; // average clicks from homepage
  suggestions: InternalLinkSuggestion[];
  score: number; // 0-100
}

export interface ExternalLinkAnalysis {
  totalLinks: number;
  uniqueDomains: number;
  authorityScore: number; // average domain authority
  brokenLinks: number;
  noFollowRatio: number;
  suggestions: ExternalLinkSuggestion[];
  score: number; // 0-100
}

export interface InternalLinkSuggestion {
  anchor: string;
  targetUrl: string;
  reason: string;
  context: string;
  priority: number; // 1-100
}

export interface ExternalLinkSuggestion {
  anchor: string;
  targetDomain: string;
  authorityScore: number;
  relevance: number;
  reason: string;
}

export interface AnchorTextAnalysis {
  distribution: AnchorTextDistribution[];
  overOptimized: string[];
  branded: number; // percentage of branded anchors
  generic: number; // percentage of generic anchors
  exact: number; // percentage of exact match anchors
  suggestions: string[];
  score: number; // 0-100
}

export interface AnchorTextDistribution {
  text: string;
  count: number;
  percentage: number;
  type: 'exact' | 'partial' | 'branded' | 'generic' | 'naked';
}

// ===== TECHNICAL SEO =====

export interface TechnicalSEO {
  pageSpeed: PageSpeedAnalysis;
  mobile: MobileAnalysis;
  schema: SchemaAnalysis;
  canonicalization: CanonicalizationAnalysis;
  indexability: IndexabilityAnalysis;
  score: number; // 0-100
}

export interface PageSpeedAnalysis {
  desktop: SpeedMetrics;
  mobile: SpeedMetrics;
  coreWebVitals: CoreWebVitals;
  suggestions: PageSpeedSuggestion[];
}

export interface SpeedMetrics {
  score: number; // 0-100
  loadTime: number; // seconds
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
}

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  passed: boolean;
}

export interface PageSpeedSuggestion {
  type: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'easy' | 'moderate' | 'difficult';
}

export interface MobileAnalysis {
  responsive: boolean;
  mobileOptimized: boolean;
  touchElementsSize: boolean;
  viewportConfigured: boolean;
  score: number; // 0-100
}

// ===== META TAGS & SCHEMA MARKUP =====

export interface MetaTagSuggestions {
  title: string;
  description: string;
  keywords?: string;
  robots: string;
  canonical?: string;
  openGraph: OpenGraphTags;
  twitterCard: TwitterCardTags;
  other: CustomMetaTag[];
}

export interface OpenGraphTags {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
  siteName?: string;
  locale?: string;
}

export interface TwitterCardTags {
  card: 'summary' | 'summary_large_image' | 'app' | 'player';
  title: string;
  description: string;
  image: string;
  site?: string;
  creator?: string;
}

export interface CustomMetaTag {
  name?: string;
  property?: string;
  content: string;
  httpEquiv?: string;
}

export interface SchemaMarkup {
  article: ArticleSchema;
  breadcrumb?: BreadcrumbSchema;
  faq?: FAQSchema;
  howTo?: HowToSchema;
  organization?: OrganizationSchema;
  website?: WebsiteSchema;
  custom?: Record<string, any>[];
}

export interface ArticleSchema {
  '@type': 'Article' | 'BlogPosting' | 'NewsArticle';
  headline: string;
  description: string;
  author: AuthorSchema;
  publisher: PublisherSchema;
  datePublished: string;
  dateModified: string;
  image: string | string[];
  mainEntityOfPage: string;
  wordCount?: number;
  keywords?: string[];
}

export interface AuthorSchema {
  '@type': 'Person' | 'Organization';
  name: string;
  url?: string;
  sameAs?: string[];
}

export interface PublisherSchema {
  '@type': 'Organization';
  name: string;
  logo: ImageObjectSchema;
}

export interface ImageObjectSchema {
  '@type': 'ImageObject';
  url: string;
  width?: number;
  height?: number;
}

export interface BreadcrumbSchema {
  '@type': 'BreadcrumbList';
  itemListElement: BreadcrumbItem[];
}

export interface BreadcrumbItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}

export interface FAQSchema {
  '@type': 'FAQPage';
  mainEntity: FAQItem[];
}

export interface FAQItem {
  '@type': 'Question';
  name: string;
  acceptedAnswer: {
    '@type': 'Answer';
    text: string;
  };
}

export interface HowToSchema {
  '@type': 'HowTo';
  name: string;
  description: string;
  step: HowToStep[];
  totalTime?: string;
  supply?: string[];
  tool?: string[];
}

export interface HowToStep {
  '@type': 'HowToStep';
  name: string;
  text: string;
  url?: string;
  image?: string;
}

export interface OrganizationSchema {
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
  contactPoint?: ContactPointSchema[];
}

export interface ContactPointSchema {
  '@type': 'ContactPoint';
  telephone: string;
  contactType: string;
  availableLanguage?: string[];
}

export interface WebsiteSchema {
  '@type': 'WebSite';
  name: string;
  url: string;
  potentialAction?: SearchActionSchema;
}

export interface SearchActionSchema {
  '@type': 'SearchAction';
  target: string;
  'query-input': string;
}

export interface SchemaAnalysis {
  present: string[];
  missing: string[];
  errors: SchemaError[];
  suggestions: SchemaSuggestion[];
  score: number; // 0-100
}

export interface SchemaError {
  type: string;
  property: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface SchemaSuggestion {
  type: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  implementation: string;
}

// ===== READABILITY & CONTENT SCORING =====

export interface ReadabilityMetrics {
  fleschKincaidGrade: number;
  fleschReadingEase: number;
  gunningFog: number;
  colemanLiau: number;
  automatedReadabilityIndex: number;
  averageScore: number;
  readingLevel: ReadingLevel;
  suggestions: ReadabilitySuggestion[];
}

export interface ReadingLevel {
  grade: number;
  description: string;
  audience: string;
}

export interface ReadabilitySuggestion {
  type:
    | 'sentence_length'
    | 'word_complexity'
    | 'paragraph_length'
    | 'passive_voice';
  description: string;
  impact: 'low' | 'medium' | 'high';
  examples?: string[];
}

export interface ContentQualityScore {
  overall: number; // 0-100
  components: {
    readability: number;
    structure: number;
    engagement: number;
    seo: number;
    expertise: number;
  };
  factors: QualityFactor[];
  recommendations: QualityRecommendation[];
}

export interface QualityFactor {
  name: string;
  score: number; // 0-100
  weight: number; // contribution to overall score
  description: string;
}

export interface QualityRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'content' | 'structure' | 'seo' | 'readability';
  title: string;
  description: string;
  action: string;
  impact: number; // expected improvement 0-100
  effort: 'low' | 'medium' | 'high';
}

// ===== COMPETITIVE ANALYSIS =====

export interface CompetitorAnalysis {
  keyword: string;
  competitors: CompetitorPage[];
  averageMetrics: CompetitorMetrics;
  gaps: ContentGap[];
  opportunities: SEOOpportunity[];
}

export interface CompetitorPage {
  url: string;
  title: string;
  metaDescription?: string;
  wordCount: number;
  domainAuthority: number;
  pageAuthority: number;
  backlinks: number;
  rank: number;
  traffic: number;
  contentScore: number;
  keywordOptimization: number;
}

export interface CompetitorMetrics {
  wordCount: number;
  domainAuthority: number;
  pageAuthority: number;
  backlinks: number;
  contentScore: number;
}

export interface ContentGap {
  topic: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  coverageGap: number; // 0-100
  opportunity: number; // 0-100
}

export interface SEOOpportunity {
  type: 'keyword' | 'content' | 'technical' | 'link_building';
  description: string;
  keywords: string[];
  priority: number; // 1-100
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeframe: string;
}

// ===== CANONICALIZATION & INDEXABILITY =====

export interface CanonicalizationAnalysis {
  hasCanonical: boolean;
  canonicalUrl?: string;
  selfReferencing: boolean;
  issues: CanonicalizationIssue[];
  score: number; // 0-100
}

export interface CanonicalizationIssue {
  type: 'missing' | 'incorrect' | 'chain' | 'loop';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface IndexabilityAnalysis {
  indexable: boolean;
  robotsTxt: RobotsTxtAnalysis;
  metaRobots: MetaRobotsAnalysis;
  noindex: boolean;
  sitemap: SitemapAnalysis;
  issues: IndexabilityIssue[];
  score: number; // 0-100
}

export interface RobotsTxtAnalysis {
  exists: boolean;
  accessible: boolean;
  blocks: boolean;
  errors: string[];
}

export interface MetaRobotsAnalysis {
  present: boolean;
  directives: string[];
  blocks: boolean;
}

export interface SitemapAnalysis {
  exists: boolean;
  accessible: boolean;
  includesPage: boolean;
  lastModified?: Date;
}

export interface IndexabilityIssue {
  type: 'robots_blocked' | 'noindex' | 'sitemap_missing' | 'canonical_issue';
  description: string;
  severity: 'low' | 'medium' | 'high';
  solution: string;
}

// ===== MAIN SEO ANALYSIS RESULT =====

export interface SEOAnalysisResult {
  id: string;
  url?: string;
  blogPostId: string;
  analyzedAt: Date;

  // Core Analysis Results
  keywordAnalysis: KeywordData[];
  onPageSEO: OnPageSEOAnalysis;
  metaTags: MetaTagSuggestions;
  schemaMarkup: SchemaMarkup;
  readabilityScore: ReadabilityMetrics;
  contentQuality: ContentQualityScore;
  competitorAnalysis?: CompetitorAnalysis;

  // Aggregate Scores
  overallScore: number; // 0-100
  categoryScores: {
    onPage: number;
    technical: number;
    content: number;
    keywords: number;
    mobile: number;
  };

  // Recommendations
  recommendations: SEORecommendation[];
  quickWins: SEORecommendation[];

  // Metadata
  dataSource: 'dataforseo' | 'ai_analysis' | 'hybrid';
  processingTime: number; // milliseconds
  model?: string; // AI model used if applicable
}

export interface SEORecommendation {
  id: string;
  type: SEORecommendationType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'keywords' | 'content' | 'technical' | 'meta' | 'images' | 'links';
  title: string;
  description: string;
  currentValue?: string;
  suggestedValue?: string;
  impact: number; // expected improvement 0-100
  effort: 'easy' | 'moderate' | 'difficult';
  timeframe: string;
  implementation: string;
  resources?: string[];
}

export enum SEORecommendationType {
  KEYWORD_OPTIMIZATION = 'keyword_optimization',
  TITLE_OPTIMIZATION = 'title_optimization',
  META_DESCRIPTION = 'meta_description',
  HEADING_STRUCTURE = 'heading_structure',
  CONTENT_LENGTH = 'content_length',
  READABILITY = 'readability',
  IMAGE_ALT_TEXT = 'image_alt_text',
  INTERNAL_LINKING = 'internal_linking',
  SCHEMA_MARKUP = 'schema_markup',
  PAGE_SPEED = 'page_speed',
  MOBILE_OPTIMIZATION = 'mobile_optimization',
  CANONICAL_URL = 'canonical_url',
}

// ===== REQUESTED SPECIFIC INTERFACES =====

/**
 * SEOAnalysis interface as requested
 * Comprehensive SEO analysis with specific property structure
 */
export interface SEOAnalysis {
  keywordDensity: KeywordAnalysis[];
  readabilityScore: number;
  metaTagOptimization: MetaTagSuggestions;
  schemaMarkup: SchemaMarkupConfig;
  competitorComparison: SEOComparison;
}

/**
 * KeywordAnalysis supporting type for SEOAnalysis interface
 * Detailed analysis of individual keywords within content
 */
export interface KeywordAnalysis {
  keyword: string;
  count: number;
  density: number; // percentage (0-100)
  positions: number[]; // character positions where keyword appears
  context: string[]; // surrounding text context for each occurrence
  sentiment: 'positive' | 'neutral' | 'negative';
  relevanceScore: number; // 0-100 scale
  competitorUsage: {
    averageDensity: number;
    topCompetitorDensity: number;
    recommendedRange: { min: number; max: number };
  };
  optimization: {
    isOptimal: boolean;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  };
}

/**
 * SchemaMarkupConfig supporting type for SEOAnalysis interface
 * Configuration and validation for structured data markup
 */
export interface SchemaMarkupConfig {
  articleSchema: {
    enabled: boolean;
    configuration: ArticleSchema;
    validation: {
      isValid: boolean;
      errors: SchemaValidationError[];
      warnings: SchemaValidationError[];
    };
  };
  breadcrumbSchema: {
    enabled: boolean;
    configuration: BreadcrumbSchema;
    validation: {
      isValid: boolean;
      errors: SchemaValidationError[];
    };
  };
  faqSchema?: {
    enabled: boolean;
    configuration: FAQSchema;
    validation: {
      isValid: boolean;
      errors: SchemaValidationError[];
    };
  };
  organizationSchema?: {
    enabled: boolean;
    configuration: OrganizationSchema;
    validation: {
      isValid: boolean;
      errors: SchemaValidationError[];
    };
  };
  customSchemas: CustomSchemaConfig[];
  overallScore: number; // 0-100
  recommendations: SchemaRecommendation[];
}

/**
 * SchemaValidationError supporting type
 */
export interface SchemaValidationError {
  property: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  solution: string;
}

/**
 * CustomSchemaConfig supporting type
 */
export interface CustomSchemaConfig {
  name: string;
  type: string;
  schema: Record<string, any>;
  enabled: boolean;
  validation: {
    isValid: boolean;
    errors: SchemaValidationError[];
  };
}

/**
 * SchemaRecommendation supporting type
 */
export interface SchemaRecommendation {
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  implementation: string;
  expectedImpact: number; // 0-100
}

/**
 * SEOComparison supporting type for SEOAnalysis interface
 * Comprehensive comparison with competitor SEO performance
 */
export interface SEOComparison {
  analysisDate: Date;
  competitorsAnalyzed: number;
  mainCompetitors: CompetitorSEOData[];
  comparison: {
    keywordOptimization: ComparisonMetric;
    contentQuality: ComparisonMetric;
    technicalSEO: ComparisonMetric;
    backlinks: ComparisonMetric;
    pageSpeed: ComparisonMetric;
    mobileOptimization: ComparisonMetric;
    overallSEOScore: ComparisonMetric;
  };
  gapAnalysis: {
    keywordGaps: string[];
    contentGaps: string[];
    technicalGaps: string[];
    linkBuildingOpportunities: LinkOpportunity[];
  };
  recommendations: CompetitorBasedRecommendation[];
  marketPosition: {
    rank: number;
    percentile: number;
    strongerCompetitors: number;
    weakerCompetitors: number;
  };
}

/**
 * CompetitorSEOData supporting type
 */
export interface CompetitorSEOData {
  domain: string;
  url: string;
  title: string;
  metaDescription: string;
  domainAuthority: number;
  pageAuthority: number;
  backlinks: number;
  rankingKeywords: number;
  organicTraffic: number;
  seoScore: number;
  strengths: string[];
  weaknesses: string[];
}

/**
 * ComparisonMetric supporting type
 */
export interface ComparisonMetric {
  ourValue: number;
  competitorAverage: number;
  competitorBest: number;
  competitorWorst: number;
  ourRanking: number; // 1-based ranking among competitors
  percentageDifference: number; // vs average
  status: 'leading' | 'competitive' | 'behind' | 'far_behind';
}

/**
 * LinkOpportunity supporting type
 */
export interface LinkOpportunity {
  targetDomain: string;
  authority: number;
  relevance: number;
  difficulty: number;
  type:
    | 'guest_post'
    | 'resource_page'
    | 'broken_link'
    | 'mention'
    | 'directory';
  contactInfo?: string;
  notes: string;
}

/**
 * CompetitorBasedRecommendation supporting type
 */
export interface CompetitorBasedRecommendation {
  category: 'keywords' | 'content' | 'technical' | 'links' | 'social';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  basedOnCompetitor: string;
  expectedImpact: number; // 0-100
  implementationEffort: 'low' | 'medium' | 'high';
  timeframe: string;
}

// ===== REQUEST/RESPONSE INTERFACES =====

export interface SEOAnalysisRequest {
  blogPostId: string;
  url?: string;
  content?: string;
  targetKeywords?: string[];
  competitorUrls?: string[];
  options?: {
    includeKeywordResearch?: boolean;
    includeCompetitorAnalysis?: boolean;
    includeSchemaGeneration?: boolean;
    useDataForSEO?: boolean;
    cacheResults?: boolean;
  };
}

export interface KeywordResearchResponse {
  keywords: KeywordData[];
  clusters: KeywordCluster[];
  totalResults: number;
  processingTime: number;
  source: 'dataforseo' | 'ai_analysis';
}

export interface SchemaGenerationRequest {
  contentType:
    | 'article'
    | 'blog_post'
    | 'how_to'
    | 'faq'
    | 'product'
    | 'service';
  title: string;
  description: string;
  author?: string;
  publishDate?: string;
  modifiedDate?: string;
  image?: string;
  url?: string;
  organization?: {
    name: string;
    logo: string;
    url: string;
  };
  additionalData?: Record<string, any>;
}
