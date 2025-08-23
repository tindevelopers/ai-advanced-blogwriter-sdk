
import type { BlogPost, BlogPostMetadata, BlogPostContent } from '../types';

/**
 * Blog post validation result
 */
export interface BlogPostValidation {
  /** Whether the blog post is valid */
  isValid: boolean;
  
  /** Validation errors (critical issues) */
  errors: ValidationError[];
  
  /** Validation warnings (non-critical issues) */
  warnings: ValidationWarning[];
  
  /** Suggestions for improvement */
  suggestions: string[];
  
  /** Quality score (0-100) */
  qualityScore: number;
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error type */
  type: 'missing_field' | 'invalid_format' | 'content_issue' | 'seo_critical';
  
  /** Error message */
  message: string;
  
  /** Field that has the error */
  field?: string;
  
  /** How to fix the error */
  fix: string;
  
  /** Severity level */
  severity: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning type */
  type: 'optimization' | 'best_practice' | 'seo_minor' | 'content_quality';
  
  /** Warning message */
  message: string;
  
  /** Field that has the warning */
  field?: string;
  
  /** Recommendation */
  recommendation: string;
  
  /** Impact on quality score */
  impact: number;
}

/**
 * Validate a blog post
 */
export function validateBlogPost(blogPost: BlogPost): BlogPostValidation {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];
  
  // Validate metadata
  const metadataValidation = validateMetadata(blogPost.metadata);
  errors.push(...metadataValidation.errors);
  warnings.push(...metadataValidation.warnings);
  suggestions.push(...metadataValidation.suggestions);
  
  // Validate content
  const contentValidation = validateContent(blogPost.content);
  errors.push(...contentValidation.errors);
  warnings.push(...contentValidation.warnings);
  suggestions.push(...contentValidation.suggestions);
  
  // Calculate quality score
  const qualityScore = calculateQualityScore(blogPost, errors, warnings);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions: [...new Set(suggestions)], // Remove duplicates
    qualityScore,
  };
}

/**
 * Validate blog post metadata
 */
function validateMetadata(metadata: BlogPostMetadata): {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];
  
  // Required fields validation
  if (!metadata.title || metadata.title.trim().length === 0) {
    errors.push({
      type: 'missing_field',
      message: 'Title is required',
      field: 'title',
      fix: 'Add a descriptive, engaging title',
      severity: 'critical',
    });
  } else {
    // Title length validation
    if (metadata.title.length < 30) {
      warnings.push({
        type: 'seo_minor',
        message: 'Title is shorter than recommended',
        field: 'title',
        recommendation: 'Consider a title between 30-60 characters for better SEO',
        impact: 5,
      });
    } else if (metadata.title.length > 60) {
      warnings.push({
        type: 'seo_minor',
        message: 'Title is longer than recommended',
        field: 'title',
        recommendation: 'Consider shortening the title to under 60 characters',
        impact: 5,
      });
    }
  }
  
  if (!metadata.slug || metadata.slug.trim().length === 0) {
    errors.push({
      type: 'missing_field',
      message: 'URL slug is required',
      field: 'slug',
      fix: 'Generate a URL-friendly slug from the title',
      severity: 'critical',
    });
  } else {
    // Slug format validation
    if (!/^[a-z0-9-]+$/.test(metadata.slug)) {
      errors.push({
        type: 'invalid_format',
        message: 'Slug contains invalid characters',
        field: 'slug',
        fix: 'Use only lowercase letters, numbers, and hyphens',
        severity: 'high',
      });
    }
  }
  
  // Meta description validation
  if (!metadata.metaDescription) {
    warnings.push({
      type: 'seo_minor',
      message: 'Missing meta description',
      field: 'metaDescription',
      recommendation: 'Add a compelling meta description (150-160 characters)',
      impact: 10,
    });
    suggestions.push('Add a meta description to improve search engine visibility');
  } else {
    if (metadata.metaDescription.length < 120) {
      warnings.push({
        type: 'seo_minor',
        message: 'Meta description is too short',
        field: 'metaDescription',
        recommendation: 'Extend meta description to 150-160 characters',
        impact: 5,
      });
    } else if (metadata.metaDescription.length > 160) {
      warnings.push({
        type: 'seo_minor',
        message: 'Meta description is too long',
        field: 'metaDescription',
        recommendation: 'Shorten meta description to under 160 characters',
        impact: 5,
      });
    }
  }
  
  // SEO validation
  if (!metadata.seo.focusKeyword) {
    warnings.push({
      type: 'seo_minor',
      message: 'No focus keyword specified',
      field: 'seo.focusKeyword',
      recommendation: 'Add a primary focus keyword for SEO optimization',
      impact: 15,
    });
    suggestions.push('Define a focus keyword to optimize content for search engines');
  }
  
  if (!metadata.seo.keywords || metadata.seo.keywords.length === 0) {
    warnings.push({
      type: 'seo_minor',
      message: 'No keywords specified',
      field: 'seo.keywords',
      recommendation: 'Add relevant keywords for better discoverability',
      impact: 10,
    });
  }
  
  // Word count validation
  if (metadata.seo.wordCount < 300) {
    warnings.push({
      type: 'content_quality',
      message: 'Content is very short',
      field: 'seo.wordCount',
      recommendation: 'Consider expanding content to at least 300 words',
      impact: 20,
    });
  } else if (metadata.seo.wordCount < 600) {
    warnings.push({
      type: 'content_quality',
      message: 'Content is shorter than average',
      field: 'seo.wordCount',
      recommendation: 'Consider expanding content for better depth and SEO',
      impact: 10,
    });
  }
  
  // Author validation
  if (!metadata.author) {
    warnings.push({
      type: 'best_practice',
      message: 'No author information',
      field: 'author',
      recommendation: 'Add author information for credibility',
      impact: 5,
    });
  }
  
  // Tags validation
  if (!metadata.tags || metadata.tags.length === 0) {
    warnings.push({
      type: 'best_practice',
      message: 'No tags specified',
      field: 'tags',
      recommendation: 'Add relevant tags for better content organization',
      impact: 5,
    });
    suggestions.push('Add relevant tags to improve content discoverability');
  } else if (metadata.tags.length > 10) {
    warnings.push({
      type: 'best_practice',
      message: 'Too many tags',
      field: 'tags',
      recommendation: 'Limit tags to 5-8 most relevant ones',
      impact: 3,
    });
  }
  
  return { errors, warnings, suggestions };
}

/**
 * Validate blog post content
 */
function validateContent(content: BlogPostContent): {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];
  
  // Content validation
  if (!content.content || content.content.trim().length === 0) {
    errors.push({
      type: 'missing_field',
      message: 'Content is required',
      field: 'content',
      fix: 'Add the main blog post content',
      severity: 'critical',
    });
  } else {
    // Check for headings
    const headingMatches = content.content.match(/^#{1,6}\s/gm);
    if (!headingMatches || headingMatches.length < 2) {
      warnings.push({
        type: 'content_quality',
        message: 'Limited heading structure',
        field: 'content',
        recommendation: 'Add more headings to improve content structure and readability',
        impact: 15,
      });
      suggestions.push('Improve content structure with clear headings (H2, H3, etc.)');
    }
    
    // Check for very long paragraphs
    const paragraphs = content.content.split('\n\n');
    const longParagraphs = paragraphs.filter(p => p.split(' ').length > 100);
    if (longParagraphs.length > 0) {
      warnings.push({
        type: 'content_quality',
        message: 'Some paragraphs are very long',
        field: 'content',
        recommendation: 'Break up long paragraphs for better readability',
        impact: 10,
      });
      suggestions.push('Break up long paragraphs into shorter, more digestible sections');
    }
    
    // Check for lists
    const listMatches = content.content.match(/^[-*+]\s|^\d+\.\s/gm);
    if (!listMatches && content.content.length > 1000) {
      suggestions.push('Consider adding bullet points or numbered lists to improve scanability');
    }
  }
  
  // Excerpt validation
  if (!content.excerpt) {
    warnings.push({
      type: 'best_practice',
      message: 'Missing excerpt',
      field: 'excerpt',
      recommendation: 'Add a compelling excerpt for better previews',
      impact: 8,
    });
    suggestions.push('Add an excerpt to provide a compelling summary of your content');
  } else if (content.excerpt.length < 50) {
    warnings.push({
      type: 'best_practice',
      message: 'Excerpt is too short',
      field: 'excerpt',
      recommendation: 'Expand excerpt to provide more context',
      impact: 3,
    });
  } else if (content.excerpt.length > 200) {
    warnings.push({
      type: 'best_practice',
      message: 'Excerpt is too long',
      field: 'excerpt',
      recommendation: 'Shorten excerpt for better impact',
      impact: 3,
    });
  }
  
  // Featured image validation
  if (!content.featuredImage) {
    warnings.push({
      type: 'best_practice',
      message: 'No featured image',
      field: 'featuredImage',
      recommendation: 'Add a featured image to improve engagement and social sharing',
      impact: 12,
    });
    suggestions.push('Add a featured image to make your post more visually appealing');
  } else {
    if (!content.featuredImage.alt) {
      warnings.push({
        type: 'seo_minor',
        message: 'Featured image missing alt text',
        field: 'featuredImage.alt',
        recommendation: 'Add descriptive alt text for accessibility and SEO',
        impact: 8,
      });
    }
  }
  
  // Table of contents validation
  if (content.content.length > 1500 && !content.tableOfContents) {
    suggestions.push('Consider adding a table of contents for longer articles to improve navigation');
  }
  
  return { errors, warnings, suggestions };
}

/**
 * Calculate overall quality score
 */
function calculateQualityScore(
  blogPost: BlogPost,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): number {
  let score = 100;
  
  // Deduct points for errors
  errors.forEach(error => {
    switch (error.severity) {
      case 'critical':
        score -= 30;
        break;
      case 'high':
        score -= 20;
        break;
      case 'medium':
        score -= 10;
        break;
      case 'low':
        score -= 5;
        break;
    }
  });
  
  // Deduct points for warnings
  warnings.forEach(warning => {
    score -= warning.impact;
  });
  
  // Bonus points for good practices
  if (blogPost.metadata.metaDescription && 
      blogPost.metadata.metaDescription.length >= 120 && 
      blogPost.metadata.metaDescription.length <= 160) {
    score += 5;
  }
  
  if (blogPost.metadata.seo.focusKeyword) {
    score += 5;
  }
  
  if (blogPost.content.featuredImage?.alt) {
    score += 3;
  }
  
  if (blogPost.content.tableOfContents && blogPost.content.tableOfContents.length > 0) {
    score += 3;
  }
  
  if (blogPost.metadata.seo.wordCount >= 800) {
    score += 5;
  }
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Validate blog template configuration
 */
export function validateTemplate(template: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!template.type) {
    errors.push('Template type is required');
  }
  
  if (!template.name) {
    errors.push('Template name is required');
  }
  
  if (!template.structure || !Array.isArray(template.structure)) {
    errors.push('Template structure must be an array');
  } else {
    template.structure.forEach((section: any, index: number) => {
      if (!section.id) {
        errors.push(`Section ${index + 1} is missing an ID`);
      }
      if (!section.title) {
        errors.push(`Section ${index + 1} is missing a title`);
      }
      if (typeof section.order !== 'number') {
        errors.push(`Section ${index + 1} must have a numeric order`);
      }
      if (typeof section.required !== 'boolean') {
        errors.push(`Section ${index + 1} must specify if it's required`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
