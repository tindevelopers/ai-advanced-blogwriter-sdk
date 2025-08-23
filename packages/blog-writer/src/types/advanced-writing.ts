

/**
 * Week 7-8 Advanced Writing Features Types
 * Comprehensive types for multi-section generation, tone consistency, fact-checking, and optimization
 */

// ===== MULTI-SECTION CONTENT GENERATION =====

export interface AdvancedContentOutline {
  id?: string;
  title: string;
  sections: AdvancedOutlineSection[];
  totalWordCount?: number;
  estimatedReadTime?: number;
  contentFlow?: ContentFlowMap;
}

export interface AdvancedOutlineSection {
  id?: string;
  title: string;
  type: SectionType;
  level: number; // 1-6 for heading levels
  order: number;
  parentId?: string;
  estimatedWordCount?: number;
  keyPoints?: string[];
  contextTags?: string[];
  children?: AdvancedOutlineSection[];
}

export interface ContentSection {
  id: string;
  blogPostId: string;
  title: string;
  content: string;
  sectionType: SectionType;
  order: number;
  level: number;
  parentId?: string;
  wordCount: number;
  keyPoints: string[];
  contextTags: string[];
  
  // AI Generation metadata
  promptUsed?: string;
  modelUsed?: string;
  generationContext?: Record<string, any>;
  generatedAt?: Date;
  
  // Quality metrics
  readabilityScore?: number;
  coherenceScore?: number;
  relevanceScore?: number;
  
  // Relationships
  parent?: ContentSection;
  children: ContentSection[];
  
  createdAt: Date;
  updatedAt: Date;
}

export enum SectionType {
  HEADING = 'HEADING',
  SUBHEADING = 'SUBHEADING', 
  PARAGRAPH = 'PARAGRAPH',
  INTRODUCTION = 'INTRODUCTION',
  CONCLUSION = 'CONCLUSION',
  LIST = 'LIST',
  QUOTE = 'QUOTE',
  CODE_BLOCK = 'CODE_BLOCK',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  CTA = 'CTA',
  SIDEBAR = 'SIDEBAR',
  CALLOUT = 'CALLOUT',
  STEPS = 'STEPS',
  FAQ = 'FAQ',
  TABLE = 'TABLE'
}

export interface SectionGenerationContext {
  previousSections: ContentSection[];
  followingSections?: AdvancedOutlineSection[];
  mainTopic: string;
  targetKeywords: string[];
  tone: string;
  style: string;
  targetAudience?: string;
  brandVoice?: BrandVoiceProfile;
  contentObjective?: string;
}

export interface ContentFlowMap {
  sections: string[]; // Section IDs in order
  connections: ContentConnection[];
  coherenceScore?: number;
  logicalFlow?: boolean;
}

export interface ContentConnection {
  fromSectionId: string;
  toSectionId: string;
  connectionType: ConnectionType;
  strength: number; // 0-1
  transitionText?: string;
}

export enum ConnectionType {
  SEQUENTIAL = 'SEQUENTIAL',
  CAUSE_EFFECT = 'CAUSE_EFFECT',
  COMPARISON = 'COMPARISON',
  EXAMPLE = 'EXAMPLE',
  SUMMARY = 'SUMMARY',
  ELABORATION = 'ELABORATION',
  CONTRAST = 'CONTRAST'
}

// ===== TONE & STYLE CONSISTENCY =====

export interface ToneAnalysis {
  id: string;
  blogPostId: string;
  sectionId?: string;
  
  // Detected characteristics
  primaryTone: ToneCategory;
  secondaryTones: ToneCategory[];
  confidence: number;
  
  // Metrics
  formalityScore: number; // 0-1
  emotionalTone: EmotionalTone;
  emotionIntensity: number; // 0-1
  authorityLevel: number; // 0-1
  personalityTraits: Record<string, number>;
  
  // Brand alignment
  brandVoiceScore?: number;
  consistencyScore?: number;
  deviations?: ToneDeviation[];
  
  analyzedAt: Date;
  modelUsed?: string;
}

export enum ToneCategory {
  PROFESSIONAL = 'PROFESSIONAL',
  CASUAL = 'CASUAL', 
  AUTHORITATIVE = 'AUTHORITATIVE',
  FRIENDLY = 'FRIENDLY',
  TECHNICAL = 'TECHNICAL',
  CONVERSATIONAL = 'CONVERSATIONAL',
  ACADEMIC = 'ACADEMIC',
  PERSUASIVE = 'PERSUASIVE',
  INFORMATIVE = 'INFORMATIVE',
  ENTERTAINING = 'ENTERTAINING',
  EMPATHETIC = 'EMPATHETIC',
  URGENT = 'URGENT',
  CONFIDENT = 'CONFIDENT',
  HUMBLE = 'HUMBLE'
}

export enum EmotionalTone {
  NEUTRAL = 'NEUTRAL',
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE', 
  EXCITED = 'EXCITED',
  CONCERNED = 'CONCERNED',
  OPTIMISTIC = 'OPTIMISTIC',
  CAUTIOUS = 'CAUTIOUS',
  PASSIONATE = 'PASSIONATE',
  ANALYTICAL = 'ANALYTICAL',
  INSPIRING = 'INSPIRING'
}

export interface ToneDeviation {
  sectionId?: string;
  position: number;
  expectedTone: ToneCategory;
  actualTone: ToneCategory;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface BrandVoiceProfile {
  id: string;
  name: string;
  description?: string;
  primaryTone: ToneCategory;
  secondaryTones: ToneCategory[];
  personalityTraits: Record<string, number>;
  vocabularyLevel: 'basic' | 'intermediate' | 'advanced';
  formalityLevel: number; // 0-1
  examples: string[];
  prohibited: string[];
  guidelines: string[];
}

export interface StyleCheck {
  id: string;
  blogPostId: string;
  toneAnalysisId?: string;
  
  // Style guide compliance
  styleGuideId?: string;
  complianceScore: number; // 0-1
  violations: StyleViolation[];
  
  // Writing metrics
  sentenceLength: number;
  paragraphLength: number;
  readingLevel: number;
  passiveVoiceScore: number;
  
  // Vocabulary analysis
  vocabularyLevel: string;
  jargonUsage: number;
  repetitiveness: number;
  
  // Brand voice
  brandVoiceMatch?: number;
  voicePersonality?: Record<string, number>;
  
  // Suggestions
  suggestions: StyleSuggestion[];
  criticalIssues: string[];
  
  checkedAt: Date;
}

export interface StyleViolation {
  type: string;
  position: number;
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export interface StyleSuggestion {
  type: string;
  message: string;
  beforeText?: string;
  afterText?: string;
  position?: number;
  impact: 'low' | 'medium' | 'high';
}

// ===== FACT-CHECKING & SOURCE VERIFICATION =====

export interface FactCheck {
  id: string;
  blogPostId: string;
  
  // Claim details
  claim: string;
  sectionId?: string;
  startPosition?: number;
  endPosition?: number;
  
  // Verification results
  verificationStatus: VerificationStatus;
  confidenceScore?: number;
  evidenceQuality?: number;
  
  // Source information
  sourceUrls: string[];
  sourcesVerified: number;
  sourcesReliable: number;
  sourceCredibility?: number;
  
  // Verification metadata
  verificationMethod?: string;
  verificationNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  
  // Flags
  requiresAttention: boolean;
  flagReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
  
  citations: SourceCitation[];
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  DISPUTED = 'DISPUTED',
  FALSE = 'FALSE',
  PARTIALLY_TRUE = 'PARTIALLY_TRUE',
  UNVERIFIABLE = 'UNVERIFIABLE',
  REQUIRES_UPDATE = 'REQUIRES_UPDATE'
}

export interface SourceCitation {
  id: string;
  blogPostId: string;
  factCheckId?: string;
  
  // Citation details
  title: string;
  url: string;
  author?: string;
  publishedDate?: Date;
  accessedDate: Date;
  
  // Source metadata
  sourceType: SourceType;
  domain?: string;
  language: string;
  
  // Credibility assessment
  credibilityScore?: number; // 0-1
  authorityScore?: number; // 0-1
  biasRating?: BiasRating;
  expertiseLevel?: ExpertiseLevel;
  
  // Citation context
  citationContext?: string;
  quote?: string;
  pageNumber?: string;
  
  // Quality flags
  isPeerReviewed: boolean;
  isGovernment: boolean;
  isAcademic: boolean;
  isRecent: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export enum SourceType {
  ACADEMIC_PAPER = 'ACADEMIC_PAPER',
  NEWS_ARTICLE = 'NEWS_ARTICLE',
  GOVERNMENT_DOCUMENT = 'GOVERNMENT_DOCUMENT',
  OFFICIAL_WEBSITE = 'OFFICIAL_WEBSITE',
  BLOG_POST = 'BLOG_POST',
  BOOK = 'BOOK',
  REPORT = 'REPORT',
  STUDY = 'STUDY',
  PRESS_RELEASE = 'PRESS_RELEASE',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  VIDEO = 'VIDEO',
  PODCAST = 'PODCAST',
  INTERVIEW = 'INTERVIEW',
  OTHER = 'OTHER'
}

export enum BiasRating {
  LEFT = 'LEFT',
  LEAN_LEFT = 'LEAN_LEFT',
  CENTER = 'CENTER',
  LEAN_RIGHT = 'LEAN_RIGHT',
  RIGHT = 'RIGHT',
  MIXED = 'MIXED',
  UNKNOWN = 'UNKNOWN'
}

export enum ExpertiseLevel {
  EXPERT = 'EXPERT',
  PRACTITIONER = 'PRACTITIONER',
  ACADEMIC = 'ACADEMIC',
  JOURNALIST = 'JOURNALIST',
  GENERAL_PUBLIC = 'GENERAL_PUBLIC',
  UNKNOWN = 'UNKNOWN'
}

// ===== CONTENT OPTIMIZATION SUGGESTIONS =====

export interface OptimizationSuggestion {
  id: string;
  blogPostId: string;
  
  // Suggestion details
  category: OptimizationCategory;
  title: string;
  description: string;
  impact: ImpactLevel;
  effort: EffortLevel;
  priority: number; // 1-100
  
  // Specific improvements
  currentValue?: string;
  suggestedValue?: string;
  beforeText?: string;
  afterText?: string;
  position?: number;
  
  // Impact projections
  seoImpact?: number;
  keywordTarget?: string;
  readabilityImpact?: number;
  engagementMetric?: string;
  expectedLift?: number;
  
  // Implementation tracking
  isImplemented: boolean;
  implementedAt?: Date;
  implementedBy?: string;
  
  // Validation
  isValidated: boolean;
  validationScore?: number;
  actualImpact?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export enum OptimizationCategory {
  SEO = 'SEO',
  READABILITY = 'READABILITY',
  ENGAGEMENT = 'ENGAGEMENT',
  STRUCTURE = 'STRUCTURE',
  TONE_STYLE = 'TONE_STYLE',
  FACT_ACCURACY = 'FACT_ACCURACY',
  SOURCE_QUALITY = 'SOURCE_QUALITY',
  CTA_OPTIMIZATION = 'CTA_OPTIMIZATION',
  HEADLINE = 'HEADLINE',
  META_DESCRIPTION = 'META_DESCRIPTION',
  KEYWORDS = 'KEYWORDS',
  INTERNAL_LINKING = 'INTERNAL_LINKING',
  CONTENT_LENGTH = 'CONTENT_LENGTH',
  FORMATTING = 'FORMATTING'
}

export enum ImpactLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum EffortLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

// ===== COMPREHENSIVE CONTENT METRICS =====

export interface ContentMetrics {
  id: string;
  blogPostId: string;
  
  // Generation metrics
  sectionsGenerated: number;
  totalGenerationTime?: number; // milliseconds
  averageSectionTime?: number; // milliseconds
  
  // Quality metrics
  overallQualityScore?: number; // 0-1
  coherenceScore?: number; // 0-1
  consistencyScore?: number; // 0-1
  originalityScore?: number; // 0-1
  
  // Tone metrics
  toneConsistencyScore?: number; // 0-1
  brandAlignmentScore?: number; // 0-1
  
  // Fact-checking metrics
  totalClaims: number;
  verifiedClaims: number;
  disputedClaims: number;
  sourcesUsed: number;
  reliableSources: number;
  averageSourceCredibility?: number;
  
  // Optimization metrics
  seoScore?: number; // 0-100
  readabilityScore?: number; // 0-100
  engagementScore?: number; // 0-100
  totalSuggestions: number;
  implementedSuggestions: number;
  
  measuredAt: Date;
}

// ===== REQUEST/RESPONSE INTERFACES =====

export interface MultiSectionGenerationRequest {
  blogPostId?: string;
  outline: AdvancedContentOutline;
  generationOptions: SectionGenerationOptions;
  brandVoice?: BrandVoiceProfile;
  contextAwareness?: boolean;
}

export interface SectionGenerationOptions {
  model?: string;
  maxTokensPerSection?: number;
  temperature?: number;
  tone?: string;
  style?: string;
  targetAudience?: string;
  includeTransitions?: boolean;
  maintainConsistency?: boolean;
  seoOptimized?: boolean;
}

export interface ToneAnalysisRequest {
  blogPostId: string;
  content?: string;
  sectionsToAnalyze?: string[];
  brandVoice?: BrandVoiceProfile;
  analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
}

export interface StyleCheckRequest {
  blogPostId: string;
  styleGuideId?: string;
  brandVoice?: BrandVoiceProfile;
  checkConsistency?: boolean;
  includeSuggestions?: boolean;
}

export interface FactCheckRequest {
  blogPostId: string;
  claims?: string[];
  autoDetectClaims?: boolean;
  verificationThreshold?: number; // 0-1
  includeSourceAnalysis?: boolean;
  requireReliableSources?: boolean;
}

export interface OptimizationRequest {
  blogPostId: string;
  categories?: OptimizationCategory[];
  targetKeywords?: string[];
  prioritizeHighImpact?: boolean;
  maxSuggestions?: number;
  includeImplementationGuide?: boolean;
}

export interface AdvancedWritingResult {
  blogPostId: string;
  sections: ContentSection[];
  toneAnalysis?: ToneAnalysis;
  styleCheck?: StyleCheck;
  factChecks?: FactCheck[];
  optimizationSuggestions?: OptimizationSuggestion[];
  metrics: ContentMetrics;
  processingTime: number;
  success: boolean;
  errors?: string[];
  warnings?: string[];
}

// ===== WRITING CONFIGURATION INTERFACE =====

/**
 * Style guide configuration settings
 */
export interface StyleGuideSettings {
  /** Writing style preferences */
  writingStyle: {
    /** Preferred sentence structure */
    sentenceStructure: 'simple' | 'compound' | 'complex' | 'mixed';
    /** Maximum sentence length in words */
    maxSentenceLength?: number;
    /** Paragraph length preferences */
    paragraphLength: 'short' | 'medium' | 'long' | 'mixed';
    /** Voice preference */
    voice: 'active' | 'passive' | 'mixed';
  };
  
  /** Vocabulary and language settings */
  language: {
    /** Technical jargon level */
    technicalLevel: 'minimal' | 'moderate' | 'heavy';
    /** Reading level target (grade level) */
    readingLevel?: number;
    /** Preferred vocabulary complexity */
    vocabularyComplexity: 'simple' | 'intermediate' | 'advanced';
    /** Industry-specific terminology usage */
    industryTerms: boolean;
  };
  
  /** Formatting and structure preferences */
  formatting: {
    /** Use bullet points and lists */
    useBulletPoints: boolean;
    /** Include subheadings */
    includeSubheadings: boolean;
    /** Maximum heading levels to use */
    maxHeadingLevel: number;
    /** Preferred content structure */
    contentStructure: 'linear' | 'modular' | 'hierarchical';
  };
  
  /** Brand voice characteristics */
  brandVoice: {
    /** Primary tone */
    primaryTone: ToneCategory;
    /** Secondary tones to include */
    secondaryTones?: ToneCategory[];
    /** Personality traits to emphasize */
    personalityTraits: Record<string, number>; // trait name -> strength (0-1)
    /** Words and phrases to avoid */
    avoidedPhrases?: string[];
    /** Preferred expressions */
    preferredExpressions?: string[];
  };
  
  /** Content quality standards */
  qualityStandards: {
    /** Minimum content originality score */
    originalityThreshold: number; // 0-1
    /** Fact-checking requirements */
    factCheckingLevel: 'basic' | 'thorough' | 'comprehensive';
    /** Source quality requirements */
    sourceQualityThreshold: number; // 0-1
    /** Citation requirements */
    citationStyle?: 'apa' | 'mla' | 'chicago' | 'harvard' | 'custom';
  };
  
  /** Content accessibility settings */
  accessibility: {
    /** Include alt text for images */
    requireAltText: boolean;
    /** Use clear, descriptive link text */
    descriptiveLinkText: boolean;
    /** Ensure proper heading hierarchy */
    properHeadingHierarchy: boolean;
    /** Include content warnings where appropriate */
    contentWarnings: boolean;
  };
  
  /** Compliance and legal requirements */
  compliance?: {
    /** Industry compliance standards */
    industryStandards?: string[];
    /** Legal disclaimers to include */
    requiredDisclaimers?: string[];
    /** Content review requirements */
    reviewRequirements?: string[];
  };
}

/**
 * SEO requirements configuration
 */
export interface SEORequirements {
  /** Keyword optimization settings */
  keywords: {
    /** Primary focus keyword */
    primaryKeyword?: string;
    /** Secondary keywords to include */
    secondaryKeywords: string[];
    /** Long-tail keyword variations */
    longTailKeywords?: string[];
    /** Keyword density targets */
    densityTargets: {
      /** Primary keyword density range */
      primary: { min: number; max: number };
      /** Secondary keyword density range */
      secondary: { min: number; max: number };
    };
    /** Semantic keywords to include */
    semanticKeywords?: string[];
  };
  
  /** Content length and structure requirements */
  contentStructure: {
    /** Target word count range */
    wordCount: { min: number; max: number };
    /** Required heading structure */
    headingStructure: {
      /** Require H1 tag */
      requireH1: boolean;
      /** Minimum number of H2 tags */
      minH2Count?: number;
      /** Maximum heading depth */
      maxHeadingDepth: number;
    };
    /** Introduction requirements */
    introduction: {
      /** Maximum introduction length */
      maxLength?: number;
      /** Must include primary keyword */
      includePrimaryKeyword: boolean;
    };
    /** Conclusion requirements */
    conclusion: {
      /** Require conclusion section */
      required: boolean;
      /** Include call-to-action */
      includeCTA?: boolean;
    };
  };
  
  /** Meta elements optimization */
  metaOptimization: {
    /** Title tag requirements */
    title: {
      /** Maximum title length */
      maxLength: number;
      /** Include primary keyword */
      includePrimaryKeyword: boolean;
      /** Title structure template */
      structureTemplate?: string;
    };
    /** Meta description requirements */
    description: {
      /** Maximum description length */
      maxLength: number;
      /** Include primary keyword */
      includePrimaryKeyword: boolean;
      /** Include call-to-action */
      includeCTA: boolean;
    };
    /** URL slug optimization */
    urlSlug?: {
      /** Maximum slug length */
      maxLength?: number;
      /** Include primary keyword */
      includePrimaryKeyword: boolean;
      /** Use hyphens as separators */
      useHyphens: boolean;
    };
  };
  
  /** Internal linking requirements */
  internalLinking: {
    /** Minimum number of internal links */
    minInternalLinks: number;
    /** Maximum number of internal links */
    maxInternalLinks?: number;
    /** Link anchor text optimization */
    anchorTextOptimization: boolean;
    /** Categories to link to */
    linkCategories?: string[];
  };
  
  /** Image optimization requirements */
  imageOptimization: {
    /** Require alt text for all images */
    requireAltText: boolean;
    /** Optimize image file names */
    optimizeFileNames: boolean;
    /** Include keywords in alt text */
    keywordsInAltText: boolean;
    /** Image caption requirements */
    captionRequirements?: 'none' | 'optional' | 'required';
  };
  
  /** Technical SEO requirements */
  technicalSEO: {
    /** Schema markup requirements */
    schemaMarkup?: {
      /** Article schema */
      articleSchema: boolean;
      /** FAQ schema for Q&A content */
      faqSchema?: boolean;
      /** How-to schema for instructional content */
      howToSchema?: boolean;
    };
    /** Page speed considerations */
    pageSpeed?: {
      /** Optimize for Core Web Vitals */
      coreWebVitals: boolean;
      /** Lazy load images */
      lazyLoadImages?: boolean;
    };
  };
  
  /** Content freshness and updates */
  contentFreshness: {
    /** Include publication date */
    includePublishDate: boolean;
    /** Include last updated date */
    includeUpdateDate: boolean;
    /** Content review schedule */
    reviewSchedule?: '3months' | '6months' | '1year' | 'custom';
  };
  
  /** Local SEO (if applicable) */
  localSEO?: {
    /** Include location-based keywords */
    locationKeywords: string[];
    /** Local business schema */
    localBusinessSchema?: boolean;
    /** Geographic targeting */
    geoTargeting?: string[];
  };
}

/**
 * Comprehensive writing configuration interface as specified in requirements
 */
export interface WritingConfig {
  /** Content sections configuration */
  sections: ContentSection[];
  
  /** Style guide settings and preferences */
  styleGuide: StyleGuideSettings;
  
  /** SEO optimization requirements */
  seoRequirements: SEORequirements;
  
  /** Enable automatic fact-checking */
  factCheckingEnabled: boolean;
  
  /** Enable source verification */
  sourceVerification: boolean;
}

