import { z } from 'zod';

// ===== TONE ANALYSIS SCHEMAS =====

export const ToneAnalysisSchema = z.object({
  primaryTone: z.enum([
    'professional', 'casual', 'friendly', 'authoritative', 'conversational',
    'technical', 'humorous', 'inspirational', 'educational', 'persuasive',
    'informative', 'academic', 'entertaining', 'empathetic', 'urgent',
    'confident', 'humble'
  ]),
  secondaryTones: z.array(z.enum([
    'professional', 'casual', 'friendly', 'authoritative', 'conversational',
    'technical', 'humorous', 'inspirational', 'educational', 'persuasive',
    'informative', 'academic', 'entertaining', 'empathetic', 'urgent',
    'confident', 'humble'
  ])),
  personalityTraits: z.record(z.number()),
  formalityLevel: z.number().min(0).max(1),
  emotionalTone: z.enum([
    'enthusiastic', 'confident', 'empathetic', 'optimistic', 'neutral',
    'concerned', 'urgent', 'calming', 'positive', 'negative', 'excited',
    'cautious', 'passionate', 'analytical', 'inspiring'
  ]),
  confidence: z.number().min(0).max(1)
});

export const BrandVoiceProfileSchema = z.object({
  primaryTone: z.enum([
    'professional', 'casual', 'friendly', 'authoritative', 'conversational',
    'technical', 'humorous', 'inspirational', 'educational', 'persuasive',
    'informative', 'academic', 'entertaining', 'empathetic', 'urgent',
    'confident', 'humble'
  ]),
  secondaryTones: z.array(z.enum([
    'professional', 'casual', 'friendly', 'authoritative', 'conversational',
    'technical', 'humorous', 'inspirational', 'educational', 'persuasive',
    'informative', 'academic', 'entertaining', 'empathetic', 'urgent',
    'confident', 'humble'
  ])),
  personalityTraits: z.object({
    warmth: z.number().min(0).max(1),
    competence: z.number().min(0).max(1),
    sincerity: z.number().min(0).max(1),
    excitement: z.number().min(0).max(1),
    sophistication: z.number().min(0).max(1)
  }),
  formalityLevel: z.enum([
    'very_formal', 'formal', 'neutral', 'informal', 'very_informal',
    'high', 'medium', 'low'
  ])
});

// ===== SEO ANALYSIS SCHEMAS =====

export const SEOAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  components: z.object({
    title: z.object({
      score: z.number().min(0).max(100),
      issues: z.array(z.string()),
      suggestions: z.array(z.string())
    }),
    metaDescription: z.object({
      score: z.number().min(0).max(100),
      issues: z.array(z.string()),
      suggestions: z.array(z.string())
    }),
    content: z.object({
      score: z.number().min(0).max(100),
      issues: z.array(z.string()),
      suggestions: z.array(z.string())
    }),
    keywords: z.object({
      score: z.number().min(0).max(100),
      issues: z.array(z.string()),
      suggestions: z.array(z.string())
    }),
    readability: z.object({
      score: z.number().min(0).max(100),
      issues: z.array(z.string()),
      suggestions: z.array(z.string())
    }),
    structure: z.object({
      score: z.number().min(0).max(100),
      issues: z.array(z.string()),
      suggestions: z.array(z.string())
    }),
    url: z.object({
      score: z.number().min(0).max(100),
      issues: z.array(z.string()),
      suggestions: z.array(z.string())
    })
  }),
  recommendations: z.array(z.object({
    type: z.enum(['content', 'seo', 'structure', 'readability']),
    category: z.enum(['keywords', 'content', 'images', 'technical', 'meta', 'links']),
    message: z.string(),
    current: z.string().optional(),
    suggested: z.string().optional(),
    impact: z.enum(['low', 'medium', 'high', 'critical']),
    fix: z.string().optional()
  })),
  keywords: z.array(z.object({
    keyword: z.string(),
    density: z.number(),
    recommendedDensity: z.object({
      min: z.number(),
      max: z.number()
    }),
    positions: z.array(z.number()),
    related: z.array(z.string()),
    longTail: z.array(z.string())
  }))
});

export const KeywordAnalysisSchema = z.array(z.object({
  keyword: z.string(),
  density: z.number(),
  recommendedDensity: z.object({
    min: z.number(),
    max: z.number()
  }),
  positions: z.array(z.number()),
  related: z.array(z.string()),
  longTail: z.array(z.string())
}));

export const SEORecommendationSchema = z.array(z.object({
  type: z.enum(['content', 'seo', 'structure', 'readability']),
  category: z.enum(['keywords', 'content', 'images', 'technical', 'meta', 'links']),
  message: z.string(),
  current: z.string().optional(),
  suggested: z.string().optional(),
  impact: z.enum(['low', 'medium', 'high', 'critical']),
  fix: z.string().optional()
}));

export const TitleOptimizationSchema = z.object({
  title: z.string()
});

export const MetaDescriptionSchema = z.object({
  description: z.string()
});

export const ContentOptimizationSchema = z.object({
  content: z.string()
});

// ===== CONTENT RESEARCH SCHEMAS =====

export const ContentResearchSchema = z.object({
  trending: z.array(z.string()).optional(),
  summary: z.string(),
  keyConcepts: z.array(z.string()),
  relatedTopics: z.array(z.string())
});

export const KeywordResearchSchema = z.object({
  trending: z.array(z.object({
    keyword: z.string(),
    searchVolume: z.number(),
    difficulty: z.number()
  })).optional(),
  primary: z.array(z.object({
    keyword: z.string(),
    searchVolume: z.number(),
    difficulty: z.number(),
    cpc: z.number().optional()
  })),
  longTail: z.array(z.object({
    keyword: z.string(),
    searchVolume: z.number(),
    difficulty: z.number()
  })),
  related: z.array(z.object({
    keyword: z.string(),
    searchVolume: z.number(),
    difficulty: z.number()
  }))
});

export const ContentGapAnalysisSchema = z.object({
  gaps: z.array(z.string()),
  angles: z.array(z.string()),
  questions: z.array(z.string()),
  subtopics: z.array(z.string())
});

export const CompetitorAnalysisSchema = z.object({
  topContent: z.array(z.object({
    title: z.string(),
    wordCount: z.number(),
    format: z.string(),
    keyTopics: z.array(z.string()),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string())
  })),
  analysis: z.object({
    avgLength: z.number(),
    commonTopics: z.array(z.string()),
    missingTopics: z.array(z.string()),
    formats: z.array(z.string())
  })
});

export const ContentOutlineSchema = z.object({
  structure: z.array(z.string()),
  wordCount: z.object({
    min: z.number(),
    max: z.number()
  }),
  tone: z.string(),
  keyPoints: z.array(z.string()),
  cta: z.array(z.string())
});

export const ContentSummarySchema = z.object({
  summary: z.string(),
  keywords: z.array(z.string()),
  questions: z.array(z.string()),
  suggestions: z.array(z.string())
});

// ===== TOPIC RESEARCH SCHEMAS =====

export const TopicResearchSchema = z.object({
  topics: z.array(z.object({
    title: z.string(),
    description: z.string(),
    searchVolume: z.number(),
    difficulty: z.number(),
    opportunityScore: z.number()
  })),
  trends: z.array(z.object({
    keyword: z.string(),
    growth: z.number(),
    seasonality: z.string()
  })).optional(),
  relatedTopics: z.array(z.object({
    title: z.string(),
    description: z.string(),
    searchVolume: z.number(),
    difficulty: z.number()
  }))
});

export const RelatedTopicsSchema = z.array(z.object({
  title: z.string(),
  description: z.string(),
  searchVolume: z.number(),
  difficulty: z.number(),
  opportunityScore: z.number()
}));

export const TopicValidationSchema = z.object({
  isValid: z.boolean(),
  reasons: z.array(z.string()),
  suggestions: z.array(z.string())
});

// ===== READABILITY SCHEMAS =====

export const ReadabilityAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  gradeLevel: z.number(),
  readingTime: z.number(),
  suggestions: z.array(z.object({
    type: z.enum(['content', 'seo', 'structure', 'readability']),
    category: z.enum(['keywords', 'content', 'images', 'technical', 'meta', 'links']),
    message: z.string(),
    impact: z.enum(['low', 'medium', 'high', 'critical'])
  }))
});

// Export all schemas
export const AI_SDK_SCHEMAS = {
  toneAnalysis: ToneAnalysisSchema,
  brandVoiceProfile: BrandVoiceProfileSchema,
  seoAnalysis: SEOAnalysisSchema,
  keywordAnalysis: KeywordAnalysisSchema,
  seoRecommendation: SEORecommendationSchema,
  titleOptimization: TitleOptimizationSchema,
  metaDescription: MetaDescriptionSchema,
  contentOptimization: ContentOptimizationSchema,
  contentResearch: ContentResearchSchema,
  keywordResearch: KeywordResearchSchema,
  contentGapAnalysis: ContentGapAnalysisSchema,
  competitorAnalysis: CompetitorAnalysisSchema,
  contentOutline: ContentOutlineSchema,
  contentSummary: ContentSummarySchema,
  topicResearch: TopicResearchSchema,
  relatedTopics: RelatedTopicsSchema,
  topicValidation: TopicValidationSchema,
  readabilityAnalysis: ReadabilityAnalysisSchema
} as const;
