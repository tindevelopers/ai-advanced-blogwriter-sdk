
/**
 * Performance Optimization Types
 * Week 11-12 Implementation
 *
 * Comprehensive type definitions for content performance tracking,
 * A/B testing, and optimization recommendations
 */

import type { BlogPost } from './blog-post';
import type { SEOAnalysis } from './seo-engine';

// ===== CORE PERFORMANCE METRICS =====

export interface ContentPerformance {
  contentId: string;
  blogPostId: string;
  
  // Basic metrics
  metrics: PerformanceMetrics;
  engagement: EngagementMetrics;
  conversions: ConversionMetrics;
  seo: SEOMetrics;
  social: SocialMetrics;
  
  // Analysis
  trafficSources: TrafficSourceMetrics;
  deviceMetrics: DeviceMetrics;
  demographics: DemographicMetrics;
  
  // Time-based data
  timeRange: DateRange;
  collectedAt: Date;
  
  // Optimization data
  suggestions: OptimizationSuggestion[];
  predictions: EngagementPrediction[];
  
  // Comparison data
  benchmarks: BenchmarkData[];
}

export interface PerformanceMetrics {
  // Traffic metrics
  pageViews: number;
  uniqueViews: number;
  sessions: number;
  bounceRate: number; // 0-1
  avgSessionDuration: number; // seconds
  
  // Engagement metrics
  avgTimeOnPage: number; // seconds
  scrollDepth: ScrollDepthMetrics;
  heatmapData?: HeatmapData[];
  exitPoints?: ExitPointData[];
  
  // Performance metrics
  loadTime: number; // milliseconds
  firstContentfulPaint: number; // milliseconds
  largestContentfulPaint: number; // milliseconds
  cumulativeLayoutShift: number;
  
  // Quality metrics
  readabilityScore?: number;
  contentQualityScore?: number;
  userSatisfactionScore?: number;
}

export interface EngagementMetrics {
  // Interaction data
  totalEngagements: number;
  engagementRate: number; // 0-1
  clickThroughRate?: number; // 0-1
  
  // Content interactions
  shares: number;
  likes: number;
  comments: number;
  saves: number;
  
  // Platform-specific data
  socialPlatforms: SocialPlatformEngagement[];
  
  // Advanced metrics
  viralityCoefficient?: number;
  engagementVelocity: number; // engagements per hour
  peakEngagementTime?: Date;
}

export interface SocialPlatformEngagement {
  platform: string;
  shares: number;
  likes: number;
  comments: number;
  clickThroughs: number;
  impressions?: number;
  reach?: number;
  hashtags?: HashtagMetrics[];
}

export interface HashtagMetrics {
  hashtag: string;
  usage: number;
  reach: number;
  engagement: number;
}

export interface ScrollDepthMetrics {
  depth25Percent: number; // users who scrolled 25%
  depth50Percent: number; // users who scrolled 50%
  depth75Percent: number; // users who scrolled 75%
  depth100Percent: number; // users who scrolled 100%
  averageDepth: number; // 0-1
}

export interface HeatmapData {
  elementId?: string;
  x: number;
  y: number;
  clicks: number;
  hovers: number;
  scrollPauses: number;
}

export interface ExitPointData {
  elementId?: string;
  position: number; // percentage through content
  exitCount: number;
  exitRate: number; // 0-1
}

// ===== CONVERSION METRICS =====

export interface ConversionMetrics {
  // Basic conversion data
  totalConversions: number;
  conversionRate: number; // 0-1
  goalCompletions: GoalCompletionData[];
  
  // Revenue data
  revenue?: number;
  revenuePerVisitor?: number;
  averageOrderValue?: number;
  
  // Funnel analysis
  funnelStages: FunnelStageData[];
  dropOffAnalysis: DropOffAnalysis[];
  
  // Attribution
  conversionPaths: ConversionPathData[];
  attributionData: AttributionData[];
  
  // Segmentation
  segmentConversions: SegmentConversionData[];
  
  // Call-to-Action performance
  ctaPerformance: CTAPerformanceData[];
}

export interface GoalCompletionData {
  goalId: string;
  goalName: string;
  completions: number;
  conversionRate: number;
  value?: number;
  averageTimeToConversion?: number; // seconds
}

export interface FunnelStageData {
  stageName: string;
  visitors: number;
  conversionRate: number;
  dropOffRate: number;
  averageTimeSpent: number; // seconds
}

export interface DropOffAnalysis {
  stage: string;
  dropOffCount: number;
  dropOffRate: number;
  reasons?: string[];
  recovery?: {
    recoveredUsers: number;
    recoveryRate: number;
  };
}

export interface ConversionPathData {
  pathId: string;
  steps: string[];
  conversionCount: number;
  conversionRate: number;
  averageTimeToConvert: number; // seconds
}

export interface AttributionData {
  channel: string;
  touchpoints: number;
  firstTouch: number;
  lastTouch: number;
  assisted: number;
  conversionValue?: number;
}

export interface SegmentConversionData {
  segmentName: string;
  segmentSize: number;
  conversions: number;
  conversionRate: number;
  averageValue?: number;
}

export interface CTAPerformanceData {
  ctaId: string;
  ctaText: string;
  position: string;
  impressions: number;
  clicks: number;
  clickThroughRate: number;
  conversions: number;
  conversionRate: number;
}

// ===== SEO METRICS =====

export interface SEOMetrics {
  // Ranking data
  keywordRankings: KeywordRanking[];
  averagePosition: number;
  visibilityScore: number; // 0-1
  
  // Traffic data
  organicTraffic: number;
  organicClickThroughRate: number; // 0-1
  organicConversions: number;
  
  // Technical SEO
  pageSpeedScore: number; // 0-100
  coreWebVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
  };
  
  // Content metrics
  contentScore: number; // 0-100
  readabilityScore: number; // 0-100
  keywordDensity: Record<string, number>;
  
  // Backlink data
  backlinks?: {
    totalLinks: number;
    uniqueDomains: number;
    authorityScore: number;
    newLinks: number;
    lostLinks: number;
  };
}

export interface KeywordRanking {
  keyword: string;
  position: number;
  previousPosition?: number;
  searchVolume: number;
  difficulty: number; // 0-100
  url: string;
  clickThroughRate?: number;
  impressions?: number;
  clicks?: number;
}

// ===== SOCIAL METRICS =====

export interface SocialMetrics {
  platforms: PlatformMetrics[];
  totalShares: number;
  totalEngagement: number;
  viralityScore: number; // 0-1
  sentiment: SentimentAnalysis;
  influencerMentions?: number;
  brandMentions?: number;
  hashtags?: HashtagMetrics[];
}

export interface PlatformMetrics {
  platform: SocialPlatform;
  shares: number;
  likes: number;
  comments: number;
  saves?: number;
  impressions?: number;
  reach?: number;
  engagementRate: number; // 0-1
  clickThroughRate?: number; // 0-1
}

export enum SocialPlatform {
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  INSTAGRAM = 'instagram',
  PINTEREST = 'pinterest',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube',
  REDDIT = 'reddit'
}

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  confidenceScore: number; // 0-1
}

// ===== TRAFFIC AND DEMOGRAPHICS =====

export interface TrafficSourceMetrics {
  sources: TrafficSourceDetail[];
  totalSessions: number;
  bounceRateBySource: Record<string, number>;
  conversionRateBySource: Record<string, number>;
}

export interface TrafficSourceDetail {
  source: string;
  medium: string;
  campaign?: string;
  sessions: number;
  percentage: number;
  newUsers: number;
  returningUsers: number;
  bounceRate: number;
  avgSessionDuration: number;
  pagesPerSession: number;
  conversions?: number;
  conversionRate?: number;
}

export interface DeviceMetrics {
  desktop: DeviceBreakdown;
  mobile: DeviceBreakdown;
  tablet: DeviceBreakdown;
  browsers: BrowserMetrics[];
  operatingSystems: OSMetrics[];
}

export interface DeviceBreakdown {
  sessions: number;
  percentage: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversionRate?: number;
}

export interface BrowserMetrics {
  browser: string;
  version?: string;
  sessions: number;
  percentage: number;
  bounceRate: number;
}

export interface OSMetrics {
  operatingSystem: string;
  version?: string;
  sessions: number;
  percentage: number;
  bounceRate: number;
}

export interface DemographicMetrics {
  age: AgeGroupMetrics[];
  gender: GenderMetrics[];
  geography: GeographicMetrics[];
  interests: InterestMetrics[];
  segments: DemographicSegment[];
}

export interface AgeGroupMetrics {
  ageGroup: string;
  percentage: number;
  sessions: number;
  engagementRate: number;
  conversionRate?: number;
}

export interface GenderMetrics {
  gender: string;
  percentage: number;
  sessions: number;
  engagementRate: number;
  conversionRate?: number;
}

export interface GeographicMetrics {
  country: string;
  region?: string;
  city?: string;
  sessions: number;
  percentage: number;
  bounceRate: number;
  conversionRate?: number;
}

export interface InterestMetrics {
  interest: string;
  affinity: number; // 0-1
  sessions: number;
  engagementRate: number;
}

export interface DemographicSegment {
  segmentName: string;
  description: string;
  size: number;
  percentage: number;
  characteristics: Record<string, any>;
  performance: {
    engagementRate: number;
    conversionRate: number;
    avgSessionDuration: number;
  };
}

// ===== A/B TESTING =====

export interface ABTestConfig {
  id: string;
  testName: string;
  description: string;
  blogPostId?: string; // Added missing property
  variants: ContentVariant[];
  trafficSplit: number[]; // percentage for each variant
  duration: number; // days
  successMetrics: SuccessMetric[];
  primaryMetric: string;
  targetAudience?: AudienceFilter;
  targeting?: TestTargeting; // Added missing property
  startDate: Date;
  endDate?: Date;
  status: ABTestStatus;
  minSampleSize: number;
  minimumSampleSize?: number; // Added alias
  confidenceLevel: number; // 0.9, 0.95, 0.99
  significanceLevel?: number; // Added missing property
  minimumDetectableEffect?: number; // Added missing property
  excludeReturningVisitors?: boolean; // Added missing property
  deviceRestrictions?: string[]; // Added missing property
  geographicRestrictions?: string[]; // Added missing property
  createdAt: Date;
  lastUpdated: Date;
  createdBy: string;
}

export interface ContentVariant {
  id: string;
  name: string;
  description: string;
  isControl: boolean;
  structure: ContentVariantStructure;
  weight: number; // traffic percentage 0-1
  trafficAllocation?: number; // Added missing property
  
  // Added missing properties for direct access
  headline?: string;
  subheadline?: string;
  content?: string;
  callToAction?: string;
  featuredImage?: string;
  layout?: string;
  template?: string;
  colorScheme?: string;
  seoElements?: SEOVariantElements;
  contentStructure?: ContentVariantStructure;
}

export interface ContentVariantStructure {
  title?: string;
  headline?: string;
  introduction?: string;
  sections?: VariantSection[];
  conclusion?: string;
  callToAction?: string;
  seo?: SEOVariantElements;
  design?: Record<string, any>;
}

export interface VariantSection {
  id: string;
  title?: string;
  content?: string;
  order: number;
  type: string;
}

export interface SEOVariantElements {
  metaTitle?: string;
  metaDescription?: string;
  focusKeywords?: string[];
  schema?: Record<string, any>;
}

export interface SuccessMetric {
  name: string;
  type: MetricType;
  target?: number;
  weight: number; // importance 0-1
  direction: 'increase' | 'decrease';
}

export enum MetricType {
  CONVERSION_RATE = 'conversion_rate',
  ENGAGEMENT_RATE = 'engagement_rate',
  BOUNCE_RATE = 'bounce_rate',
  TIME_ON_PAGE = 'time_on_page',
  SCROLL_DEPTH = 'scroll_depth',
  CLICK_THROUGH_RATE = 'click_through_rate',
  SOCIAL_SHARES = 'social_shares',
  REVENUE = 'revenue',
  CUSTOM = 'custom'
}

export interface AudienceFilter {
  demographics?: {
    age?: string[];
    gender?: string[];
    location?: string[];
  };
  behavioral?: {
    previousVisits?: number;
    engagementLevel?: 'low' | 'medium' | 'high';
    interests?: string[];
  };
  technical?: {
    device?: string[];
    browser?: string[];
    referralSource?: string[];
  };
}

export interface TestTargeting {
  rules: TargetingRule[];
}

export interface TargetingRule {
  type: string;
  value: any;
  operator: string;
}

export enum ABTestStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface ABTestResult {
  testId: string;
  results: VariantResult[];
  winner?: string;
  confidence: number; // 0-1
  significance: boolean;
  lift: number; // percentage improvement
  recommendation: TestRecommendation;
  segmentAnalysis: SegmentAnalysisResult[];
  duration: number; // actual test duration in days
  completedAt: Date;
}

export interface VariantResult {
  variantId: string;
  variantName: string;
  participants: number;
  metrics: VariantMetricResult[];
  improvement: number; // percentage vs control
  improvementPercentage: number; // Added alias
  confidence: number;
  isWinner: boolean;
  isStatisticallySignificant: boolean;
}

export interface VariantMetricResult {
  metricName: string;
  value: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  pValue: number;
  improvement?: number; // vs control
}

export interface SegmentAnalysisResult {
  segmentName: string;
  segmentSize: number;
  results: VariantResult[];
  significance: boolean;
  recommendation: string;
}

export interface TestRecommendation {
  action: 'implement_winner' | 'continue_testing' | 'inconclusive' | 'test_failed';
  reasoning: string;
  confidence: number;
  nextSteps?: string[];
  potentialImpact?: string;
}

// ===== PREDICTIONS AND OPTIMIZATION =====

export interface EngagementPrediction {
  contentId: string;
  predictionType: PredictionType;
  predictedMetrics: PredictedMetrics;
  confidence: number; // 0-1
  timeHorizon: number; // days
  factors: PredictionFeatures;
  recommendations: SimpleOptimizationSuggestion[];
  createdAt: Date;
  modelVersion: string;
  accuracy?: ActualVsPredicted; // filled in after time passes
}

export enum PredictionType {
  ENGAGEMENT = 'engagement',
  CONVERSION = 'conversion',
  TRAFFIC = 'traffic',
  SOCIAL_PERFORMANCE = 'social_performance',
  SEO_PERFORMANCE = 'seo_performance'
}

export interface PredictedMetrics {
  pageViews: PredictionRange;
  engagementRate: PredictionRange;
  conversionRate?: PredictionRange;
  socialShares: PredictionRange;
  bounceRate: PredictionRange;
  timeOnPage: PredictionRange;
  revenue?: PredictionRange;
}

export interface PredictionRange {
  low: number;
  expected: number;
  high: number;
  unit?: string;
}

export interface PredictionFeatures {
  content: ContentFeatures;
  historical: HistoricalFeatures;
  contextual: ContextualFeatures;
  external: MarketCondition[];
}

export interface ContentFeatures {
  wordCount: number;
  readabilityScore: number;
  seoScore: number;
  topicRelevance: number;
  contentType: string;
  headingStructure: number;
  imageCount: number;
  linkCount: number;
  keywordDensity: Record<string, number>;
}

export interface HistoricalFeatures {
  authorPerformance: AuthorPerformance;
  similarContentPerformance: ContentPerformance[];
  seasonalTrends: SeasonalTrend[];
  audienceHistory: AudienceHistory;
}

export interface AuthorPerformance {
  averageEngagement: number;
  averageTraffic: number;
  topicExpertise: Record<string, number>;
  historicalAccuracy: number;
  followerCount?: number;
}

export interface SeasonalTrend {
  period: string; // 'Q1', 'summer', 'holiday', etc.
  multiplier: number;
  confidence: number;
}

export interface AudienceHistory {
  size: number;
  growthRate: number;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  loyaltyScore: number;
  demographics: DemographicSegment[];
}

export interface ContextualFeatures {
  publishTime: Date;
  dayOfWeek: number;
  seasonality: string;
  marketConditions: MarketCondition[];
  competitorActivity: CompetitorFeatures[];
  trendingTopics: string[];
}

export interface MarketCondition {
  factor: string;
  impact: number; // -1 to 1
  description: string;
}

export interface CompetitorFeatures {
  competitorId: string;
  recentActivity: number;
  averageEngagement: number;
  topicOverlap: number;
}

export interface ActualVsPredicted {
  predictedValue: number;
  actualValue: number;
  accuracy: number; // 0-1
  absoluteError: number;
  relativeError: number; // percentage
}

// ===== OPTIMIZATION SUGGESTIONS =====

export interface SimpleOptimizationSuggestion {
  id: string;
  category: OptimizationType;
  title: string;
  description: string;
  recommendation: string;
  priority: SuggestionPriority;
  effort: EffortLevel;
  expectedImpact: string;
  confidence: number; // 0-1
  evidence: RecommendationEvidence;
  implementation: ImplementationGuide;
  createdAt: Date;
}

export enum OptimizationType {
  CONTENT = 'content',
  SEO = 'seo',
  DESIGN = 'design',
  TIMING = 'timing',
  TARGETING = 'targeting',
  TECHNICAL = 'technical',
  SOCIAL = 'social'
}

export enum SuggestionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum EffortLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum SuggestionCategory {
  CONTENT_OPTIMIZATION = 'content_optimization',
  SEO_IMPROVEMENT = 'seo_improvement',
  USER_EXPERIENCE = 'user_experience',
  PERFORMANCE = 'performance',
  ENGAGEMENT = 'engagement',
  CONVERSION = 'conversion'
}

export interface RecommendationEvidence {
  dataSources: DataSource[];
  benchmarks: PerformanceComparison[];
  similarImplementations: SimilarImplementation[];
  industryBenchmarks: IndustryBenchmark[];
  userFeedback?: UserFeedback[];
  aiAnalysis: AIAnalysisResult;
}

export interface DataSource {
  source: string;
  dataPoints: number;
  timeRange: DateRange;
  confidence: number;
}

export interface PerformanceComparison {
  metric: string;
  currentValue: number;
  benchmarkValue: number;
  difference: number;
  unit: string;
}

export interface SimilarImplementation {
  implementation: string;
  context: string;
  results: string;
  applicability: number; // 0-1
}

export interface IndustryBenchmark {
  industry: string;
  metric: string;
  value: number;
  percentile: number;
  source: string;
}

export interface UserFeedback {
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  comment: string;
  relevance: number; // 0-1
}

export interface AIAnalysisResult {
  model: string;
  confidence: number;
  reasoning: string;
  supportingEvidence: string[];
  limitations: string[];
}

export interface ImplementationGuide {
  steps: ImplementationStep[];
  estimatedTime: string;
  requiredSkills: string[];
  tools: string[];
  risks: string[];
  successMetrics: string[];
}

export interface ImplementationStep {
  step: number;
  description: string;
  details?: string;
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  codeChanges?: CodeChange[];
  contentChanges?: ContentChange[];
  designChanges?: DesignChange[];
  resourceLinks?: ResourceLink[];
}

export interface CodeChange {
  file: string;
  change: string;
  before?: string;
  after?: string;
}

export interface ContentChange {
  section: string;
  change: string;
  rationale: string;
}

export interface DesignChange {
  element: string;
  change: string;
  mockup?: string;
}

export interface ResourceLink {
  title: string;
  url: string;
  type: 'documentation' | 'tutorial' | 'tool' | 'example';
}

// ===== OPTIMIZATION RECOMMENDATIONS =====

export interface OptimizationRecommendation {
  id: string;
  contentId: string;
  type: OptimizationType;
  priority: SuggestionPriority;
  title: string;
  description: string;
  currentState: string;
  recommendedState: string;
  expectedImpact: {
    metric: string;
    improvement: number;
    confidence: number;
  }[];
  implementation: ImplementationGuide;
  evidence: RecommendationEvidence;
  status: RecommendationStatus;
  createdAt: Date;
  implementedAt?: Date;
  results?: ActualImpact;
}

export enum RecommendationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  IMPLEMENTED = 'implemented',
  REJECTED = 'rejected',
  OUTDATED = 'outdated'
}

export interface ActualImpact {
  metrics: MetricImprovement[];
  overallScore: number; // 0-1
  measuredAt: Date;
  confidence: number;
  duration: number; // days measured
}

export interface MetricImprovement {
  metric: string;
  beforeValue: number;
  afterValue: number;
  improvement: number; // percentage
  significance: boolean;
}

// ===== BENCHMARK DATA =====

export interface BenchmarkData {
  industry: string;
  contentType: string;
  metrics: BenchmarkComparison[];
  sampleSize: number;
  timeRange: DateRange;
  source: string;
  lastUpdated: Date;
}

export interface BenchmarkComparison {
  metric: string;
  value: number;
  percentile: number;
  unit: string;
  context?: string;
}

// ===== TIME SERIES AND ANALYTICS =====

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface DataPoint {
  timestamp: Date;
  metric: string;
  value: number;
  dimensions?: Record<string, string>;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// ===== REQUEST/RESPONSE INTERFACES =====

export interface PerformanceOptimizationConfig {
  analytics: AnalyticsProvider[];
  abTesting?: ABTestingConfig;
  prediction?: PredictionModelConfig;
  recommendations?: RecommendationEngineConfig;
  privacy?: PrivacySettings;
  notifications?: NotificationSettings;
}

export enum AnalyticsProvider {
  GOOGLE_ANALYTICS = 'google_analytics',
  ADOBE_ANALYTICS = 'adobe_analytics',
  MIXPANEL = 'mixpanel',
  SEGMENT = 'segment',
  CUSTOM = 'custom'
}

export interface ABTestingConfig {
  enabled: boolean;
  defaultDuration: number; // days
  minSampleSize: number;
  confidenceLevel: number;
  maxConcurrentTests: number;
  autoImplementWinners: boolean;
}

export interface PredictionModelConfig {
  enabled: boolean;
  models: ModelConfig[];
  updateFrequency: number; // hours
  minimumDataPoints: number;
  accuracy?: number;
}

export interface ModelConfig {
  type: PredictionType;
  algorithm: string;
  parameters: Record<string, any>;
  lastTrained?: Date;
}

export interface RecommendationEngineConfig {
  enabled: boolean;
  maxRecommendations: number;
  minimumConfidence: number;
  categories: OptimizationType[];
  autoApply: boolean;
}

export interface PrivacySettings {
  anonymizeData: boolean;
  retentionPeriod: number; // days
  gdprCompliant: boolean;
  cookieConsent: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  channels: string[];
  thresholds: Record<string, number>;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

// ===== REQUEST/RESPONSE TYPES =====

export interface PerformanceTrackingRequest {
  contentIds: string[];
  timeRange: DateRange;
  metrics?: string[];
  includeSegmentation?: boolean;
  includePredictions?: boolean;
  includeRecommendations?: boolean;
}

export interface PerformanceTrackingResponse {
  performance: ContentPerformance[];
  aggregatedMetrics?: PerformanceMetrics;
  benchmarks?: BenchmarkData[];
  recommendations?: OptimizationRecommendation[];
  predictions?: EngagementPrediction[];
}

export interface ABTestRequest {
  contentId: string;
  testConfig: ABTestConfig;
  variants: ContentVariant[];
  autoStart?: boolean; // Added missing property
}

export interface ABTestResponse {
  testId: string;
  status: ABTestStatus;
  estimatedDuration: number;
  expectedSampleSize: number;
  createdAt: Date;
  success?: boolean; // Added missing property
}

export interface PredictionRequest {
  contentId?: string;
  contentData?: BlogPost;
  predictionTypes: PredictionType[];
  timeHorizon: number; // days
  includeRecommendations?: boolean;
}

export interface PredictionResponse {
  predictions: EngagementPrediction[];
  confidence: number;
  recommendations?: SimpleOptimizationSuggestion[];
  modelInfo: {
    version: string;
    lastTrained: Date;
    accuracy: number;
  };
}

// Add any missing interfaces from the original that are needed
export interface EngagementData {
  totalEngagements: number;
  engagementRate: number;
  shares: number;
  comments: number;
  likes: number;
  timeOnPage: number;
  scrollDepth: number;
  clickThroughRate?: number;
}

export interface RankingData {
  keywords: KeywordRanking[];
  averagePosition: number;
  visibilityScore: number;
  organicTraffic: number;
  rankedKeywords: number;
}

export interface TrafficData {
  sessions: number;
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  sources: TrafficSourceDetail[];
  geography: GeographicMetrics[];
}

export interface ConversionData {
  conversions: number;
  conversionRate: number;
  revenue?: number;
  goals: GoalCompletionData[];
  funnelData: FunnelStageData[];
}

export interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  category: OptimizationType;
  priority: SuggestionPriority;
  effort: EffortLevel;
  expectedImpact: string;
  implementation: ImplementationGuide;
}

// ===== ERROR CLASSES =====

export class PerformanceOptimizationError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'PerformanceOptimizationError';
  }
}

export class ABTestingError extends PerformanceOptimizationError {
  constructor(message: string, details?: any) {
    super(message, 'AB_TESTING_ERROR', details);
    this.name = 'ABTestingError';
  }
}

export class PredictionError extends PerformanceOptimizationError {
  constructor(message: string, details?: any) {
    super(message, 'PREDICTION_ERROR', details);
    this.name = 'PredictionError';
  }
}
