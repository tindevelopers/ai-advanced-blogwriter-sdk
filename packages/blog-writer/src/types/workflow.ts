/**
 * Workflow Management Types
 * Comprehensive draft/publish workflow with approvals and state tracking
 */

export type WorkflowAction =
  | 'CREATED'
  | 'SUBMITTED_FOR_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'UNPUBLISHED'
  | 'ARCHIVED'
  | 'SCHEDULED'
  | 'UPDATED';

export interface WorkflowHistory {
  id: string;
  blogPostId: string;
  versionId?: string;
  fromStatus?: BlogPostStatus;
  toStatus: BlogPostStatus;
  action: WorkflowAction;
  comment?: string;
  metadata?: Record<string, any>;
  performedAt: Date;
  performedBy?: string;
  assignedTo?: string;
  dueDate?: Date;
}

export interface ApprovalWorkflow {
  id: string;
  blogPostId: string;
  versionId?: string;
  approverIds: string[];
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
  isApproved: boolean;
  createdAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  steps: ApprovalStep[];
}

export interface ApprovalStep {
  id: string;
  workflowId: string;
  stepNumber: number;
  approverId: string;
  approverEmail?: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  submittedAt?: Date;
}

export interface WorkflowConfig {
  /** Require approval for publishing */
  requireApproval?: boolean;
  /** Required approvers for different content types */
  approvalMatrix?: Record<string, string[]>;
  /** Auto-assign reviewers based on category/tags */
  autoAssignment?: boolean;
  /** Workflow notifications */
  notifications?: {
    onSubmission?: boolean;
    onApproval?: boolean;
    onRejection?: boolean;
    onPublish?: boolean;
    reminderDays?: number[];
  };
  /** Deadline management */
  deadlines?: {
    reviewDays?: number;
    approvalDays?: number;
    escalationDays?: number;
  };
}

export interface WorkflowTransition {
  from: BlogPostStatus;
  to: BlogPostStatus;
  action: WorkflowAction;
  requiredPermissions?: string[];
  requiredApproval?: boolean;
  conditions?: WorkflowCondition[];
}

export interface WorkflowCondition {
  type: 'field_value' | 'user_role' | 'custom_function';
  field?: string;
  value?: any;
  operator?:
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'contains';
  customFunction?: (context: WorkflowContext) => boolean;
}

export interface WorkflowContext {
  blogPost: any;
  currentUser?: string;
  userRoles?: string[];
  metadata?: Record<string, any>;
}

export interface SubmitForReviewOptions {
  reviewers?: string[];
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  message?: string;
  attachments?: string[];
}

export interface ApprovalDecision {
  action: 'approve' | 'reject' | 'request_changes';
  comment?: string;
  assignBackTo?: string;
  metadata?: Record<string, any>;
}

export interface PublishingSchedule {
  id: string;
  blogPostId: string;
  scheduledFor: Date;
  timezone: string;
  publishedAt?: Date;
  status: 'scheduled' | 'published' | 'failed' | 'cancelled';
  autoPromote: boolean;
  promotionChannels: string[];
  notifySubscribers: boolean;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchedulePublishingOptions {
  scheduledFor: Date;
  timezone?: string;
  autoPromote?: boolean;
  promotionChannels?: string[];
  notifySubscribers?: boolean;
}

export interface WorkflowMetrics {
  averageApprovalTime: number;
  pendingReviews: number;
  overdueTasks: number;
  approvalRate: number;
  publishingSuccessRate: number;
  workflowBottlenecks: string[];
}

import type { BlogPostStatus } from './versioning';

export type { BlogPostStatus };
