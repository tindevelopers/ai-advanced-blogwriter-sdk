

import { PrismaClient } from '../generated/prisma-client';
import type {
  VersionBranch,
  VersionWithMetadata,
  VersionComparison,
  VersionDiff,
  CreateVersionOptions,
  MergeVersionOptions,
  VersionRollbackOptions,
  VersioningOptions,
  ContentChange,
  BlogPostStatus
} from '../types/versioning';

/**
 * Version Manager - Comprehensive content versioning system
 * Provides version control, branching, comparison, and rollback capabilities
 */
export class VersionManager {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new version of a blog post
   */
  async createVersion(
    blogPostId: string,
    versionData: {
      title: string;
      content: string;
      metaDescription?: string;
      excerpt?: string;
      status?: BlogPostStatus;
      focusKeyword?: string;
      keywords?: string[];
    },
    options: CreateVersionOptions = {}
  ): Promise<VersionWithMetadata> {
    const blogPost = await this.prisma.blogPost.findUnique({
      where: { id: blogPostId },
      include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    if (!blogPost) {
      throw new Error(`Blog post with ID ${blogPostId} not found`);
    }

    // Generate version number
    const versionCount = await this.prisma.blogPostVersion.count({
      where: { blogPostId }
    });
    const versionNumber = `v${versionCount + 1}.0`;

    // Handle branch creation/selection
    let branch: VersionBranch | null = null;
    if (options.branchName || options.createBranch) {
      const branchName = options.branchName || `version-${versionNumber}`;
      branch = await this.getOrCreateBranch(blogPostId, branchName, options.fromVersion);
    }

    // Create the version
    const version = await this.prisma.blogPostVersion.create({
      data: {
        version: versionNumber,
        blogPostId,
        branchId: branch?.id,
        title: versionData.title,
        content: versionData.content,
        metaDescription: versionData.metaDescription,
        excerpt: versionData.excerpt,
        status: versionData.status || 'DRAFT',
        changeSummary: options.changeSummary,
        focusKeyword: versionData.focusKeyword,
        keywords: versionData.keywords || [],
        keywordDensity: this.calculateKeywordDensity(
          versionData.content, 
          versionData.focusKeyword
        ),
        wordCount: this.countWords(versionData.content),
        seoScore: await this.calculateSeoScore(versionData),
        readabilityScore: this.calculateReadabilityScore(versionData.content)
      }
    });

    return version as VersionWithMetadata;
  }

  /**
   * Get all versions for a blog post
   */
  async getVersions(
    blogPostId: string,
    branchName?: string
  ): Promise<VersionWithMetadata[]> {
    const where: any = { blogPostId };
    
    if (branchName) {
      const branch = await this.prisma.versionBranch.findUnique({
        where: { 
          blogPostId_name: { blogPostId, name: branchName } 
        }
      });
      
      if (branch) {
        where.branchId = branch.id;
      }
    }

    return await this.prisma.blogPostVersion.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    }) as VersionWithMetadata[];
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    fromVersionId: string,
    toVersionId: string
  ): Promise<VersionComparison> {
    // Check if comparison already exists
    const existingComparison = await this.prisma.versionComparison.findUnique({
      where: { 
        fromVersionId_toVersionId: { fromVersionId, toVersionId } 
      }
    });

    if (existingComparison) {
      return existingComparison as VersionComparison;
    }

    const [fromVersion, toVersion] = await Promise.all([
      this.prisma.blogPostVersion.findUnique({ where: { id: fromVersionId } }),
      this.prisma.blogPostVersion.findUnique({ where: { id: toVersionId } })
    ]);

    if (!fromVersion || !toVersion) {
      throw new Error('One or both versions not found');
    }

    // Generate diff
    const diffSummary = this.generateDiff(fromVersion, toVersion);
    const wordStats = this.calculateWordChanges(fromVersion.content, toVersion.content);
    const similarity = this.calculateSimilarity(fromVersion.content, toVersion.content);

    const comparison = await this.prisma.versionComparison.create({
      data: {
        fromVersionId,
        toVersionId,
        diffSummary: JSON.stringify(diffSummary),
        changedFields: this.getChangedFields(fromVersion, toVersion),
        addedWords: wordStats.added,
        removedWords: wordStats.removed,
        modifiedWords: wordStats.modified,
        similarityScore: similarity
      }
    });

    return comparison as VersionComparison;
  }

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(
    blogPostId: string,
    targetVersionId: string,
    options: VersionRollbackOptions
  ): Promise<VersionWithMetadata> {
    const targetVersion = await this.prisma.blogPostVersion.findUnique({
      where: { id: targetVersionId }
    });

    if (!targetVersion || targetVersion.blogPostId !== blogPostId) {
      throw new Error('Target version not found or does not belong to this blog post');
    }

    let newVersion: VersionWithMetadata;

    if (options.createBranch) {
      // Create a new branch for the rollback
      const branchName = options.branchName || `rollback-${Date.now()}`;
      newVersion = await this.createVersion(
        blogPostId,
        {
          title: targetVersion.title,
          content: targetVersion.content,
          metaDescription: targetVersion.metaDescription || undefined,
          excerpt: targetVersion.excerpt || undefined,
          focusKeyword: targetVersion.focusKeyword || undefined,
          keywords: targetVersion.keywords
        },
        {
          branchName,
          createBranch: true,
          changeSummary: `Rollback to version ${targetVersion.version}`
        }
      );
    } else {
      // Create new version on main branch
      newVersion = await this.createVersion(
        blogPostId,
        {
          title: targetVersion.title,
          content: targetVersion.content,
          metaDescription: targetVersion.metaDescription || undefined,
          excerpt: targetVersion.excerpt || undefined,
          focusKeyword: targetVersion.focusKeyword || undefined,
          keywords: targetVersion.keywords
        },
        {
          changeSummary: `Rollback to version ${targetVersion.version}`
        }
      );

      // Update the main blog post if not preserving current
      if (!options.preserveCurrent) {
        await this.prisma.blogPost.update({
          where: { id: blogPostId },
          data: {
            title: targetVersion.title,
            content: targetVersion.content,
            metaDescription: targetVersion.metaDescription,
            excerpt: targetVersion.excerpt,
            focusKeyword: targetVersion.focusKeyword,
            keywords: targetVersion.keywords
          }
        });
      }
    }

    return newVersion;
  }

  /**
   * Create or get a branch
   */
  private async getOrCreateBranch(
    blogPostId: string,
    branchName: string,
    fromVersion?: string
  ): Promise<VersionBranch> {
    const existingBranch = await this.prisma.versionBranch.findUnique({
      where: { 
        blogPostId_name: { blogPostId, name: branchName } 
      }
    });

    if (existingBranch) {
      return existingBranch as VersionBranch;
    }

    return await this.prisma.versionBranch.create({
      data: {
        blogPostId,
        name: branchName,
        createdFrom: fromVersion,
        isMain: branchName === 'main',
        isActive: true
      }
    }) as VersionBranch;
  }

  /**
   * Merge branches
   */
  async mergeBranches(options: MergeVersionOptions): Promise<VersionWithMetadata> {
    const [sourceBranch, targetBranch] = await Promise.all([
      this.prisma.versionBranch.findUnique({
        where: { id: options.sourceBranch },
        include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } }
      }),
      this.prisma.versionBranch.findUnique({
        where: { id: options.targetBranch }
      })
    ]);

    if (!sourceBranch || !targetBranch) {
      throw new Error('Source or target branch not found');
    }

    const latestSourceVersion = sourceBranch.versions[0];
    if (!latestSourceVersion) {
      throw new Error('No versions found in source branch');
    }

    // Create merge version in target branch
    const mergeVersion = await this.createVersion(
      sourceBranch.blogPostId,
      {
        title: latestSourceVersion.title,
        content: latestSourceVersion.content,
        metaDescription: latestSourceVersion.metaDescription || undefined,
        excerpt: latestSourceVersion.excerpt || undefined,
        status: latestSourceVersion.status as BlogPostStatus,
        focusKeyword: latestSourceVersion.focusKeyword || undefined,
        keywords: latestSourceVersion.keywords
      },
      {
        branchName: targetBranch.name,
        changeSummary: options.message || `Merge ${sourceBranch.name} into ${targetBranch.name}`
      }
    );

    // Mark source branch as merged
    await this.prisma.versionBranch.update({
      where: { id: sourceBranch.id },
      data: {
        mergedAt: new Date(),
        mergedInto: targetBranch.id,
        isActive: false
      }
    });

    return mergeVersion;
  }

  /**
   * Generate diff between two versions
   */
  private generateDiff(fromVersion: any, toVersion: any): VersionDiff {
    const diff: VersionDiff = {};

    if (fromVersion.title !== toVersion.title) {
      diff.title = {
        type: 'modified',
        oldValue: fromVersion.title,
        newValue: toVersion.title
      };
    }

    if (fromVersion.content !== toVersion.content) {
      diff.content = this.generateContentDiff(fromVersion.content, toVersion.content);
    }

    if (fromVersion.metaDescription !== toVersion.metaDescription) {
      diff.metaDescription = {
        type: 'modified',
        oldValue: fromVersion.metaDescription,
        newValue: toVersion.metaDescription
      };
    }

    if (fromVersion.excerpt !== toVersion.excerpt) {
      diff.excerpt = {
        type: 'modified',
        oldValue: fromVersion.excerpt,
        newValue: toVersion.excerpt
      };
    }

    return diff;
  }

  /**
   * Generate content-specific diff
   */
  private generateContentDiff(oldContent: string, newContent: string): ContentChange {
    // This is a simplified diff - in production, you'd use a proper diff algorithm
    const oldWords = oldContent.split(/\s+/);
    const newWords = newContent.split(/\s+/);
    
    return {
      type: oldContent === newContent ? 'unchanged' : 'modified',
      oldValue: oldContent,
      newValue: newContent,
      length: Math.abs(newWords.length - oldWords.length)
    };
  }

  /**
   * Calculate word-level changes
   */
  private calculateWordChanges(oldContent: string, newContent: string) {
    const oldWords = oldContent.split(/\s+/);
    const newWords = newContent.split(/\s+/);
    
    // Simplified calculation - in production, use proper diff algorithm
    const added = Math.max(0, newWords.length - oldWords.length);
    const removed = Math.max(0, oldWords.length - newWords.length);
    const modified = Math.min(oldWords.length, newWords.length);
    
    return { added, removed, modified };
  }

  /**
   * Calculate similarity score between two content strings
   */
  private calculateSimilarity(content1: string, content2: string): number {
    // Simplified Jaccard similarity
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Get changed fields between versions
   */
  private getChangedFields(fromVersion: any, toVersion: any): string[] {
    const fields = ['title', 'content', 'metaDescription', 'excerpt', 'focusKeyword', 'keywords'];
    return fields.filter(field => {
      const oldValue = fromVersion[field];
      const newValue = toVersion[field];
      
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        return JSON.stringify(oldValue) !== JSON.stringify(newValue);
      }
      
      return oldValue !== newValue;
    });
  }

  /**
   * Calculate keyword density
   */
  private calculateKeywordDensity(content: string, keyword?: string): number | null {
    if (!keyword) return null;
    
    const words = content.toLowerCase().split(/\s+/);
    const keywordWords = keyword.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    
    if (totalWords === 0) return 0;
    
    let matches = 0;
    for (let i = 0; i <= words.length - keywordWords.length; i++) {
      const phrase = words.slice(i, i + keywordWords.length).join(' ');
      if (phrase === keyword.toLowerCase()) {
        matches++;
      }
    }
    
    return matches / totalWords;
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Calculate SEO score
   */
  private async calculateSeoScore(versionData: any): Promise<number | null> {
    // Simplified SEO score calculation
    let score = 0;
    let maxScore = 0;

    // Title length check
    maxScore += 20;
    if (versionData.title && versionData.title.length >= 30 && versionData.title.length <= 60) {
      score += 20;
    } else if (versionData.title && versionData.title.length > 0) {
      score += 10;
    }

    // Meta description check
    maxScore += 20;
    if (versionData.metaDescription && versionData.metaDescription.length >= 120 && versionData.metaDescription.length <= 160) {
      score += 20;
    } else if (versionData.metaDescription && versionData.metaDescription.length > 0) {
      score += 10;
    }

    // Content length check
    maxScore += 20;
    const wordCount = this.countWords(versionData.content);
    if (wordCount >= 300) {
      score += 20;
    } else if (wordCount >= 100) {
      score += 10;
    }

    // Focus keyword check
    maxScore += 20;
    if (versionData.focusKeyword) {
      const density = this.calculateKeywordDensity(versionData.content, versionData.focusKeyword);
      if (density && density > 0.005 && density < 0.03) {
        score += 20;
      } else if (density && density > 0) {
        score += 10;
      }
    }

    // Keywords check
    maxScore += 20;
    if (versionData.keywords && versionData.keywords.length > 0) {
      score += 20;
    }

    return maxScore > 0 ? (score / maxScore) * 100 : null;
  }

  /**
   * Calculate readability score (simplified Flesch-Kincaid)
   */
  private calculateReadabilityScore(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((total, word) => total + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Simplified Flesch Reading Ease formula
    return Math.max(0, 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord));
  }

  /**
   * Count syllables in a word (simplified)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = word.match(/[aeiouy]+/g);
    let syllableCount = vowels ? vowels.length : 1;
    
    if (word.endsWith('e')) {
      syllableCount--;
    }
    
    return Math.max(1, syllableCount);
  }
}

