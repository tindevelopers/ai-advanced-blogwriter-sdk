# AI SDK Blog Writer

> Intelligent blog content generation and optimization for the AI SDK ecosystem.

The AI SDK Blog Writer extends the [Vercel AI SDK](https://sdk.vercel.ai/) with specialized capabilities for creating high-quality, SEO-optimized blog content. Built on the same architecture and patterns as the core AI SDK, it provides a seamless experience for generating, optimizing, and managing blog content.

## Features

### 🚀 Intelligent Content Generation

- **Template-based generation** with 10+ pre-built blog templates
- **Smart content structure** with automated heading organization
- **Context-aware writing** that adapts tone and style to your audience
- **Research integration** for data-driven content creation

### 🎯 SEO Optimization Engine

- **Comprehensive SEO analysis** with 100-point scoring system
- **Keyword optimization** with density analysis and placement recommendations
- **Meta tag generation** for titles, descriptions, and social media
- **Content structure optimization** for better search visibility

### 🔍 Content Research Tools

- **Topic research** with competitive analysis
- **Keyword discovery** including long-tail and trending keywords
- **Content gap analysis** to identify opportunities
- **Audience insight generation** for targeted content

### 📊 Quality Assurance

- **Content validation** with detailed error reporting
- **Readability analysis** with grade-level scoring
- **Performance suggestions** for engagement optimization
- **Version management** with change tracking

### 🎨 Advanced Writing Features (NEW)

- **Multi-Section Generation** - Intelligent content structuring with context-aware section generation
- **Tone & Style Consistency** - Brand voice alignment and automated style guide compliance
- **Fact-Checking & Verification** - AI-powered claim verification with credible source analysis
- **Content Optimization** - Real-time suggestions for SEO, readability, and engagement improvements
- **Brand Voice Profiles** - Create and maintain consistent voice across all content
- **A/B Testing Suggestions** - Generate content variations for optimization testing

### 🏢 Content Management Foundation

- **Version Control** - Complete version history with branching and merging capabilities
- **Workflow Management** - Configurable approval workflows and status tracking
- **Metadata System** - Flexible custom fields and content classification
- **Publishing Schedule** - Advanced scheduling with timezone support and automation
- **Series Management** - Create and manage multi-part content series

### 📈 Content Strategy Engine

- **Topic Research** - AI-powered topic discovery with trend analysis
- **Editorial Calendar** - Smart content planning with deadline management
- **Competitor Analysis** - Comprehensive competitive intelligence and gap identification
- **Content Briefs** - Structured brief generation with research compilation

## Installation

```bash
npm install @ai-sdk/blog-writer ai
```

## Quick Start

```typescript
import { openai } from '@ai-sdk/openai';
import { generateBlog } from '@ai-sdk/blog-writer';

// Generate a complete blog post
const result = await generateBlog({
  model: openai('gpt-4'),
  topic: 'How to Build a Personal Brand Online',
  template: 'howto',
  keywords: ['personal branding', 'online presence', 'digital marketing'],
  wordCount: { min: 1500, max: 2500 },
  tone: 'professional',
  audience: 'entrepreneurs and professionals',
});

console.log(result.blogPost.metadata.title);
console.log(`Generated ${result.metadata.wordCount} words`);
```

## Blog Templates

The library includes 10 pre-built templates optimized for different content types:

| Template     | Use Case                     | Typical Length  |
| ------------ | ---------------------------- | --------------- |
| `howto`      | Step-by-step guides          | 800-2500 words  |
| `listicle`   | List-based articles          | 1000-3000 words |
| `comparison` | Product/service comparisons  | 1200-2500 words |
| `tutorial`   | In-depth educational content | 1500-3500 words |
| `news`       | News and announcements       | 600-2000 words  |
| `review`     | Product/service reviews      | 800-2000 words  |
| `guide`      | Comprehensive guides         | 2000-5000 words |
| `case-study` | Success stories and analysis | 1200-2500 words |
| `opinion`    | Editorial and opinion pieces | 1000-2500 words |
| `interview`  | Q&A format content           | 1200-3000 words |

## Content Research

```typescript
import { researchTopic } from '@ai-sdk/blog-writer';

// Research a topic before writing
const research = await researchTopic(openai('gpt-4'), {
  topic: 'Artificial Intelligence in Healthcare',
  depth: 'comprehensive',
  audience: 'healthcare professionals',
  includeTrends: true,
  includeCompetitors: true,
});

// Use research data in blog generation
const blog = await generateBlog({
  model: openai('gpt-4'),
  topic: research.topic,
  keywords: research.keywords.primary.slice(0, 5).map(k => k.keyword),
  research: research,
});
```

## Advanced Writing Features

### Multi-Section Content Generation

Generate sophisticated, well-structured content with intelligent section organization:

```typescript
import { AdvancedWritingService } from '@ai-sdk/blog-writer';

const advancedWriter = new AdvancedWritingService({
  model: openai('gpt-4'),
  prisma, // optional for database features
});

// Generate comprehensive content with advanced features
const result = await advancedWriter.generateAdvancedContent({
  topic: 'The Future of Artificial Intelligence',
  targetLength: 2000,
  contentType: 'article',
  targetAudience: 'Technology professionals',

  // Multi-section options
  generateOutline: true,
  contextAwareness: true,
  includeTransitions: true,

  // Quality requirements
  enableFactChecking: true,
  targetKeywords: ['artificial intelligence', 'AI future', 'technology trends'],
  minQualityScore: 0.8,
});

console.log(`Generated ${result.sections.length} sections`);
console.log(
  `Quality score: ${(result.metrics.overallQualityScore * 100).toFixed(1)}%`,
);
```

### Tone & Style Consistency

Maintain consistent brand voice across all content:

```typescript
import { ToneStyleConsistencyService } from '@ai-sdk/blog-writer';

const toneService = new ToneStyleConsistencyService({
  model: openai('gpt-4'),
});

// Create brand voice profile
const brandVoice = await toneService.createBrandVoiceProfile(
  [
    'We believe technology should empower everyone',
    "Let's dive into how this works",
    'This approach offers several key advantages',
  ],
  'Tech-Friendly Professional',
);

// Analyze content tone
const toneAnalysis = await toneService.analyzeTone({
  blogPostId: 'post-123',
  content: yourContent,
  brandVoice,
  analysisDepth: 'comprehensive',
});

console.log(`Primary tone: ${toneAnalysis.primaryTone}`);
console.log(
  `Brand alignment: ${(toneAnalysis.brandVoiceScore * 100).toFixed(1)}%`,
);
```

### Fact-Checking & Source Verification

Ensure content accuracy with AI-powered fact-checking:

```typescript
import { FactCheckingService } from '@ai-sdk/blog-writer';

const factChecker = new FactCheckingService({
  model: openai('gpt-4'),
});

// Perform comprehensive fact-checking
const factChecks = await factChecker.performFactCheck({
  blogPostId: 'post-123',
  autoDetectClaims: true,
  verificationThreshold: 0.8,
  requireReliableSources: true,
});

// Generate fact-checking report
const report = await factChecker.generateFactCheckReport('post-123');
console.log(`Accuracy score: ${(report.overallScore * 100).toFixed(1)}%`);
console.log(`Verified claims: ${report.verifiedClaims}/${report.totalClaims}`);
```

### Content Optimization

Get intelligent suggestions for improving content performance:

```typescript
import { ContentOptimizationService } from '@ai-sdk/blog-writer';

const optimizer = new ContentOptimizationService({
  model: openai('gpt-4'),
});

// Generate optimization suggestions
const optimization = await optimizer.optimizeContent({
  blogPostId: 'post-123',
  targetKeywords: ['AI optimization', 'content improvement'],
  categories: ['SEO', 'READABILITY', 'ENGAGEMENT'],
  prioritizeHighImpact: true,
});

console.log(`Generated ${optimization.suggestions.length} suggestions`);
console.log('Quick wins:');
optimization.implementationGuide.quickWins.forEach((task, i) => {
  console.log(
    `${i + 1}. ${task.task} (${task.impact} impact, ${task.effort} effort)`,
  );
});
```

## Comprehensive Workflow Example

Here's how to use all features together in a complete content creation workflow:

```typescript
import {
  AdvancedWritingService,
  ContentStrategyService,
  ContentManagementService,
} from '@ai-sdk/blog-writer';

async function createComprehensiveContent() {
  // 1. Strategic Planning
  const strategy = new ContentStrategyService({ model: openai('gpt-4') });
  const topicResearch = await strategy.researchTopics({
    niche: 'Technology',
    keywords: ['AI', 'automation', 'future tech'],
    analysisDepth: 'detailed',
  });

  // 2. Advanced Content Generation
  const writer = new AdvancedWritingService({ model: openai('gpt-4') });
  const content = await writer.generateAdvancedContent({
    topic: topicResearch.topics[0].title,
    targetLength: 2000,
    enableFactChecking: true,
    generateOutline: true,
    targetKeywords: topicResearch.topics[0].primaryKeywords.slice(0, 3),
    minQualityScore: 0.85,
  });

  // 3. Content Management
  const manager = new ContentManagementService({ model: openai('gpt-4') });
  await manager.processContentWorkflow(content.blogPostId, {
    autoPublish: content.metrics.overallQualityScore >= 0.9,
    qualityGate: true,
  });

  // 4. Performance Insights
  const insights = await writer.generateInsightsReport(content.blogPostId);
  console.log(`Content quality: ${insights.overallScore.toFixed(1)}/100`);

  return content;
}
```

## SEO Optimization

```typescript
import { analyzeSEO, optimizeSEO } from '@ai-sdk/blog-writer';

// Analyze SEO performance
const analysis = await analyzeSEO(openai('gpt-4'), blogPost);
console.log(`SEO Score: ${analysis.score}/100`);

// Get optimization recommendations
analysis.recommendations.forEach(rec => {
  console.log(`${rec.type.toUpperCase()}: ${rec.message}`);
});

// Auto-optimize content
const optimized = await optimizeSEO(openai('gpt-4'), blogPost, {
  keywords: { primary: 'target keyword' },
  meta: { title: true, description: true },
  content: { optimizeHeadings: true },
});
```

## Advanced Usage

### Custom Templates

```typescript
import { generateBlog } from '@ai-sdk/blog-writer';

const customBlog = await generateBlog({
  model: openai('gpt-4'),
  topic: 'Your Topic Here',
  template: 'guide',
  templateVariables: {
    productName: 'Your Product',
    targetAudience: 'developers',
    keyFeatures: ['feature1', 'feature2', 'feature3'],
  },
  seo: {
    focusKeyword: 'main keyword',
    metaDescription: 'Custom meta description',
  },
});
```

### Batch Processing

```typescript
import { generateBlog } from '@ai-sdk/blog-writer';

const topics = ['Topic 1', 'Topic 2', 'Topic 3'];

const blogs = await Promise.all(
  topics.map(topic =>
    generateBlog({
      model: openai('gpt-4'),
      topic,
      template: 'howto',
    }),
  ),
);
```

### Content Series Generation

```typescript
const seriesTopics = [
  { topic: 'Introduction to Digital Marketing', template: 'guide' },
  { topic: 'How to Create a Marketing Strategy', template: 'howto' },
  { topic: '10 Essential Marketing Tools', template: 'listicle' },
];

const series = [];
for (const item of seriesTopics) {
  const blog = await generateBlog({
    model: openai('gpt-4'),
    topic: item.topic,
    template: item.template,
    context: `Part ${series.length + 1} of ${seriesTopics.length} in Digital Marketing series`,
  });
  series.push(blog);
}
```

## API Reference

### Core Functions

#### `generateBlog(options)`

Generates a complete blog post with the specified options.

**Options:**

- `model` - Language model to use
- `topic` - Blog post topic
- `template` - Template type (optional, defaults to 'howto')
- `keywords` - Target keywords array
- `wordCount` - Word count range `{ min, max }`
- `tone` - Writing tone
- `audience` - Target audience
- `seo` - SEO optimization options

**Returns:** `GenerateBlogResult` with blog post, metadata, and suggestions.

#### `researchTopic(model, config)`

Conducts comprehensive research on a given topic.

**Parameters:**

- `model` - Language model to use
- `config` - Research configuration object

**Returns:** `ContentResearchResult` with research insights.

#### `analyzeSEO(model, blogPost)`

Analyzes SEO performance of a blog post.

**Parameters:**

- `model` - Language model to use
- `blogPost` - Blog post to analyze

**Returns:** `SEOAnalysis` with scores and recommendations.

### Types

The library exports comprehensive TypeScript types:

- `BlogPost` - Complete blog post structure
- `BlogAIConfig` - Configuration for blog generation
- `SEOAnalysis` - SEO analysis results
- `ContentResearchResult` - Research findings
- `BlogTemplate` - Available template types

## Integration with Existing AI SDK

The Blog Writer seamlessly integrates with your existing AI SDK setup:

```typescript
// Use with any AI SDK provider
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { generateBlog } from '@ai-sdk/blog-writer';

// Works with Anthropic
const claudeBlog = await generateBlog({
  model: anthropic('claude-3-haiku'),
  topic: 'Your topic',
});

// Works with Google
const gemini = await generateBlog({
  model: google('models/gemini-pro'),
  topic: 'Your topic',
});
```

## Week 3-4 Content Management Foundation 🆕

The AI SDK Blog Writer now includes enterprise-grade content management capabilities:

### 📝 Version Control System

Complete version control with branching, merging, and rollbacks:

```typescript
import { VersionManager, ContentManagementService } from '@ai-sdk/blog-writer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const contentManager = new ContentManagementService(prisma);

// Create comprehensive blog post with versioning
const result = await contentManager.createBlogPost({
  title: 'Advanced React Patterns',
  content: '...',
  categories: ['tech', 'react'],
  tags: ['react', 'javascript', 'patterns'],
  seoMetadata: {
    metaTitle: 'Advanced React Patterns | Developer Guide',
    focusKeywords: ['react patterns', 'advanced react'],
  },
});

// Create version branch
const branch = await contentManager.createBranch(
  result.blogPost.id,
  'feature/seo-improvements',
);

// Compare versions
const comparison = await contentManager.compareVersions(v1Id, v2Id);
console.log('Similarity:', comparison.similarityScore);

// Rollback if needed
await contentManager.rollbackToVersion(postId, targetVersionId, {
  createBranch: true,
  branchName: 'rollback-safe',
});
```

### 🔄 Workflow Management System

Multi-step approval workflows with notifications:

```typescript
// Configure workflow
const contentManager = new ContentManagementService(prisma, {
  requireApproval: true,
  approvalMatrix: {
    technical: ['tech-lead@company.com'],
    marketing: ['marketing@company.com'],
  },
  notifications: {
    onSubmission: true,
    onApproval: true,
    reminderDays: [1, 3, 7],
  },
});

// Submit for review
const workflow = await contentManager.submitForReview(
  blogPostId,
  'author-123',
  {
    reviewers: ['reviewer1', 'reviewer2'],
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    priority: 'high',
    message: 'Please review for technical accuracy',
  },
);

// Process approval
await contentManager.processApproval(workflow.id, 1, 'reviewer1', {
  action: 'approve',
  comment: 'Excellent technical content!',
});

// Schedule publication
await contentManager.publishBlogPost(blogPostId, 'author-123', {
  scheduleOptions: {
    scheduledFor: new Date('2024-12-01T10:00:00Z'),
    autoPromote: true,
    promotionChannels: ['twitter', 'linkedin'],
  },
});
```

### 🏷️ Advanced Metadata Management

SEO metadata, custom fields, and comprehensive validation:

```typescript
import { MetadataManager } from '@ai-sdk/blog-writer';

const metadataManager = new MetadataManager(prisma);

// Create custom metadata fields
const difficultyField = await metadataManager.createMetadataField({
  name: 'difficulty_level',
  displayName: 'Difficulty Level',
  fieldType: 'STRING',
  validation: { options: ['Beginner', 'Intermediate', 'Advanced'] },
  isRequired: true,
});

// Comprehensive SEO metadata
await metadataManager.updateSeoMetadata(blogPostId, {
  metaTitle: 'SEO Optimized Title | Brand',
  metaDescription: 'Compelling 155-character description...',
  focusKeywords: ['primary keyword'],
  secondaryKeywords: ['related', 'terms'],
  ogTitle: 'Social Media Title',
  ogDescription: 'Social media description',
  twitterCard: 'summary_large_image',
  structuredData: {
    '@type': 'Article',
    headline: 'Article Headline',
  },
});

// Advanced SEO analysis
const seoAnalysis = await metadataManager.analyzeSeo(blogPostId);
console.log(`SEO Score: ${seoAnalysis.overallScore}/100`);
console.log('Suggestions:', seoAnalysis.suggestions.length);
```

### 📂 Content Organization System

Hierarchical categories, flexible tagging, and content relationships:

```typescript
import { CategorizationManager } from '@ai-sdk/blog-writer';

const categorizationManager = new CategorizationManager(prisma);

// Create category hierarchy
const techCategory = await categorizationManager.createCategory({
  name: 'Technology',
  description: 'Tech content',
  color: '#3B82F6',
  icon: 'laptop',
});

const aiCategory = await categorizationManager.createCategory({
  name: 'Artificial Intelligence',
  parentId: techCategory.id,
  color: '#8B5CF6',
});

// Auto-classify content
const classification = await categorizationManager.autoClassifyContent({
  title: 'Machine Learning Fundamentals',
  content: 'Content about ML concepts...',
});

// Advanced content search
const results = await categorizationManager.searchContent({
  query: 'machine learning',
  categories: [aiCategory.id],
  tags: ['ml', 'ai'],
  dateRange: { from: lastMonth, to: now },
  sortBy: 'relevance',
});

// Create content series
const series = await categorizationManager.createSeries(
  'AI Fundamentals Series',
  'Complete guide to AI concepts',
);
await categorizationManager.addToSeries(blogPostId, series.id, 1);
```

### 🔔 Notification System

Real-time workflow and content notifications:

```typescript
import { NotificationManager } from '@ai-sdk/blog-writer';

const notificationManager = new NotificationManager(prisma);

// Workflow notifications (automatic)
await contentManager.submitForReview(/* ... */); // Sends notifications

// Custom notifications
await notificationManager.createSeoNotification(
  'author-123',
  blogPostId,
  'low_score',
  45, // SEO score
);

// Deadline reminders
await notificationManager.createDeadlineReminder(
  'reviewer-456',
  blogPostId,
  deadline,
  'approaching',
);

// Get user notifications
const notifications = await notificationManager.getUserNotifications(
  'user-123',
  { unreadOnly: true, limit: 10 },
);
```

### 📊 Analytics & Reporting

Comprehensive content and workflow analytics:

```typescript
// Get comprehensive analytics
const analytics = await contentManager.getContentAnalytics();

console.log('Content Overview:');
console.log('- Total Posts:', analytics.overview.totalPosts);
console.log('- Published:', analytics.overview.publishedPosts);
console.log('- Average SEO Score:', analytics.seo.averageSeoScore);

console.log('Workflow Metrics:');
console.log('- Pending Approvals:', analytics.workflow.pendingApprovals);
console.log('- Average Approval Time:', analytics.workflow.averageApprovalTime);

console.log('Content Organization:');
console.log('- Categories:', analytics.categorization.totalCategories);
console.log('- Tags:', analytics.categorization.totalTags);
console.log('- Most Used Tags:', analytics.categorization.mostUsedTags);
```

## Week 5-6 Content Strategy Engine 🚀

The Content Strategy Engine provides enterprise-grade strategic content planning capabilities, integrating AI-powered research, competitive analysis, and comprehensive content planning.

### 🎯 Unified Content Strategy Service

Orchestrates all strategic content planning components:

```typescript
import { ContentStrategyService } from '@ai-sdk/blog-writer';

const strategyService = new ContentStrategyService({
  model: openai('gpt-4'),
  prisma,
  cacheResults: true,
});

// Generate comprehensive content strategy
const strategy = await strategyService.generateStrategy({
  niche: 'SaaS Product Management',
  targetKeywords: [
    'product management best practices',
    'SaaS product strategy',
    'user feedback management',
  ],
  competitors: ['productplan.com', 'aha.io'],
  timeframe: {
    start: new Date(),
    end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
  },
  goals: {
    contentVolume: 12, // posts per month
    targetAudience: ['Product Managers', 'SaaS Founders'],
    businessObjectives: ['Generate leads', 'Build authority'],
  },
  constraints: {
    budget: 50000,
    teamSize: 3,
    expertiseAreas: ['Product Management', 'Technical Writing'],
  },
});

console.log(`Strategy generated:`);
console.log(`- Topics: ${strategy.topics.length}`);
console.log(`- Calendar entries: ${strategy.calendar.entries.length}`);
console.log(`- Content briefs: ${strategy.contentBriefs.length}`);
console.log(`- Opportunities: ${strategy.opportunities.length}`);
console.log(
  `- Implementation time: ${strategy.overview.estimatedTimeToImplement} weeks`,
);
```

### 🔬 Topic Research & Trend Analysis

Intelligent topic discovery and trend analysis using AI:

```typescript
import { TopicResearchService } from '@ai-sdk/blog-writer';

const topicService = new TopicResearchService({
  model: openai('gpt-4'),
  prisma,
  cacheResults: true,
});

// Discover trending topics
const trendingTopics = await topicService.discoverTrendingTopics(
  'AI automation',
  10,
);

// Research specific topic
const topicResearch = await topicService.researchTopic({
  query: 'AI-powered customer service automation',
  includeKeywords: true,
  includeTrends: true,
  includeCompetitors: true,
  depth: 'detailed',
});

console.log(`Topic: ${topicResearch.topic.title}`);
console.log(`Opportunity Score: ${topicResearch.topic.opportunityScore}`);
console.log(`Competition Level: ${topicResearch.topic.competitionLevel}`);
console.log(`Keywords Found: ${topicResearch.keywords.length}`);
```

### 📅 Editorial Calendar & Content Planning

Comprehensive content scheduling and planning workflows:

```typescript
import { EditorialCalendarService } from '@ai-sdk/blog-writer';

const calendarService = new EditorialCalendarService({
  model: openai('gpt-4'),
  prisma,
  autoAssignment: true,
});

// Generate editorial calendar
const calendar = await calendarService.generateCalendar({
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  topics: ['AI automation', 'Machine learning ROI'],
  contentTypes: ['BLOG', 'GUIDE'],
  priority: 'medium',
});

// Add calendar entry with milestones
const entry = await calendarService.addEntry({
  title: 'Complete Guide to AI Implementation',
  plannedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  contentType: 'GUIDE',
  priority: 'high',
  targetWordCount: 3000,
  estimatedHours: 8,
  assignedTo: 'writer@company.com',
  milestones: [
    {
      name: 'Research Complete',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'First Draft',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  ],
});

// Track time spent
await calendarService.trackTime(
  entry.id,
  'writer@company.com',
  'research',
  2.5, // hours
  'Initial topic research and source gathering',
);
```

### 🏢 Competitor Analysis & Gap Identification

Comprehensive competitor content analysis and opportunity identification:

```typescript
import { CompetitorAnalysisService } from '@ai-sdk/blog-writer';

const competitorService = new CompetitorAnalysisService({
  model: openai('gpt-4'),
  prisma,
  cacheResults: true,
});

// Identify SERP competitors
const competitors = await competitorService.identifySERPCompetitors([
  'AI automation',
  'machine learning business',
]);

// Analyze competitors
const analysis = await competitorService.analyzeCompetitors({
  competitors: competitors.map(c => c.domain),
  keywords: ['AI automation', 'ML ROI'],
  includeContent: true,
  includeKeywords: true,
  depth: 'detailed',
});

console.log(`Competitors Analyzed: ${analysis.analysis.length}`);
console.log(`Content Gaps Found: ${analysis.gaps.length}`);
console.log(`Opportunities: ${analysis.opportunities.length}`);

// Top opportunity
if (analysis.opportunities.length > 0) {
  const topOpp = analysis.opportunities[0];
  console.log(`Top Opportunity: ${topOpp.title}`);
  console.log(`Potential: ${topOpp.potential * 100}%`);
  console.log(`Difficulty: ${topOpp.difficulty * 100}%`);
}
```

### 📋 Content Brief Generation

AI-powered content brief generation with comprehensive research:

```typescript
import { ContentBriefService } from '@ai-sdk/blog-writer';

const briefService = new ContentBriefService({
  model: openai('gpt-4'),
  prisma,
  includeResearchByDefault: true,
  includeCompetitorAnalysisByDefault: true,
});

// Generate comprehensive content brief
const brief = await briefService.generateBrief({
  title: 'The Complete Guide to AI Customer Service Automation',
  primaryKeyword: 'AI customer service automation',
  secondaryKeywords: ['chatbot automation', 'AI support tickets'],
  targetAudience: 'Business leaders and customer service managers',
  contentType: 'GUIDE',
  includeCompetitorAnalysis: true,
  includeResearch: true,
  includeOutline: true,
});

console.log(`Brief Generated: ${brief.brief.title}`);
console.log(`Target Word Count: ${brief.brief.targetWordCount}`);
console.log(`Search Intent: ${brief.brief.searchIntent}`);
console.log(`Required Sections: ${brief.brief.requiredSections.length}`);
console.log(`Research Sources: ${brief.brief.researchSources?.length || 0}`);

// Generate outline
const outline = await briefService.generateContentOutline(brief.brief);
console.log(`Outline Structure: ${outline.structure}`);
console.log(`Sections: ${outline.sections.length}`);
console.log(`Estimated Words: ${outline.estimatedWordCount}`);
```

### 🔄 Integrated Workflow Example

Complete workflow from strategy to publication:

```typescript
import {
  ContentStrategyService,
  ContentManagementService,
  generateBlog,
} from '@ai-sdk/blog-writer';

// 1. Generate comprehensive strategy
const strategyService = new ContentStrategyService({ model, prisma });
const strategy = await strategyService.generateStrategy(strategyRequest);

// 2. Select content brief and generate blog
const selectedBrief = strategy.contentBriefs[0];
const blogResult = await generateBlog({
  model,
  topic: selectedBrief.title,
  keywords: selectedBrief.secondaryKeywords,
  template: 'guide',
  seo: {
    focusKeyword: selectedBrief.primaryKeyword,
    metaDescription: selectedBrief.metaDescription,
  },
});

// 3. Create managed post with full workflow
const contentManagement = new ContentManagementService({ model, prisma });
const managedPost = await contentManagement.createBlogPost({
  title: blogResult.blogPost.title,
  content: blogResult.blogPost.content,
  contentBriefId: selectedBrief.id,
  workflowConfig: {
    requiresApproval: true,
    approvers: ['editor@company.com', 'seo@company.com'],
  },
  versioningConfig: {
    createBranch: true,
    branchName: 'content/new-guide',
  },
  seoMetadata: {
    metaTitle: selectedBrief.metaTitle,
    metaDescription: selectedBrief.metaDescription,
    focusKeywords: [selectedBrief.primaryKeyword],
  },
});

console.log('✅ Complete workflow: Strategy → Brief → Content → Management');
```

## Database Schema & Setup

The content management system requires a PostgreSQL database. Set up your schema:

```bash
# Install Prisma CLI
npm install -g prisma

# Initialize database
npx prisma db push

# Seed with sample data (optional)
npx prisma db seed
```

The enhanced schema includes comprehensive tables for:

**Content Management Foundation:**

- Blog posts with versioning and branching
- Hierarchical categories and tags
- Workflow states and approval processes
- Custom metadata fields and values
- Notifications and user preferences
- Content relationships and series
- SEO metadata and analytics

**Content Strategy Engine:**

- Topic research and trend analysis
- Editorial calendar and scheduling
- Competitor analysis and tracking
- Content briefs and outlines
- Strategic reporting and analytics
- Implementation planning and milestones

## Examples

See the `/examples` directory for comprehensive usage examples:

### Traditional Examples

- `basic-usage.ts` - Simple blog generation
- `advanced-usage.ts` - Complex workflows and batch processing

### Content Management Examples 🆕

- `advanced-content-management.ts` - Complete CMS workflow demonstration
- `version-management-example.ts` - Branching, merging, and rollbacks
- `workflow-automation-example.ts` - Approval workflows and notifications

### Content Strategy Engine Examples 🚀

- `content-strategy-engine-demo.ts` - Complete strategy engine demonstration
- `integrated-workflow-example.ts` - Strategy-to-publication workflow
- `topic-research-advanced.ts` - Advanced topic research and trend analysis
- `competitor-analysis-deep-dive.ts` - Comprehensive competitor analysis
- `editorial-calendar-management.ts` - Calendar planning and team coordination
- `content-brief-generation.ts` - AI-powered brief creation and optimization

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

## Support

- [Documentation](https://ai-sdk.dev/docs/blog-writer)
- [GitHub Issues](https://github.com/tindevelopers/ai-blog-writer-sdk/issues)
- [Discord Community](https://discord.gg/ai-sdk)

---

Built with ❤️ by the AI SDK team

## 🆕 NEW PLATFORM ADAPTERS

### Shopify Adapter

- **E-commerce Integration**: Publish blog content directly to Shopify store blogs
- **Product Linking**: Embed product recommendations using `[product:handle]` syntax
- **Store Branding**: Automatic theme and branding consistency
- **SEO Optimization**: Built-in e-commerce SEO best practices
- **Analytics Support**: Track blog performance with Shopify analytics

### Webflow Adapter

- **Design-First CMS**: Rich text publishing with advanced design capabilities
- **Custom Fields**: Support for complex CMS field types and structures
- **Asset Management**: Automatic image optimization and CDN integration
- **Visual Integration**: Seamless integration with Webflow Designer
- **Collection Management**: Automated blog collection setup and management

### Multi-Platform Publishing

All platform adapters now work together through the unified `MultiPlatformPublisher`:

- **Cross-Platform Publishing**: Publish to all 5 platforms simultaneously
- **Content Adaptation**: Automatically optimize content for each platform
- **Aggregated Analytics**: Combined performance metrics across all platforms
- **Health Monitoring**: Real-time status tracking for all connected platforms

See [PLATFORM-ADAPTERS.md](./PLATFORM-ADAPTERS.md) for detailed usage guides and examples.
