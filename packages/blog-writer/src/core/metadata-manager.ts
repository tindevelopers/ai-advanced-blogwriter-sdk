

import { PrismaClient } from '../generated/prisma-client';
import type {
  MetadataField,
  MetadataFieldType,
  MetadataValidation,
  CustomMetadata,
  SeoMetadata,
  SeoAnalysisResult,
  SeoOptimizationSuggestion,
  MetadataValidationResult,
  MetadataValidationError,
  MetadataValidationWarning,
  CreateMetadataFieldOptions,
  UpdateMetadataOptions,
  MetadataSearchQuery,
  HeadingStructure,
  HeadingInfo
} from '../types/metadata';

/**
 * Metadata Manager - Comprehensive metadata system
 * Handles SEO metadata, custom fields, validation, and optimization
 */
export class MetadataManager {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a custom metadata field
   */
  async createMetadataField(options: CreateMetadataFieldOptions): Promise<MetadataField> {
    const field = await this.prisma.metadataField.create({
      data: {
        name: options.name,
        displayName: options.displayName,
        description: options.description,
        fieldType: options.fieldType,
        isRequired: options.isRequired || false,
        defaultValue: options.defaultValue,
        validation: options.validation,
        group: options.group
      }
    });

    return field as MetadataField;
  }

  /**
   * Get all metadata fields
   */
  async getMetadataFields(group?: string): Promise<MetadataField[]> {
    const where = group ? { group, isActive: true } : { isActive: true };
    
    return await this.prisma.metadataField.findMany({
      where,
      orderBy: [{ group: 'asc' }, { order: 'asc' }]
    }) as MetadataField[];
  }

  /**
   * Update SEO metadata for a blog post
   */
  async updateSeoMetadata(
    blogPostId: string,
    metadata: Partial<SeoMetadata>
  ): Promise<SeoMetadata> {
    const existingMetadata = await this.prisma.seoMetadata.findUnique({
      where: { blogPostId }
    });

    const seoMetadata = existingMetadata
      ? await this.prisma.seoMetadata.update({
          where: { blogPostId },
          data: {
            ...metadata,
            updatedAt: new Date()
          }
        })
      : await this.prisma.seoMetadata.create({
          data: {
            blogPostId,
            ...metadata
          }
        });

    return seoMetadata as SeoMetadata;
  }

  /**
   * Get SEO metadata for a blog post
   */
  async getSeoMetadata(blogPostId: string): Promise<SeoMetadata | null> {
    const metadata = await this.prisma.seoMetadata.findUnique({
      where: { blogPostId }
    });

    return metadata as SeoMetadata | null;
  }

  /**
   * Set custom metadata for a blog post
   */
  async setCustomMetadata(
    blogPostId: string,
    fieldId: string,
    value: string
  ): Promise<CustomMetadata> {
    const field = await this.prisma.metadataField.findUnique({
      where: { id: fieldId }
    });

    if (!field) {
      throw new Error(`Metadata field with ID ${fieldId} not found`);
    }

    // Validate the value
    const validationResult = this.validateFieldValue(field as MetadataField, value);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    const metadata = await this.prisma.customMetadata.upsert({
      where: { 
        blogPostId_fieldId: { blogPostId, fieldId }
      },
      update: { 
        value,
        updatedAt: new Date()
      },
      create: {
        blogPostId,
        fieldId,
        value
      },
      include: { field: true }
    });

    return metadata as CustomMetadata;
  }

  /**
   * Get all custom metadata for a blog post
   */
  async getCustomMetadata(blogPostId: string): Promise<CustomMetadata[]> {
    return await this.prisma.customMetadata.findMany({
      where: { blogPostId },
      include: { field: true },
      orderBy: { field: { order: 'asc' } }
    }) as CustomMetadata[];
  }

  /**
   * Update blog post metadata (SEO + custom fields)
   */
  async updateBlogPostMetadata(
    blogPostId: string,
    options: UpdateMetadataOptions
  ): Promise<{
    seoMetadata?: SeoMetadata;
    customMetadata: CustomMetadata[];
    validationResults?: MetadataValidationResult;
  }> {
    const results: any = {};

    // Update SEO metadata
    if (options.seoMetadata) {
      results.seoMetadata = await this.updateSeoMetadata(blogPostId, options.seoMetadata);
    }

    // Update custom fields
    if (options.customFields) {
      const customMetadata: CustomMetadata[] = [];
      
      for (const [fieldName, value] of Object.entries(options.customFields)) {
        const field = await this.prisma.metadataField.findUnique({
          where: { name: fieldName }
        });
        
        if (field) {
          const metadata = await this.setCustomMetadata(blogPostId, field.id, String(value));
          customMetadata.push(metadata);
        }
      }
      
      results.customMetadata = customMetadata;
    }

    // Validate if requested
    if (options.validateOnly || !options.skipValidation) {
      results.validationResults = await this.validateBlogPostMetadata(blogPostId);
    }

    return results;
  }

  /**
   * Validate blog post metadata
   */
  async validateBlogPostMetadata(blogPostId: string): Promise<MetadataValidationResult> {
    const [seoMetadata, customMetadata, requiredFields] = await Promise.all([
      this.getSeoMetadata(blogPostId),
      this.getCustomMetadata(blogPostId),
      this.prisma.metadataField.findMany({
        where: { isRequired: true, isActive: true }
      })
    ]);

    const errors: MetadataValidationError[] = [];
    const warnings: MetadataValidationWarning[] = [];

    // Validate required custom fields
    for (const field of requiredFields) {
      const hasValue = customMetadata.some(cm => cm.fieldId === field.id && cm.value);
      
      if (!hasValue) {
        errors.push({
          fieldId: field.id,
          fieldName: field.displayName,
          message: `${field.displayName} is required but not provided`
        });
      }
    }

    // Validate custom metadata values
    for (const metadata of customMetadata) {
      const fieldValidation = this.validateFieldValue(metadata.field, metadata.value);
      
      errors.push(...fieldValidation.errors);
      warnings.push(...fieldValidation.warnings);
    }

    // SEO metadata validation
    if (seoMetadata) {
      const seoValidation = this.validateSeoMetadata(seoMetadata);
      errors.push(...seoValidation.errors);
      warnings.push(...seoValidation.warnings);
    } else {
      warnings.push({
        fieldId: 'seo_metadata',
        fieldName: 'SEO Metadata',
        message: 'No SEO metadata found',
        suggestion: 'Add SEO metadata to improve search visibility'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Analyze SEO and provide optimization suggestions
   */
  async analyzeSeo(blogPostId: string): Promise<SeoAnalysisResult> {
    const blogPost = await this.prisma.blogPost.findUnique({
      where: { id: blogPostId },
      include: { seoMetadata: true }
    });

    if (!blogPost) {
      throw new Error(`Blog post with ID ${blogPostId} not found`);
    }

    const seoMetadata = blogPost.seoMetadata;
    const suggestions: SeoOptimizationSuggestion[] = [];
    
    let keywordOptimization = 0;
    let contentStructure = 0;
    let metaOptimization = 0;
    let readability = 0;

    // Title analysis
    if (!blogPost.title) {
      suggestions.push({
        type: 'title',
        priority: 'critical',
        message: 'Title is missing',
        reason: 'Title is essential for SEO',
        impact: 'high'
      });
    } else {
      const titleLength = blogPost.title.length;
      if (titleLength < 30) {
        suggestions.push({
          type: 'title',
          priority: 'high',
          message: 'Title is too short',
          currentValue: `${titleLength} characters`,
          suggestedValue: '30-60 characters',
          reason: 'Longer titles perform better in search results',
          impact: 'medium'
        });
        metaOptimization += 10;
      } else if (titleLength > 60) {
        suggestions.push({
          type: 'title',
          priority: 'medium',
          message: 'Title might be too long',
          currentValue: `${titleLength} characters`,
          suggestedValue: '30-60 characters',
          reason: 'Long titles get truncated in search results',
          impact: 'medium'
        });
        metaOptimization += 15;
      } else {
        metaOptimization += 25;
      }
    }

    // Meta description analysis
    if (seoMetadata?.metaDescription) {
      const descLength = seoMetadata.metaDescription.length;
      if (descLength < 120) {
        suggestions.push({
          type: 'description',
          priority: 'medium',
          message: 'Meta description is too short',
          currentValue: `${descLength} characters`,
          suggestedValue: '120-160 characters',
          reason: 'Longer descriptions provide more context',
          impact: 'medium'
        });
        metaOptimization += 10;
      } else if (descLength > 160) {
        suggestions.push({
          type: 'description',
          priority: 'medium',
          message: 'Meta description is too long',
          currentValue: `${descLength} characters`,
          suggestedValue: '120-160 characters',
          reason: 'Long descriptions get truncated',
          impact: 'medium'
        });
        metaOptimization += 15;
      } else {
        metaOptimization += 25;
      }
    } else {
      suggestions.push({
        type: 'description',
        priority: 'high',
        message: 'Meta description is missing',
        reason: 'Meta description affects click-through rates',
        impact: 'high'
      });
    }

    // Content structure analysis
    const headingStructure = this.analyzeHeadingStructure(blogPost.content);
    if (headingStructure.h1Count === 0) {
      suggestions.push({
        type: 'headings',
        priority: 'high',
        message: 'No H1 heading found',
        reason: 'H1 heading is important for content structure',
        impact: 'high'
      });
    } else if (headingStructure.h1Count > 1) {
      suggestions.push({
        type: 'headings',
        priority: 'medium',
        message: 'Multiple H1 headings found',
        currentValue: `${headingStructure.h1Count} H1 headings`,
        suggestedValue: '1 H1 heading',
        reason: 'Only one H1 heading should be used per page',
        impact: 'medium'
      });
      contentStructure += 15;
    } else {
      contentStructure += 25;
    }

    if (headingStructure.h2Count === 0) {
      suggestions.push({
        type: 'headings',
        priority: 'medium',
        message: 'No H2 headings found',
        reason: 'H2 headings improve content structure and readability',
        impact: 'medium'
      });
    } else {
      contentStructure += 25;
    }

    // Keyword optimization analysis
    if (seoMetadata?.focusKeywords && seoMetadata.focusKeywords.length > 0) {
      for (const keyword of seoMetadata.focusKeywords) {
        const density = this.calculateKeywordDensity(blogPost.content, keyword);
        
        if (density < 0.005) {
          suggestions.push({
            type: 'keywords',
            priority: 'high',
            message: `Focus keyword "${keyword}" appears too rarely`,
            currentValue: `${(density * 100).toFixed(2)}%`,
            suggestedValue: '0.5-2.5%',
            reason: 'Low keyword density may hurt rankings',
            impact: 'medium'
          });
          keywordOptimization += 10;
        } else if (density > 0.025) {
          suggestions.push({
            type: 'keywords',
            priority: 'medium',
            message: `Focus keyword "${keyword}" may be overused`,
            currentValue: `${(density * 100).toFixed(2)}%`,
            suggestedValue: '0.5-2.5%',
            reason: 'Keyword stuffing can hurt rankings',
            impact: 'medium'
          });
          keywordOptimization += 15;
        } else {
          keywordOptimization += 25;
        }
      }
    } else {
      suggestions.push({
        type: 'keywords',
        priority: 'high',
        message: 'No focus keywords defined',
        reason: 'Focus keywords help target specific search queries',
        impact: 'high'
      });
    }

    // Content length analysis
    const wordCount = this.countWords(blogPost.content);
    if (wordCount < 300) {
      suggestions.push({
        type: 'content',
        priority: 'high',
        message: 'Content is too short',
        currentValue: `${wordCount} words`,
        suggestedValue: 'At least 300 words',
        reason: 'Longer content tends to rank better',
        impact: 'high'
      });
      contentStructure += 10;
    } else if (wordCount >= 1000) {
      contentStructure += 25;
      readability += 25;
    } else {
      contentStructure += 20;
      readability += 20;
    }

    // Calculate overall score
    const overallScore = (keywordOptimization + contentStructure + metaOptimization + readability) / 4;

    // Save analysis to database
    const analysis = await this.prisma.sEOAnalysis.create({
      data: {
        blogPostId,
        score: overallScore,
        keywordOptimization,
        contentStructure,
        metaOptimization,
        readability,
        recommendations: suggestions.map(s => ({
          type: s.type,
          priority: s.priority,
          message: s.message,
          currentValue: s.currentValue,
          suggestedValue: s.suggestedValue,
          reason: s.reason,
          impact: s.impact
        }))
      }
    });

    return {
      overallScore,
      keywordOptimization,
      contentStructure,
      metaOptimization,
      readability,
      suggestions,
      analyzedAt: analysis.analyzedAt
    };
  }

  /**
   * Search blog posts by metadata
   */
  async searchByMetadata(query: MetadataSearchQuery): Promise<any[]> {
    const where: any = {};

    // Build where clause based on query
    if (query.fields && query.fields.length > 0) {
      where.customMetadata = {
        some: {
          field: {
            name: { in: query.fields }
          }
        }
      };
    }

    if (query.values && Object.keys(query.values).length > 0) {
      const customMetadataConditions = Object.entries(query.values).map(([fieldName, value]) => ({
        customMetadata: {
          some: {
            field: { name: fieldName },
            value: String(value)
          }
        }
      }));

      where.AND = customMetadataConditions;
    }

    if (query.dateRange) {
      where.createdAt = {
        gte: query.dateRange.from,
        lte: query.dateRange.to
      };
    }

    return await this.prisma.blogPost.findMany({
      where,
      include: {
        customMetadata: {
          include: { field: true }
        },
        seoMetadata: true
      }
    });
  }

  /**
   * Validate a field value against its validation rules
   */
  private validateFieldValue(
    field: MetadataField,
    value: string
  ): { isValid: boolean; errors: MetadataValidationError[]; warnings: MetadataValidationWarning[] } {
    const errors: MetadataValidationError[] = [];
    const warnings: MetadataValidationWarning[] = [];

    if (!value && field.isRequired) {
      errors.push({
        fieldId: field.id,
        fieldName: field.displayName,
        message: `${field.displayName} is required`
      });
      return { isValid: false, errors, warnings };
    }

    if (!value) {
      return { isValid: true, errors, warnings };
    }

    const validation = field.validation as MetadataValidation;
    if (!validation) {
      return { isValid: true, errors, warnings };
    }

    // String length validation
    if (validation.minLength && value.length < validation.minLength) {
      errors.push({
        fieldId: field.id,
        fieldName: field.displayName,
        message: `${field.displayName} must be at least ${validation.minLength} characters`,
        currentValue: `${value.length} characters`
      });
    }

    if (validation.maxLength && value.length > validation.maxLength) {
      errors.push({
        fieldId: field.id,
        fieldName: field.displayName,
        message: `${field.displayName} must not exceed ${validation.maxLength} characters`,
        currentValue: `${value.length} characters`
      });
    }

    // Numeric validation
    if (field.fieldType === 'NUMBER') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        errors.push({
          fieldId: field.id,
          fieldName: field.displayName,
          message: `${field.displayName} must be a valid number`
        });
      } else {
        if (validation.min !== undefined && numValue < validation.min) {
          errors.push({
            fieldId: field.id,
            fieldName: field.displayName,
            message: `${field.displayName} must be at least ${validation.min}`
          });
        }

        if (validation.max !== undefined && numValue > validation.max) {
          errors.push({
            fieldId: field.id,
            fieldName: field.displayName,
            message: `${field.displayName} must not exceed ${validation.max}`
          });
        }
      }
    }

    // Regex validation
    if (validation.regex) {
      const regex = new RegExp(validation.regex);
      if (!regex.test(value)) {
        errors.push({
          fieldId: field.id,
          fieldName: field.displayName,
          message: `${field.displayName} format is invalid`
        });
      }
    }

    // Options validation
    if (validation.options && validation.options.length > 0) {
      if (!validation.options.includes(value)) {
        errors.push({
          fieldId: field.id,
          fieldName: field.displayName,
          message: `${field.displayName} must be one of: ${validation.options.join(', ')}`
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate SEO metadata
   */
  private validateSeoMetadata(seoMetadata: SeoMetadata): {
    errors: MetadataValidationError[];
    warnings: MetadataValidationWarning[];
  } {
    const errors: MetadataValidationError[] = [];
    const warnings: MetadataValidationWarning[] = [];

    // URL validation
    const urlFields = ['canonicalUrl', 'ogUrl', 'ogImage', 'twitterImage'];
    
    for (const field of urlFields) {
      const value = (seoMetadata as any)[field];
      if (value && !this.isValidUrl(value)) {
        errors.push({
          fieldId: field,
          fieldName: field,
          message: `${field} is not a valid URL`,
          currentValue: value
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Analyze heading structure in content
   */
  private analyzeHeadingStructure(content: string): HeadingStructure {
    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
    const headings: HeadingInfo[] = [];
    const counts = { h1Count: 0, h2Count: 0, h3Count: 0, h4Count: 0, h5Count: 0, h6Count: 0 };
    
    let match;
    let position = 0;
    
    while ((match = headingRegex.exec(content)) !== null) {
      const level = parseInt(match[1]);
      const text = match[2].replace(/<[^>]*>/g, ''); // Remove HTML tags
      
      headings.push({
        level,
        text,
        position,
        hasKeyword: false // Would need keyword analysis
      });

      (counts as any)[`h${level}Count`]++;
      position++;
    }

    return {
      ...counts,
      headings
    };
  }

  /**
   * Calculate keyword density
   */
  private calculateKeywordDensity(content: string, keyword: string): number {
    const words = content.toLowerCase().split(/\s+/);
    const keywordWords = keyword.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    
    if (totalWords === 0) return 0;
    
    let matches = 0;
    for (let i = 0; i <= words.length - keywordWords.length; i++) {
      const phrase = words.slice(i, i + keywordWords.length).join(' ');
      if (phrase === keyword.toLowerCase()) {
        matches++;
      }
    }
    
    return matches / totalWords;
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Check if a string is a valid URL
   */
  private isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
}

