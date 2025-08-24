/**
 * Content Versioning System Types
 * Provides comprehensive version control for blog posts with branching and comparison capabilities
 */

export interface VersionBranch {
  id: string;
  blogPostId: string;
  name: string; // 'main', 'feature/seo-update', 'hotfix/typos'
  description?: string;
  createdFrom?: string; // Version ID this branch was created from
  isMain: boolean;
  isActive: boolean;
  createdAt: Date;
  createdBy?: string;
  mergedAt?: Date;
  mergedBy?: string;
  mergedInto?: string; // Branch ID merged into
  versions: VersionWithMetadata[];
}

export interface VersionWithMetadata {
  id: string;
  version: string;
  blogPostId: string;
  branchId?: string;
  title: string;
  content: string;
  metaDescription?: string;
  excerpt?: string;
  status: BlogPostStatus;
  createdAt: Date;
  createdBy?: string;
  changeSummary?: string;

  // SEO snapshot
  focusKeyword?: string;
  keywords: string[];
  keywordDensity?: number;
  seoScore?: number;
  readabilityScore?: number;
  wordCount: number;
}

export interface VersionComparison {
  id: string;
  fromVersionId: string;
  toVersionId: string;
  diffSummary: VersionDiff;
  changedFields: string[];
  addedWords: number;
  removedWords: number;
  modifiedWords: number;
  similarityScore?: number; // 0-1 similarity
  comparedAt: Date;
  comparedBy?: string;
}

export interface VersionDiff {
  title?: ContentChange;
  content?: ContentChange;
  metaDescription?: ContentChange;
  excerpt?: ContentChange;
  focusKeyword?: ContentChange;
  keywords?: ArrayChange<string>;
  sections?: ContentChange[];
}

export interface ContentChange {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  oldValue?: string;
  newValue?: string;
  position?: number;
  length?: number;
}

export interface ArrayChange<T> {
  type: 'added' | 'removed' | 'modified';
  added?: T[];
  removed?: T[];
  modified?: { old: T; new: T }[];
}

export interface VersioningOptions {
  /** Enable automatic versioning on save */
  autoVersioning?: boolean;
  /** Maximum number of versions to keep */
  maxVersions?: number;
  /** Enable branch-based versioning */
  branchingEnabled?: boolean;
  /** Auto-merge feature branches */
  autoMerge?: boolean;
  /** Version comparison depth */
  comparisonDepth?: 'basic' | 'detailed' | 'comprehensive';
}

export interface CreateVersionOptions {
  branchName?: string;
  changeSummary?: string;
  createBranch?: boolean;
  fromVersion?: string;
}

export interface MergeVersionOptions {
  sourceBranch: string;
  targetBranch: string;
  strategy?: 'fast-forward' | 'merge-commit' | 'squash';
  message?: string;
  conflictResolution?: 'manual' | 'auto-theirs' | 'auto-ours';
}

export interface VersionRollbackOptions {
  targetVersion: string;
  createBranch?: boolean;
  branchName?: string;
  preserveCurrent?: boolean;
}

export type BlogPostStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'SCHEDULED'
  | 'UNPUBLISHED';
