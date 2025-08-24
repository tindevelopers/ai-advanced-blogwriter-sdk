import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BlogGenerator } from '../../src/core/blog-generator';
import { ContentStrategyService } from '../../src/core/content-strategy-service';
import { ContentOptimizationService } from '../../src/core/content-optimization-service';
import { EditorialCalendarService } from '../../src/core/editorial-calendar-service';
import type { BlogPost, ContentStrategyConfig } from '../../src/types';

// Mock external dependencies
vi.mock('@ai-sdk/provider', () => ({
  LanguageModelV2: vi.fn(),
}));

vi.mock('../../src/generated/prisma-client', () => ({
  PrismaClient: vi.fn(() => ({
    blogPost: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    editorialCalendar: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  })),
}));

describe('Content Workflow Integration Tests', () => {
  let blogGenerator: BlogGenerator;
  let contentStrategy: ContentStrategyService;
  let contentOptimization: ContentOptimizationService;
  let editorialCalendar: EditorialCalendarService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Initialize services with mock dependencies
    const mockModel = {} as any;
    const mockPrisma = new (vi.mocked(await import('../../src/generated/prisma-client')).PrismaClient)();
    
    blogGenerator = new BlogGenerator();
    contentStrategy = new ContentStrategyService({
      model: mockModel,
      prisma: mockPrisma,
    });
    contentOptimization = new ContentOptimizationService({
      model: mockModel,
      prisma: mockPrisma,
    });
    editorialCalendar = new EditorialCalendarService({
      model: mockModel,
      prisma: mockPrisma,
    });
  });

  describe('End-to-End Blog Creation Workflow', () => {
    test('should create, optimize, and schedule a blog post', async () => {
      // Mock the entire workflow
      const mockPrisma = vi.mocked(await import('../../src/generated/prisma-client')).PrismaClient;
      const mockBlogPost = {
        id: 'test-123',
        title: 'Test Blog Post',
        content: 'Test content',
        status: 'draft',
        metadata: {
          seo: { seoScore: 75 },
          quality: { qualityScore: 80 },
        },
      };

      mockPrisma.prototype.blogPost.create.mockResolvedValue(mockBlogPost as any);
      mockPrisma.prototype.editorialCalendar.create.mockResolvedValue({
        id: 'calendar-123',
        entries: [],
      } as any);

      // Test the complete workflow
      const topic = 'AI in Modern Development';
      const keywords = ['artificial intelligence', 'development', 'automation'];
      const targetDate = new Date('2024-12-01');

      // 1. Generate blog post
      const blogPost = await blogGenerator.generateBlog({
        model: {} as any,
        topic,
        keywords,
        template: 'howto',
        wordCount: { min: 1000, max: 2000 },
      });

      expect(blogPost).toBeDefined();
      expect(blogPost.blogPost.metadata.title).toContain(topic);

      // 2. Optimize content
      const optimizationResult = await contentOptimization.optimizeContent({
        blogPostId: blogPost.blogPost.metadata.id,
        categories: ['seo', 'readability'],
        priority: 'high',
        maxRecommendations: 10,
      });

      expect(optimizationResult).toBeDefined();
      expect(optimizationResult.suggestions).toBeDefined();

      // 3. Schedule in editorial calendar
      const calendarEntry = await editorialCalendar.addEntry({
        title: blogPost.blogPost.metadata.title,
        description: blogPost.blogPost.metadata.excerpt,
        plannedDate: targetDate,
        contentType: 'BLOG',
        priority: 'high',
        estimatedHours: 4,
      });

      expect(calendarEntry).toBeDefined();
      expect(calendarEntry.plannedDate).toEqual(targetDate);
    });

    test('should handle workflow with content strategy planning', async () => {
      const mockPrisma = vi.mocked(await import('../../src/generated/prisma-client')).PrismaClient;
      
      // Mock strategy service responses
      mockPrisma.prototype.blogPost.create.mockResolvedValue({
        id: 'strategy-123',
        title: 'Strategic Blog Post',
        content: 'Strategic content',
      } as any);

      const strategyRequest = {
        niche: 'technology',
        targetKeywords: ['AI', 'machine learning'],
        competitors: ['competitor1.com', 'competitor2.com'],
        timeframe: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
        goals: {
          contentVolume: 20,
          targetAudience: ['developers', 'managers'],
          businessObjectives: ['lead generation', 'brand awareness'],
        },
      };

      const strategyResult = await contentStrategy.generateStrategy(strategyRequest);

      expect(strategyResult).toBeDefined();
      expect(strategyResult.overview).toBeDefined();
      expect(strategyResult.topics).toBeDefined();
      expect(strategyResult.calendar).toBeDefined();
    });

    test('should handle optimization workflow with multiple iterations', async () => {
      const mockPrisma = vi.mocked(await import('../../src/generated/prisma-client')).PrismaClient;
      
      mockPrisma.prototype.blogPost.create.mockResolvedValue({
        id: 'optimize-123',
        title: 'Optimizable Post',
        content: 'Content to optimize',
        metadata: {
          seo: { seoScore: 60 },
          quality: { qualityScore: 65 },
        },
      } as any);

      const blogPostId = 'optimize-123';

      // First optimization pass
      const firstOptimization = await contentOptimization.optimizeContent({
        blogPostId,
        categories: ['seo'],
        priority: 'high',
        maxRecommendations: 5,
      });

      expect(firstOptimization.suggestions.length).toBeGreaterThan(0);

      // Second optimization pass with different focus
      const secondOptimization = await contentOptimization.optimizeContent({
        blogPostId,
        categories: ['readability', 'engagement'],
        priority: 'medium',
        maxRecommendations: 3,
      });

      expect(secondOptimization.suggestions.length).toBeGreaterThan(0);

      // Verify that optimizations are cumulative
      const totalSuggestions = firstOptimization.suggestions.length + secondOptimization.suggestions.length;
      expect(totalSuggestions).toBeGreaterThan(0);
    });
  });

  describe('Error Handling in Workflows', () => {
    test('should handle database connection failures gracefully', async () => {
      const mockPrisma = vi.mocked(await import('../../src/generated/prisma-client')).PrismaClient;
      mockPrisma.prototype.blogPost.create.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        blogGenerator.generateBlog({
          model: {} as any,
          topic: 'Test Topic',
        })
      ).rejects.toThrow('Database connection failed');
    });

    test('should handle AI service failures in optimization', async () => {
      const mockPrisma = vi.mocked(await import('../../src/generated/prisma-client')).PrismaClient;
      mockPrisma.prototype.blogPost.findUnique.mockResolvedValue({
        id: 'test-123',
        content: 'Test content',
      } as any);

      // Mock AI service failure
      vi.spyOn(contentOptimization as any, 'generateOptimizationSuggestions')
        .mockRejectedValue(new Error('AI service unavailable'));

      const result = await contentOptimization.optimizeContent({
        blogPostId: 'test-123',
        categories: ['seo'],
        priority: 'high',
        maxRecommendations: 5,
      });

      // Should return empty suggestions instead of failing
      expect(result.suggestions).toEqual([]);
    });
  });

  describe('Performance in Workflows', () => {
    test('should complete full workflow within reasonable time', async () => {
      const startTime = Date.now();
      
      const mockPrisma = vi.mocked(await import('../../src/generated/prisma-client')).PrismaClient;
      mockPrisma.prototype.blogPost.create.mockResolvedValue({
        id: 'perf-123',
        title: 'Performance Test',
        content: 'Test content',
      } as any);

      // Execute full workflow
      await blogGenerator.generateBlog({
        model: {} as any,
        topic: 'Performance Test Topic',
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 5 seconds (including test overhead)
      expect(duration).toBeLessThan(5000);
    });
  });
});
