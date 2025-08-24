import { PrismaClient } from '../generated/prisma-client';
import type {
  WorkflowHistory,
  ApprovalWorkflow,
  ApprovalStep,
  WorkflowAction,
  WorkflowConfig,
  WorkflowTransition,
  WorkflowContext,
  SubmitForReviewOptions,
  ApprovalDecision,
  PublishingSchedule,
  SchedulePublishingOptions,
  BlogPostStatus,
} from '../types/workflow';

/**
 * Workflow Manager - Complete draft/publish workflow system
 * Handles state management, approvals, scheduling, and notifications
 */
export class WorkflowManager {
  constructor(
    private prisma: PrismaClient,
    private config: WorkflowConfig = {},
  ) {}

  /**
   * Submit blog post for review
   */
  async submitForReview(
    blogPostId: string,
    userId: string,
    options: SubmitForReviewOptions = {},
  ): Promise<ApprovalWorkflow> {
    const blogPost = await this.prisma.blogPost.findUnique({
      where: { id: blogPostId },
      include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!blogPost) {
      throw new Error(`Blog post with ID ${blogPostId} not found`);
    }

    if (blogPost.status !== 'DRAFT') {
      throw new Error(`Blog post must be in DRAFT status to submit for review`);
    }

    // Update blog post status
    await this.prisma.blogPost.update({
      where: { id: blogPostId },
      data: { status: 'PENDING_REVIEW' },
    });

    // Create workflow history entry
    await this.createWorkflowHistory(
      blogPostId,
      blogPost.versions[0]?.id,
      'DRAFT',
      'PENDING_REVIEW',
      'SUBMITTED_FOR_REVIEW',
      options.message,
      userId,
      undefined,
      options.dueDate,
    );

    // Determine reviewers
    const reviewers =
      options.reviewers || (await this.getDefaultReviewers(blogPost));

    if (reviewers.length === 0) {
      throw new Error('No reviewers available for this content');
    }

    // Create approval workflow
    const workflow = await this.prisma.approvalWorkflow.create({
      data: {
        blogPostId,
        versionId: blogPost.versions[0]?.id,
        approverIds: reviewers,
        totalSteps: reviewers.length,
        dueDate: options.dueDate,
        approvals: {
          create: reviewers.map((reviewerId, index) => ({
            stepNumber: index + 1,
            approverId: reviewerId,
            status: 'pending',
          })),
        },
      },
      include: { approvals: true },
    });

    // Convert Prisma workflow to custom interface
    const customWorkflow: ApprovalWorkflow = {
      id: workflow.id,
      blogPostId: workflow.blogPostId,
      versionId: workflow.versionId || undefined,
      approverIds: workflow.approverIds,
      totalSteps: workflow.totalSteps,
      currentStep: workflow.currentStep,
      isComplete: workflow.isComplete,
      isApproved: workflow.isApproved,
      dueDate: workflow.dueDate,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      completedAt: workflow.completedAt,
      steps: workflow.approvals.map(approval => ({
        stepNumber: approval.stepNumber,
        approverId: approval.approverId,
        status: approval.status,
        comment: approval.comment,
        submittedAt: approval.submittedAt,
      })),
    };

    // Send notifications to reviewers
    await this.notifyReviewers(customWorkflow, 'submitted');

    return customWorkflow;
  }

  /**
   * Process approval decision
   */
  async processApproval(
    workflowId: string,
    stepNumber: number,
    approverId: string,
    decision: ApprovalDecision,
  ): Promise<ApprovalWorkflow> {
    const workflow = await this.prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        approvals: true,
        blogPost: true,
        version: true,
      },
    });

    if (!workflow) {
      throw new Error('Approval workflow not found');
    }

    const step = workflow.approvals.find(s => s.stepNumber === stepNumber);
    if (!step || step.approverId !== approverId) {
      throw new Error('Invalid approval step or approver');
    }

    if (step.status !== 'pending') {
      throw new Error('This approval step has already been processed');
    }

    // Update approval step
    await this.prisma.approvalStep.update({
      where: { id: step.id },
      data: {
        status: decision.action === 'approve' ? 'approved' : 'rejected',
        comment: decision.comment,
        submittedAt: new Date(),
      },
    });

    let newStatus: BlogPostStatus;
    let workflowAction: WorkflowAction;

    if (decision.action === 'approve') {
      // Check if this is the final approval
      const remainingSteps = workflow.approvals.filter(
        s => s.stepNumber > stepNumber && s.status === 'pending',
      );

      if (remainingSteps.length === 0) {
        // All approvals complete
        newStatus = 'APPROVED';
        workflowAction = 'APPROVED';

        await this.prisma.approvalWorkflow.update({
          where: { id: workflowId },
          data: {
            isComplete: true,
            isApproved: true,
            completedAt: new Date(),
          },
        });
      } else {
        // Move to next step
        newStatus = 'IN_REVIEW';
        workflowAction = 'APPROVED';

        await this.prisma.approvalWorkflow.update({
          where: { id: workflowId },
          data: { currentStep: stepNumber + 1 },
        });
      }
    } else {
      // Rejected
      newStatus = decision.action === 'request_changes' ? 'DRAFT' : 'REJECTED';
      workflowAction = 'REJECTED';

      await this.prisma.approvalWorkflow.update({
        where: { id: workflowId },
        data: {
          isComplete: true,
          isApproved: false,
          completedAt: new Date(),
        },
      });
    }

    // Update blog post status
    await this.prisma.blogPost.update({
      where: { id: workflow.blogPostId },
      data: { status: newStatus },
    });

    // Create workflow history
    await this.createWorkflowHistory(
      workflow.blogPostId,
      workflow.versionId,
      workflow.blogPost.status as BlogPostStatus,
      newStatus,
      workflowAction,
      decision.comment,
      approverId,
      decision.assignBackTo,
    );

    // Send notifications
    const updatedWorkflow = await this.prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
      include: { approvals: true },
    });

    // Convert Prisma workflow to custom interface
    const customWorkflow: ApprovalWorkflow = {
      id: updatedWorkflow!.id,
      blogPostId: updatedWorkflow!.blogPostId,
      versionId: updatedWorkflow!.versionId || undefined,
      approverIds: updatedWorkflow!.approverIds,
      totalSteps: updatedWorkflow!.totalSteps,
      currentStep: updatedWorkflow!.currentStep,
      isComplete: updatedWorkflow!.isComplete,
      isApproved: updatedWorkflow!.isApproved,
      dueDate: updatedWorkflow!.dueDate,
      createdAt: updatedWorkflow!.createdAt,
      updatedAt: updatedWorkflow!.updatedAt,
      completedAt: updatedWorkflow!.completedAt,
      steps: updatedWorkflow!.approvals.map(approval => ({
        stepNumber: approval.stepNumber,
        approverId: approval.approverId,
        status: approval.status,
        comment: approval.comment,
        submittedAt: approval.submittedAt,
      })),
    };

    await this.notifyWorkflowUpdate(
      customWorkflow,
      decision.action,
      approverId,
    );

    return customWorkflow;
  }

  /**
   * Publish blog post
   */
  async publishBlogPost(
    blogPostId: string,
    userId: string,
    scheduleOptions?: SchedulePublishingOptions,
  ): Promise<void> {
    const blogPost = await this.prisma.blogPost.findUnique({
      where: { id: blogPostId },
    });

    if (!blogPost) {
      throw new Error(`Blog post with ID ${blogPostId} not found`);
    }

    if (blogPost.status !== 'APPROVED') {
      throw new Error(`Blog post must be approved before publishing`);
    }

    if (scheduleOptions) {
      // Schedule for later publishing
      await this.schedulePublishing(blogPostId, scheduleOptions);

      await this.prisma.blogPost.update({
        where: { id: blogPostId },
        data: {
          status: 'SCHEDULED',
          scheduledAt: scheduleOptions.scheduledFor,
        },
      });

      await this.createWorkflowHistory(
        blogPostId,
        undefined,
        'APPROVED',
        'SCHEDULED',
        'SCHEDULED',
        `Scheduled for ${scheduleOptions.scheduledFor.toISOString()}`,
        userId,
      );
    } else {
      // Publish immediately
      await this.prisma.blogPost.update({
        where: { id: blogPostId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      await this.createWorkflowHistory(
        blogPostId,
        undefined,
        'APPROVED',
        'PUBLISHED',
        'PUBLISHED',
        'Published immediately',
        userId,
      );

      // TODO: Trigger publishing hooks (notifications, social media, etc.)
    }
  }

  /**
   * Schedule blog post publishing
   */
  async schedulePublishing(
    blogPostId: string,
    options: SchedulePublishingOptions,
  ): Promise<PublishingSchedule> {
    const schedule = await this.prisma.publishingSchedule.create({
      data: {
        blogPostId,
        scheduledFor: options.scheduledFor,
        timezone: options.timezone || 'UTC',
        autoPromote: options.autoPromote || false,
        promotionChannels: options.promotionChannels || [],
        notifySubscribers: options.notifySubscribers !== false,
      },
    });

    return schedule as PublishingSchedule;
  }

  /**
   * Process scheduled publications (to be called by cron job)
   */
  async processScheduledPublications(): Promise<void> {
    const now = new Date();

    const schedules = await this.prisma.publishingSchedule.findMany({
      where: {
        status: 'scheduled',
        scheduledFor: { lte: now },
      },
      include: { blogPost: true },
    });

    for (const schedule of schedules) {
      try {
        await this.prisma.$transaction(async tx => {
          // Update blog post status
          await tx.blogPost.update({
            where: { id: schedule.blogPostId },
            data: {
              status: 'PUBLISHED',
              publishedAt: new Date(),
            },
          });

          // Update schedule status
          await tx.publishingSchedule.update({
            where: { id: schedule.id },
            data: {
              status: 'published',
              publishedAt: new Date(),
            },
          });

          // Create workflow history
          await tx.workflowHistory.create({
            data: {
              blogPostId: schedule.blogPostId,
              fromStatus: 'SCHEDULED',
              toStatus: 'PUBLISHED',
              action: 'PUBLISHED',
              comment: 'Automatically published via schedule',
              performedAt: new Date(),
            },
          });
        });

        // TODO: Trigger post-publish actions (notifications, social media, etc.)
      } catch (error) {
        // Mark schedule as failed
        await this.prisma.publishingSchedule.update({
          where: { id: schedule.id },
          data: {
            status: 'failed',
            errorMessage:
              error instanceof Error ? error.message : 'Unknown error',
            retryCount: schedule.retryCount + 1,
          },
        });
      }
    }
  }

  /**
   * Get workflow history for a blog post
   */
  async getWorkflowHistory(blogPostId: string): Promise<WorkflowHistory[]> {
    return (await this.prisma.workflowHistory.findMany({
      where: { blogPostId },
      orderBy: { performedAt: 'desc' },
    })) as WorkflowHistory[];
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovals(userId: string): Promise<ApprovalWorkflow[]> {
    return (await this.prisma.approvalWorkflow.findMany({
      where: {
        isComplete: false,
        approvals: {
          some: {
            approverId: userId,
            status: 'pending',
          },
        },
      },
      include: {
        approvals: true,
        blogPost: true,
      },
    })) as ApprovalWorkflow[];
  }

  /**
   * Create workflow history entry
   */
  private async createWorkflowHistory(
    blogPostId: string,
    versionId: string | undefined,
    fromStatus: BlogPostStatus | undefined,
    toStatus: BlogPostStatus,
    action: WorkflowAction,
    comment?: string,
    performedBy?: string,
    assignedTo?: string,
    dueDate?: Date,
    metadata?: Record<string, any>,
  ): Promise<WorkflowHistory> {
    return (await this.prisma.workflowHistory.create({
      data: {
        blogPostId,
        versionId,
        fromStatus,
        toStatus,
        action,
        comment,
        metadata,
        performedBy,
        assignedTo,
        dueDate,
      },
    })) as WorkflowHistory;
  }

  /**
   * Get default reviewers for a blog post
   */
  private async getDefaultReviewers(blogPost: any): Promise<string[]> {
    // This would typically integrate with your user management system
    // For now, return a mock reviewer
    return ['default-reviewer-id'];
  }

  /**
   * Send notifications to reviewers
   */
  private async notifyReviewers(
    workflow: ApprovalWorkflow,
    type: 'submitted' | 'reminder',
  ): Promise<void> {
    // Implementation would depend on your notification system
    // This is a placeholder for the notification logic
    console.log(`Notifying reviewers for workflow ${workflow.id}: ${type}`);
  }

  /**
   * Notify about workflow updates
   */
  private async notifyWorkflowUpdate(
    workflow: ApprovalWorkflow,
    action: string,
    performedBy: string,
  ): Promise<void> {
    // Implementation would depend on your notification system
    console.log(`Workflow ${workflow.id} updated: ${action} by ${performedBy}`);
  }
}
