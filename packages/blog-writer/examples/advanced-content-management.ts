/**
 * Advanced Content Management Example
 * Demonstrates the comprehensive Week 3-4 Content Management Foundation features
 */

import { PrismaClient } from '@prisma/client';
import {
  ContentManagementService,
  VersionManager,
  WorkflowManager,
  MetadataManager,
  CategorizationManager,
  NotificationManager,
} from '@ai-sdk/blog-writer';

async function advancedContentManagementExample() {
  const prisma = new PrismaClient();

  // Initialize the comprehensive content management service
  const contentManager = new ContentManagementService(prisma, {
    requireApproval: true,
    notifications: {
      onSubmission: true,
      onApproval: true,
      onRejection: true,
      onPublish: true,
      reminderDays: [1, 3, 7],
    },
    deadlines: {
      reviewDays: 3,
      approvalDays: 2,
      escalationDays: 7,
    },
  });

  // ===== 1. COMPREHENSIVE BLOG POST CREATION =====
  console.log('=== Creating Blog Post with Full Management ===');

  // Create categories first
  const techCategory = await contentManager.createCategory({
    name: 'Technology',
    description: 'Technology-related content',
    color: '#3B82F6',
    icon: 'laptop',
  });

  const aiCategory = await contentManager.createCategory({
    name: 'Artificial Intelligence',
    description: 'AI and machine learning content',
    color: '#8B5CF6',
    icon: 'brain',
    parentId: techCategory.id,
  });

  // Create tags
  const aiTag = await contentManager.createTag({
    name: 'artificial-intelligence',
    description: 'Posts about AI technology',
    color: '#8B5CF6',
  });

  const mlTag = await contentManager.createTag({
    name: 'machine-learning',
    description: 'Posts about machine learning',
    color: '#06B6D4',
  });

  // Create custom metadata fields
  const difficultyField = await contentManager.createMetadataField({
    name: 'difficulty_level',
    displayName: 'Difficulty Level',
    fieldType: 'STRING',
    validation: {
      options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    },
    isRequired: true,
  });

  const estimatedReadTimeField = await contentManager.createMetadataField({
    name: 'estimated_read_time',
    displayName: 'Estimated Read Time (minutes)',
    fieldType: 'NUMBER',
    validation: {
      min: 1,
      max: 60,
    },
  });

  // Create comprehensive blog post
  const result = await contentManager.createBlogPost({
    title: 'The Future of AI: Transforming Industries Through Machine Learning',
    content: `
      # The Future of AI: Transforming Industries Through Machine Learning

      Artificial Intelligence (AI) is revolutionizing the way we work, live, and interact with technology. From healthcare to finance, transportation to entertainment, AI is transforming industries at an unprecedented pace.

      ## Understanding Machine Learning

      Machine learning, a subset of AI, enables systems to automatically learn and improve from experience without being explicitly programmed. This capability is driving innovations across various sectors.

      ### Key Applications

      1. **Healthcare**: AI-powered diagnostic tools are helping doctors detect diseases earlier and more accurately.
      2. **Finance**: Algorithmic trading and fraud detection systems are making financial markets more efficient and secure.
      3. **Transportation**: Autonomous vehicles are set to revolutionize how we travel.
      4. **Customer Service**: Chatbots and virtual assistants are improving customer experiences.

      ## The Road Ahead

      As we look to the future, AI will continue to evolve, bringing both opportunities and challenges. It's crucial for businesses and individuals to adapt and embrace these changes.

      The integration of AI into our daily lives is not just a technological shift—it's a fundamental transformation of how we approach problems and solutions.
    `,
    excerpt:
      'Explore how artificial intelligence and machine learning are transforming industries and shaping the future of technology.',
    categories: [aiCategory.id],
    tags: [aiTag.id, mlTag.id],
    primaryCategory: aiCategory.id,
    seoMetadata: {
      metaTitle:
        'The Future of AI: How Machine Learning is Transforming Industries',
      metaDescription:
        'Discover how AI and machine learning are revolutionizing healthcare, finance, transportation, and more. Explore the future of artificial intelligence.',
      focusKeywords: [
        'artificial intelligence',
        'machine learning',
        'AI transformation',
      ],
      secondaryKeywords: [
        'AI applications',
        'future technology',
        'industry transformation',
      ],
      ogTitle: 'The Future of AI: Transforming Industries',
      ogDescription:
        'Explore how AI and machine learning are reshaping industries worldwide.',
      twitterCard: 'summary_large_image',
    },
    customMetadata: {
      difficulty_level: 'Intermediate',
      estimated_read_time: '8',
    },
    authorId: 'author-123',
  });

  console.log('Created blog post:', result.blogPost.title);
  console.log('SEO Score:', result.seoAnalysis.overallScore);
  console.log(
    'Auto-classified suggestions:',
    result.classification.suggestedTags.length,
    'tags',
  );

  // ===== 2. VERSION MANAGEMENT =====
  console.log('\n=== Version Management Demo ===');

  // Create a feature branch for SEO improvements
  const branch = await contentManager.createBranch(
    result.blogPost.id,
    'feature/seo-improvements',
    result.version.id,
  );

  // Update content in the branch
  const updatedVersion = await contentManager.updateBlogPost(
    result.blogPost.id,
    {
      title:
        'The Future of AI: How Machine Learning is Transforming Industries Worldwide',
      content:
        result.blogPost.content +
        '\n\n## Conclusion\n\nThe future of AI is bright, and those who embrace it early will have a competitive advantage in the digital economy.',
      seoMetadata: {
        metaTitle:
          'Future of AI: Machine Learning Transforming Industries Worldwide | TechBlog',
        keywordDensity: 0.015,
      },
      changeSummary: 'Improved title and added conclusion for better SEO',
    },
    'author-123',
  );

  console.log('Created new version:', updatedVersion.version.version);
  console.log(
    'New SEO Score:',
    updatedVersion.seoAnalysis?.overallScore || 'N/A',
  );

  // Compare versions
  const comparison = await contentManager.compareVersions(
    result.version.id,
    updatedVersion.version.id,
  );

  console.log('Version comparison:');
  console.log('- Added words:', comparison.addedWords);
  console.log('- Changed fields:', comparison.changedFields);
  console.log('- Similarity score:', comparison.similarityScore?.toFixed(2));

  // ===== 3. WORKFLOW MANAGEMENT =====
  console.log('\n=== Workflow Management Demo ===');

  // Submit for review with validation
  const reviewResult = await contentManager.submitForReview(
    result.blogPost.id,
    'author-123',
    {
      reviewers: ['reviewer-456', 'editor-789'],
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      priority: 'medium',
      message:
        'Please review this AI article for technical accuracy and SEO optimization.',
    },
  );

  console.log('Submitted for review. Workflow ID:', reviewResult.workflow.id);
  console.log(
    'Current step:',
    reviewResult.workflow.currentStep,
    'of',
    reviewResult.workflow.totalSteps,
  );

  // Simulate approval process
  const approvalResult = await contentManager.processApproval(
    reviewResult.workflow.id,
    1, // First step
    'reviewer-456',
    {
      action: 'approve',
      comment:
        'Great technical content! SEO looks good. Approved for next step.',
    },
  );

  console.log(
    'First approval completed. Moving to step:',
    approvalResult.currentStep,
  );

  // Second approval
  await contentManager.processApproval(
    reviewResult.workflow.id,
    2, // Second step
    'editor-789',
    {
      action: 'approve',
      comment: 'Excellent writing quality. Ready for publication.',
    },
  );

  console.log('All approvals completed!');

  // ===== 4. METADATA MANAGEMENT =====
  console.log('\n=== Metadata Management Demo ===');

  // Add more custom metadata
  await contentManager.updateMetadata(result.blogPost.id, {
    customFields: {
      difficulty_level: 'Advanced',
      estimated_read_time: '12',
      author_expertise: 'AI Researcher',
      last_fact_check: new Date().toISOString(),
      sponsored_content: 'false',
    },
    seoMetadata: {
      canonicalUrl: `https://techblog.com/ai-future-machine-learning`,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline:
          'The Future of AI: Transforming Industries Through Machine Learning',
        author: {
          '@type': 'Person',
          name: 'AI Expert',
        },
        datePublished: new Date().toISOString(),
      },
    },
  });

  // Perform comprehensive SEO analysis
  const comprehensiveSeoAnalysis = await contentManager.analyzeSeo(
    result.blogPost.id,
  );

  console.log('Comprehensive SEO Analysis:');
  console.log(
    '- Overall Score:',
    comprehensiveSeoAnalysis.overallScore.toFixed(1),
  );
  console.log(
    '- Keyword Optimization:',
    comprehensiveSeoAnalysis.keywordOptimization.toFixed(1),
  );
  console.log(
    '- Content Structure:',
    comprehensiveSeoAnalysis.contentStructure.toFixed(1),
  );
  console.log(
    '- Meta Optimization:',
    comprehensiveSeoAnalysis.metaOptimization.toFixed(1),
  );
  console.log('- Suggestions:', comprehensiveSeoAnalysis.suggestions.length);

  // ===== 5. CONTENT RELATIONSHIPS =====
  console.log('\n=== Content Relationships Demo ===');

  // Create related content
  const relatedPost = await contentManager.createBlogPost({
    title: 'Machine Learning Algorithms: A Comprehensive Guide',
    content: 'Deep dive into various machine learning algorithms...',
    categories: [aiCategory.id],
    tags: [mlTag.id],
    authorId: 'author-123',
  });

  // Analyze and create relationships
  const relationshipAnalysis =
    await contentManager.categorizationManager.analyzeRelationships(
      result.blogPost.id,
    );

  console.log('Relationship Analysis:');
  console.log(
    '- Existing relationships:',
    relationshipAnalysis.relatedPosts.length,
  );
  console.log(
    '- Suggested relationships:',
    relationshipAnalysis.suggestedRelationships.length,
  );

  // Create a content series
  const aiSeries = await contentManager.categorizationManager.createSeries(
    'AI Fundamentals Series',
    'A comprehensive series covering AI and machine learning fundamentals',
  );

  await contentManager.categorizationManager.addToSeries(
    result.blogPost.id,
    aiSeries.id,
    1,
  );
  await contentManager.categorizationManager.addToSeries(
    relatedPost.blogPost.id,
    aiSeries.id,
    2,
  );

  console.log('Created content series with 2 posts');

  // ===== 6. PUBLISHING WITH SCHEDULING =====
  console.log('\n=== Publishing Management Demo ===');

  // Schedule publication
  await contentManager.publishBlogPost(result.blogPost.id, 'author-123', {
    scheduleOptions: {
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      timezone: 'America/New_York',
      autoPromote: true,
      promotionChannels: ['twitter', 'linkedin', 'facebook'],
      notifySubscribers: true,
    },
    createRelationships: true,
    notifySubscribers: true,
  });

  console.log(
    'Blog post scheduled for publication tomorrow with social media promotion',
  );

  // ===== 7. ADVANCED SEARCH =====
  console.log('\n=== Advanced Search Demo ===');

  const searchResults = await contentManager.searchContent({
    query: 'machine learning',
    categories: [aiCategory.id],
    tags: [mlTag.id],
    status: ['PUBLISHED', 'SCHEDULED'],
    sortBy: 'relevance',
    limit: 10,
  });

  console.log('Search Results:');
  console.log(`Found ${searchResults.length} posts matching criteria`);

  // ===== 8. ANALYTICS AND METRICS =====
  console.log('\n=== Analytics Dashboard ===');

  const analytics = await contentManager.getContentAnalytics();

  console.log('Content Analytics:');
  console.log('- Total Posts:', analytics.overview.totalPosts);
  console.log('- Published:', analytics.overview.publishedPosts);
  console.log('- Pending Approvals:', analytics.workflow.pendingApprovals);
  console.log('- Average SEO Score:', analytics.seo.averageSeoScore.toFixed(1));
  console.log('- Categories:', analytics.categorization.totalCategories);
  console.log('- Tags:', analytics.categorization.totalTags);
  console.log('- Posts needing SEO work:', analytics.seo.postsNeedingSeoWork);

  // ===== 9. NOTIFICATION MANAGEMENT =====
  console.log('\n=== Notification System Demo ===');

  // Get notifications for the author
  const notifications = await contentManager.getUserNotifications(
    'author-123',
    {
      unreadOnly: true,
      limit: 10,
    },
  );

  console.log('Recent Notifications:');
  notifications.forEach((notification, index) => {
    console.log(`${index + 1}. [${notification.type}] ${notification.title}`);
    console.log(`   ${notification.message}`);
    console.log(
      `   Priority: ${notification.priority}, Created: ${notification.createdAt.toISOString()}`,
    );
  });

  // ===== 10. CLEANUP =====
  await prisma.$disconnect();

  console.log('\n=== Content Management Demo Completed ===');
}

// Run the example
if (require.main === module) {
  advancedContentManagementExample()
    .then(() => {
      console.log(
        'Advanced content management example completed successfully!',
      );
      process.exit(0);
    })
    .catch(error => {
      console.error(
        'Error running advanced content management example:',
        error,
      );
      process.exit(1);
    });
}

export { advancedContentManagementExample };
