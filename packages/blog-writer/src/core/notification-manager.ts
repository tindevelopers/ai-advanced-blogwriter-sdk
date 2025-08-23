

import { PrismaClient } from '../generated/prisma-client';
import type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationPreferences,
  CreateNotificationOptions,
  NotificationTemplate,
  NotificationBatch
} from '../types/notifications';

/**
 * Notification Manager - Comprehensive notification system
 * Handles workflow notifications, preferences, and delivery
 */
export class NotificationManager {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a notification
   */
  async createNotification(options: CreateNotificationOptions): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: options.userId,
        type: options.type,
        title: options.title,
        message: options.message,
        actionUrl: options.actionUrl,
        priority: options.priority || 'medium',
        metadata: options.metadata,
        expiresAt: options.expiresAt,
        blogPostId: options.blogPostId
      },
      include: { blogPost: true }
    });

    return notification as Notification;
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      types?: NotificationType[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Notification[]> {
    const where: any = { userId };

    if (options.unreadOnly) {
      where.isRead = false;
    }

    if (options.types && options.types.length > 0) {
      where.type = { in: options.types };
    }

    // Filter out expired notifications
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } }
    ];

    return await this.prisma.notification.findMany({
      where,
      include: { blogPost: true },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: options.limit,
      skip: options.offset
    }) as Notification[];
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { 
        id: notificationId,
        userId: userId
      },
      data: { 
        isRead: true,
        readAt: new Date()
      }
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { 
        userId: userId,
        isRead: false
      },
      data: { 
        isRead: true,
        readAt: new Date()
      }
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.deleteMany({
      where: { 
        id: notificationId,
        userId: userId
      }
    });
  }

  /**
   * Get notification count for a user
   */
  async getNotificationCount(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byPriority: Record<NotificationPriority, number>;
  }> {
    const [total, unread, byType, byPriority] = await Promise.all([
      this.prisma.notification.count({
        where: { 
          userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      }),
      this.prisma.notification.count({
        where: { 
          userId,
          isRead: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      }),
      this.getNotificationsByType(userId),
      this.getNotificationsByPriority(userId)
    ]);

    return {
      total,
      unread,
      byType,
      byPriority
    };
  }

  /**
   * Create workflow notification
   */
  async createWorkflowNotification(
    userId: string,
    blogPostId: string,
    workflowType: 'submitted' | 'approved' | 'rejected' | 'published' | 'scheduled',
    metadata?: Record<string, any>
  ): Promise<Notification> {
    const blogPost = await this.prisma.blogPost.findUnique({
      where: { id: blogPostId },
      select: { title: true }
    });

    const templates = {
      submitted: {
        title: 'Content Submitted for Review',
        message: `"${blogPost?.title}" has been submitted for your review`,
        priority: 'medium' as NotificationPriority
      },
      approved: {
        title: 'Content Approved',
        message: `"${blogPost?.title}" has been approved`,
        priority: 'medium' as NotificationPriority
      },
      rejected: {
        title: 'Content Rejected',
        message: `"${blogPost?.title}" has been rejected and requires changes`,
        priority: 'high' as NotificationPriority
      },
      published: {
        title: 'Content Published',
        message: `"${blogPost?.title}" has been published successfully`,
        priority: 'low' as NotificationPriority
      },
      scheduled: {
        title: 'Content Scheduled',
        message: `"${blogPost?.title}" has been scheduled for publishing`,
        priority: 'low' as NotificationPriority
      }
    };

    const template = templates[workflowType];

    return this.createNotification({
      userId,
      type: 'workflow',
      title: template.title,
      message: template.message,
      priority: template.priority,
      blogPostId,
      metadata,
      actionUrl: `/blog/${blogPostId}`
    });
  }

  /**
   * Create approval notification
   */
  async createApprovalNotification(
    approverId: string,
    blogPostId: string,
    workflowId: string,
    dueDate?: Date
  ): Promise<Notification> {
    const blogPost = await this.prisma.blogPost.findUnique({
      where: { id: blogPostId },
      select: { title: true }
    });

    const message = dueDate 
      ? `"${blogPost?.title}" requires your approval by ${dueDate.toLocaleDateString()}`
      : `"${blogPost?.title}" requires your approval`;

    return this.createNotification({
      userId: approverId,
      type: 'approval',
      title: 'Approval Required',
      message,
      priority: 'high',
      blogPostId,
      actionUrl: `/approval/${workflowId}`,
      expiresAt: dueDate,
      metadata: { workflowId }
    });
  }

  /**
   * Create SEO notification
   */
  async createSeoNotification(
    userId: string,
    blogPostId: string,
    seoIssue: 'low_score' | 'missing_metadata' | 'keyword_issues',
    score?: number
  ): Promise<Notification> {
    const blogPost = await this.prisma.blogPost.findUnique({
      where: { id: blogPostId },
      select: { title: true }
    });

    const templates = {
      low_score: {
        title: 'SEO Score Needs Improvement',
        message: `"${blogPost?.title}" has an SEO score of ${score}%. Consider optimizing.`,
        priority: 'medium' as NotificationPriority
      },
      missing_metadata: {
        title: 'Missing SEO Metadata',
        message: `"${blogPost?.title}" is missing important SEO metadata`,
        priority: 'high' as NotificationPriority
      },
      keyword_issues: {
        title: 'Keyword Optimization Issues',
        message: `"${blogPost?.title}" has keyword density issues that need attention`,
        priority: 'medium' as NotificationPriority
      }
    };

    const template = templates[seoIssue];

    return this.createNotification({
      userId,
      type: 'seo',
      title: template.title,
      message: template.message,
      priority: template.priority,
      blogPostId,
      actionUrl: `/blog/${blogPostId}/seo`,
      metadata: { seoIssue, score }
    });
  }

  /**
   * Create deadline reminder notification
   */
  async createDeadlineReminder(
    userId: string,
    blogPostId: string,
    deadline: Date,
    reminderType: 'approaching' | 'overdue'
  ): Promise<Notification> {
    const blogPost = await this.prisma.blogPost.findUnique({
      where: { id: blogPostId },
      select: { title: true }
    });

    const isOverdue = reminderType === 'overdue';
    const message = isOverdue
      ? `"${blogPost?.title}" deadline has passed. Please take action.`
      : `"${blogPost?.title}" deadline is approaching (${deadline.toLocaleDateString()})`;

    return this.createNotification({
      userId,
      type: 'deadline',
      title: isOverdue ? 'Deadline Overdue' : 'Deadline Approaching',
      message,
      priority: isOverdue ? 'urgent' : 'high',
      blogPostId,
      actionUrl: `/blog/${blogPostId}`,
      metadata: { deadline: deadline.toISOString(), reminderType }
    });
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    userIds: string[],
    notificationData: Omit<CreateNotificationOptions, 'userId'>
  ): Promise<NotificationBatch> {
    const notifications: Notification[] = [];
    
    for (const userId of userIds) {
      try {
        const notification = await this.createNotification({
          ...notificationData,
          userId
        });
        notifications.push(notification);
      } catch (error) {
        console.error(`Failed to create notification for user ${userId}:`, error);
      }
    }

    const batch: NotificationBatch = {
      id: `batch-${Date.now()}`,
      notifications,
      status: 'sent',
      sentCount: notifications.length,
      failedCount: userIds.length - notifications.length,
      createdAt: new Date(),
      sentAt: new Date()
    };

    return batch;
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    return result.count;
  }

  /**
   * Clean up old read notifications (older than 30 days)
   */
  async cleanupOldNotifications(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.notification.deleteMany({
      where: {
        isRead: true,
        readAt: { lt: thirtyDaysAgo }
      }
    });

    return result.count;
  }

  /**
   * Get notification preferences for a user
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    // This would typically be stored in a separate user preferences system
    // For now, returning default preferences
    return {
      userId,
      emailNotifications: true,
      pushNotifications: true,
      inAppNotifications: true,
      preferences: {
        workflow: { email: true, push: true, inApp: true, priority: ['high', 'urgent'] },
        approval: { email: true, push: true, inApp: true, priority: ['high', 'urgent'] },
        comment: { email: true, push: false, inApp: true, priority: ['medium', 'high', 'urgent'] },
        schedule: { email: true, push: false, inApp: true, priority: ['medium', 'high', 'urgent'] },
        seo: { email: false, push: false, inApp: true, priority: ['high', 'urgent'] },
        system: { email: true, push: true, inApp: true, priority: ['urgent'] },
        reminder: { email: true, push: true, inApp: true, priority: ['high', 'urgent'] },
        deadline: { email: true, push: true, inApp: true, priority: ['high', 'urgent'] }
      }
    };
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    // In a real implementation, this would update user preferences in the database
    // For now, just return the current preferences
    return this.getNotificationPreferences(userId);
  }

  /**
   * Get notifications by type
   */
  private async getNotificationsByType(userId: string): Promise<Record<NotificationType, number>> {
    const types: NotificationType[] = ['workflow', 'approval', 'comment', 'schedule', 'seo', 'system', 'reminder', 'deadline'];
    const counts: Record<NotificationType, number> = {} as any;

    for (const type of types) {
      counts[type] = await this.prisma.notification.count({
        where: { 
          userId,
          type,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });
    }

    return counts;
  }

  /**
   * Get notifications by priority
   */
  private async getNotificationsByPriority(userId: string): Promise<Record<NotificationPriority, number>> {
    const priorities: NotificationPriority[] = ['low', 'medium', 'high', 'urgent'];
    const counts: Record<NotificationPriority, number> = {} as any;

    for (const priority of priorities) {
      counts[priority] = await this.prisma.notification.count({
        where: { 
          userId,
          priority,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });
    }

    return counts;
  }
}

