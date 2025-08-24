
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
  estimatedReadingTime?: number;
  keyTopics?: string[];
  targetAudience?: string;
  contentGoals?: string[];
}

// Alias for backward compatibility
export type AdvancedContentOutline = ContentOutline;

export interface OutlineSection {
  id: string;
  title: string;
  level: number; // 1-6 (h1-h6)
  wordCount: number;
  keyPoints: string[];
  parentId?: string;
  order: number;
  sectionType: SectionType;
  type?: SectionType; // Backward compatibility
  contextTags?: string[];
  estimatedWordCount?: number;
}

// Alias for backward compatibility
export type AdvancedOutlineSection = OutlineSection;

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
  RESOURCES = 'resources',
  PARAGRAPH = 'paragraph',
  INFORMATIVE = 'informative' // Added missing type
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
  // Additional properties for backward compatibility
  section?: {
    title: string;
    wordCount: number;
  };
  metrics?: {
    coherenceScore: number;
    consistencyScore: number;
  };
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
  consistencyRules: ConsistencyRuleArray; // Updated to use the new type
  createdAt: Date;
  updatedAt: Date;
  
  // Additional properties for backward compatibility
  primaryTone?: ToneCategory;
  secondaryTones?: ToneCategory[];
  vocabularyLevel?: string;
  formalityLevel?: FormalityLevel;
  personalityTraits?: PersonalityTraits;
}

export interface ToneCharacteristics {
  primary: ToneCategory;
  secondary?: ToneCategory[];
  formality: FormalityLevel;
  emotion: EmotionalTone;
  personality: PersonalityTraits;
  // Additional properties for backward compatibility
  primaryTone?: ToneCategory;
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
  PERSUASIVE = 'persuasive',
  INFORMATIVE = 'informative',
  ACADEMIC = 'academic',
  ENTERTAINING = 'entertaining',
  EMPATHETIC = 'empathetic',
  URGENT = 'urgent',
  CONFIDENT = 'confident',
  HUMBLE = 'humble'
}

export enum FormalityLevel {
  VERY_FORMAL = 'very_formal',
  FORMAL = 'formal',
  NEUTRAL = 'neutral',
  INFORMAL = 'informal',
  VERY_INFORMAL = 'very_informal',
  // Additional values for backward compatibility
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum EmotionalTone {
  ENTHUSIASTIC = 'enthusiastic',
  CONFIDENT = 'confident',
  EMPATHETIC = 'empathetic',
  OPTIMISTIC = 'optimistic',
  NEUTRAL = 'neutral',
  CONCERNED = 'concerned',
  URGENT = 'urgent',
  CALMING = 'calming',
  // Additional values for backward compatibility
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  EXCITED = 'excited',
  CAUTIOUS = 'cautious',
  PASSIONATE = 'passionate',
  ANALYTICAL = 'analytical',
  INSPIRING = 'inspiring'
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
  avoidTerms?: string[]; // Backward compatibility alias
  industryJargon: JargonGuideline[];
  synonyms: Record<string, string[]>;
  // Additional properties for backward compatibility
  complexityLevel?: string;
}

export interface JargonGuideline {
  term: string;
  definition: string;
  usage: 'always_define' | 'assume_knowledge' | 'avoid';
}

export interface StylePreferences {
  sentenceLength: 'short' | 'medium' | 'long' | 'varied';
  paragraphLength: 'short' | 'medium' | 'long' | 'SHORT' | 'MEDIUM' | 'LONG'; // Added uppercase variants for backward compatibility
  activeVoice: boolean;
  contractions: boolean;
  personalPronouns: 'first' | 'second' | 'third' | 'mixed';
  punctuationStyle: 'oxford_comma' | 'no_oxford' | 'flexible';
}

export interface ConsistencyRule {
  id?: string;
  name?: string;
  description?: string;
  pattern?: string;
  replacement?: string;
  severity?: 'error' | 'warning' | 'suggestion';
}

// Allow string as ConsistencyRule for backward compatibility
export type ConsistencyRuleInput = ConsistencyRule | string;

// Allow string array for backward compatibility
export type ConsistencyRuleArray = ConsistencyRule[] | string[];

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
  // Additional properties for backward compatibility
  toneAnalysisId?: string;
}

export interface ToneDeviation {
  position: number;
  length: number;
  expectedTone: ToneCategory;
  actualTone: ToneCategory;
  severity: 'minor' | 'moderate' | 'major' | 'high'; // Added 'high' for backward compatibility
  suggestion: string;
  // Additional properties for backward compatibility
  sectionId?: string;
}

// ===== FACT CHECKING =====

export interface FactCheck {
  id: string;
  blogPostId: string;
  sectionId?: string;
  claim: string;
  position: number;
  length: number;
  verificationStatus: VerificationStatus;
  confidence: number; // 0-1
  confidenceScore?: number; // Backward compatibility alias
  sources: FactSource[];
  sourceUrls?: string[]; // Backward compatibility alias
  sourcesVerified?: number; // Backward compatibility alias
  sourcesReliable?: number; // Backward compatibility alias
  sourceCredibility?: number; // Backward compatibility alias
  evidenceQuality?: number; // Backward compatibility alias
  verificationMethod?: string; // Backward compatibility alias
  verificationNotes?: string; // Backward compatibility alias
  verifiedAt?: Date; // Backward compatibility alias
  verifiedBy?: string; // Backward compatibility alias
  requiresAttention?: boolean; // Backward compatibility alias
  flagReason?: string; // Backward compatibility alias
  startPosition?: number; // Backward compatibility alias
  endPosition?: number; // Backward compatibility alias
  corrections?: string[];
  notes?: string;
  checkedAt: Date;
  modelUsed: string;
  citations?: SourceCitation[]; // Backward compatibility alias
  // Additional properties for backward compatibility
  credibilityScore?: number;
  isVerified?: boolean;
}

export enum VerificationStatus {
  VERIFIED = 'verified',
  PARTIALLY_VERIFIED = 'partially_verified',
  UNVERIFIED = 'unverified',
  DISPUTED = 'disputed',
  FALSE = 'false', // Backward compatibility
  UNVERIFIABLE = 'unverifiable', // Backward compatibility
  OUTDATED = 'outdated'
}

export interface FactSource {
  url: string;
  title: string;
  author?: string;
  publicationDate?: Date;
  relevance: number; // 0-1
  credibility: number; // 0-1
}

// ===== OPTIMIZATION =====

export interface OptimizationSuggestion {
  id: string;
  blogPostId?: string;
  type: OptimizationType;
  priority: SuggestionPriority;
  effort: EffortLevel;
  description: string;
  title?: string;
  currentText?: string;
  suggestedText?: string;
  reasoning: string;
  expectedImpact: number; // 0-1
  category: SuggestionCategory;
  position?: number;
  length?: number;
  metadata?: Record<string, any>;
  
  // Additional properties for database compatibility
  impact?: number;
  currentValue?: string;
  suggestedValue?: string;
  beforeText?: string;
  afterText?: string;
  seoImpact?: number;
  keywordTarget?: string;
  readabilityImpact?: number;
  engagementMetric?: string;
  expectedLift?: number;
  isImplemented?: boolean;
  isValidated?: boolean;
}

export enum OptimizationType {
  READABILITY = 'readability',
  SEO = 'seo',
  TONE = 'tone',
  STRUCTURE = 'structure',
  FACTUAL = 'factual',
  ENGAGEMENT = 'engagement',
  ACCESSIBILITY = 'accessibility',
  CONTENT_QUALITY = 'content_quality',
  USER_EXPERIENCE = 'user_experience',
  TECHNICAL_SEO = 'technical_seo',
  SOCIAL_MEDIA = 'social_media'
}

export enum SuggestionPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum EffortLevel {
  MINIMAL = 'minimal',
  MODERATE = 'moderate',
  SIGNIFICANT = 'significant'
}

export enum SuggestionCategory {
  CONTENT = 'content',
  STYLE = 'style',
  SEO = 'seo',
  STRUCTURE = 'structure',
  FACTUAL = 'factual'
}

export interface OptimizationResult {
  success: boolean;
  originalText: string;
  optimizedText: string;
  changes: TextChange[];
  qualityImprovement: number; // 0-1
  suggestions: OptimizationSuggestion[];
  metrics: ContentMetrics;
}

export interface ContentMetrics {
  blogPostId: string;
  sectionsGenerated: number;
  totalGenerationTime: number;
  averageSectionTime: number;
  overallQualityScore: number;
  coherenceScore: number;
  consistencyScore: number;
  originalityScore: number;
  toneConsistencyScore: number;
  brandAlignmentScore: number;
  totalClaims: number;
  verifiedClaims: number;
  disputedClaims: number;
  sourcesUsed: number;
  reliableSources: number;
  averageSourceCredibility: number;
  seoScore: number;
  readabilityScore: number;
  engagementScore: number;
  totalSuggestions: number;
  implementedSuggestions: number;
}

export interface TextChange {
  type: 'insertion' | 'deletion' | 'replacement';
  position: number;
  originalText?: string;
  newText?: string;
  reason: string;
}

// ===== STYLE ANALYSIS =====

export interface StyleCheck {
  id: string;
  blogPostId: string;
  sectionId?: string;
  checkType: StyleCheckType;
  severity: StyleSeverity;
  message: string;
  position: number;
  length: number;
  suggestion?: string;
  ruleViolated?: string;
  checkedAt: Date;
  modelUsed: string;
  // Additional properties for backward compatibility
  toneAnalysisId?: string;
  styleGuideId?: string;
  complianceScore?: number;
  violations?: StyleViolation[];
  sentenceLength?: number;
  paragraphLength?: number;
  readingLevel?: number;
  passiveVoiceScore?: number;
  vocabularyLevel?: string;
  jargonUsage?: number;
  repetitiveness?: number;
  brandVoiceMatch?: number;
  voicePersonality?: any;
  suggestions?: StyleSuggestion[];
  criticalIssues?: string[];
}

export enum StyleCheckType {
  GRAMMAR = 'grammar',
  SPELLING = 'spelling',
  PUNCTUATION = 'punctuation',
  STYLE = 'style',
  CLARITY = 'clarity',
  CONCISENESS = 'conciseness',
  CONSISTENCY = 'consistency',
  TONE = 'tone',
  VOICE = 'voice',
  SENTENCE_LENGTH = 'sentence_length',
  READABILITY = 'readability'
}

export enum StyleSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  HIGH = 'high' // Backward compatibility
}

export interface StyleViolation {
  id: string;
  type: StyleCheckType;
  severity: StyleSeverity;
  message: string;
  position: number;
  length: number;
  suggestion?: string;
  ruleViolated?: string;
  // Additional properties for backward compatibility
  checkType?: StyleCheckType;
}

export interface StyleSuggestion {
  id: string;
  type: StyleCheckType;
  message: string;
  currentText: string;
  suggestedText: string;
  reasoning: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'minimal' | 'moderate' | 'significant';
  // Additional properties for backward compatibility
  checkType?: StyleCheckType;
}

export interface ToneAnalysisRequest {
  blogPostId: string;
  sectionId?: string;
  includeStyleChecks?: boolean;
  brandVoiceProfile?: BrandVoiceProfile;
  analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
  // Additional properties for backward compatibility
  content?: string;
  sectionsToAnalyze?: string[];
  brandVoice?: BrandVoiceProfile;
}

export interface StyleCheckRequest {
  blogPostId: string;
  sectionId?: string;
  checkTypes?: StyleCheckType[];
  severityThreshold?: StyleSeverity;
  includeSuggestions?: boolean;
  brandVoice?: BrandVoiceProfile; // Added missing property
  styleGuideId?: string; // Added missing property
}

// ===== WRITING CONFIGURATION =====

export interface WritingConfig {
  styleGuide?: StyleGuideSettings;
  seoRequirements?: SEORequirements;
  factCheckingEnabled?: boolean;
  optimizationEnabled?: boolean;
  streamingEnabled?: boolean;
  customInstructions?: string;
  targetAudience?: string;
  brandVoice?: BrandVoiceProfile;
  sections?: ContentSection[]; // Added missing property
  sourceVerification?: boolean; // Added missing property
}

export interface StyleGuideSettings {
  tone: ToneCategory;
  formality: FormalityLevel;
  sentenceLength: 'short' | 'medium' | 'long' | 'varied';
  paragraphLength: 'short' | 'medium' | 'long';
  activeVoice: boolean;
  contractions: boolean;
  personalPronouns: 'first' | 'second' | 'third' | 'mixed';
  punctuationStyle: 'oxford_comma' | 'no_oxford' | 'flexible';
  readingLevel: number;
  language: {
    readingLevel: number;
    complexity: 'simple' | 'moderate' | 'complex';
  };
  brandVoice: {
    primaryTone: ToneCategory;
    secondaryTones: ToneCategory[];
  };
  writingStyle?: {
    [key: string]: any;
  };
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
  keywords?: {
    primaryKeyword: string;
    secondaryKeywords: string[];
  };
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

// Allow function as StreamingCallback for backward compatibility
export type StreamingCallbackInput = StreamingCallback | ((progress: any) => void);

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
  streamingCallback?: StreamingCallbackInput;
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
  // Additional properties for backward compatibility
  metrics?: {
    totalWordCount: number;
    totalGenerationTime: number;
    overallQualityScore: number;
  };
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

// ===== MISSING TYPE DEFINITIONS =====

// Source and Citation Types
export interface SourceCitation {
  id: string;
  blogPostId?: string;
  factCheckId?: string;
  title: string;
  url: string;
  author?: string;
  publishedDate?: Date;
  accessedDate: Date;
  sourceType: SourceType;
  domain: string;
  language: string;
  credibilityScore?: number;
  authorityScore?: number;
  biasRating?: BiasRating;
  expertiseLevel?: ExpertiseLevel;
  qualityIndicators?: {
    isPeerReviewed: boolean;
    isGovernment: boolean;
    isAcademic: boolean;
    isRecent: boolean;
    hasAuthor: boolean;
    hasReferences: boolean;
  };
  concerns?: string[];
}

export enum SourceType {
  ACADEMIC = 'academic',
  NEWS = 'news',
  GOVERNMENT = 'government',
  INDUSTRY = 'industry',
  BLOG = 'blog',
  SOCIAL_MEDIA = 'social_media',
  UNKNOWN = 'unknown'
}

export enum BiasRating {
  LEFT = 'left',
  LEAN_LEFT = 'lean_left',
  CENTER = 'center',
  LEAN_RIGHT = 'lean_right',
  RIGHT = 'right',
  MIXED = 'mixed',
  UNKNOWN = 'unknown'
}

export enum ExpertiseLevel {
  EXPERT = 'expert',
  PRACTITIONER = 'practitioner',
  ACADEMIC = 'academic',
  JOURNALIST = 'journalist',
  GENERAL_PUBLIC = 'general_public',
  UNKNOWN = 'unknown'
}

export interface FactCheckRequest {
  blogPostId: string;
  claims?: string[];
  autoDetectClaims?: boolean;
  verificationThreshold?: number;
  includeSourceAnalysis?: boolean;
  requireReliableSources?: boolean;
  // Additional properties for backward compatibility
  content?: string;
}

// Multi-Section Generation Types
export interface SectionGenerationContext {
  previousSections: ContentSection[];
  followingSections?: OutlineSection[];
  mainTopic: string;
  tone: string;
  style: string;
  brandVoice?: BrandVoiceProfile;
  targetAudience: string;
  contentObjectives: string[];
  targetKeywords?: string[];
}

export interface ContentFlowMap {
  [sectionId: string]: ContentConnection[];
}

export interface ContentConnection {
  fromSectionId: string;
  toSectionId: string;
  connectionType: ConnectionType;
  strength: number; // 0-1
  description: string;
}

export enum ConnectionType {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  SUPPORTING = 'supporting',
  CONTRASTING = 'contrasting',
  SUMMARY = 'summary',
  TRANSITION = 'transition'
}

export interface MultiSectionGenerationRequest {
  outline: ContentOutline;
  generationOptions: SectionGenerationOptions;
  brandVoice?: BrandVoiceProfile;
  targetAudience?: string;
  contentObjectives?: string[];
}

export interface SectionGenerationOptions {
  temperature?: number;
  maxTokensPerSection?: number;
  includeKeyPoints?: boolean;
  optimizeForSEO?: boolean;
  maintainConsistency?: boolean;
  enableRealTimeChecking?: boolean;
}

// Enhanced ContentOutline with content flow
export interface EnhancedContentOutline extends ContentOutline {
  contentFlow?: ContentFlowMap;
}
