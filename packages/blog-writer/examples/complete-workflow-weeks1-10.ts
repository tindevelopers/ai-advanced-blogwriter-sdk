/**
 * Complete AI Blog Writer SDK Workflow - Weeks 1-10 Integration
 * End-to-end demonstration of how all features work together:
 *
 * Weeks 1-2: Core architecture and basic blog generation
 * Weeks 3-4: Content management, versioning, workflow automation
 * Weeks 5-6: Content strategy engine, competitive analysis
 * Weeks 7-8: Advanced writing features, fact-checking, optimization
 * Weeks 9-10: SEO analysis engine, DataForSEO integration
 */

import { openai } from 'ai';
import { PrismaClient } from '@prisma/client';
import {
  // Core blog generation (Weeks 1-2)
  generateEnhancedBlog,
  BlogAIConfig,

  // Content management (Weeks 3-4)
  ContentManagementService,
  WorkflowManager,
  VersionManager,
  NotificationManager,

  // Content strategy (Weeks 5-6)
  ContentStrategyService,
  TopicResearchService,
  CompetitorAnalysisService,

  // Advanced writing (Weeks 7-8)
  AdvancedWritingService,
  MultiSectionGenerationService,
  ToneStyleConsistencyService,
  FactCheckingService,

  // SEO analysis (Weeks 9-10)
  SEOAnalysisService,
  KeywordResearchService,
  DataForSEOService,
} from '../src/index';
import type {
  ContentStrategy,
  TopicResearchRequest,
  CompetitorAnalysisRequest,
  MultiSectionGenerationRequest,
  SEOAnalysisRequest,
  DataForSEOConfig,
} from '../src/types';

// Configuration
const model = openai('gpt-4-turbo');
const prisma = new PrismaClient();

const blogConfig: BlogAIConfig = {
  model: 'gpt-4-turbo',
  temperature: 0.7,
  maxTokens: 3000,
  tone: 'professional',
  style: 'blog',
  seo: {
    keywordDensity: 0.015,
    focusKeyword: 'artificial intelligence',
    keywords: ['AI', 'machine learning', 'automation', 'technology'],
    optimizeMetaDescription: true,
    generateAltText: true,
  },
  research: {
    enabled: true,
    depth: 'comprehensive',
    includeTrends: true,
    competitorAnalysis: true,
  },
  quality: {
    readingLevel: 8,
    includeSources: true,
    factCheck: true,
    toneConsistency: true,
  },
};

const dataForSEOConfig: DataForSEOConfig = {
  username: process.env.DATAFORSEO_USERNAME || 'demo_user',
  password: process.env.DATAFORSEO_PASSWORD || 'demo_pass',
  apiKey: process.env.DATAFORSEO_API_KEY || 'demo_key',
  fallbackMode: true,
};

async function completeWorkflowDemo() {
  console.log('🚀 AI Blog Writer SDK - Complete Workflow Demo (Weeks 1-10)\n');
  console.log('='.repeat(60));

  try {
    // ===== PHASE 1: CONTENT STRATEGY & RESEARCH (Weeks 5-6) =====
    console.log('\n📊 PHASE 1: Content Strategy & Research');
    console.log('-'.repeat(40));

    // Initialize strategy services
    const contentStrategyService = new ContentStrategyService({
      model,
      prisma,
      cacheResults: true,
    });

    const topicResearchService = new TopicResearchService({
      model,
      prisma,
      researchDepth: 'comprehensive',
    });

    const competitorService = new CompetitorAnalysisService({
      model,
      prisma,
    });

    // 1. Topic Research
    console.log('\n🔍 Step 1: Topic Research & Trend Analysis');

    const topicRequest: TopicResearchRequest = {
      seedTopics: [
        'artificial intelligence in business',
        'AI automation',
        'machine learning trends',
      ],
      industry: 'technology',
      targetAudience: 'business professionals',
      contentGoals: ['thought leadership', 'lead generation'],
      competitorDomains: ['techcrunch.com', 'wired.com', 'venturebeat.com'],
      includeKeywordData: true,
      includeTrends: true,
      maxSuggestions: 20,
    };

    const topicResearch =
      await topicResearchService.researchTopics(topicRequest);
    console.log(`✓ Generated ${topicResearch.topics.length} topic suggestions`);
    console.log(
      `✓ Identified ${topicResearch.trendingTopics.length} trending topics`,
    );
    console.log(
      `✓ Found ${topicResearch.keywordOpportunities.length} keyword opportunities`,
    );

    // Select the best topic
    const selectedTopic = topicResearch.topics[0];
    console.log(`🎯 Selected Topic: "${selectedTopic.title}"`);
    console.log(`   Priority: ${selectedTopic.priority}/100`);
    console.log(`   Estimated Traffic: ${selectedTopic.estimatedTraffic}`);

    // 2. Competitor Analysis
    console.log('\n🏆 Step 2: Competitive Analysis');

    const competitorRequest: CompetitorAnalysisRequest = {
      topics: [selectedTopic.title],
      competitorDomains: ['techcrunch.com', 'wired.com'],
      analysisDepth: 'detailed',
      includeContentGaps: true,
      includeKeywordGaps: true,
    };

    const competitorAnalysis =
      await competitorService.analyzeCompetitors(competitorRequest);
    console.log(
      `✓ Analyzed ${competitorAnalysis.competitors.length} competitors`,
    );
    console.log(
      `✓ Found ${competitorAnalysis.contentGaps.length} content gaps`,
    );
    console.log(
      `✓ Identified ${competitorAnalysis.keywordGaps.length} keyword opportunities`,
    );

    // 3. Content Strategy Development
    console.log('\n📋 Step 3: Content Strategy Development');

    const contentStrategy: ContentStrategy = {
      targetKeywords: [
        selectedTopic.title,
        ...selectedTopic.relatedKeywords.slice(0, 3),
      ],
      competitorAnalysis: {
        competitors: competitorAnalysis.competitors.map(c => ({
          domain: c.domain,
          strengths: c.strengths,
          weaknesses: c.weaknesses,
          contentGaps: c.contentGaps,
        })),
        opportunities: competitorAnalysis.keywordGaps.map(gap => ({
          keyword: gap.keyword,
          difficulty: gap.difficulty,
          opportunity: gap.opportunity,
        })),
        insights: competitorAnalysis.strategicInsights,
      },
      contentGaps: competitorAnalysis.contentGaps,
      trendingTopics: topicResearch.trendingTopics,
      recommendedStructure: {
        sections: [
          { title: 'Introduction', type: 'introduction', estimatedWords: 200 },
          {
            title: 'Current State of AI',
            type: 'analysis',
            estimatedWords: 400,
          },
          {
            title: 'Business Applications',
            type: 'examples',
            estimatedWords: 500,
          },
          {
            title: 'Implementation Strategy',
            type: 'howto',
            estimatedWords: 400,
          },
          { title: 'Future Outlook', type: 'prediction', estimatedWords: 300 },
          { title: 'Conclusion', type: 'conclusion', estimatedWords: 200 },
        ],
        estimatedLength: 2000,
        targetKeywordDensity: 1.5,
      },
    };

    console.log(
      `✓ Strategy targeting ${contentStrategy.targetKeywords.length} keywords`,
    );
    console.log(
      `✓ Identified ${contentStrategy.contentGaps.length} content opportunities`,
    );
    console.log(
      `✓ Recommended ${contentStrategy.recommendedStructure.sections.length} content sections`,
    );

    // ===== PHASE 2: ADVANCED CONTENT GENERATION (Weeks 7-8) =====
    console.log('\n🎨 PHASE 2: Advanced Content Generation');
    console.log('-'.repeat(40));

    // Initialize advanced writing services
    const advancedWritingService = new AdvancedWritingService({
      model,
      prisma,
      cacheResults: true,
      services: {
        enableMultiSection: true,
        enableToneStyle: true,
        enableFactChecking: true,
        enableOptimization: true,
      },
      apiKeys: {
        newsApi: process.env.NEWS_API_KEY,
        serpApi: process.env.SERP_API_KEY,
      },
    });

    // 1. Multi-Section Content Generation
    console.log('\n📝 Step 4: Multi-Section Content Generation');

    const multiSectionRequest: MultiSectionGenerationRequest = {
      topic: selectedTopic.title,
      outline: {
        title: selectedTopic.title,
        sections: contentStrategy.recommendedStructure.sections.map(
          (section, index) => ({
            title: section.title,
            type: section.type as any,
            level: index === 0 ? 1 : 2,
            order: index + 1,
            estimatedWordCount: section.estimatedWords,
            keyPoints: [],
            contextTags: contentStrategy.targetKeywords,
          }),
        ),
      },
      requirements: {
        totalWordCount: contentStrategy.recommendedStructure.estimatedLength,
        tone: 'professional',
        style: 'informative',
        targetKeywords: contentStrategy.targetKeywords,
        includeExamples: true,
        includeStatistics: true,
        factCheck: true,
      },
      seoOptions: {
        optimizeHeadings: true,
        keywordDensity:
          contentStrategy.recommendedStructure.targetKeywordDensity / 100,
        includeInternalLinking: true,
      },
    };

    const multiSectionResult =
      await advancedWritingService.generateMultiSectionContent(
        multiSectionRequest,
        {
          onSectionGenerated: section => {
            console.log(
              `  ✓ Generated section: ${section.title} (${section.wordCount} words)`,
            );
          },
          onProgress: (current, total) => {
            console.log(`  Progress: ${current}/${total} sections`);
          },
        },
      );

    console.log(
      `✓ Generated ${multiSectionResult.sections.length} content sections`,
    );
    console.log(`✓ Total word count: ${multiSectionResult.totalWordCount}`);
    console.log(
      `✓ Overall quality score: ${multiSectionResult.qualityScore}/100`,
    );

    // ===== PHASE 3: SEO ANALYSIS & OPTIMIZATION (Weeks 9-10) =====
    console.log('\n🔍 PHASE 3: SEO Analysis & Optimization');
    console.log('-'.repeat(40));

    // Initialize SEO services
    const seoAnalysisService = new SEOAnalysisService({
      model,
      prisma,
      dataForSEOConfig,
      defaultOrganization: {
        name: 'TechInsights Corp',
        logo: 'https://play-lh.googleusercontent.com/PikR_16xlfuvm1MqIFgMee2Xz4HGPLkfCJQRA8VztDaaKzcOGBuh8MA7vTjB3RTcjvI=w600-h300-pc0xffffff-pd',
        url: 'https://techinsights.com',
      },
      defaultSite: {
        name: 'TechInsights Blog',
        url: 'https://blog.techinsights.com',
        twitterHandle: '@techinsights',
      },
      cacheResults: true,
      qualityGates: {
        minimumScore: 75,
        minimumReadability: 65,
        minimumContentLength: 1500,
      },
    });

    // 1. Save blog post to database for SEO analysis
    console.log('\n💾 Step 5: Creating Blog Post Entry');

    const fullContent = multiSectionResult.sections
      .map(section => `## ${section.title}\n\n${section.content}`)
      .join('\n\n');

    const blogPost = await prisma.blogPost.create({
      data: {
        title: selectedTopic.title,
        slug: selectedTopic.title.toLowerCase().replace(/\s+/g, '-'),
        content: fullContent,
        excerpt:
          multiSectionResult.sections[0]?.content.substring(0, 160) || '',
        metaDescription: `${selectedTopic.title} - A comprehensive guide covering strategies, implementation, and future trends.`,
        status: 'DRAFT',
        contentType: 'BLOG',
        category: 'Technology',
        authorName: 'AI Content Generator',
        focusKeyword: contentStrategy.targetKeywords[0],
        keywords: contentStrategy.targetKeywords,
        wordCount: multiSectionResult.totalWordCount,
      },
    });

    console.log(`✓ Created blog post: ${blogPost.id}`);

    // 2. Comprehensive SEO Analysis
    console.log('\n🎯 Step 6: Comprehensive SEO Analysis');

    const seoRequest: SEOAnalysisRequest = {
      blogPostId: blogPost.id,
      url: `https://blog.techinsights.com/${blogPost.slug}`,
      targetKeywords: contentStrategy.targetKeywords,
      competitorUrls: competitorAnalysis.competitors
        .map(c => c.topPages[0]?.url)
        .filter(Boolean),
    };

    const seoAnalysis = await seoAnalysisService.analyzeSEO(
      seoRequest,
      {
        includeKeywordResearch: true,
        includeCompetitorAnalysis: true,
        includeSchemaGeneration: true,
        includeReadabilityAnalysis: true,
        includeMetaGeneration: true,
        useDataForSEO: true,
        prioritizeQuickWins: true,
        targetAudience: 'business professionals',
        contentType: 'blog',
      },
      {
        onProgress: (step, progress) => console.log(`  ${step}: ${progress}%`),
        onComplete: result =>
          console.log(`  ✓ SEO Analysis complete: ${result.overallScore}/100`),
      },
    );

    console.log(`✓ SEO Score: ${seoAnalysis.overallScore}/100`);
    console.log(`✓ Keywords analyzed: ${seoAnalysis.keywordAnalysis.length}`);
    console.log(`✓ Recommendations: ${seoAnalysis.recommendations.length}`);
    console.log(`✓ Quick wins: ${seoAnalysis.quickWins.length}`);

    // ===== PHASE 4: CONTENT MANAGEMENT & WORKFLOW (Weeks 3-4) =====
    console.log('\n📋 PHASE 4: Content Management & Workflow');
    console.log('-'.repeat(40));

    // Initialize content management services
    const contentManager = new ContentManagementService({
      model,
      prisma,
      autoVersioning: true,
      workflowEnabled: true,
    });

    const workflowManager = new WorkflowManager({
      model,
      prisma,
      autoApproval: false,
      notificationEnabled: true,
    });

    // 1. Apply SEO optimizations
    console.log('\n⚡ Step 7: Applying Quick SEO Wins');

    let optimizedContent = fullContent;
    let optimizedTitle = blogPost.title;
    let optimizedMeta = blogPost.metaDescription || '';

    // Apply quick wins automatically
    for (const quickWin of seoAnalysis.quickWins) {
      console.log(`  Applying: ${quickWin.title}`);

      if (quickWin.type === 'title_optimization' && quickWin.suggestedValue) {
        optimizedTitle = quickWin.suggestedValue;
      }

      if (quickWin.type === 'meta_description' && quickWin.suggestedValue) {
        optimizedMeta = quickWin.suggestedValue;
      }

      // Mark as implemented
      await prisma.sEORecommendation.updateMany({
        where: { id: quickWin.id },
        data: {
          status: 'completed',
          implementedAt: new Date(),
          implementedBy: 'Auto-optimization system',
        },
      });
    }

    // 2. Create optimized version
    console.log('\n📄 Step 8: Creating Optimized Version');

    const optimizedVersion = await contentManager.createVersion(blogPost.id, {
      title: optimizedTitle,
      content: optimizedContent,
      metaDescription: optimizedMeta,
      changeSummary: `Applied ${seoAnalysis.quickWins.length} SEO quick wins automatically`,
      keywords: contentStrategy.targetKeywords,
      seoScore: seoAnalysis.overallScore,
    });

    console.log(`✓ Created optimized version: ${optimizedVersion.version}`);

    // 3. Submit to workflow
    console.log('\n🔄 Step 9: Content Workflow Management');

    const workflowEntry = await workflowManager.submitForReview(blogPost.id, {
      submittedBy: 'AI Content Generator',
      reviewType: 'comprehensive',
      priority: 'high',
      notes: `AI-generated content with SEO optimization. Score: ${seoAnalysis.overallScore}/100`,
      metadata: {
        seoScore: seoAnalysis.overallScore,
        wordCount: multiSectionResult.totalWordCount,
        keywordsTargeted: contentStrategy.targetKeywords.length,
        quickWinsApplied: seoAnalysis.quickWins.length,
      },
    });

    console.log(`✓ Submitted to workflow: ${workflowEntry.id}`);

    // ===== PHASE 5: FINAL GENERATION & POLISH (Weeks 1-2) =====
    console.log('\n✨ PHASE 5: Final Generation & Polish');
    console.log('-'.repeat(40));

    // 1. Generate final polished version
    console.log('\n🎨 Step 10: Final Content Generation');

    const enhancedBlogConfig: BlogAIConfig = {
      ...blogConfig,
      seo: {
        ...blogConfig.seo!,
        focusKeyword: contentStrategy.targetKeywords[0],
        keywords: contentStrategy.targetKeywords,
        keywordDensity:
          contentStrategy.recommendedStructure.targetKeywordDensity / 100,
      },
      contentStrategy: contentStrategy,
    };

    const finalBlogPost = await generateEnhancedBlog(
      {
        topic: optimizedTitle,
        requirements: `Create a comprehensive ${multiSectionResult.totalWordCount}-word article about ${selectedTopic.title}. 
        
        Target audience: Business professionals and technology decision-makers.
        
        Key topics to cover:
        ${contentStrategy.recommendedStructure.sections.map(s => `- ${s.title}`).join('\n')}
        
        SEO Requirements:
        - Target keywords: ${contentStrategy.targetKeywords.join(', ')}
        - Current SEO score to improve upon: ${seoAnalysis.overallScore}/100
        - Address these SEO gaps: ${seoAnalysis.recommendations
          .slice(0, 3)
          .map(r => r.title)
          .join(', ')}
        
        Content gaps to address based on competitor analysis:
        ${contentStrategy.contentGaps.slice(0, 3).join(', ')}
        
        Ensure high-quality, authoritative content that demonstrates expertise and builds trust.`,
      },
      enhancedBlogConfig,
    );

    console.log(
      `✓ Generated final blog post: ${finalBlogPost.blogPost.metadata.wordCount} words`,
    );
    console.log(`✓ SEO analysis score: ${finalBlogPost.seoAnalysis.score}/100`);
    console.log(
      `✓ Content type detection: ${finalBlogPost.contentTypeDetection.detectedType} (${finalBlogPost.contentTypeDetection.confidence}% confidence)`,
    );

    // 2. Update database with final version
    const finalVersion = await prisma.blogPost.update({
      where: { id: blogPost.id },
      data: {
        title: finalBlogPost.blogPost.metadata.title,
        content: finalBlogPost.blogPost.content.content,
        metaDescription: finalBlogPost.blogPost.metadata.metaDescription,
        excerpt: finalBlogPost.blogPost.content.excerpt,
        wordCount: finalBlogPost.blogPost.metadata.wordCount,
        seoScore: finalBlogPost.seoAnalysis.score,
        readabilityScore: 85, // Would come from readability analysis
        status: 'PENDING_REVIEW',
      },
    });

    // ===== WORKFLOW SUMMARY =====
    console.log('\n🎉 WORKFLOW COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📊 Final Results Summary:');
    console.log(`• Blog Post ID: ${finalVersion.id}`);
    console.log(`• Title: "${finalVersion.title}"`);
    console.log(`• Word Count: ${finalVersion.wordCount}`);
    console.log(`• SEO Score: ${finalVersion.seoScore}/100`);
    console.log(`• Status: ${finalVersion.status}`);
    console.log(
      `• Target Keywords: ${contentStrategy.targetKeywords.join(', ')}`,
    );

    console.log('\n🔧 Process Metrics:');
    console.log(`• Topics researched: ${topicResearch.topics.length}`);
    console.log(
      `• Competitors analyzed: ${competitorAnalysis.competitors.length}`,
    );
    console.log(
      `• Content sections generated: ${multiSectionResult.sections.length}`,
    );
    console.log(`• SEO recommendations: ${seoAnalysis.recommendations.length}`);
    console.log(`• Quick wins applied: ${seoAnalysis.quickWins.length}`);
    console.log(`• Versions created: 3 (draft, optimized, final)`);

    console.log('\n🚀 Workflow Benefits:');
    console.log(
      '✓ Strategic topic selection based on research and competition',
    );
    console.log('✓ Comprehensive content covering identified gaps');
    console.log('✓ Advanced multi-section generation with fact-checking');
    console.log('✓ Professional SEO analysis with DataForSEO integration');
    console.log('✓ Automated optimization of quick wins');
    console.log('✓ Version control and workflow management');
    console.log('✓ Quality gates and approval processes');
    console.log('✓ End-to-end content creation and optimization');

    console.log('\n💡 Next Steps:');
    console.log('1. Review and approve the content in the workflow system');
    console.log('2. Implement remaining SEO recommendations');
    console.log('3. Schedule publication and promotion');
    console.log('4. Monitor performance and iterate based on results');

    // Generate improvement roadmap
    const roadmap =
      await seoAnalysisService.generateSEOImprovementRoadmap(seoAnalysis);

    console.log('\n🗺️  SEO Improvement Roadmap:');
    console.log(`• Remaining quick wins: ${roadmap.quickWins.length}`);
    console.log(`• Short-term improvements: ${roadmap.shortTerm.length}`);
    console.log(`• Long-term optimizations: ${roadmap.longTerm.length}`);
    console.log(`• Expected impact: ${roadmap.estimatedImpact}% improvement`);

    return {
      blogPost: finalVersion,
      seoAnalysis,
      contentStrategy,
      topicResearch,
      competitorAnalysis,
      multiSectionResult,
      workflowEntry,
      roadmap,
    };
  } catch (error) {
    console.error('❌ Workflow Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use in other modules
export { completeWorkflowDemo };

// Run the demo if called directly
if (require.main === module) {
  completeWorkflowDemo()
    .then(result => {
      console.log('\n🎯 Workflow completed successfully!');
      console.log(`Final blog post created with ID: ${result.blogPost.id}`);
    })
    .catch(console.error);
}
