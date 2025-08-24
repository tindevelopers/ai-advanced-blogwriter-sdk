/**
 * Week 9-10 SEO Analysis Engine Demo
 * Demonstrates DataForSEO integration, keyword research, on-page optimization,
 * meta/schema generation, and readability scoring
 */

import { openai } from 'ai';
import {
  SEOAnalysisService,
  KeywordResearchService,
  OnPageSEOService,
  MetaSchemaService,
  ReadabilityScoringService,
  DataForSEOService,
} from '../src/index';
import type {
  DataForSEOConfig,
  SEOAnalysisRequest,
  SEOAnalysisOptions,
  KeywordResearchRequest,
} from '../src/types/seo-engine';

// Example configuration (replace with your actual credentials)
const dataForSEOConfig: DataForSEOConfig = {
  username: 'your_dataforseo_username',
  password: 'your_dataforseo_password',
  apiKey: 'your_dataforseo_api_key',
  baseUrl: 'https://api.dataforseo.com/v3',
  rateLimit: 100,
  cacheTTL: 60,
  fallbackMode: true,
};

const model = openai('gpt-4-turbo');

async function demonstrateSEOAnalysisEngine() {
  console.log('🚀 Week 9-10 SEO Analysis Engine Demo\n');

  // Initialize the unified SEO Analysis Service
  const seoAnalysisService = new SEOAnalysisService({
    model,
    dataForSEOConfig,
    defaultOrganization: {
      name: 'My Company',
      logo: 'https://i.pinimg.com/736x/63/3e/18/633e1807d6dc80d05409a6dee1b67795.jpg',
      url: 'https://example.com',
    },
    defaultSite: {
      name: 'My Blog',
      url: 'https://myblog.com',
      twitterHandle: '@myblog',
    },
    cacheResults: true,
    qualityGates: {
      minimumScore: 70,
      minimumReadability: 60,
      minimumContentLength: 300,
      requireMetaDescription: true,
      requireKeywordOptimization: true,
    },
  });

  // Example blog post content
  const blogPostContent = {
    title: 'The Ultimate Guide to SEO Optimization in 2024',
    content: `
# The Ultimate Guide to SEO Optimization in 2024

Search Engine Optimization (SEO) has evolved significantly over the years. In this comprehensive guide, we'll explore the latest strategies and techniques for achieving better search rankings.

## What is SEO?

SEO stands for Search Engine Optimization. It's the practice of optimizing your website and content to improve visibility in search engine results pages (SERPs).

### Key SEO Factors in 2024

1. **Content Quality**: High-quality, relevant content remains the foundation of good SEO
2. **Technical SEO**: Site speed, mobile optimization, and crawlability
3. **User Experience**: Core Web Vitals and overall user satisfaction
4. **E-A-T**: Expertise, Authoritativeness, and Trustworthiness

## Advanced SEO Techniques

### Keyword Research and Optimization

Effective keyword research involves understanding search intent and finding the right balance between search volume and competition.

### On-Page Optimization

- Title tags and meta descriptions
- Header structure (H1, H2, H3)
- Internal linking
- Image optimization

### Technical SEO

Technical SEO ensures that search engines can properly crawl and index your website:

- XML sitemaps
- Robot.txt files
- Schema markup
- Page speed optimization

## Measuring SEO Success

Track your SEO performance using:
- Google Analytics
- Google Search Console
- Third-party SEO tools
- Rank tracking software

## Conclusion

SEO is an ongoing process that requires consistent effort and adaptation to algorithm changes. By focusing on quality content, technical excellence, and user experience, you can achieve sustainable search visibility.
    `,
    metaDescription:
      'Learn the latest SEO optimization strategies and techniques for 2024. Complete guide covering keyword research, on-page SEO, technical optimization, and performance tracking.',
    excerpt:
      'A comprehensive guide to modern SEO optimization strategies and best practices for improving search engine rankings in 2024.',
    author: { name: 'SEO Expert', email: 'expert@example.com' },
    publishDate: '2024-01-15T10:00:00Z',
    image:
      'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgqJw1snE3ik77x1gM4eVtdBp8wl5wd9L1JIUEh9d8X4yfS1j272pNMZlZw7UuX1s4QwQ_Zz8nlBBCqNX1tJooOeYIhC_Z-vb5J-uGPzjKj3YWoECpznuX1aKPC_-Bgz-qxK62z7JocDTQ9q301gAjVHuoAtcG-q2i-taSPyjadorC7PhM6jrZ08RIU/s602/THE%20DIGITAL%20PHADI.jpg',
    category: 'SEO',
  };

  try {
    // 1. Individual Service Demonstrations
    console.log('📊 1. DataForSEO Service Integration\n');

    // Check DataForSEO connection status
    const connectionStatus = seoAnalysisService.getDataForSEOStatus();
    console.log('DataForSEO Connection Status:', connectionStatus);

    console.log('\n🔍 2. Keyword Research Service\n');

    const keywordResearchService = new KeywordResearchService({
      model,
      dataForSEOConfig,
      cacheResults: true,
    });

    const keywordRequest: KeywordResearchRequest = {
      seedKeywords: [
        'seo optimization',
        'search engine optimization',
        'seo guide',
      ],
      maxResults: 20,
      includeVariations: true,
      includeLongTail: true,
      competitorAnalysis: true,
      language: 'en',
      location: 'us',
    };

    const keywordResults =
      await keywordResearchService.performKeywordResearch(keywordRequest);
    console.log(`Found ${keywordResults.keywords.length} keywords`);
    console.log('Top 5 Keywords:');
    keywordResults.keywords.slice(0, 5).forEach((keyword, index) => {
      console.log(
        `  ${index + 1}. "${keyword.keyword}" - Vol: ${keyword.searchVolume}, Difficulty: ${keyword.difficulty.score}`,
      );
    });

    if (keywordResults.clusters.length > 0) {
      console.log(`\n📦 Keyword Clusters: ${keywordResults.clusters.length}`);
      keywordResults.clusters.forEach((cluster, index) => {
        console.log(
          `  ${index + 1}. ${cluster.name} (${cluster.keywords.length} keywords)`,
        );
      });
    }

    console.log('\n📄 3. On-Page SEO Analysis\n');

    const onPageService = new OnPageSEOService({
      model,
      cacheResults: true,
    });

    const onPageAnalysis = await onPageService.analyzeOnPageSEO({
      content: blogPostContent.content,
      title: blogPostContent.title,
      metaDescription: blogPostContent.metaDescription,
      targetKeywords: ['seo optimization', 'search engine optimization'],
      images: [
        {
          src: 'https://mangools.com/blog/wp-content/uploads/2024/10/12-SEO-Trends-That-Cant-Be-Ignored-Infographic-by-SerpLogic-3-1-scaled.webp',
          alt: 'SEO optimization guide',
        },
        {
          src: 'https://lh7-us.googleusercontent.com/K-Ym7bwPxfyMbb4l75dDaS_rEH7pemhhM_KW66C4NI9mMwJjNfks6W5XaJsRv9mpJfaVKSPs_Z9hcOsnno3aj4-4bCx7p6SOcAXnKu_J0SjQxI7jZGLLzmKLHEpZC3OFUa3cyWA9edqGeMsxMTIXSRE',
        }, // Missing alt text
      ],
      links: [
        {
          href: '/blog/keyword-research',
          text: 'keyword research guide',
          internal: true,
        },
        {
          href: 'https://google.com/search-console',
          text: 'Google Search Console',
          internal: false,
        },
      ],
    });

    console.log(`Overall On-Page Score: ${onPageAnalysis.overallScore}/100`);
    console.log(`Title Score: ${onPageAnalysis.title.score}/100`);
    console.log(`Content Score: ${onPageAnalysis.content.score}/100`);
    console.log(
      `Meta Description Score: ${onPageAnalysis.metaDescription.score}/100`,
    );

    if (onPageAnalysis.recommendations.length > 0) {
      console.log('\nTop Recommendations:');
      onPageAnalysis.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(
          `  ${index + 1}. ${rec.title} (${rec.priority} priority, ${rec.impact}% impact)`,
        );
      });
    }

    console.log('\n🏷️  4. Meta Tags & Schema Generation\n');

    const metaSchemaService = new MetaSchemaService({
      model,
      defaultOrganization: {
        name: 'My Company',
        logo: 'https://i.ytimg.com/vi/0FIH9ehOyKE/maxresdefault.jpg',
        url: 'https://example.com',
      },
      defaultSite: {
        name: 'My Blog',
        url: 'https://myblog.com',
        twitterHandle: '@myblog',
      },
    });

    const metaTags = await metaSchemaService.generateMetaTags({
      title: blogPostContent.title,
      content: blogPostContent.content,
      excerpt: blogPostContent.excerpt,
      author: blogPostContent.author,
      publishDate: blogPostContent.publishDate,
      image: blogPostContent.image,
      url: 'https://myblog.com/seo-optimization-guide-2024',
      keywords: ['seo optimization', 'search engine optimization', 'seo guide'],
      category: blogPostContent.category,
    });

    console.log('Generated Meta Tags:');
    console.log(`  Title: ${metaTags.title}`);
    console.log(`  Description: ${metaTags.description}`);
    console.log(`  OG Title: ${metaTags.openGraph.title}`);
    console.log(`  Twitter Card: ${metaTags.twitterCard.card}`);

    const schemaMarkup = await metaSchemaService.generateSchemaMarkup({
      contentType: 'article',
      title: blogPostContent.title,
      description: blogPostContent.excerpt!,
      author: blogPostContent.author.name,
      publishDate: blogPostContent.publishDate,
      image: blogPostContent.image,
      url: 'https://myblog.com/seo-optimization-guide-2024',
    });

    console.log('\nGenerated Schema Types:');
    console.log(`  Article Schema: ✓`);
    if (schemaMarkup.breadcrumb) console.log(`  Breadcrumb Schema: ✓`);
    if (schemaMarkup.faq) console.log(`  FAQ Schema: ✓`);
    if (schemaMarkup.howTo) console.log(`  HowTo Schema: ✓`);

    console.log('\n📖 5. Readability & Content Quality\n');

    const readabilityService = new ReadabilityScoringService({
      model,
      targetAudience: 'general',
      contentType: 'blog',
    });

    const readabilityMetrics = await readabilityService.analyzeReadability({
      content: blogPostContent.content,
      targetAudience: 'general',
      includeSuggestions: true,
    });

    console.log('Readability Metrics:');
    console.log(
      `  Flesch-Kincaid Grade: ${readabilityMetrics.fleschKincaidGrade.toFixed(1)}`,
    );
    console.log(
      `  Reading Ease: ${readabilityMetrics.fleschReadingEase.toFixed(1)}`,
    );
    console.log(
      `  Reading Level: ${readabilityMetrics.readingLevel.description}`,
    );
    console.log(
      `  Target Audience: ${readabilityMetrics.readingLevel.audience}`,
    );

    const contentQuality = await readabilityService.calculateContentQuality({
      title: blogPostContent.title,
      content: blogPostContent.content,
      targetKeywords: ['seo optimization', 'search engine optimization'],
      targetAudience: 'general',
      contentType: 'blog',
      images: 2,
      links: { internal: 1, external: 1 },
    });

    console.log(`\nContent Quality Score: ${contentQuality.overall}/100`);
    console.log('Component Scores:');
    Object.entries(contentQuality.components).forEach(([component, score]) => {
      console.log(`  ${component}: ${score}/100`);
    });

    // 2. Comprehensive SEO Analysis
    console.log('\n🎯 6. Comprehensive SEO Analysis\n');

    const analysisRequest: SEOAnalysisRequest = {
      blogPostId: 'demo_blog_post_123', // In real usage, this would be an actual blog post ID
      url: 'https://myblog.com/seo-optimization-guide-2024',
      content: blogPostContent.content,
      targetKeywords: [
        'seo optimization',
        'search engine optimization',
        'seo guide',
      ],
      competitorUrls: [
        'https://competitor1.com/seo-guide',
        'https://competitor2.com/seo-optimization',
      ],
    };

    const analysisOptions: SEOAnalysisOptions = {
      includeKeywordResearch: true,
      includeCompetitorAnalysis: true,
      includeSchemaGeneration: true,
      includeReadabilityAnalysis: true,
      includeMetaGeneration: true,
      useDataForSEO: true,
      prioritizeQuickWins: true,
      targetAudience: 'general',
      contentType: 'blog',
    };

    // Set up streaming callbacks to show progress
    const streamingCallbacks = {
      onProgress: (step: string, progress: number) => {
        console.log(`  ${step}: ${progress}%`);
      },
      onKeywordAnalysis: (keywords: any[]) => {
        console.log(`  ✓ Analyzed ${keywords.length} keywords`);
      },
      onOnPageAnalysis: (analysis: any) => {
        console.log(`  ✓ On-page score: ${analysis.overallScore}/100`);
      },
      onMetaGeneration: (metaTags: any) => {
        console.log(`  ✓ Generated meta tags and social media tags`);
      },
      onSchemaGeneration: (schema: any) => {
        console.log(`  ✓ Generated structured data markup`);
      },
      onReadabilityAnalysis: (metrics: any) => {
        console.log(
          `  ✓ Reading grade level: ${metrics.fleschKincaidGrade.toFixed(1)}`,
        );
      },
      onComplete: (result: any) => {
        console.log(
          `\n🎉 Analysis Complete! Overall SEO Score: ${result.overallScore}/100`,
        );
      },
    };

    const comprehensiveAnalysis = await seoAnalysisService.analyzeSEO(
      analysisRequest,
      analysisOptions,
      streamingCallbacks,
    );

    // Display comprehensive results
    console.log('\n📊 Final Analysis Results:');
    console.log('=========================');
    console.log(`Overall SEO Score: ${comprehensiveAnalysis.overallScore}/100`);
    console.log(`Processing Time: ${comprehensiveAnalysis.processingTime}ms`);
    console.log(`Data Source: ${comprehensiveAnalysis.dataSource}`);

    console.log('\nCategory Scores:');
    Object.entries(comprehensiveAnalysis.categoryScores).forEach(
      ([category, score]) => {
        console.log(`  ${category}: ${score}/100`);
      },
    );

    console.log(
      `\nKeywords Analyzed: ${comprehensiveAnalysis.keywordAnalysis.length}`,
    );
    console.log(
      `Recommendations: ${comprehensiveAnalysis.recommendations.length}`,
    );
    console.log(`Quick Wins: ${comprehensiveAnalysis.quickWins.length}`);

    // Display top recommendations
    if (comprehensiveAnalysis.recommendations.length > 0) {
      console.log('\n🎯 Top 5 SEO Recommendations:');
      comprehensiveAnalysis.recommendations
        .slice(0, 5)
        .forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec.title}`);
          console.log(
            `     Priority: ${rec.priority}, Impact: ${rec.impact}%, Effort: ${rec.effort}`,
          );
          console.log(`     ${rec.description}`);
          console.log('');
        });
    }

    // Display quick wins
    if (comprehensiveAnalysis.quickWins.length > 0) {
      console.log('⚡ Quick Wins (Easy, High Impact):');
      comprehensiveAnalysis.quickWins.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.title} (${rec.timeframe})`);
      });
      console.log('');
    }

    // 3. SEO Improvement Roadmap
    console.log('🗺️  7. SEO Improvement Roadmap\n');

    const roadmap = await seoAnalysisService.generateSEOImprovementRoadmap(
      comprehensiveAnalysis,
    );

    console.log(`Quick Wins (${roadmap.quickWins.length} items):`);
    roadmap.quickWins.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.title} - ${item.timeframe}`);
    });

    console.log(`\nShort-term (${roadmap.shortTerm.length} items):`);
    roadmap.shortTerm.slice(0, 3).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.title} - ${item.timeframe}`);
    });

    console.log(`\nLong-term (${roadmap.longTerm.length} items):`);
    roadmap.longTerm.slice(0, 3).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.title} - ${item.timeframe}`);
    });

    console.log(`\nEstimated Overall Impact: ${roadmap.estimatedImpact}%`);

    // 4. Quick SEO Health Check
    console.log('\n🩺 8. Quick SEO Health Check\n');

    const healthCheck = await seoAnalysisService.quickSEOHealthCheck(
      analysisRequest.blogPostId,
    );

    console.log(`SEO Health Score: ${healthCheck.score}/100`);
    if (healthCheck.issues.length > 0) {
      console.log('\nIssues Found:');
      healthCheck.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }

    if (healthCheck.recommendations.length > 0) {
      console.log('\nRecommendations:');
      healthCheck.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    console.log('\n✅ SEO Analysis Engine Demo Complete!');
    console.log('\nKey Features Demonstrated:');
    console.log('• DataForSEO API integration with fallback mechanisms');
    console.log('• Comprehensive keyword research and clustering');
    console.log('• On-page SEO analysis and optimization');
    console.log('• Meta tags and schema markup generation');
    console.log('• Readability and content quality scoring');
    console.log('• Unified SEO analysis with streaming callbacks');
    console.log('• SEO improvement roadmap generation');
    console.log('• Quick health check capabilities');
  } catch (error) {
    console.error('❌ SEO Analysis Demo Error:', error);

    // Demonstrate fallback capabilities
    console.log('\n🔄 Demonstrating Fallback Capabilities...');

    // Even without DataForSEO, the system can still provide AI-powered analysis
    const fallbackAnalysis = await seoAnalysisService.analyzeSEO(
      analysisRequest,
      { ...analysisOptions, useDataForSEO: false },
      {
        onProgress: (step, progress) => console.log(`  ${step}: ${progress}%`),
      },
    );

    console.log(
      `\n✅ Fallback Analysis Complete! Score: ${fallbackAnalysis.overallScore}/100`,
    );
    console.log(
      'Fallback systems ensure continuous functionality even when external APIs are unavailable.',
    );
  }
}

// Run the demo
if (require.main === module) {
  demonstrateSEOAnalysisEngine().catch(console.error);
}

export { demonstrateSEOAnalysisEngine };
