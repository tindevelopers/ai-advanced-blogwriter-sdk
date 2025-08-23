

import { PrismaClient } from '../generated/prisma-client';
import { VersionManager } from './version-manager';
import { WorkflowManager } from './workflow-manager';
import { MetadataManager } from './metadata-manager';
import { CategorizationManager } from './categorization-manager';
import { NotificationManager } from './notification-manager';

import type {
  // Versioning types
  VersionBranch,
  VersionWithMetadata,
  CreateVersionOptions,
  MergeVersionOptions,
  VersionRollbackOptions,
  
  // Workflow types
  ApprovalWorkflow,
  SubmitForReviewOptions,
  ApprovalDecision,
  SchedulePublishingOptions,
  WorkflowConfig,
  
  // Metadata types
  MetadataField,
  SeoMetadata,
  UpdateMetadataOptions,
  SeoAnalysisResult,
  CreateMetadataFieldOptions,
  
  // Categorization types
  Category,
  Tag,
  ContentRelationship,
  CreateCategoryOptions,
  CreateTagOptions,
  ContentSearchOptions,
  ContentClassification,
  
  // Notification types
  CreateNotificationOptions
} from '../types';

/**
 * Content Management Service - Unified interface for all content management features
 * Combines versioning, workflow, metadata, categorization, and notifications
 */
export class ContentManagementService {
  private versionManager: VersionManager;
  private workflowManager: WorkflowManager;
  private metadataManager: MetadataManager;
  private categorizationManager: CategorizationManager;
  private notificationManager: NotificationManager;

  constructor(
    private prisma: PrismaClient,
    workflowConfig: WorkflowConfig = {}
  ) {
    this.versionManager = new VersionManager(prisma);
    this.workflowManager = new WorkflowManager(prisma, workflowConfig);
    this.metadataManager = new MetadataManager(prisma);
    this.categorizationManager = new CategorizationManager(prisma);
    this.notificationManager = new NotificationManager(prisma);
  }

  // ===== UNIFIED BLOG POST OPERATIONS =====

  /**
   * Create a comprehensive blog post with all metadata
   */
  async createBlogPost(data: {
    title: string;
    content: string;
    excerpt?: string;
    metaDescription?: string;
    
    // Classification
    categories?: string[];
    tags?: string[];
    primaryCategory?: string;
    
    // SEO
    seoMetadata?: Partial<SeoMetadata>;
    customMetadata?: Record<string, any>;
    
    // Publishing
    status?: string;
    scheduledFor?: Date;
    
    // Author info
    authorId?: string;
  }): Promise<{
    blogPost: any;
    version: VersionWithMetadata;
    classification: ContentClassification;
    seoAnalysis: SeoAnalysisResult;
  }> {
    // Create the blog post
    const blogPost = await this.prisma.blogPost.create({
      data: {
        title: data.title,
        slug: this.generateSlug(data.title),
        content: data.content,
        excerpt: data.excerpt,
        metaDescription: data.metaDescription,
        status: (data.status as any) || 'DRAFT',
        authorId: data.authorId,
        wordCount: this.countWords(data.content),
        readingTime: Math.ceil(this.countWords(data.content) / 200),
        scheduledAt: data.scheduledFor
      }
    });

    // Create initial version
    const version = await this.versionManager.createVersion(
      blogPost.id,
      {
        title: data.title,
        content: data.content,
        metaDescription: data.metaDescription,
        excerpt: data.excerpt
      },
      { changeSummary: 'Initial version' }
    );

    // Handle categories
    if (data.categories) {
      for (const categoryId of data.categories) {
        await this.categorizationManager.assignCategory(
          blogPost.id,
          categoryId,
          categoryId === data.primaryCategory
        );
      }
    }

    // Handle tags
    if (data.tags) {
      for (const tagId of data.tags) {
        await this.categorizationManager.assignTag(blogPost.id, tagId);
      }
    }

    // Set metadata
    if (data.seoMetadata) {
      await this.metadataManager.updateSeoMetadata(blogPost.id, data.seoMetadata);
    }

    if (data.customMetadata) {
      await this.metadataManager.updateBlogPostMetadata(blogPost.id, {
        customFields: data.customMetadata
      });
    }

    // Auto-classify content
    const classification = await this.categorizationManager.autoClassifyContent({
      title: data.title,
      content: data.content,
      excerpt: data.excerpt
    });

    // Analyze SEO
    const seoAnalysis = await this.metadataManager.analyzeSeo(blogPost.id);

    // Create notifications for low SEO score
    if (seoAnalysis.overallScore < 60 && data.authorId) {
      await this.notificationManager.createSeoNotification(
        data.authorId,
        blogPost.id,
        'low_score',
        seoAnalysis.overallScore
      );
    }

    return {
      blogPost,
      version,
      classification,
      seoAnalysis
    };
  }

  /**
   * Update blog post with comprehensive change tracking
   */
  async updateBlogPost(
    blogPostId: string,
    data: {
      title?: string;
      content?: string;
      excerpt?: string;
      metaDescription?: string;
      seoMetadata?: Partial<SeoMetadata>;
      customMetadata?: Record<string, any>;
      categories?: string[];
      tags?: string[];
      changeSummary?: string;
    },
    userId?: string
  ): Promise<{
    blogPost: any;
    version: VersionWithMetadata;
    seoAnalysis?: SeoAnalysisResult;
  }> {
    const blogPost = await this.prisma.blogPost.findUnique({
      where: { id: blogPostId }
    });

    if (!blogPost) {
      throw new Error(`Blog post with ID ${blogPostId} not found`);
    }

    // Update blog post
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.content) {
      updateData.content = data.content;
      updateData.wordCount = this.countWords(data.content);
      updateData.readingTime = Math.ceil(this.countWords(data.content) / 200);
    }
    if (data.excerpt) updateData.excerpt = data.excerpt;
    if (data.metaDescription) updateData.metaDescription = data.metaDescription;

    const updatedBlogPost = await this.prisma.blogPost.update({
      where: { id: blogPostId },
      data: updateData
    });

    // Create new version
    const version = await this.versionManager.createVersion(
      blogPostId,
      {
        title: data.title || blogPost.title,
        content: data.content || blogPost.content,
        metaDescription: data.metaDescription || blogPost.metaDescription,
        excerpt: data.excerpt || blogPost.excerpt
      },
      { changeSummary: data.changeSummary || 'Content updated' }
    );

    // Update metadata
    let seoAnalysis: SeoAnalysisResult | undefined;
    if (data.seoMetadata || data.customMetadata) {
      await this.metadataManager.updateBlogPostMetadata(blogPostId, {
        seoMetadata: data.seoMetadata,
        customFields: data.customMetadata
      });

      // Re-analyze SEO if content changed
      if (data.content || data.title || data.seoMetadata) {
        seoAnalysis = await this.metadataManager.analyzeSeo(blogPostId);
      }
    }

    // Update categories
    if (data.categories) {
      // Remove existing categories
      await this.prisma.blogPostCategory.deleteMany({
        where: { blogPostId }
      });

      // Add new categories
      for (const categoryId of data.categories) {
        await this.categorizationManager.assignCategory(blogPostId, categoryId);
      }
    }

    // Update tags
    if (data.tags) {
      // Remove existing tags
      const existingTags = await this.prisma.blogPostTag.findMany({
        where: { blogPostId }
      });

      for (const existingTag of existingTags) {
        await this.categorizationManager.removeTag(blogPostId, existingTag.tagId);
      }

      // Add new tags
      for (const tagId of data.tags) {
        await this.categorizationManager.assignTag(blogPostId, tagId);
      }
    }

    return {
      blogPost: updatedBlogPost,
      version,
      seoAnalysis
    };
  }

  /**
   * Submit blog post for review with comprehensive workflow
   */
  async submitForReview(
    blogPostId: string,
    userId: string,
    options: SubmitForReviewOptions & {
      performSeoCheck?: boolean;
      performMetadataValidation?: boolean;
    } = {}
  ): Promise<{
    workflow: ApprovalWorkflow;
    seoAnalysis?: SeoAnalysisResult;
    validationResults?: any;
  }> {
    const result: any = {};

    // Perform SEO analysis if requested
    if (options.performSeoCheck !== false) {
      result.seoAnalysis = await this.metadataManager.analyzeSeo(blogPostId);
      
      // Create notification for low SEO score
      if (result.seoAnalysis.overallScore < 60) {
        await this.notificationManager.createSeoNotification(
          userId,
          blogPostId,
          'low_score',
          result.seoAnalysis.overallScore
        );
      }
    }

    // Perform metadata validation if requested
    if (options.performMetadataValidation !== false) {
      result.validationResults = await this.metadataManager.validateBlogPostMetadata(blogPostId);
    }

    // Submit for review
    result.workflow = await this.workflowManager.submitForReview(blogPostId, userId, options);

    return result;
  }

  /**
   * Complete blog post publishing with all integrations
   */
  async publishBlogPost(
    blogPostId: string,
    userId: string,
    options: {
      scheduleOptions?: SchedulePublishingOptions;
      createRelationships?: boolean;
      notifySubscribers?: boolean;
    } = {}
  ): Promise<void> {
    // Publish the blog post
    await this.workflowManager.publishBlogPost(
      blogPostId,
      userId,
      options.scheduleOptions
    );

    // Create automatic content relationships
    if (options.createRelationships !== false) {
      await this.createAutoRelationships(blogPostId);
    }

    // Send notifications
    if (options.notifySubscribers !== false) {
      await this.notificationManager.createWorkflowNotification(
        userId,
        blogPostId,
        options.scheduleOptions ? 'scheduled' : 'published'
      );
    }
  }

  // ===== VERSION MANAGEMENT =====

  /**
   * Get versions with metadata
   */
  async getVersions(blogPostId: string, branchName?: string): Promise<VersionWithMetadata[]> {
    return this.versionManager.getVersions(blogPostId, branchName);
  }

  /**
   * Compare versions
   */
  async compareVersions(fromVersionId: string, toVersionId: string) {
    return this.versionManager.compareVersions(fromVersionId, toVersionId);
  }

  /**
   * Rollback to version
   */
  async rollbackToVersion(
    blogPostId: string,
    targetVersionId: string,
    options: VersionRollbackOptions
  ) {
    return this.versionManager.rollbackToVersion(blogPostId, targetVersionId, options);
  }

  /**
   * Create version branch
   */
  async createBranch(blogPostId: string, branchName: string, fromVersion?: string) {
    return this.versionManager['getOrCreateBranch'](blogPostId, branchName, fromVersion);
  }

  /**
   * Merge branches
   */
  async mergeBranches(options: MergeVersionOptions) {
    return this.versionManager.mergeBranches(options);
  }

  // ===== WORKFLOW MANAGEMENT =====

  /**
   * Process approval
   */
  async processApproval(
    workflowId: string,
    stepNumber: number,
    approverId: string,
    decision: ApprovalDecision
  ) {
    return this.workflowManager.processApproval(workflowId, stepNumber, approverId, decision);
  }

  /**
   * Get workflow history
   */
  async getWorkflowHistory(blogPostId: string) {
    return this.workflowManager.getWorkflowHistory(blogPostId);
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(userId: string) {
    return this.workflowManager.getPendingApprovals(userId);
  }

  // ===== METADATA MANAGEMENT =====

  /**
   * Create metadata field
   */
  async createMetadataField(options: CreateMetadataFieldOptions) {
    return this.metadataManager.createMetadataField(options);
  }

  /**
   * Get metadata fields
   */
  async getMetadataFields(group?: string) {
    return this.metadataManager.getMetadataFields(group);
  }

  /**
   * Analyze SEO
   */
  async analyzeSeo(blogPostId: string) {
    return this.metadataManager.analyzeSeo(blogPostId);
  }

  /**
   * Update metadata
   */
  async updateMetadata(blogPostId: string, options: UpdateMetadataOptions) {
    return this.metadataManager.updateBlogPostMetadata(blogPostId, options);
  }

  // ===== CATEGORIZATION MANAGEMENT =====

  /**
   * Create category
   */
  async createCategory(options: CreateCategoryOptions) {
    return this.categorizationManager.createCategory(options);
  }

  /**
   * Create tag
   */
  async createTag(options: CreateTagOptions) {
    return this.categorizationManager.createTag(options);
  }

  /**
   * Search content
   */
  async searchContent(options: ContentSearchOptions) {
    return this.categorizationManager.searchContent(options);
  }

  /**
   * Auto-classify content
   */
  async autoClassifyContent(content: { title: string; content: string; excerpt?: string }) {
    return this.categorizationManager.autoClassifyContent(content);
  }

  /**
   * Get categorization metrics
   */
  async getCategorizationMetrics() {
    return this.categorizationManager.getCategorizationMetrics();
  }

  // ===== NOTIFICATION MANAGEMENT =====

  /**
   * Create notification
   */
  async createNotification(options: CreateNotificationOptions) {
    return this.notificationManager.createNotification(options);
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, options: any = {}) {
    return this.notificationManager.getUserNotifications(userId, options);
  }

  // ===== COMPREHENSIVE ANALYTICS =====

  /**
   * Get comprehensive content analytics
   */
  async getContentAnalytics(blogPostId?: string): Promise<{
    overview: {
      totalPosts: number;
      publishedPosts: number;
      draftPosts: number;
      scheduledPosts: number;
    };
    workflow: {
      pendingApprovals: number;
      averageApprovalTime: number;
    };
    seo: {
      averageSeoScore: number;
      postsNeedingSeoWork: number;
    };
    categorization: CategorizationMetrics;
  }> {
    const [overview, workflow, seo, categorization] = await Promise.all([
      this.getOverviewStats(),
      this.getWorkflowStats(),
      this.getSeoStats(),
      this.categorizationManager.getCategorizationMetrics()
    ]);

    return {
      overview,
      workflow,
      seo,
      categorization
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Create automatic content relationships
   */
  private async createAutoRelationships(blogPostId: string): Promise<void> {
    try {
      const analysis = await this.categorizationManager.analyzeRelationships(blogPostId);
      
      for (const suggestion of analysis.suggestedRelationships) {
        if (suggestion.confidence > 0.7) {
          await this.categorizationManager.createRelationship(
            blogPostId,
            suggestion.post.id,
            suggestion.type,
            suggestion.confidence,
            true // isAuto
          );
        }
      }
    } catch (error) {
      console.error('Failed to create auto relationships:', error);
    }
  }

  /**
   * Generate slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get overview statistics
   */
  private async getOverviewStats() {
    const [total, published, draft, scheduled] = await Promise.all([
      this.prisma.blogPost.count(),
      this.prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.blogPost.count({ where: { status: 'DRAFT' } }),
      this.prisma.blogPost.count({ where: { status: 'SCHEDULED' } })
    ]);

    return {
      totalPosts: total,
      publishedPosts: published,
      draftPosts: draft,
      scheduledPosts: scheduled
    };
  }

  /**
   * Get workflow statistics
   */
  private async getWorkflowStats() {
    const pendingApprovals = await this.prisma.approvalWorkflow.count({
      where: { isComplete: false }
    });

    return {
      pendingApprovals,
      averageApprovalTime: 0 // Would calculate from workflow history
    };
  }

  /**
   * Get SEO statistics
   */
  private async getSeoStats() {
    const recentAnalyses = await this.prisma.sEOAnalysis.findMany({
      orderBy: { analyzedAt: 'desc' },
      take: 100
    });

    const averageScore = recentAnalyses.length > 0
      ? recentAnalyses.reduce((sum, analysis) => sum + analysis.score, 0) / recentAnalyses.length
      : 0;

    const postsNeedingSeoWork = recentAnalyses.filter(analysis => analysis.score < 70).length;

    return {
      averageSeoScore: averageScore,
      postsNeedingSeoWork
    };
  }
}

