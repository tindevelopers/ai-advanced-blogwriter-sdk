import { vi } from 'vitest';

// Global test setup
beforeAll(() => {
  // Set up global mocks
  vi.mock(
    '@ai-sdk/provider',
    () => ({
      LanguageModelV2: vi.fn(),
    }),
    { virtual: true },
  );

  vi.mock(
    '../../src/generated/prisma-client',
    () => ({
      PrismaClient: vi.fn(() => ({
        blogPost: {
          create: vi.fn(),
          findUnique: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        },
        editorialCalendar: {
          create: vi.fn(),
          findUnique: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        },
        optimizationSuggestion: {
          create: vi.fn(),
          findMany: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        },
        contentMetrics: {
          create: vi.fn(),
          findUnique: vi.fn(),
          update: vi.fn(),
        },
      })),
    }),
    { virtual: true },
  );

  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

// Global test utilities
export const createMockBlogPost = (overrides = {}) => ({
  id: 'test-123',
  title: 'Test Blog Post',
  slug: 'test-blog-post',
  content: 'Test content for blog post',
  status: 'draft',
  metadata: {
    seo: {
      seoScore: 75,
      wordCount: 1000,
      readabilityScore: 80,
    },
    quality: {
      qualityScore: 85,
    },
  },
  ...overrides,
});

export const createMockOptimizationRequest = (overrides = {}) => ({
  blogPostId: 'test-123',
  categories: ['seo', 'readability'],
  priority: 'high' as const,
  maxRecommendations: 10,
  ...overrides,
});

export const createMockValidationResult = (overrides = {}) => ({
  isValid: true,
  errors: [],
  warnings: [],
  suggestions: [],
  qualityScore: 85,
  ...overrides,
});
