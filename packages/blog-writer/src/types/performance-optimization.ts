/**
 * Week 11-12 Performance Optimization Types
 * Comprehensive types for content performance tracking, A/B testing,
 * engagement prediction, and optimization recommendations
 */

// ===== CONTENT PERFORMANCE TRACKING =====

export interface PerformanceMetrics {
  id?: string;
  blogPostId: string;
  timestamp: Date;

  // Core metrics
  views: number;
  uniqueViews: number;
  engagement: EngagementMetrics;
  conversions: ConversionMetrics;
  seoPerformance: SEOMetrics;
  socialShares: SocialMetrics;

  // Time-based metrics
  timeOnPage: number; // seconds
  bounceRate: number; // percentage
  exitRate: number; // percentage
  avgSessionDuration: number; // seconds

  // Traffic source breakdown
  trafficSources: TrafficSourceMetrics;

  // Device and demographic data
  deviceMetrics: DeviceMetrics;
  demographicMetrics: DemographicMetrics;

  // Performance period
  periodStart: Date;
  periodEnd: Date;

  // Metadata
  recordedAt: Date;
  lastUpdated: Date;
}

export interface EngagementMetrics {
  totalEngagements: number;
  engagementRate: number; // percentage
  likes: number;
  shares: number;
  comments: number;
  bookmarks: number;
  clickThroughRate: number; // percentage
  scrollDepth: ScrollDepthMetrics;
  heatmapData?: HeatmapPoint[];
}

export interface ScrollDepthMetrics {
  depth25Percent: number; // number of users
  depth50Percent: number;
  depth75Percent: number;
  depth100Percent: number;
  averageScrollDepth: number; // percentage
}

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  element?: string;
}

export interface ConversionMetrics {
  totalConversions: number;
  conversionRate: number; // percentage
  goalCompletions: GoalCompletion[];
  revenue?: number;
  leadGeneration: LeadMetrics;
  subscriptions: number;
  downloads: number;
}

export interface GoalCompletion {
  goalId: string;
  goalName: string;
  completions: number;
  value: number;
  conversionRate: number;
}

export interface LeadMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  leadScore: number;
  leadQuality: 'high' | 'medium' | 'low';
}

export interface SEOMetrics {
  organicTraffic: number;
  keywordRankings: KeywordRanking[];
  backlinks: number;
  domainAuthority: number;
  clickThroughRateFromSERP: number; // percentage
  impressions: number;
  avgPosition: number;
  featuredSnippets: number;
}

export interface KeywordRanking {
  keyword: string;
  position: number;
  previousPosition?: number;
  searchVolume: number;
  clicks: number;
  impressions: number;
  ctr: number;
}

export interface SocialMetrics {
  totalShares: number;
  platforms: PlatformMetrics[];
  viralityScore: number;
  socialTraffic: number;
  mentions: number;
  sentiment: SentimentAnalysis;
}

export interface PlatformMetrics {
  platform: SocialPlatform;
  shares: number;
  likes: number;
  comments: number;
  reach: number;
  impressions: number;
  engagement: number;
}

export type SocialPlatform =
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'pinterest'
  | 'reddit'
  | 'instagram'
  | 'tiktok'
  | 'other';

export interface SentimentAnalysis {
  overallSentiment: 'positive' | 'negative' | 'neutral';
  positiveScore: number;
  negativeScore: number;
  neutralScore: number;
  confidenceScore: number;
}

export interface TrafficSourceMetrics {
  organic: number;
  direct: number;
  social: number;
  email: number;
  referral: number;
  paid: number;
  other: number;
}

export interface DeviceMetrics {
  desktop: number;
  mobile: number;
  tablet: number;
  browsers: BrowserMetrics[];
  operatingSystems: OSMetrics[];
}

export interface BrowserMetrics {
  browser: string;
  version: string;
  users: number;
  percentage: number;
}

export interface OSMetrics {
  os: string;
  version: string;
  users: number;
  percentage: number;
}

export interface DemographicMetrics {
  ageGroups: AgeGroupMetrics[];
  genderDistribution: GenderMetrics;
  geographicDistribution: GeographicMetrics[];
  interests: InterestMetrics[];
}

export interface AgeGroupMetrics {
  ageRange: string; // e.g., "18-24", "25-34"
  users: number;
  percentage: number;
  engagementRate: number;
}

export interface GenderMetrics {
  male: number;
  female: number;
  other: number;
  unknown: number;
}

export interface GeographicMetrics {
  country: string;
  region?: string;
  city?: string;
  users: number;
  percentage: number;
  engagementRate: number;
}

export interface InterestMetrics {
  category: string;
  interest: string;
  affinityIndex: number;
  users: number;
}

// ===== A/B TESTING FRAMEWORK =====

export interface ABTestConfig {
  id?: string;
  testName: string;
  description?: string;
  blogPostId?: string; // optional for site-wide tests

  // Test configuration
  variants: ContentVariant[];
  trafficSplit: number[]; // should sum to 100
  duration: number; // days

  // Success criteria
  successMetrics: SuccessMetric[];
  primaryMetric: string;
  significanceLevel: number; // e.g., 0.05 for 95% confidence
  minimumSampleSize: number;
  minimumDetectableEffect: number; // percentage

  // Test constraints
  targeting?: TestTargeting;
  excludeReturningVisitors?: boolean;
  deviceRestrictions?: ('desktop' | 'mobile' | 'tablet')[];
  geographicRestrictions?: string[]; // country codes

  // Test lifecycle
  status: ABTestStatus;
  startDate: Date;
  endDate?: Date;
  actualEndDate?: Date;

  // Results
  results?: ABTestResult;
  winner?: string; // variant ID
  confidence?: number;

  // Metadata
  createdBy: string;
  createdAt: Date;
  lastUpdated: Date;
}

export interface ContentVariant {
  id: string;
  name: string;
  description?: string;

  // Content variations
  headline?: string;
  subheadline?: string;
  content?: string;
  callToAction?: string;
  featuredImage?: string;

  // Layout variations
  layout?: string;
  template?: string;
  colorScheme?: Record<string, string>;

  // Advanced variations
  contentStructure?: ContentVariantStructure;
  seoElements?: SEOVariantElements;

  // Assignment
  trafficAllocation: number; // percentage
  isControl: boolean;
}

export interface ContentVariantStructure {
  sections: VariantSection[];
  wordCount?: number;
  tone?: string;
  style?: string;
  readingLevel?: number;
}

export interface VariantSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'introduction' | 'body' | 'conclusion' | 'cta' | 'other';
}

export interface SEOVariantElements {
  title?: string;
  metaDescription?: string;
  focusKeyword?: string;
  keywords?: string[];
  schema?: Record<string, any>;
}

export interface SuccessMetric {
  name: string;
  type: MetricType;
  goal: number;
  direction: 'increase' | 'decrease';
  weight: number; // for composite scoring
}

export type MetricType =
  | 'conversion_rate'
  | 'click_through_rate'
  | 'engagement_rate'
  | 'time_on_page'
  | 'bounce_rate'
  | 'scroll_depth'
  | 'social_shares'
  | 'lead_generation'
  | 'revenue';

export interface TestTargeting {
  includeAudiences?: string[];
  excludeAudiences?: string[];
  trafficSources?: string[];
  referralSources?: string[];
  customRules?: TargetingRule[];
}

export interface TargetingRule {
  field: string;
  operator:
    | 'equals'
    | 'contains'
    | 'starts_with'
    | 'greater_than'
    | 'less_than';
  value: string | number;
}

export type ABTestStatus =
  | 'draft'
  | 'scheduled'
  | 'running'
  | 'paused'
  | 'completed'
  | 'stopped'
  | 'archived';

export interface ABTestResult {
  totalParticipants: number;
  variantResults: VariantResult[];
  statisticalSignificance: boolean;
  confidenceInterval: number;
  pValue: number;
  effectSize: number;

  // Detailed analysis
  segmentAnalysis?: SegmentAnalysisResult[];
  timeSeriesData?: TimeSeriesDataPoint[];

  // Recommendations
  recommendation: TestRecommendation;
  nextSteps?: string[];
}

export interface VariantResult {
  variantId: string;
  participants: number;
  conversionRate: number;

  // All metric results
  metrics: Record<string, VariantMetricResult>;

  // Statistical analysis
  confidenceInterval: [number, number];
  standardError: number;
  zScore?: number;
}

export interface VariantMetricResult {
  value: number;
  improvement?: number; // vs control
  improvementPercentage?: number;
  significance: boolean;
}

export interface SegmentAnalysisResult {
  segmentName: string;
  segmentCriteria: Record<string, any>;
  results: VariantResult[];
}

export interface TimeSeriesDataPoint {
  timestamp: Date;
  variantId: string;
  metricName: string;
  value: number;
  cumulativeValue: number;
}

export type TestRecommendation =
  | 'implement_winner'
  | 'continue_testing'
  | 'inconclusive'
  | 'stop_test'
  | 'redesign_experiment';

// ===== ENGAGEMENT PREDICTION MODELS =====

export interface EngagementPrediction {
  id?: string;
  blogPostId: string;
  predictionType: PredictionType;

  // Core predictions
  predictedViews: number;
  predictedViewsRange: [number, number]; // min, max
  engagementScore: number; // 0-100 scale
  viralityPotential: number; // 0-100 scale

  // Detailed predictions
  predictedMetrics: PredictedMetrics;

  // Optimization insights
  optimizationSuggestions: OptimizationSuggestion[];

  // Model confidence
  confidenceLevel: number; // 0-100
  modelAccuracy?: number;

  // Prediction metadata
  modelVersion: string;
  features: PredictionFeatures;
  trainingDataSize?: number;

  // Temporal aspects
  timeHorizon: number; // days
  predictionMade: Date;
  validUntil: Date;

  // Results tracking
  actualResults?: ActualVsPredicted;
  accuracy?: number;
}

export type PredictionType =
  | 'content_performance'
  | 'viral_potential'
  | 'audience_engagement'
  | 'conversion_probability'
  | 'seo_ranking_potential';

export interface PredictedMetrics {
  views: PredictionRange;
  uniqueViews: PredictionRange;
  socialShares: PredictionRange;
  comments: PredictionRange;
  engagementRate: PredictionRange;
  timeOnPage: PredictionRange;
  bounceRate: PredictionRange;
  conversionRate?: PredictionRange;
  organicTraffic?: PredictionRange;
}

export interface PredictionRange {
  predicted: number;
  confidenceInterval: [number, number];
  probability: number; // probability of achieving predicted value
}

export interface SimpleOptimizationSuggestion {
  type: OptimizationType;
  suggestion: string;
  expectedImpact: number; // percentage improvement
  confidence: number; // 0-100
  priority: SuggestionPriority;
  implementation: string;
  estimatedEffort: EffortLevel;
  category: SuggestionCategory;
}

export type OptimizationType =
  | 'headline'
  | 'content'
  | 'structure'
  | 'seo'
  | 'timing'
  | 'imagery'
  | 'cta'
  | 'social_optimization'
  | 'technical';

export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low';

export type EffortLevel = 'minimal' | 'low' | 'medium' | 'high' | 'extensive';

export type SuggestionCategory =
  | 'content_quality'
  | 'user_experience'
  | 'technical_seo'
  | 'social_media'
  | 'conversion_optimization'
  | 'accessibility'
  | 'performance';

export interface PredictionFeatures {
  contentFeatures: ContentFeatures;
  historicalFeatures: HistoricalFeatures;
  contextualFeatures: ContextualFeatures;
  competitorFeatures?: CompetitorFeatures;
}

export interface ContentFeatures {
  wordCount: number;
  readingLevel: number;
  sentimentScore: number;
  keywordDensity: number;
  headlineScore: number;
  imageCount: number;
  linkCount: number;
  structureScore: number;
}

export interface HistoricalFeatures {
  authorPerformance: AuthorPerformance;
  similarContentPerformance: ContentPerformance[];
  seasonalTrends: SeasonalTrend[];
  audienceHistory: AudienceHistory;
}

export interface AuthorPerformance {
  averageViews: number;
  averageEngagementRate: number;
  bestPerformingContent: string[];
  authorCredibilityScore: number;
}

export interface ContentPerformance {
  contentId: string;
  similarity: number;
  performance: PerformanceMetrics;
}

export interface SeasonalTrend {
  period: string; // e.g., "Q1", "December", "summer"
  multiplier: number;
  confidence: number;
}

export interface AudienceHistory {
  totalFollowers: number;
  engagementTrend: number; // trend direction
  audienceGrowthRate: number;
  topInterests: string[];
}

export interface ContextualFeatures {
  publishTime: Date;
  seasonality: string;
  currentTrends: string[];
  competitorActivity: number;
  marketConditions: MarketCondition[];
}

export interface MarketCondition {
  factor: string; // e.g., "economic_index", "industry_news"
  value: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface CompetitorFeatures {
  competitorCount: number;
  competitorQuality: number;
  marketSaturation: number;
  differentiationScore: number;
}

export interface ActualVsPredicted {
  predictedViews: number;
  actualViews: number;
  accuracy: number;

  detailedComparison: Record<
    string,
    {
      predicted: number;
      actual: number;
      accuracy: number;
    }
  >;
}

// ===== OPTIMIZATION RECOMMENDATION ENGINE =====

export interface OptimizationRecommendation {
  id?: string;
  blogPostId: string;

  // Recommendation details
  type: OptimizationType;
  title: string;
  description: string;
  suggestion: string;

  // Impact analysis
  expectedImpact: number; // percentage improvement
  impactMetrics: string[]; // which metrics will be affected
  confidence: number; // 0-100

  // Prioritization
  priority: SuggestionPriority;
  urgency: 'immediate' | 'soon' | 'eventually';

  // Implementation
  implementation: ImplementationGuide;
  estimatedEffort: EffortLevel;
  requiredSkills: string[];
  dependencies: string[];

  // Context
  category: SuggestionCategory;
  tags: string[];
  relatedRecommendations?: string[]; // IDs of related recommendations

  // Evidence
  evidence: RecommendationEvidence;
  benchmarks?: BenchmarkData[];

  // Lifecycle
  status: RecommendationStatus;
  createdAt: Date;
  implementedAt?: Date;
  dismissedAt?: Date;

  // Results tracking
  actualImpact?: ActualImpact;
}

export interface ImplementationGuide {
  steps: ImplementationStep[];
  codeChanges?: CodeChange[];
  contentChanges?: ContentChange[];
  designChanges?: DesignChange[];

  // Resources
  documentationLinks: string[];
  toolsRequired: string[];
  timeEstimate: string; // e.g., "2-4 hours"
}

export interface ImplementationStep {
  order: number;
  title: string;
  description: string;
  type: 'content' | 'code' | 'design' | 'configuration' | 'analysis';
  difficulty: 'easy' | 'medium' | 'hard';
  timeEstimate: string;
}

export interface CodeChange {
  file: string;
  type: 'add' | 'modify' | 'remove';
  description: string;
  codeSnippet?: string;
}

export interface ContentChange {
  element: string; // e.g., "headline", "introduction", "meta_description"
  currentValue?: string;
  suggestedValue: string;
  reason: string;
}

export interface DesignChange {
  element: string; // e.g., "hero_image", "color_scheme", "typography"
  currentValue?: string;
  suggestedValue: string;
  mockupUrl?: string;
}

export interface RecommendationEvidence {
  dataSource: DataSource[];
  performanceComparison: PerformanceComparison;
  industryBenchmarks: IndustryBenchmark[];
  userFeedback?: UserFeedback[];

  // AI analysis
  aiAnalysis: AIAnalysisResult;
  modelConfidence: number;
}

export interface DataSource {
  type:
    | 'analytics'
    | 'user_testing'
    | 'competitor_analysis'
    | 'industry_report'
    | 'ai_analysis';
  name: string;
  url?: string;
  reliability: number; // 0-100
  lastUpdated: Date;
}

export interface PerformanceComparison {
  metric: string;
  currentValue: number;
  projectedValue: number;
  improvement: number;
  similarImplementations: SimilarImplementation[];
}

export interface SimilarImplementation {
  blogPostId?: string;
  description: string;
  beforeMetric: number;
  afterMetric: number;
  improvement: number;
  timeframe: string;
}

export interface IndustryBenchmark {
  industry: string;
  metric: string;
  averageValue: number;
  topPercentileValue: number;
  ourValue: number;
  gap: number;
}

export interface UserFeedback {
  source: string; // e.g., "user_survey", "support_tickets", "social_mentions"
  sentiment: 'positive' | 'negative' | 'neutral';
  frequency: number;
  summary: string;
}

export interface AIAnalysisResult {
  analysisType: string;
  findings: string[];
  confidence: number;
  supportingData: Record<string, any>;
  modelVersion: string;
  analysisDate: Date;
}

export type RecommendationStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'in_progress'
  | 'implemented'
  | 'dismissed'
  | 'monitoring';

export interface ActualImpact {
  implementationDate: Date;
  measurementPeriod: number; // days

  // Measured improvements
  metricImprovements: MetricImprovement[];
  overallImprovement: number;

  // Success assessment
  successful: boolean;
  notes?: string;
  unexpectedEffects?: string[];

  // Learning
  lessonsLearned: string[];
  recommendationAccuracy: number;
}

export interface MetricImprovement {
  metric: string;
  beforeValue: number;
  afterValue: number;
  improvement: number; // percentage
  significance: boolean;
  measurementConfidence: number;
}

export interface BenchmarkData {
  source: string;
  industry: string;
  metric: string;
  value: number;
  percentile: number;
  sampleSize?: number;
  dateCollected: Date;
}

// ===== REQUESTED SPECIFIC INTERFACES =====

/**
 * ContentPerformance interface as requested
 * Comprehensive content performance tracking with specific property structure
 */
export interface ContentPerformance {
  engagementMetrics: EngagementData;
  seoRankings: RankingData[];
  trafficAnalytics: TrafficData;
  conversionMetrics: ConversionData;
  optimizationSuggestions: OptimizationSuggestion[];
}

/**
 * EngagementData supporting type for ContentPerformance interface
 * Detailed engagement analytics and user interaction metrics
 */
export interface EngagementData {
  totalEngagements: number;
  engagementRate: number; // percentage
  engagementVelocity: number; // engagements per hour
  interactionTypes: {
    likes: number;
    shares: number;
    comments: number;
    bookmarks: number;
    downloads: number;
    clicks: number;
  };
  socialEngagement: {
    platforms: SocialPlatformEngagement[];
    totalSocialShares: number;
    viralityIndex: number; // 0-100 scale
    mentionsCount: number;
    hashtagPerformance: HashtagMetrics[];
  };
  userBehavior: {
    averageTimeOnPage: number; // seconds
    scrollDepthAnalysis: {
      depth25Percent: number;
      depth50Percent: number;
      depth75Percent: number;
      depth100Percent: number;
      averageScrollDepth: number;
    };
    clickHeatmap: HeatmapData[];
    exitPoints: ExitPointData[];
    returningVisitorRate: number;
  };
  demographics: {
    ageGroups: DemographicSegment[];
    genderDistribution: GenderDistribution;
    geographicDistribution: GeographicSegment[];
    devicePreferences: DeviceEngagement[];
  };
  temporalPatterns: {
    hourlyEngagement: HourlyEngagementData[];
    dailyEngagement: DailyEngagementData[];
    seasonalTrends: SeasonalEngagementData[];
  };
}

/**
 * RankingData supporting type for ContentPerformance interface
 * SEO ranking performance and keyword position tracking
 */
export interface RankingData {
  keyword: string;
  currentPosition: number;
  previousPosition?: number;
  positionChange: number;
  searchVolume: number;
  difficulty: number; // 0-100 scale
  clicks: number;
  impressions: number;
  clickThroughRate: number; // percentage
  averagePosition: number;
  competitorPositions: {
    competitor: string;
    position: number;
    url: string;
  }[];
  rankingHistory: {
    date: Date;
    position: number;
    impressions: number;
    clicks: number;
  }[];
  opportunities: {
    potentialTrafficGain: number;
    requiredPositionImprovement: number;
    difficultyLevel: 'easy' | 'moderate' | 'difficult';
    recommendedActions: string[];
  };
  featuredSnippets: {
    hasSnippet: boolean;
    snippetType?: 'paragraph' | 'list' | 'table' | 'video';
    snippetContent?: string;
    lostSnippetOpportunity?: boolean;
  };
}

/**
 * TrafficData supporting type for ContentPerformance interface
 * Comprehensive traffic analytics and source attribution
 */
export interface TrafficData {
  totalTraffic: number;
  uniqueVisitors: number;
  pageViews: number;
  sessions: number;
  trafficSources: {
    organic: TrafficSourceDetail;
    direct: TrafficSourceDetail;
    social: TrafficSourceDetail;
    referral: TrafficSourceDetail;
    email: TrafficSourceDetail;
    paid: TrafficSourceDetail;
    other: TrafficSourceDetail;
  };
  geographicAnalysis: {
    countries: CountryTrafficData[];
    regions: RegionTrafficData[];
    cities: CityTrafficData[];
  };
  deviceAnalysis: {
    desktop: DeviceTrafficData;
    mobile: DeviceTrafficData;
    tablet: DeviceTrafficData;
  };
  browserAnalysis: BrowserTrafficData[];
  temporalAnalysis: {
    hourlyTraffic: HourlyTrafficData[];
    dailyTraffic: DailyTrafficData[];
    weeklyTrends: WeeklyTrafficData[];
    monthlyTrends: MonthlyTrafficData[];
  };
  qualityMetrics: {
    bounceRate: number; // percentage
    averageSessionDuration: number; // seconds
    pagesPerSession: number;
    newVisitorPercentage: number;
    returningVisitorPercentage: number;
  };
  contentInteraction: {
    mostEngagingSections: ContentSectionMetrics[];
    leastEngagingSections: ContentSectionMetrics[];
    averageReadingProgress: number; // percentage
    contentCompletionRate: number; // percentage
  };
}

/**
 * ConversionData supporting type for ContentPerformance interface
 * Conversion tracking and goal completion analytics
 */
export interface ConversionData {
  totalConversions: number;
  conversionRate: number; // percentage
  conversionValue: number; // monetary value
  goalCompletions: GoalCompletionData[];
  funnelAnalysis: {
    stages: FunnelStageData[];
    dropOffPoints: DropOffAnalysis[];
    conversionPath: ConversionPathData[];
  };
  attributionAnalysis: {
    firstClickAttribution: AttributionData;
    lastClickAttribution: AttributionData;
    linearAttribution: AttributionData;
    timeDecayAttribution: AttributionData;
  };
  userJourney: {
    averageTimeToConvert: number; // hours
    touchpointsBeforeConversion: number;
    mostCommonJourneyPath: string[];
    abandonmentPoints: AbandonmentData[];
  };
  segmentedConversions: {
    newVisitorConversions: SegmentConversionData;
    returningVisitorConversions: SegmentConversionData;
    organicTrafficConversions: SegmentConversionData;
    socialTrafficConversions: SegmentConversionData;
    referralTrafficConversions: SegmentConversionData;
  };
  conversionOptimization: {
    bestPerformingCTAs: CTAPerformanceData[];
    underperformingElements: UnderperformingElementData[];
    abTestResults: ABTestConversionData[];
  };
}

/**
 * OptimizationSuggestion supporting type for ContentPerformance interface
 * AI-powered recommendations for content performance improvement
 */
export interface OptimizationSuggestion {
  id: string;
  category:
    | 'seo'
    | 'engagement'
    | 'conversion'
    | 'traffic'
    | 'technical'
    | 'content';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  detailedAnalysis: string;
  expectedImpact: {
    metric: string;
    currentValue: number;
    projectedValue: number;
    improvementPercentage: number;
    confidenceLevel: number; // 0-100
  };
  implementation: {
    difficulty: 'easy' | 'moderate' | 'difficult' | 'complex';
    estimatedTime: string; // e.g., "2-4 hours"
    requiredSkills: string[];
    steps: DetailedImplementationStep[];
    resources: ResourceLink[];
  };
  evidence: {
    dataPoints: DataPoint[];
    benchmarkComparison: BenchmarkComparison;
    previousSuccessCase?: SuccessCaseData;
    industryBestPractices: BestPracticeReference[];
  };
  timeline: {
    recommendedStartDate: Date;
    estimatedCompletionDate: Date;
    checkpointDates: Date[];
    measurementDate: Date;
  };
  dependencies: {
    prerequisiteActions: string[];
    relatedSuggestions: string[]; // IDs of related suggestions
    conflictingSuggestions: string[]; // IDs of conflicting suggestions
  };
  measurability: {
    successMetrics: string[];
    measurementMethod: string;
    expectedResultsTimeframe: string;
    rollbackPlan?: string;
  };
}

// Supporting types for the above interfaces

export interface SocialPlatformEngagement {
  platform: SocialPlatform;
  engagements: number;
  reach: number;
  impressions: number;
  shareRate: number;
  commentRate: number;
  growthRate: number; // percentage change
}

export interface HashtagMetrics {
  hashtag: string;
  usage: number;
  reach: number;
  engagement: number;
  trending: boolean;
}

export interface HeatmapData {
  x: number;
  y: number;
  intensity: number;
  element: string;
  clickCount: number;
}

export interface ExitPointData {
  section: string;
  exitRate: number; // percentage
  averageTimeBeforeExit: number; // seconds
  commonNextActions: string[];
}

export interface DemographicSegment {
  segment: string;
  count: number;
  percentage: number;
  engagementRate: number;
  conversionRate: number;
}

export interface GenderDistribution {
  male: number;
  female: number;
  nonBinary: number;
  unknown: number;
}

export interface GeographicSegment {
  location: string;
  type: 'country' | 'region' | 'city';
  visitors: number;
  percentage: number;
  engagementRate: number;
}

export interface DeviceEngagement {
  device: 'desktop' | 'mobile' | 'tablet';
  sessions: number;
  engagementRate: number;
  conversionRate: number;
  averageSessionDuration: number;
}

export interface HourlyEngagementData {
  hour: number; // 0-23
  engagements: number;
  engagementRate: number;
}

export interface DailyEngagementData {
  date: Date;
  engagements: number;
  engagementRate: number;
}

export interface SeasonalEngagementData {
  season: string;
  multiplier: number;
  confidence: number;
}

export interface TrafficSourceDetail {
  visits: number;
  percentage: number;
  bounceRate: number;
  averageSessionDuration: number;
  conversionRate: number;
  topReferrers?: string[];
}

export interface CountryTrafficData {
  country: string;
  countryCode: string;
  visits: number;
  percentage: number;
  engagementRate: number;
}

export interface RegionTrafficData {
  region: string;
  country: string;
  visits: number;
  percentage: number;
}

export interface CityTrafficData {
  city: string;
  region: string;
  country: string;
  visits: number;
}

export interface DeviceTrafficData {
  visits: number;
  percentage: number;
  bounceRate: number;
  averageSessionDuration: number;
}

export interface BrowserTrafficData {
  browser: string;
  version: string;
  visits: number;
  percentage: number;
}

export interface HourlyTrafficData {
  hour: number;
  visits: number;
}

export interface DailyTrafficData {
  date: Date;
  visits: number;
}

export interface WeeklyTrafficData {
  week: Date;
  visits: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MonthlyTrafficData {
  month: Date;
  visits: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ContentSectionMetrics {
  section: string;
  timeSpent: number; // seconds
  engagementRate: number;
  scrollThroughRate: number;
}

export interface GoalCompletionData {
  goalId: string;
  goalName: string;
  goalType: 'pageview' | 'event' | 'duration' | 'pages_per_session' | 'custom';
  completions: number;
  completionRate: number;
  value: number;
}

export interface FunnelStageData {
  stageName: string;
  stageOrder: number;
  entries: number;
  exits: number;
  conversionToNext: number; // percentage
}

export interface DropOffAnalysis {
  stageName: string;
  dropOffRate: number; // percentage
  commonDropOffReasons: string[];
  recoveryOpportunities: string[];
}

export interface ConversionPathData {
  path: string[];
  conversions: number;
  percentage: number;
}

export interface AttributionData {
  channelContributions: {
    channel: string;
    contribution: number; // percentage
    conversions: number;
  }[];
}

export interface AbandonmentData {
  point: string;
  abandonmentRate: number;
  recoveryRate: number;
  commonReasons: string[];
}

export interface SegmentConversionData {
  segment: string;
  conversions: number;
  conversionRate: number;
  averageValue: number;
}

export interface CTAPerformanceData {
  ctaText: string;
  location: string;
  clicks: number;
  conversionRate: number;
  performance: 'high' | 'medium' | 'low';
}

export interface UnderperformingElementData {
  element: string;
  issue: string;
  currentPerformance: number;
  expectedPerformance: number;
  improvementPotential: number;
}

export interface ABTestConversionData {
  testName: string;
  variants: string[];
  winningVariant: string;
  improvement: number; // percentage
  confidence: number;
}

export interface DetailedImplementationStep {
  stepNumber: number;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: 'easy' | 'moderate' | 'difficult';
  requiredTools: string[];
}

export interface ResourceLink {
  title: string;
  url: string;
  type: 'documentation' | 'tool' | 'tutorial' | 'reference';
}

export interface DataPoint {
  metric: string;
  value: number;
  source: string;
  confidence: number;
}

export interface BenchmarkComparison {
  industry: string;
  ourValue: number;
  industryAverage: number;
  topPercentile: number;
  bottomPercentile: number;
  ourPercentileRank: number;
}

export interface SuccessCaseData {
  description: string;
  beforeValue: number;
  afterValue: number;
  improvement: number;
  timeframe: string;
}

export interface BestPracticeReference {
  title: string;
  description: string;
  source: string;
  applicability: number; // 0-100 scale
}

// ===== CONFIGURATION & API INTERFACES =====

export interface PerformanceOptimizationConfig {
  // Analytics integration
  analyticsProviders: AnalyticsProvider[];

  // A/B testing
  abTesting: ABTestingConfig;

  // Prediction models
  predictionModels: PredictionModelConfig;

  // Recommendations
  recommendationEngine: RecommendationEngineConfig;

  // Data privacy
  privacySettings: PrivacySettings;
}

export interface AnalyticsProvider {
  name: string; // e.g., "google_analytics", "adobe_analytics"
  type: 'web_analytics' | 'social_media' | 'email' | 'custom';
  apiKey?: string;
  configuration: Record<string, any>;
  enabled: boolean;
}

export interface ABTestingConfig {
  enabled: boolean;
  defaultDuration: number; // days
  defaultSignificanceLevel: number;
  minimumSampleSize: number;
  autoWinner: boolean; // automatically implement winning variant
  notificationSettings: NotificationSettings;
}

export interface PredictionModelConfig {
  enabled: boolean;
  models: ModelConfig[];
  updateFrequency: number; // hours
  confidenceThreshold: number;
  featureUpdateFrequency: number; // hours
}

export interface ModelConfig {
  name: string;
  type: PredictionType;
  version: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface RecommendationEngineConfig {
  enabled: boolean;
  updateFrequency: number; // hours
  priorityThreshold: number;
  autoImplement: boolean;
  categories: SuggestionCategory[];
}

export interface PrivacySettings {
  gdprCompliant: boolean;
  dataRetentionDays: number;
  anonymizeData: boolean;
  cookieConsent: boolean;
  dataExportEnabled: boolean;
  rightToDelete: boolean;
}

export interface NotificationSettings {
  email: boolean;
  inApp: boolean;
  slack?: {
    webhookUrl: string;
    channel: string;
  };
  discord?: {
    webhookUrl: string;
  };
}

// ===== API REQUEST/RESPONSE TYPES =====

export interface PerformanceTrackingRequest {
  blogPostId: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  metrics?: string[];
  includeSegmentation?: boolean;
}

export interface PerformanceTrackingResponse {
  success: boolean;
  data: PerformanceMetrics;
  metadata: {
    lastUpdated: Date;
    dataFreshness: number; // minutes
    sources: string[];
  };
  error?: string;
}

export interface ABTestRequest {
  testConfig: ABTestConfig;
  autoStart?: boolean;
}

export interface ABTestResponse {
  success: boolean;
  testId: string;
  status: ABTestStatus;
  message: string;
  error?: string;
}

export interface PredictionRequest {
  blogPostId: string;
  predictionTypes: PredictionType[];
  timeHorizon: number; // days
  includeOptimizations?: boolean;
}

export interface PredictionResponse {
  success: boolean;
  predictions: EngagementPrediction[];
  modelInfo: {
    version: string;
    accuracy: number;
    lastTrained: Date;
  };
  error?: string;
}

export interface OptimizationRequest {
  blogPostId: string;
  categories?: SuggestionCategory[];
  priority?: SuggestionPriority;
  maxRecommendations?: number;
}

export interface OptimizationResponse {
  success: boolean;
  recommendations: OptimizationRecommendation[];
  priorityScore: number;
  totalImpactPotential: number;
  error?: string;
}

// ===== ERROR TYPES =====

export class PerformanceOptimizationError extends Error {
  public readonly code: string;
  public readonly type:
    | 'analytics'
    | 'prediction'
    | 'optimization'
    | 'ab_testing'
    | 'configuration';
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    type: PerformanceOptimizationError['type'],
    details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'PerformanceOptimizationError';
    this.code = code;
    this.type = type;
    this.details = details;
  }
}
