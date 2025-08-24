
/**
 * Advanced Writing Features Type Definitions
 * Week 7-8 Implementation
 */

import type { BlogPost } from './blog-post';

// ===== CORE INTERFACES =====

export interface ContentOutline {
  id: string;
  title: string;
  sections: OutlineSection[];
  totalWordCount: number;
  estimatedReadingTime: number;
  keyTopics: string[];
  targetAudience?: string;
  contentGoals: string[];
}

export interface OutlineSection {
  id: string;
  title: string;
  level: number; // 1-6 (h1-h6)
  wordCount: number;
  keyPoints: string[];
  parentId?: string;
  order: number;
  sectionType: SectionType;
}

export enum SectionType {
  INTRODUCTION = 'introduction',
  OVERVIEW = 'overview',
  MAIN_CONTENT = 'main_content',
  SUB_SECTION = 'sub_section',
  CONCLUSION = 'conclusion',
  CTA = 'call_to_action',
  SIDEBAR = 'sidebar',
  FAQ = 'faq',
  SUMMARY = 'summary',
  RESOURCES = 'resources'
}

export interface ContentSection {
  id: string;
  blogPostId: string;
  title: string;
  content: string;
  sectionType: SectionType;
  order: number;
  level: number; // heading level 1-6
  parentId?: string;
  wordCount: number;
  keyPoints: string[];
  contextTags: string[];
  promptUsed?: string;
  modelUsed?: string;
  generationContext?: GenerationContext;
  generatedAt: Date;
  readabilityScore?: number;
  coherenceScore?: number;
  relevanceScore?: number;
  children?: ContentSection[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerationContext {
  previousSection?: string;
  nextSectionHint?: string;
  overallTheme: string;
  targetTone: string;
  keywordFocus?: string[];
  brandVoice?: BrandVoiceProfile;
}

// ===== BRAND VOICE AND TONE =====

export interface BrandVoiceProfile {
  id: string;
  name: string;
  description?: string;
  toneCharacteristics: ToneCharacteristics;
  vocabularyGuidelines: VocabularyGuidelines;
  stylePreferences: StylePreferences;
  exampleTexts: string[];
  consistencyRules: ConsistencyRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ToneCharacteristics {
  primary: ToneCategory;
  secondary?: ToneCategory[];
  formality: FormalityLevel;
  emotion: EmotionalTone;
  personality: PersonalityTraits;
}

export enum ToneCategory {
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
  FRIENDLY = 'friendly',
  AUTHORITATIVE = 'authoritative',
  CONVERSATIONAL = 'conversational',
  TECHNICAL = 'technical',
  HUMOROUS = 'humorous',
  INSPIRATIONAL = 'inspirational',
  EDUCATIONAL = 'educational',
  PERSUASIVE = 'persuasive'
}

export enum FormalityLevel {
  VERY_FORMAL = 'very_formal',
  FORMAL = 'formal',
  NEUTRAL = 'neutral',
  INFORMAL = 'informal',
  VERY_INFORMAL = 'very_informal'
}

export enum EmotionalTone {
  ENTHUSIASTIC = 'enthusiastic',
  CONFIDENT = 'confident',
  EMPATHETIC = 'empathetic',
  OPTIMISTIC = 'optimistic',
  NEUTRAL = 'neutral',
  CONCERNED = 'concerned',
  URGENT = 'urgent',
  CALMING = 'calming'
}

export interface PersonalityTraits {
  warmth: number; // 0-1
  competence: number; // 0-1
  sincerity: number; // 0-1
  excitement: number; // 0-1
  sophistication: number; // 0-1
}

export interface VocabularyGuidelines {
  preferredTerms: string[];
  avoidedTerms: string[];
  industryJargon: JargonGuideline[];
  synonyms: Record<string, string[]>;
}

export interface JargonGuideline {
  term: string;
  definition: string;
  usage: 'always_define' | 'assume_knowledge' | 'avoid';
}

export interface StylePreferences {
  sentenceLength: 'short' | 'medium' | 'long' | 'varied';
  paragraphLength: 'short' | 'medium' | 'long';
  activeVoice: boolean;
  contractions: boolean;
  personalPronouns: 'first' | 'second' | 'third' | 'mixed';
  punctuationStyle: 'oxford_comma' | 'no_oxford' | 'flexible';
}

export interface ConsistencyRule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  replacement?: string;
  severity: 'error' | 'warning' | 'suggestion';
}

// ===== TONE ANALYSIS =====

export interface ToneAnalysis {
  id: string;
  blogPostId: string;
  sectionId?: string;
  primaryTone: ToneCategory;
  secondaryTones?: ToneCategory[];
  confidence: number; // 0-1
  formalityScore: number; // 0-1
  emotionalTone: EmotionalTone;
  emotionIntensity: number; // 0-1
  authorityLevel: number; // 0-1
  personalityTraits: Record<string, number>; // trait -> score
  brandVoiceScore?: number; // 0-1 match with brand voice
  consistencyScore: number; // 0-1 consistency within document
  deviations?: ToneDeviation[];
  analyzedAt: Date;
  modelUsed: string;
}

export interface ToneDeviation {
  position: number;
  length: number;
  expectedTone: ToneCategory;
  actualTone: ToneCategory;
  severity: 'minor' | 'moderate' | 'major';
  suggestion: string;
}

// ===== FACT CHECKING =====

export interface FactCheck {
  id: string;
  blogPostId: string;
  claim: string;
  sectionId?: string;
  startPosition?: number;
  endPosition?: number;
  verificationStatus: VerificationStatus;
  confidenceScore?: number; // 0-1
  sources: Source[];
  verifiedAt: Date;
  verificationMethod: VerificationMethod;
  notes?: string;
  citations: Citation[];
  lastChecked: Date;
  expiresAt?: Date; // when this fact check expires
  modelUsed: string;
  humanReviewed?: boolean;
  reviewedBy?: string;
}

export enum VerificationStatus {
  VERIFIED = 'verified',
  PARTIALLY_VERIFIED = 'partially_verified',
  UNVERIFIED = 'unverified',
  DISPUTED = 'disputed',
  OUTDATED = 'outdated',
  NEEDS_REVIEW = 'needs_review'
}

export enum VerificationMethod {
  AUTOMATED = 'automated',
  EXPERT_REVIEW = 'expert_review',
  CROWD_SOURCED = 'crowd_sourced',
  REFERENCE_CHECK = 'reference_check',
  PRIMARY_SOURCE = 'primary_source'
}

export interface Source {
  id: string;
  url: string;
  title: string;
  author?: string;
  publishedDate?: Date;
  lastAccessed: Date;
  sourceType: SourceType;
  credibilityScore?: number; // 0-1
  relevanceScore: number; // 0-1
}

export enum SourceType {
  ACADEMIC_PAPER = 'academic_paper',
  NEWS_ARTICLE = 'news_article',
  GOVERNMENT = 'government',
  EXPERT_INTERVIEW = 'expert_interview',
  BOOK = 'book',
  BLOG_POST = 'blog_post',
  SOCIAL_MEDIA = 'social_media',
  PODCAST = 'podcast',
  VIDEO = 'video',
  OTHER = 'other'
}

export interface Citation {
  id: string;
  factCheckId: string;
  sourceId: string;
  quotedText?: string;
  pageNumber?: string;
  citationFormat: CitationFormat;
  formattedCitation: string;
  createdAt: Date;
}

export enum CitationFormat {
  APA = 'apa',
  MLA = 'mla',
  CHICAGO = 'chicago',
  HARVARD = 'harvard',
  IEEE = 'ieee',
  CUSTOM = 'custom'
}

// ===== OPTIMIZATION =====

export interface OptimizationSuggestion {
  id: string;
  blogPostId: string;
  category: OptimizationCategory;
  title: string;
  description: string;
  impact: ImpactLevel;
  effort: EffortLevel;
  priority: number; // 1-10
  currentValue?: string;
  suggestedValue?: string;
  beforeText?: string;
  afterText?: string;
  reasoning: string;
  evidenceLinks?: string[];
  implementationGuide?: string;
  affectedSections?: string[];
  estimatedImprovement?: number; // percentage
  status: OptimizationStatus;
  appliedAt?: Date;
  appliedBy?: string;
  results?: OptimizationResult;
  createdAt: Date;
  updatedAt: Date;
}

export enum OptimizationCategory {
  READABILITY = 'readability',
  SEO = 'seo',
  ENGAGEMENT = 'engagement',
  STRUCTURE = 'structure',
  TONE = 'tone',
  FACTUAL_ACCURACY = 'factual_accuracy',
  GRAMMAR = 'grammar',
  STYLE = 'style',
  PERFORMANCE = 'performance'
}

export enum ImpactLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum EffortLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  SIGNIFICANT = 'significant'
}

export enum OptimizationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPLIED = 'applied',
  REJECTED = 'rejected',
  OUTDATED = 'outdated'
}

export interface OptimizationResult {
  metricsImprovement: Record<string, number>;
  userFeedback?: string;
  measuredAt: Date;
  confidence: number; // 0-1
}

// ===== WRITING CONFIGURATION =====

export interface WritingConfig {
  brandVoice?: BrandVoiceProfile;
  styleGuide?: StyleGuideSettings;
  seoRequirements?: SEORequirements;
  factCheckingEnabled: boolean;
  optimizationEnabled: boolean;
  realtimeAnalysis: boolean;
  collaborativeEditing: boolean;
  versionControl: boolean;
}

export interface StyleGuideSettings {
  id: string;
  name: string;
  description?: string;
  rules: StyleRule[];
  exceptions: StyleException[];
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StyleRule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  replacement?: string;
  category: string;
  severity: 'error' | 'warning' | 'info';
  examples: StyleExample[];
}

export interface StyleExample {
  incorrect: string;
  correct: string;
  explanation: string;
}

export interface StyleException {
  ruleId: string;
  context: string;
  reason: string;
  examples: string[];
}

export interface SEORequirements {
  primaryKeyword: string;
  secondaryKeywords: string[];
  minWordCount: number;
  maxWordCount: number;
  targetReadingLevel: number;
  includeSchema: boolean;
  optimizeImages: boolean;
  internalLinkTargets?: string[];
}

// ===== STREAMING AND REAL-TIME =====

export interface StreamingCallback {
  onSectionStart?: (section: { id: string; title: string; type: SectionType }) => void;
  onSectionProgress?: (progress: { sectionId: string; progress: number; currentText: string }) => void;
  onSectionComplete?: (section: ContentSection) => void;
  onToneAnalysis?: (analysis: ToneAnalysis) => void;
  onFactCheck?: (factCheck: FactCheck) => void;
  onOptimizationSuggestion?: (suggestion: OptimizationSuggestion) => void;
  onProgress?: (phase: GenerationPhase, progress: number) => void;
  onError?: (error: Error, context: string) => void;
}

export interface GenerationProgress {
  phase: GenerationPhase;
  overallProgress: number; // 0-1
  currentSection?: string;
  sectionsCompleted: number;
  totalSections: number;
  timeElapsed: number;
  estimatedTimeRemaining?: number;
}

export enum GenerationPhase {
  PLANNING = 'planning',
  OUTLINING = 'outlining',
  CONTENT_GENERATION = 'content_generation',
  TONE_ANALYSIS = 'tone_analysis',
  FACT_CHECKING = 'fact_checking',
  OPTIMIZATION = 'optimization',
  FINALIZATION = 'finalization'
}

// ===== REQUEST/RESPONSE INTERFACES =====

export interface ComprehensiveWritingRequest {
  topic: string;
  description?: string;
  targetLength: number;
  contentType: 'blog' | 'article' | 'tutorial' | 'guide';
  targetAudience?: string;
  brandVoice?: BrandVoiceProfile;
  styleGuide?: StyleGuideSettings;
  seoRequirements?: SEORequirements;
  factCheckingEnabled?: boolean;
  optimizationEnabled?: boolean;
  streamingCallback?: StreamingCallback;
  customInstructions?: string;
}

export interface ComprehensiveWritingResult {
  blogPost: BlogPost;
  contentOutline: ContentOutline;
  sections: ContentSection[];
  toneAnalysis: ToneAnalysis;
  factChecks: FactCheck[];
  optimizationSuggestions: OptimizationSuggestion[];
  generationMetrics: GenerationMetrics;
  qualityScore: QualityScore;
}

export interface GenerationMetrics {
  totalWords: number;
  totalSections: number;
  generationTime: number; // seconds
  modelUsed: string;
  factChecksPerformed: number;
  optimizationSuggestions: number;
  averageSectionQuality: number;
  consistencyScore: number;
}

export interface QualityScore {
  overall: number; // 0-1
  readability: number;
  coherence: number;
  factualAccuracy: number;
  seoOptimization: number;
  brandVoiceAlignment: number;
  engagementPotential: number;
}

// ===== SERVICE INTERFACES =====

export interface MultiSectionGenerationService {
  generateFromOutline(outline: ContentOutline, config: WritingConfig): Promise<ContentSection[]>;
  generateSection(sectionSpec: OutlineSection, context: GenerationContext): Promise<ContentSection>;
  regenerateSection(sectionId: string, feedback: string): Promise<ContentSection>;
}

export interface ToneStyleConsistencyService {
  analyzeTone(content: string, brandVoice?: BrandVoiceProfile): Promise<ToneAnalysis>;
  checkConsistency(sections: ContentSection[], brandVoice: BrandVoiceProfile): Promise<ToneAnalysis>;
  suggestToneAdjustments(analysis: ToneAnalysis): Promise<OptimizationSuggestion[]>;
}

export interface FactCheckingService {
  checkFacts(content: string, blogPostId: string): Promise<FactCheck[]>;
  verifyClaim(claim: string): Promise<FactCheck>;
  updateFactChecks(blogPostId: string): Promise<FactCheck[]>;
}

export interface ContentOptimizationService {
  analyzeContent(content: string, requirements: SEORequirements): Promise<OptimizationSuggestion[]>;
  applySuggestion(suggestionId: string): Promise<OptimizationResult>;
  generateOptimizedVersion(content: string, suggestions: OptimizationSuggestion[]): Promise<string>;
}

export interface AdvancedWritingService {
  generateComprehensive(request: ComprehensiveWritingRequest): Promise<ComprehensiveWritingResult>;
  streamGeneration(request: ComprehensiveWritingRequest, callback: StreamingCallback): Promise<void>;
  enhanceExistingContent(blogPostId: string, enhancements: string[]): Promise<ComprehensiveWritingResult>;
}
