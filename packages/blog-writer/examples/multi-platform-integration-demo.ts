/**
 * Comprehensive Multi-Platform Integration Example
 * Demonstrates using all platform adapters together including new Shopify and Webflow adapters
 */

import {
  MultiPlatformPublisher,
  WordPressAdapter,
  MediumAdapter,
  LinkedInAdapter,
  ShopifyAdapter,
  WebflowAdapter,
  createPlatformCredentials,
  PlatformAdapterFactory,
  getAllPlatforms,
} from '../src/index';

import type {
  BlogPost,
  WordPressCredentials,
  MediumCredentials,
  LinkedInCredentials,
  ShopifyCredentials,
  WebflowCredentials,
  MultiPlatformPublishOptions,
} from '../src/index';

/**
 * Complete Multi-Platform Publishing Example
 */
async function comprehensiveMultiPlatformExample() {
  console.log('=== Comprehensive Multi-Platform Publishing ===');

  // Initialize multi-platform publisher
  const multiPublisher = new MultiPlatformPublisher({
    maxConcurrentPublishes: 3,
    enableAnalytics: true,
    enableHealthMonitoring: true,
  });

  // 1. Set up all platform adapters
  console.log('\n1. Setting up platform adapters...');

  // WordPress adapter
  const wordpressAdapter = new WordPressAdapter({
    siteUrl: 'https://myblog.com',
    isWordPressCom: false,
  });

  const wordpressCredentials: WordPressCredentials = {
    type: 'application_password',
    username: 'admin',
    password: 'your_application_password',
    siteUrl: 'https://myblog.com',
  };

  // Medium adapter
  const mediumAdapter = new MediumAdapter();
  const mediumCredentials: MediumCredentials = {
    type: 'integration_token',
    integrationToken: 'your_medium_integration_token',
  };

  // LinkedIn adapter
  const linkedinAdapter = new LinkedInAdapter();
  const linkedinCredentials: LinkedInCredentials = {
    type: 'oauth2',
    accessToken: 'your_linkedin_access_token',
    personId: 'your_linkedin_person_id',
  };

  // Shopify adapter
  const shopifyAdapter = new ShopifyAdapter({
    storeUrl: 'mystore.myshopify.com',
    apiVersion: '2024-01',
  });

  const shopifyCredentials: ShopifyCredentials = {
    type: 'private_app',
    storeUrl: 'mystore.myshopify.com',
    accessToken: 'your_shopify_access_token',
  };

  // Webflow adapter
  const webflowAdapter = new WebflowAdapter({
    siteId: 'your_webflow_site_id',
    apiVersion: 'v1',
  });

  const webflowCredentials: WebflowCredentials = {
    type: 'api_token',
    apiToken: 'your_webflow_api_token',
    siteId: 'your_webflow_site_id',
  };

  try {
    // Add all platforms to multi-publisher
    await multiPublisher.addPlatform(
      wordpressAdapter,
      createPlatformCredentials('wordpress', wordpressCredentials),
    );

    await multiPublisher.addPlatform(
      mediumAdapter,
      createPlatformCredentials('medium', mediumCredentials),
    );

    await multiPublisher.addPlatform(
      linkedinAdapter,
      createPlatformCredentials('linkedin', linkedinCredentials),
    );

    await multiPublisher.addPlatform(
      shopifyAdapter,
      createPlatformCredentials('shopify', shopifyCredentials),
    );

    await multiPublisher.addPlatform(
      webflowAdapter,
      createPlatformCredentials('webflow', webflowCredentials),
    );

    console.log('✅ All platform adapters configured');

    // 2. Create comprehensive blog post
    const blogPost: BlogPost = {
      title:
        'The Evolution of E-commerce: From Storefronts to Digital Experiences',
      content: `
        The world of commerce has undergone a dramatic transformation over the past decade. What started as simple online storefronts has evolved into sophisticated digital ecosystems that blend technology, design, and customer experience.
        
        ## The Digital Commerce Revolution
        
        E-commerce has moved far beyond basic product listings and shopping carts. Today's successful online businesses create immersive experiences that rival physical retail environments.
        
        ### Key Transformation Areas
        
        **1. User Experience Design**
        Modern e-commerce platforms prioritize intuitive navigation, visual storytelling, and seamless interactions. The focus has shifted from feature-heavy interfaces to clean, purposeful design that guides customers naturally through their journey.
        
        **2. Mobile-First Approach**
        With mobile commerce accounting for over 50% of online sales, responsive design isn't optional—it's essential. Progressive web apps and native mobile experiences are setting new standards for performance and usability.
        
        **3. Personalization at Scale**
        Advanced algorithms now deliver personalized product recommendations, dynamic pricing, and customized content that adapts to individual user behavior and preferences.
        
        ## Platform Evolution Spotlight
        
        ### Shopify's Rise
        Shopify has democratized e-commerce by making professional online stores accessible to businesses of all sizes. Key innovations include:
        
        - **Headless Commerce**: Decoupling frontend and backend for ultimate flexibility
        - **App Ecosystem**: Thousands of integrations for specialized functionality  
        - **Multi-channel Selling**: Unified inventory across web, mobile, social, and physical locations
        - **Advanced Analytics**: Deep insights into customer behavior and sales patterns
        
        ### Design-Centric Platforms
        Platforms like Webflow have revolutionized how we think about e-commerce design:
        
        - **Visual Development**: Build complex layouts without coding limitations
        - **CMS Integration**: Seamlessly blend content marketing with product sales
        - **Brand Consistency**: Maintain design integrity across all touchpoints
        - **Performance Optimization**: Built-in speed and SEO optimizations
        
        ## The Content Commerce Connection
        
        Modern e-commerce success relies heavily on content strategy:
        
        ### Educational Content
        - Product guides and tutorials
        - Industry insights and trends
        - Customer success stories
        - Behind-the-scenes content
        
        ### SEO and Discovery
        - Long-tail keyword targeting
        - Featured snippets optimization
        - Local SEO for multi-location businesses
        - Voice search optimization
        
        ### Social Proof Integration
        - Customer reviews and ratings
        - User-generated content
        - Influencer partnerships
        - Community building
        
        ## Technology Stack Considerations
        
        The modern e-commerce technology stack includes:
        
        **Frontend Technologies**
        - React/Vue.js for dynamic interfaces
        - Progressive Web App capabilities
        - Advanced CSS frameworks
        - WebGL for 3D product visualization
        
        **Backend Infrastructure**
        - Headless CMS solutions
        - API-first architecture
        - Microservices design
        - Cloud-native scaling
        
        **Analytics and Optimization**
        - Real-time performance monitoring
        - A/B testing frameworks
        - Customer journey mapping
        - Conversion rate optimization tools
        
        ## Emerging Trends to Watch
        
        ### Artificial Intelligence Integration
        - Chatbots for customer service
        - Visual search capabilities
        - Automated inventory management
        - Predictive analytics for demand forecasting
        
        ### Augmented Reality Experiences
        - Virtual try-on features
        - 3D product visualization
        - AR-powered room planning
        - Interactive product demonstrations
        
        ### Sustainable Commerce
        - Carbon-neutral shipping options
        - Sustainable packaging solutions
        - Circular economy models
        - Transparency in supply chains
        
        ## Building for the Future
        
        Successful e-commerce businesses focus on:
        
        1. **Customer-Centric Design**: Every decision should improve the customer experience
        2. **Platform Flexibility**: Choose solutions that can evolve with your business
        3. **Data-Driven Decisions**: Use analytics to guide strategy and optimization
        4. **Omnichannel Integration**: Create seamless experiences across all touchpoints
        5. **Performance Excellence**: Fast loading times and reliable functionality are non-negotiable
        
        ## Conclusion
        
        The e-commerce landscape continues to evolve rapidly, driven by changing consumer expectations and advancing technology. Businesses that embrace modern platforms, prioritize user experience, and maintain flexibility in their technical approach will be best positioned for long-term success.
        
        The future of commerce lies not just in selling products online, but in creating digital experiences that engage, educate, and inspire customers throughout their journey. Whether you're building on Shopify, designing with Webflow, or developing custom solutions, the principles of great user experience, performance, and customer value remain constant.
      `,
      excerpt:
        'Explore how e-commerce has evolved from basic online stores to sophisticated digital experiences, and discover the platforms and strategies driving modern online business success.',
      tags: [
        'e-commerce',
        'digital transformation',
        'web design',
        'online business',
        'technology',
        'shopify',
        'webflow',
      ],
      keywords: [
        'e-commerce evolution',
        'digital commerce',
        'online business trends',
        'e-commerce platforms',
        'web design',
      ],
      author: 'Digital Strategy Team',
      authorEmail: 'strategy@company.com',
      publishedAt: new Date(),
      status: 'published',
      seoTitle:
        'E-commerce Evolution: From Storefronts to Digital Experiences | 2024 Guide',
      seoDescription:
        'Discover how e-commerce has transformed from simple online stores to sophisticated digital ecosystems. Learn about modern platforms, trends, and strategies.',
      focusKeyword: 'e-commerce evolution',
      format: 'markdown',
      wordCount: 850,
      images: [
        {
          id: 'hero-ecommerce',
          filename: 'ecommerce-evolution-hero.jpg',
          url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d',
          mimeType: 'image/jpeg',
          size: 284731,
          dimensions: { width: 1200, height: 800 },
          altText:
            'Modern e-commerce interface showing multiple devices and shopping experience',
          caption:
            'E-commerce has evolved into sophisticated digital experiences',
        },
      ],
    };

    // 3. Configure platform-specific options
    const publishOptions: MultiPlatformPublishOptions = {
      adaptContentPerPlatform: true,
      publishOrder: ['webflow', 'wordpress', 'shopify', 'medium', 'linkedin'],
      stopOnFirstFailure: false,
      requireAllSuccess: false,

      platformSpecificOptions: {
        wordpress: {
          status: 'published',
          categories: ['Technology', 'E-commerce'],
          tags: ['web-design', 'online-business'],
          featuredImage: blogPost.images?.[0],
        },

        medium: {
          status: 'published',
          tags: ['technology', 'business', 'startup'],
        },

        linkedin: {
          status: 'published',
          tags: ['professional-development', 'business-strategy'],
        },

        shopify: {
          status: 'published',
          tags: ['ecommerce', 'business-tips', 'online-store'],
        },

        webflow: {
          status: 'published',
          customFields: {
            featured: true,
            category: 'business-strategy',
            'reading-time': '8 min',
          },
        },
      },
    };

    // 4. Publish across all platforms
    console.log('\n2. Publishing across all platforms...');
    const publishResult = await multiPublisher.publishToAll(
      blogPost,
      ['wordpress', 'medium', 'linkedin', 'shopify', 'webflow'],
      publishOptions,
    );

    console.log('\n✅ Multi-platform publishing completed!');
    console.log(
      'Success rate:',
      `${publishResult.successCount}/${publishResult.successCount + publishResult.failureCount}`,
    );
    console.log('Total duration:', publishResult.totalDuration, 'seconds');

    // Display individual platform results
    Object.entries(publishResult.results).forEach(([platform, result]) => {
      if (result.success) {
        console.log(`✅ ${platform}: Published successfully`);
        console.log(`   URL: ${result.externalUrl}`);
      } else {
        console.log(`❌ ${platform}: Failed - ${result.error}`);
      }
    });

    // 5. Check platform health
    console.log('\n3. Checking platform health...');
    const healthReport = await multiPublisher.checkPlatformHealth();
    console.log('Overall health status:', healthReport.overall);

    Object.entries(healthReport.platforms).forEach(([platform, health]) => {
      console.log(`${platform}: ${health.status} (${health.responseTime}ms)`);
    });

    // 6. Get aggregated analytics
    console.log('\n4. Fetching aggregated analytics...');
    const analytics = await multiPublisher.getAggregatedAnalytics(
      ['wordpress', 'medium', 'linkedin', 'shopify', 'webflow'],
      {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      },
    );

    console.log('📊 Analytics Summary:');
    console.log('- Total views:', analytics.totalViews);
    console.log('- Total engagements:', analytics.totalEngagements);
    console.log('- Total shares:', analytics.totalShares);
    console.log(
      '- Average engagement rate:',
      `${(analytics.avgEngagementRate * 100).toFixed(2)}%`,
    );
    console.log('- Top performing platform:', analytics.topPerformingPlatform);

    // Display platform breakdown
    console.log('\n📈 Platform Breakdown:');
    Object.entries(analytics.platformBreakdown).forEach(([platform, data]) => {
      console.log(`${platform}:`);
      console.log(`  - Views: ${data.pageViews}`);
      console.log(`  - Engagements: ${data.totalEngagements}`);
      console.log(
        `  - Engagement rate: ${(data.engagementRate * 100).toFixed(2)}%`,
      );
    });

    // Show recommendations
    if (analytics.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      analytics.recommendations.slice(0, 3).forEach(rec => {
        console.log(
          `${rec.platform}: ${rec.recommendation} (Priority: ${rec.priority})`,
        );
      });
    }

    // 7. Comparative analytics
    console.log('\n5. Running comparative analysis...');
    const comparative = await multiPublisher.getComparativeAnalytics(
      ['wordpress', 'shopify', 'webflow'],
      {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      },
    );

    console.log('🔄 Platform Comparisons:');
    comparative.comparisons.forEach(comp => {
      const winner = comp.platforms[comp.winner];
      console.log(
        `${comp.metric}: ${comp.winner} leads with ${winner} (${comp.difference}% difference)`,
      );
    });
  } catch (error) {
    console.error('❌ Multi-platform publishing error:', error.message);
  }
}

/**
 * Platform Factory Pattern Example
 */
async function platformFactoryExample() {
  console.log('\n=== Platform Factory Pattern Example ===');

  // Get all available platforms
  const availablePlatforms = getAllPlatforms();
  console.log('\nAvailable platforms:');
  availablePlatforms.forEach(platform => {
    console.log(`- ${platform.name}: ${platform.description}`);
    console.log(`  Supports scheduling: ${platform.supportsScheduling}`);
    console.log(`  Supports analytics: ${platform.supportsAnalytics}`);
    console.log(`  Auth methods: ${platform.requiresAuth.join(', ')}`);
  });

  // Create adapters using the factory
  const adapters = PlatformAdapterFactory.createMultiple([
    {
      name: 'shopify',
      config: {
        storeUrl: 'demo-store.myshopify.com',
        apiVersion: '2024-01',
      },
    },
    {
      name: 'webflow',
      config: {
        siteId: 'demo-site-id',
        apiVersion: 'v1',
      },
    },
    {
      name: 'wordpress',
      config: {
        siteUrl: 'https://demo-blog.com',
        isWordPressCom: false,
      },
    },
  ]);

  console.log('\n✅ Created adapters using factory:');
  Object.keys(adapters).forEach(platform => {
    console.log(`- ${platform}: ${adapters[platform].displayName}`);
  });

  // Display capabilities comparison
  console.log('\n📋 Capabilities Comparison:');
  const capabilities = [
    'supportsScheduling',
    'supportsAnalytics',
    'supportsImages',
    'supportsTags',
  ];

  console.log(
    'Platform'.padEnd(15) + capabilities.join(''.padEnd(5)).padEnd(60),
  );
  console.log('-'.repeat(75));

  Object.entries(adapters).forEach(([name, adapter]) => {
    const caps = capabilities
      .map(cap => (adapter.capabilities[cap] ? '✅' : '❌'))
      .join('    ');
    console.log(name.padEnd(15) + caps);
  });
}

/**
 * Run all comprehensive examples
 */
async function runAllExamples() {
  console.log('🌟 Comprehensive Multi-Platform Integration Examples\n');

  await comprehensiveMultiPlatformExample();
  await platformFactoryExample();

  console.log('\n✨ All comprehensive examples completed!');
  console.log('\n📝 Summary:');
  console.log('- Demonstrated all 5 platform adapters working together');
  console.log('- Showed platform-specific optimization');
  console.log('- Implemented health monitoring and analytics');
  console.log('- Used factory pattern for adapter creation');
  console.log('- Provided comparative analysis across platforms');
}

// Export for use in other files
export {
  comprehensiveMultiPlatformExample,
  platformFactoryExample,
  runAllExamples,
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
