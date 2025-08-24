import { describe, test, expect } from 'vitest';
import {
  BLOG_TEMPLATES,
  validateBlogPost,
  DEFAULT_BLOG_CONFIG,
  type BlogPost,
  type BlogTemplate,
} from '../src';

describe('Blog Writer SDK', () => {
  test('should export all required modules', () => {
    expect(BLOG_TEMPLATES).toBeDefined();
    expect(validateBlogPost).toBeDefined();
    expect(DEFAULT_BLOG_CONFIG).toBeDefined();
  });

  test('should have all blog templates', () => {
    const expectedTemplates: BlogTemplate[] = [
      'howto',
      'listicle',
      'comparison',
      'tutorial',
      'news',
      'review',
      'guide',
      'case-study',
      'opinion',
      'interview',
    ];

    expectedTemplates.forEach(template => {
      expect(BLOG_TEMPLATES[template]).toBeDefined();
      expect(BLOG_TEMPLATES[template].name).toBeDefined();
      expect(BLOG_TEMPLATES[template].structure).toBeDefined();
      expect(Array.isArray(BLOG_TEMPLATES[template].structure)).toBe(true);
    });
  });

  test('should validate blog post structure', () => {
    const validBlogPost: BlogPost = {
      metadata: {
        id: 'test-123',
        title: 'Test Blog Post Title That Is Long Enough',
        slug: 'test-blog-post',
        metaDescription:
          'This is a test meta description that is long enough to meet the requirements and provide good SEO value.',
        createdAt: new Date(),
        updatedAt: new Date(),
        seo: {
          focusKeyword: 'test keyword',
          keywords: ['test', 'blog', 'post'],
          wordCount: 1200,
          seoScore: 85,
          readabilityScore: 75,
        },
        settings: {
          language: 'en',
          template: 'howto',
          readingTime: 6,
        },
      },
      content: {
        content: `# Test Blog Post

## Introduction

This is a comprehensive test blog post that demonstrates the structure and content expected by our validation system.

## Main Content

Here we provide detailed information about the topic, ensuring we meet the minimum word count requirements and maintain good structure with proper headings.

### Subsection

Additional content to reach the required word count and demonstrate proper heading hierarchy.

## Conclusion

A strong conclusion that summarizes the main points and provides value to readers.`,
        excerpt:
          'This is a test blog post that demonstrates proper structure and validation.',
        featuredImage: {
          url: 'https://lh7-rt.googleusercontent.com/docsz/AD_4nXcBHaS2_nCqNH5UpbKeUqrterGqcKjv9SRXjCkmxW4MKt8klkQqdn7yBnkHW2w4t-Dq3f8jW4VAqBurRXph1nIPm0VPBqNNhbJfvQ8s4tjOABTk3VwxdahFMdhCKAvj4ooBfmB4zQ?key=ZdrYanZZLkredigYP3OytA',
          alt: 'Test blog post featured image',
        },
      },
      status: 'draft',
    };

    const validation = validateBlogPost(validBlogPost);

    expect(validation.isValid).toBe(true);
    expect(validation.qualityScore).toBeGreaterThan(70);
    expect(Array.isArray(validation.errors)).toBe(true);
    expect(Array.isArray(validation.warnings)).toBe(true);
    expect(Array.isArray(validation.suggestions)).toBe(true);
  });

  test('should validate blog post with missing required fields', () => {
    const invalidBlogPost: BlogPost = {
      metadata: {
        id: 'test-invalid',
        title: '', // Invalid: empty title
        slug: 'invalid slug with spaces', // Invalid: spaces in slug
        createdAt: new Date(),
        updatedAt: new Date(),
        seo: {
          wordCount: 50, // Too short
        },
        settings: {},
      },
      content: {
        content: 'Too short content.', // Too short
      },
      status: 'draft',
    };

    const validation = validateBlogPost(invalidBlogPost);

    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.qualityScore).toBeLessThan(70);
  });

  test('should have valid default configuration', () => {
    expect(DEFAULT_BLOG_CONFIG.seo).toBeDefined();
    expect(DEFAULT_BLOG_CONFIG.quality).toBeDefined();
    expect(DEFAULT_BLOG_CONFIG.research).toBeDefined();

    expect(typeof DEFAULT_BLOG_CONFIG.seo.keywordDensity).toBe('number');
    expect(typeof DEFAULT_BLOG_CONFIG.seo.minLength).toBe('number');
    expect(typeof DEFAULT_BLOG_CONFIG.seo.maxLength).toBe('number');

    expect(DEFAULT_BLOG_CONFIG.seo.keywordDensity).toBeGreaterThan(0);
    expect(DEFAULT_BLOG_CONFIG.seo.keywordDensity).toBeLessThan(1);
  });

  test('template structures should be valid', () => {
    Object.entries(BLOG_TEMPLATES).forEach(([key, template]) => {
      // Check template has required properties
      expect(template.type).toBe(key);
      expect(template.name).toBeDefined();
      expect(template.description).toBeDefined();
      expect(Array.isArray(template.structure)).toBe(true);

      // Check each section in structure
      template.structure.forEach((section, index) => {
        expect(section.id).toBeDefined();
        expect(section.title).toBeDefined();
        expect(typeof section.order).toBe('number');
        expect(typeof section.required).toBe('boolean');
        expect(section.contentType).toBeDefined();

        // Order should match index + 1
        expect(section.order).toBe(index + 1);
      });

      // Check SEO settings if present
      if (template.seoSettings) {
        expect(template.seoSettings.wordCount).toBeDefined();
        if (template.seoSettings.wordCount) {
          expect(template.seoSettings.wordCount.min).toBeGreaterThan(0);
          expect(template.seoSettings.wordCount.max).toBeGreaterThan(
            template.seoSettings.wordCount.min,
          );
        }
      }
    });
  });
});
