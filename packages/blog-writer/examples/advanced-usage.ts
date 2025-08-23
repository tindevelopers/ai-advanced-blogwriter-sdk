
import { openai } from '@ai-sdk/openai';
import { 
  generateBlog, 
  researchTopic, 
  analyzeSEO, 
  optimizeSEO,
  ContentResearcher,
  SEOOptimizer,
  BLOG_TEMPLATES 
} from '../src';

/**
 * Advanced blog generation with research integration
 */
async function advancedBlogGeneration() {
  try {
    console.log('🧠 Advanced blog generation with integrated research...');
    
    const topic = 'The Future of Sustainable Energy Technologies';
    const model = openai('gpt-4');
    
    // Step 1: Research the topic
    console.log('🔍 Step 1: Researching topic...');
    const research = await researchTopic(model, {
      topic,
      depth: 'comprehensive',
      audience: 'technology enthusiasts and investors',
      includeTrends: true,
      includeCompetitors: true,
      keywords: ['sustainable energy', 'renewable technology', 'clean energy future'],
    });
    
    console.log(`✅ Research completed: ${research.keywords.primary.length} primary keywords found`);
    
    // Step 2: Generate blog with research data
    console.log('📝 Step 2: Generating blog with research insights...');
    const blogResult = await generateBlog({
      model,
      topic,
      template: 'guide',
      keywords: research.keywords.primary.slice(0, 5).map(k => k.keyword),
      wordCount: { min: 2000, max: 3500 },
      tone: 'authoritative',
      audience: research.overview.summary.includes('professional') ? 'professionals' : 'general',
      research: {
        overview: research.overview,
        keywords: research.keywords,
        opportunities: research.opportunities,
      },
      seo: {
        focusKeyword: research.keywords.primary[0]?.keyword,
        includeToC: true,
      },
    });
    
    console.log(`✅ Blog generated: ${blogResult.metadata.wordCount} words`);
    
    // Step 3: SEO optimization
    console.log('🎯 Step 3: SEO optimization...');
    const seoResult = await optimizeSEO(model, blogResult.blogPost, {
      keywords: {
        primary: research.keywords.primary[0]?.keyword || topic,
        secondary: research.keywords.primary.slice(1, 4).map(k => k.keyword),
      },
      content: {
        wordCount: { min: 2000, max: 3500 },
        readingLevel: 10,
        optimizeHeadings: true,
        tableOfContents: true,
      },
      meta: {
        title: true,
        description: true,
        slug: true,
      },
      images: {
        altText: true,
      },
    });
    
    console.log(`✅ SEO analysis completed: Score ${seoResult.analysis.score}/100`);
    
    if (seoResult.optimizedPost) {
      console.log(`🔧 Applied ${seoResult.optimizationsApplied.length} optimizations`);
    }
    
    return {
      research,
      originalBlog: blogResult,
      seoAnalysis: seoResult,
    };
  } catch (error) {
    console.error('❌ Error in advanced generation:', error);
    throw error;
  }
}

/**
 * Multi-template content series generation
 */
async function generateContentSeries() {
  try {
    console.log('📚 Generating content series...');
    
    const seriesTopic = 'Complete Guide to Digital Marketing';
    const model = openai('gpt-4');
    
    // Research the main topic
    const mainResearch = await researchTopic(model, {
      topic: seriesTopic,
      depth: 'comprehensive',
      includeCompetitors: true,
    });
    
    // Define series structure
    const seriesStructure = [
      { template: 'guide', topic: 'Digital Marketing Fundamentals: A Complete Guide', keywords: ['digital marketing basics', 'marketing fundamentals'] },
      { template: 'howto', topic: 'How to Create Your First Digital Marketing Strategy', keywords: ['marketing strategy', 'digital marketing plan'] },
      { template: 'listicle', topic: '15 Essential Digital Marketing Tools Every Marketer Needs', keywords: ['marketing tools', 'digital marketing software'] },
      { template: 'comparison', topic: 'Google Ads vs Facebook Ads: Which Platform Delivers Better ROI?', keywords: ['google ads', 'facebook ads', 'advertising comparison'] },
      { template: 'case-study', topic: 'How a Startup Grew 500% Using Content Marketing', keywords: ['content marketing case study', 'startup growth'] },
    ];
    
    const seriesResults = [];
    
    for (let i = 0; i < seriesStructure.length; i++) {
      const item = seriesStructure[i];
      console.log(`📄 Generating article ${i + 1}/${seriesStructure.length}: ${item.topic}`);
      
      const result = await generateBlog({
        model,
        topic: item.topic,
        template: item.template as any,
        keywords: [...item.keywords, ...mainResearch.keywords.primary.slice(0, 2).map(k => k.keyword)],
        wordCount: { min: 1200, max: 2500 },
        tone: 'professional',
        audience: 'marketing professionals and business owners',
        context: `This is part ${i + 1} of a ${seriesStructure.length}-part series on ${seriesTopic}. Reference other parts when relevant.`,
      });
      
      seriesResults.push({
        partNumber: i + 1,
        template: item.template,
        result,
      });
      
      console.log(`✅ Part ${i + 1} completed (${result.metadata.wordCount} words)`);
    }
    
    console.log(`🎉 Content series completed: ${seriesResults.length} articles generated`);
    
    // Generate series overview
    const totalWords = seriesResults.reduce((sum, item) => sum + item.result.metadata.wordCount, 0);
    const avgScore = seriesResults.reduce((sum, item) => sum + (item.result.blogPost.suggestions?.length || 0), 0) / seriesResults.length;
    
    console.log(`📊 Series Statistics:`);
    console.log(`   Total words: ${totalWords.toLocaleString()}`);
    console.log(`   Average suggestions per article: ${avgScore.toFixed(1)}`);
    console.log(`   Templates used: ${[...new Set(seriesResults.map(r => r.template))].join(', ')}`);
    
    return seriesResults;
  } catch (error) {
    console.error('❌ Error generating content series:', error);
    throw error;
  }
}

/**
 * Custom template creation and usage
 */
async function customTemplateExample() {
  try {
    console.log('🎨 Creating custom template...');
    
    const customTemplate = {
      type: 'product-launch',
      name: 'Product Launch Announcement',
      description: 'Template for announcing new product launches',
      structure: [
        {
          id: 'announcement',
          title: 'Product Announcement',
          order: 1,
          required: true,
          contentType: 'paragraph',
          prompt: 'Create an exciting announcement about the new product launch.',
          wordCount: { min: 100, max: 200 }
        },
        {
          id: 'features',
          title: 'Key Features',
          order: 2,
          required: true,
          contentType: 'list',
          prompt: 'Highlight the main features and benefits of the product.',
          wordCount: { min: 300, max: 500 }
        },
        {
          id: 'pricing',
          title: 'Pricing and Availability',
          order: 3,
          required: true,
          contentType: 'paragraph',
          prompt: 'Provide pricing information and availability details.',
          wordCount: { min: 150, max: 250 }
        },
        {
          id: 'cta',
          title: 'Call to Action',
          order: 4,
          required: true,
          contentType: 'paragraph',
          prompt: 'Include a strong call to action for interested customers.',
          wordCount: { min: 50, max: 100 }
        }
      ],
      variables: {
        productName: { name: 'productName', type: 'string', description: 'Name of the product', required: true },
        launchDate: { name: 'launchDate', type: 'string', description: 'Product launch date', required: true },
        price: { name: 'price', type: 'string', description: 'Product price', required: true },
      },
      seoSettings: {
        wordCount: { min: 600, max: 1200 },
        keywordDensity: { min: 0.015, max: 0.025 }
      }
    };
    
    console.log(`✅ Custom template created: ${customTemplate.name}`);
    
    // Use custom template (Note: In real implementation, you'd need to register this template)
    const result = await generateBlog({
      model: openai('gpt-4'),
      topic: 'Introducing the Revolutionary AI Writing Assistant',
      template: 'guide', // Using guide template as custom isn't registered
      templateVariables: {
        productName: 'AI Writing Assistant Pro',
        launchDate: 'March 2024',
        price: '$29.99/month',
      },
      keywords: ['AI writing tool', 'writing assistant', 'content creation'],
      wordCount: customTemplate.seoSettings.wordCount,
    });
    
    console.log(`✅ Blog generated using custom template approach`);
    console.log(`   Title: ${result.blogPost.metadata.title}`);
    console.log(`   Word count: ${result.metadata.wordCount}`);
    
    return { customTemplate, result };
  } catch (error) {
    console.error('❌ Error with custom template:', error);
    throw error;
  }
}

/**
 * Batch SEO analysis for multiple posts
 */
async function batchSEOAnalysis() {
  try {
    console.log('📊 Batch SEO analysis...');
    
    const model = openai('gpt-4');
    const optimizer = new SEOOptimizer(model);
    
    // Generate multiple blog posts
    const topics = [
      'Best Practices for Remote Team Management',
      'Essential Tools for Web Developers in 2024',
      'How to Create Engaging Social Media Content',
    ];
    
    const posts = [];
    for (const topic of topics) {
      const result = await generateBlog({
        model,
        topic,
        template: 'howto',
        keywords: [topic.toLowerCase().replace(/[^\w\s]/g, '').split(' ').slice(0, 3).join(' ')],
      });
      posts.push(result.blogPost);
    }
    
    console.log(`✅ Generated ${posts.length} posts for analysis`);
    
    // Analyze each post
    const analyses = [];
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`🔍 Analyzing post ${i + 1}: ${post.metadata.title}`);
      
      const analysis = await optimizer.analyze(post);
      analyses.push({
        post,
        analysis,
        index: i + 1,
      });
    }
    
    // Generate batch report
    console.log('\n📈 Batch SEO Analysis Report:');
    console.log('=' .repeat(50));
    
    const avgScore = analyses.reduce((sum, a) => sum + a.analysis.score, 0) / analyses.length;
    console.log(`Average SEO Score: ${avgScore.toFixed(1)}/100`);
    
    analyses.forEach(({ post, analysis, index }) => {
      console.log(`\n${index}. ${post.metadata.title}`);
      console.log(`   SEO Score: ${analysis.score}/100`);
      console.log(`   Word Count: ${analysis.content.wordCount}`);
      console.log(`   Critical Issues: ${analysis.recommendations.filter(r => r.type === 'critical').length}`);
      console.log(`   Total Recommendations: ${analysis.recommendations.length}`);
    });
    
    // Find best and worst performing posts
    const bestPost = analyses.reduce((best, current) => 
      current.analysis.score > best.analysis.score ? current : best
    );
    const worstPost = analyses.reduce((worst, current) => 
      current.analysis.score < worst.analysis.score ? current : worst
    );
    
    console.log(`\n🏆 Best performing: "${bestPost.post.metadata.title}" (${bestPost.analysis.score}/100)`);
    console.log(`⚠️  Needs improvement: "${worstPost.post.metadata.title}" (${worstPost.analysis.score}/100)`);
    
    return analyses;
  } catch (error) {
    console.error('❌ Error in batch SEO analysis:', error);
    throw error;
  }
}

/**
 * Run advanced examples
 */
async function runAdvancedExamples() {
  console.log('🚀 AI SDK Blog Writer - Advanced Examples');
  console.log('=========================================\n');
  
  try {
    // Advanced generation
    await advancedBlogGeneration();
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Content series
    await generateContentSeries();
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Custom template
    await customTemplateExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Batch SEO analysis
    await batchSEOAnalysis();
    
    console.log('\n🎉 All advanced examples completed successfully!');
  } catch (error) {
    console.error('💥 Advanced example execution failed:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAdvancedExamples();
}

export {
  advancedBlogGeneration,
  generateContentSeries,
  customTemplateExample,
  batchSEOAnalysis,
  runAdvancedExamples,
};
