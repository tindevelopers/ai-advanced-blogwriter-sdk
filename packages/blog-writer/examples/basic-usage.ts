
import { openai } from '@ai-sdk/openai';
import { generateBlog, researchTopic, analyzeSEO } from '../src';
import type { BlogTemplate } from '../src/types';

/**
 * Basic blog generation example
 */
async function basicBlogGeneration() {
  try {
    console.log('🚀 Generating blog post...');
    
    const result = await generateBlog({
      model: openai('gpt-4'),
      topic: 'How to Start a Successful Blog in 2024',
      template: 'howto' as BlogTemplate,
      keywords: ['blogging', 'start blog', 'blogging tips', 'blog success'],
      wordCount: { min: 1500, max: 2500 },
      tone: 'friendly',
      audience: 'beginner bloggers',
      seo: {
        focusKeyword: 'start blog',
        metaDescription: 'Learn how to start a successful blog in 2024 with our comprehensive guide.',
        includeToC: true,
      },
    });
    
    console.log('✅ Blog generated successfully!');
    console.log(`Title: ${result.blogPost.metadata.title}`);
    console.log(`Word count: ${result.metadata.wordCount}`);
    console.log(`Template: ${result.metadata.template}`);
    console.log(`Generation time: ${result.metadata.generationTime}ms`);
    
    if (result.suggestions) {
      console.log('\n📝 Suggestions:');
      result.suggestions.forEach((suggestion, i) => {
        console.log(`${i + 1}. ${suggestion}`);
      });
    }
    
    return result.blogPost;
  } catch (error) {
    console.error('❌ Error generating blog:', error);
    throw error;
  }
}

/**
 * Content research example
 */
async function contentResearchExample() {
  try {
    console.log('🔍 Researching content topic...');
    
    const research = await researchTopic(openai('gpt-4'), {
      topic: 'Artificial Intelligence in Healthcare',
      keywords: ['AI healthcare', 'medical AI', 'healthcare technology'],
      depth: 'detailed',
      audience: 'healthcare professionals',
      includeTrends: true,
      includeCompetitors: true,
    });
    
    console.log('✅ Research completed!');
    console.log(`Topic: ${research.topic}`);
    console.log(`Key concepts: ${research.overview.keyConcepts.slice(0, 3).join(', ')}...`);
    console.log(`Primary keywords: ${research.keywords.primary.slice(0, 3).map(k => k.keyword).join(', ')}...`);
    console.log(`Content opportunities: ${research.opportunities.gaps.length} gaps identified`);
    
    if (research.competitors) {
      console.log(`Competitor analysis: ${research.competitors.topContent.length} competitors analyzed`);
    }
    
    return research;
  } catch (error) {
    console.error('❌ Error researching content:', error);
    throw error;
  }
}

/**
 * SEO optimization example
 */
async function seoOptimizationExample() {
  try {
    console.log('🎯 Analyzing SEO...');
    
    // First generate a blog post
    const blogResult = await generateBlog({
      model: openai('gpt-4'),
      topic: 'Best Practices for Remote Work',
      template: 'guide',
      keywords: ['remote work', 'work from home', 'remote team'],
    });
    
    // Then analyze its SEO
    const seoAnalysis = await analyzeSEO(openai('gpt-4'), blogResult.blogPost);
    
    console.log('✅ SEO analysis completed!');
    console.log(`Overall SEO score: ${seoAnalysis.score}/100`);
    console.log(`Title score: ${seoAnalysis.components.title}/100`);
    console.log(`Content score: ${seoAnalysis.components.keywords}/100`);
    console.log(`Recommendations: ${seoAnalysis.recommendations.length} found`);
    
    // Show top recommendations
    const criticalRecs = seoAnalysis.recommendations.filter(r => r.type === 'critical');
    if (criticalRecs.length > 0) {
      console.log('\n🚨 Critical recommendations:');
      criticalRecs.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec.message} (Impact: ${rec.impact})`);
      });
    }
    
    return seoAnalysis;
  } catch (error) {
    console.error('❌ Error analyzing SEO:', error);
    throw error;
  }
}

/**
 * Template-based generation example
 */
async function templateBasedGeneration() {
  try {
    console.log('📄 Generating different template types...');
    
    const templates: { name: BlogTemplate; topic: string }[] = [
      { name: 'howto', topic: 'How to Build a Personal Brand Online' },
      { name: 'listicle', topic: '10 Essential Tools for Digital Marketers' },
      { name: 'comparison', topic: 'WordPress vs Ghost: Which Blogging Platform is Better?' },
      { name: 'review', topic: 'Notion Review: Is It the Best Productivity App?' },
    ];
    
    const results = [];
    
    for (const template of templates) {
      console.log(`Generating ${template.name}: ${template.topic}`);
      
      const result = await generateBlog({
        model: openai('gpt-4'),
        topic: template.topic,
        template: template.name,
        wordCount: { min: 800, max: 1500 },
      });
      
      results.push(result);
      console.log(`✅ ${template.name} completed (${result.metadata.wordCount} words)`);
    }
    
    console.log(`\n🎉 Generated ${results.length} blog posts with different templates!`);
    return results;
  } catch (error) {
    console.error('❌ Error generating templates:', error);
    throw error;
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('🔧 AI SDK Blog Writer - Examples');
  console.log('================================\n');
  
  try {
    // Basic generation
    await basicBlogGeneration();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Content research
    await contentResearchExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // SEO optimization
    await seoOptimizationExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Template-based generation
    await templateBasedGeneration();
    
    console.log('\n🎉 All examples completed successfully!');
  } catch (error) {
    console.error('💥 Example execution failed:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}

export {
  basicBlogGeneration,
  contentResearchExample,
  seoOptimizationExample,
  templateBasedGeneration,
  runExamples,
};
