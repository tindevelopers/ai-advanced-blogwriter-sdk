import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BlogGenerator } from '../../src/core/blog-generator';
import { ContentOptimizationService } from '../../src/core/content-optimization-service';
import { validateBlogPost } from '../../src/core/validation';
import type { BlogPost } from '../../src/types';

// Mock AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn(),
  generateObject: vi.fn(),
}));

// Mock Prisma
vi.mock('../../src/generated/prisma-client', () => ({
  PrismaClient: vi.fn(() => ({
    blogPost: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  })),
}));

describe('Error Handling and Edge Cases', () => {
  let blogGenerator: BlogGenerator;
  let contentOptimization: ContentOptimizationService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    const mockModel = {} as any;
    const mockPrisma = new (vi.mocked(await import('../../src/generated/prisma-client')).PrismaClient)();
    
    blogGenerator = new BlogGenerator();
    contentOptimization = new ContentOptimizationService({
      model: mockModel,
      prisma: mockPrisma,
    });
  });

  describe('Input Validation Edge Cases', () => {
    test('should handle empty topic gracefully', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockResolvedValue({
        text: '# Default Topic\n\nDefault content.',
        finishReason: 'stop',
        usage: { promptTokens: 50, completionTokens: 100 },
      });

      const result = await blogGenerator.generateBlog({
        model: {} as any,
        topic: '',
      });

      expect(result).toBeDefined();
      expect(result.blogPost.metadata.title).toBeDefined();
    });

    test('should handle extremely long topics', async () => {
      const longTopic = 'A'.repeat(1000);
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockResolvedValue({
        text: '# Long Topic Test\n\nContent for long topic.',
        finishReason: 'stop',
        usage: { promptTokens: 200, completionTokens: 150 },
      });

      const result = await blogGenerator.generateBlog({
        model: {} as any,
        topic: longTopic,
      });

      expect(result).toBeDefined();
      expect(result.blogPost.metadata.title).toBeDefined();
    });

    test('should handle special characters in topics', async () => {
      const specialTopic = 'Topic with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockResolvedValue({
        text: '# Special Characters Test\n\nContent with special characters.',
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 100 },
      });

      const result = await blogGenerator.generateBlog({
        model: {} as any,
        topic: specialTopic,
      });

      expect(result).toBeDefined();
      expect(result.blogPost.metadata.title).toBeDefined();
    });

    test('should handle unicode characters', async () => {
      const unicodeTopic = 'Topic with unicode: 🚀🌟🎉中文日本語한국어';
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockResolvedValue({
        text: '# Unicode Test\n\nContent with unicode characters.',
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 100 },
      });

      const result = await blogGenerator.generateBlog({
        model: {} as any,
        topic: unicodeTopic,
      });

      expect(result).toBeDefined();
      expect(result.blogPost.metadata.title).toBeDefined();
    });
  });

  describe('AI Service Error Handling', () => {
    test('should handle AI service timeout', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockRejectedValue(new Error('Request timeout'));

      await expect(
        blogGenerator.generateBlog({
          model: {} as any,
          topic: 'Timeout Test',
        })
      ).rejects.toThrow('Request timeout');
    });

    test('should handle AI service rate limiting', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(
        blogGenerator.generateBlog({
          model: {} as any,
          topic: 'Rate Limit Test',
        })
      ).rejects.toThrow('Rate limit exceeded');
    });

    test('should handle AI service authentication errors', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockRejectedValue(new Error('Invalid API key'));

      await expect(
        blogGenerator.generateBlog({
          model: {} as any,
          topic: 'Auth Test',
        })
      ).rejects.toThrow('Invalid API key');
    });

    test('should handle AI service quota exceeded', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockRejectedValue(new Error('Quota exceeded'));

      await expect(
        blogGenerator.generateBlog({
          model: {} as any,
          topic: 'Quota Test',
        })
      ).rejects.toThrow('Quota exceeded');
    });
  });

  describe('Database Error Handling', () => {
    test('should handle database connection failures', async () => {
      const mockPrisma = vi.mocked(await import('../../src/generated/prisma-client')).PrismaClient;
      mockPrisma.prototype.blogPost.create.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        blogGenerator.generateBlog({
          model: {} as any,
          topic: 'Database Test',
        })
      ).rejects.toThrow('Database connection failed');
    });

    test('should handle database constraint violations', async () => {
      const mockPrisma = vi.mocked(await import('../../src/generated/prisma-client')).PrismaClient;
      mockPrisma.prototype.blogPost.create.mockRejectedValue(new Error('Unique constraint violation'));

      await expect(
        blogGenerator.generateBlog({
          model: {} as any,
          topic: 'Constraint Test',
        })
      ).rejects.toThrow('Unique constraint violation');
    });

    test('should handle database deadlocks', async () => {
      const mockPrisma = vi.mocked(await import('../../src/generated/prisma-client')).PrismaClient;
      mockPrisma.prototype.blogPost.create.mockRejectedValue(new Error('Deadlock detected'));

      await expect(
        blogGenerator.generateBlog({
          model: {} as any,
          topic: 'Deadlock Test',
        })
      ).rejects.toThrow('Deadlock detected');
    });
  });

  describe('Content Validation Edge Cases', () => {
    test('should handle blog post with missing required fields', () => {
      const invalidBlogPost: BlogPost = {
        metadata: {
          id: 'invalid-123',
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

    test('should handle blog post with extremely long content', () => {
      const longContentBlogPost: BlogPost = {
        metadata: {
          id: 'long-content-123',
          title: 'Long Content Test',
          slug: 'long-content-test',
          createdAt: new Date(),
          updatedAt: new Date(),
          seo: {
            wordCount: 50000, // Extremely long
          },
          settings: {},
        },
        content: {
          content: '# Long Content\n\n' + 'A'.repeat(100000), // Very long content
        },
        status: 'draft',
      };

      const validation = validateBlogPost(longContentBlogPost);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should handle blog post with malicious content', () => {
      const maliciousBlogPost: BlogPost = {
        metadata: {
          id: 'malicious-123',
          title: 'Malicious Content Test',
          slug: 'malicious-content-test',
          createdAt: new Date(),
          updatedAt: new Date(),
          seo: {
            wordCount: 1000,
          },
          settings: {},
        },
        content: {
          content: '<script>alert("XSS")</script>Malicious content with script tags',
        },
        status: 'draft',
      };

      const validation = validateBlogPost(maliciousBlogPost);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.type === 'content_issue')).toBe(true);
    });

    test('should handle blog post with invalid URLs', () => {
      const invalidUrlBlogPost: BlogPost = {
        metadata: {
          id: 'invalid-url-123',
          title: 'Invalid URL Test',
          slug: 'invalid-url-test',
          createdAt: new Date(),
          updatedAt: new Date(),
          seo: {
            wordCount: 1000,
          },
          settings: {},
        },
        content: {
          content: 'Content with invalid URL: not-a-valid-url',
          featuredImage: {
            url: 'not-a-valid-url',
            alt: 'Invalid URL',
          },
        },
        status: 'draft',
      };

      const validation = validateBlogPost(invalidUrlBlogPost);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.type === 'invalid_format')).toBe(true);
    });
  });

  describe('Optimization Service Edge Cases', () => {
    test('should handle optimization with empty content', async () => {
      const mockPrisma = vi.mocked(await import('../../src/generated/prisma-client')).PrismaClient;
      mockPrisma.prototype.blogPost.findUnique.mockResolvedValue({
        id: 'empty-content-123',
        content: '', // Empty content
      } as any);

      const result = await contentOptimization.optimizeContent({
        blogPostId: 'empty-content-123',
        categories: ['seo'],
        priority: 'high',
        maxRecommendations: 5,
      });

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      // Should handle empty content gracefully
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    test('should handle optimization with invalid blog post ID', async () => {
      const mockPrisma = vi.mocked(await import('../../src/generated/prisma-client')).PrismaClient;
      mockPrisma.prototype.blogPost.findUnique.mockResolvedValue(null);

      await expect(
        contentOptimization.optimizeContent({
          blogPostId: 'non-existent-123',
          categories: ['seo'],
          priority: 'high',
          maxRecommendations: 5,
        })
      ).rejects.toThrow();
    });

    test('should handle optimization with invalid categories', async () => {
      const mockPrisma = vi.mocked(await import('../../src/generated/prisma-client')).PrismaClient;
      mockPrisma.prototype.blogPost.findUnique.mockResolvedValue({
        id: 'invalid-categories-123',
        content: 'Test content',
      } as any);

      const result = await contentOptimization.optimizeContent({
        blogPostId: 'invalid-categories-123',
        categories: ['invalid-category' as any],
        priority: 'high',
        maxRecommendations: 5,
      });

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });
  });

  describe('Memory and Resource Edge Cases', () => {
    test('should handle memory pressure gracefully', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockResolvedValue({
        text: '# Memory Pressure Test\n\nContent for memory pressure testing.',
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 200 },
      });

      // Simulate memory pressure by creating large objects
      const largeObjects = [];
      for (let i = 0; i < 1000; i++) {
        largeObjects.push({ data: 'A'.repeat(1000) });
      }

      const result = await blogGenerator.generateBlog({
        model: {} as any,
        topic: 'Memory Pressure Test',
      });

      expect(result).toBeDefined();
      
      // Clean up
      largeObjects.length = 0;
    });

    test('should handle concurrent requests under load', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockResolvedValue({
        text: '# Concurrent Load Test\n\nContent for concurrent testing.',
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 200 },
      });

      const startTime = Date.now();
      
      // Create many concurrent requests
      const promises = Array.from({ length: 20 }, (_, i) =>
        blogGenerator.generateBlog({
          model: {} as any,
          topic: `Concurrent Test ${i}`,
        })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(20);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.blogPost).toBeDefined();
      });
    });
  });

  describe('Network and External Service Edge Cases', () => {
    test('should handle network timeouts', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockRejectedValue(new Error('Network timeout'));

      await expect(
        blogGenerator.generateBlog({
          model: {} as any,
          topic: 'Network Timeout Test',
        })
      ).rejects.toThrow('Network timeout');
    });

    test('should handle external service unavailability', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockRejectedValue(new Error('Service unavailable'));

      await expect(
        blogGenerator.generateBlog({
          model: {} as any,
          topic: 'Service Unavailable Test',
        })
      ).rejects.toThrow('Service unavailable');
    });

    test('should handle malformed responses from external services', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockResolvedValue({
        text: null, // Malformed response
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 200 },
      });

      await expect(
        blogGenerator.generateBlog({
          model: {} as any,
          topic: 'Malformed Response Test',
        })
      ).rejects.toThrow();
    });
  });
});
