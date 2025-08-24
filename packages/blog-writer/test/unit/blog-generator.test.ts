import { describe, test, expect, vi, beforeEach } from 'vitest';
import { generateBlog } from '../../src/core/blog-generator';
import type { BlogPost, BlogTemplate } from '../../src/types';

// Mock AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn(),
  generateObject: vi.fn(),
}));

// Mock validation
vi.mock('../../src/core/validation', () => ({
  validateBlogPost: vi.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    qualityScore: 85,
  })),
}));

describe('Blog Generator Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateBlog', () => {
    test('should generate a blog post with valid options', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockResolvedValue({
        text: '# Test Blog Post\n\nThis is a test blog post content.',
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 50 },
      });

      const options = {
        model: {} as any,
        topic: 'Test Topic',
        keywords: ['test', 'blog'],
        template: 'howto' as BlogTemplate,
        wordCount: { min: 500, max: 1000 },
        tone: 'professional',
        audience: 'developers',
      };

      const result = await generateBlog(options);

      expect(result).toBeDefined();
      expect(result.blogPost).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.template).toBe('howto');
      expect(result.metadata.wordCount).toBeGreaterThan(0);
      expect(mockGenerateText).toHaveBeenCalled();
    });

    test('should handle missing template gracefully', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockResolvedValue({
        text: '# Default Blog Post\n\nDefault content.',
        finishReason: 'stop',
        usage: { promptTokens: 50, completionTokens: 25 },
      });

      const options = {
        model: {} as any,
        topic: 'Test Topic',
        // No template specified
      };

      const result = await generateBlog(options);

      expect(result).toBeDefined();
      expect(result.metadata.template).toBe('howto'); // Should default to howto
    });

    test('should validate generated blog post', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockResolvedValue({
        text: '# Valid Blog Post\n\nValid content.',
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 50 },
      });

      const mockValidateBlogPost = vi.mocked(
        await import('../../src/core/validation'),
      ).validateBlogPost;

      const options = {
        model: {} as any,
        topic: 'Test Topic',
      };

      await generateBlog(options);

      expect(mockValidateBlogPost).toHaveBeenCalled();
    });

    test('should handle AI generation errors', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockRejectedValue(new Error('AI service unavailable'));

      const options = {
        model: {} as any,
        topic: 'Test Topic',
      };

      await expect(generateBlog(options)).rejects.toThrow(
        'AI service unavailable',
      );
    });

    test('should respect word count constraints', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockResolvedValue({
        text: '# Short Post\n\nShort content.',
        finishReason: 'stop',
        usage: { promptTokens: 50, completionTokens: 25 },
      });

      const options = {
        model: {} as any,
        topic: 'Test Topic',
        wordCount: { min: 1000, max: 2000 },
      };

      const result = await generateBlog(options);

      expect(result.metadata.wordCount).toBeGreaterThanOrEqual(1000);
      expect(result.metadata.wordCount).toBeLessThanOrEqual(2000);
    });

    test('should include SEO metadata when requested', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockResolvedValue({
        text: '# SEO Optimized Post\n\nSEO content.',
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 50 },
      });

      const options = {
        model: {} as any,
        topic: 'Test Topic',
        seo: {
          focusKeyword: 'test keyword',
          metaDescription: 'Test meta description',
          includeToC: true,
        },
      };

      const result = await generateBlog(options);

      expect(result.blogPost.metadata.seo).toBeDefined();
      expect(result.blogPost.metadata.seo.focusKeyword).toBe('test keyword');
      expect(result.blogPost.metadata.seo.metaDescription).toBe(
        'Test meta description',
      );
    });
  });
});
