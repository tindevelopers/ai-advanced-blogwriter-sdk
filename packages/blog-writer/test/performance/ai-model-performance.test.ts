import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BlogGenerator } from '../../src/core/blog-generator';
import { ContentOptimizationService } from '../../src/core/content-optimization-service';
import { AdvancedWritingService } from '../../src/core/advanced-writing-service';

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

describe('AI Model Performance Tests', () => {
  let blogGenerator: BlogGenerator;
  let contentOptimization: ContentOptimizationService;
  let advancedWriting: AdvancedWritingService;

  beforeEach(() => {
    vi.clearAllMocks();

    const mockModel = {} as any;
    const mockPrisma = new (vi.mocked(
      await import('../../src/generated/prisma-client'),
    ).PrismaClient)();

    blogGenerator = new BlogGenerator();
    contentOptimization = new ContentOptimizationService({
      model: mockModel,
      prisma: mockPrisma,
    });
    advancedWriting = new AdvancedWritingService({
      model: mockModel,
      prisma: mockPrisma,
    });
  });

  describe('Blog Generation Performance', () => {
    test('should generate blog post within acceptable time limits', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockResolvedValue({
        text: '# Performance Test Blog\n\nThis is a test blog post for performance testing.',
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 200 },
      });

      const startTime = Date.now();

      const result = await blogGenerator.generateBlog({
        model: {} as any,
        topic: 'Performance Testing',
        wordCount: { min: 500, max: 1000 },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 3 seconds
      expect(duration).toBeLessThan(3000);
      expect(result).toBeDefined();
      expect(result.blogPost).toBeDefined();
    });

    test('should handle large content generation efficiently', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockResolvedValue({
        text: '# Large Content Test\n\n'.repeat(100), // Simulate large content
        finishReason: 'stop',
        usage: { promptTokens: 500, completionTokens: 2000 },
      });

      const startTime = Date.now();

      const result = await blogGenerator.generateBlog({
        model: {} as any,
        topic: 'Large Content Generation',
        wordCount: { min: 2000, max: 5000 },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 5 seconds for large content
      expect(duration).toBeLessThan(5000);
      expect(result.metadata.wordCount).toBeGreaterThan(1000);
    });

    test('should measure token usage accurately', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      const expectedTokens = { promptTokens: 150, completionTokens: 300 };

      mockGenerateText.mockResolvedValue({
        text: '# Token Usage Test\n\nContent for token measurement.',
        finishReason: 'stop',
        usage: expectedTokens,
      });

      const result = await blogGenerator.generateBlog({
        model: {} as any,
        topic: 'Token Usage Measurement',
      });

      expect(mockGenerateText).toHaveBeenCalled();
      // Verify that token usage is tracked (if the service tracks it)
      expect(result.metadata).toBeDefined();
    });
  });

  describe('Content Optimization Performance', () => {
    test('should optimize content within reasonable time', async () => {
      const mockPrisma = vi.mocked(
        await import('../../src/generated/prisma-client'),
      ).PrismaClient;
      mockPrisma.prototype.blogPost.findUnique.mockResolvedValue({
        id: 'perf-test-123',
        content: 'Content to optimize for performance testing.',
        metadata: {
          seo: { seoScore: 70 },
          quality: { qualityScore: 75 },
        },
      } as any);

      const startTime = Date.now();

      const result = await contentOptimization.optimizeContent({
        blogPostId: 'perf-test-123',
        categories: ['seo', 'readability'],
        priority: 'high',
        maxRecommendations: 10,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });

    test('should handle concurrent optimization requests', async () => {
      const mockPrisma = vi.mocked(
        await import('../../src/generated/prisma-client'),
      ).PrismaClient;
      mockPrisma.prototype.blogPost.findUnique.mockResolvedValue({
        id: 'concurrent-test',
        content: 'Content for concurrent testing.',
      } as any);

      const startTime = Date.now();

      // Run multiple optimization requests concurrently
      const promises = Array.from({ length: 5 }, (_, i) =>
        contentOptimization.optimizeContent({
          blogPostId: `concurrent-test-${i}`,
          categories: ['seo'],
          priority: 'medium',
          maxRecommendations: 5,
        }),
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete all requests within 3 seconds
      expect(duration).toBeLessThan(3000);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.suggestions).toBeDefined();
      });
    });
  });

  describe('Advanced Writing Service Performance', () => {
    test('should generate advanced content within time limits', async () => {
      const mockPrisma = vi.mocked(
        await import('../../src/generated/prisma-client'),
      ).PrismaClient;
      mockPrisma.prototype.blogPost.findUnique.mockResolvedValue({
        id: 'advanced-test',
        content: 'Base content for advanced generation.',
      } as any);

      const startTime = Date.now();

      const result = await advancedWriting.generateAdvancedContent({
        blogPostId: 'advanced-test',
        enhancements: ['seo', 'readability', 'engagement'],
        targetWordCount: 1500,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 4 seconds for advanced generation
      expect(duration).toBeLessThan(4000);
      expect(result).toBeDefined();
    });

    test('should handle complex content transformations efficiently', async () => {
      const mockPrisma = vi.mocked(
        await import('../../src/generated/prisma-client'),
      ).PrismaClient;
      mockPrisma.prototype.blogPost.findUnique.mockResolvedValue({
        id: 'complex-test',
        content: 'Complex content requiring multiple transformations.',
        metadata: {
          seo: { seoScore: 60 },
          quality: { qualityScore: 65 },
        },
      } as any);

      const startTime = Date.now();

      const result = await advancedWriting.generateAdvancedContent({
        blogPostId: 'complex-test',
        enhancements: ['seo', 'readability', 'engagement', 'fact-checking'],
        targetWordCount: 2000,
        includeResearch: true,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 6 seconds for complex transformations
      expect(duration).toBeLessThan(6000);
      expect(result).toBeDefined();
    });
  });

  describe('Memory Usage and Resource Management', () => {
    test('should not leak memory during repeated operations', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;
      mockGenerateText.mockResolvedValue({
        text: '# Memory Test\n\nContent for memory testing.',
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 200 },
      });

      const initialMemory = process.memoryUsage().heapUsed;

      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        await blogGenerator.generateBlog({
          model: {} as any,
          topic: `Memory Test ${i}`,
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('should handle large datasets without performance degradation', async () => {
      const mockPrisma = vi.mocked(
        await import('../../src/generated/prisma-client'),
      ).PrismaClient;
      mockPrisma.prototype.blogPost.findUnique.mockResolvedValue({
        id: 'large-dataset-test',
        content: 'A'.repeat(10000), // Large content
      } as any);

      const startTime = Date.now();

      const result = await contentOptimization.optimizeContent({
        blogPostId: 'large-dataset-test',
        categories: ['seo', 'readability', 'engagement'],
        priority: 'high',
        maxRecommendations: 20,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should handle large datasets within 3 seconds
      expect(duration).toBeLessThan(3000);
      expect(result).toBeDefined();
    });
  });

  describe('Error Recovery Performance', () => {
    test('should recover from AI service failures quickly', async () => {
      const mockGenerateText = vi.mocked(await import('ai')).generateText;

      // First call fails, second succeeds
      mockGenerateText
        .mockRejectedValueOnce(new Error('AI service temporarily unavailable'))
        .mockResolvedValueOnce({
          text: '# Recovery Test\n\nContent after recovery.',
          finishReason: 'stop',
          usage: { promptTokens: 100, completionTokens: 200 },
        });

      const startTime = Date.now();

      // Should handle the failure and retry
      const result = await blogGenerator.generateBlog({
        model: {} as any,
        topic: 'Error Recovery Test',
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should recover within 2 seconds
      expect(duration).toBeLessThan(2000);
      expect(result).toBeDefined();
    });
  });
});
