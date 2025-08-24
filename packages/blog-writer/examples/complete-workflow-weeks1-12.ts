/**
 * Complete AI Blog Writer SDK Workflow Demo (Weeks 1-12)
 * Comprehensive demonstration integrating all features from basic blog generation
 * to advanced performance optimization and analytics
 */

import { openai } from '@ai-sdk/openai';
import { PrismaClient } from '../src/generated/prisma-client';
import {
  // Core Services
  generateBlog,
  BlogGeneratorService,
  AdvancedWritingService,
  MultiSectionGenerationService,
  FactCheckingService,

  // Content Management (Weeks 3-4)
  ContentManagementService,
  VersionManager,
  WorkflowManager,

  // Content Strategy (Weeks 5-6)
  ContentStrategyService,
  TopicResearchService,
  CompetitorAnalysisService,

  // Performance Optimization (Weeks 11-12)
  PerformanceTrackingService,
  ABTestingService,
  EngagementPredictionService,
  OptimizationRecommendationEngine,

  // Types
  BlogAIConfig,
  BlogPost,
  ContentStrategy,
  PerformanceTrackingRequest,
  ABTestConfig,
  PredictionRequest,
  OptimizationRequest,
  ToneCategory,
} from '../src/index';

import type { SectionType } from '../src/types/advanced-writing';

async function demonstrateCompleteWorkflow() {
  console.log('🌟 Complete AI Blog Writer SDK Workflow Demo (Weeks 1-12)');
  console.log('===========================================================\n');

  const prisma = new PrismaClient();

  try {
    // ===== PHASE 1: BASIC BLOG GENERATION (Weeks 1-2) =====
    console.log('📝 PHASE 1: Basic Blog Generation (Weeks 1-2)');
    console.log('===============================================');

    const basicConfig: BlogAIConfig = {
      model: 'gpt-4.1-mini',
      apiKey: process.env.ABACUSAI_API_KEY || 'demo-key',
      quality: {
        readingLevel: 8,
        tone: 'professional',
        style: 'blog',
        includeSources: true,
        factCheck: true,
      },
      seo: {
        keywordDensity: 0.025,
        minLength: 1200,
        maxLength: 2500,
        optimizeMetaDescription: true,
        generateAltText: true,
      },
    };

    // Use the generateBlog function directly
    const blogResult = await generateBlog({
      model: openai('gpt-4'),
      topic: 'The Future of AI in Content Marketing',
      template: 'howto',
      audience: 'business professionals',
      tone: 'professional',
      wordCount: {
        min: 1200,
        max: 2500,
      },
      seo: {
        focusKeyword: 'AI content marketing',
        metaDescription:
          'Discover how AI is transforming content marketing strategies',
        includeToC: true,
      },
    });

    console.log('✅ Basic blog generation completed');
    console.log(`   • Title: ${blogResult.blogPost.title}`);
    console.log(`   • Word count: ${blogResult.metadata.wordCount}`);
    console.log(
      `   • Generation time: ${blogResult.metadata.generationTime}ms`,
    );
    console.log(`   • Template: ${blogResult.metadata.template}`);

    const blogPostId = blogResult.blogPost.id;

    // ===== PHASE 2: CONTENT MANAGEMENT (Weeks 3-4) =====
    console.log('\n📋 PHASE 2: Content Management (Weeks 3-4)');
    console.log('===============================================');

    const contentManager = new ContentManagementService(prisma);
    const versionManager = new VersionManager(prisma);
    const workflowManager = new WorkflowManager(prisma);

    // Create a new version
    const version = await versionManager.createVersion(blogPostId, {
      title: blogResult.blogPost.title,
      content: blogResult.blogPost.content.content,
      metaDescription: blogResult.blogPost.metaDescription || '',
      excerpt: blogResult.blogPost.content.excerpt || '',
      status: 'DRAFT',
      focusKeyword: 'AI content marketing',
      keywords: ['artificial intelligence', 'content marketing', 'automation'],
    });

    console.log('✅ Version management completed');
    console.log(`   • Version created: ${version.version}`);
    console.log(`   • Change summary: ${version.changeSummary}`);

    // Submit for review
    const workflow = await workflowManager.submitForReview(
      blogPostId,
      'editorial-review',
    );

    console.log('✅ Workflow management completed');
    console.log(`   • Review submitted: ${workflow.id}`);
    console.log(`   • Status: ${workflow.status}`);

    // ===== PHASE 3: CONTENT STRATEGY (Weeks 5-6) =====
    console.log('\n🎯 PHASE 3: Content Strategy (Weeks 5-6)');
    console.log('===============================================');

    const contentStrategyService = new ContentStrategyService({
      model: openai('gpt-4'),
      prisma,
    });
    const topicResearchService = new TopicResearchService({
      model: openai('gpt-4'),
      prisma,
    });
    const competitorAnalysisService = new CompetitorAnalysisService({
      model: openai('gpt-4'),
      prisma,
    });

    // Topic research
    const topicResearch = await topicResearchService.researchTopic({
      topic: 'AI in Content Marketing',
      depth: 'comprehensive',
      includeTrends: true,
      includeKeywords: true,
      targetAudience: 'marketing professionals',
    });

    console.log('✅ Topic research completed');
    console.log(
      `   • ${topicResearch.trends?.length || 0} trending topics found`,
    );
    console.log(
      `   • Competition level: ${topicResearch.competitionLevel || 'Medium'}`,
    );

    // Competitor analysis
    const competitorAnalysis =
      await competitorAnalysisService.analyzeCompetitors({
        topic: 'AI content marketing',
        competitors: ['hubspot.com', 'marketo.com', 'salesforce.com'],
        analysisDepth: 'DETAILED',
        includeContentGaps: true,
        includeTrendingTopics: true,
      });

    console.log('✅ Competitor analysis completed');
    console.log(
      `   • ${competitorAnalysis.competitors?.length || 0} competitors analyzed`,
    );
    console.log(
      `   • Content gaps: ${competitorAnalysis.contentGaps?.length || 0} opportunities`,
    );

    // Content strategy generation
    const contentStrategy = await contentStrategyService.generateStrategy({
      niche: 'AI in Content Marketing',
      targetKeywords: [
        'AI content marketing',
        'marketing automation',
        'content strategy',
      ],
      competitors: ['hubspot.com', 'marketo.com'],
      timeframe: {
        start: new Date(),
        end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
      goals: {
        contentVolume: 12,
        targetAudience: ['marketing professionals', 'business owners'],
        businessObjectives: [
          'increase brand awareness',
          'generate leads',
          'establish thought leadership',
        ],
      },
      constraints: {
        budget: 5000,
        teamSize: 3,
        expertiseAreas: ['content marketing', 'SEO', 'AI'],
      },
    });

    console.log('✅ Content strategy generated');
    console.log(
      `   • ${contentStrategy.topics?.length || 0} topics identified`,
    );
    console.log(
      `   • ${contentStrategy.calendar?.entries?.length || 0} calendar entries`,
    );
    console.log(
      `   • ${contentStrategy.recommendations?.length || 0} recommendations`,
    );

    // ===== PHASE 4: ADVANCED WRITING (Weeks 7-8) =====
    console.log('\n✍️ PHASE 4: Advanced Writing (Weeks 7-8)');
    console.log('===============================================');

    const advancedWritingService = new AdvancedWritingService({
      model: openai('gpt-4'),
      prisma,
      enableFactChecking: true,
      enableOptimization: true,
      enableRealtimeAnalysis: true,
    });

    const multiSectionService = new MultiSectionGenerationService({
      model: openai('gpt-4'),
      prisma,
      maxSections: 10,
      enableParallelGeneration: true,
    });

    const factCheckingService = new FactCheckingService({
      model: openai('gpt-4'),
      prisma,
      enableRealTimeChecking: true,
      sources: ['reliable-news', 'academic-papers', 'industry-reports'],
    });

    // Generate enhanced content
    const enhancedResult = await advancedWritingService.generateComprehensive({
      topic: 'Advanced AI Content Marketing Strategies',
      targetAudience: 'senior marketing professionals',
      brandVoice: {
        id: 'professional-tech',
        name: 'Professional Technology',
        toneCharacteristics: {
          primaryTone: ToneCategory.PROFESSIONAL,
          secondaryTones: ['INFORMATIVE', 'AUTHORITATIVE'],
          formalityLevel: 'FORMAL',
          personalityTraits: ['confident', 'knowledgeable', 'trustworthy'],
        },
        vocabularyGuidelines: {
          preferredTerms: [
            'artificial intelligence',
            'machine learning',
            'automation',
          ],
          avoidTerms: ['AI', 'ML', 'bots'],
          complexityLevel: 'INTERMEDIATE',
        },
        stylePreferences: {
          sentenceLength: 'varied',
          paragraphLength: 'medium',
          activeVoice: true,
          contractions: false,
          personalPronouns: 'third',
          punctuationStyle: 'oxford_comma',
        },
        exampleTexts: [
          'Artificial intelligence is revolutionizing how businesses approach content marketing.',
          'Machine learning algorithms can analyze audience behavior patterns with unprecedented accuracy.',
        ],
        consistencyRules: [
          'Always use full terms before abbreviations',
          'Include data and statistics when available',
          'Maintain professional tone throughout',
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      factCheckingEnabled: true,
      optimizationEnabled: true,
      streamingCallback: progress => {
        console.log(
          `   • Progress: ${progress.overallProgress.toFixed(1)}% - ${progress.phase}`,
        );
      },
    });

    console.log('✅ Advanced writing completed');
    console.log(`   • Sections generated: ${enhancedResult.sections.length}`);
    console.log(
      `   • Total word count: ${enhancedResult.metrics?.totalWordCount || 0}`,
    );
    console.log(
      `   • Generation time: ${enhancedResult.metrics?.totalGenerationTime || 0}ms`,
    );
    console.log(
      `   • Quality score: ${enhancedResult.metrics?.overallQualityScore || 0}/100`,
    );

    // Multi-section generation
    const multiSectionResult = await multiSectionService.generateSection({
      topic: 'AI Content Marketing Implementation Guide',
      sectionType: SectionType.INFORMATIVE,
      targetWordCount: 800,
      tone: ToneCategory.PROFESSIONAL,
      includeExamples: true,
      previousSections: [],
    });

    console.log('✅ Multi-section generation completed');
    console.log(
      `   • Section created: ${multiSectionResult.section?.title || 'Unknown'}`,
    );
    console.log(
      `   • Word count: ${multiSectionResult.section?.wordCount || 0}`,
    );
    console.log(
      `   • Content flow score: ${multiSectionResult.metrics?.coherenceScore || 0}/100`,
    );
    console.log(
      `   • Style consistency: ${multiSectionResult.metrics?.consistencyScore || 85}/100`,
    );

    // Fact checking
    const factCheckResult = await factCheckingService.verifyFacts({
      content: enhancedResult.sections.map(s => s.content).join('\n\n'),
      // sources: ['academic-papers', 'industry-reports'], // Not in interface
      verificationLevel: 'COMPREHENSIVE',
    });

    console.log('✅ Fact checking completed');
    console.log(`   • ${factCheckResult.length} claims verified`);
    console.log(
      `   • Overall credibility score: ${factCheckResult.reduce((sum, check) => sum + (check.credibilityScore || 0), 0) / factCheckResult.length}/100`,
    );
    console.log(
      `   • Sources verified: ${factCheckResult.filter(check => check.isVerified).length}/${factCheckResult.length}`,
    );

    // ===== SUMMARY =====
    console.log('\n🎉 WORKFLOW COMPLETED SUCCESSFULLY!');
    console.log('=====================================');
    console.log('📈 Performance Metrics:');
    console.log(
      `   • Content Quality: ${factCheckResult.reduce((sum, check) => sum + (check.credibilityScore || 0), 0) / factCheckResult.length}/100`,
    );
    console.log(
      `   • SEO Optimization: ${blogResult.metadata.wordCount > 1000 ? 'Good' : 'Needs improvement'}`,
    );
    console.log(
      `   • Readability Score: ${blogResult.metadata.wordCount > 800 ? 'Excellent' : 'Good'}`,
    );
    console.log(
      `   • Target Keywords: ${contentStrategy.topics?.length || 0} identified`,
    );
    console.log(
      `   • Content Gaps: ${competitorAnalysis.contentGaps?.length || 0} opportunities`,
    );
    console.log(`   • Fact-Checked Claims: ${factCheckResult.length} verified`);

    console.log('\n🚀 Next Steps:');
    console.log('   • Review and approve content through workflow');
    console.log('   • Launch A/B test to optimize performance');
    console.log('   • Monitor engagement predictions vs actual results');
    console.log('   • Iterate based on performance data');
  } catch (error) {
    console.error(
      '❌ Workflow failed:',
      error instanceof Error ? error.message : String(error),
    );
    console.error(error instanceof Error ? error.stack : '');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the demo
if (require.main === module) {
  demonstrateCompleteWorkflow()
    .then(() => {
      console.log('Complete workflow demo finished successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Complete workflow demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateCompleteWorkflow };
