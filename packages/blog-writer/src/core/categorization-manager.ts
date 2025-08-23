

import { PrismaClient } from '../generated/prisma-client';
import type {
  Category,
  BlogPostCategory,
  Tag,
  BlogPostTag,
  TagSuggestion,
  ContentRelationship,
  ContentSeries,
  BlogPostSeries,
  RelationshipType,
  CategoryHierarchy,
  TagCloud,
  ContentClassification,
  CategorySuggestion,
  TagSuggestionResult,
  CreateCategoryOptions,
  UpdateCategoryOptions,
  CreateTagOptions,
  TagAutoCompleteOptions,
  CategoryFilterOptions,
  TagFilterOptions,
  ContentSearchOptions,
  RelationshipAnalysis,
  CategorizationMetrics
} from '../types/categorization';

/**
 * Categorization Manager - Comprehensive content organization system
 * Handles categories, tags, content relationships, and search functionality
 */
export class CategorizationManager {
  constructor(private prisma: PrismaClient) {}

  // ===== CATEGORY MANAGEMENT =====

  /**
   * Create a new category
   */
  async createCategory(options: CreateCategoryOptions): Promise<Category> {
    const slug = options.slug || this.generateSlug(options.name);
    
    // Check for slug uniqueness
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new Error(`Category with slug "${slug}" already exists`);
    }

    const category = await this.prisma.category.create({
      data: {
        name: options.name,
        slug,
        description: options.description,
        color: options.color,
        icon: options.icon,
        parentId: options.parentId,
        order: options.order || 0
      }
    });

    return category as Category;
  }

  /**
   * Update a category
   */
  async updateCategory(id: string, options: UpdateCategoryOptions): Promise<Category> {
    const updateData: any = {};

    if (options.name) updateData.name = options.name;
    if (options.slug) updateData.slug = options.slug;
    if (options.description !== undefined) updateData.description = options.description;
    if (options.color !== undefined) updateData.color = options.color;
    if (options.icon !== undefined) updateData.icon = options.icon;
    if (options.parentId !== undefined) updateData.parentId = options.parentId;
    if (options.order !== undefined) updateData.order = options.order;
    if (options.isActive !== undefined) updateData.isActive = options.isActive;

    const category = await this.prisma.category.update({
      where: { id },
      data: updateData
    });

    return category as Category;
  }

  /**
   * Get categories with filtering options
   */
  async getCategories(options: CategoryFilterOptions = {}): Promise<Category[]> {
    const where: any = {};
    
    if (options.parentId !== undefined) {
      where.parentId = options.parentId;
    }
    
    if (options.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const include: any = {};
    if (options.includePostCounts) {
      include.blogPosts = {
        select: { id: true }
      };
    }

    const orderBy: any = {};
    if (options.sortBy) {
      if (options.sortBy === 'postCount') {
        // This would require a more complex query with aggregation
        orderBy.blogPosts = { _count: options.sortOrder || 'desc' };
      } else {
        orderBy[options.sortBy] = options.sortOrder || 'asc';
      }
    } else {
      orderBy.order = 'asc';
    }

    const categories = await this.prisma.category.findMany({
      where,
      include,
      orderBy
    });

    return categories.map(cat => ({
      ...cat,
      postCount: options.includePostCounts ? cat.blogPosts?.length : undefined
    })) as Category[];
  }

  /**
   * Get category hierarchy
   */
  async getCategoryHierarchy(categoryId?: string): Promise<CategoryHierarchy[]> {
    const categories = categoryId 
      ? await this.getSubcategories(categoryId)
      : await this.getCategories({ isActive: true });

    const hierarchy: CategoryHierarchy[] = [];

    for (const category of categories) {
      const path = await this.buildCategoryPath(category.id);
      hierarchy.push({
        category,
        level: path.length - 1,
        path: path.map(c => c.name),
        breadcrumb: path.map(c => c.name).join(' > ')
      });
    }

    return hierarchy;
  }

  /**
   * Get subcategories recursively
   */
  private async getSubcategories(parentId: string): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      where: { parentId }
    });

    const allCategories = [...categories];

    for (const category of categories) {
      const subcategories = await this.getSubcategories(category.id);
      allCategories.push(...subcategories);
    }

    return allCategories as Category[];
  }

  /**
   * Build category path from root to target
   */
  private async buildCategoryPath(categoryId: string): Promise<Category[]> {
    const path: Category[] = [];
    let currentId: string | null = categoryId;

    while (currentId) {
      const category = await this.prisma.category.findUnique({
        where: { id: currentId }
      });

      if (!category) break;

      path.unshift(category as Category);
      currentId = category.parentId;
    }

    return path;
  }

  /**
   * Assign category to blog post
   */
  async assignCategory(
    blogPostId: string,
    categoryId: string,
    isPrimary: boolean = false
  ): Promise<BlogPostCategory> {
    // If setting as primary, unset others
    if (isPrimary) {
      await this.prisma.blogPostCategory.updateMany({
        where: { blogPostId },
        data: { isPrimary: false }
      });
    }

    const assignment = await this.prisma.blogPostCategory.upsert({
      where: { 
        blogPostId_categoryId: { blogPostId, categoryId }
      },
      update: { isPrimary },
      create: { blogPostId, categoryId, isPrimary },
      include: { category: true }
    });

    return assignment as BlogPostCategory;
  }

  // ===== TAG MANAGEMENT =====

  /**
   * Create a new tag
   */
  async createTag(options: CreateTagOptions): Promise<Tag> {
    const slug = options.slug || this.generateSlug(options.name);
    
    const tag = await this.prisma.tag.upsert({
      where: { name: options.name },
      update: {
        description: options.description,
        color: options.color
      },
      create: {
        name: options.name,
        slug,
        description: options.description,
        color: options.color
      }
    });

    return tag as Tag;
  }

  /**
   * Get tags with filtering
   */
  async getTags(options: TagFilterOptions = {}): Promise<Tag[]> {
    const where: any = {};
    
    if (options.query) {
      where.OR = [
        { name: { contains: options.query, mode: 'insensitive' } },
        { description: { contains: options.query, mode: 'insensitive' } }
      ];
    }

    if (options.minUsageCount !== undefined) {
      where.usageCount = { gte: options.minUsageCount };
    }

    if (options.isSystem !== undefined) {
      where.isSystem = options.isSystem;
    }

    const orderBy: any = {};
    if (options.sortBy) {
      orderBy[options.sortBy] = options.sortOrder || 'desc';
    } else {
      orderBy.usageCount = 'desc';
    }

    return await this.prisma.tag.findMany({
      where,
      orderBy,
      take: options.limit
    }) as Tag[];
  }

  /**
   * Tag autocomplete for UI
   */
  async getTagSuggestions(options: TagAutoCompleteOptions): Promise<Tag[]> {
    const where: any = {
      name: { contains: options.query, mode: 'insensitive' }
    };

    if (options.excludeExisting && options.excludeExisting.length > 0) {
      where.id = { notIn: options.excludeExisting };
    }

    const tags = await this.prisma.tag.findMany({
      where,
      orderBy: { usageCount: 'desc' },
      take: options.limit || 10
    });

    return tags as Tag[];
  }

  /**
   * Assign tag to blog post
   */
  async assignTag(blogPostId: string, tagId: string): Promise<BlogPostTag> {
    const assignment = await this.prisma.blogPostTag.upsert({
      where: { 
        blogPostId_tagId: { blogPostId, tagId }
      },
      update: {},
      create: { blogPostId, tagId },
      include: { tag: true }
    });

    // Increment tag usage count
    await this.prisma.tag.update({
      where: { id: tagId },
      data: { usageCount: { increment: 1 } }
    });

    return assignment as BlogPostTag;
  }

  /**
   * Remove tag from blog post
   */
  async removeTag(blogPostId: string, tagId: string): Promise<void> {
    await this.prisma.blogPostTag.delete({
      where: { 
        blogPostId_tagId: { blogPostId, tagId }
      }
    });

    // Decrement tag usage count
    await this.prisma.tag.update({
      where: { id: tagId },
      data: { usageCount: { decrement: 1 } }
    });
  }

  /**
   * Generate tag cloud data
   */
  async generateTagCloud(limit: number = 50): Promise<TagCloud[]> {
    const tags = await this.prisma.tag.findMany({
      where: { usageCount: { gt: 0 } },
      orderBy: { usageCount: 'desc' },
      take: limit
    });

    if (tags.length === 0) return [];

    const maxUsage = Math.max(...tags.map(t => t.usageCount));
    const minUsage = Math.min(...tags.map(t => t.usageCount));

    return tags.map(tag => ({
      tag: tag as Tag,
      weight: (tag.usageCount - minUsage) / (maxUsage - minUsage),
      fontSize: 12 + ((tag.usageCount - minUsage) / (maxUsage - minUsage)) * 24 // 12-36px
    }));
  }

  // ===== CONTENT RELATIONSHIPS =====

  /**
   * Create content relationship
   */
  async createRelationship(
    fromPostId: string,
    toPostId: string,
    relationshipType: RelationshipType,
    strength: number = 0.5,
    isAuto: boolean = false,
    createdBy?: string
  ): Promise<ContentRelationship> {
    const relationship = await this.prisma.contentRelationship.upsert({
      where: {
        fromPostId_toPostId_relationshipType: {
          fromPostId,
          toPostId,
          relationshipType
        }
      },
      update: { strength, isAuto, createdBy },
      create: {
        fromPostId,
        toPostId,
        relationshipType,
        strength,
        isAuto,
        createdBy
      }
    });

    return relationship as ContentRelationship;
  }

  /**
   * Analyze relationships for a blog post
   */
  async analyzeRelationships(blogPostId: string): Promise<RelationshipAnalysis> {
    const blogPost = await this.prisma.blogPost.findUnique({
      where: { id: blogPostId },
      select: { id: true, title: true, content: true, tags: { include: { tag: true } } }
    });

    if (!blogPost) {
      throw new Error(`Blog post with ID ${blogPostId} not found`);
    }

    // Get existing relationships
    const existingRelationships = await this.prisma.contentRelationship.findMany({
      where: { 
        OR: [
          { fromPostId: blogPostId },
          { toPostId: blogPostId }
        ]
      },
      include: {
        fromPost: { select: { id: true, title: true } },
        toPost: { select: { id: true, title: true } }
      }
    });

    // Find suggested relationships based on tags and content similarity
    const suggestedRelationships = await this.findSuggestedRelationships(blogPost);

    const relatedPosts = existingRelationships.map(rel => ({
      post: rel.fromPostId === blogPostId ? rel.toPost : rel.fromPost,
      relationship: rel as ContentRelationship,
      score: rel.strength
    }));

    return {
      post: { id: blogPost.id, title: blogPost.title },
      relatedPosts,
      suggestedRelationships
    };
  }

  /**
   * Find suggested relationships based on content analysis
   */
  private async findSuggestedRelationships(blogPost: any): Promise<{
    post: { id: string; title: string };
    type: RelationshipType;
    confidence: number;
    reasons: string[];
  }[]> {
    const suggestions: any[] = [];

    // Find posts with similar tags
    if (blogPost.tags && blogPost.tags.length > 0) {
      const tagIds = blogPost.tags.map((pt: any) => pt.tag.id);
      
      const similarPosts = await this.prisma.blogPost.findMany({
        where: {
          id: { not: blogPost.id },
          tags: {
            some: {
              tagId: { in: tagIds }
            }
          }
        },
        include: {
          tags: { include: { tag: true } }
        },
        take: 10
      });

      for (const post of similarPosts) {
        const commonTags = post.tags.filter((pt: any) => 
          tagIds.includes(pt.tag.id)
        );
        
        const confidence = Math.min(0.9, commonTags.length / blogPost.tags.length);
        
        suggestions.push({
          post: { id: post.id, title: post.title },
          type: 'related' as RelationshipType,
          confidence,
          reasons: [`Shares ${commonTags.length} common tags`]
        });
      }
    }

    // Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  // ===== CONTENT SERIES =====

  /**
   * Create content series
   */
  async createSeries(
    name: string,
    description?: string
  ): Promise<ContentSeries> {
    const slug = this.generateSlug(name);
    
    const series = await this.prisma.contentSeries.create({
      data: { name, slug, description }
    });

    return series as ContentSeries;
  }

  /**
   * Add post to series
   */
  async addToSeries(
    blogPostId: string,
    seriesId: string,
    order?: number
  ): Promise<BlogPostSeries> {
    // Get next order if not specified
    if (order === undefined) {
      const lastPost = await this.prisma.blogPostSeries.findFirst({
        where: { seriesId },
        orderBy: { order: 'desc' }
      });
      order = (lastPost?.order || 0) + 1;
    }

    const seriesPost = await this.prisma.blogPostSeries.create({
      data: { blogPostId, seriesId, order },
      include: { series: true }
    });

    return seriesPost as BlogPostSeries;
  }

  // ===== CONTENT SEARCH =====

  /**
   * Search content with advanced filtering
   */
  async searchContent(options: ContentSearchOptions): Promise<any[]> {
    const where: any = {};
    const include: any = {
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
      series: { include: { series: true } }
    };

    // Text search
    if (options.query) {
      where.OR = [
        { title: { contains: options.query, mode: 'insensitive' } },
        { content: { contains: options.query, mode: 'insensitive' } },
        { excerpt: { contains: options.query, mode: 'insensitive' } }
      ];
    }

    // Category filter
    if (options.categories && options.categories.length > 0) {
      where.categories = {
        some: {
          categoryId: { in: options.categories }
        }
      };
    }

    // Tag filter
    if (options.tags && options.tags.length > 0) {
      where.tags = {
        some: {
          tagId: { in: options.tags }
        }
      };
    }

    // Series filter
    if (options.series && options.series.length > 0) {
      where.series = {
        some: {
          seriesId: { in: options.series }
        }
      };
    }

    // Status filter
    if (options.status && options.status.length > 0) {
      where.status = { in: options.status };
    }

    // Date range filter
    if (options.dateRange) {
      where.createdAt = {
        gte: options.dateRange.from,
        lte: options.dateRange.to
      };
    }

    // Sorting
    const orderBy: any = {};
    if (options.sortBy === 'relevance' && options.query) {
      // Would implement full-text search relevance
      orderBy.title = options.sortOrder || 'asc';
    } else if (options.sortBy) {
      orderBy[options.sortBy === 'date' ? 'createdAt' : options.sortBy] = options.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    return await this.prisma.blogPost.findMany({
      where,
      include,
      orderBy,
      take: options.limit,
      skip: options.offset
    });
  }

  // ===== AUTO-CLASSIFICATION =====

  /**
   * Auto-classify content using AI/ML
   */
  async autoClassifyContent(blogPost: {
    title: string;
    content: string;
    excerpt?: string;
  }): Promise<ContentClassification> {
    // This would integrate with your AI classification service
    // For now, returning a mock classification
    
    const categories = await this.getCategories({ isActive: true });
    const tags = await this.getTags({ limit: 20 });

    // Mock classification logic
    const suggestedCategories: CategorySuggestion[] = categories
      .slice(0, 3)
      .map(cat => ({
        category: cat,
        confidence: Math.random() * 0.8 + 0.2,
        reasons: [`Content matches ${cat.name} category patterns`]
      }));

    const suggestedTags: TagSuggestionResult[] = tags
      .slice(0, 5)
      .map(tag => ({
        tag,
        confidence: Math.random() * 0.9 + 0.1,
        isExisting: true,
        reasons: [`Tag "${tag.name}" found in content analysis`]
      }));

    return {
      categories: [],
      tags: [],
      suggestedCategories,
      suggestedTags,
      confidence: 0.7
    };
  }

  // ===== ANALYTICS =====

  /**
   * Get categorization metrics
   */
  async getCategorizationMetrics(): Promise<CategorizationMetrics> {
    const [
      totalCategories,
      categoriesWithPosts,
      totalTags,
      systemTagsCount,
      mostUsedCategories,
      mostUsedTags,
      unusedCategories
    ] = await Promise.all([
      this.prisma.category.count({ where: { isActive: true } }),
      this.prisma.category.count({
        where: {
          isActive: true,
          blogPosts: { some: {} }
        }
      }),
      this.prisma.tag.count(),
      this.prisma.tag.count({ where: { isSystem: true } }),
      this.prisma.category.findMany({
        where: { isActive: true },
        include: { _count: { select: { blogPosts: true } } },
        orderBy: { blogPosts: { _count: 'desc' } },
        take: 5
      }),
      this.prisma.tag.findMany({
        orderBy: { usageCount: 'desc' },
        take: 10
      }),
      this.prisma.category.findMany({
        where: {
          isActive: true,
          blogPosts: { none: {} }
        }
      })
    ]);

    const avgPostsPerCategory = categoriesWithPosts > 0 
      ? await this.calculateAveragePostsPerCategory() 
      : 0;

    const avgTagsPerPost = await this.calculateAverageTagsPerPost();

    return {
      totalCategories,
      categoriesWithPosts,
      averagePostsPerCategory: avgPostsPerCategory,
      mostUsedCategories: mostUsedCategories as Category[],
      unusedCategories: unusedCategories as Category[],
      totalTags,
      averageTagsPerPost,
      mostUsedTags: mostUsedTags as Tag[],
      systemTagsCount
    };
  }

  /**
   * Calculate average posts per category
   */
  private async calculateAveragePostsPerCategory(): Promise<number> {
    const result = await this.prisma.category.aggregate({
      where: {
        isActive: true,
        blogPosts: { some: {} }
      },
      _avg: {
        blogPosts: {
          _count: true
        }
      }
    });

    return result._avg.blogPosts?._count || 0;
  }

  /**
   * Calculate average tags per post
   */
  private async calculateAverageTagsPerPost(): Promise<number> {
    const result = await this.prisma.blogPost.aggregate({
      _avg: {
        tags: {
          _count: true
        }
      }
    });

    return result._avg.tags?._count || 0;
  }

  // ===== UTILITY METHODS =====

  /**
   * Generate URL-friendly slug from text
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

