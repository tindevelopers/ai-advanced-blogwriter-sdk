/**
 * Week 5-6 Content Strategy Engine Types
 * Comprehensive types for strategic content planning and analysis
 */

// ===== TOPIC RESEARCH & TREND ANALYSIS =====

export interface TopicCluster {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Hierarchy
  parent?: TopicCluster;
  children: TopicCluster[];

  // Related entities
  topics: TopicResearch[];
  competitors: CompetitorTopic[];
  contentBriefs: ContentBrief[];
}

export interface TopicResearch {
  id: string;
  title: string;
  slug: string;
  description?: string;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  longTailKeywords: string[];

  // Search data
  searchVolume?: number;
  keywordDifficulty?: number;
  cpc?: number;
  seasonalityData?: SeasonalityData;

  // Trend analysis
  trendScore: number; // 0-1
  trending: boolean;
  trendData?: TrendData;
  peakMonths: string[];

  // Opportunity scoring
  opportunityScore: number; // 0-1
  competitionLevel: CompetitionLevel;
  contentGapScore: number; // 0-1

  // Metadata
  status: TopicStatus;
  priority: Priority;
  estimatedEffort?: number; // Hours
  tags: string[];

  clusterId?: string;
  cluster?: TopicCluster;

  createdAt: Date;
  updatedAt: Date;

  // Related entities
  competitors: CompetitorTopic[];
  contentBriefs: ContentBrief[];
  calendarEntries: EditorialCalendarEntry[];
  relatedTopics: TopicRelationship[];
  relatedFrom: TopicRelationship[];
}

export interface TopicRelationship {
  id: string;
  fromTopicId: string;
  toTopicId: string;
  relationshipType: TopicRelationshipType;
  strength: number; // 0-1
  createdAt: Date;

  fromTopic: TopicResearch;
  toTopic: TopicResearch;
}

export interface SeasonalityData {
  months: Array<{
    month: string;
    searchVolume: number;
    trend: number;
  }>;
  peakSeason: string;
  lowSeason: string;
  volatility: number; // 0-1
}

export interface TrendData {
  periods: Array<{
    date: string;
    value: number;
    change: number;
  }>;
  overall: 'rising' | 'falling' | 'stable';
  momentum: number; // -1 to 1
  forecast?: Array<{
    date: string;
    predicted: number;
    confidence: number;
  }>;
}

export type CompetitionLevel = 'low' | 'medium' | 'high';
export type TopicStatus =
  | 'researched'
  | 'planned'
  | 'in_progress'
  | 'published';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TopicRelationshipType =
  | 'related'
  | 'prerequisite'
  | 'followup'
  | 'similar'
  | 'alternative';

// ===== EDITORIAL CALENDAR =====

export interface EditorialCalendar {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  entries: EditorialCalendarEntry[];
}

export interface EditorialCalendarEntry {
  id: string;
  calendarId: string;
  title: string;
  description?: string;

  // Scheduling
  plannedDate: Date;
  publishDate?: Date;
  dueDate?: Date;

  // Content details
  contentType: string;
  status: CalendarEntryStatus;
  priority: Priority;

  // Assignment
  assignedTo?: string;
  reviewerIds: string[];

  // Content planning
  targetWordCount?: number;
  estimatedHours?: number;
  tags: string[];
  categories: string[];

  // Connections
  topicId?: string;
  topic?: TopicResearch;
  blogPostId?: string;
  blogPost?: any; // BlogPost type
  contentBriefId?: string;
  contentBrief?: ContentBrief;

  calendar: EditorialCalendar;

  // Milestones and tracking
  milestones: CalendarMilestone[];
  timeTracking: TimeTrackingEntry[];

  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarMilestone {
  id: string;
  entryId: string;
  name: string;
  description?: string;
  dueDate: Date;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: string;

  entry: EditorialCalendarEntry;
}

export interface TimeTrackingEntry {
  id: string;
  entryId: string;
  userId?: string;
  activity: ActivityType;
  duration: number; // Hours
  description?: string;
  trackedAt: Date;

  calendarEntry: EditorialCalendarEntry;
}

export type CalendarEntryStatus =
  | 'planned'
  | 'research'
  | 'writing'
  | 'review'
  | 'ready'
  | 'published'
  | 'cancelled';
export type ActivityType = 'research' | 'writing' | 'editing' | 'review';

// ===== COMPETITOR ANALYSIS =====

export interface Competitor {
  id: string;
  name: string;
  domain: string;
  description?: string;
  type: CompetitorType;

  // Metrics
  domainAuthority?: number;
  monthlyTraffic?: number;
  backlinks?: number;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Related data
  content: CompetitorContent[];
  topics: CompetitorTopic[];
  keywords: CompetitorKeyword[];
  analysis: CompetitorAnalysis[];
}

export interface CompetitorContent {
  id: string;
  competitorId: string;
  title: string;
  url: string;
  publishDate?: Date;

  // Content analysis
  wordCount?: number;
  readabilityScore?: number;
  seoScore?: number;
  socialShares: number;
  backlinks: number;

  // Keyword data
  primaryKeywords: string[];
  rankings?: KeywordRankings;

  // Gap analysis
  gapOpportunity: number; // 0-1
  canImprove: boolean;
  improvementNotes?: string;

  competitor: Competitor;

  createdAt: Date;
  updatedAt: Date;
}

export interface CompetitorTopic {
  id: string;
  competitorId: string;
  topicId?: string;
  clusterId?: string;

  title: string;
  coverage: number; // 0-1
  ranking?: number;
  contentCount: number;

  competitor: Competitor;
  topic?: TopicResearch;
  cluster?: TopicCluster;

  createdAt: Date;
  updatedAt: Date;
}

export interface CompetitorKeyword {
  id: string;
  competitorId: string;
  keyword: string;
  position: number;
  searchVolume?: number;
  difficulty?: number;
  traffic?: number;
  url?: string;

  // Gap analysis
  ourPosition?: number;
  gapSize?: number;
  opportunity: number; // 0-1

  competitor: Competitor;

  trackedAt: Date;
  updatedAt: Date;
}

export interface CompetitorAnalysis {
  id: string;
  competitorId: string;

  // Overall analysis
  overallScore: number; // 0-1
  contentQuality?: number;
  seoStrength?: number;
  socialPresence?: number;

  // Content gaps
  contentGaps: ContentGap[];
  keywordGaps: KeywordGap[];
  topicGaps: TopicGap[];

  // Recommendations
  recommendations: Recommendation[];
  opportunities: Opportunity[];

  analyzedAt: Date;
  competitor: Competitor;
}

export interface KeywordRankings {
  [keyword: string]: {
    position: number;
    url: string;
    traffic?: number;
  };
}

export interface ContentGap {
  type: string;
  description: string;
  opportunity: number; // 0-1
  difficulty: number; // 0-1
  estimatedTraffic?: number;
  keywords?: string[];
  competitorUrls?: string[];
}

export interface KeywordGap {
  keyword: string;
  competitorPosition: number;
  searchVolume?: number;
  difficulty?: number;
  opportunity: number; // 0-1
  searchIntent?: string;
}

export interface TopicGap {
  topic: string;
  competitorCoverage: number; // 0-1
  ourCoverage: number; // 0-1
  opportunity: number; // 0-1
  suggestedKeywords?: string[];
}

export interface Recommendation {
  type: 'content' | 'seo' | 'keyword' | 'technical';
  priority: Priority;
  title: string;
  description: string;
  estimatedImpact: number; // 0-1
  estimatedEffort: number; // Hours
  resources?: string[];
}

export interface Opportunity {
  title: string;
  description: string;
  type: 'keyword' | 'topic' | 'content_gap' | 'technical';
  potential: number; // 0-1
  difficulty: number; // 0-1
  timeline: string; // '1-3 months', '3-6 months', etc.
  keywords?: string[];
  competitorUrls?: string[];
}

export type CompetitorType = 'direct' | 'indirect' | 'aspirational';

// ===== CONTENT BRIEF GENERATION =====

export interface ContentBrief {
  id: string;
  title: string;
  slug: string;
  description?: string;

  // Target content details
  targetWordCount?: number;
  targetContentType: string;
  targetAudience?: string;

  // SEO requirements
  primaryKeyword?: string;
  secondaryKeywords: string[];
  searchIntent?: SearchIntent;
  targetKeywords?: TargetKeywords;

  // Content structure
  outline?: ContentOutline;
  requiredSections: string[];
  suggestedSections: string[];

  // Research data
  researchSources?: ResearchSource[];
  statisticsToInclude?: Statistic[];
  examplesNeeded: string[];

  // Competition insights
  competitorAnalysis?: BriefCompetitorAnalysis;
  contentGaps?: ContentGap[];
  differentiators: string[];

  // Requirements
  callsToAction: string[];
  internalLinks: string[];
  externalLinks?: ExternalLink[];
  imagesNeeded: string[];

  // Personas and targeting
  primaryPersona?: string;
  secondaryPersonas: string[];
  userQuestions: string[];
  painPoints: string[];

  // Technical requirements
  metaTitle?: string;
  metaDescription?: string;
  focusKeywordDensity?: number;
  readingLevel?: number;
  tone?: string;

  // Connections
  topicId?: string;
  topic?: TopicResearch;
  clusterId?: string;
  cluster?: TopicCluster;

  // Status and workflow
  status: BriefStatus;
  version: number;

  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;

  // Relationships
  blogPosts: any[]; // BlogPost[]
  calendarEntries: EditorialCalendarEntry[];
}

export interface ContentOutline {
  sections: OutlineSection[];
  estimatedWordCount: number;
  structure: 'linear' | 'pillar' | 'listicle' | 'comparison' | 'guide';
}

export interface OutlineSection {
  title: string;
  description?: string;
  estimatedWords: number;
  keywords?: string[];
  subsections?: OutlineSection[];
  type: 'introduction' | 'main' | 'conclusion' | 'cta' | 'faq';
  required: boolean;
}

export interface TargetKeywords {
  primary: KeywordData;
  secondary: KeywordData[];
  longTail: KeywordData[];
  semantic: string[];
}

export interface KeywordData {
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: SearchIntent;
  trending?: boolean;
}

export interface ResearchSource {
  title: string;
  url: string;
  type: 'article' | 'study' | 'report' | 'news' | 'tool';
  authority: number; // 0-1
  relevance: number; // 0-1
  keyQuotes?: string[];
  statistics?: Statistic[];
}

export interface Statistic {
  value: string;
  description: string;
  source: string;
  url?: string;
  year?: number;
  relevance: number; // 0-1
}

export interface BriefCompetitorAnalysis {
  topCompetitors: string[];
  gapAnalysis: ContentGap[];
  strengthsToAddress: string[];
  weaknessesToExploit: string[];
  differentiationStrategy: string[];
}

export interface ExternalLink {
  url: string;
  anchor: string;
  authority: number; // 0-1
  relevance: number; // 0-1
  reason: string;
}

export type SearchIntent =
  | 'informational'
  | 'commercial'
  | 'navigational'
  | 'transactional';
export type BriefStatus = 'draft' | 'ready' | 'in_use' | 'archived';

// ===== ANALYSIS & REPORTING =====

export interface StrategyReport {
  id: string;
  title: string;
  type:
    | 'topic_analysis'
    | 'competitor_analysis'
    | 'content_gap'
    | 'opportunity';
  generatedAt: Date;

  summary: ReportSummary;
  data: any;
  recommendations: Recommendation[];
  nextSteps: string[];

  createdBy?: string;
}

export interface ReportSummary {
  keyFindings: string[];
  opportunities: number;
  threats: number;
  overallScore: number; // 0-1
  confidence: number; // 0-1
}

// ===== API INTERFACES =====

export interface TopicResearchRequest {
  query: string;
  includeKeywords?: boolean;
  includeTrends?: boolean;
  includeCompetitors?: boolean;
  depth?: 'basic' | 'detailed' | 'comprehensive';
  language?: string;
  location?: string;
}

export interface TopicResearchResponse {
  topic: TopicResearch;
  keywords: KeywordData[];
  trends: TrendData;
  competitors: CompetitorTopic[];
  opportunities: Opportunity[];
  confidence: number;
}

export interface CompetitorAnalysisRequest {
  competitors: string[]; // domains
  keywords?: string[];
  includeContent?: boolean;
  includeKeywords?: boolean;
  includeTopics?: boolean;
  depth?: 'basic' | 'detailed' | 'comprehensive';
}

export interface CompetitorAnalysisResponse {
  analysis: CompetitorAnalysis[];
  gaps: ContentGap[];
  opportunities: Opportunity[];
  recommendations: Recommendation[];
  summary: ReportSummary;
}

export interface ContentBriefRequest {
  title: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  targetAudience?: string;
  contentType?: string;
  includeCompetitorAnalysis?: boolean;
  includeResearch?: boolean;
  includeOutline?: boolean;
}

export interface ContentBriefResponse {
  brief: ContentBrief;
  confidence: number;
  generatedSections: string[];
  researchTime: number;
}

export interface EditorialCalendarRequest {
  startDate: Date;
  endDate: Date;
  topics?: string[];
  contentTypes?: string[];
  priority?: Priority;
  assignedTo?: string;
}

export interface EditorialCalendarResponse {
  calendar: EditorialCalendar;
  entries: EditorialCalendarEntry[];
  summary: {
    totalEntries: number;
    byStatus: Record<CalendarEntryStatus, number>;
    byPriority: Record<Priority, number>;
    upcomingDeadlines: EditorialCalendarEntry[];
  };
}

// ===== CONTENT STRATEGY INTERFACE =====

/**
 * Competitor insight data structure
 */
export interface CompetitorInsight {
  /** Competitor domain or name */
  competitor: string;

  /** Domain authority score */
  domainAuthority?: number;

  /** Content performance metrics */
  performance: {
    /** Average monthly traffic */
    averageTraffic?: number;
    /** Content publishing frequency */
    publishingFrequency: number;
    /** Social engagement rate */
    engagementRate?: number;
    /** Average content length */
    averageContentLength: number;
  };

  /** Top performing keywords */
  topKeywords: Array<{
    keyword: string;
    position: number;
    searchVolume?: number;
    traffic?: number;
  }>;

  /** Content strategy insights */
  strategy: {
    /** Primary content topics */
    primaryTopics: string[];
    /** Content types used */
    contentTypes: string[];
    /** Publishing schedule pattern */
    publishingPattern: string;
    /** Tone and style characteristics */
    toneCharacteristics: string[];
  };

  /** Identified weaknesses to exploit */
  weaknesses: string[];

  /** Competitive advantages they have */
  strengths: string[];

  /** Last analysis date */
  lastAnalyzed: Date;
}

/**
 * Trending topic data structure
 */
export interface TrendingTopic {
  /** Topic title or keyword phrase */
  topic: string;

  /** Trend score (0-100) */
  trendScore: number;

  /** Search volume data */
  searchVolume: {
    /** Current monthly search volume */
    current: number;
    /** Previous period volume for comparison */
    previous?: number;
    /** Percentage change */
    changePercent?: number;
  };

  /** Trend momentum */
  momentum: 'rising' | 'stable' | 'declining' | 'volatile';

  /** Geographic regions where trending */
  regions?: string[];

  /** Related keywords and phrases */
  relatedKeywords: string[];

  /** Seasonality information */
  seasonality?: {
    /** Peak months */
    peakMonths: string[];
    /** Low months */
    lowMonths: string[];
    /** Is seasonal topic */
    isSeasonal: boolean;
  };

  /** Content opportunity assessment */
  opportunity: {
    /** Difficulty to rank (0-100) */
    difficulty: number;
    /** Potential traffic opportunity */
    trafficPotential: number;
    /** Competition level */
    competitionLevel: 'low' | 'medium' | 'high';
    /** Recommended content types */
    recommendedContentTypes: string[];
  };

  /** Trend data points over time */
  historicalData?: Array<{
    date: string;
    volume: number;
    interest: number;
  }>;

  /** Data sources */
  sources: string[];

  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * Content structure recommendation
 */
export interface ContentStructure {
  /** Content type */
  contentType:
    | 'blog'
    | 'article'
    | 'guide'
    | 'tutorial'
    | 'listicle'
    | 'comparison'
    | 'review';

  /** Recommended sections in order */
  sections: Array<{
    /** Section title */
    title: string;
    /** Section type */
    type:
      | 'introduction'
      | 'main'
      | 'conclusion'
      | 'cta'
      | 'faq'
      | 'list'
      | 'comparison'
      | 'steps';
    /** Recommended word count for section */
    wordCount?: { min: number; max: number };
    /** Whether section is required */
    required: boolean;
    /** Section description/purpose */
    description?: string;
    /** Key points to cover */
    keyPoints?: string[];
  }>;

  /** Overall content specifications */
  specifications: {
    /** Recommended total word count */
    totalWordCount: { min: number; max: number };
    /** Recommended reading level */
    readingLevel?: number;
    /** Suggested tone */
    tone: string;
    /** Content depth */
    depth: 'surface' | 'intermediate' | 'comprehensive';
  };

  /** SEO structure recommendations */
  seoStructure: {
    /** Heading hierarchy */
    headingStructure: Array<{
      level: number; // H1, H2, H3, etc.
      text: string;
      includeKeyword: boolean;
    }>;
    /** Internal linking opportunities */
    internalLinkingSuggestions: string[];
    /** Meta elements */
    metaRecommendations: {
      /** Title structure */
      titleStructure: string;
      /** Description format */
      descriptionFormat: string;
      /** URL structure */
      urlStructure?: string;
    };
  };

  /** Content elements to include */
  recommendedElements: {
    /** Include images */
    images: boolean;
    /** Include videos */
    videos: boolean;
    /** Include infographics */
    infographics: boolean;
    /** Include code examples */
    codeExamples: boolean;
    /** Include downloadable resources */
    downloads: boolean;
    /** Include interactive elements */
    interactive: boolean;
  };

  /** Competitive advantage structure */
  differentiationStrategy: {
    /** Unique angles to take */
    uniqueAngles: string[];
    /** Content gaps to fill */
    gapsToFill: string[];
    /** Value propositions */
    valuePropositions: string[];
  };
}

/**
 * Comprehensive content strategy interface as specified in requirements
 */
export interface ContentStrategy {
  /** Target keywords for the content strategy */
  targetKeywords: string[];

  /** Competitor analysis insights */
  competitorAnalysis: CompetitorInsight[];

  /** Identified content gaps and opportunities */
  contentGaps: ContentGap[];

  /** Current trending topics relevant to strategy */
  trendingTopics: TrendingTopic[];

  /** Recommended content structure and approach */
  recommendedStructure: ContentStructure;
}
