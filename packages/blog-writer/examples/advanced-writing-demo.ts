

/**
 * Week 7-8 Advanced Writing Features Demo
 * Comprehensive demonstration of multi-section generation, tone consistency, 
 * fact-checking, and content optimization features
 */

import { openai } from 'ai';
import { PrismaClient } from '@prisma/client';

// Import all advanced writing services
import {
  AdvancedWritingService,
  MultiSectionGenerationService,
  ToneStyleConsistencyService,
  FactCheckingService,
  ContentOptimizationService,
  
  // Types
  ComprehensiveWritingRequest,
  BrandVoiceProfile,
  StreamingCallback,
  SectionType,
  ToneCategory,
  OptimizationCategory
} from '../src';

const model = openai('gpt-4');
const prisma = new PrismaClient();

async function demonstrateAdvancedWriting() {
  console.log('🚀 Advanced Writing Features Demo');
  console.log('==================================\n');

  // Initialize the unified advanced writing service
  const advancedWritingService = new AdvancedWritingService({
    model,
    prisma,
    cacheResults: true,
    cacheTTL: 2, // 2 hours
    services: {
      enableMultiSection: true,
      enableToneStyle: true,
      enableFactChecking: true,
      enableOptimization: true
    }
  });

  // Example 1: Complete advanced content generation
  await demonstrateComprehensiveGeneration(advancedWritingService);
  
  // Example 2: Individual service features
  await demonstrateIndividualServices();
  
  // Example 3: Brand voice consistency
  await demonstrateBrandVoiceFeatures(advancedWritingService);
  
  // Example 4: Batch processing
  await demonstrateBatchProcessing(advancedWritingService);
  
  console.log('\n✅ Advanced Writing Demo Complete!');
}

async function demonstrateComprehensiveGeneration(service: AdvancedWritingService) {
  console.log('📝 Comprehensive Content Generation');
  console.log('----------------------------------');

  // Define brand voice profile
  const brandVoice: BrandVoiceProfile = {
    id: 'tech-brand-voice',
    name: 'Tech-Friendly Professional',
    description: 'Professional yet approachable tone for technology content',
    primaryTone: ToneCategory.PROFESSIONAL,
    secondaryTones: [ToneCategory.FRIENDLY, ToneCategory.INFORMATIVE],
    personalityTraits: {
      authority: 0.8,
      approachability: 0.7,
      expertise: 0.9,
      enthusiasm: 0.6,
      clarity: 0.9
    },
    vocabularyLevel: 'intermediate',
    formalityLevel: 0.7,
    examples: [
      'We believe technology should empower everyone',
      'Let\'s dive into how this works',
      'This approach offers several key advantages'
    ],
    prohibited: [
      'Obviously',
      'It\'s simple',
      'Just do this',
      'Clearly'
    ],
    guidelines: [
      'Always explain technical concepts clearly',
      'Use active voice when possible',
      'Include practical examples',
      'Be encouraging and supportive'
    ]
  };

  // Streaming callbacks for real-time updates
  const callbacks: StreamingCallback = {
    onOutlineGenerated: (outline) => {
      console.log(`📋 Outline created: ${outline.sections.length} sections`);
    },
    
    onSectionGenerated: (section, index, total) => {
      console.log(`✍️  Section ${index}/${total}: ${section.title} (${section.wordCount} words)`);
    },
    
    onToneAnalyzed: (analysis) => {
      console.log(`🎭 Tone analysis: ${analysis.primaryTone} (${(analysis.confidence * 100).toFixed(1)}% confidence)`);
    },
    
    onFactChecked: (factCheck, remaining) => {
      console.log(`🔍 Fact-checked: "${factCheck.claim.slice(0, 50)}..." Status: ${factCheck.verificationStatus} (${remaining} remaining)`);
    },
    
    onOptimizationGenerated: (suggestion) => {
      console.log(`💡 Optimization: ${suggestion.category} - ${suggestion.title} (Impact: ${suggestion.impact})`);
    },
    
    onProgress: (phase, progress) => {
      console.log(`⏳ ${phase}: ${progress}%`);
    },
    
    onError: (error, phase) => {
      console.error(`❌ Error in ${phase}: ${error.message}`);
    }
  };

  // Comprehensive writing request
  const request: ComprehensiveWritingRequest = {
    topic: 'The Future of Artificial Intelligence in Content Creation',
    targetLength: 2000,
    contentType: 'article',
    targetAudience: 'Content creators and marketing professionals',
    
    // Multi-section generation options
    generateOutline: true,
    contextAwareness: true,
    includeTransitions: true,
    
    // Tone and style options
    targetTone: 'professional',
    targetStyle: 'informative',
    brandVoice,
    maintainConsistency: true,
    
    // Fact-checking options
    enableFactChecking: true,
    verificationThreshold: 0.8,
    requireReliableSources: true,
    autoDetectClaims: true,
    
    // Optimization options
    targetKeywords: [
      'artificial intelligence content',
      'AI content creation',
      'content automation',
      'future of writing'
    ],
    optimizationCategories: [
      'SEO',
      'READABILITY',
      'ENGAGEMENT',
      'STRUCTURE'
    ],
    prioritizeHighImpact: true,
    includeABTestSuggestions: true,
    
    // Quality requirements
    minQualityScore: 0.8,
    maxIterations: 3,
    
    // Advanced options
    streamResults: true,
    generateReport: true
  };

  try {
    console.log('\n🎯 Starting comprehensive content generation...\n');
    
    const result = await service.generateAdvancedContent(request, callbacks);
    
    console.log('\n📊 Generation Results:');
    console.log(`✅ Success: ${result.success}`);
    console.log(`⏱️  Processing Time: ${result.processingTime}ms`);
    console.log(`📝 Sections Generated: ${result.sections.length}`);
    console.log(`🎭 Tone Consistency: ${((result.toneAnalysis?.consistencyScore || 0) * 100).toFixed(1)}%`);
    console.log(`🔍 Fact Checks: ${result.factChecks?.length || 0}`);
    console.log(`💡 Optimization Suggestions: ${result.optimizationSuggestions?.length || 0}`);
    console.log(`⭐ Overall Quality Score: ${((result.metrics.overallQualityScore || 0) * 100).toFixed(1)}%`);
    
    if (result.warnings && result.warnings.length > 0) {
      console.log(`⚠️  Warnings: ${result.warnings.join(', ')}`);
    }

    // Generate insights report
    const insights = await service.generateInsightsReport(result.blogPostId);
    console.log('\n📈 Content Insights:');
    console.log(`Overall Score: ${insights.overallScore.toFixed(1)}/100`);
    console.log('Quality Breakdown:');
    Object.entries(insights.qualityBreakdown).forEach(([key, value]) => {
      console.log(`  ${key}: ${value.toFixed(1)}%`);
    });
    
  } catch (error) {
    console.error('❌ Comprehensive generation failed:', error);
  }
}

async function demonstrateIndividualServices() {
  console.log('\n🔧 Individual Service Features');
  console.log('------------------------------');

  // 1. Multi-Section Generation Service
  console.log('\n1️⃣  Multi-Section Content Generation');
  
  const multiSectionService = new MultiSectionGenerationService({
    model,
    prisma,
    cacheResults: true
  });

  try {
    // Create detailed outline
    const outline = await multiSectionService.createOutline({
      topic: 'Sustainable Web Development Practices',
      targetLength: 1500,
      contentType: 'tutorial',
      targetAudience: 'Web developers',
      keyPoints: [
        'Performance optimization',
        'Green hosting solutions',
        'Efficient coding practices',
        'Sustainable design patterns'
      ],
      seoKeywords: ['sustainable web development', 'green coding', 'eco-friendly websites'],
      tone: 'educational',
      style: 'practical'
    });

    console.log(`📋 Created outline with ${outline.sections.length} sections`);
    outline.sections.forEach((section, index) => {
      console.log(`  ${index + 1}. ${section.title} (${section.type}, ${section.estimatedWordCount} words)`);
    });

    // Generate content with context awareness
    const generationResult = await multiSectionService.generateMultiSectionContent({
      outline,
      generationOptions: {
        tone: 'educational',
        style: 'practical',
        targetAudience: 'Web developers',
        maintainConsistency: true,
        seoOptimized: true,
        includeTransitions: true
      },
      contextAwareness: true
    });

    console.log(`✍️  Generated ${generationResult.sections.length} sections`);
    console.log(`⏱️  Total time: ${generationResult.metrics.totalGenerationTime}ms`);
    console.log(`🧠 Coherence score: ${(generationResult.metrics.coherenceScore * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('Multi-section generation failed:', error);
  }

  // 2. Tone & Style Consistency Service
  console.log('\n2️⃣  Tone & Style Consistency Analysis');
  
  const toneStyleService = new ToneStyleConsistencyService({
    model,
    prisma
  });

  try {
    const sampleContent = `
    Artificial intelligence is transforming how we create content. This revolutionary technology 
    offers unprecedented opportunities for content creators. However, it's essential to understand 
    both the benefits and challenges. Let's explore how AI can enhance your creative workflow 
    while maintaining authenticity and quality.
    `;

    // Perform comprehensive tone analysis
    const toneAnalysis = await toneStyleService.analyzeTone({
      blogPostId: 'demo-post-1',
      content: sampleContent,
      analysisDepth: 'comprehensive'
    });

    console.log(`🎭 Primary tone: ${toneAnalysis.primaryTone}`);
    console.log(`🎯 Confidence: ${(toneAnalysis.confidence * 100).toFixed(1)}%`);
    console.log(`📊 Formality: ${(toneAnalysis.formalityScore * 100).toFixed(1)}%`);
    console.log(`😊 Emotion: ${toneAnalysis.emotionalTone} (${(toneAnalysis.emotionIntensity * 100).toFixed(1)}%)`);
    
    // Perform style check
    const styleCheck = await toneStyleService.performStyleCheck({
      blogPostId: 'demo-post-1',
      checkConsistency: true,
      includeSuggestions: true
    });

    console.log(`📝 Style compliance: ${(styleCheck.complianceScore * 100).toFixed(1)}%`);
    console.log(`📏 Avg sentence length: ${styleCheck.sentenceLength.toFixed(1)} words`);
    console.log(`📖 Reading level: ${styleCheck.readingLevel}`);
    console.log(`💬 Passive voice: ${(styleCheck.passiveVoiceScore * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('Tone analysis failed:', error);
  }

  // 3. Fact-Checking Service
  console.log('\n3️⃣  Fact-Checking & Source Verification');
  
  const factCheckingService = new FactCheckingService({
    model,
    prisma
  });

  try {
    const factCheckResult = await factCheckingService.performFactCheck({
      blogPostId: 'demo-post-2',
      claims: [
        'OpenAI released GPT-4 in March 2023',
        'Machine learning algorithms can achieve 99% accuracy in image recognition',
        'Over 50% of businesses plan to implement AI in content creation by 2025'
      ],
      verificationThreshold: 0.7,
      includeSourceAnalysis: true,
      requireReliableSources: true
    });

    console.log(`🔍 Fact-checked ${factCheckResult.length} claims`);
    factCheckResult.forEach((check, index) => {
      console.log(`  ${index + 1}. "${check.claim.slice(0, 50)}..."`);
      console.log(`     Status: ${check.verificationStatus}`);
      console.log(`     Confidence: ${((check.confidenceScore || 0) * 100).toFixed(1)}%`);
      console.log(`     Sources: ${check.sourcesVerified} (${check.sourcesReliable} reliable)`);
    });

    // Generate fact-checking report
    const report = await factCheckingService.generateFactCheckReport('demo-post-2');
    console.log(`📊 Overall accuracy score: ${(report.overallScore * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('Fact-checking failed:', error);
  }

  // 4. Content Optimization Service
  console.log('\n4️⃣  Content Optimization');
  
  const optimizationService = new ContentOptimizationService({
    model,
    prisma
  });

  try {
    const optimizationResult = await optimizationService.optimizeContent({
      blogPostId: 'demo-post-3',
      targetKeywords: ['content optimization', 'SEO best practices', 'writing improvement'],
      categories: [OptimizationCategory.SEO, OptimizationCategory.READABILITY, OptimizationCategory.ENGAGEMENT],
      prioritizeHighImpact: true,
      maxSuggestions: 10,
      includeImplementationGuide: true
    });

    console.log(`💡 Generated ${optimizationResult.suggestions.length} optimization suggestions`);
    console.log('📈 Top suggestions:');
    optimizationResult.prioritizedActions.slice(0, 3).forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion.title} (${suggestion.impact} impact, ${suggestion.effort} effort)`);
      console.log(`     ${suggestion.description}`);
    });

    console.log('\n🚀 Implementation Guide:');
    console.log(`Quick Wins: ${optimizationResult.implementationGuide.quickWins.length} tasks`);
    console.log(`Medium Effort: ${optimizationResult.implementationGuide.mediumEffort.length} tasks`);
    console.log(`High Impact: ${optimizationResult.implementationGuide.highImpact.length} tasks`);

  } catch (error) {
    console.error('Optimization failed:', error);
  }
}

async function demonstrateBrandVoiceFeatures(service: AdvancedWritingService) {
  console.log('\n🎨 Brand Voice Consistency Features');
  console.log('-----------------------------------');

  const toneStyleService = new ToneStyleConsistencyService({
    model,
    prisma
  });

  // Create brand voice profile from examples
  const brandExamples = [
    "Welcome to our innovative platform! We're excited to help you transform your content creation process.",
    "Our team believes in making powerful technology accessible to everyone. That's why we've designed our tools to be intuitive and user-friendly.",
    "Ready to take your content to the next level? Let's explore what's possible together.",
    "We understand that every creator has unique needs. Our flexible solutions adapt to your specific requirements."
  ];

  try {
    console.log('🏗️  Creating brand voice profile from examples...');
    
    const brandVoice = await toneStyleService.createBrandVoiceProfile(
      brandExamples,
      'Innovation-Focused Brand Voice'
    );

    console.log(`✅ Created brand voice: ${brandVoice.name}`);
    console.log(`🎭 Primary tone: ${brandVoice.primaryTone}`);
    console.log(`🎯 Personality traits: ${Object.keys(brandVoice.personalityTraits).join(', ')}`);
    console.log(`📚 Vocabulary level: ${brandVoice.vocabularyLevel}`);
    
    // Test content adjustment to brand voice
    const testContent = `
    This is a technical document about our software platform. The system processes data efficiently 
    and provides comprehensive analytics. Users can configure various parameters to optimize performance.
    The implementation follows industry standards and best practices.
    `;

    console.log('\n🔄 Adjusting content to match brand voice...');
    
    const adjustmentResult = await toneStyleService.adjustContentToBrandVoice(
      testContent,
      brandVoice,
      true // preserve structure
    );

    console.log(`📊 Alignment improvement: ${adjustmentResult.alignmentScore.toFixed(2)}`);
    console.log(`🔧 Changes made: ${adjustmentResult.changes.length}`);
    
    adjustmentResult.changes.forEach((change, index) => {
      console.log(`  ${index + 1}. ${change.type}: "${change.original}" → "${change.adjusted}"`);
      console.log(`     Reason: ${change.reason}`);
    });

  } catch (error) {
    console.error('Brand voice features failed:', error);
  }
}

async function demonstrateBatchProcessing(service: AdvancedWritingService) {
  console.log('\n📦 Batch Processing Features');
  console.log('----------------------------');

  // Define multiple content requests
  const batchRequests: ComprehensiveWritingRequest[] = [
    {
      topic: 'Introduction to Machine Learning',
      targetLength: 1000,
      contentType: 'tutorial',
      targetKeywords: ['machine learning basics', 'ML tutorial'],
      enableFactChecking: true,
      generateOutline: true
    },
    {
      topic: 'Benefits of Cloud Computing',
      targetLength: 800,
      contentType: 'article',
      targetKeywords: ['cloud computing benefits', 'cloud advantages'],
      enableFactChecking: false,
      generateOutline: true
    },
    {
      topic: 'Cybersecurity Best Practices',
      targetLength: 1200,
      contentType: 'guide',
      targetKeywords: ['cybersecurity tips', 'security best practices'],
      enableFactChecking: true,
      generateOutline: true
    }
  ];

  try {
    console.log(`🚀 Processing ${batchRequests.length} content pieces in batch...`);
    
    const batchResults = await service.batchProcess(batchRequests, {
      concurrency: 2,
      onProgress: (completed, total) => {
        console.log(`⏳ Progress: ${completed}/${total} completed`);
      },
      onError: (error, index) => {
        console.error(`❌ Error in request ${index}: ${error.message}`);
      }
    });

    console.log('\n📊 Batch Results Summary:');
    batchResults.forEach((result, index) => {
      console.log(`${index + 1}. ${batchRequests[index].topic}`);
      console.log(`   Success: ${result.success ? '✅' : '❌'}`);
      console.log(`   Sections: ${result.sections.length}`);
      console.log(`   Quality: ${((result.metrics.overallQualityScore || 0) * 100).toFixed(1)}%`);
      console.log(`   Time: ${result.processingTime}ms`);
    });

    const successfulResults = batchResults.filter(r => r.success);
    const avgQuality = successfulResults.reduce((sum, r) => sum + (r.metrics.overallQualityScore || 0), 0) / successfulResults.length;
    const totalTime = batchResults.reduce((sum, r) => sum + r.processingTime, 0);

    console.log('\n📈 Overall Statistics:');
    console.log(`Success Rate: ${(successfulResults.length / batchResults.length * 100).toFixed(1)}%`);
    console.log(`Average Quality: ${(avgQuality * 100).toFixed(1)}%`);
    console.log(`Total Processing Time: ${totalTime}ms`);

  } catch (error) {
    console.error('Batch processing failed:', error);
  }
}

// Advanced usage example: Custom workflow
async function demonstrateCustomWorkflow() {
  console.log('\n⚙️  Custom Advanced Writing Workflow');
  console.log('------------------------------------');

  const advancedService = new AdvancedWritingService({
    model,
    prisma
  });

  try {
    // Step 1: Generate initial content
    console.log('1️⃣  Generating initial content...');
    const initialResult = await advancedService.generateAdvancedContent({
      topic: 'The Evolution of Web Development',
      targetLength: 1500,
      generateOutline: true,
      enableFactChecking: false, // Skip fact-checking for initial draft
      targetKeywords: ['web development evolution', 'frontend frameworks', 'modern web tech']
    });

    if (!initialResult.success) {
      throw new Error('Initial content generation failed');
    }

    // Step 2: Enhance with fact-checking
    console.log('2️⃣  Adding fact-checking to content...');
    const enhancedResult = await advancedService.enhanceExistingContent(
      initialResult.blogPostId,
      {
        performFactCheck: true,
        analyzeTone: true,
        optimizeContent: true,
        targetKeywords: ['web development evolution', 'frontend frameworks', 'modern web tech']
      }
    );

    // Step 3: Generate comprehensive insights
    console.log('3️⃣  Generating insights report...');
    const insights = await advancedService.generateInsightsReport(initialResult.blogPostId);

    console.log('\n📊 Final Results:');
    console.log(`Content Quality: ${insights.overallScore.toFixed(1)}/100`);
    console.log(`Fact Accuracy: ${insights.qualityBreakdown.factualAccuracy.toFixed(1)}%`);
    console.log(`SEO Score: ${insights.qualityBreakdown.seoOptimization.toFixed(1)}%`);
    console.log(`Readability: ${insights.qualityBreakdown.readability.toFixed(1)}%`);

    console.log('\n🎯 Key Recommendations:');
    insights.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

  } catch (error) {
    console.error('Custom workflow failed:', error);
  }
}

// Run the demo
async function main() {
  try {
    await demonstrateAdvancedWriting();
  } catch (error) {
    console.error('Demo failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export {
  demonstrateAdvancedWriting,
  demonstrateIndividualServices,
  demonstrateBrandVoiceFeatures,
  demonstrateBatchProcessing,
  demonstrateCustomWorkflow
};

