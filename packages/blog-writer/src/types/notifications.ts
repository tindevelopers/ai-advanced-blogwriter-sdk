

/**
 * Notification System Types
 * Comprehensive notification system for workflow events
 */

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  priority: NotificationPriority;
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  
  // Optional relationships
  blogPostId?: string;
  blogPost?: any;
}

export type NotificationType = 
  | 'workflow'
  | 'approval'
  | 'comment'
  | 'schedule'
  | 'seo'
  | 'system'
  | 'reminder'
  | 'deadline';

export type NotificationPriority = 
  | 'low'
  | 'medium' 
  | 'high'
  | 'urgent';

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  preferences: {
    workflow: NotificationChannelPreference;
    approval: NotificationChannelPreference;
    comment: NotificationChannelPreference;
    schedule: NotificationChannelPreference;
    seo: NotificationChannelPreference;
    system: NotificationChannelPreference;
    reminder: NotificationChannelPreference;
    deadline: NotificationChannelPreference;
  };
}

export interface NotificationChannelPreference {
  email: boolean;
  push: boolean;
  inApp: boolean;
  priority: NotificationPriority[];
}

export interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  blogPostId?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  titleTemplate: string;
  messageTemplate: string;
  actionUrlTemplate?: string;
  defaultPriority: NotificationPriority;
  isSystem: boolean;
  isActive: boolean;
}

export interface NotificationBatch {
  id: string;
  notifications: Notification[];
  status: 'pending' | 'sending' | 'sent' | 'failed';
  sentCount: number;
  failedCount: number;
  createdAt: Date;
  sentAt?: Date;
}

