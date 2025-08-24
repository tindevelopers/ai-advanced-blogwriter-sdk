import { prisma } from './prisma';
import type { BlogPost, BlogPostVersion } from '../types';
import type {
  BlogPost as PrismaBlogPost,
  BlogPostStatus,
  ContentType,
  ToneType,
  Prisma,
} from '../generated/prisma-client';

/**
 * Blog post repository for database operations
 */
export class BlogPostRepository {
  /**
   * Create a new blog post
   */
  async create(
    data: Omit<BlogPost, 'versions' | 'analytics' | 'suggestions'>,
  ): Promise<PrismaBlogPost> {
    const createData: Prisma.BlogPostCreateInput = {
      title: data.metadata.title,
      slug: data.metadata.slug,
      metaDescription: data.metadata.metaDescription,
      excerpt: data.content.excerpt,
      content: data.content.content,
      status: this.mapStatusToPrisma(data.status),
      contentType: this.mapContentTypeToPrisma(
        data.metadata.settings?.template,
      ),

      // Author info
      authorName: data.metadata.author?.name,
      authorEmail: data.metadata.author?.email,
      authorBio: data.metadata.author?.bio,

      // Content classification
      category: data.metadata.category,
      tags: {
        create: (data.metadata.tags || []).map(tag => ({
          tag: {
            connectOrCreate: {
              where: { name: tag },
              create: { name: tag, slug: tag.toLowerCase().replace(/\s+/g, '-') }
            }
          }
        })),
      },

      // SEO data
      focusKeyword: data.metadata.seo?.focusKeyword,
      keywords: data.metadata.seo?.keywords || [],
      keywordDensity: data.metadata.seo?.keywordDensity,
      seoScore: data.metadata.seo?.seoScore,
      readabilityScore: data.metadata.seo?.readabilityScore,
      wordCount: data.metadata.seo?.wordCount || 0,
      readingTime: data.metadata.settings?.readingTime,

      // Social media
      ogTitle: data.metadata.social?.ogTitle,
      ogDescription: data.metadata.social?.ogDescription,
      ogImage: data.metadata.social?.ogImage,
      twitterCard: data.metadata.social?.twitterCard,
      twitterImage: data.metadata.social?.twitterImage,

      // Settings
      allowComments: data.metadata.settings?.allowComments ?? true,
      featured: data.metadata.settings?.featured ?? false,
      language: data.metadata.settings?.language || 'en',
      template: data.metadata.settings?.template,

      // Featured image
      featuredImageUrl: data.content.featuredImage?.url,
      featuredImageAlt: data.content.featuredImage?.alt,
      featuredImageCaption: data.content.featuredImage?.caption,
      featuredImageCredit: data.content.featuredImage?.credit,

      // Publishing dates
      publishedAt: data.metadata.publishedAt,
      scheduledAt: data.metadata.scheduledAt,
    };

    const blogPost = await prisma.blogPost.create({
      data: createData,
      include: {
        versions: true,
        media: true,
        ctas: true,
        tocEntries: true,
        suggestions: true,
        searchRankings: true,
        seoAnalyses: true,
      },
    });

    // Create initial version
    await this.createVersion(blogPost.id, {
      version: '1.0.0',
      metadata: data.metadata,
      content: data.content,
      createdAt: new Date(),
      changeSummary: 'Initial version',
      status: data.status,
    });

    // Create table of contents if provided
    if (data.content.tableOfContents) {
      await this.updateTableOfContents(
        blogPost.id,
        data.content.tableOfContents,
      );
    }

    // Create media entries if provided
    if (data.content.media) {
      await this.updateMedia(blogPost.id, data.content.media);
    }

    // Create CTAs if provided
    if (data.content.cta) {
      await this.updateCTAs(blogPost.id, data.content.cta);
    }

    return blogPost;
  }

  /**
   * Find blog post by ID
   */
  async findById(id: string): Promise<PrismaBlogPost | null> {
    return prisma.blogPost.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { createdAt: 'desc' } },
        media: true,
        ctas: true,
        tocEntries: { orderBy: { order: 'asc' } },
        suggestions: { where: { resolved: false } },
        searchRankings: { orderBy: { checkedAt: 'desc' } },
        seoAnalyses: { orderBy: { analyzedAt: 'desc' }, take: 1 },
      },
    });
  }

  /**
   * Find blog post by slug
   */
  async findBySlug(slug: string): Promise<PrismaBlogPost | null> {
    return prisma.blogPost.findUnique({
      where: { slug },
      include: {
        versions: { orderBy: { createdAt: 'desc' } },
        media: true,
        ctas: true,
        tocEntries: { orderBy: { order: 'asc' } },
        suggestions: { where: { resolved: false } },
        searchRankings: { orderBy: { checkedAt: 'desc' } },
        seoAnalyses: { orderBy: { analyzedAt: 'desc' }, take: 1 },
      },
    });
  }

  /**
   * Update blog post
   */
  async update(id: string, data: Partial<BlogPost>): Promise<PrismaBlogPost> {
    const updateData: Prisma.BlogPostUpdateInput = {};

    if (data.metadata) {
      if (data.metadata.title) updateData.title = data.metadata.title;
      if (data.metadata.slug) updateData.slug = data.metadata.slug;
      if (data.metadata.metaDescription)
        updateData.metaDescription = data.metadata.metaDescription;
      if (data.metadata.category) updateData.category = data.metadata.category;
      if (data.metadata.tags) {
        // Delete existing tags and create new ones
        await prisma.blogPostTag.deleteMany({
          where: { blogPostId: id },
        });
        updateData.tags = {
          create: data.metadata.tags.map(tag => ({
            tag: {
              connectOrCreate: {
                where: { name: tag },
                create: { name: tag, slug: tag.toLowerCase().replace(/\s+/g, '-') }
              }
            }
          })),
        };
      }

      // Update SEO data
      if (data.metadata.seo) {
        if (data.metadata.seo.focusKeyword)
          updateData.focusKeyword = data.metadata.seo.focusKeyword;
        if (data.metadata.seo.keywords)
          updateData.keywords = data.metadata.seo.keywords;
        if (data.metadata.seo.keywordDensity)
          updateData.keywordDensity = data.metadata.seo.keywordDensity;
        if (data.metadata.seo.seoScore)
          updateData.seoScore = data.metadata.seo.seoScore;
        if (data.metadata.seo.readabilityScore)
          updateData.readabilityScore = data.metadata.seo.readabilityScore;
        if (data.metadata.seo.wordCount)
          updateData.wordCount = data.metadata.seo.wordCount;
      }

      // Update social media data
      if (data.metadata.social) {
        if (data.metadata.social.ogTitle)
          updateData.ogTitle = data.metadata.social.ogTitle;
        if (data.metadata.social.ogDescription)
          updateData.ogDescription = data.metadata.social.ogDescription;
        if (data.metadata.social.ogImage)
          updateData.ogImage = data.metadata.social.ogImage;
        if (data.metadata.social.twitterCard)
          updateData.twitterCard = data.metadata.social.twitterCard;
        if (data.metadata.social.twitterImage)
          updateData.twitterImage = data.metadata.social.twitterImage;
      }
    }

    if (data.content) {
      if (data.content.content) updateData.content = data.content.content;
      if (data.content.excerpt) updateData.excerpt = data.content.excerpt;

      // Update featured image
      if (data.content.featuredImage) {
        updateData.featuredImageUrl = data.content.featuredImage.url;
        updateData.featuredImageAlt = data.content.featuredImage.alt;
        updateData.featuredImageCaption = data.content.featuredImage.caption;
        updateData.featuredImageCredit = data.content.featuredImage.credit;
      }
    }

    if (data.status) {
      updateData.status = this.mapStatusToPrisma(data.status);
    }

    updateData.updatedAt = new Date();

    return prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        versions: { orderBy: { createdAt: 'desc' } },
        media: true,
        ctas: true,
        tocEntries: { orderBy: { order: 'asc' } },
        suggestions: { where: { resolved: false } },
        searchRankings: { orderBy: { checkedAt: 'desc' } },
        seoAnalyses: { orderBy: { analyzedAt: 'desc' }, take: 1 },
      },
    });
  }

  /**
   * Delete blog post
   */
  async delete(id: string): Promise<void> {
    await prisma.blogPost.delete({
      where: { id },
    });
  }

  /**
   * List blog posts with filtering and pagination
   */
  async list(
    options: {
      status?: BlogPostStatus[];
      contentType?: ContentType;
      category?: string;
      tags?: string[];
      search?: string;
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title';
      orderDirection?: 'asc' | 'desc';
    } = {},
  ): Promise<{ posts: PrismaBlogPost[]; total: number }> {
    const where: Prisma.BlogPostWhereInput = {};

    if (options.status?.length) {
      where.status = { in: options.status };
    }

    if (options.contentType) {
      where.contentType = options.contentType;
    }

    if (options.category) {
      where.category = options.category;
    }

    if (options.tags?.length) {
      where.tags = {
        some: {
          tag: {
            name: { in: options.tags }
          }
        }
      };
    }

    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { content: { contains: options.search, mode: 'insensitive' } },
        { metaDescription: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.BlogPostOrderByWithRelationInput = {};
    const orderField = options.orderBy || 'createdAt';
    const orderDirection = options.orderDirection || 'desc';
    orderBy[orderField] = orderDirection;

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy,
        take: options.limit || 10,
        skip: options.offset || 0,
        include: {
          versions: { orderBy: { createdAt: 'desc' }, take: 1 },
          media: true,
          ctas: true,
          tocEntries: { orderBy: { order: 'asc' } },
          suggestions: { where: { resolved: false } },
          searchRankings: { orderBy: { checkedAt: 'desc' }, take: 3 },
          seoAnalyses: { orderBy: { analyzedAt: 'desc' }, take: 1 },
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    return { posts, total };
  }

  /**
   * Create a new version of a blog post
   */
  async createVersion(
    blogPostId: string,
    versionData: BlogPostVersion,
  ): Promise<void> {
    await prisma.blogPostVersion.create({
      data: {
        version: versionData.version,
        blogPostId,
        title: versionData.metadata.title,
        content: versionData.content.content,
        metaDescription: versionData.metadata.metaDescription,
        excerpt: versionData.content.excerpt,
        status: this.mapStatusToPrisma(versionData.status),
        createdBy: versionData.createdBy,
        changeSummary: versionData.changeSummary,
        focusKeyword: versionData.metadata.seo?.focusKeyword,
        keywords: versionData.metadata.seo?.keywords || [],
        keywordDensity: versionData.metadata.seo?.keywordDensity,
        seoScore: versionData.metadata.seo?.seoScore,
        readabilityScore: versionData.metadata.seo?.readabilityScore,
        wordCount: versionData.metadata.seo?.wordCount || 0,
      },
    });
  }

  /**
   * Update table of contents
   */
  async updateTableOfContents(
    blogPostId: string,
    tocEntries: { title: string; anchor: string; level: number }[],
  ): Promise<void> {
    // Delete existing entries
    await prisma.tableOfContentsEntry.deleteMany({
      where: { blogPostId },
    });

    // Create new entries
    await prisma.tableOfContentsEntry.createMany({
      data: tocEntries.map((entry, index) => ({
        blogPostId,
        title: entry.title,
        anchor: entry.anchor,
        level: entry.level,
        order: index + 1,
      })),
    });
  }

  /**
   * Update media entries
   */
  async updateMedia(
    blogPostId: string,
    media: {
      type: string;
      url: string;
      alt?: string;
      caption?: string;
      position?: string;
    }[],
  ): Promise<void> {
    // Delete existing entries
    await prisma.blogPostMedia.deleteMany({
      where: { blogPostId },
    });

    // Create new entries
    await prisma.blogPostMedia.createMany({
      data: media.map(item => ({
        blogPostId,
        type: item.type,
        url: item.url,
        alt: item.alt,
        caption: item.caption,
        position: item.position,
      })),
    });
  }

  /**
   * Update call-to-action entries
   */
  async updateCTAs(
    blogPostId: string,
    ctas: { text: string; url: string; type: string; position: string }[],
  ): Promise<void> {
    // Delete existing entries
    await prisma.blogPostCTA.deleteMany({
      where: { blogPostId },
    });

    // Create new entries
    await prisma.blogPostCTA.createMany({
      data: ctas.map(cta => ({
        blogPostId,
        text: cta.text,
        url: cta.url,
        type: cta.type,
        position: cta.position,
      })),
    });
  }

  /**
   * Add suggestion to blog post
   */
  async addSuggestion(
    blogPostId: string,
    type: 'seo' | 'quality' | 'readability' | 'engagement',
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
  ): Promise<void> {
    await prisma.blogPostSuggestion.create({
      data: {
        blogPostId,
        type,
        message,
        priority,
      },
    });
  }

  /**
   * Resolve suggestion
   */
  async resolveSuggestion(suggestionId: string): Promise<void> {
    await prisma.blogPostSuggestion.update({
      where: { id: suggestionId },
      data: { resolved: true },
    });
  }

  /**
   * Update analytics
   */
  async updateAnalytics(
    blogPostId: string,
    analytics: {
      views?: number;
      uniqueVisitors?: number;
      shares?: number;
      comments?: number;
      avgTimeOnPage?: number;
      bounceRate?: number;
    },
  ): Promise<void> {
    await prisma.blogPost.update({
      where: { id: blogPostId },
      data: {
        views: analytics.views,
        uniqueVisitors: analytics.uniqueVisitors,
        shares: analytics.shares,
        comments: analytics.comments,
        avgTimeOnPage: analytics.avgTimeOnPage,
        bounceRate: analytics.bounceRate,
      },
    });
  }

  /**
   * Add SEO analysis
   */
  async addSEOAnalysis(
    blogPostId: string,
    analysis: {
      score: number;
      keywordOptimization?: number;
      contentStructure?: number;
      metaOptimization?: number;
      readability?: number;
      recommendations: any[];
    },
  ): Promise<void> {
    await prisma.sEOAnalysis.create({
      data: {
        blogPostId,
        score: analysis.score,
        keywordOptimization: analysis.keywordOptimization,
        contentStructure: analysis.contentStructure,
        metaOptimization: analysis.metaOptimization,
        readability: analysis.readability,
        recommendations: analysis.recommendations,
      },
    });
  }

  // Helper methods
  private mapStatusToPrisma(status: string): BlogPostStatus {
    const statusMap: Record<string, BlogPostStatus> = {
      draft: 'DRAFT',
      review: 'PENDING_REVIEW',
      published: 'PUBLISHED',
      archived: 'ARCHIVED',
      scheduled: 'SCHEDULED',
    };
    return statusMap[status] || 'DRAFT';
  }

  private mapContentTypeToPrisma(contentType: string | undefined): ContentType {
    const typeMap: Record<string, ContentType> = {
      blog: 'BLOG',
      article: 'ARTICLE',
      tutorial: 'TUTORIAL',
      howto: 'HOWTO',
      listicle: 'LISTICLE',
      comparison: 'COMPARISON',
      news: 'NEWS',
      review: 'REVIEW',
      guide: 'GUIDE',
      'case-study': 'CASE_STUDY',
      opinion: 'OPINION',
      interview: 'INTERVIEW',
    };
    return typeMap[contentType || 'blog'] || 'BLOG';
  }
}

// Export singleton instance
export const blogPostRepository = new BlogPostRepository();
