import { describe, test, expect } from 'vitest';
import { validateBlogPost } from '../../src/core/validation';
import type { BlogPost } from '../../src/types';

describe('Blog Post Validation Unit Tests', () => {
  describe('validateBlogPost', () => {
    test('should validate a well-formed blog post', () => {
      const validBlogPost: BlogPost = {
        metadata: {
          id: 'test-123',
          title: 'Valid Blog Post Title',
          slug: 'valid-blog-post',
          metaDescription:
            'A valid meta description that is long enough for SEO.',
          createdAt: new Date(),
          updatedAt: new Date(),
          seo: {
            focusKeyword: 'valid keyword',
            keywords: ['valid', 'blog', 'post'],
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
          content: `# Valid Blog Post

## Introduction

This is a comprehensive test blog post that demonstrates proper structure and validation.

## Main Content

Here we provide detailed information about the topic, ensuring we meet the minimum word count requirements and maintain good structure with proper headings.

### Subsection

Additional content to reach the required word count and demonstrate proper heading hierarchy.

## Conclusion

A strong conclusion that summarizes the main points and provides value to readers.`,
          excerpt:
            'This is a test blog post that demonstrates proper structure and validation.',
          featuredImage: {
            url: 'https://example.com/image.jpg',
            alt: 'Valid blog post featured image',
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

    test('should reject blog post with empty title', () => {
      const invalidBlogPost: BlogPost = {
        metadata: {
          id: 'invalid-123',
          title: '', // Invalid: empty title
          slug: 'invalid-blog-post',
          createdAt: new Date(),
          updatedAt: new Date(),
          seo: {
            wordCount: 1000,
          },
          settings: {},
        },
        content: {
          content: 'Valid content for testing.',
        },
        status: 'draft',
      };

      const validation = validateBlogPost(invalidBlogPost);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(error => error.field === 'title')).toBe(
        true,
      );
      expect(validation.qualityScore).toBeLessThan(70);
    });

    test('should reject blog post with invalid slug', () => {
      const invalidBlogPost: BlogPost = {
        metadata: {
          id: 'invalid-slug-123',
          title: 'Valid Title',
          slug: 'invalid slug with spaces', // Invalid: spaces in slug
          createdAt: new Date(),
          updatedAt: new Date(),
          seo: {
            wordCount: 1000,
          },
          settings: {},
        },
        content: {
          content: 'Valid content for testing.',
        },
        status: 'draft',
      };

      const validation = validateBlogPost(invalidBlogPost);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(error => error.field === 'slug')).toBe(
        true,
      );
    });

    test('should reject blog post with too short content', () => {
      const invalidBlogPost: BlogPost = {
        metadata: {
          id: 'short-content-123',
          title: 'Valid Title',
          slug: 'valid-slug',
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
      expect(
        validation.errors.some(error => error.type === 'content_issue'),
      ).toBe(true);
    });

    test('should reject blog post with missing required metadata', () => {
      const invalidBlogPost: BlogPost = {
        metadata: {
          id: 'missing-metadata-123',
          title: 'Valid Title',
          slug: 'valid-slug',
          createdAt: new Date(),
          updatedAt: new Date(),
          // Missing required fields
          seo: {},
          settings: {},
        },
        content: {
          content: 'Valid content for testing.',
        },
        status: 'draft',
      };

      const validation = validateBlogPost(invalidBlogPost);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should provide helpful suggestions for improvement', () => {
      const mediocreBlogPost: BlogPost = {
        metadata: {
          id: 'mediocre-123',
          title: 'Mediocre Title',
          slug: 'mediocre-title',
          metaDescription: 'Short description.', // Too short
          createdAt: new Date(),
          updatedAt: new Date(),
          seo: {
            focusKeyword: 'keyword',
            keywords: ['keyword'],
            wordCount: 800, // Below optimal
            seoScore: 60, // Below optimal
            readabilityScore: 65, // Below optimal
          },
          settings: {
            language: 'en',
            template: 'howto',
            readingTime: 4,
          },
        },
        content: {
          content: `# Mediocre Blog Post

This is a mediocre blog post that needs improvement.

## Content

The content is okay but could be better.

## Conclusion

Basic conclusion.`,
          excerpt: 'Mediocre excerpt.',
        },
        status: 'draft',
      };

      const validation = validateBlogPost(mediocreBlogPost);

      expect(validation.isValid).toBe(false);
      expect(validation.suggestions.length).toBeGreaterThan(0);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.qualityScore).toBeLessThan(80);
    });

    test('should handle blog post with no content gracefully', () => {
      const emptyBlogPost: BlogPost = {
        metadata: {
          id: 'empty-123',
          title: 'Empty Blog Post',
          slug: 'empty-blog-post',
          createdAt: new Date(),
          updatedAt: new Date(),
          seo: {
            wordCount: 0,
          },
          settings: {},
        },
        content: {
          content: '', // Empty content
        },
        status: 'draft',
      };

      const validation = validateBlogPost(emptyBlogPost);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(
        validation.errors.some(error => error.type === 'content_issue'),
      ).toBe(true);
    });

    test('should validate blog post with special characters', () => {
      const specialCharBlogPost: BlogPost = {
        metadata: {
          id: 'special-123',
          title: 'Blog Post with Special Chars: !@#$%^&*()',
          slug: 'blog-post-with-special-chars',
          metaDescription: 'Description with special characters: 🚀🌟🎉',
          createdAt: new Date(),
          updatedAt: new Date(),
          seo: {
            focusKeyword: 'special-chars',
            keywords: ['special', 'chars', 'test'],
            wordCount: 1000,
            seoScore: 80,
            readabilityScore: 75,
          },
          settings: {
            language: 'en',
            template: 'howto',
            readingTime: 5,
          },
        },
        content: {
          content: `# Special Characters Test

This blog post contains special characters: !@#$%^&*()_+-=[]{}|;:,.<>?

## Unicode Content

Here are some unicode characters: 🚀🌟🎉中文日本語한국어

## Conclusion

Special characters should be handled properly.`,
          excerpt: 'Test with special characters.',
        },
        status: 'draft',
      };

      const validation = validateBlogPost(specialCharBlogPost);

      expect(validation.isValid).toBe(true);
      expect(validation.qualityScore).toBeGreaterThan(70);
    });
  });
});
