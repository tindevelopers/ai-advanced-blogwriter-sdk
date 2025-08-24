/**
 * Example usage of the core interfaces as specified in requirements
 *
 * This file demonstrates how to use:
 * 1. BlogAIConfig interface - extends AIConfig with contentType, targetLength, seoOptimization, toneSettings
 * 2. RequiredBlogPost interface - includes id, title, content, metadata, status, versions, createdAt, updatedAt
 */

import {
  BlogAIConfig,
  RequiredBlogPost,
  PostMetadata,
  ContentVersion,
  ToneConfiguration,
  BlogPostStatus,
} from '../src/types';

/**
 * Example 1: Creating a BlogAIConfig with all required properties
 */
function createBlogConfig(): BlogAIConfig {
  // Define tone configuration
  const toneSettings: ToneConfiguration = {
    primary: 'professional',
    emotion: 'confident',
    formalityLevel: 3,
    audience: 'intermediate',
    style: {
      activeVoice: true,
      sentenceLength: 'mixed',
      personality: true,
      technicalLevel: 'moderate',
    },
  };

  // Create the blog AI configuration
  const config: BlogAIConfig = {
    contentType: 'blog',
    targetLength: 1200,
    seoOptimization: true,
    toneSettings: toneSettings,

    // Base AIConfig properties
    model: 'gpt-4',
    apiKey: 'your-api-key',
    temperature: 0.7,
    maxTokens: 2000,
  };

  return config;
}

/**
 * Example 2: Creating a BlogPost with all required properties
 */
function createBlogPost(): RequiredBlogPost {
  // Create post metadata
  const metadata: PostMetadata = {
    title: 'Advanced TypeScript Interfaces',
    description:
      'Learn how to create powerful TypeScript interfaces for better code organization',
    keywords: ['typescript', 'interfaces', 'programming'],
    author: 'Jane Developer',
    category: 'Technology',
    tags: ['typescript', 'development', 'tutorial'],
    featuredImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Typescript_logo_2020.svg/800px-Typescript_logo_2020.svg.png',
    publishDate: new Date('2024-01-15'),
  };

  // Create a content version
  const initialVersion: ContentVersion = {
    id: 'v1',
    version: '1.0.0',
    content:
      'TypeScript interfaces are powerful tools for defining the structure of objects...',
    metadata: metadata,
    createdAt: new Date('2024-01-10T10:00:00Z'),
    createdBy: 'jane@example.com',
    changeNote: 'Initial version',
  };

  // Create the blog post
  const blogPost: RequiredBlogPost = {
    id: 'post-123',
    title: 'Advanced TypeScript Interfaces',
    content:
      'TypeScript interfaces are powerful tools for defining the structure of objects in your applications. They provide type safety and improve developer experience by catching errors at compile time...',
    metadata: metadata,
    status: 'published' as BlogPostStatus,
    versions: [initialVersion],
    createdAt: new Date('2024-01-10T10:00:00Z'),
    updatedAt: new Date('2024-01-15T14:30:00Z'),
  };

  return blogPost;
}

/**
 * Example 3: Updating a blog post and adding a new version
 */
function updateBlogPost(
  originalPost: RequiredBlogPost,
  newContent: string,
  changeNote: string,
): RequiredBlogPost {
  // Create updated metadata
  const updatedMetadata: PostMetadata = {
    ...originalPost.metadata,
    title: `${originalPost.title} - Updated`,
    keywords: [...(originalPost.metadata.keywords || []), 'updated'],
  };

  // Create new version
  const newVersion: ContentVersion = {
    id: `v${originalPost.versions.length + 1}`,
    version: `1.${originalPost.versions.length}.0`,
    content: newContent,
    metadata: updatedMetadata,
    createdAt: new Date(),
    createdBy: 'editor@example.com',
    changeNote: changeNote,
  };

  // Return updated blog post
  return {
    ...originalPost,
    title: updatedMetadata.title || originalPost.title,
    content: newContent,
    metadata: updatedMetadata,
    versions: [...originalPost.versions, newVersion],
    updatedAt: new Date(),
  };
}

/**
 * Example 4: Working with different content types
 */
function createTutorialConfig(): BlogAIConfig {
  const toneSettings: ToneConfiguration = {
    primary: 'friendly',
    emotion: 'encouraging',
    formalityLevel: 2,
    audience: 'beginner',
    style: {
      activeVoice: true,
      sentenceLength: 'short',
      personality: true,
      technicalLevel: 'minimal',
    },
  };

  return {
    contentType: 'tutorial', // Different content type
    targetLength: 2000, // Longer content for tutorials
    seoOptimization: true,
    toneSettings: toneSettings,
    model: 'gpt-4',
    temperature: 0.5, // Less creative for tutorials
  };
}

/**
 * Example 5: Blog post lifecycle management
 */
class BlogPostManager {
  /**
   * Create a new blog post from a configuration
   */
  static createFromConfig(
    config: BlogAIConfig,
    title: string,
    content: string,
  ): RequiredBlogPost {
    const metadata: PostMetadata = {
      title: title,
      category: config.contentType,
      publishDate: new Date(),
    };

    const initialVersion: ContentVersion = {
      id: 'v1',
      version: '1.0.0',
      content: content,
      metadata: metadata,
      createdAt: new Date(),
      changeNote: 'Initial creation',
    };

    return {
      id: `post-${Date.now()}`,
      title: title,
      content: content,
      metadata: metadata,
      status: 'draft',
      versions: [initialVersion],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Publish a draft blog post
   */
  static publish(post: RequiredBlogPost): RequiredBlogPost {
    if (post.status !== 'draft') {
      throw new Error('Only draft posts can be published');
    }

    return {
      ...post,
      status: 'published',
      updatedAt: new Date(),
    };
  }

  /**
   * Archive a published blog post
   */
  static archive(post: RequiredBlogPost): RequiredBlogPost {
    if (post.status !== 'published') {
      throw new Error('Only published posts can be archived');
    }

    return {
      ...post,
      status: 'archived',
      updatedAt: new Date(),
    };
  }
}

// Export examples for use in tests or documentation
export {
  createBlogConfig,
  createBlogPost,
  updateBlogPost,
  createTutorialConfig,
  BlogPostManager,
};

// Example usage
console.log('=== Interface Usage Examples ===');

// Create configuration
const config = createBlogConfig();
console.log('1. BlogAIConfig created:', {
  contentType: config.contentType,
  targetLength: config.targetLength,
  seoOptimization: config.seoOptimization,
  tonePrimary: config.toneSettings.primary,
});

// Create blog post
const post = createBlogPost();
console.log('2. BlogPost created:', {
  id: post.id,
  title: post.title,
  status: post.status,
  versionsCount: post.versions.length,
  contentPreview: post.content.substring(0, 50) + '...',
});

// Update blog post
const updatedPost = updateBlogPost(
  post,
  'Updated content with more details...',
  'Added more examples',
);
console.log('3. BlogPost updated:', {
  versionsCount: updatedPost.versions.length,
  latestVersion: updatedPost.versions[updatedPost.versions.length - 1].version,
});

// Use manager
const managedPost = BlogPostManager.createFromConfig(
  config,
  'New Tutorial',
  'This is a new tutorial...',
);
const publishedPost = BlogPostManager.publish(managedPost);
console.log('4. BlogPost managed:', {
  original: managedPost.status,
  published: publishedPost.status,
});
