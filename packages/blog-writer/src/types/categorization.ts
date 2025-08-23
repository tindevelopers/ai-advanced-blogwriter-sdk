

/**
 * Content Categorization & Tagging Types
 * Hierarchical categories, flexible tagging, and content relationships
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Hierarchical relationships
  parent?: Category;
  children?: Category[];
  
  // Posts in this category
  postCount?: number;
  blogPosts?: BlogPostCategory[];
}

export interface BlogPostCategory {
  id: string;
  blogPostId: string;
  categoryId: string;
  isPrimary: boolean;
  createdAt: Date;
  category: Category;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isSystem: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Auto-suggestions
  suggestedTags?: Tag[];
  relatedTags?: Tag[];
}

export interface BlogPostTag {
  id: string;
  blogPostId: string;
  tagId: string;
  createdAt: Date;
  tag: Tag;
}

export interface TagSuggestion {
  id: string;
  baseTagId: string;
  suggestedTagId: string;
  confidence: number; // 0-1
  occurrences: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentRelationship {
  id: string;
  fromPostId: string;
  toPostId: string;
  relationshipType: RelationshipType;
  strength: number; // 0-1
  isAuto: boolean;
  createdAt: Date;
  createdBy?: string;
}

export type RelationshipType = 
  | 'related'
  | 'series' 
  | 'prerequisite'
  | 'followup'
  | 'similar'
  | 'alternative'
  | 'comparison'
  | 'update';

export interface ContentSeries {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  posts: BlogPostSeries[];
}

export interface BlogPostSeries {
  id: string;
  blogPostId: string;
  seriesId: string;
  order: number;
  createdAt: Date;
  series: ContentSeries;
}

export interface CategoryHierarchy {
  category: Category;
  level: number;
  path: string[]; // Array of category names from root to current
  breadcrumb: string; // "Parent > Child > Current"
}

export interface TagCloud {
  tag: Tag;
  weight: number; // Relative weight for display
  fontSize: number; // Calculated font size
}

export interface ContentClassification {
  categories: Category[];
  tags: Tag[];
  suggestedCategories: CategorySuggestion[];
  suggestedTags: TagSuggestionResult[];
  confidence: number; // Overall classification confidence
}

export interface CategorySuggestion {
  category: Category;
  confidence: number;
  reasons: string[];
}

export interface TagSuggestionResult {
  tag: Tag;
  confidence: number;
  isExisting: boolean;
  reasons: string[];
}

export interface CreateCategoryOptions {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  order?: number;
}

export interface UpdateCategoryOptions {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateTagOptions {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
}

export interface TagAutoCompleteOptions {
  query: string;
  limit?: number;
  includeDescriptions?: boolean;
  excludeExisting?: string[]; // Exclude tags already assigned
}

export interface CategoryFilterOptions {
  parentId?: string;
  level?: number;
  isActive?: boolean;
  includePostCounts?: boolean;
  sortBy?: 'name' | 'order' | 'postCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface TagFilterOptions {
  query?: string;
  minUsageCount?: number;
  isSystem?: boolean;
  sortBy?: 'name' | 'usageCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export interface ContentSearchOptions {
  query?: string;
  categories?: string[];
  tags?: string[];
  series?: string[];
  status?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  sortBy?: 'relevance' | 'date' | 'title' | 'category';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface RelationshipAnalysis {
  post: {
    id: string;
    title: string;
  };
  relatedPosts: {
    post: {
      id: string;
      title: string;
    };
    relationship: ContentRelationship;
    score: number;
  }[];
  suggestedRelationships: {
    post: {
      id: string;
      title: string;
    };
    type: RelationshipType;
    confidence: number;
    reasons: string[];
  }[];
}

export interface CategorizationMetrics {
  totalCategories: number;
  categoriesWithPosts: number;
  averagePostsPerCategory: number;
  mostUsedCategories: Category[];
  unusedCategories: Category[];
  totalTags: number;
  averageTagsPerPost: number;
  mostUsedTags: Tag[];
  systemTagsCount: number;
}

