/**
 * Metadata Management Types
 * Comprehensive metadata system with SEO, social media, and custom fields
 */

export type MetadataFieldType =
  | 'STRING'
  | 'TEXT'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'DATE'
  | 'JSON'
  | 'URL'
  | 'EMAIL';

export interface MetadataField {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  fieldType: MetadataFieldType;
  isRequired: boolean;
  isSystem: boolean;
  defaultValue?: string;
  validation?: MetadataValidation;
  group?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetadataValidation {
  /** Regular expression for string validation */
  regex?: string;
  /** Minimum length for strings */
  minLength?: number;
  /** Maximum length for strings */
  maxLength?: number;
  /** Minimum value for numbers */
  min?: number;
  /** Maximum value for numbers */
  max?: number;
  /** Predefined options for selection */
  options?: string[];
  /** Custom validation function */
  customValidator?: string; // Function name or code
}

export interface CustomMetadata {
  id: string;
  blogPostId: string;
  fieldId: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
  field: MetadataField;
}

export interface SeoMetadata {
  id: string;
  blogPostId: string;

  // Basic SEO
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  robotsDirective?: string;

  // Open Graph
  ogType?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogUrl?: string;
  ogSiteName?: string;
  ogLocale?: string;

  // Twitter Cards
  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterImageAlt?: string;

  // Schema.org structured data
  schemaType?: string;
  structuredData?: Record<string, any>;

  // Additional SEO fields
  focusKeywords: string[];
  secondaryKeywords: string[];
  keywordDensity?: number;
  internalLinks: number;
  externalLinks: number;
  imageCount: number;
  headingStructure?: HeadingStructure;

  createdAt: Date;
  updatedAt: Date;
}

export interface HeadingStructure {
  h1Count: number;
  h2Count: number;
  h3Count: number;
  h4Count: number;
  h5Count: number;
  h6Count: number;
  headings: HeadingInfo[];
}

export interface HeadingInfo {
  level: number;
  text: string;
  position: number;
  hasKeyword: boolean;
}

export interface MetadataTemplate {
  id: string;
  name: string;
  description?: string;
  fields: MetadataTemplateField[];
  isSystem: boolean;
  isActive: boolean;
}

export interface MetadataTemplateField {
  fieldId: string;
  isRequired: boolean;
  defaultValue?: string;
  order: number;
}

export interface SeoOptimizationSuggestion {
  type: 'title' | 'description' | 'keywords' | 'headings' | 'images' | 'links';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  currentValue?: string;
  suggestedValue?: string;
  reason: string;
  impact: 'low' | 'medium' | 'high';
}

export interface SeoAnalysisResult {
  overallScore: number; // 0-100
  keywordOptimization: number;
  contentStructure: number;
  metaOptimization: number;
  readability: number;
  suggestions: SeoOptimizationSuggestion[];
  analyzedAt: Date;
}

export interface MetadataValidationResult {
  isValid: boolean;
  errors: MetadataValidationError[];
  warnings: MetadataValidationWarning[];
}

export interface MetadataValidationError {
  fieldId: string;
  fieldName: string;
  message: string;
  currentValue?: string;
}

export interface MetadataValidationWarning {
  fieldId: string;
  fieldName: string;
  message: string;
  suggestion?: string;
}

export interface CreateMetadataFieldOptions {
  name: string;
  displayName: string;
  description?: string;
  fieldType: MetadataFieldType;
  isRequired?: boolean;
  defaultValue?: string;
  validation?: MetadataValidation;
  group?: string;
}

export interface UpdateMetadataOptions {
  seoMetadata?: Partial<SeoMetadata>;
  customFields?: Record<string, any>;
  validateOnly?: boolean;
  skipValidation?: boolean;
}

export interface MetadataSearchQuery {
  fields?: string[];
  values?: Record<string, any>;
  groups?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}
